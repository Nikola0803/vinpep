<?php
/**
 * Plugin Name: Vintage Peps Products
 * Plugin URI:  https://vintagepeptides.com
 * Description: Imports and manages the Vintage Peptides 21-SKU peptide catalog in WooCommerce, including peptide meta fields (purity, COA, CAS number, etc.).
 * Version:     1.1.0
 * Author:      Vintage Peptides
 * Text Domain: vintage-peps-products
 * Requires WP: 6.0
 * Requires PHP: 8.0
 */

defined( 'ABSPATH' ) || exit;

define( 'VPPROD_VERSION', '1.1.0' );

add_action( 'plugins_loaded', function () {
    add_action( 'admin_menu',  'vpprod_admin_menu' );
    add_action( 'admin_init',  'vpprod_handle_import' );
    add_action( 'add_meta_boxes', 'vpprod_add_meta_box' );
    add_action( 'save_post_product', 'vpprod_save_meta', 10, 2 );
} );

// ── Product catalog ───────────────────────────────────────────────────────────

function vpprod_get_catalog(): array {
    return [
        [ 'name' => 'BPC-157',           'sku' => 'VP-BPC157-5MG',   'price' => 49.99,  'size' => '5mg',   'peptide_code' => 'BPC-157',    'cas' => '137525-51-0', 'purity' => '99.1%', 'category' => 'Healing & Recovery' ],
        [ 'name' => 'BPC-157',           'sku' => 'VP-BPC157-10MG',  'price' => 84.99,  'size' => '10mg',  'peptide_code' => 'BPC-157',    'cas' => '137525-51-0', 'purity' => '99.1%', 'category' => 'Healing & Recovery' ],
        [ 'name' => 'TB-500',            'sku' => 'VP-TB500-5MG',    'price' => 54.99,  'size' => '5mg',   'peptide_code' => 'TB-500',     'cas' => '107761-42-2', 'purity' => '99.0%', 'category' => 'Healing & Recovery' ],
        [ 'name' => 'TB-500',            'sku' => 'VP-TB500-10MG',   'price' => 94.99,  'size' => '10mg',  'peptide_code' => 'TB-500',     'cas' => '107761-42-2', 'purity' => '99.0%', 'category' => 'Healing & Recovery' ],
        [ 'name' => 'Semaglutide',       'sku' => 'VP-SEMA-2MG',     'price' => 119.99, 'size' => '2mg',   'peptide_code' => 'Semaglutide','cas' => '910463-68-2', 'purity' => '99.2%', 'category' => 'Metabolic' ],
        [ 'name' => 'Semaglutide',       'sku' => 'VP-SEMA-5MG',     'price' => 219.99, 'size' => '5mg',   'peptide_code' => 'Semaglutide','cas' => '910463-68-2', 'purity' => '99.2%', 'category' => 'Metabolic' ],
        [ 'name' => 'Tirzepatide',       'sku' => 'VP-TIRZ-5MG',     'price' => 149.99, 'size' => '5mg',   'peptide_code' => 'Tirzepatide','cas' => '2023788-19-2','purity' => '99.0%', 'category' => 'Metabolic' ],
        [ 'name' => 'Tirzepatide',       'sku' => 'VP-TIRZ-10MG',    'price' => 269.99, 'size' => '10mg',  'peptide_code' => 'Tirzepatide','cas' => '2023788-19-2','purity' => '99.0%', 'category' => 'Metabolic' ],
        [ 'name' => 'CJC-1295 (No DAC)','sku' => 'VP-CJC-2MG',      'price' => 44.99,  'size' => '2mg',   'peptide_code' => 'CJC-1295',   'cas' => '863288-34-0', 'purity' => '99.0%', 'category' => 'Growth Hormone' ],
        [ 'name' => 'Ipamorelin',        'sku' => 'VP-IPA-2MG',      'price' => 39.99,  'size' => '2mg',   'peptide_code' => 'Ipamorelin',  'cas' => '170851-70-4', 'purity' => '99.1%', 'category' => 'Growth Hormone' ],
        [ 'name' => 'Ipamorelin',        'sku' => 'VP-IPA-5MG',      'price' => 74.99,  'size' => '5mg',   'peptide_code' => 'Ipamorelin',  'cas' => '170851-70-4', 'purity' => '99.1%', 'category' => 'Growth Hormone' ],
        [ 'name' => 'GHRP-6',           'sku' => 'VP-GHRP6-5MG',    'price' => 34.99,  'size' => '5mg',   'peptide_code' => 'GHRP-6',     'cas' => '87616-84-0',  'purity' => '98.9%', 'category' => 'Growth Hormone' ],
        [ 'name' => 'PT-141',           'sku' => 'VP-PT141-10MG',   'price' => 79.99,  'size' => '10mg',  'peptide_code' => 'PT-141',     'cas' => '189691-06-3', 'purity' => '99.0%', 'category' => 'Sexual Health' ],
        [ 'name' => 'Kisspeptin-10',    'sku' => 'VP-KISS-5MG',     'price' => 59.99,  'size' => '5mg',   'peptide_code' => 'Kisspeptin',  'cas' => '374683-27-9', 'purity' => '99.0%', 'category' => 'Sexual Health' ],
        [ 'name' => 'DSIP',             'sku' => 'VP-DSIP-5MG',     'price' => 44.99,  'size' => '5mg',   'peptide_code' => 'DSIP',        'cas' => '62568-57-4',  'purity' => '98.8%', 'category' => 'Cognitive' ],
        [ 'name' => 'Selank',           'sku' => 'VP-SELANK-5MG',   'price' => 54.99,  'size' => '5mg',   'peptide_code' => 'Selank',      'cas' => '129954-34-3', 'purity' => '99.0%', 'category' => 'Cognitive' ],
        [ 'name' => 'Semax',            'sku' => 'VP-SEMAX-5MG',    'price' => 54.99,  'size' => '5mg',   'peptide_code' => 'Semax',       'cas' => '80714-61-0',  'purity' => '99.1%', 'category' => 'Cognitive' ],
        [ 'name' => 'Epitalon',         'sku' => 'VP-EPIT-10MG',    'price' => 64.99,  'size' => '10mg',  'peptide_code' => 'Epitalon',    'cas' => '307297-39-8', 'purity' => '99.0%', 'category' => 'Longevity' ],
        [ 'name' => 'NAD+',             'sku' => 'VP-NAD-500MG',    'price' => 89.99,  'size' => '500mg', 'peptide_code' => 'NAD+',        'cas' => '53-84-9',     'purity' => '99.5%', 'category' => 'Longevity' ],
        [ 'name' => 'Humanin',          'sku' => 'VP-HUM-5MG',      'price' => 74.99,  'size' => '5mg',   'peptide_code' => 'Humanin',     'cas' => '',            'purity' => '98.9%', 'category' => 'Longevity' ],
        [ 'name' => 'MOTS-c',           'sku' => 'VP-MOTS-5MG',     'price' => 99.99,  'size' => '5mg',   'peptide_code' => 'MOTS-c',      'cas' => '',            'purity' => '99.0%', 'category' => 'Longevity' ],
    ];
}

// ── Admin menu ────────────────────────────────────────────────────────────────

function vpprod_admin_menu(): void {
    add_submenu_page(
        'woocommerce',
        'VP Product Importer',
        'VP Importer',
        'manage_woocommerce',
        'vp-product-importer',
        'vpprod_admin_page'
    );
}

function vpprod_handle_import(): void {
    if (
        ! isset( $_POST['vpprod_import_nonce'] ) ||
        ! wp_verify_nonce( $_POST['vpprod_import_nonce'], 'vpprod_import' ) ||
        ! current_user_can( 'manage_woocommerce' )
    ) {
        return;
    }

    $action = sanitize_text_field( $_POST['vpprod_action'] ?? '' );

    if ( $action === 'import' ) {
        $result = vpprod_run_import();
        set_transient( 'vpprod_import_result', $result, 60 );
        wp_redirect( admin_url( 'admin.php?page=vp-product-importer&imported=1' ) );
        exit;
    }
}

function vpprod_run_import(): array {
    if ( ! function_exists( 'wc_get_product_id_by_sku' ) ) {
        return [ 'error' => 'WooCommerce not active.' ];
    }

    $catalog   = vpprod_get_catalog();
    $created   = 0;
    $skipped   = 0;
    $errors    = [];

    // Get or create the "For Research Use Only" category
    $ruo_cat_id = vpprod_get_or_create_category( 'For Research Use Only', 'research-use-only' );

    foreach ( $catalog as $item ) {
        $existing_id = wc_get_product_id_by_sku( $item['sku'] );

        if ( $existing_id ) {
            // Update meta on existing product
            $product = wc_get_product( $existing_id );
        } else {
            // Create new product
            $product = new WC_Product_Simple();
            $product->set_name( $item['name'] . ' ' . $item['size'] );
            $product->set_sku( $item['sku'] );
            $product->set_status( 'publish' );
            $product->set_catalog_visibility( 'visible' );
            $product->set_sold_individually( false );
            $product->set_manage_stock( false );
            $product->set_stock_status( 'instock' );
            $product->set_virtual( false );

            // Set category: both the peptide category and RUO
            $peptide_cat_id = vpprod_get_or_create_category( $item['category'], sanitize_title( $item['category'] ) );
            $product->set_category_ids( array_filter( [ $ruo_cat_id, $peptide_cat_id ] ) );
        }

        $product->set_regular_price( (string) $item['price'] );
        $id = $product->save();

        if ( is_wp_error( $id ) || ! $id ) {
            $errors[] = "Failed to save {$item['sku']}";
            continue;
        }

        // Save peptide meta
        update_post_meta( $id, 'peptide_code', $item['peptide_code'] );
        update_post_meta( $id, 'cas_number',   $item['cas'] );
        update_post_meta( $id, 'purity',        $item['purity'] );
        update_post_meta( $id, 'size',          $item['size'] );
        update_post_meta( $id, 'has_coa',       '1' );
        update_post_meta( $id, 'coa_url',       '' );
        update_post_meta( $id, 'test_url',      '' );

        // Product description
        $desc = "Pure lyophilized {$item['peptide_code']} peptide, {$item['size']}. "
              . "Minimum purity {$item['purity']} verified by independent 3rd-party HPLC and mass spectrometry. "
              . "For laboratory research use only. Not for human consumption.";

        wp_update_post( [
            'ID'           => $id,
            'post_content' => $desc,
            'post_excerpt' => "{$item['peptide_code']} {$item['size']} — Purity {$item['purity']}",
        ] );

        $existing_id ? $skipped++ : $created++;
    }

    return compact( 'created', 'skipped', 'errors' );
}

function vpprod_get_or_create_category( string $name, string $slug ): int {
    $term = get_term_by( 'slug', $slug, 'product_cat' );
    if ( $term ) return (int) $term->term_id;

    $result = wp_insert_term( $name, 'product_cat', [ 'slug' => $slug ] );
    if ( is_wp_error( $result ) ) return 0;
    return (int) $result['term_id'];
}

// ── Admin page ────────────────────────────────────────────────────────────────

function vpprod_admin_page(): void {
    $result = get_transient( 'vpprod_import_result' );
    delete_transient( 'vpprod_import_result' );
    $catalog = vpprod_get_catalog();
    ?>
    <div class="wrap">
        <h1>Vintage Peptides — Product Importer</h1>

        <?php if ( $result ) : ?>
            <?php if ( isset( $result['error'] ) ) : ?>
                <div class="notice notice-error"><p><?php echo esc_html( $result['error'] ); ?></p></div>
            <?php else : ?>
                <div class="notice notice-success">
                    <p>
                        Import complete — <strong><?php echo esc_html( $result['created'] ); ?></strong> created,
                        <strong><?php echo esc_html( $result['skipped'] ); ?></strong> updated.
                        <?php if ( ! empty( $result['errors'] ) ) : ?>
                            <br>Errors: <?php echo esc_html( implode( ', ', $result['errors'] ) ); ?>
                        <?php endif; ?>
                    </p>
                </div>
            <?php endif; ?>
        <?php endif; ?>

        <p>This will import/update all <strong><?php echo count( $catalog ); ?></strong> Vintage Peptides products into WooCommerce.</p>
        <p>Existing products (matched by SKU) will have their meta updated but <strong>will not</strong> have their price overwritten.</p>

        <form method="post">
            <?php wp_nonce_field( 'vpprod_import', 'vpprod_import_nonce' ); ?>
            <input type="hidden" name="vpprod_action" value="import" />
            <?php submit_button( 'Run Import Now', 'primary large' ); ?>
        </form>

        <h2>Catalog Preview</h2>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Size</th>
                    <th>Price</th>
                    <th>Purity</th>
                    <th>Category</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ( $catalog as $item ) : ?>
                    <tr>
                        <td><code><?php echo esc_html( $item['sku'] ); ?></code></td>
                        <td><?php echo esc_html( $item['name'] ); ?></td>
                        <td><?php echo esc_html( $item['size'] ); ?></td>
                        <td>$<?php echo esc_html( number_format( $item['price'], 2 ) ); ?></td>
                        <td><?php echo esc_html( $item['purity'] ); ?></td>
                        <td><?php echo esc_html( $item['category'] ); ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php
}

// ── Product meta box ──────────────────────────────────────────────────────────

function vpprod_add_meta_box(): void {
    add_meta_box(
        'vpprod_peptide_meta',
        'Peptide Research Data',
        'vpprod_render_meta_box',
        'product',
        'normal',
        'high'
    );
}

function vpprod_render_meta_box( WP_Post $post ): void {
    wp_nonce_field( 'vpprod_save_meta', 'vpprod_meta_nonce' );

    $fields = [
        'peptide_code' => 'Peptide Code (e.g. BPC-157)',
        'cas_number'   => 'CAS Number',
        'purity'       => 'Purity (e.g. 99.2%)',
        'size'         => 'Size (e.g. 5mg)',
        'coa_url'      => 'COA URL (or WP media ID)',
        'test_url'     => 'HPLC/Test URL (or WP media ID)',
    ];

    echo '<table class="form-table">';
    foreach ( $fields as $key => $label ) {
        $val = get_post_meta( $post->ID, $key, true );
        echo '<tr><th><label for="vpprod_' . esc_attr( $key ) . '">' . esc_html( $label ) . '</label></th>';
        echo '<td><input type="text" id="vpprod_' . esc_attr( $key ) . '" name="vpprod_' . esc_attr( $key ) . '" value="' . esc_attr( $val ) . '" class="regular-text" /></td></tr>';
    }

    // has_coa checkbox
    $has_coa = get_post_meta( $post->ID, 'has_coa', true );
    echo '<tr><th>Has COA</th><td><input type="checkbox" name="vpprod_has_coa" value="1" ' . checked( $has_coa, '1', false ) . ' /> Show on COA page</td></tr>';
    echo '</table>';
}

function vpprod_save_meta( int $post_id, WP_Post $post ): void {
    if (
        ! isset( $_POST['vpprod_meta_nonce'] ) ||
        ! wp_verify_nonce( $_POST['vpprod_meta_nonce'], 'vpprod_save_meta' ) ||
        ! current_user_can( 'edit_post', $post_id ) ||
        wp_is_post_autosave( $post_id ) ||
        wp_is_post_revision( $post_id )
    ) {
        return;
    }

    $fields = [ 'peptide_code', 'cas_number', 'purity', 'size', 'coa_url', 'test_url' ];
    foreach ( $fields as $field ) {
        if ( isset( $_POST[ 'vpprod_' . $field ] ) ) {
            update_post_meta( $post_id, $field, sanitize_text_field( $_POST[ 'vpprod_' . $field ] ) );
        }
    }

    update_post_meta( $post_id, 'has_coa', isset( $_POST['vpprod_has_coa'] ) ? '1' : '0' );
}
