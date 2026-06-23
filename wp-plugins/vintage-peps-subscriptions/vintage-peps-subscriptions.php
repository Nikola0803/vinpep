<?php
/**
 * Plugin Name: Vintage Peps – Subscribe & Save
 * Description: Subscription management engine: per-product interval selector, configurable discount tiers, daily renewal cron, renewal emails with pre-filled checkout deep links.
 * Version:     1.0.0
 * Author:      Vintage Peptides
 * Requires at least: 6.0
 * Requires PHP: 8.0
 */

defined( 'ABSPATH' ) || exit;

define( 'VPS_VERSION', '1.0.0' );
define( 'VPS_TABLE',   'vp_subscriptions' );

// ── Activation / Deactivation ────────────────────────────────────────────────

register_activation_hook( __FILE__, 'vps_activate' );
function vps_activate() {
    vps_create_table();
    // Generate a signing secret for renewal tokens
    if ( ! get_option( 'vps_token_secret' ) ) {
        update_option( 'vps_token_secret', wp_generate_password( 64, true, true ), false );
    }
    // Default discount tiers
    if ( ! get_option( 'vps_discount_tiers' ) ) {
        update_option( 'vps_discount_tiers', [ '30' => 10, '60' => 12, '90' => 15, '180' => 20 ] );
    }
    // Schedule daily renewal cron
    if ( ! wp_next_scheduled( 'vps_daily_renewals' ) ) {
        wp_schedule_event( strtotime( 'tomorrow 06:00:00' ), 'daily', 'vps_daily_renewals' );
    }
}

register_deactivation_hook( __FILE__, 'vps_deactivate' );
function vps_deactivate() {
    wp_clear_scheduled_hook( 'vps_daily_renewals' );
}

// ── Database ─────────────────────────────────────────────────────────────────

function vps_create_table() {
    global $wpdb;
    $table   = $wpdb->prefix . VPS_TABLE;
    $charset = $wpdb->get_charset_collate();
    $sql     = "CREATE TABLE IF NOT EXISTS {$table} (
        id                bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        status            varchar(20)         NOT NULL DEFAULT 'active',
        customer_email    varchar(200)        NOT NULL,
        customer_name     varchar(200)        NOT NULL DEFAULT '',
        customer_phone    varchar(50)         NOT NULL DEFAULT '',
        items             longtext            NOT NULL,
        interval_days     int                 NOT NULL DEFAULT 30,
        discount_pct      decimal(5,2)        NOT NULL DEFAULT 0.00,
        subtotal          decimal(10,2)       NOT NULL DEFAULT 0.00,
        next_renewal      date                NOT NULL,
        last_renewal      date                         DEFAULT NULL,
        renewal_count     int                 NOT NULL DEFAULT 0,
        source_order_id   bigint(20) unsigned          DEFAULT NULL,
        shipping_address  longtext                     DEFAULT NULL,
        created_at        datetime            NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY customer_email (customer_email),
        KEY status (status),
        KEY next_renewal (next_renewal)
    ) {$charset};";
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql );
}

function vps_table() {
    global $wpdb;
    return $wpdb->prefix . VPS_TABLE;
}

// ── WooCommerce order hook ────────────────────────────────────────────────────
// Fires when a WC order is created via REST API (our Vercel serverless function).

add_action( 'woocommerce_rest_insert_order_object', 'vps_maybe_create_subscription', 10, 3 );
function vps_maybe_create_subscription( $order, $request, $creating ) {
    if ( ! $creating ) return;
    $interval = (int) $order->get_meta( 'subscription_interval' );
    if ( $interval <= 0 ) return; // not a subscription order

    global $wpdb;
    $discount_pct = (float) $order->get_meta( 'subscription_discount_pct' );

    // Build items array from WC line items
    $items = [];
    foreach ( $order->get_items() as $line ) {
        $items[] = [
            'sku'              => $line->get_meta( 'peptide_code' ) ?: '',
            'name'             => $line->get_name(),
            'quantity'         => $line->get_quantity(),
            'unit_price'       => (float) ( $line->get_total() / $line->get_quantity() ),
            'discounted_price' => (float) ( $line->get_total() / $line->get_quantity() ),
        ];
    }

    $subtotal = (float) $order->get_subtotal();
    $next_renewal = gmdate( 'Y-m-d', strtotime( "+{$interval} days" ) );

    $billing = $order->get_address( 'billing' );
    $shipping_address = wp_json_encode( $order->get_address( 'shipping' ) );

    $wpdb->insert( vps_table(), [
        'status'           => 'active',
        'customer_email'   => $order->get_billing_email(),
        'customer_name'    => trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() ),
        'customer_phone'   => $order->get_billing_phone(),
        'items'            => wp_json_encode( $items ),
        'interval_days'    => $interval,
        'discount_pct'     => $discount_pct,
        'subtotal'         => $subtotal,
        'next_renewal'     => $next_renewal,
        'source_order_id'  => $order->get_id(),
        'shipping_address' => $shipping_address,
    ], [ '%s','%s','%s','%s','%s','%d','%f','%f','%s','%d','%s' ] );
}

// ── Cron: daily renewal processor ────────────────────────────────────────────

add_action( 'vps_daily_renewals', 'vps_process_renewals' );
function vps_process_renewals() {
    global $wpdb;
    $today = gmdate( 'Y-m-d' );

    $subs = $wpdb->get_results( $wpdb->prepare(
        "SELECT * FROM " . vps_table() . " WHERE status = 'active' AND next_renewal <= %s LIMIT 100",
        $today
    ) );

    foreach ( $subs as $sub ) {
        $wc_order_id = vps_create_renewal_order( $sub );
        if ( $wc_order_id ) {
            vps_send_renewal_email( $sub, $wc_order_id );
            $next = gmdate( 'Y-m-d', strtotime( "+{$sub->interval_days} days", strtotime( $sub->next_renewal ) ) );
            $wpdb->update( vps_table(), [
                'last_renewal'  => $today,
                'next_renewal'  => $next,
                'renewal_count' => (int) $sub->renewal_count + 1,
            ], [ 'id' => $sub->id ], [ '%s', '%s', '%d' ], [ '%d' ] );
        }
    }
}

function vps_create_renewal_order( $sub ) {
    $items = json_decode( $sub->items, true );
    if ( empty( $items ) ) return null;

    $order = wc_create_order( [
        'status'        => 'pending',
        'customer_note' => "Subscribe & Save renewal — every {$sub->interval_days} days",
    ] );

    $billing_parts = explode( ' ', $sub->customer_name, 2 );
    $order->set_billing_first_name( $billing_parts[0] ?? '' );
    $order->set_billing_last_name( $billing_parts[1] ?? '' );
    $order->set_billing_email( $sub->customer_email );
    $order->set_billing_phone( $sub->customer_phone );
    $order->set_payment_method( 'subscribe_save_renewal' );
    $order->set_payment_method_title( 'Subscribe & Save Renewal' );

    if ( $sub->shipping_address ) {
        $addr = json_decode( $sub->shipping_address, true );
        if ( $addr ) {
            foreach ( $addr as $key => $val ) {
                $method = "set_shipping_{$key}";
                if ( method_exists( $order, $method ) ) $order->$method( $val );
            }
        }
    }

    foreach ( $items as $item ) {
        $product_id = 0;
        if ( ! empty( $item['sku'] ) ) {
            $product_id = wc_get_product_id_by_sku( $item['sku'] ) ?: 0;
        }
        $li = new WC_Order_Item_Product();
        if ( $product_id ) $li->set_product_id( $product_id );
        $li->set_name( $item['name'] );
        $li->set_quantity( (int) $item['quantity'] );
        $li->set_subtotal( $item['discounted_price'] * $item['quantity'] );
        $li->set_total( $item['discounted_price'] * $item['quantity'] );
        if ( ! empty( $item['sku'] ) ) {
            $li->add_meta_data( 'peptide_code', $item['sku'], true );
        }
        $order->add_item( $li );
    }

    $order->add_meta_data( 'subscription_id',       $sub->id,             true );
    $order->add_meta_data( 'subscription_interval', $sub->interval_days,  true );
    $order->add_meta_data( 'is_renewal',            '1',                  true );
    $order->calculate_totals();
    $order->save();

    return $order->get_id();
}

// ── Renewal token helpers ─────────────────────────────────────────────────────

function vps_generate_renewal_token( $sub_id ) {
    $secret  = get_option( 'vps_token_secret', '' );
    $expires = gmdate( 'Y-m-d', strtotime( '+7 days' ) );
    $token   = hash_hmac( 'sha256', "{$sub_id}|{$expires}", $secret );
    return [ 'token' => $token, 'exp' => $expires ];
}

function vps_verify_renewal_token( $sub_id, $token, $exp ) {
    if ( gmdate( 'Y-m-d' ) > $exp ) return false;
    $secret   = get_option( 'vps_token_secret', '' );
    $expected = hash_hmac( 'sha256', "{$sub_id}|{$exp}", $secret );
    return hash_equals( $expected, $token );
}

// ── Renewal email ─────────────────────────────────────────────────────────────

function vps_send_renewal_email( $sub, $wc_order_id ) {
    $t          = vps_generate_renewal_token( $sub->id );
    $front_url  = get_option( 'vp_products_frontend_url', 'https://vintagepeptides.com' );
    $renew_url  = add_query_arg( [
        'sub'   => $sub->id,
        'token' => $t['token'],
        'exp'   => $t['exp'],
    ], trailingslashit( $front_url ) . 'renew' );

    $items   = json_decode( $sub->items, true );
    $name    = $sub->customer_name ?: 'Researcher';
    $total   = number_format( array_sum( array_map( fn($i) => $i['discounted_price'] * $i['quantity'], $items ) ), 2 );
    $subject = "Your Vintage Peptides subscription renewal is ready — Order #{$wc_order_id}";

    $items_html = '';
    foreach ( $items as $item ) {
        $line = number_format( $item['discounted_price'] * $item['quantity'], 2 );
        $items_html .= "<tr>
            <td style='padding:8px 12px;border-bottom:1px solid #d4b86a33;font-family:monospace;font-size:12px;color:#4a3728;'>{$item['name']}</td>
            <td style='padding:8px 12px;border-bottom:1px solid #d4b86a33;font-family:monospace;font-size:12px;color:#4a3728;text-align:center;'>{$item['quantity']}</td>
            <td style='padding:8px 12px;border-bottom:1px solid #d4b86a33;font-family:monospace;font-size:12px;color:#4a3728;text-align:right;'>\${$line}</td>
        </tr>";
    }

    $body = "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body style='margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif;'>
<div style='max-width:600px;margin:40px auto;background:#faf8f4;border:1px solid #d4b86a40;'>
  <div style='background:#1c1410;padding:32px 40px;text-align:center;'>
    <p style='font-family:Georgia,serif;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#d4b86a;margin:0 0 8px;'>Vintage Peptides</p>
    <h1 style='font-family:Georgia,serif;font-size:20px;letter-spacing:0.15em;text-transform:uppercase;color:#faf8f4;margin:0;font-weight:normal;'>Renewal Ready</h1>
  </div>
  <div style='padding:40px;'>
    <p style='font-family:Georgia,serif;font-size:14px;color:#4a3728;line-height:1.7;'>Dear {$name},</p>
    <p style='font-family:Georgia,serif;font-size:14px;color:#4a3728;line-height:1.7;'>Your Subscribe &amp; Save renewal order <strong>#{$wc_order_id}</strong> is ready and waiting for payment. Complete your renewal by clicking the button below — your cart will be pre-filled automatically.</p>

    <table style='width:100%;border-collapse:collapse;margin:24px 0;border:1px solid #d4b86a30;'>
      <thead>
        <tr style='background:#d4b86a15;'>
          <th style='padding:10px 12px;font-family:monospace;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#1c1410;text-align:left;'>Product</th>
          <th style='padding:10px 12px;font-family:monospace;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#1c1410;text-align:center;'>Qty</th>
          <th style='padding:10px 12px;font-family:monospace;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#1c1410;text-align:right;'>Total</th>
        </tr>
      </thead>
      <tbody>{$items_html}</tbody>
      <tfoot>
        <tr>
          <td colspan='2' style='padding:10px 12px;font-family:monospace;font-size:12px;font-weight:bold;color:#1c1410;text-align:right;'>Order Total:</td>
          <td style='padding:10px 12px;font-family:monospace;font-size:14px;font-weight:bold;color:#d4b86a;text-align:right;'>\${$total}</td>
        </tr>
      </tfoot>
    </table>

    <div style='text-align:center;margin:32px 0;'>
      <a href='{$renew_url}' style='display:inline-block;background:#1c1410;color:#d4b86a;font-family:monospace;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;padding:16px 40px;text-decoration:none;border:1px solid #d4b86a40;'>Complete Renewal →</a>
    </div>

    <p style='font-family:monospace;font-size:11px;color:#7a6659;line-height:1.6;'>This link expires in 7 days. If you did not expect this email or wish to cancel your subscription, reply to this message.</p>
  </div>
  <div style='background:#1c1410;padding:16px 40px;text-align:center;'>
    <p style='font-family:monospace;font-size:10px;letter-spacing:0.15em;color:#7a6659;margin:0;'>VINTAGE PEPTIDES · RESEARCH USE ONLY · (866) 788-GLP1</p>
  </div>
</div></body></html>";

    wp_mail(
        $sub->customer_email,
        $subject,
        $body,
        [ 'Content-Type: text/html; charset=UTF-8', 'From: Vintage Peptides <orders@vintagepeptides.com>' ]
    );
}

// ── REST API ──────────────────────────────────────────────────────────────────

add_action( 'rest_api_init', 'vps_register_rest_routes' );
function vps_register_rest_routes() {
    // Public: discount tiers for the frontend
    register_rest_route( 'vps/v1', '/discount-tiers', [
        'methods'             => 'GET',
        'callback'            => fn() => rest_ensure_response( vps_get_tiers() ),
        'permission_callback' => '__return_true',
    ] );

    // Token-gated: subscription details for the /renew page
    register_rest_route( 'vps/v1', '/renewal', [
        'methods'             => 'GET',
        'callback'            => 'vps_rest_renewal_details',
        'permission_callback' => '__return_true',
        'args' => [
            'sub'   => [ 'required' => true, 'sanitize_callback' => 'absint' ],
            'token' => [ 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ],
            'exp'   => [ 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ],
        ],
    ] );

    // Admin: pause / cancel subscription
    register_rest_route( 'vps/v1', '/subscription/(?P<id>\d+)/status', [
        'methods'             => 'POST',
        'callback'            => 'vps_rest_update_status',
        'permission_callback' => fn() => current_user_can( 'edit_shop_orders' ),
        'args' => [
            'status' => [ 'required' => true, 'enum' => [ 'active', 'paused', 'cancelled' ] ],
        ],
    ] );
}

function vps_get_tiers() {
    $tiers = get_option( 'vps_discount_tiers', [ '30' => 10, '60' => 12, '90' => 15, '180' => 20 ] );
    // Return as integer keys for JS
    $out = [];
    foreach ( $tiers as $days => $pct ) {
        $out[ (int) $days ] = (float) $pct;
    }
    return $out;
}

function vps_rest_renewal_details( WP_REST_Request $request ) {
    global $wpdb;
    $sub_id = $request->get_param( 'sub' );
    $token  = $request->get_param( 'token' );
    $exp    = $request->get_param( 'exp' );

    if ( ! vps_verify_renewal_token( $sub_id, $token, $exp ) ) {
        return new WP_Error( 'vps_invalid_token', 'Invalid or expired renewal link.', [ 'status' => 403 ] );
    }

    $sub = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM " . vps_table() . " WHERE id = %d", $sub_id ) );
    if ( ! $sub ) {
        return new WP_Error( 'vps_not_found', 'Subscription not found.', [ 'status' => 404 ] );
    }

    // Find the WC pending renewal order
    $renewal_orders = wc_get_orders( [
        'limit'      => 1,
        'orderby'    => 'date',
        'order'      => 'DESC',
        'status'     => [ 'pending' ],
        'meta_query' => [ [ 'key' => 'subscription_id', 'value' => $sub_id ] ],
    ] );
    $wc_order_id = $renewal_orders ? $renewal_orders[0]->get_id() : null;

    return rest_ensure_response( [
        'subscription_id' => (int) $sub->id,
        'status'          => $sub->status,
        'customer_name'   => $sub->customer_name,
        'customer_email'  => $sub->customer_email,
        'items'           => json_decode( $sub->items, true ),
        'interval_days'   => (int) $sub->interval_days,
        'discount_pct'    => (float) $sub->discount_pct,
        'subtotal'        => (float) $sub->subtotal,
        'next_renewal'    => $sub->next_renewal,
        'wc_order_id'     => $wc_order_id,
    ] );
}

function vps_rest_update_status( WP_REST_Request $request ) {
    global $wpdb;
    $id     = (int) $request->get_param( 'id' );
    $status = $request->get_param( 'status' );
    $updated = $wpdb->update( vps_table(), [ 'status' => $status ], [ 'id' => $id ], [ '%s' ], [ '%d' ] );
    if ( false === $updated ) {
        return new WP_Error( 'vps_update_failed', 'Could not update subscription.', [ 'status' => 500 ] );
    }
    return rest_ensure_response( [ 'ok' => true, 'id' => $id, 'status' => $status ] );
}

// ── Admin pages ───────────────────────────────────────────────────────────────

add_action( 'admin_menu', 'vps_admin_menu', 25 );
function vps_admin_menu() {
    add_menu_page(
        'Subscriptions',
        'Subscriptions',
        'edit_shop_orders',
        'vps-subscriptions',
        'vps_render_list_page',
        'dashicons-update',
        56
    );
    add_submenu_page(
        'vps-subscriptions',
        'All Subscriptions',
        'All Subscriptions',
        'edit_shop_orders',
        'vps-subscriptions',
        'vps_render_list_page'
    );
    add_submenu_page(
        'vps-subscriptions',
        'Discount Tiers',
        'Discount Tiers',
        'manage_options',
        'vps-settings',
        'vps_render_settings_page'
    );
}

// ── Settings save ─────────────────────────────────────────────────────────────

add_action( 'admin_init', 'vps_handle_settings_save' );
function vps_handle_settings_save() {
    if (
        isset( $_POST['vps_save_tiers'] ) &&
        check_admin_referer( 'vps_save_tiers' ) &&
        current_user_can( 'manage_options' )
    ) {
        $tiers = [];
        foreach ( [ '30', '60', '90', '180' ] as $days ) {
            $tiers[ $days ] = max( 0, min( 50, (float) ( $_POST["tier_{$days}"] ?? 0 ) ) );
        }
        update_option( 'vps_discount_tiers', $tiers );
        wp_redirect( add_query_arg( 'saved', '1', admin_url( 'admin.php?page=vps-settings' ) ) );
        exit;
    }
}

// ── Admin: render subscriptions list ─────────────────────────────────────────

function vps_render_list_page() {
    global $wpdb;

    // Handle inline status updates
    if ( isset( $_GET['vps_action'], $_GET['vps_id'], $_GET['_wpnonce'] ) ) {
        $action = sanitize_key( $_GET['vps_action'] );
        $sub_id = absint( $_GET['vps_id'] );
        if ( wp_verify_nonce( $_GET['_wpnonce'], "vps_{$action}_{$sub_id}" ) ) {
            $new_status = match( $action ) {
                'pause'    => 'paused',
                'resume'   => 'active',
                'cancel'   => 'cancelled',
                default    => null,
            };
            if ( $new_status ) {
                $wpdb->update( vps_table(), [ 'status' => $new_status ], [ 'id' => $sub_id ], [ '%s' ], [ '%d' ] );
            }
        }
        wp_redirect( admin_url( 'admin.php?page=vps-subscriptions' ) );
        exit;
    }

    $filter = isset( $_GET['status'] ) ? sanitize_key( $_GET['status'] ) : '';
    $where  = $filter ? $wpdb->prepare( "WHERE status = %s", $filter ) : '';
    $subs   = $wpdb->get_results( "SELECT * FROM " . vps_table() . " {$where} ORDER BY next_renewal ASC LIMIT 200" );

    $status_badge = fn( $s ) => match( $s ) {
        'active'    => '<span style="background:#16a34a;color:#fff;padding:2px 8px;border-radius:3px;font-size:11px;">Active</span>',
        'paused'    => '<span style="background:#d97706;color:#fff;padding:2px 8px;border-radius:3px;font-size:11px;">Paused</span>',
        'cancelled' => '<span style="background:#dc2626;color:#fff;padding:2px 8px;border-radius:3px;font-size:11px;">Cancelled</span>',
        default     => esc_html( $s ),
    };

    ?>
    <div class="wrap">
        <h1 class="wp-heading-inline">↻ Subscribe & Save</h1>
        <span style="background:#1c1410;color:#d4b86a;border-radius:11px;padding:2px 8px;font-size:12px;margin-left:8px;"><?php echo count( $subs ); ?></span>
        <hr class="wp-header-end">

        <ul class="subsubsub" style="margin-bottom:12px;">
            <?php foreach ( [ '' => 'All', 'active' => 'Active', 'paused' => 'Paused', 'cancelled' => 'Cancelled' ] as $s => $label ) : ?>
                <li><a href="<?php echo esc_url( admin_url( 'admin.php?page=vps-subscriptions' . ( $s ? "&status={$s}" : '' ) ) ); ?>"
                       class="<?php echo $filter === $s ? 'current' : ''; ?>"><?php echo esc_html( $label ); ?></a> |</li>
            <?php endforeach; ?>
        </ul>

        <?php if ( empty( $subs ) ) : ?>
            <p style="color:#666;">No subscriptions found.</p>
        <?php else : ?>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th width="50">ID</th>
                    <th width="180">Customer</th>
                    <th width="90">Interval</th>
                    <th width="70">Discount</th>
                    <th width="80">Subtotal</th>
                    <th width="100">Next Renewal</th>
                    <th width="70">Renewals</th>
                    <th width="80">Status</th>
                    <th>Items</th>
                    <th width="160">Actions</th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ( $subs as $sub ) :
                $items = json_decode( $sub->items, true );
                $items_str = implode( ', ', array_map( fn($i) => $i['name'] . ' ×' . $i['quantity'], $items ) );
                $today = gmdate( 'Y-m-d' );
                $due   = $sub->next_renewal <= $today && $sub->status === 'active';
            ?>
            <tr<?php echo $due ? ' style="background:#fefce8;"' : ''; ?>>
                <td><?php echo esc_html( $sub->id ); ?></td>
                <td>
                    <strong><?php echo esc_html( $sub->customer_name ); ?></strong><br>
                    <small><?php echo esc_html( $sub->customer_email ); ?></small>
                </td>
                <td><?php echo esc_html( $sub->interval_days ); ?> days</td>
                <td><?php echo esc_html( $sub->discount_pct ); ?>%</td>
                <td>$<?php echo esc_html( number_format( $sub->subtotal, 2 ) ); ?></td>
                <td<?php echo $due ? ' style="color:#b45309;font-weight:bold;"' : ''; ?>>
                    <?php echo esc_html( $sub->next_renewal ); ?>
                    <?php echo $due ? ' ⚡' : ''; ?>
                </td>
                <td style="text-align:center;"><?php echo esc_html( $sub->renewal_count ); ?></td>
                <td><?php echo $status_badge( $sub->status ); ?></td>
                <td style="font-size:11px;"><?php echo esc_html( $items_str ); ?></td>
                <td>
                    <?php if ( $sub->status === 'active' ) : ?>
                        <a href="<?php echo esc_url( wp_nonce_url( admin_url( "admin.php?page=vps-subscriptions&vps_action=pause&vps_id={$sub->id}" ), "vps_pause_{$sub->id}" ) ); ?>"
                           class="button button-small">Pause</a>
                        <a href="<?php echo esc_url( wp_nonce_url( admin_url( "admin.php?page=vps-subscriptions&vps_action=cancel&vps_id={$sub->id}" ), "vps_cancel_{$sub->id}" ) ); ?>"
                           class="button button-small" style="color:#dc2626;"
                           onclick="return confirm('Cancel subscription #<?php echo esc_js( $sub->id ); ?>?')">Cancel</a>
                    <?php elseif ( $sub->status === 'paused' ) : ?>
                        <a href="<?php echo esc_url( wp_nonce_url( admin_url( "admin.php?page=vps-subscriptions&vps_action=resume&vps_id={$sub->id}" ), "vps_resume_{$sub->id}" ) ); ?>"
                           class="button button-small button-primary">Resume</a>
                    <?php endif; ?>
                </td>
            </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
        <?php endif; ?>
    </div>
    <?php
}

// ── Admin: discount tier settings ─────────────────────────────────────────────

function vps_render_settings_page() {
    $tiers = get_option( 'vps_discount_tiers', [ '30' => 10, '60' => 12, '90' => 15, '180' => 20 ] );
    $labels = [ '30' => 'Every 30 days (Monthly)', '60' => 'Every 60 days (Bi-monthly)', '90' => 'Every 90 days (Quarterly)', '180' => 'Every 180 days (Semi-annual)' ];
    ?>
    <div class="wrap">
        <h1>Subscribe & Save — Discount Tiers</h1>
        <?php if ( isset( $_GET['saved'] ) ) : ?>
            <div class="notice notice-success is-dismissible"><p>✅ Discount tiers saved.</p></div>
        <?php endif; ?>

        <p style="color:#555;max-width:600px;">Set the discount percentage customers receive for each subscription interval. Changes apply immediately to new subscriptions and are exposed via <code>/wp-json/vps/v1/discount-tiers</code> so the storefront always reflects the current rates.</p>

        <form method="post">
            <?php wp_nonce_field( 'vps_save_tiers' ); ?>
            <input type="hidden" name="vps_save_tiers" value="1">
            <table class="form-table" style="max-width:500px;">
                <tbody>
                <?php foreach ( $labels as $days => $label ) : ?>
                    <tr>
                        <th scope="row"><?php echo esc_html( $label ); ?></th>
                        <td>
                            <input type="number" name="tier_<?php echo esc_attr( $days ); ?>"
                                   value="<?php echo esc_attr( $tiers[ $days ] ?? 0 ); ?>"
                                   min="0" max="50" step="0.5"
                                   style="width:80px;" /> %
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
            <p class="submit">
                <input type="submit" class="button button-primary" value="Save Discount Tiers">
            </p>
        </form>
    </div>
    <?php
}
