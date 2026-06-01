<?php
/**
 * Plugin Name: Vintage Peps Router
 * Plugin URI:  https://vintagepeptides.com
 * Description: Serves the React/Vite frontend for every public request. Put your dist/ files in the plugin's own app/ folder — no .htaccess, no index.php changes needed.
 * Version:     1.1.0
 * Author:      Vintage Peptides
 * Text Domain: vintage-peps-router
 * Requires WP: 6.0
 * Requires PHP: 8.0
 */

defined( 'ABSPATH' ) || exit;

define( 'VPROUTER_VERSION', '1.1.0' );
define( 'VPROUTER_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'VPROUTER_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// ── Where to look for index.html (in order) ───────────────────────────────────
// 1. plugin folder:  wp-content/plugins/vintage-peps-router/app/index.html  ← RECOMMENDED
// 2. uploads folder: wp-content/uploads/vintage-peps-app/index.html
// 3. wp-config.php override: define('VPROUTER_APP_DIR', '/absolute/path');
//                             define('VPROUTER_APP_URL', 'https://site.com/path');

function vprouter_find_app(): array {
    $candidates = [];

    // 1. Plugin's own app/ subfolder — always resolves correctly
    $candidates[] = [
        'dir' => rtrim( VPROUTER_PLUGIN_DIR, '/' ) . '/app',
        'url' => rtrim( VPROUTER_PLUGIN_URL, '/' ) . '/app',
        'label' => 'Plugin folder (wp-content/plugins/vintage-peps-router/app/)',
    ];

    // 2. wp-content/uploads/vintage-peps-app/
    $candidates[] = [
        'dir' => rtrim( WP_CONTENT_DIR, '/' ) . '/uploads/vintage-peps-app',
        'url' => rtrim( WP_CONTENT_URL, '/' ) . '/uploads/vintage-peps-app',
        'label' => 'Uploads folder (wp-content/uploads/vintage-peps-app/)',
    ];

    // 3. wp-config.php override
    if ( defined('VPROUTER_APP_DIR') && defined('VPROUTER_APP_URL') ) {
        $candidates[] = [
            'dir'   => VPROUTER_APP_DIR,
            'url'   => VPROUTER_APP_URL,
            'label' => 'wp-config.php override',
        ];
    }

    // Return first one that has an index.html
    foreach ( $candidates as $c ) {
        if ( file_exists( $c['dir'] . '/index.html' ) ) {
            $c['found'] = true;
            return $c;
        }
    }

    // Nothing found — return all candidates so admin can see what was checked
    return [ 'found' => false, 'candidates' => $candidates ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Head tag injection — analytics, verification, etc.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns HTML to inject just before </head> on every page.
 * Add/remove tags here as needed — no touching index.html.
 */
function vprouter_get_head_inject(): string {
    $tags = [];

    // Google Search Console verification
    $tags[] = '<meta name="google-site-verification" content="1v0ZNj7PP9dwvc2P70jTyw1FM8dxj6eC4TLZYG28tEc" />';

    // ── Google Analytics 4 ────────────────────────────────────────────────
    // Paste your Measurement ID (GA4 Admin → Data Streams → Measurement ID)
    $ga4_id = defined('VPROUTER_GA4_ID') ? VPROUTER_GA4_ID : '';  // set in wp-config.php: define('VPROUTER_GA4_ID','G-XXXXXXXXXX');
    if ( $ga4_id ) {
        $ga4_id = esc_attr( $ga4_id );
        $tags[] = <<<HTML
  <script async src="https://www.googletagmanager.com/gtag/js?id={$ga4_id}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '{$ga4_id}');
  </script>
HTML;
    }

    // ── Google Tag Manager ────────────────────────────────────────────────
    // Alternative to GA4 direct. Set in wp-config.php: define('VPROUTER_GTM_ID','GTM-XXXXXXX');
    $gtm_id = defined('VPROUTER_GTM_ID') ? VPROUTER_GTM_ID : '';
    if ( $gtm_id ) {
        $gtm_id = esc_attr( $gtm_id );
        $tags[] = <<<HTML
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','{$gtm_id}');</script>
HTML;
    }

    return implode( "
  ", $tags );
}

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────
class VPROUTER_Router {

    public static function init() {
        add_action( 'parse_request', [ __CLASS__, 'maybe_serve_app' ], 1 );
    }

    public static function maybe_serve_app() {
        $request_uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path        = strtok( $request_uri, '?' );

        // ── Redirect /product/:slug → /products/:slug (old WP URLs) ────────────
        if ( preg_match( '#^/product/([^/?]+)#', $path, $m ) ) {
            $qs = isset( $_SERVER['QUERY_STRING'] ) && $_SERVER['QUERY_STRING'] !== ''
                ? '?' . $_SERVER['QUERY_STRING'] : '';
            header( 'Location: /products/' . rawurlencode( $m[1] ) . $qs, true, 301 );
            exit;
        }

        // ── Pass-through rules ────────────────────────────────────────────────
        if ( str_starts_with( $path, '/wp-admin' ) )  return;
        if ( str_starts_with( $path, '/wp-login' ) )  return;
        if ( str_starts_with( $path, '/wp-json' ) )         return;  // FIX: was '/wp-json/' — missed requests to /wp-json (no trailing slash)
        if ( str_contains( $request_uri, 'rest_route=' ) )  return;  // FIX: was $path — query string was stripped by strtok so this never matched
        if ( preg_match( '#/wp-(cron|signup|activate|comments-post|mail|trackback)\.php#', $path ) ) return;
        if ( str_contains( $path, 'xmlrpc.php' ) )    return;
        if ( isset( $_GET['wc-ajax'] ) )               return;

        // Static files that physically exist — let server handle them
        $abs = rtrim( ABSPATH, '/' ) . $path;
        if ( $path !== '/' && file_exists( $abs ) && ! is_dir( $abs ) ) return;

        // ── Find and serve the app ────────────────────────────────────────────
        $app = vprouter_find_app();

        if ( empty( $app['found'] ) ) {
            self::render_not_deployed( $app['candidates'] ?? [] );
            exit;
        }

        self::serve_index( $app['dir'] . '/index.html', $app['url'] );
        exit;
    }

    private static function serve_index( string $index_path, string $app_url ) {
        $html = file_get_contents( $index_path );

        // FIX: Use root-relative path (no domain) so assets load correctly on
        // both vintagepeptides.com AND www.vintagepeptides.com without CORS errors.
        // Absolute URLs hardcode the domain and get blocked by the browser when the
        // page is served from the www subdomain (treated as a different origin).
        $app_path = rtrim( parse_url( $app_url, PHP_URL_PATH ), '/' );

        // Fix asset paths — replace relative /assets/ with root-relative app path
        $html = preg_replace_callback(
            '#(src|href)="(/[^"]*\.(?:js|css|png|jpg|jpeg|gif|webp|svg|woff2?|ttf|ico))"#',
            function( $m ) use ( $app_path ) {
                return $m[1] . '="' . $app_path . $m[2] . '"';
            },
            $html
        );

        // Also fix <link rel="modulepreload"> and similar
        $html = preg_replace_callback(
            '#(href)="(/assets/[^"]+)"#',
            function( $m ) use ( $app_path ) {
                return $m[1] . '="' . $app_path . $m[2] . '"';
            },
            $html
        );

        // ── Inject <head> tags before </head> ────────────────────────────────
        $inject = vprouter_get_head_inject();
        if ( $inject ) {
            $html = str_replace( '</head>', $inject . "
  </head>", $html );
        }

        header( 'Content-Type: text/html; charset=utf-8' );
        header( 'Cache-Control: no-store, no-cache, must-revalidate' );
        status_header( 200 );

        echo $html;
    }

    private static function render_not_deployed( array $candidates ) {
        status_header( 503 );
        header( 'Content-Type: text/html; charset=utf-8' );

        $list = '';
        foreach ( $candidates as $c ) {
            $list .= '<li><code>' . htmlspecialchars( $c['dir'] . '/index.html' ) . '</code> — not found</li>';
        }

        echo '<!DOCTYPE html><html><head><meta charset="utf-8">
        <title>Valkyrie — App Not Deployed</title>
        <style>
          body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#111;color:#fff;}
          .box{max-width:560px;padding:48px;}
          h1{font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:-.02em;margin:0 0 12px;}
          p{color:#888;font-size:14px;line-height:1.6;margin:0 0 16px;}
          ul{color:#666;font-size:13px;line-height:2;padding-left:20px;}
          code{background:#222;padding:2px 6px;border-radius:3px;font-size:12px;}
          .hint{background:#1a1a1a;border:1px solid #333;padding:16px;border-radius:4px;font-size:13px;color:#aaa;line-height:1.8;}
        </style></head>
        <body><div class="box">
          <h1>Vintage Peptides</h1>
          <p>React app not found. Checked these locations:</p>
          <ul>' . $list . '</ul>
          <div class="hint">
            ✅ <strong>Easiest fix:</strong><br>
            Upload <code>index.html</code> and the <code>assets/</code> folder into:<br>
            <code>wp-content/plugins/vintage-peps-router/app/</code>
          </div>
        </div></body></html>';
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin panel
// ─────────────────────────────────────────────────────────────────────────────
class VPROUTER_Admin {

    public static function init() {
        add_action( 'admin_menu',    [ __CLASS__, 'register_page' ] );
        add_action( 'admin_notices', [ __CLASS__, 'show_notices' ] );
    }

    public static function register_page() {
        add_menu_page(
            'Vintage Peps Frontend',
            'Vintage Peps Frontend',
            'manage_options',
            'vintage-peps-router',
            [ __CLASS__, 'render_page' ],
            'dashicons-admin-site-alt3',
            55
        );
    }

    public static function render_page() {
        $app         = vprouter_find_app();
        $deployed    = ! empty( $app['found'] );
        $plugin_app  = rtrim( VPROUTER_PLUGIN_DIR, '/' ) . '/app';
        $plugin_url  = rtrim( VPROUTER_PLUGIN_URL, '/' ) . '/app';

        // Count assets if deployed
        $asset_count = 0;
        $index_age   = '—';
        if ( $deployed ) {
            $index_file  = $app['dir'] . '/index.html';
            $index_age   = human_time_diff( filemtime( $index_file ) ) . ' ago';
            if ( is_dir( $app['dir'] . '/assets' ) ) {
                $asset_count = count( glob( $app['dir'] . '/assets/*' ) );
            }
        }

        // Handle import action
        $import_results = null;
        if (
            isset( $_POST['vprouter_import_tabs'] ) &&
            check_admin_referer( 'vprouter_import_tabs' )
        ) {
            $import_results = vprouter_run_tab_import();
        }

        // Handle bulk product create action
        $bulk_create_results = null;
        if (
            isset( $_POST['vprouter_bulk_create'] ) &&
            check_admin_referer( 'vprouter_bulk_create' )
        ) {
            $bulk_create_results = vprouter_bulk_create_products();
        }
        ?>
        <div class="wrap">
            <h1>🛡 Vintage Peps Frontend Router <span style="font-size:13px;font-weight:400;color:#888;">v<?php echo VPROUTER_VERSION; ?></span></h1>

            <!-- Product Tabs Import -->
            <div style="background:#fff;border:1px solid #e0e0e0;padding:24px;max-width:640px;margin:20px 0 0;border-radius:4px;">
                <h2 style="margin-top:0;">Product Tabs — CSV Import</h2>
                <p style="font-size:13px;color:#555;margin:0 0 16px;">
                    Writes COA images and Additional Information into WooCommerce product meta for all products.
                    Run this once after first install, or again any time the CSV data changes.
                </p>

                <?php if ( $import_results !== null ) : ?>
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:4px;margin-bottom:16px;">
                        <p style="font-weight:700;color:#166534;margin:0 0 10px;">Import complete!</p>
                        <?php foreach ( $import_results as $r ) :
                            $color = $r['ok'] ? '#15803d' : '#b45309'; ?>
                            <div style="font-family:monospace;font-size:12px;color:<?php echo $color; ?>;margin-bottom:3px;">
                                <?php echo $r['ok'] ? '✅' : '⚠️'; ?> <?php echo esc_html( $r['msg'] ); ?>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>

                <form method="post">
                    <?php wp_nonce_field( 'vprouter_import_tabs' ); ?>
                    <input type="hidden" name="vprouter_import_tabs" value="1">
                    <button type="submit" class="button button-primary" style="font-size:14px;height:38px;padding:0 20px;">
                        ▶ Run Product Tabs Import
                    </button>
                </form>
            </div>

            <!-- Bulk Create New Products -->
            <div style="background:#fff;border:1px solid #e0e0e0;padding:24px;max-width:640px;margin:20px 0 0;border-radius:4px;">
                <h2 style="margin-top:0;">🆕 Bulk Create New Products</h2>
                <p style="font-size:13px;color:#555;margin:0 0 6px;">
                    Creates the following new WooCommerce products (skips any that already exist by slug):
                </p>
                <ul style="font-size:12px;color:#444;margin:0 0 16px;line-height:1.9;">
                    <li>Thymosin Alpha-1 — 10mg/Vial — <strong>$85</strong></li>
                    <li>Hexarelin — 10mg/Vial — <strong>$120</strong></li>
                    <li>Oxytocin — 5mg/Vial — <strong>$60</strong></li>
                    <li>Kisspeptin-10 — 10mg/Vial — <strong>$70</strong></li>
                    <li>AOD-9604 — 5mg/Vial — <strong>$65</strong></li>
                    <li>Melanotan II — 10mg/Vial — <strong>$50</strong> <em>(renames &amp; updates draft Melanotan I if found)</em></li>
                </ul>
                <p style="font-size:12px;color:#888;margin:0 0 16px;">
                    After running, copy the returned product IDs back into <code>vprouter_get_tab_data()</code> to enable the tab import for these products.
                </p>

                <?php if ( $bulk_create_results !== null ) : ?>
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:4px;margin-bottom:16px;">
                        <p style="font-weight:700;color:#166534;margin:0 0 10px;">Bulk create complete!</p>
                        <?php foreach ( $bulk_create_results as $r ) :
                            $color = $r['ok'] ? '#15803d' : '#b45309'; ?>
                            <div style="font-family:monospace;font-size:12px;color:<?php echo $color; ?>;margin-bottom:3px;">
                                <?php echo $r['ok'] ? '✅' : '⚠️'; ?> <?php echo esc_html( $r['msg'] ); ?>
                            </div>
                        <?php endforeach; ?>
                        <p style="font-size:11px;color:#555;margin:12px 0 0;">
                            ☝️ Copy the product IDs above into <code>vprouter_get_tab_data()</code> then run Product Tabs Import.
                        </p>
                    </div>
                <?php endif; ?>

                <form method="post">
                    <?php wp_nonce_field( 'vprouter_bulk_create' ); ?>
                    <input type="hidden" name="vprouter_bulk_create" value="1">
                    <button type="submit" class="button button-primary" style="font-size:14px;height:38px;padding:0 20px;background:#0ea5e9;border-color:#0284c7;">
                        🚀 Create All 6 New Products in WooCommerce
                    </button>
                </form>
            </div>
            <div style="background:#fff;border:1px solid #e0e0e0;padding:24px;max-width:640px;margin:20px 0 0;border-radius:4px;">
                <h2 style="margin-top:0;">Status</h2>
                <?php if ( $deployed ) : ?>
                    <p style="color:#16a34a;font-weight:700;font-size:15px;margin:0 0 12px;">✅ App is deployed and serving</p>
                    <table class="form-table" style="margin:0;">
                        <tr><th style="width:140px;">Location</th><td><code><?php echo esc_html( $app['label'] ); ?></code></td></tr>
                        <tr><th>Directory</th><td><code><?php echo esc_html( $app['dir'] ); ?></code></td></tr>
                        <tr><th>index.html</th><td>Updated <?php echo esc_html( $index_age ); ?></td></tr>
                        <tr><th>Asset files</th><td><?php echo (int) $asset_count; ?> files in <code>/assets/</code></td></tr>
                    </table>
                <?php else : ?>
                    <p style="color:#dc2626;font-weight:700;font-size:15px;margin:0 0 12px;">❌ No app found — WordPress theme is showing instead</p>
                    <p style="color:#555;font-size:13px;margin:0 0 8px;">Looked in these locations (none had index.html):</p>
                    <ul style="font-size:13px;color:#666;line-height:2;">
                        <?php foreach ( $app['candidates'] as $c ) : ?>
                        <li><code><?php echo esc_html( $c['dir'] ); ?></code></li>
                        <?php endforeach; ?>
                    </ul>
                <?php endif; ?>
            </div>

            <!-- Deploy instructions -->
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:24px;max-width:640px;margin:16px 0 0;border-radius:4px;">
                <h2 style="margin-top:0;color:#166534;">⭐ Recommended: Deploy into the plugin folder</h2>
                <p style="font-size:13px;color:#166534;margin-bottom:12px;">This path <strong>always resolves correctly</strong> on GoDaddy — no server path guessing.</p>
                <ol style="font-size:13px;color:#444;line-height:2.2;">
                    <li>Build: <code>BASE_PATH=/wp-content/plugins/vintage-peps-router/app/ npm run build</code></li>
                    <li>In GoDaddy cPanel File Manager go to:<br>
                        <code>public_html/wp-content/plugins/vintage-peps-router/</code></li>
                    <li>Create a folder named <code>app</code></li>
                    <li>Upload <strong>index.html</strong> and the <strong>assets/</strong> folder into it</li>
                    <li>Reload your site ✅</li>
                </ol>
                <p style="font-size:12px;background:#dcfce7;border:1px solid #86efac;padding:10px;border-radius:3px;margin-top:8px;">
                    Full path on server: <code><?php echo esc_html( $plugin_app ); ?></code><br>
                    Assets URL base: <code><?php echo esc_html( $plugin_url ); ?></code>
                </p>
            </div>

            <!-- Alt: uploads folder -->
            <div style="background:#f8f7f5;border:1px solid #e0e0e0;padding:24px;max-width:640px;margin:16px 0 0;border-radius:4px;">
                <h2 style="margin-top:0;">Alternative: Use the uploads folder</h2>
                <ol style="font-size:13px;color:#444;line-height:2.2;">
                    <li>Build: <code>BASE_PATH=/wp-content/uploads/vintage-peps-app/ npm run build</code></li>
                    <li>Go to: <code>public_html/wp-content/uploads/</code></li>
                    <li>Create folder <code>vintage-peps-app</code>, upload <code>index.html</code> + <code>assets/</code></li>
                </ol>
            </div>

            <!-- Pass-through rules -->
            <div style="background:#f8f7f5;border:1px solid #e0e0e0;padding:24px;max-width:640px;margin:16px 0 0;border-radius:4px;">
                <h2 style="margin-top:0;">What bypasses the React app</h2>
                <ul style="font-size:13px;color:#444;line-height:2;">
                    <li><code>/wp-admin/*</code> — WordPress admin panel</li>
                    <li><code>/wp-login.php</code> — Login</li>
                    <li><code>/wp-json/*</code> — REST API (WooCommerce + Vintage Peps CMS)</li>
                    <li><code>?wc-ajax=*</code> — WooCommerce AJAX</li>
                    <li>Any static file that exists on disk (images, fonts, etc.)</li>
                </ul>
            </div>
        </div>
        <?php
    }

    public static function show_notices() {
        $screen = get_current_screen();
        if ( ! $screen ) return;

        $app = vprouter_find_app();
        if ( empty( $app['found'] ) && strpos( $screen->id, 'vintage-peps-router' ) !== false ) {
            $plugin_path = rtrim( VPROUTER_PLUGIN_DIR, '/' ) . '/app/index.html';
            echo '<div class="notice notice-error"><p>
                <strong>Valkyrie Router:</strong> React app not deployed. 
                Upload <code>index.html</code> + <code>assets/</code> to 
                <code>' . esc_html( dirname( $plugin_path ) ) . '/</code>
            </p></div>';
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Product Tabs — meta registration + importer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Expose _vintage_peps_coa_images and _vintage_peps_additional_info in the
 * WooCommerce REST API response so the React app can read them.
 */
add_filter( 'woocommerce_rest_prepare_product_object', function( $response, $object ) {
    $id   = $object->get_id();
    $coa  = get_post_meta( $id, '_vintage_peps_coa_images',      true );
    $info = get_post_meta( $id, '_vintage_peps_additional_info', true );
    $purity_pdf    = get_post_meta( $id, '_vintage_peps_coa_purity_pdf',    true );
    $endotoxin_pdf = get_post_meta( $id, '_vintage_peps_coa_endotoxin_pdf', true );

    $data = $response->get_data();
    $meta = $data['meta_data'] ?? [];

    if ( $coa )           $meta[] = [ 'key' => '_vintage_peps_coa_images',         'value' => $coa ];
    if ( $info )          $meta[] = [ 'key' => '_vintage_peps_additional_info',    'value' => $info ];
    if ( $purity_pdf )    $meta[] = [ 'key' => '_vintage_peps_coa_purity_pdf',     'value' => $purity_pdf ];
    if ( $endotoxin_pdf ) $meta[] = [ 'key' => '_vintage_peps_coa_endotoxin_pdf',  'value' => $endotoxin_pdf ];

    $data['meta_data'] = $meta;
    $response->set_data( $data );
    return $response;
}, 10, 2 );

/**
 * All 27 products from product_tabs_full_content.csv.
 * Key = WooCommerce product ID.
 */
function vprouter_get_tab_data(): array {
    return [
        133  => [ 'name' => 'TESAMORELIN – 10MG', 'coa' => [ 'https://vintagepeptides.com/wp-content/uploads/2024/09/1773253842237-3b359788-7187-42c5-a47b-b9efd3fab57b_1.jpg', 'https://vintagepeptides.com/wp-content/uploads/2024/09/1773253842237-3b359788-7187-42c5-a47b-b9efd3fab57b_2.jpg' ], 'info' => 'Tesamorelin — GHRH Analogue for Endocrine & Metabolic Research. Tesamorelin is a synthetic growth hormone–releasing hormone (GHRH) analogue widely examined in laboratory research for its role in growth hormone (GH) axis signaling and systemic metabolic regulation. Vintage Peptides supplies Tesamorelin as a lyophilized research-grade compound. Research areas: Mechanisms governing GH-axis stimulation and downstream IGF-1 signaling | Metabolic regulation involving lipid mobilization and energy-balance pathways | Endocrine-driven changes in tissue composition | Interactions between GH signaling and neuronal or cognitive pathways. Format: Lyophilized powder. For laboratory research use only.' ],
        124  => [ 'name' => 'GLP-3 (RT) – 30MG', 'coa' => [ 'https://vintagepeptides.com/wp-content/uploads/2024/09/VP-4892263-Retatrutide-Purity_page-0001.jpg', 'https://vintagepeptides.com/wp-content/uploads/2024/09/VP-4892263-Retatrutide-Purity_page-0002.jpg' ], 'info' => 'GLP-3 (RT) — Multi-Receptor Research Peptide. GLP-3 (RT) (also referenced as GLP3-RTA or LY-3437943) is a synthetic research peptide evaluated in advanced metabolic and endocrine signaling models. Characterised by interaction with GLP-1, GIP, and glucagon receptor pathways. Provided as lyophilized powder by Vintage Peptides. For laboratory research use only.' ],
        128  => [ 'name' => 'NAD+ – 500MG', 'coa' => [ 'https://vintagepeptides.com/wp-content/uploads/2024/09/VP-6801827-NAD-Purity-images-0-scaled.jpg', 'https://vintagepeptides.com/wp-content/uploads/2024/09/VP-6801827-NAD-Purity-images-1-scaled.jpg' ], 'info' => 'NAD+ (Nicotinamide Adenine Dinucleotide) — Cellular Energy & Redox Research Compound (500 mg). NAD+ is a fundamental coenzyme widely examined for its central role in cellular energy metabolism and oxidation-reduction (redox) signaling. Research areas: Electron-transfer reactions essential to metabolic flux | Regulation of oxidative and reductive states within cells | Support of enzymatic pathways tied to cellular repair and adaptation | Mechanisms underlying metabolic resilience and energy-production efficiency. Format: 500 mg lyophilized powder. For laboratory research use only.' ],
        131  => [ 'name' => 'GHK-Cu – 100MG', 'coa' => [ 'https://vintagepeptides.com/wp-content/uploads/2024/09/VP-4215641-GHK-Cu-Purity-images-0-scaled.jpg', 'https://vintagepeptides.com/wp-content/uploads/2024/09/VP-4215641-GHK-Cu-Purity-images-1-scaled.jpg' ], 'info' => 'GHK-Cu — Copper Tripeptide Research Compound. GHK-Cu is a copper-binding tripeptide complex widely examined in laboratory research for its involvement in extracellular matrix (ECM) signaling, cellular repair pathways, and redox-related biological processes. Research areas: Gene-expression patterns related to tissue repair and remodeling | Cellular migration and structural adaptation within connective-tissue models | Mechanisms underlying inflammation resolution and antioxidant defense | Cutaneous regeneration pathways and ECM-driven cellular communication. Format: Lyophilized powder. For laboratory research use only.' ],
        135  => [ 'name' => 'GLOW – 70MG', 'coa' => [ 'https://vintagepeptides.com/wp-content/uploads/2024/09/VP-1143805-GLOW-Purity_page-0001.jpg', 'https://vintagepeptides.com/wp-content/uploads/2024/09/VP-1143805-GLOW-Purity_page-0002.jpg', 'https://vintagepeptides.com/wp-content/uploads/2024/09/VP-1143805-GLOW-Purity_page-0003.jpg', 'https://vintagepeptides.com/wp-content/uploads/2024/09/VP-1143805-GLOW-Purity_page-0004.jpg', 'https://vintagepeptides.com/wp-content/uploads/2024/09/VP-1143805-GLOW-Purity_page-0005.jpg', 'https://vintagepeptides.com/wp-content/uploads/2024/09/VP-1143805-GLOW-Purity_page-0006.jpg' ], 'info' => 'GLOW — Multi-Component Research Peptide Blend (GHK-Cu 50mg + TB-500 10mg + BPC-157 10mg). Total 70mg per vial in lyophilized form. Components: GHK-Cu (50mg) — fibroblast activation, ECM regulation, antioxidant activity, gene-expression patterns linked to tissue remodeling | TB-500 (10mg) — cellular migration, structural recovery, cytoskeletal organization within soft-tissue models | BPC-157 (10mg) — microvascular signaling, inflammatory modulation, gastrointestinal or connective-tissue repair pathways. Format: Lyophilized powder. For laboratory research use only.' ],
        137  => [ 'name' => 'WOLVERINE – 20MG', 'coa' => [], 'info' => 'WOLVERINE — Dual-Peptide Research Blend (BPC-157 10mg + TB-500 10mg). Total 20mg per vial in lyophilized form. BPC-157 (10mg) — gastric-derived pentadecapeptide studied for angiogenic and microvascular signaling, collagen organization and ECM stability, inflammatory-pathway modulation and cytokine balance, epithelial integrity and nitric-oxide–related signaling. TB-500 (10mg) — synthetic fragment of thymosin beta-4, examined for actin-mediated cell migration and cytoskeletal organization, soft-tissue signaling and structural recovery, ECM remodeling and tissue-repair dynamics. Format: Lyophilized powder. For laboratory research use only.' ],
        139  => [ 'name' => 'MOTS-C – 10MG', 'coa' => [ 'https://vintagepeptides.com/wp-content/uploads/2024/09/VP-8066324-MOTS-c-Purity-images-0-scaled.jpg', 'https://vintagepeptides.com/wp-content/uploads/2024/09/VP-8066324-MOTS-c-Purity-images-1-scaled.jpg' ], 'info' => 'MOTS-C — Mitochondria-Derived Research Peptide. MOTS-C is a mitochondria-encoded peptide widely examined in laboratory research for its role in cellular energy regulation, metabolic signaling, and stress-response pathways. Research areas: AMPK-related signaling and downstream metabolic pathways | Mechanisms of mitochondrial communication and peptide-mediated regulation | Cellular responses to metabolic stress, nutrient shifts, and aging-related signaling | Bioenergetic adaptations associated with exercise-mimetic models. Format: Lyophilized powder. For laboratory research use only.' ],
        5397 => [ 'name' => 'Sermorelin – 10MG', 'coa' => [ 'https://vintagepeptides.com/wp-content/uploads/2026/03/VP-9912173-Sermorelin-Purity_page-0001.jpg', 'https://vintagepeptides.com/wp-content/uploads/2026/03/VP-9912173-Sermorelin-Purity_page-0002.jpg' ], 'info' => 'Sermorelin (GHRH 1-29) — Growth Hormone Axis Research Peptide. Sermorelin is a synthetic analogue of GHRH fragment 1-29, widely utilized in controlled research settings to investigate pituitary-driven GH signaling. Its activity is defined by selective interaction with GHRH receptors, initiating downstream pathways associated with physiological, pulsatile GH secretion. Format: 10mg lyophilized powder. For laboratory research use only.' ],
        5398 => [ 'name' => 'CJC-1295+Ipamorelin – 10MG', 'coa' => [ 'https://vintagepeptides.com/wp-content/uploads/2026/03/VP-9271992-CJC-1295-no-DAC-Purity_page-0001.jpg', 'https://vintagepeptides.com/wp-content/uploads/2026/03/VP-9271992-CJC-1295-no-DAC-Purity_page-0002.jpg', 'https://vintagepeptides.com/wp-content/uploads/2026/03/VP-9271992-CJC-1295-no-DAC-Purity_page-0003.jpg', 'https://vintagepeptides.com/wp-content/uploads/2026/03/VP-9271992-CJC-1295-no-DAC-Purity_page-0004.jpg' ], 'info' => 'CJC-1295 (No DAC) 5mg + Ipamorelin 5mg — Dual GH-Pathway Research Peptide. Total 10mg per vial in lyophilized form. CJC-1295 No DAC (GHRH analogue) + Ipamorelin (GHRP) combination enables researchers to evaluate: Frequency and amplitude changes in GH secretion | Synergistic effects on endocrine feedback loops | Broader impacts on metabolic, anabolic, and recovery-related pathways. Format: Lyophilized powder. For laboratory research use only.' ],
        5399 => [ 'name' => 'BPC-157 – 10MG', 'coa' => [ 'https://vintagepeptides.com/wp-content/uploads/2026/03/VP-6704696-BPC-157-Purity_page-0001.jpg', 'https://vintagepeptides.com/wp-content/uploads/2026/03/VP-6704696-BPC-157-Purity_page-0002.jpg' ], 'info' => 'BPC-157 (Body Protection Compound-157) — Research Peptide. Synthetic peptide modeled after a naturally occurring protein fragment found in gastric tissue. Research areas: Musculoskeletal injury and repair (tendon, ligament, muscle studies) | Gastrointestinal lining support including mucosal injury and inflammation models | Post-surgical recovery frameworks | Inflammation-related conditions. Not FDA approved for any medical indication. For laboratory research use only.' ],
        5400 => [ 'name' => 'TB-500 – 10MG', 'coa' => [ 'https://vintagepeptides.com/wp-content/uploads/2026/03/VP-9645060-TB-500-Purity_page-0001.jpg', 'https://vintagepeptides.com/wp-content/uploads/2026/03/VP-9645060-TB-500-Purity_page-0002.jpg' ], 'info' => 'TB-500 — Research Peptide. Synthetic peptide modeled after thymosin beta-4, a naturally occurring protein present in most mammalian cells. Research areas: Muscle, tendon, and ligament injury models | Joint and soft-tissue inflammation studies | Wound-healing and tissue-repair frameworks | Post-operative recovery research | Cardiovascular tissue repair (early animal studies). For laboratory research use only.' ],
        5401 => [ 'name' => 'PT-141 – 10MG', 'coa' => [ 'https://vintagepeptides.com/wp-content/uploads/2026/03/VP-4885039-PT-141-Purity_page-0001.jpg', 'https://vintagepeptides.com/wp-content/uploads/2026/03/VP-4885039-PT-141-Purity_page-0002.jpg' ], 'info' => 'PT-141 (Bremelanotide) — Neuromodulatory Research Peptide. Synthetic peptide studied for its interaction with central melanocortin receptors, particularly within neurological pathways associated with behavioral and neuroendocrine responses. Characteristics: Receptor-specific activation within CNS | Rapid onset of neuromodulatory effects | Activity across both male and female research subjects | Duration of receptor-mediated responses may extend several hours. Not approved for human or veterinary use. Format: Lyophilized powder. For laboratory research use only.' ],
        5879 => [ 'name' => 'SEMAX – 10MG', 'coa' => [ 'https://vintagepeptides.com/wp-content/uploads/2026/03/Screenshot-2026-03-31-153356.png', 'https://vintagepeptides.com/wp-content/uploads/2026/03/Screenshot-2026-03-31-153418.png' ], 'info' => 'SEMAX — Neuroregulatory Research Peptide. Mechanistic areas: BDNF and NGF-related pathways supporting investigations into neuronal development and synaptic regulation | Neurochemical balance and CNS homeostasis including models of cognitive processing and neural adaptation | Oxidative-stress and hypoxia-response mechanisms | HPA-axis signaling evaluating stress-related endocrine modulation | Energy-metabolism pathways within neural tissue. Amino Acid Sequence: Met-Glu-His-Phe-Pro-Gly-Pro | Molecular Formula: C37H51N9O10S | Molecular Weight: 869.93 g/mol | Form: White lyophilized powder. Format: Lyophilized powder. For laboratory research use only.' ],
        5889 => [ 'name' => 'GLP-1 (SM) – 10MG', 'coa' => [], 'info' => 'GLP-1 SM (Semaglutide) — GLP-1 Receptor Agonist Research Peptide (10mg). Synthetic GLP-1 receptor agonist, high-purity lyophilized powder for controlled laboratory research. ≥99% purity. Structural characteristics: High GLP-1R affinity | Resistance to DPP-4 degradation | Extended stability via C-18 fatty-diacid acylation | Engagement of PI3K/Akt-related pathways | CNS-associated receptor activity including hypothalamic signaling. Research areas: Metabolic homeostasis | Neuroprotective and CNS-related pathways | Hepatic and metabolic-stress frameworks | Vascular and endothelial integrity. Storage: -20°C. For laboratory research use only.' ],
        5890 => [ 'name' => 'GLP-2 (TZ) – 30MG', 'coa' => [ 'https://vintagepeptides.com/wp-content/uploads/2026/04/VP-9305820-Tirzepatide-Purity_page-0001.jpg', 'https://vintagepeptides.com/wp-content/uploads/2026/04/VP-9305820-Tirzepatide-Purity_page-0002.jpg' ], 'info' => 'GLP-2-TZ — Dual-Receptor Incretin Research Peptide. Synthetic peptide analogue studied for its interaction with GIP and GLP-1 receptors. Molecular Formula: C225H348N48O68 | Molecular Weight: 4813.5 g/mol | CAS Number: 2023788-19-2. Research areas: Dual agonism of GIP and GLP-1 receptors | Receptor-binding kinetics | Metabolic-adaptation models | CNS-associated signaling | Comparative incretin-analog research. Storage: -20°C. For laboratory research use only.' ],
        5897 => [ 'name' => 'GLP-3 (RT) – 10MG', 'coa' => [], 'info' => 'GLP-3 RT — Triple-Receptor Agonist Research Peptide. Synthetic multi-agonist peptide engineered to interact with GLP-1, GIP, and glucagon receptors. Receptor targets: GLP-1R | GIPR | GCGR. Molecular Weight: ~4.8–5.0 kDa. Research areas: Incretin & glucagon biology | Energy-balance and nutrient-responsive signaling | Hepatic metabolic-pathway regulation | Islet-cell receptor modulation | Neuroendocrine metabolic-axis integration. Purity: ≥98% (HPLC-verified). Storage: -20°C. For laboratory research use only.' ],
        5898 => [ 'name' => 'SLU-PP 332 – 5MG', 'coa' => [], 'info' => 'SLU-PP-332 — Synthetic Small-Molecule Research Compound. Non-peptide heterocyclic compound for use in controlled laboratory environments. Chemical Profile: Molecular Formula: C18H14N2O2 | Compound Class: Synthetic small-molecule | Molecular Weight: ~290 g/mol. Research areas: Small-molecule mechanistic studies | Biochemical pathway modeling | Synthetic compound comparison assays | In-vitro systems evaluating molecular interactions. Purity: ≥99% (HPLC-verified). For laboratory research use only.' ],
        5899 => [ 'name' => 'SELANK – 10MG', 'coa' => [ 'https://vintagepeptides.com/wp-content/uploads/2026/04/VP-9715345-Selank-Purity-images-0-scaled.jpg', 'https://vintagepeptides.com/wp-content/uploads/2026/04/VP-9715345-Selank-Purity-images-1-scaled.jpg' ], 'info' => 'SELANK — Neuroregulatory Research Peptide. Synthetic heptapeptide analogue derived from endogenous tetrapeptide tuftsin. Research areas: Neurotransmitter-modulating activity including GABAergic and serotonergic pathways | Neurotrophic-factor expression particularly BDNF-associated signaling | Stress-response regulation including HPA-axis-related transcriptional activity | Cognitive-associated signaling | Immune-related pathways including tuftsin-derived immunomodulatory mechanisms. Format: Lyophilized powder. For laboratory research use only.' ],
        5902 => [ 'name' => 'NAD+ – 1000MG', 'coa' => [ 'https://vintagepeptides.com/wp-content/uploads/2026/04/VP-6690114-NAD-Purity-images-0-scaled.jpg', 'https://vintagepeptides.com/wp-content/uploads/2026/04/VP-6690114-NAD-Purity-images-1-scaled.jpg' ], 'info' => 'NAD+ — Cellular Energy & Redox Research Coenzyme. NAD+ (Nicotinamide Adenine Dinucleotide) is an essential coenzyme examined for its central role in cellular energy metabolism, oxidation-reduction (redox) reactions, and DNA-repair-associated enzymatic pathways. Research areas: Electron-transport chain activity supporting mitochondrial respiration | Cofactor roles in the Krebs cycle | Sirtuin activation regulating stress response, inflammation, and metabolic homeostasis | PARP-mediated DNA repair | Age-related metabolic decline. Purity: ≥99% (HPLC-tested). Storage: 2–8°C. For laboratory research use only.' ],
        5905 => [ 'name' => 'MELANOTAN 1 – 10MG', 'coa' => [], 'info' => 'Melanotan-1 — alpha-MSH Analogue for Melanocortin-Receptor Research. Synthetic analogue of alpha-MSH. Molecular Formula: C78H111N21O19 | Molecular Weight: 1646.87 g/mol | Other Names: MT-1, Afamelanotide. Receptor targets: MC1R (pigmentation) | MC2R (adrenal signaling) | MC3R (energy homeostasis and appetite) | MC4R (CNS metabolic and behavioral signaling) | MC5R (exocrine pathways). Research focus: MC1R selective affinity | cAMP signaling | MITF expression | downstream enzymatic activity in melanin synthesis. Format: Lyophilized powder. For laboratory research use only.' ],
        5906 => [ 'name' => 'L-GLUTATHIONE – 1000MG', 'coa' => [], 'info' => 'L-Glutathione — Tripeptide Antioxidant Research Compound. Naturally occurring tripeptide composed of glutamine, cysteine, and glycine. Molecular Formula: C10H17N3O6S | Molecular Weight: ~307 g/mol. Research areas: Redox-cycling activity (reduced GSH and oxidized GSSG states) | Enzymatic cofactor roles including glutathione peroxidase and glutathione reductase pathways | Protection against reactive oxygen species (ROS) | Maintenance of genomic stability under oxidative conditions | Regulation of intracellular antioxidant networks. Purity: ≥99% (HPLC-verified). Storage: -20°C. For laboratory research use only.' ],
        5907 => [ 'name' => 'KLOW – 80MG', 'coa' => [ 'https://vintagepeptides.com/wp-content/uploads/2026/04/VP-9089847-KLOW-Purity_page-0001.jpg', 'https://vintagepeptides.com/wp-content/uploads/2026/04/VP-9089847-KLOW-Purity_page-0002.jpg', 'https://vintagepeptides.com/wp-content/uploads/2026/04/VP-9089847-KLOW-Purity_page-0003.jpg', 'https://vintagepeptides.com/wp-content/uploads/2026/04/VP-9089847-KLOW-Purity_page-0004.jpg', 'https://vintagepeptides.com/wp-content/uploads/2026/04/VP-9089847-KLOW-Purity_page-0005.jpg', 'https://vintagepeptides.com/wp-content/uploads/2026/04/VP-9089847-KLOW-Purity_page-0006.jpg', 'https://vintagepeptides.com/wp-content/uploads/2026/04/VP-9089847-KLOW-Purity_page-0007.jpg', 'https://vintagepeptides.com/wp-content/uploads/2026/04/VP-9089847-KLOW-Purity_page-0008.jpg' ], 'info' => 'KLOW — Multi-Peptide Research Blend (80mg). Blend: BPC-157 + GHK-Cu + TB-500 + KPV. Components: BPC-157 — extracellular-matrix dynamics, cell-migration pathways, gastrointestinal-associated research frameworks | GHK-Cu — copper-binding interactions, ECM-related signaling, oxidative-stress response pathways | TB-500 — actin-binding proteins, cytoskeletal organization, cell-motility research models | KPV — inflammatory-signaling pathways, immune-cell response profiles, peptide-mediated regulatory mechanisms. Format: Lyophilized powder. Storage: -20°C. For laboratory research use only.' ],
        5916 => [ 'name' => 'TESMORELIN IPA – 15MG', 'coa' => [], 'info' => 'Tesamorelin + Ipamorelin — Dual GH-Axis Research Peptide System. Tesamorelin (GHRH analogue): Stimulates pituitary GH release through GHRH-receptor activation | Influences IGF-1-related signaling pathways | Provides extended GH-pulse duration. Ipamorelin (selective GHS): Ghrelin-receptor-mediated GH-pulse initiation | Controlled GH-release patterns without affecting cortisol or prolactin | Comparative studies GHS vs GHRH analogues. Format: Lyophilized powder. For laboratory research use only.' ],
        5917 => [ 'name' => 'BAC WATER – 10ML', 'coa' => [], 'info' => 'Bacteriostatic Water (BAC Water) — 10mL Research-Grade Diluent. Sterile, non-pyrogenic aqueous solution preserved with 0.9% benzyl alcohol. Used for reconstitution and dilution of lyophilized research compounds. Key features: Sterile, non-pyrogenic | 0.9% benzyl alcohol preservative | Suitable for multi-entry use | Sealed 10mL vial. Volume: 10mL | Storage: Room temperature, protect from direct light. For laboratory research use only.' ],
        5918 => [ 'name' => 'GHRP-6 – 10MG', 'coa' => [], 'info' => 'GHRP-6 — Growth Hormone Releasing Peptide-6. Synthetic hexapeptide, growth hormone secretagogue (GHS). CAS: 87616-84-0 | Formula: C46H56N12O6 | MW: 873.03 g/mol | Sequence: His-D-Trp-Ala-Trp-D-Phe-Lys-NH2. Research areas: Activation of GHS-R1a initiating GH-release signaling | Hypothalamic pathway modulation including somatostatin-related inhibition models | Evaluation of pulsatile GH secretion patterns | Endocrine-regulated metabolic-signaling pathways. Storage: 2–8°C short-term, -20°C long-term. For laboratory research use only.' ],
        5919 => [ 'name' => 'IGF-1 LR3 – 1MG', 'coa' => [], 'info' => 'IGF-1 LR3 — Long R3 Insulin-Like Growth Factor-1 (1mg). Synthetic 83-amino-acid polypeptide, long-acting analogue of endogenous IGF-1. Structural modifications: extended N-terminal region and substitution of arginine at position 3 for reduced IGFBP binding. Research areas: Reduced affinity for IGF-binding proteins | Extended N-terminal structure with altered receptor-binding kinetics | Autocrine and paracrine signaling models | Tissue-distribution patterns. Storage: 2–8°C (long-term: -20°C). For laboratory research use only.' ],
        5939 => [ 'name' => 'IGF-1 LR3 – 1MG (Copy)', 'coa' => [], 'info' => 'IGF-1 LR3 — Long R3 Insulin-Like Growth Factor-1 (1mg). Synthetic 83-amino-acid polypeptide, long-acting analogue of endogenous IGF-1. Research areas: Reduced affinity for IGF-binding proteins | Autocrine and paracrine signaling models | Tissue-distribution patterns. Storage: 2–8°C (long-term: -20°C). For laboratory research use only.' ],

        // ── NEW PRODUCTS (May 2026) ───────────────────────────────────────────────
        // NOTE: IDs below are placeholders — replace with real WooCommerce product IDs
        // after running the "Bulk Create New Products" tool below.
        // Slugs: thymosin-alpha-1-10mg | hexarelin-10mg | oxytocin-5mg |
        //        kisspeptin-10-10mg | aod-9604-5mg | melanotan-2-10mg
        // Use the admin panel "Bulk Create New Products" button to create them,
        // then update these IDs with the returned WooCommerce product IDs.
        0 => [ 'name' => 'THYMOSIN ALPHA-1 – 10MG',
            'coa'  => [],
            'info' => 'Thymosin Alpha-1 (Tα1) — Immune-Modulating Research Peptide. Naturally occurring 28-amino-acid peptide originally isolated from thymic tissue. Molecular Formula: C129H215N33O55 | Molecular Weight: 3,108.4 g/mol | CAS: 62304-98-7. Receptor targets: Toll-like receptors (TLR2, TLR9) | T-cell surface receptors. Research areas: CD4+/CD8+ T-lymphocyte maturation and immune-response initiation | Dendritic cell activation and antigen presentation | Pro/anti-inflammatory cytokine balance (IL-2, IFN-γ) | Innate immune signaling pathways. Purity: ≥99% (HPLC-verified). Storage: -20°C. For laboratory research use only.',
        ],
        1 => [ 'name' => 'HEXARELIN – 10MG',
            'coa'  => [],
            'info' => 'Hexarelin — Growth Hormone Secretagogue Research Peptide. Synthetic hexapeptide, potent GHS-R1a agonist. CAS: 140703-51-1 | Formula: C47H58N12O6 | MW: 887.1 g/mol | Sequence: His-D-2-MeTrp-Ala-Trp-D-Phe-Lys-NH2. Research areas: Pulsatile GH release via GHSR-1a activation | Somatotroph cell function and GH pulse amplitude | GHS receptor selectivity profiling | Cardiovascular tissue models with GHS receptor activity. Purity: ≥99% (HPLC-verified). Storage: -20°C. For laboratory research use only.',
        ],
        2 => [ 'name' => 'OXYTOCIN – 5MG',
            'coa'  => [],
            'info' => 'Oxytocin — Neuropeptide Hormone Research Compound. Cyclic nonapeptide produced in the hypothalamus. Molecular Formula: C43H66N12O12S2 | Molecular Weight: 1,007.2 g/mol | CAS: 50-56-6 | Sequence: Cys-Tyr-Ile-Gln-Asn-Cys-Pro-Leu-Gly-NH2. Research areas: Hypothalamic hormone release and neuropeptide receptor-binding kinetics | Social behavior and prosocial signaling in in-vitro and animal models | Myometrial smooth muscle contractility and parturition-related endocrine pathways | HPA-axis interaction and anxiolytic pathway modulation. Purity: ≥99% (HPLC-verified). Storage: -20°C. For laboratory research use only.',
        ],
        3 => [ 'name' => 'KISSPEPTIN-10 – 10MG',
            'coa'  => [],
            'info' => 'Kisspeptin-10 — GPR54 Receptor Agonist Neuroendocrine Research Peptide. Biologically active C-terminal decapeptide of the kisspeptin family. Molecular Formula: C63H83N15O13 | Molecular Weight: 1,302.5 g/mol | Sequence: Tyr-Asn-Trp-Asn-Ser-Phe-Gly-Leu-Arg-Phe-NH2. Research areas: HPG-axis upstream GnRH pulse regulation | GPR54 (KISS1R) receptor binding kinetics and internalization | LH and FSH secretion dynamics and gonadotropin pulse regulation | Metabolic hormone cross-talk and energy homeostasis signaling. Purity: ≥99% (HPLC-verified). Storage: -20°C. For laboratory research use only.',
        ],
        4 => [ 'name' => 'AOD-9604 – 5MG',
            'coa'  => [],
            'info' => 'AOD-9604 — hGH Fragment 177-191 Metabolic Research Peptide. Synthetic analogue of C-terminal fragment of human growth hormone. Molecular Formula: C78H123N23O23S2 | Molecular Weight: 1,816.1 g/mol | Disulfide bridge: Cys182-Cys189. Research areas: Lipolysis stimulation and lipogenesis inhibition via non-GHR mechanisms | Comparative hGH C-terminal fragment vs. full-length GH receptor binding | Articular cartilage repair signaling and chondrocyte regeneration models | β3-adrenoceptor-mediated metabolic effects in adipocyte models. Purity: ≥99% (HPLC-verified). Storage: -20°C. For laboratory research use only.',
        ],
        5 => [ 'name' => 'MELANOTAN II – 10MG',
            'coa'  => [],
            'info' => 'Melanotan II (MT-II) — Cyclic alpha-MSH Analogue for Melanocortin Receptor Research. Synthetic cyclic analogue of alpha-MSH with enhanced receptor affinity. Molecular Formula: C50H69N15O9 | Molecular Weight: 1,024.2 g/mol | CAS: 121062-08-6 | Sequence: Ac-Nle-c[Asp-His-D-Phe-Arg-Trp-Lys]-OH (cyclic). Receptor targets: MC1R (pigmentation) | MC3R (energy homeostasis) | MC4R (CNS metabolic/behavioral) | MC5R (exocrine). Research areas: Melanogenesis signaling, MITF expression, eumelanin/pheomelanin switching | Hypothalamic appetite regulation via MC4R | Neuroendocrine arousal pathway studies | Comparative cyclic vs. linear MSH analogue receptor affinity. Purity: ≥99% (HPLC-verified). Storage: -20°C. For laboratory research use only.',
        ],
    ];
}

/**
 * Run the import — writes _vintage_peps_coa_images and _vintage_peps_additional_info
 * into WP post meta for each product. Returns array of result strings.
 */
function vprouter_run_tab_import(): array {
    $results = [];
    foreach ( vprouter_get_tab_data() as $product_id => $data ) {
        // Skip placeholder IDs (0-5 = new products not yet created)
        if ( $product_id < 100 ) {
            $results[] = [ 'ok' => false, 'msg' => "Skipped placeholder ID {$product_id} ({$data['name']}) — run Bulk Create first, then update IDs." ];
            continue;
        }
        $post = get_post( $product_id );
        if ( ! $post || $post->post_type !== 'product' ) {
            $results[] = [ 'ok' => false, 'msg' => "ID {$product_id} ({$data['name']}) — not found, skipped." ];
            continue;
        }
        update_post_meta( $product_id, '_vintage_peps_coa_images',      wp_json_encode( $data['coa'] ) );
        update_post_meta( $product_id, '_vintage_peps_additional_info', $data['info'] );
        $n = count( $data['coa'] );
        $results[] = [ 'ok' => true, 'msg' => "ID {$product_id} ({$data['name']}) — {$n} COA image(s) + additional info saved." ];
    }
    return $results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bulk Product Creator — creates 6 new products in WooCommerce
// ─────────────────────────────────────────────────────────────────────────────

/**
 * New products definition: slug => data
 * Each entry maps to a WooCommerce simple product.
 */
function vprouter_get_new_products(): array {
    return [
        'thymosin-alpha-1-10mg' => [
            'name'              => 'THYMOSIN ALPHA-1 – 10MG',
            'price'             => '85.00',
            'short_description' => 'Thymosin Alpha-1 (Tα1) — 28-amino-acid immune-modulating peptide. 10mg lyophilized vial. ≥99% purity (HPLC). 3rd party tested. Made in USA. For laboratory research use only.',
            'description'       => 'Thymosin Alpha-1 (Tα1) is a naturally occurring 28-amino-acid peptide originally isolated from thymic tissue. It has been studied extensively for its role in immune regulation and T-cell maturation, with a particular focus on innate and adaptive immune signaling pathways.<br><br>Research areas: CD4+/CD8+ T-lymphocyte maturation and immune-response initiation | Toll-like receptor (TLR2, TLR9) activation and downstream cytokine cascades | Dendritic cell activation and antigen presentation pathways | Pro/anti-inflammatory cytokine balance including IL-2 and IFN-γ regulation.<br><br>Molecular Formula: C129H215N33O55 | Molecular Weight: 3,108.4 g/mol | CAS: 62304-98-7. Purity: ≥99% (HPLC-verified). Storage: -20°C. Format: Lyophilized powder. For laboratory research use only.',
            'sku'               => 'VK-TA1-10MG',
            'image_url'         => 'https://vintagepeptides.com/wp-content/uploads/2026/05/Thymosin-Alpha-1-10mg-Peptide-450x675.png',
            'coa_purity_pdf'    => 'https://vintagepeptides.com/wp-content/uploads/2026/05/VP-1947064-P-Thymosin-Alpha-1-purity.pdf',
            'coa_endotoxin_pdf' => 'https://vintagepeptides.com/wp-content/uploads/2026/05/VP-1947064-E-Thymosin-Alpha-1-endotoxin.pdf',
        ],
        'hexarelin-10mg' => [
            'name'              => 'HEXARELIN – 10MG',
            'price'             => '120.00',
            'short_description' => 'Hexarelin — synthetic hexapeptide growth hormone secretagogue. 10mg lyophilized vial. ≥99% purity (HPLC). GHS-R1a agonist. Made in USA. For laboratory research use only.',
            'description'       => 'Hexarelin is a synthetic hexapeptide and potent growth hormone secretagogue (GHS) that acts through GHS-R1a (ghrelin receptor) activation. Among the most potent GHRPs studied in the literature, it is used extensively in research exploring GH secretion dynamics and downstream endocrine signaling.<br><br>Research areas: Pulsatile GH release via GHSR-1a activation | Somatotroph cell function and GH pulse amplitude | GHS receptor selectivity profiling across the ghrelin secretagogue peptide family | Cardiovascular tissue models with GHS receptor activity.<br><br>CAS: 140703-51-1 | Formula: C47H58N12O6 | MW: 887.1 g/mol | Sequence: His-D-2-MeTrp-Ala-Trp-D-Phe-Lys-NH2. Purity: ≥99% (HPLC-verified). Storage: -20°C. Format: Lyophilized powder. For laboratory research use only.',
            'sku'               => 'VK-HEX-10MG',
            'image_url'         => 'https://vintagepeptides.com/wp-content/uploads/2026/05/Hexarelin-10mg-Peptide-450x675.png',
            'coa_purity_pdf'    => 'https://vintagepeptides.com/wp-content/uploads/2026/05/VP-7132129-P-Hexarelin-Purity-1.pdf',
            'coa_endotoxin_pdf' => 'https://vintagepeptides.com/wp-content/uploads/2026/05/VP-7132129-E-Hexarelin-Endotoxin.pdf',
        ],
        'oxytocin-5mg' => [
            'name'              => 'OXYTOCIN – 5MG',
            'price'             => '60.00',
            'short_description' => 'Oxytocin — cyclic nonapeptide neuropeptide hormone. 5mg lyophilized vial. ≥99% purity (HPLC). GPR54 agonist. Made in USA. For laboratory research use only.',
            'description'       => 'Oxytocin is a cyclic nonapeptide hormone produced in the hypothalamus and widely studied for its roles in neuroendocrine signaling, social bonding behavior, and parturition-related pathways. It is among the most extensively characterized peptide hormones in neuroscience research.<br><br>Research areas: Hypothalamic hormone release and neuropeptide receptor-binding kinetics | Social behavior and prosocial signaling in in-vitro and animal models | Myometrial smooth muscle contractility and parturition-related endocrine pathways | HPA-axis interaction and anxiolytic pathway modulation.<br><br>Molecular Formula: C43H66N12O12S2 | Molecular Weight: 1,007.2 g/mol | CAS: 50-56-6 | Sequence: Cys-Tyr-Ile-Gln-Asn-Cys-Pro-Leu-Gly-NH2. Purity: ≥99% (HPLC-verified). Storage: -20°C. Format: Lyophilized powder. For laboratory research use only.',
            'sku'               => 'VK-OXY-5MG',
            'image_url'         => 'https://vintagepeptides.com/wp-content/uploads/2026/05/Oxytocin-5mg-Peptide-450x675.png',
            'coa_purity_pdf'    => 'https://vintagepeptides.com/wp-content/uploads/2026/05/VP-4275312-P-Oxytocin-Purity-1.pdf',
            'coa_endotoxin_pdf' => 'https://vintagepeptides.com/wp-content/uploads/2026/05/VP-4275312-E-Oxytocin-Endotoxin.pdf',
        ],
        'kisspeptin-10-10mg' => [
            'name'              => 'KISSPEPTIN-10 – 10MG',
            'price'             => '70.00',
            'short_description' => 'Kisspeptin-10 — GPR54/KISS1R agonist, HPG axis neuroendocrine research peptide. 10mg lyophilized vial. ≥99% purity (HPLC). Made in USA. For laboratory research use only.',
            'description'       => 'Kisspeptin-10 is the biologically active C-terminal decapeptide of the kisspeptin family, acting as a potent endogenous agonist at the GPR54 (KISS1R) receptor. It plays a critical upstream role in the hypothalamic-pituitary-gonadal (HPG) axis and GnRH pulse regulation.<br><br>Research areas: HPG-axis upstream GnRH pulse regulation | GPR54 (KISS1R) receptor binding kinetics, internalization, and downstream signaling cascades | LH and FSH secretion dynamics and gonadotropin pulse regulation in vitro | Metabolic hormone cross-talk and energy homeostasis signaling.<br><br>Molecular Formula: C63H83N15O13 | Molecular Weight: 1,302.5 g/mol | Sequence: Tyr-Asn-Trp-Asn-Ser-Phe-Gly-Leu-Arg-Phe-NH2. Purity: ≥99% (HPLC-verified). Storage: -20°C. Format: Lyophilized powder. For laboratory research use only.',
            'sku'               => 'VK-KISS-10MG',
            'image_url'         => 'https://vintagepeptides.com/wp-content/uploads/2026/05/Kisspeptin-10-10mg-Peptide-450x675.png',
            'coa_purity_pdf'    => 'https://vintagepeptides.com/wp-content/uploads/2026/05/VP-8975198-P-Kisspeptin-10-Purity-1.pdf',
            'coa_endotoxin_pdf' => 'https://vintagepeptides.com/wp-content/uploads/2026/05/VP-8975198-E-Kisspeptin-10-Endotoxin-1.pdf',
        ],
        'aod-9604-5mg' => [
            'name'              => 'AOD-9604 – 5MG',
            'price'             => '65.00',
            'short_description' => 'AOD-9604 — hGH fragment 177-191, synthetic metabolic research peptide. 5mg lyophilized vial. ≥99% purity (HPLC). Made in USA. For laboratory research use only.',
            'description'       => 'AOD-9604 is a synthetic analogue of the C-terminal fragment of human growth hormone (hGH 177-191), modified for enhanced metabolic stability. It has been studied extensively for its lipolytic properties and fat metabolism effects without the growth-promoting or insulin-desensitizing activity of full-length hGH.<br><br>Research areas: Lipolysis stimulation and lipogenesis inhibition via non-GHR mechanisms in adipocyte models | Comparative hGH C-terminal fragment vs. full-length GH receptor binding research | Articular cartilage repair signaling and chondrocyte regeneration models | β3-adrenoceptor-mediated metabolic effects in adipocyte research frameworks.<br><br>Molecular Formula: C78H123N23O23S2 | Molecular Weight: 1,816.1 g/mol | Disulfide bridge: Cys182-Cys189. Purity: ≥99% (HPLC-verified). Storage: -20°C. Format: Lyophilized powder. For laboratory research use only.',
            'sku'               => 'VK-AOD-5MG',
            'image_url'         => 'https://vintagepeptides.com/wp-content/uploads/2026/05/AOD-9604-5mg-Peptide-450x675.png',
            'coa_purity_pdf'    => 'https://vintagepeptides.com/wp-content/uploads/2026/05/VP-3713888-P-AOD-9604-Purity-1.pdf',
            'coa_endotoxin_pdf' => 'https://vintagepeptides.com/wp-content/uploads/2026/05/VP-3713888-E-AOD-9604-Endotoxin.pdf',
        ],
        'melanotan-2-10mg' => [
            'name'              => 'MELANOTAN II – 10MG',
            'price'             => '50.00',
            'short_description' => 'Melanotan II — cyclic alpha-MSH analogue, multi-melanocortin receptor agonist. 10mg lyophilized vial. ≥99% purity (HPLC). Made in USA. For laboratory research use only.',
            'description'       => 'Melanotan II (MT-II) is a synthetic cyclic analogue of alpha-melanocyte-stimulating hormone (α-MSH), engineered for enhanced receptor affinity and metabolic stability. Unlike the linear structure of Melanotan I, the cyclic conformation of MT-II confers potent agonism across multiple melanocortin receptor subtypes.<br><br>Research areas: Multi-receptor binding studies at MC1R, MC3R, MC4R, and MC5R | Melanogenesis signaling, MITF expression, and eumelanin/pheomelanin switching research | Hypothalamic appetite regulation via MC4R | Neuroendocrine arousal pathway studies | Comparative cyclic vs. linear MSH analogue receptor affinity profiling.<br><br>Molecular Formula: C50H69N15O9 | Molecular Weight: 1,024.2 g/mol | CAS: 121062-08-6 | Structure: Ac-Nle-c[Asp-His-D-Phe-Arg-Trp-Lys]-OH (cyclic). Purity: ≥99% (HPLC-verified). Storage: -20°C. Format: Lyophilized powder. For laboratory research use only.',
            'sku'               => 'VK-MT2-10MG',
            'image_url'         => 'https://vintagepeptides.com/wp-content/uploads/2026/05/Melanotan-2-10mg-Peptide-450x675.png',
            'coa_purity_pdf'    => 'https://vintagepeptides.com/wp-content/uploads/2026/05/VP-7423137-P-Melanotan-2-MT-2-purity.pdf',
            'coa_endotoxin_pdf' => 'https://vintagepeptides.com/wp-content/uploads/2026/05/VP-7423137-E-Melanotan-2-MT-2-endotoxin.pdf',
        ],
    ];
}

/**
 * Bulk-create the 6 new WooCommerce products.
 * - Skips slugs that already exist (idempotent).
 * - Special case: if a draft product with slug 'melanotan-i-10mg' or
 *   name containing 'melanotan i' exists, it renames+updates it to MT-II.
 * - Stores _vintage_peps_coa_purity_pdf and _vintage_peps_coa_endotoxin_pdf meta.
 * - Sets the product image via WP attachment sideloading.
 */
function vprouter_bulk_create_products(): array {
    if ( ! function_exists( 'wc_get_product' ) ) {
        return [ [ 'ok' => false, 'msg' => 'WooCommerce is not active. Cannot create products.' ] ];
    }

    require_once( ABSPATH . 'wp-admin/includes/media.php' );
    require_once( ABSPATH . 'wp-admin/includes/file.php' );
    require_once( ABSPATH . 'wp-admin/includes/image.php' );

    $results  = [];
    $products = vprouter_get_new_products();

    foreach ( $products as $slug => $data ) {

        // ── Check for existing product by slug ───────────────────────────────
        $existing_id = wc_get_product_id_by_sku( $data['sku'] );
        if ( ! $existing_id ) {
            // Also try slug
            $existing_posts = get_posts([
                'name'        => $slug,
                'post_type'   => 'product',
                'post_status' => [ 'publish', 'draft', 'pending', 'private' ],
                'numberposts' => 1,
                'fields'      => 'ids',
            ]);
            if ( ! empty( $existing_posts ) ) {
                $existing_id = $existing_posts[0];
            }
        }

        // ── Special case: Melanotan I draft → repurpose as Melanotan II ──────
        if ( $slug === 'melanotan-2-10mg' && ! $existing_id ) {
            $mt1_posts = get_posts([
                'post_type'   => 'product',
                'post_status' => 'draft',
                'numberposts' => 1,
                'fields'      => 'ids',
                's'           => 'melanotan',
                'meta_query'  => [],
            ]);
            // Also search by slug
            $mt1_slug_posts = get_posts([
                'name'        => 'melanotan-i-10mg',
                'post_type'   => 'product',
                'post_status' => [ 'publish', 'draft', 'pending' ],
                'numberposts' => 1,
                'fields'      => 'ids',
            ]);
            $mt1_id = ! empty( $mt1_slug_posts ) ? $mt1_slug_posts[0] : ( ! empty( $mt1_posts ) ? $mt1_posts[0] : 0 );

            if ( $mt1_id ) {
                // Repurpose the Melanotan I draft
                wp_update_post([
                    'ID'           => $mt1_id,
                    'post_title'   => $data['name'],
                    'post_name'    => $slug,
                    'post_content' => $data['description'],
                    'post_excerpt' => $data['short_description'],
                    'post_status'  => 'publish',
                ]);
                update_post_meta( $mt1_id, '_price',         $data['price'] );
                update_post_meta( $mt1_id, '_regular_price', $data['price'] );
                update_post_meta( $mt1_id, '_sku',           $data['sku'] );
                update_post_meta( $mt1_id, '_stock_status',  'instock' );
                update_post_meta( $mt1_id, '_manage_stock',  'no' );
                update_post_meta( $mt1_id, '_vintage_peps_coa_purity_pdf',    $data['coa_purity_pdf'] );
                update_post_meta( $mt1_id, '_vintage_peps_coa_endotoxin_pdf', $data['coa_endotoxin_pdf'] );
                vprouter_sideload_product_image( $mt1_id, $data['image_url'], $data['name'] );
                $results[] = [ 'ok' => true, 'msg' => "ID {$mt1_id} — Melanotan I draft repurposed as {$data['name']} (slug: {$slug})" ];
                continue;
            }
        }

        // ── Skip if product already exists and is published ───────────────────
        if ( $existing_id ) {
            $results[] = [ 'ok' => false, 'msg' => "ID {$existing_id} ({$data['name']}) — already exists, skipped." ];
            continue;
        }

        // ── Create new product ────────────────────────────────────────────────
        $product = new WC_Product_Simple();
        $product->set_name( $data['name'] );
        $product->set_slug( $slug );
        $product->set_status( 'publish' );
        $product->set_catalog_visibility( 'visible' );
        $product->set_description( $data['description'] );
        $product->set_short_description( $data['short_description'] );
        $product->set_regular_price( $data['price'] );
        $product->set_price( $data['price'] );
        $product->set_sku( $data['sku'] );
        $product->set_stock_status( 'instock' );
        $product->set_manage_stock( false );
        $product->set_sold_individually( false );

        // Assign to "Peptides" category
        $cat = get_term_by( 'name', 'Peptides', 'product_cat' );
        if ( $cat ) {
            $product->set_category_ids( [ $cat->term_id ] );
        }

        $product_id = $product->save();

        if ( is_wp_error( $product_id ) || ! $product_id ) {
            $results[] = [ 'ok' => false, 'msg' => "FAILED to create {$data['name']}: " . ( is_wp_error( $product_id ) ? $product_id->get_error_message() : 'unknown error' ) ];
            continue;
        }

        // Save COA PDF meta
        update_post_meta( $product_id, '_vintage_peps_coa_purity_pdf',    $data['coa_purity_pdf'] );
        update_post_meta( $product_id, '_vintage_peps_coa_endotoxin_pdf', $data['coa_endotoxin_pdf'] );

        // Sideload product image
        vprouter_sideload_product_image( $product_id, $data['image_url'], $data['name'] );

        $results[] = [ 'ok' => true, 'msg' => "ID {$product_id} — Created: {$data['name']} (slug: {$slug}) @ \${$data['price']}" ];
    }

    return $results;
}

/**
 * Sideload a remote image and set it as the product's featured image.
 * Silently skips if the URL is unreachable or already attached.
 */
function vprouter_sideload_product_image( int $product_id, string $image_url, string $alt ): void {
    $existing_thumb = get_post_thumbnail_id( $product_id );
    if ( $existing_thumb ) return; // already has an image

    $tmp = download_url( $image_url );
    if ( is_wp_error( $tmp ) ) return;

    $file_array = [
        'name'     => sanitize_file_name( basename( $image_url ) ),
        'tmp_name' => $tmp,
    ];

    $attachment_id = media_handle_sideload( $file_array, $product_id, $alt );
    @unlink( $tmp );

    if ( ! is_wp_error( $attachment_id ) ) {
        set_post_thumbnail( $product_id, $attachment_id );
        update_post_meta( $attachment_id, '_wp_attachment_image_alt', sanitize_text_field( $alt ) );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────────────────────────

// Flush rewrite rules on activation so /wp-json/vintage-peps/v1/* routes resolve
register_activation_hook( __FILE__, function () {
    flush_rewrite_rules();
});

add_action( 'plugins_loaded', function () {
    VPROUTER_Router::init();
    VPROUTER_Admin::init();
}, 1 );

// ─────────────────────────────────────────────────────────────────────────────
// Auth REST API  —  /wp-json/vintage-peps/v1/register|login|validate
// Registered on rest_api_init (fires during WP's init hook, after plugins_loaded)
// ─────────────────────────────────────────────────────────────────────────────

add_action( 'rest_api_init', function () {

    register_rest_route( 'vintage-peps/v1', '/register', [
        'methods'             => 'POST',
        'callback'            => 'vprouter_auth_register',
        'permission_callback' => '__return_true',
        'args' => [
            'email'    => [ 'required' => true,  'type' => 'string', 'sanitize_callback' => 'sanitize_email' ],
            'password' => [ 'required' => true,  'type' => 'string' ],
            'username' => [ 'required' => false, 'type' => 'string', 'sanitize_callback' => 'sanitize_user' ],
        ],
    ]);

    register_rest_route( 'vintage-peps/v1', '/login', [
        'methods'             => 'POST',
        'callback'            => 'vprouter_auth_login',
        'permission_callback' => '__return_true',
        'args' => [
            'email'    => [ 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_email' ],
            'password' => [ 'required' => true, 'type' => 'string' ],
        ],
    ]);

    register_rest_route( 'vintage-peps/v1', '/validate', [
        'methods'             => 'POST',
        'callback'            => 'vprouter_auth_validate',
        'permission_callback' => '__return_true',
        'args' => [
            'token' => [ 'required' => true, 'type' => 'string' ],
        ],
    ]);

}, 10 ); // explicit priority so it fires after WC registers its own routes


/**
 * Generate a signed token for a given user ID.
 * Format: base64( user_id . '|' . expires ) . '.' . hmac
 */
function vprouter_make_token( int $user_id ): string {
    $expires = time() + ( 30 * DAY_IN_SECONDS ); // 30-day token
    $payload = base64_encode( $user_id . '|' . $expires );
    $secret  = defined( 'AUTH_KEY' ) ? AUTH_KEY : wp_salt( 'auth' );
    $sig     = hash_hmac( 'sha256', $payload, $secret );
    return $payload . '.' . $sig;
}

/**
 * Verify a token. Returns user_id on success, 0 on failure.
 */
function vprouter_verify_token( string $token ): int {
    $parts = explode( '.', $token, 2 );
    if ( count( $parts ) !== 2 ) return 0;

    [ $payload, $sig ] = $parts;
    $secret   = defined( 'AUTH_KEY' ) ? AUTH_KEY : wp_salt( 'auth' );
    $expected = hash_hmac( 'sha256', $payload, $secret );

    if ( ! hash_equals( $expected, $sig ) ) return 0;

    $decoded = base64_decode( $payload );
    [ $user_id, $expires ] = explode( '|', $decoded, 2 );

    if ( time() > (int) $expires ) return 0;

    return (int) $user_id;
}

function vprouter_auth_register( WP_REST_Request $req ): WP_REST_Response {
    $email    = $req->get_param( 'email' );
    $password = $req->get_param( 'password' );
    $username = $req->get_param( 'username' ) ?: sanitize_user( strstr( $email, '@', true ) );

    if ( ! is_email( $email ) ) {
        return new WP_REST_Response( [ 'error' => 'Invalid email address.' ], 400 );
    }
    if ( strlen( $password ) < 8 ) {
        return new WP_REST_Response( [ 'error' => 'Password must be at least 8 characters.' ], 400 );
    }
    if ( email_exists( $email ) ) {
        return new WP_REST_Response( [ 'error' => 'An account with that email already exists.' ], 409 );
    }

    // Make username unique if taken
    $base = $username;
    $i    = 1;
    while ( username_exists( $username ) ) {
        $username = $base . $i++;
    }

    $user_id = wp_create_user( $username, $password, $email );

    if ( is_wp_error( $user_id ) ) {
        return new WP_REST_Response( [ 'error' => $user_id->get_error_message() ], 500 );
    }

    // Set role to subscriber
    $user = new WP_User( $user_id );
    $user->set_role( 'subscriber' );

    $token = vprouter_make_token( $user_id );

    return new WP_REST_Response([
        'token'    => $token,
        'user_id'  => $user_id,
        'email'    => $email,
        'username' => $username,
        'message'  => 'Account created successfully.',
    ], 201 );
}

function vprouter_auth_login( WP_REST_Request $req ): WP_REST_Response {
    $email    = $req->get_param( 'email' );
    $password = $req->get_param( 'password' );

    // Accept login by email — find the username first
    $user = get_user_by( 'email', $email );

    if ( ! $user ) {
        return new WP_REST_Response( [ 'error' => 'No account found with that email.' ], 401 );
    }

    $result = wp_authenticate( $user->user_login, $password );

    if ( is_wp_error( $result ) ) {
        return new WP_REST_Response( [ 'error' => 'Incorrect password.' ], 401 );
    }

    $token = vprouter_make_token( $result->ID );

    return new WP_REST_Response([
        'token'    => $token,
        'user_id'  => $result->ID,
        'email'    => $result->user_email,
        'username' => $result->user_login,
        'message'  => 'Login successful.',
    ], 200 );
}

function vprouter_auth_validate( WP_REST_Request $req ): WP_REST_Response {
    $token   = $req->get_param( 'token' );
    $user_id = vprouter_verify_token( $token );

    if ( ! $user_id ) {
        return new WP_REST_Response( [ 'valid' => false ], 401 );
    }

    $user = get_userdata( $user_id );
    if ( ! $user ) {
        return new WP_REST_Response( [ 'valid' => false ], 401 );
    }

    return new WP_REST_Response([
        'valid'    => true,
        'user_id'  => $user_id,
        'email'    => $user->user_email,
        'username' => $user->user_login,
    ], 200 );
}