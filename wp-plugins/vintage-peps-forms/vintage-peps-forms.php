<?php
/**
 * Plugin Name: Vintage Peps Forms
 * Description: Handles contact, newsletter, veterans, and waitlist form submissions. Saves newsletter signups to DB and emails support@vintagepeptides.com.
 * Version: 1.3.0
 */

if (!defined('ABSPATH')) exit;

// ── Email config ──────────────────────────────────────────────────────────────
if (!defined('VINTAGE_PEPS_TO'))          define('VINTAGE_PEPS_TO',          'support@vintagepeptides.com');
if (!defined('VINTAGE_PEPS_FROM'))        define('VINTAGE_PEPS_FROM',        'support@vintagepeptides.com');
if (!defined('VINTAGE_PEPS_FROM_NAME'))   define('VINTAGE_PEPS_FROM_NAME',   'Vintage Peptides');

if (!defined('VINTAGE_PEPS_USE_SMTP'))    define('VINTAGE_PEPS_USE_SMTP',    false);
if (!defined('VINTAGE_PEPS_SMTP_HOST'))   define('VINTAGE_PEPS_SMTP_HOST',   'mail.vintagepeptides.com');
if (!defined('VINTAGE_PEPS_SMTP_PORT'))   define('VINTAGE_PEPS_SMTP_PORT',   587);
if (!defined('VINTAGE_PEPS_SMTP_SECURE')) define('VINTAGE_PEPS_SMTP_SECURE', 'tls');
if (!defined('VINTAGE_PEPS_SMTP_USER'))   define('VINTAGE_PEPS_SMTP_USER',   'support@vintagepeptides.com');
if (!defined('VINTAGE_PEPS_SMTP_PASS'))   define('VINTAGE_PEPS_SMTP_PASS',   '');

// ── DB table name ─────────────────────────────────────────────────────────────
if (!defined('VINTAGE_PEPS_NL_TABLE'))    define('VINTAGE_PEPS_NL_TABLE', 'vintage_peps_newsletter');

// ── Install: create table on plugin activation ────────────────────────────────
register_activation_hook(__FILE__, 'vintage_peps_install');

function vintage_peps_install() {
    global $wpdb;
    $table      = $wpdb->prefix . VINTAGE_PEPS_NL_TABLE;
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS {$table} (
        id          BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        email       VARCHAR(255) NOT NULL,
        signed_up   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ip_address  VARCHAR(45) DEFAULT '',
        PRIMARY KEY  (id),
        UNIQUE KEY email (email)
    ) {$charset_collate};";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);

    add_option('vintage_peps_nl_db_version', '1.0');
}

// ── Also run install if table doesn't exist yet (handles manual uploads) ──────
add_action('plugins_loaded', function () {
    if (get_option('vintage_peps_nl_db_version') !== '1.0') {
        vintage_peps_install();
    }
});

// ── Admin menu ────────────────────────────────────────────────────────────────
add_action('admin_menu', function () {
    add_menu_page(
        'Newsletter Signups',
        'Newsletter Signups',
        'manage_options',
        'vintage-peps-newsletter',
        'vintage_peps_nl_admin_page',
        'dashicons-email-alt',
        30
    );
});

// ── Admin page: list + CSV export ─────────────────────────────────────────────
function vintage_peps_nl_admin_page() {
    global $wpdb;
    $table = $wpdb->prefix . VINTAGE_PEPS_NL_TABLE;

    // CSV export
    if (isset($_GET['vintage_peps_export']) && $_GET['vintage_peps_export'] === 'csv') {
        check_admin_referer('vintage_peps_export_csv');
        $rows = $wpdb->get_results("SELECT email, signed_up, ip_address FROM {$table} ORDER BY signed_up DESC", ARRAY_A);
        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="newsletter-signups-' . date('Y-m-d') . '.csv"');
        header('Pragma: no-cache');
        $out = fopen('php://output', 'w');
        fputcsv($out, ['Email', 'Signed Up', 'IP Address']);
        foreach ($rows as $row) {
            fputcsv($out, [$row['email'], $row['signed_up'], $row['ip_address']]);
        }
        fclose($out);
        exit;
    }

    // Pagination
    $per_page    = 50;
    $current_page = max(1, isset($_GET['paged']) ? intval($_GET['paged']) : 1);
    $offset      = ($current_page - 1) * $per_page;
    $total       = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table}");
    $rows        = $wpdb->get_results(
        $wpdb->prepare("SELECT * FROM {$table} ORDER BY signed_up DESC LIMIT %d OFFSET %d", $per_page, $offset)
    );
    $total_pages = ceil($total / $per_page);

    $export_url = wp_nonce_url(
        admin_url('admin.php?page=valkyrie-newsletter&vintage_peps_export=csv'),
        'vintage_peps_export_csv'
    );
    ?>
    <div class="wrap">
        <h1 style="display:flex;align-items:center;gap:12px;">
            Newsletter Signups
            <span style="font-size:13px;font-weight:400;background:#111;color:#fff;padding:3px 10px;border-radius:20px;"><?php echo number_format($total); ?> total</span>
        </h1>

        <p>
            <a href="<?php echo esc_url($export_url); ?>" class="button button-primary">
                ⬇ Export CSV
            </a>
        </p>

        <?php if (empty($rows)): ?>
            <p style="color:#777;">No signups yet. They will appear here as soon as someone subscribes.</p>
        <?php else: ?>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th style="width:50px;">#</th>
                    <th>Email</th>
                    <th style="width:200px;">Signed Up</th>
                    <th style="width:150px;">IP Address</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($rows as $i => $row): ?>
                <tr>
                    <td style="color:#aaa;"><?php echo $offset + $i + 1; ?></td>
                    <td><strong><?php echo esc_html($row->email); ?></strong></td>
                    <td><?php echo esc_html(
                        date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($row->signed_up))
                    ); ?></td>
                    <td style="color:#aaa;font-size:12px;"><?php echo esc_html($row->ip_address ?: '—'); ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>

        <?php if ($total_pages > 1): ?>
        <div class="tablenav bottom" style="margin-top:12px;">
            <div class="tablenav-pages">
                <?php
                echo paginate_links([
                    'base'      => add_query_arg('paged', '%#%'),
                    'format'    => '',
                    'current'   => $current_page,
                    'total'     => $total_pages,
                ]);
                ?>
            </div>
        </div>
        <?php endif; ?>
        <?php endif; ?>
    </div>
    <?php
}

// ── REST routes ───────────────────────────────────────────────────────────────
add_action('rest_api_init', function () {

    register_rest_route('vintage-peps/v1', '/contact', [
        'methods'             => 'POST',
        'callback'            => 'vintage_peps_handle_contact',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('vintage-peps/v1', '/newsletter', [
        'methods'             => 'POST',
        'callback'            => 'vintage_peps_handle_newsletter',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('vintage-peps/v1', '/veterans', [
        'methods'             => 'POST',
        'callback'            => 'vintage_peps_handle_veterans',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('vintage-peps/v1', '/waitlist', [
        'methods'             => 'POST',
        'callback'            => 'vintage_peps_handle_waitlist',
        'permission_callback' => '__return_true',
    ]);
});

// ── CORS headers ──────────────────────────────────────────────────────────────
add_action('rest_api_init', function () {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function ($value) {
        $origin  = get_http_origin();
        $allowed = ['https://vintagepeptides.com', 'https://www.vintagepeptides.com'];
        if (in_array($origin, $allowed, true)) {
            header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
        }
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        return $value;
    });
}, 15);

add_action('init', function () {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS' &&
        strpos($_SERVER['REQUEST_URI'], '/wp-json/valkyrie/') !== false) {
        $origin  = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        $allowed = ['https://vintagepeptides.com', 'https://www.vintagepeptides.com'];
        if (in_array($origin, $allowed, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
        }
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        header('Access-Control-Max-Age: 86400');
        status_header(204);
        exit;
    }
});

// ── SMTP ──────────────────────────────────────────────────────────────────────
if (VINTAGE_PEPS_USE_SMTP) {
    add_action('phpmailer_init', function ($phpmailer) {
        $phpmailer->isSMTP();
        $phpmailer->Host       = VINTAGE_PEPS_SMTP_HOST;
        $phpmailer->SMTPAuth   = true;
        $phpmailer->Port       = VINTAGE_PEPS_SMTP_PORT;
        $phpmailer->SMTPSecure = VINTAGE_PEPS_SMTP_SECURE;
        $phpmailer->Username   = VINTAGE_PEPS_SMTP_USER;
        $phpmailer->Password   = VINTAGE_PEPS_SMTP_PASS;
    });
}

// ── Force FROM address ────────────────────────────────────────────────────────
add_filter('wp_mail_from',      function () { return VINTAGE_PEPS_FROM; });
add_filter('wp_mail_from_name', function () { return VINTAGE_PEPS_FROM_NAME; });

// ── Helpers ───────────────────────────────────────────────────────────────────
if (!function_exists('vintage_peps_get_post_data')) {
    function vintage_peps_get_post_data(WP_REST_Request $req) {
        $json = $req->get_json_params();
        if (!empty($json)) return $json;
        return $req->get_body_params();
    }
}

if (!function_exists('vintage_peps_send')) {
    function vintage_peps_send($subject, $body, $reply_to = '') {
        $headers = [
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . VINTAGE_PEPS_FROM_NAME . ' <' . VINTAGE_PEPS_FROM . '>',
        ];
        if ($reply_to && is_email($reply_to)) {
            $headers[] = 'Reply-To: ' . $reply_to;
        }
        return wp_mail(VINTAGE_PEPS_TO, $subject, vintage_peps_email_wrap($subject, nl2br(esc_html($body))), $headers);
    }
}

if (!function_exists('vintage_peps_email_wrap')) {
    function vintage_peps_email_wrap($title, $content) {
        $from_name  = VINTAGE_PEPS_FROM_NAME;
        $from_email = VINTAGE_PEPS_FROM;
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{$title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border:1px solid #e0e0e0;">
        <tr>
          <td style="background:#111111;padding:20px 32px;">
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;font-family:Arial,sans-serif;">
              VALKYRIE PEPTIDES
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;color:#333333;font-size:14px;line-height:1.7;">
            <p style="margin:0 0 20px 0;font-size:16px;font-weight:bold;color:#111111;border-bottom:2px solid #111111;padding-bottom:12px;">{$title}</p>
            <div style="background:#f8f7f5;border-left:4px solid #111111;padding:16px 20px;font-family:Courier New,monospace;font-size:13px;line-height:1.8;color:#333;white-space:pre-wrap;">{$content}</div>
          </td>
        </tr>
        <tr>
          <td style="background:#f5f4f2;padding:16px 32px;border-top:1px solid #e0e0e0;">
            <p style="margin:0;font-size:11px;color:#aaaaaa;text-align:center;line-height:1.6;">
              {$from_name} &nbsp;·&nbsp; {$from_email} &nbsp;·&nbsp; (208) 243-9222
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
}

if (!function_exists('vintage_peps_ok')) {
    function vintage_peps_ok() {
        return new WP_REST_Response(['success' => true], 200);
    }
}

if (!function_exists('vintage_peps_err')) {
    function vintage_peps_err($msg, $code = 400) {
        return new WP_REST_Response(['success' => false, 'message' => $msg], $code);
    }
}

// ── Form handlers ─────────────────────────────────────────────────────────────

if (!function_exists('vintage_peps_handle_contact')) {
    function vintage_peps_handle_contact(WP_REST_Request $req) {
        $d = vintage_peps_get_post_data($req);

        $name    = sanitize_text_field(isset($d['name'])    ? $d['name']    : '');
        $email   = sanitize_email(isset($d['email'])        ? $d['email']   : '');
        $phone   = sanitize_text_field(isset($d['phone'])   ? $d['phone']   : '');
        $subject = sanitize_text_field(isset($d['subject']) ? $d['subject'] : 'General Inquiry');
        $message = sanitize_textarea_field(isset($d['message']) ? $d['message'] : '');

        if (!$name || !$email || !$message) {
            return vintage_peps_err('Missing required fields.');
        }

        $body  = "NEW CONTACT FORM SUBMISSION\n";
        $body .= "===========================\n\n";
        $body .= "Name:    $name\n";
        $body .= "Email:   $email\n";
        $body .= "Phone:   " . ($phone ?: '—') . "\n";
        $body .= "Subject: $subject\n\n";
        $body .= "Message:\n$message\n";

        vintage_peps_send("Contact: $subject — $name", $body, $email);
        return vintage_peps_ok();
    }
}

if (!function_exists('vintage_peps_handle_newsletter')) {
    function vintage_peps_handle_newsletter(WP_REST_Request $req) {
        global $wpdb;
        $d     = vintage_peps_get_post_data($req);
        $email = sanitize_email(isset($d['email']) ? $d['email'] : '');

        if (!$email) return vintage_peps_err('Email required.');

        // Save to DB (ignore duplicates)
        $table = $wpdb->prefix . VINTAGE_PEPS_NL_TABLE;
        $ip    = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field($_SERVER['REMOTE_ADDR']) : '';

        $wpdb->query(
            $wpdb->prepare(
                "INSERT IGNORE INTO {$table} (email, signed_up, ip_address) VALUES (%s, %s, %s)",
                $email,
                current_time('mysql'),
                $ip
            )
        );

        // Still send notification email
        $body  = "NEW NEWSLETTER SIGNUP\n";
        $body .= "=====================\n\n";
        $body .= "Email: $email\n";
        $body .= "Date:  " . current_time('mysql') . "\n";

        vintage_peps_send("Newsletter Signup: $email", $body);
        return vintage_peps_ok();
    }
}

if (!function_exists('vintage_peps_handle_veterans')) {
    function vintage_peps_handle_veterans(WP_REST_Request $req) {
        $d = vintage_peps_get_post_data($req);

        $name    = sanitize_text_field(isset($d['name'])    ? $d['name']    : '');
        $email   = sanitize_email(isset($d['email'])        ? $d['email']   : '');
        $branch  = sanitize_text_field(isset($d['branch'])  ? $d['branch']  : '');
        $role    = sanitize_text_field(isset($d['role'])     ? $d['role']    : '');
        $message = sanitize_textarea_field(isset($d['message']) ? $d['message'] : '');

        if (!$name || !$email) return vintage_peps_err('Missing required fields.');

        $body  = "NEW VETERANS DISCOUNT REQUEST\n";
        $body .= "==============================\n\n";
        $body .= "Name:           $name\n";
        $body .= "Email:          $email\n";
        $body .= "Service Branch: " . ($branch ?: '—') . "\n";
        $body .= "Role:           " . ($role   ?: '—') . "\n";
        if ($message) $body .= "\nAdditional Info:\n$message\n";

        vintage_peps_send("Veterans Discount: $name", $body, $email);
        return vintage_peps_ok();
    }
}

if (!function_exists('vintage_peps_handle_waitlist')) {
    function vintage_peps_handle_waitlist(WP_REST_Request $req) {
        $d = vintage_peps_get_post_data($req);

        $email   = sanitize_email(isset($d['email'])     ? $d['email']   : '');
        $product = sanitize_text_field(isset($d['product']) ? $d['product'] : 'Unknown product');

        if (!$email) return vintage_peps_err('Email required.');

        $body  = "NEW WAITLIST SIGNUP\n";
        $body .= "===================\n\n";
        $body .= "Email:   $email\n";
        $body .= "Product: $product\n";
        $body .= "Date:    " . current_time('mysql') . "\n";

        vintage_peps_send("Waitlist: $product — $email", $body);
        return vintage_peps_ok();
    }
}
