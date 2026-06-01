<?php
/**
 * Plugin Name:  Vintage Peps — Product Order
 * Plugin URI:  https://vintagepeptides.com
 * Description:  Drag-and-drop shop page ordering for WooCommerce products. Sets menu_order on each product so the React storefront (orderby=menu_order) respects the custom sequence. BAC WATER is always pinned last automatically.
 * Version:      1.0.0
 * Author:      Vintage Peptides
 * Requires PHP: 7.4
 * Requires at least: 6.0
 * WC requires at least: 7.0
 */

defined( 'ABSPATH' ) || exit;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

define( 'VPP_VERSION',    '1.0.0' );
define( 'VPP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'VPP_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// Slug that is always pinned to the very end
define( 'VPP_LAST_SLUG',  'bac-water-10ml' );

// ─────────────────────────────────────────────────────────────────────────────
// Admin menu
// ─────────────────────────────────────────────────────────────────────────────

add_action( 'admin_menu', function () {
    add_submenu_page(
        'woocommerce',
        'Product Order',
        '📋 Product Order',
        'manage_woocommerce',
        'vpp-product-order',
        'vpp_render_page'
    );
} );

// ─────────────────────────────────────────────────────────────────────────────
// Enqueue admin assets (only on our page)
// ─────────────────────────────────────────────────────────────────────────────

add_action( 'admin_enqueue_scripts', function ( $hook ) {
    if ( $hook !== 'woocommerce_page_vpo-product-order' ) return;

    // WordPress ships jQuery UI Sortable — just enqueue it
    wp_enqueue_script( 'jquery-ui-sortable' );
    wp_enqueue_style(
        'vpo-admin',
        VPP_PLUGIN_URL . 'assets/admin.css',
        [],
        VPP_VERSION
    );
    wp_enqueue_script(
        'vpo-admin',
        VPP_PLUGIN_URL . 'assets/admin.js',
        [ 'jquery', 'jquery-ui-sortable' ],
        VPP_VERSION,
        true
    );
    wp_localize_script( 'vpo-admin', 'VPO', [
        'ajax_url' => admin_url( 'admin-ajax.php' ),
        'nonce'    => wp_create_nonce( 'vpp_save_order' ),
        'last_slug' => VPP_LAST_SLUG,
    ] );
} );

// ─────────────────────────────────────────────────────────────────────────────
// AJAX: save order
// ─────────────────────────────────────────────────────────────────────────────

add_action( 'wp_ajax_vpp_save_order', function () {
    check_ajax_referer( 'vpp_save_order', 'nonce' );

    if ( ! current_user_can( 'manage_woocommerce' ) ) {
        wp_send_json_error( 'Permission denied.' );
    }

    $ids = isset( $_POST['ids'] ) ? array_map( 'intval', (array) $_POST['ids'] ) : [];
    if ( empty( $ids ) ) {
        wp_send_json_error( 'No IDs received.' );
    }

    $saved = 0;
    foreach ( $ids as $position => $product_id ) {
        $slug = get_post_field( 'post_name', $product_id );
        // Force BAC WATER to a very high menu_order so it always sorts last
        $menu_order = ( $slug === VPP_LAST_SLUG ) ? 9999 : $position;

        wp_update_post( [
            'ID'         => $product_id,
            'menu_order' => $menu_order,
        ] );

        // Also store in post meta as a fallback for REST API ordering
        update_post_meta( $product_id, '_vpp_sort_order', $menu_order );
        $saved++;
    }

    wp_send_json_success( [ 'saved' => $saved, 'message' => "Order saved for {$saved} products." ] );
} );

// ─────────────────────────────────────────────────────────────────────────────
// On activation: set initial menu_order from current publish order
// ─────────────────────────────────────────────────────────────────────────────

register_activation_hook( __FILE__, 'vpp_set_initial_order' );

function vpp_set_initial_order(): void {
    $products = get_posts( [
        'post_type'      => 'product',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'orderby'        => 'date',
        'order'          => 'ASC',
        'fields'         => 'ids',
    ] );

    // Put BAC WATER last
    $bac_id = null;
    foreach ( $products as $key => $id ) {
        if ( get_post_field( 'post_name', $id ) === VPP_LAST_SLUG ) {
            $bac_id = $id;
            unset( $products[ $key ] );
        }
    }
    $products = array_values( $products );
    if ( $bac_id ) $products[] = $bac_id;

    foreach ( $products as $pos => $id ) {
        $menu_order = ( get_post_field( 'post_name', $id ) === VPP_LAST_SLUG ) ? 9999 : $pos;
        wp_update_post( [ 'ID' => $id, 'menu_order' => $menu_order ] );
        update_post_meta( $id, '_vpp_sort_order', $menu_order );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin page render
// ─────────────────────────────────────────────────────────────────────────────

function vpp_render_page(): void {

    // Fetch all published products sorted by current menu_order
    $raw = get_posts( [
        'post_type'      => 'product',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'orderby'        => 'menu_order',
        'order'          => 'ASC',
    ] );

    // Separate BAC WATER to always show at the end in the UI
    $pinned  = [];
    $regular = [];
    foreach ( $raw as $p ) {
        if ( $p->post_name === VPP_LAST_SLUG ) {
            $pinned[] = $p;
        } else {
            $regular[] = $p;
        }
    }
    $products = array_merge( $regular, $pinned );

    ?>
    <div class="wrap" id="vpp-wrap">
        <h1 style="display:flex;align-items:center;gap:10px;">
            📋 Shop Product Order
            <span style="font-size:13px;font-weight:400;color:#888;margin-left:4px;">drag rows to reorder · saves to WooCommerce <code>menu_order</code></span>
        </h1>

        <div id="vpp-notice" style="display:none;margin:12px 0;"></div>

        <p style="font-size:13px;color:#555;max-width:600px;margin:0 0 16px;">
            Drag and drop products into the order you want them to appear on the shop page.
            <strong>BAC WATER</strong> is pinned to the last position automatically and cannot be moved up.
            Click <strong>Save Order</strong> when done.
        </p>

        <div style="display:flex;gap:12px;align-items:center;margin-bottom:20px;">
            <button id="vpp-save" class="button button-primary" style="font-size:14px;height:38px;padding:0 24px;">
                💾 Save Order
            </button>
            <span id="vpp-status" style="font-size:13px;color:#888;"></span>
        </div>

        <table class="wp-list-table widefat fixed striped" style="max-width:700px;">
            <thead>
                <tr>
                    <th style="width:40px;"></th>
                    <th style="width:60px;">Image</th>
                    <th>Product Name</th>
                    <th style="width:80px;text-align:center;">Position</th>
                    <th style="width:70px;text-align:center;">Stock</th>
                </tr>
            </thead>
            <tbody id="vpp-sortable">
                <?php foreach ( $products as $pos => $product ) :
                    $wc   = wc_get_product( $product->ID );
                    $img  = get_the_post_thumbnail_url( $product->ID, [ 48, 48 ] ) ?: wc_placeholder_img_src();
                    $pinned_row = ( $product->post_name === VPP_LAST_SLUG );
                    $stock = $wc ? ( $wc->is_in_stock() ? '<span style="color:#16a34a;">✔ In Stock</span>' : '<span style="color:#dc2626;">✘ Out</span>' ) : '—';
                    $price = $wc ? wc_price( $wc->get_price() ) : '—';
                    ?>
                    <tr data-id="<?php echo esc_attr( $product->ID ); ?>"
                        data-pinned="<?php echo $pinned_row ? '1' : '0'; ?>"
                        class="vpp-row<?php echo $pinned_row ? ' vpp-pinned' : ''; ?>"
                        style="cursor:<?php echo $pinned_row ? 'default' : 'grab'; ?>;">
                        <td style="text-align:center;color:#aaa;font-size:18px;">
                            <?php echo $pinned_row ? '📌' : '⠿'; ?>
                        </td>
                        <td>
                            <img src="<?php echo esc_url( $img ); ?>" width="40" height="40"
                                 style="object-fit:cover;border-radius:3px;display:block;" />
                        </td>
                        <td>
                            <strong><?php echo esc_html( $product->post_title ); ?></strong>
                            <br><span style="font-size:11px;color:#888;"><?php echo esc_html( $product->post_name ); ?></span>
                            <?php if ( $pinned_row ) : ?>
                                <span style="font-size:11px;background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:10px;margin-left:6px;">pinned last</span>
                            <?php endif; ?>
                        </td>
                        <td style="text-align:center;color:#888;font-size:13px;" class="vpp-pos">
                            <?php echo $pinned_row ? '—' : ( $pos + 1 ); ?>
                        </td>
                        <td style="text-align:center;font-size:12px;">
                            <?php echo $stock; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>

        <p style="font-size:12px;color:#999;margin-top:12px;">
            Changes take effect on the live storefront immediately after saving.
            The React frontend fetches products with <code>orderby=menu_order&amp;order=asc</code>.
        </p>
    </div>
    <?php
}
