<?php
/**
 * Plugin Name:  Vintage Peps — CRM
 * Plugin URI:   https://vintagepeptides.com
 * Description:  Micro-CRM for email collection, contact forms, newsletter broadcasts,
 *               and WooCommerce order subscriber capture. Works with FluentSMTP —
 *               all mail goes through wp_mail() so SMTP config is transparent.
 * Version:      1.0.0
 * Author:       Velocity72 / Vintage Peptides
 * Requires WC:  6.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// ─── Constants ────────────────────────────────────────────────────────────────

define( 'VP_CRM_VERSION',  '1.0.0' );
define( 'VP_CRM_TABLE',    'vp_crm_contacts' );
define( 'VP_CRM_OPT_FROM_NAME',  'vp_crm_from_name' );
define( 'VP_CRM_OPT_FROM_EMAIL', 'vp_crm_from_email' );
define( 'VP_CRM_OPT_DOUBLE_OI',  'vp_crm_double_optin' );
define( 'VP_CRM_OPT_HMAC_KEY',   'vp_crm_hmac_key' );
define( 'VP_CRM_PER_PAGE',       50 );

// ─── Activation — create DB table ────────────────────────────────────────────

register_activation_hook( __FILE__, 'vp_crm_activate' );
function vp_crm_activate() {
    global $wpdb;
    $table   = $wpdb->prefix . VP_CRM_TABLE;
    $charset = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS {$table} (
        id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        email       VARCHAR(200)    NOT NULL,
        name        VARCHAR(200)    NOT NULL DEFAULT '',
        type        VARCHAR(50)     NOT NULL DEFAULT 'newsletter',
        source      VARCHAR(100)    NOT NULL DEFAULT '',
        data        LONGTEXT        NOT NULL DEFAULT '',
        status      VARCHAR(50)     NOT NULL DEFAULT 'pending',
        ip_address  VARCHAR(45)     NOT NULL DEFAULT '',
        confirmed   TINYINT(1)      NOT NULL DEFAULT 0,
        created_at  DATETIME        NOT NULL,
        PRIMARY KEY (id),
        KEY email (email(100)),
        KEY type (type),
        KEY status (status),
        KEY created_at (created_at)
    ) {$charset};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql );

    // Generate HMAC key for unsubscribe tokens if not set
    if ( ! get_option( VP_CRM_OPT_HMAC_KEY ) ) {
        update_option( VP_CRM_OPT_HMAC_KEY, bin2hex( random_bytes( 32 ) ) );
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function vp_crm_table(): string {
    global $wpdb;
    return $wpdb->prefix . VP_CRM_TABLE;
}

function vp_crm_from_name(): string {
    return get_option( VP_CRM_OPT_FROM_NAME, 'Vintage Peptides' );
}

function vp_crm_from_email(): string {
    return get_option( VP_CRM_OPT_FROM_EMAIL, get_option( 'admin_email' ) );
}

function vp_crm_unsubscribe_token( string $email ): string {
    $key = get_option( VP_CRM_OPT_HMAC_KEY, '' );
    return hash_hmac( 'sha256', strtolower( $email ), $key );
}

function vp_crm_unsubscribe_url( string $email ): string {
    return add_query_arg( [
        'token' => vp_crm_unsubscribe_token( $email ),
        'email' => rawurlencode( $email ),
    ], rest_url( 'vp-crm/v1/unsubscribe' ) );
}

function vp_crm_type_label( string $type ): string {
    return match ( $type ) {
        'newsletter' => 'Newsletter',
        'contact'    => 'Contact',
        'order'      => 'Order',
        default      => ucfirst( $type ),
    };
}

function vp_crm_status_badge( string $status ): string {
    $map = [
        'active'       => '#22c55e',
        'pending'      => '#f59e0b',
        'unsubscribed' => '#6b7280',
        'bounced'      => '#ef4444',
    ];
    $color = $map[ $status ] ?? '#6b7280';
    return "<span style='display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;background:{$color}22;color:{$color};border:1px solid {$color}66;'>"
        . esc_html( ucfirst( $status ) ) . '</span>';
}

// ─── Admin Menu ───────────────────────────────────────────────────────────────

add_action( 'admin_menu', 'vp_crm_admin_menu' );
function vp_crm_admin_menu() {
    add_menu_page(
        'Vintage CRM',
        'Vintage CRM',
        'manage_woocommerce',
        'vp-crm',
        'vp_crm_page_dashboard',
        'dashicons-email-alt',
        56
    );
    add_submenu_page( 'vp-crm', 'Dashboard',   'Dashboard',   'manage_woocommerce', 'vp-crm',            'vp_crm_page_dashboard' );
    add_submenu_page( 'vp-crm', 'Contacts',    'Contacts',    'manage_woocommerce', 'vp-crm-contacts',   'vp_crm_page_contacts' );
    add_submenu_page( 'vp-crm', 'Newsletter',  'Newsletter',  'manage_woocommerce', 'vp-crm-newsletter', 'vp_crm_page_newsletter' );
    add_submenu_page( 'vp-crm', 'Settings',    'Settings',    'manage_woocommerce', 'vp-crm-settings',   'vp_crm_page_settings' );
}

add_action( 'admin_init', 'vp_crm_register_settings' );
function vp_crm_register_settings() {
    foreach ( [ VP_CRM_OPT_FROM_NAME, VP_CRM_OPT_FROM_EMAIL, VP_CRM_OPT_DOUBLE_OI ] as $opt ) {
        register_setting( 'vp_crm_settings', $opt, [ 'sanitize_callback' => 'sanitize_text_field' ] );
    }
}

// ─── Admin: Dashboard ─────────────────────────────────────────────────────────

function vp_crm_page_dashboard() {
    global $wpdb;
    $t = vp_crm_table();

    $total       = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$t}" );
    $newsletter  = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$t} WHERE type='newsletter' AND status='active'" );
    $contacts    = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$t} WHERE type='contact'" );
    $orders      = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$t} WHERE type='order'" );
    $unsub       = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$t} WHERE status='unsubscribed'" );

    $recent = $wpdb->get_results(
        "SELECT * FROM {$t} ORDER BY created_at DESC LIMIT 10",
        ARRAY_A
    );
    ?>
    <div class="wrap">
    <h1 style="display:flex;align-items:center;gap:10px;">
        <span class="dashicons dashicons-email-alt" style="font-size:26px;color:#b8942a;"></span>
        Vintage CRM — Dashboard
    </h1>

    <!-- Stat cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin:24px 0;">
        <?php
        $stats = [
            [ 'Total Contacts',       $total,      '#6366f1' ],
            [ 'Newsletter (active)',  $newsletter, '#22c55e' ],
            [ 'Contact Forms',        $contacts,   '#f59e0b' ],
            [ 'Order Emails',         $orders,     '#3b82f6' ],
            [ 'Unsubscribed',         $unsub,      '#6b7280' ],
        ];
        foreach ( $stats as [ $label, $count, $color ] ) : ?>
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;border-top:3px solid <?php echo $color; ?>;">
            <div style="font-size:28px;font-weight:700;color:<?php echo $color; ?>;"><?php echo esc_html( number_format( $count ) ); ?></div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px;"><?php echo esc_html( $label ); ?></div>
        </div>
        <?php endforeach; ?>
    </div>

    <!-- Recent contacts -->
    <h2>Recent Contacts</h2>
    <table class="widefat striped">
        <thead>
            <tr>
                <th>Email</th><th>Name</th><th>Type</th><th>Source</th><th>Status</th><th>Date</th>
            </tr>
        </thead>
        <tbody>
        <?php foreach ( $recent as $row ) : ?>
            <tr>
                <td><?php echo esc_html( $row['email'] ); ?></td>
                <td><?php echo esc_html( $row['name'] ); ?></td>
                <td><?php echo vp_crm_type_label( $row['type'] ); ?></td>
                <td><code><?php echo esc_html( $row['source'] ); ?></code></td>
                <td><?php echo vp_crm_status_badge( $row['status'] ); ?></td>
                <td><?php echo esc_html( $row['created_at'] ); ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    </div>
    <?php
}

// ─── Admin: Contacts list ─────────────────────────────────────────────────────

function vp_crm_page_contacts() {
    global $wpdb;
    $t = vp_crm_table();

    // Handle delete
    if ( isset( $_GET['delete_id'] ) && check_admin_referer( 'vp_crm_delete_' . (int) $_GET['delete_id'] ) ) {
        $wpdb->delete( $t, [ 'id' => (int) $_GET['delete_id'] ], [ '%d' ] );
        echo '<div class="notice notice-success"><p>Contact deleted.</p></div>';
    }

    // Filters
    $type   = sanitize_text_field( $_GET['type']   ?? '' );
    $status = sanitize_text_field( $_GET['status'] ?? '' );
    $search = sanitize_text_field( $_GET['s']      ?? '' );
    $paged  = max( 1, (int) ( $_GET['paged'] ?? 1 ) );
    $offset = ( $paged - 1 ) * VP_CRM_PER_PAGE;

    $where  = 'WHERE 1=1';
    $values = [];
    if ( $type )   { $where .= ' AND type = %s';   $values[] = $type; }
    if ( $status ) { $where .= ' AND status = %s'; $values[] = $status; }
    if ( $search ) { $where .= ' AND (email LIKE %s OR name LIKE %s)'; $like = '%' . $wpdb->esc_like( $search ) . '%'; $values[] = $like; $values[] = $like; }

    $sql_base  = $values ? $wpdb->prepare( "FROM {$t} {$where}", ...$values ) : "FROM {$t} {$where}";
    $total     = (int) $wpdb->get_var( "SELECT COUNT(*) {$sql_base}" );
    $rows      = $wpdb->get_results( "SELECT * {$sql_base} ORDER BY created_at DESC LIMIT " . VP_CRM_PER_PAGE . " OFFSET {$offset}", ARRAY_A );
    $pages     = ceil( $total / VP_CRM_PER_PAGE );

    $base_url  = admin_url( 'admin.php?page=vp-crm-contacts' );

    // CSV export
    if ( isset( $_GET['export'] ) && current_user_can( 'manage_woocommerce' ) ) {
        vp_crm_export_csv( $sql_base );
        exit;
    }
    ?>
    <div class="wrap">
    <h1 style="display:flex;align-items:center;justify-content:space-between;">
        <span>Contacts <span style="font-size:14px;color:#6b7280;">(<?php echo number_format( $total ); ?> records)</span></span>
        <a href="<?php echo esc_url( add_query_arg( [ 'export' => 1, 'type' => $type, 'status' => $status, 's' => $search ], $base_url ) ); ?>"
           class="button">Export CSV</a>
    </h1>

    <!-- Filter bar -->
    <form method="get" style="margin:16px 0;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <input type="hidden" name="page" value="vp-crm-contacts" />
        <select name="type" onchange="this.form.submit()">
            <option value="">All Types</option>
            <?php foreach ( [ 'newsletter', 'contact', 'order' ] as $opt ) : ?>
            <option value="<?php echo $opt; ?>" <?php selected( $type, $opt ); ?>><?php echo vp_crm_type_label( $opt ); ?></option>
            <?php endforeach; ?>
        </select>
        <select name="status" onchange="this.form.submit()">
            <option value="">All Statuses</option>
            <?php foreach ( [ 'active', 'pending', 'unsubscribed', 'bounced' ] as $opt ) : ?>
            <option value="<?php echo $opt; ?>" <?php selected( $status, $opt ); ?>><?php echo ucfirst( $opt ); ?></option>
            <?php endforeach; ?>
        </select>
        <input type="search" name="s" value="<?php echo esc_attr( $search ); ?>" placeholder="Search email / name…" style="width:220px;" />
        <button type="submit" class="button">Filter</button>
        <?php if ( $type || $status || $search ) : ?>
        <a href="<?php echo esc_url( $base_url ); ?>" class="button">Clear</a>
        <?php endif; ?>
    </form>

    <!-- Table -->
    <table class="widefat striped">
        <thead>
            <tr>
                <th>#</th><th>Email</th><th>Name</th><th>Type</th><th>Source</th>
                <th>Status</th><th>Confirmed</th><th>Date</th><th>Actions</th>
            </tr>
        </thead>
        <tbody>
        <?php foreach ( $rows as $row ) : ?>
            <tr>
                <td><?php echo esc_html( $row['id'] ); ?></td>
                <td><strong><?php echo esc_html( $row['email'] ); ?></strong></td>
                <td><?php echo esc_html( $row['name'] ); ?></td>
                <td><?php echo vp_crm_type_label( $row['type'] ); ?></td>
                <td><code style="font-size:11px;"><?php echo esc_html( $row['source'] ); ?></code></td>
                <td><?php echo vp_crm_status_badge( $row['status'] ); ?></td>
                <td><?php echo $row['confirmed'] ? '✅' : '⏳'; ?></td>
                <td style="font-size:12px;white-space:nowrap;"><?php echo esc_html( $row['created_at'] ); ?></td>
                <td>
                    <?php
                    $del_url = wp_nonce_url(
                        add_query_arg( [ 'page' => 'vp-crm-contacts', 'delete_id' => $row['id'] ], admin_url( 'admin.php' ) ),
                        'vp_crm_delete_' . $row['id']
                    );
                    ?>
                    <a href="<?php echo esc_url( $del_url ); ?>"
                       onclick="return confirm('Delete this contact?')"
                       style="color:#dc2626;text-decoration:none;">Delete</a>
                </td>
            </tr>
        <?php endforeach; ?>
        <?php if ( empty( $rows ) ) : ?>
            <tr><td colspan="9" style="text-align:center;padding:24px;color:#6b7280;">No contacts found.</td></tr>
        <?php endif; ?>
        </tbody>
    </table>

    <!-- Pagination -->
    <?php if ( $pages > 1 ) : ?>
    <div style="margin-top:16px;display:flex;gap:6px;align-items:center;">
        <?php for ( $i = 1; $i <= $pages; $i++ ) : ?>
        <a href="<?php echo esc_url( add_query_arg( [ 'paged' => $i ], $base_url ) ); ?>"
           style="padding:4px 10px;border:1px solid #ddd;border-radius:4px;text-decoration:none;
                  background:<?php echo $i === $paged ? '#b8942a' : '#fff'; ?>;
                  color:<?php echo $i === $paged ? '#fff' : '#374151'; ?>;">
            <?php echo $i; ?>
        </a>
        <?php endfor; ?>
    </div>
    <?php endif; ?>
    </div>
    <?php
}

// ─── Admin: Newsletter compose + send ────────────────────────────────────────

function vp_crm_page_newsletter() {
    global $wpdb;
    $t = vp_crm_table();

    $active_count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$t} WHERE type='newsletter' AND status='active' AND confirmed=1" );
    $sent_notice  = '';

    if ( isset( $_POST['vp_crm_broadcast_nonce'] ) && wp_verify_nonce( $_POST['vp_crm_broadcast_nonce'], 'vp_crm_broadcast' ) ) {
        $subject = sanitize_text_field( $_POST['subject'] ?? '' );
        $body    = wp_kses_post( $_POST['body'] ?? '' );

        if ( $subject && $body ) {
            $subscribers = $wpdb->get_results(
                "SELECT email, name FROM {$t} WHERE type='newsletter' AND status='active' AND confirmed=1",
                ARRAY_A
            );
            $sent = 0;
            foreach ( $subscribers as $sub ) {
                $unsub_link = vp_crm_unsubscribe_url( $sub['email'] );
                $html = vp_crm_newsletter_template( $sub['name'], $subject, $body, $unsub_link );
                $headers = [
                    'Content-Type: text/html; charset=UTF-8',
                    'From: ' . vp_crm_from_name() . ' <' . vp_crm_from_email() . '>',
                ];
                if ( wp_mail( $sub['email'], $subject, $html, $headers ) ) {
                    $sent++;
                }
            }
            $sent_notice = "<div class='notice notice-success'><p>Sent to {$sent} subscriber(s).</p></div>";
        } else {
            $sent_notice = "<div class='notice notice-error'><p>Subject and body are required.</p></div>";
        }
    }
    ?>
    <div class="wrap">
    <h1>Newsletter</h1>
    <?php echo $sent_notice; ?>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:24px;margin-top:20px;align-items:start;">

        <!-- Compose -->
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:24px;">
            <h2 style="margin-top:0;">Compose Broadcast</h2>
            <p style="color:#6b7280;font-size:13px;">Will send to <strong><?php echo number_format( $active_count ); ?></strong> confirmed newsletter subscribers.
               An unsubscribe link is automatically appended to every email.</p>
            <form method="post">
                <?php wp_nonce_field( 'vp_crm_broadcast', 'vp_crm_broadcast_nonce' ); ?>
                <table class="form-table" style="margin:0;">
                    <tr>
                        <th style="width:80px;"><label for="subject">Subject</label></th>
                        <td><input type="text" id="subject" name="subject" class="large-text" required
                                   value="<?php echo esc_attr( $_POST['subject'] ?? '' ); ?>" /></td>
                    </tr>
                    <tr>
                        <th><label for="body">Body (HTML)</label></th>
                        <td>
                            <?php
                            wp_editor(
                                $_POST['body'] ?? '',
                                'body',
                                [ 'textarea_rows' => 16, 'media_buttons' => false, 'teeny' => false ]
                            );
                            ?>
                        </td>
                    </tr>
                </table>
                <p style="margin-top:16px;">
                    <button type="submit" class="button button-primary" style="background:#b8942a;border-color:#9a7a20;"
                            onclick="return confirm('Send to <?php echo $active_count; ?> subscribers now?')">
                        Send Broadcast
                    </button>
                </p>
            </form>
        </div>

        <!-- Stats sidebar -->
        <div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;">
                <h3 style="margin-top:0;">Subscriber Stats</h3>
                <?php
                $by_status = $wpdb->get_results(
                    "SELECT status, COUNT(*) as cnt FROM {$t} WHERE type='newsletter' GROUP BY status",
                    ARRAY_A
                );
                foreach ( $by_status as $row ) {
                    echo '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f4f6;">'
                        . '<span>' . vp_crm_status_badge( $row['status'] ) . '</span>'
                        . '<strong>' . number_format( $row['cnt'] ) . '</strong></div>';
                }
                ?>
                <div style="margin-top:12px;">
                    <a href="<?php echo esc_url( add_query_arg( [ 'page' => 'vp-crm-contacts', 'type' => 'newsletter' ], admin_url( 'admin.php' ) ) ); ?>"
                       class="button" style="width:100%;text-align:center;">View All Subscribers</a>
                </div>
            </div>
        </div>

    </div>
    </div>
    <?php
}

// ─── Admin: Settings ──────────────────────────────────────────────────────────

function vp_crm_page_settings() {
    if ( isset( $_GET['updated'] ) ) {
        echo '<div class="notice notice-success"><p>Settings saved.</p></div>';
    }
    $double_optin = get_option( VP_CRM_OPT_DOUBLE_OI, '1' );
    ?>
    <div class="wrap">
    <h1>CRM Settings</h1>
    <p style="color:#6b7280;">Mail is sent through <code>wp_mail()</code> — install
       <a href="https://wordpress.org/plugins/fluent-smtp/" target="_blank">FluentSMTP</a>
       to route through your preferred SMTP provider.</p>

    <form method="post" action="options.php">
        <?php settings_fields( 'vp_crm_settings' ); ?>
        <table class="form-table">
            <tr>
                <th><label for="<?php echo VP_CRM_OPT_FROM_NAME; ?>">From Name</label></th>
                <td>
                    <input type="text" id="<?php echo VP_CRM_OPT_FROM_NAME; ?>"
                           name="<?php echo VP_CRM_OPT_FROM_NAME; ?>"
                           value="<?php echo esc_attr( vp_crm_from_name() ); ?>" class="regular-text" />
                </td>
            </tr>
            <tr>
                <th><label for="<?php echo VP_CRM_OPT_FROM_EMAIL; ?>">From Email</label></th>
                <td>
                    <input type="email" id="<?php echo VP_CRM_OPT_FROM_EMAIL; ?>"
                           name="<?php echo VP_CRM_OPT_FROM_EMAIL; ?>"
                           value="<?php echo esc_attr( vp_crm_from_email() ); ?>" class="regular-text" />
                    <p class="description">Must match your SMTP sender address in FluentSMTP to avoid spoofing issues.</p>
                </td>
            </tr>
            <tr>
                <th>Double Opt-In</th>
                <td>
                    <label>
                        <input type="checkbox" name="<?php echo VP_CRM_OPT_DOUBLE_OI; ?>" value="1"
                               <?php checked( $double_optin, '1' ); ?> />
                        Send confirmation email on newsletter signup (recommended)
                    </label>
                    <p class="description">When enabled, subscribers stay in <em>pending</em> status until they click the confirmation link in their email.</p>
                </td>
            </tr>
        </table>
        <?php submit_button( 'Save Settings' ); ?>
    </form>

    <hr />
    <h2>Test Email</h2>
    <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
        <input type="hidden" name="action" value="vp_crm_test_email" />
        <?php wp_nonce_field( 'vp_crm_test_email' ); ?>
        <table class="form-table">
            <tr>
                <th><label for="test_email">Send test to</label></th>
                <td>
                    <input type="email" id="test_email" name="test_email"
                           value="<?php echo esc_attr( get_option( 'admin_email' ) ); ?>" class="regular-text" />
                    <?php submit_button( 'Send Test', 'secondary', 'submit', false ); ?>
                </td>
            </tr>
        </table>
    </form>
    </div>
    <?php
}

add_action( 'admin_post_vp_crm_test_email', 'vp_crm_handle_test_email' );
function vp_crm_handle_test_email() {
    check_admin_referer( 'vp_crm_test_email' );
    if ( ! current_user_can( 'manage_woocommerce' ) ) wp_die( 'Unauthorized' );

    $to      = sanitize_email( $_POST['test_email'] ?? '' );
    $subject = '[Vintage CRM] Test email from ' . get_bloginfo( 'name' );
    $body    = vp_crm_newsletter_template(
        'Admin',
        $subject,
        '<p>This is a test email sent from Vintage CRM. If you received this, your SMTP is configured correctly.</p>',
        '#'
    );
    $headers = [
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . vp_crm_from_name() . ' <' . vp_crm_from_email() . '>',
    ];
    $ok = wp_mail( $to, $subject, $body, $headers );
    wp_redirect( add_query_arg( [ 'page' => 'vp-crm-settings', 'updated' => $ok ? '1' : 'fail' ], admin_url( 'admin.php' ) ) );
    exit;
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function vp_crm_export_csv( string $sql_base ) {
    global $wpdb;
    $rows = $wpdb->get_results( "SELECT * {$sql_base} ORDER BY created_at DESC", ARRAY_A );

    header( 'Content-Type: text/csv; charset=utf-8' );
    header( 'Content-Disposition: attachment; filename="vp-crm-export-' . date( 'Y-m-d' ) . '.csv"' );

    $out = fopen( 'php://output', 'w' );
    fputcsv( $out, [ 'ID', 'Email', 'Name', 'Type', 'Source', 'Status', 'Confirmed', 'IP', 'Created At', 'Data' ] );
    foreach ( $rows as $row ) {
        fputcsv( $out, [
            $row['id'], $row['email'], $row['name'], $row['type'], $row['source'],
            $row['status'], $row['confirmed'] ? 'yes' : 'no',
            $row['ip_address'], $row['created_at'], $row['data'],
        ] );
    }
    fclose( $out );
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function vp_crm_newsletter_template( string $name, string $subject, string $body, string $unsub_url ): string {
    $site = get_bloginfo( 'name' );
    $greeting = $name ? "Hi {$name}," : 'Hello,';
    return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{$subject}</title></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Georgia',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fdf8f0;border:1px solid #d4c4a0;">
      <tr>
        <td style="background:#1e0f02;padding:24px 40px;border-bottom:2px solid #b8942a;text-align:center;">
          <p style="margin:0;color:#b8942a;font-family:monospace;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;">{$site}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 40px;">
          <p style="margin:0 0 12px;color:#2c1a0e;font-size:15px;">{$greeting}</p>
          <div style="color:#2c1a0e;font-size:14px;line-height:1.7;">{$body}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 40px;border-top:1px solid #e8dcc8;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9a7a5c;">
            You are receiving this because you subscribed to {$site} updates.<br>
            <a href="{$unsub_url}" style="color:#b8942a;">Unsubscribe</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>
HTML;
}

function vp_crm_confirmation_template( string $name, string $confirm_url ): string {
    $site = get_bloginfo( 'name' );
    $greeting = $name ? "Hi {$name}," : 'Hello,';
    return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Confirm your subscription</title></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Georgia',serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fdf8f0;border:1px solid #d4c4a0;">
      <tr>
        <td style="background:#1e0f02;padding:24px 40px;border-bottom:2px solid #b8942a;text-align:center;">
          <p style="margin:0;color:#b8942a;font-family:monospace;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;">{$site}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:40px;text-align:center;">
          <p style="color:#2c1a0e;font-size:15px;">{$greeting}</p>
          <p style="color:#2c1a0e;font-size:14px;line-height:1.7;">
            Click the button below to confirm your subscription and receive our launch notification.
          </p>
          <a href="{$confirm_url}"
             style="display:inline-block;margin-top:16px;background:#b8942a;color:#1e0f02;
                    font-family:monospace;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;
                    padding:14px 32px;text-decoration:none;border:1px solid #b8942a;">
            Confirm Subscription
          </a>
          <p style="margin-top:20px;font-size:12px;color:#9a7a5c;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>
HTML;
}

// ─── REST API ─────────────────────────────────────────────────────────────────

add_action( 'rest_api_init', 'vp_crm_register_routes' );
function vp_crm_register_routes() {

    // Public: newsletter subscribe (coming-soon form)
    register_rest_route( 'vp-crm/v1', '/subscribe', [
        'methods'             => 'POST',
        'callback'            => 'vp_crm_rest_subscribe',
        'permission_callback' => '__return_true',
    ] );

    // Public: email confirm (double opt-in click)
    register_rest_route( 'vp-crm/v1', '/confirm', [
        'methods'             => 'GET',
        'callback'            => 'vp_crm_rest_confirm',
        'permission_callback' => '__return_true',
    ] );

    // Public: unsubscribe (link in emails)
    register_rest_route( 'vp-crm/v1', '/unsubscribe', [
        'methods'             => 'GET',
        'callback'            => 'vp_crm_rest_unsubscribe',
        'permission_callback' => '__return_true',
    ] );

    // Public: contact form
    register_rest_route( 'vp-crm/v1', '/contact', [
        'methods'             => 'POST',
        'callback'            => 'vp_crm_rest_contact',
        'permission_callback' => '__return_true',
    ] );

    // Admin: list contacts
    register_rest_route( 'vp-crm/v1', '/contacts', [
        'methods'             => 'GET',
        'callback'            => 'vp_crm_rest_list_contacts',
        'permission_callback' => fn() => current_user_can( 'manage_woocommerce' ),
    ] );

    // Admin: delete contact
    register_rest_route( 'vp-crm/v1', '/contacts/(?P<id>\d+)', [
        'methods'             => 'DELETE',
        'callback'            => 'vp_crm_rest_delete_contact',
        'permission_callback' => fn() => current_user_can( 'manage_woocommerce' ),
    ] );
}

// ── Subscribe ──────────────────────────────────────────────────────────────────

function vp_crm_rest_subscribe( WP_REST_Request $request ): WP_REST_Response {
    global $wpdb;
    $t = vp_crm_table();

    // Rate-limit: max 3 submissions per IP per hour
    $ip   = sanitize_text_field( $_SERVER['REMOTE_ADDR'] ?? '' );
    $hour = date( 'Y-m-d H' );
    $count = (int) $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(*) FROM {$t} WHERE ip_address = %s AND created_at >= %s AND type = 'newsletter'",
        $ip, date( 'Y-m-d H:00:00' )
    ) );
    if ( $count >= 3 ) {
        return new WP_REST_Response( [ 'error' => 'Too many requests. Try again later.' ], 429 );
    }

    $body  = $request->get_json_params() ?: $request->get_body_params();
    $email = sanitize_email( $body['email'] ?? '' );
    $name  = sanitize_text_field( $body['name'] ?? '' );

    if ( ! is_email( $email ) ) {
        return new WP_REST_Response( [ 'error' => 'Invalid email address.' ], 400 );
    }

    // Honeypot check
    if ( ! empty( $body['website'] ) ) {
        return new WP_REST_Response( [ 'ok' => true ], 200 ); // silently accept
    }

    // Already subscribed?
    $existing = $wpdb->get_row( $wpdb->prepare(
        "SELECT id, status, confirmed FROM {$t} WHERE email = %s AND type = 'newsletter'",
        $email
    ), ARRAY_A );

    if ( $existing ) {
        if ( $existing['status'] === 'active' && $existing['confirmed'] ) {
            return new WP_REST_Response( [ 'ok' => true, 'message' => 'already_subscribed' ], 200 );
        }
        // Re-send confirmation if still pending
        if ( get_option( VP_CRM_OPT_DOUBLE_OI, '1' ) === '1' ) {
            vp_crm_send_confirmation( $email, $name );
        }
        return new WP_REST_Response( [ 'ok' => true, 'message' => 'confirmation_resent' ], 200 );
    }

    $double_optin = get_option( VP_CRM_OPT_DOUBLE_OI, '1' ) === '1';
    $status    = $double_optin ? 'pending' : 'active';
    $confirmed = $double_optin ? 0 : 1;

    $wpdb->insert( $t, [
        'email'      => $email,
        'name'       => $name,
        'type'       => 'newsletter',
        'source'     => 'coming-soon',
        'data'       => '{}',
        'status'     => $status,
        'ip_address' => $ip,
        'confirmed'  => $confirmed,
        'created_at' => current_time( 'mysql' ),
    ], [ '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s' ] );

    if ( $double_optin ) {
        vp_crm_send_confirmation( $email, $name );
    }

    return new WP_REST_Response( [
        'ok'      => true,
        'message' => $double_optin ? 'confirmation_sent' : 'subscribed',
    ], 201 );
}

function vp_crm_send_confirmation( string $email, string $name ) {
    $token = vp_crm_unsubscribe_token( $email . '|confirm' );
    $confirm_url = add_query_arg( [
        'token' => $token,
        'email' => rawurlencode( $email ),
    ], rest_url( 'vp-crm/v1/confirm' ) );

    $subject = 'Confirm your subscription — ' . get_bloginfo( 'name' );
    $body    = vp_crm_confirmation_template( $name, $confirm_url );
    $headers = [
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . vp_crm_from_name() . ' <' . vp_crm_from_email() . '>',
    ];
    wp_mail( $email, $subject, $body, $headers );
}

// ── Confirm (double opt-in click) ─────────────────────────────────────────────

function vp_crm_rest_confirm( WP_REST_Request $request ): WP_REST_Response {
    global $wpdb;
    $t = vp_crm_table();

    $email = sanitize_email( urldecode( $request->get_param( 'email' ) ?? '' ) );
    $token = sanitize_text_field( $request->get_param( 'token' ) ?? '' );

    if ( ! $email || ! $token ) {
        return new WP_REST_Response( [ 'error' => 'Invalid link.' ], 400 );
    }

    $expected = vp_crm_unsubscribe_token( $email . '|confirm' );
    if ( ! hash_equals( $expected, $token ) ) {
        return new WP_REST_Response( [ 'error' => 'Invalid or expired token.' ], 403 );
    }

    $wpdb->update(
        $t,
        [ 'confirmed' => 1, 'status' => 'active' ],
        [ 'email' => $email, 'type' => 'newsletter' ],
        [ '%d', '%s' ],
        [ '%s', '%s' ]
    );

    // Redirect to homepage with a success flag
    wp_redirect( home_url( '/?subscribed=1' ) );
    exit;
}

// ── Unsubscribe ────────────────────────────────────────────────────────────────

function vp_crm_rest_unsubscribe( WP_REST_Request $request ): WP_REST_Response {
    global $wpdb;
    $t = vp_crm_table();

    $email = sanitize_email( urldecode( $request->get_param( 'email' ) ?? '' ) );
    $token = sanitize_text_field( $request->get_param( 'token' ) ?? '' );

    if ( ! $email || ! $token ) {
        wp_die( 'Invalid unsubscribe link.', 'Error', [ 'response' => 400 ] );
    }

    if ( ! hash_equals( vp_crm_unsubscribe_token( $email ), $token ) ) {
        wp_die( 'This unsubscribe link is invalid or has expired.', 'Error', [ 'response' => 403 ] );
    }

    $wpdb->update(
        $t,
        [ 'status' => 'unsubscribed' ],
        [ 'email' => $email ],
        [ '%s' ],
        [ '%s' ]
    );

    wp_die(
        '<div style="font-family:Georgia,serif;text-align:center;padding:60px 20px;">'
        . '<h2 style="color:#1e0f02;">You have been unsubscribed.</h2>'
        . '<p style="color:#7a5c2e;">You will no longer receive emails from ' . esc_html( get_bloginfo( 'name' ) ) . '.</p>'
        . '</div>',
        'Unsubscribed',
        [ 'response' => 200 ]
    );
}

// ── Contact form ────────────────────────────────────────────────────────────────

function vp_crm_rest_contact( WP_REST_Request $request ): WP_REST_Response {
    global $wpdb;
    $t = vp_crm_table();

    $ip    = sanitize_text_field( $_SERVER['REMOTE_ADDR'] ?? '' );
    $body  = $request->get_json_params() ?: $request->get_body_params();
    $email   = sanitize_email( $body['email']   ?? '' );
    $name    = sanitize_text_field( $body['name']    ?? '' );
    $message = sanitize_textarea_field( $body['message'] ?? '' );
    $subject_in = sanitize_text_field( $body['subject'] ?? 'General Inquiry' );

    if ( ! is_email( $email ) ) {
        return new WP_REST_Response( [ 'error' => 'Invalid email address.' ], 400 );
    }
    if ( ! $message ) {
        return new WP_REST_Response( [ 'error' => 'Message is required.' ], 400 );
    }

    // Honeypot
    if ( ! empty( $body['website'] ) ) {
        return new WP_REST_Response( [ 'ok' => true ], 200 );
    }

    $data = wp_json_encode( [ 'subject' => $subject_in, 'message' => $message ] );

    $wpdb->insert( $t, [
        'email'      => $email,
        'name'       => $name,
        'type'       => 'contact',
        'source'     => 'contact-form',
        'data'       => $data,
        'status'     => 'active',
        'ip_address' => $ip,
        'confirmed'  => 1,
        'created_at' => current_time( 'mysql' ),
    ], [ '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s' ] );

    // Forward to admin inbox
    $admin_subject = "[Contact] {$subject_in} — {$name} <{$email}>";
    $admin_body    = "<p><strong>From:</strong> {$name} &lt;{$email}&gt;</p>"
        . "<p><strong>Subject:</strong> {$subject_in}</p>"
        . "<hr><p>" . nl2br( esc_html( $message ) ) . "</p>";
    $headers = [
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . vp_crm_from_name() . ' <' . vp_crm_from_email() . '>',
        'Reply-To: ' . $name . ' <' . $email . '>',
    ];
    wp_mail( vp_crm_from_email(), $admin_subject, $admin_body, $headers );

    // Auto-reply to sender
    $auto_reply = "<p>Hi {$name},</p><p>We received your message and will get back to you shortly.</p>"
        . "<p style='color:#7a5c2e;font-size:12px;'>For Research Use Only products — please allow 1–2 business days for a response.</p>";
    wp_mail( $email, 'We received your message — ' . get_bloginfo( 'name' ), vp_crm_newsletter_template( $name, 'Message received', $auto_reply, '#' ), $headers );

    return new WP_REST_Response( [ 'ok' => true ], 201 );
}

// ── Admin list contacts (REST) ─────────────────────────────────────────────────

function vp_crm_rest_list_contacts( WP_REST_Request $request ): WP_REST_Response {
    global $wpdb;
    $t = vp_crm_table();

    $type   = sanitize_text_field( $request->get_param( 'type' )   ?? '' );
    $status = sanitize_text_field( $request->get_param( 'status' ) ?? '' );
    $limit  = min( 200, max( 1, (int) ( $request->get_param( 'limit' ) ?? 50 ) ) );

    $where  = 'WHERE 1=1';
    $values = [];
    if ( $type )   { $where .= ' AND type = %s';   $values[] = $type; }
    if ( $status ) { $where .= ' AND status = %s'; $values[] = $status; }

    $sql   = $values ? $wpdb->prepare( "SELECT * FROM {$t} {$where} ORDER BY created_at DESC LIMIT {$limit}", ...$values )
                     : "SELECT * FROM {$t} {$where} ORDER BY created_at DESC LIMIT {$limit}";
    $rows  = $wpdb->get_results( $sql, ARRAY_A );
    $total = (int) $wpdb->get_var( $values ? $wpdb->prepare( "SELECT COUNT(*) FROM {$t} {$where}", ...$values ) : "SELECT COUNT(*) FROM {$t} {$where}" );

    return new WP_REST_Response( [ 'total' => $total, 'contacts' => $rows ], 200 );
}

// ── Admin delete contact (REST) ────────────────────────────────────────────────

function vp_crm_rest_delete_contact( WP_REST_Request $request ): WP_REST_Response {
    global $wpdb;
    $id = (int) $request->get_param( 'id' );
    $deleted = $wpdb->delete( vp_crm_table(), [ 'id' => $id ], [ '%d' ] );
    return $deleted
        ? new WP_REST_Response( [ 'deleted' => $id ], 200 )
        : new WP_REST_Response( [ 'error' => 'Not found' ], 404 );
}

// ─── WooCommerce order email capture ─────────────────────────────────────────
// Saves the buyer's email into the CRM as type='order' for reference.

add_action( 'woocommerce_checkout_order_processed', 'vp_crm_capture_order_email', 10, 3 );
function vp_crm_capture_order_email( $order_id, $posted_data, $order ) {
    global $wpdb;
    $t = vp_crm_table();

    if ( ! $order instanceof WC_Order ) {
        $order = wc_get_order( $order_id );
    }
    if ( ! $order ) return;

    $email = $order->get_billing_email();
    $name  = trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() );

    if ( ! is_email( $email ) ) return;

    // Don't duplicate — one record per email per type=order
    $exists = $wpdb->get_var( $wpdb->prepare(
        "SELECT id FROM {$t} WHERE email = %s AND type = 'order'",
        $email
    ) );

    if ( $exists ) {
        // Update name if empty
        $wpdb->update( $t, [ 'name' => $name ], [ 'id' => (int) $exists ], [ '%s' ], [ '%d' ] );
        return;
    }

    $data = wp_json_encode( [ 'first_order_id' => $order_id ] );

    $wpdb->insert( $t, [
        'email'      => $email,
        'name'       => $name,
        'type'       => 'order',
        'source'     => 'woocommerce-checkout',
        'data'       => $data,
        'status'     => 'active',
        'ip_address' => sanitize_text_field( $_SERVER['REMOTE_ADDR'] ?? '' ),
        'confirmed'  => 1,
        'created_at' => current_time( 'mysql' ),
    ], [ '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%s' ] );
}
