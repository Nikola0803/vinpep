<?php
/**
 * Plugin Name: Vintage Peps Subscriptions
 * Plugin URI:  https://vintagepeptides.com
 * Description: Lightweight subscription management for Vintage Peptides recurring peptide orders.
 * Version:     1.0.0
 * Author:      Vintage Peptides
 * Text Domain: vintage-peps-subscriptions
 * Requires WP: 6.0
 * Requires PHP: 8.0
 */

defined( 'ABSPATH' ) || exit;

define( 'VPSUB_VERSION', '1.0.0' );
define( 'VPSUB_TABLE',   'vp_subscriptions' );

// ── Activation ────────────────────────────────────────────────────────────────

register_activation_hook( __FILE__, 'vpsub_activate' );
function vpsub_activate(): void {
    global $wpdb;
    $table   = $wpdb->prefix . VPSUB_TABLE;
    $charset = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS {$table} (
        id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id         BIGINT UNSIGNED NOT NULL,
        email           VARCHAR(255)    NOT NULL,
        product_id      BIGINT UNSIGNED NOT NULL,
        product_name    VARCHAR(255)    NOT NULL DEFAULT '',
        interval_weeks  TINYINT UNSIGNED NOT NULL DEFAULT 4,
        discount_pct    TINYINT UNSIGNED NOT NULL DEFAULT 10,
        status          VARCHAR(20)     NOT NULL DEFAULT 'active',
        last_order_id   BIGINT UNSIGNED          DEFAULT NULL,
        next_renewal    DATE                     DEFAULT NULL,
        created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY user_id (user_id),
        KEY status (status)
    ) {$charset};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql );
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

add_action( 'plugins_loaded', function () {
    add_action( 'rest_api_init',         'vpsub_register_routes' );
    add_action( 'woocommerce_new_order', 'vpsub_capture_subscription', 20, 2 );
    add_action( 'admin_menu',            'vpsub_admin_menu' );
} );

// ── REST Routes ───────────────────────────────────────────────────────────────

function vpsub_register_routes(): void {
    // GET /wp-json/vp-subs/v1/subscriptions?user_id=123
    register_rest_route( 'vp-subs/v1', '/subscriptions', [
        'methods'             => 'GET',
        'callback'            => 'vpsub_get_subscriptions',
        'permission_callback' => '__return_true',
    ] );

    // POST /wp-json/vp-subs/v1/cancel
    register_rest_route( 'vp-subs/v1', '/cancel', [
        'methods'             => 'POST',
        'callback'            => 'vpsub_cancel',
        'permission_callback' => '__return_true',
    ] );

    // POST /wp-json/vp-subs/v1/renew (manual renewal trigger)
    register_rest_route( 'vp-subs/v1', '/renew', [
        'methods'             => 'POST',
        'callback'            => 'vpsub_renew',
        'permission_callback' => fn() => current_user_can( 'manage_options' ),
    ] );

    // GET /wp-json/vp-subs/v1/all (admin only)
    register_rest_route( 'vp-subs/v1', '/all', [
        'methods'             => 'GET',
        'callback'            => 'vpsub_get_all',
        'permission_callback' => fn() => current_user_can( 'manage_options' ),
    ] );

    // GET /wp-json/vp-subs/v1/discount-tiers (public)
    register_rest_route( 'vp-subs/v1', '/discount-tiers', [
        'methods'             => 'GET',
        'callback'            => 'vpsub_discount_tiers',
        'permission_callback' => '__return_true',
    ] );
}

function vpsub_discount_tiers(): WP_REST_Response {
    // Configurable via WP options, falls back to sensible defaults
    $tiers = get_option( 'vpsub_discount_tiers', [
        30  => 10,
        60  => 12,
        90  => 15,
        180 => 20,
    ] );
    return new WP_REST_Response( $tiers, 200 );
}

function vpsub_get_subscriptions( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $table   = $wpdb->prefix . VPSUB_TABLE;
    $user_id = (int) $req->get_param( 'user_id' );
    $email   = sanitize_email( $req->get_param( 'email' ) ?? '' );

    if ( ! $user_id && ! $email ) {
        return new WP_REST_Response( [ 'error' => 'user_id or email required.' ], 400 );
    }

    if ( $user_id ) {
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM {$table} WHERE user_id = %d ORDER BY created_at DESC",
            $user_id
        ), ARRAY_A );
    } else {
        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM {$table} WHERE email = %s ORDER BY created_at DESC",
            $email
        ), ARRAY_A );
    }

    return new WP_REST_Response( $rows ?: [], 200 );
}

function vpsub_cancel( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $table = $wpdb->prefix . VPSUB_TABLE;
    $id    = (int) $req->get_param( 'id' );

    if ( ! $id ) {
        return new WP_REST_Response( [ 'error' => 'id required.' ], 400 );
    }

    $sub = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $id ), ARRAY_A );
    if ( ! $sub ) {
        return new WP_REST_Response( [ 'error' => 'Subscription not found.' ], 404 );
    }

    $wpdb->update( $table, [ 'status' => 'cancelled' ], [ 'id' => $id ] );

    return new WP_REST_Response( [ 'success' => true ], 200 );
}

function vpsub_renew( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $table = $wpdb->prefix . VPSUB_TABLE;
    $id    = (int) $req->get_param( 'id' );

    $sub = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $id ), ARRAY_A );
    if ( ! $sub || $sub['status'] !== 'active' ) {
        return new WP_REST_Response( [ 'error' => 'Active subscription not found.' ], 404 );
    }

    // Update next renewal date
    $next = date( 'Y-m-d', strtotime( "+{$sub['interval_weeks']} weeks" ) );
    $wpdb->update( $table, [ 'next_renewal' => $next ], [ 'id' => $id ] );

    // Email customer renewal reminder
    vpsub_send_renewal_email( $sub );

    return new WP_REST_Response( [ 'success' => true, 'next_renewal' => $next ], 200 );
}

function vpsub_get_all(): WP_REST_Response {
    global $wpdb;
    $table = $wpdb->prefix . VPSUB_TABLE;
    $rows  = $wpdb->get_results( "SELECT * FROM {$table} ORDER BY created_at DESC LIMIT 500", ARRAY_A );
    return new WP_REST_Response( $rows ?: [], 200 );
}

// ── Capture subscription from WooCommerce order ───────────────────────────────

function vpsub_capture_subscription( int $order_id, WC_Order $order ): void {
    // Check if this is a subscription order (set by frontend checkout)
    $is_sub = $order->get_meta( 'is_subscription' );
    if ( ! $is_sub ) return;

    $interval = (int) ( $order->get_meta( 'subscription_interval' ) ?: 4 );
    $discount  = (int) ( $order->get_meta( 'subscription_discount' ) ?: 10 );
    $user_id   = $order->get_user_id() ?: 0;
    $email     = $order->get_billing_email();

    global $wpdb;
    $table = $wpdb->prefix . VPSUB_TABLE;

    foreach ( $order->get_items() as $item ) {
        $wpdb->insert( $table, [
            'user_id'        => $user_id,
            'email'          => $email,
            'product_id'     => $item->get_product_id(),
            'product_name'   => $item->get_name(),
            'interval_weeks' => $interval,
            'discount_pct'   => $discount,
            'status'         => 'active',
            'last_order_id'  => $order_id,
            'next_renewal'   => date( 'Y-m-d', strtotime( "+{$interval} weeks" ) ),
        ] );
    }
}

// ── Renewal email ─────────────────────────────────────────────────────────────

function vpsub_send_renewal_email( array $sub ): void {
    $to      = $sub['email'];
    $subject = 'Your Vintage Peptides Subscription Renewal Reminder';
    $message = "Hello,\r\n\r\n"
        . "This is a reminder that your subscription for {$sub['product_name']} is due for renewal.\r\n\r\n"
        . "Next renewal date: {$sub['next_renewal']}\r\n"
        . "Your discount: {$sub['discount_pct']}% off\r\n\r\n"
        . "Visit your account to manage your subscription:\r\n"
        . "https://vintagepeptides.com/account\r\n\r\n"
        . "— Vintage Peptides Research Team\r\n"
        . "For Research Use Only. Not for human consumption.";

    $headers = [
        'Content-Type: text/plain; charset=UTF-8',
        'From: Vintage Peptides <orders@vintagepeptides.com>',
    ];

    wp_mail( $to, $subject, $message, $headers );
}

// ── Admin UI ──────────────────────────────────────────────────────────────────

function vpsub_admin_menu(): void {
    add_menu_page(
        'Subscribe & Save Orders',
        'Subscribe & Save',
        'manage_options',
        'vp-subscriptions',
        'vpsub_admin_page',
        'dashicons-update',
        57
    );
}

function vpsub_admin_page(): void {
    global $wpdb;
    $table = $wpdb->prefix . VPSUB_TABLE;
    $rows  = $wpdb->get_results( "SELECT * FROM {$table} ORDER BY created_at DESC", ARRAY_A );
    $count = count( $rows );
    ?>
    <div class="wrap">
        <h1>VP Subscriptions <span class="title-count theme-count"><?php echo esc_html( $count ); ?></span></h1>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>Email</th>
                    <th>Product</th>
                    <th>Interval</th>
                    <th>Discount</th>
                    <th>Status</th>
                    <th>Next Renewal</th>
                    <th>Created</th>
                </tr>
            </thead>
            <tbody>
                <?php if ( empty( $rows ) ) : ?>
                    <tr><td colspan="7">No subscriptions yet.</td></tr>
                <?php else : ?>
                    <?php foreach ( $rows as $row ) : ?>
                        <tr>
                            <td><?php echo esc_html( $row['email'] ); ?></td>
                            <td><?php echo esc_html( $row['product_name'] ); ?></td>
                            <td><?php echo esc_html( $row['interval_weeks'] ); ?> weeks</td>
                            <td><?php echo esc_html( $row['discount_pct'] ); ?>%</td>
                            <td><?php echo esc_html( $row['status'] ); ?></td>
                            <td><?php echo esc_html( $row['next_renewal'] ); ?></td>
                            <td><?php echo esc_html( $row['created_at'] ); ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
    <?php
}
