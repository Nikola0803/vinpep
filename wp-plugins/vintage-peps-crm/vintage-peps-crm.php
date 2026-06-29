<?php
/**
 * Plugin Name: Vintage Peps CRM
 * Plugin URI:  https://vintagepeptides.com
 * Description: Email subscriber capture, admin list, and WooCommerce buyer sync for Vintage Peptides.
 * Version:     1.1.0
 * Author:      Vintage Peptides
 * Text Domain: vintage-peps-crm
 * Requires WP: 6.0
 * Requires PHP: 8.0
 */

defined( 'ABSPATH' ) || exit;

define( 'VPCRM_VERSION', '1.1.0' );
define( 'VPCRM_TABLE',   'vp_subscribers' );

// ── Activation: create DB table ───────────────────────────────────────────────
register_activation_hook( __FILE__, 'vpcrm_activate' );
function vpcrm_activate(): void {
    global $wpdb;
    $table   = $wpdb->prefix . VPCRM_TABLE;
    $charset = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS {$table} (
        id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        email       VARCHAR(255)    NOT NULL,
        name        VARCHAR(255)    NOT NULL DEFAULT '',
        source      VARCHAR(100)    NOT NULL DEFAULT 'coming-soon',
        status      VARCHAR(20)     NOT NULL DEFAULT 'subscribed',
        created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY email (email)
    ) {$charset};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql );
}

// ── Bootstrap on plugins_loaded ───────────────────────────────────────────────
add_action( 'plugins_loaded', function () {
    // REST endpoint
    add_action( 'rest_api_init', 'vpcrm_register_routes' );

    // Capture buyer email on WooCommerce order creation
    add_action( 'woocommerce_new_order', 'vpcrm_capture_order_email', 10, 2 );

    // Admin menu
    add_action( 'admin_menu', 'vpcrm_admin_menu' );
} );

// ── REST Routes ───────────────────────────────────────────────────────────────

function vpcrm_register_routes(): void {
    register_rest_route( 'vp-crm/v1', '/subscribe', [
        'methods'             => 'POST',
        'callback'            => 'vpcrm_subscribe',
        'permission_callback' => '__return_true',
        'args'                => [
            'email'  => [ 'required' => true, 'sanitize_callback' => 'sanitize_email' ],
            'name'   => [ 'required' => false, 'sanitize_callback' => 'sanitize_text_field', 'default' => '' ],
            'source' => [ 'required' => false, 'sanitize_callback' => 'sanitize_text_field', 'default' => 'coming-soon' ],
        ],
    ] );

    // Admin: list subscribers (requires manage_options)
    register_rest_route( 'vp-crm/v1', '/subscribers', [
        'methods'             => 'GET',
        'callback'            => 'vpcrm_get_subscribers',
        'permission_callback' => fn() => current_user_can( 'manage_options' ),
    ] );

    // Contact form notification (called by Vercel api/contact.ts)
    register_rest_route( 'vp-crm/v1', '/contact-notify', [
        'methods'             => 'POST',
        'callback'            => 'vpcrm_contact_notify',
        'permission_callback' => '__return_true',
    ] );
}

function vpcrm_contact_notify( WP_REST_Request $req ): WP_REST_Response {
    $name        = sanitize_text_field( $req->get_param( 'name' ) ?? '' );
    $email       = sanitize_email( $req->get_param( 'email' ) ?? '' );
    $institution = sanitize_text_field( $req->get_param( 'institution' ) ?? '' );
    $message     = sanitize_textarea_field( $req->get_param( 'message' ) ?? '' );

    if ( ! $email ) {
        return new WP_REST_Response( [ 'error' => 'email required' ], 400 );
    }

    $admin_email = get_option( 'admin_email' );
    $subject     = "New Contact Form — {$name} <{$email}>";

    $body  = "New contact form submission from vintagepeptides.com\r\n\r\n";
    $body .= "Name:        {$name}\r\n";
    $body .= "Email:       {$email}\r\n";
    $body .= "Institution: {$institution}\r\n\r\n";
    $body .= "Message:\r\n{$message}\r\n";

    $headers = [
        'Content-Type: text/plain; charset=UTF-8',
        'From: Vintage Peptides Site <orders@vintagepeptides.com>',
        'Reply-To: ' . $email,
    ];

    wp_mail( $admin_email, $subject, $body, $headers );

    return new WP_REST_Response( [ 'success' => true ], 200 );
}

function vpcrm_subscribe( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $table = $wpdb->prefix . VPCRM_TABLE;

    $email  = $req->get_param( 'email' );
    $name   = $req->get_param( 'name' )   ?: '';
    $source = $req->get_param( 'source' ) ?: 'coming-soon';

    if ( ! is_email( $email ) ) {
        return new WP_REST_Response( [ 'error' => 'Invalid email address.' ], 400 );
    }

    // Upsert — update name/source if email already exists
    $existing = $wpdb->get_var( $wpdb->prepare(
        "SELECT id FROM {$table} WHERE email = %s",
        $email
    ) );

    if ( $existing ) {
        $wpdb->update(
            $table,
            [ 'name' => $name ?: $wpdb->get_var( $wpdb->prepare( "SELECT name FROM {$table} WHERE email = %s", $email ) ), 'status' => 'subscribed' ],
            [ 'email' => $email ]
        );
        return new WP_REST_Response( [ 'success' => true, 'message' => 'Already subscribed.' ], 200 );
    }

    $result = $wpdb->insert( $table, [
        'email'  => $email,
        'name'   => $name,
        'source' => $source,
        'status' => 'subscribed',
    ] );

    if ( $result === false ) {
        return new WP_REST_Response( [ 'error' => 'Could not save subscription.' ], 500 );
    }

    // Optional: send a welcome email
    vpcrm_send_welcome_email( $email, $name );

    return new WP_REST_Response( [ 'success' => true, 'message' => 'Subscribed successfully.' ], 200 );
}

function vpcrm_get_subscribers( WP_REST_Request $req ): WP_REST_Response {
    global $wpdb;
    $table = $wpdb->prefix . VPCRM_TABLE;
    $rows  = $wpdb->get_results( "SELECT * FROM {$table} ORDER BY created_at DESC LIMIT 1000", ARRAY_A );
    return new WP_REST_Response( $rows ?: [], 200 );
}

// ── WooCommerce hook ──────────────────────────────────────────────────────────

function vpcrm_capture_order_email( int $order_id, WC_Order $order ): void {
    $email = $order->get_billing_email();
    $name  = trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() );

    if ( ! $email ) return;

    global $wpdb;
    $table = $wpdb->prefix . VPCRM_TABLE;

    $existing = $wpdb->get_var( $wpdb->prepare(
        "SELECT id FROM {$table} WHERE email = %s",
        $email
    ) );

    if ( ! $existing ) {
        $wpdb->insert( $table, [
            'email'  => $email,
            'name'   => $name,
            'source' => 'woocommerce-order',
            'status' => 'subscribed',
        ] );
    }
}

// ── Welcome email ─────────────────────────────────────────────────────────────

function vpcrm_send_welcome_email( string $email, string $name ): void {
    $to      = $email;
    $subject = 'Welcome to Vintage Peptides — You\'re on the list';
    $greeting = $name ? "Hello {$name}," : 'Hello,';

    $message = "{$greeting}\r\n\r\n"
        . "Thank you for joining the Vintage Peptides early access list.\r\n\r\n"
        . "We'll reach out with an exclusive invitation the moment our doors open. "
        . "No spam — just a single email when it's time.\r\n\r\n"
        . "In the meantime, feel free to reply to this email with any questions.\r\n\r\n"
        . "— The Vintage Peptides Research Team\r\n"
        . "https://vintagepeptides.com";

    $headers = [
        'Content-Type: text/plain; charset=UTF-8',
        'From: Vintage Peptides <orders@vintagepeptides.com>',
    ];

    wp_mail( $to, $subject, $message, $headers );
}

// ── Admin UI ──────────────────────────────────────────────────────────────────

function vpcrm_admin_menu(): void {
    add_menu_page(
        'Email Signups',
        'Email Signups',
        'manage_options',
        'vp-crm-subscribers',
        'vpcrm_admin_page',
        'dashicons-email-alt',
        56
    );
}

function vpcrm_admin_page(): void {
    global $wpdb;
    $table = $wpdb->prefix . VPCRM_TABLE;
    $rows  = $wpdb->get_results( "SELECT * FROM {$table} ORDER BY created_at DESC", ARRAY_A );
    $count = count( $rows );
    ?>
    <div class="wrap">
        <h1>Email Signups <span class="title-count theme-count"><?php echo esc_html( $count ); ?></span></h1>

        <?php if ( isset( $_GET['exported'] ) ) : ?>
            <div class="notice notice-success"><p>CSV exported.</p></div>
        <?php endif; ?>

        <p>
            <a href="<?php echo esc_url( admin_url( 'admin-post.php?action=vpcrm_export_csv' ) ); ?>" class="button">
                Export CSV
            </a>
        </p>

        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                <?php if ( empty( $rows ) ) : ?>
                    <tr><td colspan="5">No subscribers yet.</td></tr>
                <?php else : ?>
                    <?php foreach ( $rows as $row ) : ?>
                        <tr>
                            <td><?php echo esc_html( $row['email'] ); ?></td>
                            <td><?php echo esc_html( $row['name'] ); ?></td>
                            <td><?php echo esc_html( $row['source'] ); ?></td>
                            <td><?php echo esc_html( $row['status'] ); ?></td>
                            <td><?php echo esc_html( $row['created_at'] ); ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
    <?php
}

// ── CSV Export ────────────────────────────────────────────────────────────────

add_action( 'admin_post_vpcrm_export_csv', function () {
    if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Forbidden' );

    global $wpdb;
    $table = $wpdb->prefix . VPCRM_TABLE;
    $rows  = $wpdb->get_results( "SELECT email, name, source, status, created_at FROM {$table} ORDER BY created_at DESC", ARRAY_A );

    header( 'Content-Type: text/csv; charset=UTF-8' );
    header( 'Content-Disposition: attachment; filename="vp-subscribers-' . date( 'Y-m-d' ) . '.csv"' );

    $out = fopen( 'php://output', 'w' );
    fputcsv( $out, [ 'Email', 'Name', 'Source', 'Status', 'Date' ] );
    foreach ( $rows as $row ) {
        fputcsv( $out, array_values( $row ) );
    }
    fclose( $out );
    exit;
} );
