<?php
/**
 * Plugin Name: Vintage Peps ShipStation & Payments
 * Plugin URI:  https://vintagepeptides.com
 * Description: ShipStation order push, BTC/crypto payment config, and P2P order confirmation emails for Vintage Peptides.
 * Version:     1.2.0
 * Author:      Vintage Peptides
 * Text Domain: vintage-peps-shipstation
 * Requires WP: 6.0
 * Requires PHP: 8.0
 */

defined( 'ABSPATH' ) || exit;

define( 'VPSS_VERSION', '1.2.0' );

add_action( 'plugins_loaded', function () {
    add_action( 'rest_api_init',          'vpss_register_routes' );
    add_action( 'woocommerce_new_order',  'vpss_send_p2p_confirmation', 20, 2 );
    add_action( 'admin_menu',             'vpss_admin_menu' );
    add_action( 'admin_init',             'vpss_register_settings' );
} );

// ── REST Routes ───────────────────────────────────────────────────────────────

function vpss_register_routes(): void {
    // BTC config (public read for frontend)
    register_rest_route( 'vp-btc/v1', '/config', [
        'methods'             => 'GET',
        'callback'            => 'vpss_btc_config',
        'permission_callback' => '__return_true',
    ] );

    // BTC address generation (called by Vercel api/btc-address.ts)
    register_rest_route( 'vp-btc/v1', '/address', [
        'methods'             => 'POST',
        'callback'            => 'vpss_btc_address',
        'permission_callback' => '__return_true',
    ] );

    // BTC payment notification (called by Vercel api/btc-payment-notify.ts)
    register_rest_route( 'vp-btc/v1', '/notify', [
        'methods'             => 'POST',
        'callback'            => 'vpss_btc_notify',
        'permission_callback' => '__return_true',
    ] );

    // ShipStation XML endpoint (ShipStation pulls orders from here)
    register_rest_route( 'vp-shipstation/v1', '/orders', [
        'methods'             => 'GET',
        'callback'            => 'vpss_shipstation_orders',
        'permission_callback' => 'vpss_shipstation_auth',
    ] );

    // ShipStation posts shipment updates here
    register_rest_route( 'vp-shipstation/v1', '/shipnotify', [
        'methods'             => 'POST',
        'callback'            => 'vpss_shipstation_notify',
        'permission_callback' => 'vpss_shipstation_auth',
    ] );
}

// ── BTC Config endpoint ───────────────────────────────────────────────────────

function vpss_btc_config(): WP_REST_Response {
    return new WP_REST_Response( [
        'xpub'        => get_option( 'vpss_btc_xpub', '' ),
        'surcharge'   => (float) get_option( 'vpss_btc_surcharge', 5 ),
        'enabled'     => (bool) get_option( 'vpss_btc_enabled', true ),
    ], 200 );
}

// ── BTC Address endpoint ──────────────────────────────────────────────────────

function vpss_btc_address( WP_REST_Request $req ): WP_REST_Response {
    $index    = (int) $req->get_param( 'index' );
    $order_id = (int) $req->get_param( 'orderId' );
    $xpub     = get_option( 'vpss_btc_xpub', '' );

    if ( ! $xpub ) {
        return new WP_REST_Response( [ 'error' => 'BTC xpub not configured.' ], 500 );
    }

    // Increment global address index counter
    $next_index = (int) get_option( 'vpss_btc_address_index', 0 );
    update_option( 'vpss_btc_address_index', $next_index + 1 );

    // Store index on order for later verification
    if ( $order_id ) {
        update_post_meta( $order_id, 'btc_address_index', $next_index );
    }

    return new WP_REST_Response( [
        'index' => $next_index,
        'xpub'  => $xpub,
        // Address derivation is done in the Vercel function using bip84
    ], 200 );
}

// ── BTC Payment Notify endpoint ───────────────────────────────────────────────

function vpss_btc_notify( WP_REST_Request $req ): WP_REST_Response {
    $order_id  = (int) $req->get_param( 'orderId' );
    $tx_hash   = sanitize_text_field( $req->get_param( 'txHash' ) ?? '' );
    $amount    = (float) $req->get_param( 'amount' );
    $confirmed = (bool) $req->get_param( 'confirmed' );

    if ( ! $order_id ) {
        return new WP_REST_Response( [ 'error' => 'orderId required.' ], 400 );
    }

    $order = wc_get_order( $order_id );
    if ( ! $order ) {
        return new WP_REST_Response( [ 'error' => 'Order not found.' ], 404 );
    }

    update_post_meta( $order_id, 'btc_tx_hash', $tx_hash );
    update_post_meta( $order_id, 'btc_amount_received', $amount );

    $order->add_order_note( sprintf(
        'BTC payment %s — TX: %s, Amount: %.8f BTC',
        $confirmed ? 'confirmed' : 'detected (unconfirmed)',
        $tx_hash,
        $amount
    ) );

    if ( $confirmed && $order->get_status() === 'pending' ) {
        $order->update_status( 'processing', 'BTC payment confirmed automatically.' );
    }

    return new WP_REST_Response( [ 'success' => true ], 200 );
}

// ── P2P Order Confirmation Email ──────────────────────────────────────────────

function vpss_send_p2p_confirmation( int $order_id, WC_Order $order ): void {
    $method = $order->get_payment_method();

    // Only send for P2P payment methods
    $p2p_methods = [ 'cashapp', 'venmo', 'zelle', 'usdc', 'usdt', 'bitcoin', 'p2p' ];
    if ( ! in_array( strtolower( $method ), $p2p_methods, true ) ) {
        return;
    }

    $to           = $order->get_billing_email();
    $first_name   = $order->get_billing_first_name();
    $invoice_id   = $order->get_meta( 'invoice_id' ) ?: '#' . $order_id;
    $memo_code    = $order->get_meta( 'memo_code' )   ?: $invoice_id;
    $handle       = $order->get_meta( 'payment_handle' );
    $total        = $order->get_formatted_order_total();

    // Build item list
    $items_text = '';
    foreach ( $order->get_items() as $item ) {
        $items_text .= sprintf( "  • %s × %d\r\n", $item->get_name(), $item->get_quantity() );
    }

    $method_label = ucfirst( $method );

    $subject = "Order Received — Vintage Peptides ({$invoice_id})";

    $message  = "Hello {$first_name},\r\n\r\n";
    $message .= "Thank you for your order with Vintage Peptides Research. We've received your request and are awaiting payment confirmation.\r\n\r\n";
    $message .= "═══════════════════════════════\r\n";
    $message .= "ORDER SUMMARY\r\n";
    $message .= "═══════════════════════════════\r\n";
    $message .= "Invoice ID:    {$invoice_id}\r\n";
    $message .= "Total:         {$total}\r\n";
    $message .= "Payment:       {$method_label}\r\n\r\n";
    $message .= "Items:\r\n{$items_text}\r\n";

    if ( $handle ) {
        $message .= "═══════════════════════════════\r\n";
        $message .= "PAYMENT INSTRUCTIONS\r\n";
        $message .= "═══════════════════════════════\r\n";

        if ( in_array( strtolower( $method ), [ 'usdc', 'usdt' ], true ) ) {
            $message .= "Send {$total} in {$method_label} to:\r\n";
            $message .= "  Wallet: {$handle}\r\n";
            $message .= "  Network: Ethereum (ERC-20)\r\n";
            $message .= "  Memo/Note: {$memo_code}\r\n\r\n";
            $message .= "⚠️  IMPORTANT: Include memo code \"{$memo_code}\" exactly as shown.\r\n";
            $message .= "After sending, please email your transaction hash to orders@vintagepeptides.com.\r\n\r\n";
        } elseif ( strtolower( $method ) === 'bitcoin' ) {
            $message .= "Send {$total} in Bitcoin to:\r\n";
            $message .= "  Address: {$handle}\r\n";
            $message .= "  Memo/Note: {$memo_code}\r\n\r\n";
            $message .= "⚠️  Note: Bitcoin price includes a 5% network fee surcharge.\r\n\r\n";
        } else {
            $message .= "Send {$total} via {$method_label} to:\r\n";
            $message .= "  Handle: {$handle}\r\n";
            $message .= "  Memo/Note: {$memo_code}\r\n\r\n";
            $message .= "⚠️  IMPORTANT: Include memo code \"{$memo_code}\" in the note field.\r\n";
            $message .= "This is how we match your payment to your order.\r\n\r\n";
        }
    }

    $message .= "═══════════════════════════════\r\n";
    $message .= "WHAT HAPPENS NEXT\r\n";
    $message .= "═══════════════════════════════\r\n";
    $message .= "1. Send payment with memo code above\r\n";
    $message .= "2. We verify and process your order within 1 business day\r\n";
    $message .= "3. You'll receive a shipping confirmation with tracking\r\n\r\n";
    $message .= "Questions? Email us at orders@vintagepeptides.com\r\n\r\n";
    $message .= "— The Vintage Peptides Research Team\r\n";
    $message .= "https://vintagepeptides.com\r\n\r\n";
    $message .= "For Research Use Only. Not for human consumption.\r\n";

    $headers = [
        'Content-Type: text/plain; charset=UTF-8',
        'From: Vintage Peptides Orders <orders@vintagepeptides.com>',
    ];

    if ( $to ) {
        wp_mail( $to, $subject, $message, $headers );
    }

    // Also notify admin
    $admin_email = get_option( 'admin_email' );
    $admin_subject = "New P2P Order — {$invoice_id} ({$method_label}) — {$total}";
    $admin_message = "New P2P order received.\r\n\r\nOrder ID: {$order_id}\r\nInvoice: {$invoice_id}\r\nMethod: {$method_label}\r\nTotal: {$total}\r\nCustomer: {$first_name} <{$to}>\r\nMemo: {$memo_code}\r\n\r\nItems:\r\n{$items_text}\r\nView in WP Admin: " . admin_url( "post.php?post={$order_id}&action=edit" );
    wp_mail( $admin_email, $admin_subject, $admin_message, $headers );
}

// ── ShipStation Auth ──────────────────────────────────────────────────────────

function vpss_shipstation_auth(): bool {
    $user = get_option( 'vpss_ss_username', '' );
    $pass = get_option( 'vpss_ss_password', '' );

    if ( ! $user || ! $pass ) return false;

    $provided_user = $_SERVER['PHP_AUTH_USER'] ?? '';
    $provided_pass = $_SERVER['PHP_AUTH_PW']   ?? '';

    return hash_equals( $user, $provided_user ) && hash_equals( $pass, $provided_pass );
}

// ── ShipStation Orders XML ────────────────────────────────────────────────────

function vpss_shipstation_orders( WP_REST_Request $req ): WP_REST_Response {
    if ( ! function_exists( 'wc_get_orders' ) ) {
        return new WP_REST_Response( '<?xml version="1.0"?><Orders/>', 200 );
    }

    $start_date = sanitize_text_field( $req->get_param( 'start_date' ) ?? '' );
    $end_date   = sanitize_text_field( $req->get_param( 'end_date' )   ?? '' );

    $args = [
        'status' => [ 'processing', 'on-hold' ],
        'limit'  => 100,
    ];

    if ( $start_date ) $args['date_created'] = '>=' . $start_date;

    $orders = wc_get_orders( $args );

    $xml  = '<?xml version="1.0" encoding="utf-8"?>' . "\n";
    $xml .= '<Orders>' . "\n";

    foreach ( $orders as $order ) {
        $id         = $order->get_id();
        $invoice_id = esc_xml( $order->get_meta( 'invoice_id' ) ?: "VP-{$id}" );
        $first      = esc_xml( $order->get_billing_first_name() );
        $last       = esc_xml( $order->get_billing_last_name() );
        $email      = esc_xml( $order->get_billing_email() );
        $addr1      = esc_xml( $order->get_shipping_address_1() ?: $order->get_billing_address_1() );
        $addr2      = esc_xml( $order->get_shipping_address_2() ?: $order->get_billing_address_2() );
        $city       = esc_xml( $order->get_shipping_city() ?: $order->get_billing_city() );
        $state      = esc_xml( $order->get_shipping_state() ?: $order->get_billing_state() );
        $zip        = esc_xml( $order->get_shipping_postcode() ?: $order->get_billing_postcode() );
        $country    = esc_xml( $order->get_shipping_country() ?: $order->get_billing_country() );
        $total      = $order->get_total();
        $date       = $order->get_date_created()->format( 'n/j/Y H:i' );

        $xml .= "  <Order>\n";
        $xml .= "    <OrderID>{$id}</OrderID>\n";
        $xml .= "    <OrderNumber>{$invoice_id}</OrderNumber>\n";
        $xml .= "    <OrderDate>{$date}</OrderDate>\n";
        $xml .= "    <OrderStatus>paid</OrderStatus>\n";
        $xml .= "    <OrderTotal>{$total}</OrderTotal>\n";
        $xml .= "    <TaxAmount>0</TaxAmount>\n";
        $xml .= "    <ShippingAmount>0</ShippingAmount>\n";
        $xml .= "    <Customer>\n";
        $xml .= "      <CustomerCode>{$email}</CustomerCode>\n";
        $xml .= "      <BillTo>\n";
        $xml .= "        <Name>{$first} {$last}</Name>\n";
        $xml .= "        <Email>{$email}</Email>\n";
        $xml .= "      </BillTo>\n";
        $xml .= "      <ShipTo>\n";
        $xml .= "        <Name>{$first} {$last}</Name>\n";
        $xml .= "        <Address1>{$addr1}</Address1>\n";
        $xml .= "        <Address2>{$addr2}</Address2>\n";
        $xml .= "        <City>{$city}</City>\n";
        $xml .= "        <State>{$state}</State>\n";
        $xml .= "        <PostalCode>{$zip}</PostalCode>\n";
        $xml .= "        <Country>{$country}</Country>\n";
        $xml .= "      </ShipTo>\n";
        $xml .= "    </Customer>\n";
        $xml .= "    <Items>\n";

        foreach ( $order->get_items() as $item ) {
            $sku  = esc_xml( wc_get_product( $item->get_product_id() )?->get_sku() ?: "VP-{$item->get_product_id()}" );
            $name = esc_xml( $item->get_name() );
            $qty  = $item->get_quantity();
            $price = round( $item->get_total() / $qty, 2 );
            $xml .= "      <Item>\n";
            $xml .= "        <SKU>{$sku}</SKU>\n";
            $xml .= "        <Name>{$name}</Name>\n";
            $xml .= "        <Quantity>{$qty}</Quantity>\n";
            $xml .= "        <UnitPrice>{$price}</UnitPrice>\n";
            $xml .= "      </Item>\n";
        }

        $xml .= "    </Items>\n";
        $xml .= "  </Order>\n";
    }

    $xml .= '</Orders>';

    return new WP_REST_Response( $xml, 200, [ 'Content-Type' => 'text/xml; charset=utf-8' ] );
}

// ── ShipStation Shipment Notify ───────────────────────────────────────────────

function vpss_shipstation_notify( WP_REST_Request $req ): WP_REST_Response {
    $order_id       = (int) $req->get_param( 'order_id' );
    $tracking_number = sanitize_text_field( $req->get_param( 'tracking_number' ) ?? '' );
    $carrier         = sanitize_text_field( $req->get_param( 'carrier' ) ?? '' );

    if ( ! $order_id || ! $tracking_number ) {
        return new WP_REST_Response( [ 'error' => 'order_id and tracking_number required.' ], 400 );
    }

    $order = wc_get_order( $order_id );
    if ( ! $order ) {
        return new WP_REST_Response( [ 'error' => 'Order not found.' ], 404 );
    }

    update_post_meta( $order_id, '_tracking_number', $tracking_number );
    update_post_meta( $order_id, '_tracking_carrier', $carrier );

    $order->update_status( 'completed', "Shipped via {$carrier}. Tracking: {$tracking_number}" );

    // Send tracking email to customer
    $to         = $order->get_billing_email();
    $first_name = $order->get_billing_first_name();
    $invoice_id = $order->get_meta( 'invoice_id' ) ?: '#' . $order_id;
    $subject    = "Your Order Has Shipped — Vintage Peptides ({$invoice_id})";

    $message  = "Hello {$first_name},\r\n\r\n";
    $message .= "Great news — your Vintage Peptides order has shipped!\r\n\r\n";
    $message .= "Invoice ID:      {$invoice_id}\r\n";
    $message .= "Carrier:         {$carrier}\r\n";
    $message .= "Tracking Number: {$tracking_number}\r\n\r\n";
    $message .= "Track your package at https://www.google.com/search?q={$tracking_number}\r\n\r\n";
    $message .= "Questions? Email orders@vintagepeptides.com\r\n\r\n";
    $message .= "— Vintage Peptides Research Team\r\n";
    $message .= "For Research Use Only. Not for human consumption.";

    $headers = [
        'Content-Type: text/plain; charset=UTF-8',
        'From: Vintage Peptides Orders <orders@vintagepeptides.com>',
    ];

    if ( $to ) {
        wp_mail( $to, $subject, $message, $headers );
    }

    return new WP_REST_Response( [ 'success' => true ], 200 );
}

// ── Admin Settings ────────────────────────────────────────────────────────────

function vpss_admin_menu(): void {
    add_options_page(
        'VP ShipStation & Payments',
        'VP Payments',
        'manage_options',
        'vp-shipstation',
        'vpss_settings_page'
    );
}

function vpss_register_settings(): void {
    $fields = [
        'vpss_ss_username'        => 'ShipStation Username',
        'vpss_ss_password'        => 'ShipStation Password',
        'vpss_btc_xpub'           => 'BTC xPub Key',
        'vpss_btc_surcharge'      => 'BTC Surcharge %',
        'vpss_btc_enabled'        => 'BTC Enabled',
        'vpss_cashapp_handle'     => 'Cash App Handle',
        'vpss_venmo_handle'       => 'Venmo Handle',
        'vpss_usdc_address'       => 'USDC Wallet Address',
        'vpss_usdt_address'       => 'USDT Wallet Address',
    ];

    foreach ( array_keys( $fields ) as $key ) {
        register_setting( 'vpss_settings', $key, [ 'sanitize_callback' => 'sanitize_text_field' ] );
    }
}

function vpss_settings_page(): void {
    ?>
    <div class="wrap">
        <h1>VP ShipStation & Payments Settings</h1>
        <form method="post" action="options.php">
            <?php
            settings_fields( 'vpss_settings' );
            $fields = [
                'vpss_ss_username'    => 'ShipStation Username',
                'vpss_ss_password'    => 'ShipStation Password',
                'vpss_btc_xpub'       => 'BTC xPub Key',
                'vpss_btc_surcharge'  => 'BTC Surcharge % (default: 5)',
                'vpss_btc_enabled'    => 'BTC Enabled (1 = yes, 0 = no)',
                'vpss_cashapp_handle' => 'Cash App Handle',
                'vpss_venmo_handle'   => 'Venmo Handle',
                'vpss_usdc_address'   => 'USDC Wallet (ERC-20)',
                'vpss_usdt_address'   => 'USDT Wallet (ERC-20)',
            ];
            ?>
            <table class="form-table">
                <?php foreach ( $fields as $key => $label ) : ?>
                <tr>
                    <th><label for="<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $label ); ?></label></th>
                    <td>
                        <input type="text" id="<?php echo esc_attr( $key ); ?>" name="<?php echo esc_attr( $key ); ?>"
                               value="<?php echo esc_attr( get_option( $key, '' ) ); ?>" class="regular-text" />
                    </td>
                </tr>
                <?php endforeach; ?>
            </table>
            <p>
                <strong>ShipStation Webhook URL:</strong>
                <code><?php echo esc_html( get_rest_url( null, 'vp-shipstation/v1/orders' ) ); ?></code>
            </p>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}
