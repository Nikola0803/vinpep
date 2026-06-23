<?php
/**
 * Plugin Name: Vintage Peps CMS
 * Plugin URI:  https://vintagepeptides.com
 * Description: Content management for the Vintage Peptides React frontend. Manages homepage sections, FAQs, testimonials, blog posts, COA files, and exposes all content via REST API. Also includes a Zelle order management panel.
 * Version:     1.1.0
 * Author:      Vintage Peptides
 * Text Domain: vintage-peps-cms
 * Requires WP: 6.0
 * Requires PHP: 8.0
 */

defined( 'ABSPATH' ) || exit;

define( 'VPMS_VERSION', '1.1.0' );
define( 'VPMS_DIR',     plugin_dir_path( __FILE__ ) );
define( 'VPMS_URL',     plugin_dir_url( __FILE__ ) );

// ── Autoload modules ──────────────────────────────────────────────────────────
require_once VPMS_DIR . 'includes/class-vpms-post-types.php';
require_once VPMS_DIR . 'includes/class-vpms-options.php';
require_once VPMS_DIR . 'includes/class-vpms-rest-api.php';
require_once VPMS_DIR . 'includes/class-vpms-order-panel.php';
require_once VPMS_DIR . 'includes/class-vpms-admin.php';
require_once VPMS_DIR . 'includes/class-vpms-btc.php';

// ── Bootstrap ─────────────────────────────────────────────────────────────────
add_action( 'plugins_loaded', function () {
    VPMS_Post_Types::init();
    VPMS_Options::init();
    VPMS_REST_API::init();
    VPMS_Order_Panel::init();
    VPMS_Admin::init();
    VPMS_BTC::init();
} );

// ── Activation: flush rewrite rules ───────────────────────────────────────────
register_activation_hook( __FILE__, function () {
    VPMS_Post_Types::register_all();
    flush_rewrite_rules();
} );

register_deactivation_hook( __FILE__, 'flush_rewrite_rules' );
