<?php
/**
 * Plugin Name:  Vintage Peps — Product Importer
 * Plugin URI:   https://vintagepeptides.com
 * Description:  One-click WooCommerce product importer for the Vintage Peptides SKU catalog.
 *               Multi-dosage products are created as Variable products (Dosage attribute).
 *               Single-dosage products are created as Simple products.
 *               Sideloads product images from the Vercel frontend. Safe to re-run.
 * Version:      2.0.0
 * Author:       Velocity72 / Vintage Peptides
 * Requires WC:  6.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'VP_PRODUCTS_FRONTEND_URL_KEY', 'vp_products_frontend_url' );

// ─── Product Catalog ──────────────────────────────────────────────────────────
// type='variable' → WC_Product_Variable with Dosage attribute + variations.
// type='simple'   → WC_Product_Simple (single dosage).
//
// image: filename in public/products/ on the Vercel frontend ('' = no image yet).
// For variable products, the image is set on the parent product.
// has_coa at variation level overrides parent when set.

function vp_products_catalog(): array {
    return [

        // ── VARIABLE ─────────────────────────────────────────────────────────

        [
            'type'         => 'variable',
            'name'         => 'BPC-157 / TB-500 Blend',
            'peptide_code' => 'BPC-157 + Thymosin β4 Fragment',
            'cas'          => '137525-51-0 / 885340-08-9',
            'purity'       => '99.1%',
            'category'     => 'Blends',
            'featured'     => true,
            'has_coa'      => true,
            'image'        => 'bpc-157 tb-500 blend.png',
            'description'  => 'Synergistic blend of pentadecapeptide BPC-157 and Thymosin Beta-4 fragment for connective tissue, cellular repair, and angiogenesis research. For research use only.',
            'variations'   => [
                [ 'sku' => 'VP-BPC-TB-10', 'dosage' => '10mg', 'price' => '89.00'  ],
                [ 'sku' => 'VP-BPC-TB-20', 'dosage' => '20mg', 'price' => '149.00' ],
            ],
        ],

        [
            'type'         => 'variable',
            'name'         => 'Semaglutide',
            'peptide_code' => 'GLP-1 Receptor Agonist',
            'cas'          => '910463-68-2',
            'purity'       => '99.2%',
            'category'     => 'GLP-1 Compounds',
            'featured'     => true,
            'has_coa'      => true,
            'image'        => 'semaglitude 5mg.png',
            'description'  => 'Long-acting GLP-1 analog for metabolic homeostasis, pancreatic beta-cell function, and glycemic regulation research. For research use only.',
            'variations'   => [
                [ 'sku' => 'VP-SEMA-5',  'dosage' => '5mg',  'price' => '149.00' ],
                [ 'sku' => 'VP-SEMA-10', 'dosage' => '10mg', 'price' => '249.00' ],
            ],
        ],

        [
            'type'         => 'variable',
            'name'         => 'Tirzepatide',
            'peptide_code' => 'Dual GIP / GLP-1 Agonist',
            'cas'          => '2023788-19-2',
            'purity'       => '99.0%',
            'category'     => 'GLP-1 Compounds',
            'featured'     => true,
            'has_coa'      => true,
            'image'        => 'tirzepaatide 10mg.png',
            'description'  => 'Novel dual incretin receptor agonist activating both GIP and GLP-1 pathways for advanced metabolic signaling research. For research use only.',
            'variations'   => [
                [ 'sku' => 'VP-TIRZ-10', 'dosage' => '10mg', 'price' => '219.00' ],
                [ 'sku' => 'VP-TIRZ-15', 'dosage' => '15mg', 'price' => '279.00' ],
                [ 'sku' => 'VP-TIRZ-30', 'dosage' => '30mg', 'price' => '399.00' ],
            ],
        ],

        [
            'type'         => 'variable',
            'name'         => 'Retatrutide',
            'peptide_code' => 'Triple GLP-1 / GIP / Glucagon Agonist',
            'cas'          => '2381089-83-2',
            'purity'       => '98.9%',
            'category'     => 'GLP-1 Compounds',
            'featured'     => true,
            'has_coa'      => true,
            'image'        => 'retatrutide 15mg.png',
            'description'  => 'Triple agonist targeting GLP-1, GIP, and glucagon receptors for multi-pathway incretin and energy homeostasis research. For research use only.',
            'variations'   => [
                [ 'sku' => 'VP-RETA-10', 'dosage' => '10mg', 'price' => '229.00' ],
                [ 'sku' => 'VP-RETA-15', 'dosage' => '15mg', 'price' => '299.00' ],
                [ 'sku' => 'VP-RETA-30', 'dosage' => '30mg', 'price' => '449.00' ],
            ],
        ],

        [
            'type'         => 'variable',
            'name'         => 'Tesamorelin',
            'peptide_code' => 'GHRH Analog (Trans-3-Hexenoic Acid)',
            'cas'          => '218949-48-9',
            'purity'       => '99.1%',
            'category'     => 'Peptides',
            'featured'     => false,
            'has_coa'      => true,
            'image'        => 'tesamorelin vp.png',
            'description'  => 'Stabilized GHRH analog for growth hormone axis activation, adipogenesis modulation, and somatotropic signaling research. For research use only.',
            'variations'   => [
                [ 'sku' => 'VP-TESA-10', 'dosage' => '10mg', 'price' => '149.00', 'has_coa' => true  ],
                [ 'sku' => 'VP-TESA-20', 'dosage' => '20mg', 'price' => '249.00', 'has_coa' => false ],
            ],
        ],

        // ── SIMPLE ───────────────────────────────────────────────────────────

        [
            'type'         => 'simple',
            'name'         => 'CJC-1295 / Ipamorelin Blend',
            'sku'          => 'VP-CJC-IPA-10',
            'peptide_code' => 'CJC-1295 (No DAC) 5mg + Ipamorelin 5mg',
            'cas'          => '863288-34-0 / 170851-70-4',
            'dosage'       => '10mg',
            'purity'       => '99.0%',
            'price'        => '99.00',
            'category'     => 'Blends',
            'featured'     => true,
            'has_coa'      => true,
            'image'        => 'cjc-1295 ipamorelin blend vp.png',
            'description'  => 'Combined GHRH analog and selective GH secretagogue blend for pituitary axis, growth hormone pulse, and somatotropic signaling research. For research use only.',
        ],

        [
            'type'         => 'simple',
            'name'         => 'Glow',
            'sku'          => 'VP-GLOW-70',
            'peptide_code' => 'Dermal Matrix Peptide Blend',
            'cas'          => 'Proprietary',
            'dosage'       => '70mg',
            'purity'       => '98.5%',
            'price'        => '149.00',
            'category'     => 'Blends',
            'featured'     => false,
            'has_coa'      => true,
            'image'        => 'glow 70mg.png',
            'description'  => 'Proprietary peptide blend for dermal matrix integrity, collagen synthesis pathway modulation, and extracellular matrix research. For research use only.',
        ],

        [
            'type'         => 'simple',
            'name'         => 'Klow',
            'sku'          => 'VP-KLOW-80',
            'peptide_code' => 'Kinase Pathway Peptide Blend',
            'cas'          => 'Proprietary',
            'dosage'       => '80mg',
            'purity'       => '98.5%',
            'price'        => '149.00',
            'category'     => 'Blends',
            'featured'     => false,
            'has_coa'      => true,
            'image'        => 'klow vp.png',
            'description'  => 'Proprietary peptide compound blend for cellular kinase pathway modulation, signal transduction, and downstream receptor research. For research use only.',
        ],

        [
            'type'         => 'simple',
            'name'         => 'KPV',
            'sku'          => 'VP-KPV-10',
            'peptide_code' => 'Lys-Pro-Val Tripeptide',
            'cas'          => '5765-44-6',
            'dosage'       => '10mg',
            'purity'       => '99.3%',
            'price'        => '89.00',
            'category'     => 'Peptides',
            'featured'     => false,
            'has_coa'      => true,
            'image'        => '',
            'description'  => 'Anti-inflammatory tripeptide α-MSH fragment for mucosal barrier function, NF-κB pathway inhibition, and cytokine signaling research. For research use only.',
        ],

        [
            'type'         => 'simple',
            'name'         => 'MOTS-C',
            'sku'          => 'VP-MOTSC-10',
            'peptide_code' => 'Mitochondrial ORF of the 12S rRNA-c',
            'cas'          => '1627580-64-6',
            'dosage'       => '10mg',
            'purity'       => '99.0%',
            'price'        => '119.00',
            'category'     => 'Bioregulators',
            'featured'     => false,
            'has_coa'      => true,
            'image'        => 'mot-sc.png',
            'description'  => 'Mitochondrial-derived peptide for AMPK activation, mitochondrial biogenesis, and cellular energy metabolism research. For research use only.',
        ],

        [
            'type'         => 'simple',
            'name'         => 'GHK-Cu',
            'sku'          => 'VP-GHKCU-50',
            'peptide_code' => 'Copper Peptide GHK-Cu',
            'cas'          => '89030-95-5',
            'dosage'       => '50mg',
            'purity'       => '99.4%',
            'price'        => '79.00',
            'category'     => 'Peptides',
            'featured'     => false,
            'has_coa'      => true,
            'image'        => '',
            'description'  => 'Tripeptide-copper complex for wound healing cascade, tissue remodeling, collagen synthesis, and gene expression research. For research use only.',
        ],

        [
            'type'         => 'simple',
            'name'         => 'NAD+',
            'sku'          => 'VP-NAD-500',
            'peptide_code' => 'Nicotinamide Adenine Dinucleotide',
            'cas'          => '53-84-9',
            'dosage'       => '500mg',
            'purity'       => '99.5%',
            'price'        => '89.00',
            'category'     => 'Bioregulators',
            'featured'     => false,
            'has_coa'      => true,
            'image'        => '',
            'description'  => 'Oxidized coenzyme for mitochondrial electron transport, sirtuin activation, DNA repair, and cellular energy metabolism research. For research use only.',
        ],

        [
            'type'         => 'simple',
            'name'         => 'Thymosin Alpha-1',
            'sku'          => 'VP-TA1-5',
            'peptide_code' => 'Tα1 — Thymic Immunomodulatory Peptide',
            'cas'          => '62304-98-7',
            'dosage'       => '5mg',
            'purity'       => '99.0%',
            'price'        => '99.00',
            'category'     => 'Peptides',
            'featured'     => false,
            'has_coa'      => false,
            'image'        => 'thymosin alpha 1.png',
            'description'  => 'Thymic bioregulatory peptide for dendritic cell maturation, T-lymphocyte differentiation, and innate immune signaling research. For research use only.',
        ],

        [
            'type'         => 'simple',
            'name'         => 'Cartalax',
            'sku'          => 'VP-CARTA-20',
            'peptide_code' => 'Ala-Glu-Asp Bioregulatory Tripeptide',
            'cas'          => '1255581-01-1',
            'dosage'       => '20mg',
            'purity'       => '98.8%',
            'price'        => '149.00',
            'category'     => 'Bioregulators',
            'featured'     => false,
            'has_coa'      => false,
            'image'        => '',
            'description'  => 'Bioregulatory tripeptide for cartilage extracellular matrix synthesis, proteoglycan expression, and chondrocyte viability research. For research use only.',
        ],
    ];
}

// ─── Admin Menu ───────────────────────────────────────────────────────────────

add_action( 'admin_menu', 'vp_products_admin_menu' );
function vp_products_admin_menu() {
    add_submenu_page(
        'woocommerce',
        'Product Importer',
        'Product Importer',
        'manage_woocommerce',
        'vp-product-importer',
        'vp_products_admin_page'
    );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────

function vp_products_admin_page() {
    $results     = [];
    $img_results = [];
    $del_count   = 0;
    $notices     = [];

    // ── Save settings
    if ( isset( $_POST['vp_save_settings_nonce'] )
         && wp_verify_nonce( $_POST['vp_save_settings_nonce'], 'vp_save_settings' ) ) {
        $url = esc_url_raw( rtrim( $_POST['vp_frontend_url'] ?? '', '/' ) );
        update_option( VP_PRODUCTS_FRONTEND_URL_KEY, $url );
        $notices[] = [ 'type' => 'success', 'msg' => 'Settings saved.' ];
    }

    // ── Delete all VP products
    if ( isset( $_POST['vp_delete_nonce'] )
         && wp_verify_nonce( $_POST['vp_delete_nonce'], 'vp_delete_products' ) ) {
        $del_count = vp_products_delete_all();
        $notices[] = [ 'type' => 'success', 'msg' => "Deleted {$del_count} product(s)." ];
    }

    // ── Import
    if ( isset( $_POST['vp_import_nonce'] )
         && wp_verify_nonce( $_POST['vp_import_nonce'], 'vp_import_products' ) ) {
        $selected    = $_POST['selected_skus'] ?? [];
        $with_images = ! empty( $_POST['vp_with_images'] );
        foreach ( vp_products_catalog() as $item ) {
            $primary_sku = $item['type'] === 'simple' ? $item['sku'] : ( $item['variations'][0]['sku'] ?? '' );
            if ( ! empty( $selected ) && ! in_array( $primary_sku, $selected, true ) ) {
                continue;
            }
            $results[] = vp_products_import_one( $item, $with_images );
        }
    }

    // ── Set images only
    if ( isset( $_POST['vp_images_nonce'] )
         && wp_verify_nonce( $_POST['vp_images_nonce'], 'vp_set_images' ) ) {
        foreach ( vp_products_catalog() as $item ) {
            if ( empty( $item['image'] ) ) {
                continue;
            }
            // Find parent product id
            $product_id = vp_find_parent_id( $item );
            $label      = $item['type'] === 'simple' ? $item['sku'] : ( $item['variations'][0]['sku'] ?? $item['name'] );
            if ( ! $product_id ) {
                $img_results[] = [ 'label' => $label, 'name' => $item['name'], 'status' => 'not_found' ];
                continue;
            }
            $r             = vp_products_set_image( $product_id, $item );
            $r['label']    = $label;
            $img_results[] = $r;
        }
    }

    $catalog      = vp_products_catalog();
    $frontend_url = get_option( VP_PRODUCTS_FRONTEND_URL_KEY, 'https://vintagepeptides.com' );

    ?>
    <div class="wrap">
    <h1 style="display:flex;align-items:center;gap:10px;">
        <span class="dashicons dashicons-archive" style="font-size:26px;color:#b8942a;"></span>
        Vintage Peptides — Product Importer
    </h1>

    <?php foreach ( $notices as $n ) : ?>
        <div class="notice notice-<?php echo esc_attr( $n['type'] ); ?> is-dismissible">
            <p><?php echo esc_html( $n['msg'] ); ?></p>
        </div>
    <?php endforeach; ?>

    <?php /* ── Settings ── */ ?>
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px;max-width:700px;">
        <h2 style="margin-top:0;font-size:15px;">Settings</h2>
        <form method="post">
            <?php wp_nonce_field( 'vp_save_settings', 'vp_save_settings_nonce' ); ?>
            <table class="form-table" style="margin:0;">
                <tr>
                    <th style="padding:8px 16px 8px 0;white-space:nowrap;">Frontend URL</th>
                    <td>
                        <input type="url" name="vp_frontend_url"
                               value="<?php echo esc_attr( $frontend_url ); ?>"
                               style="width:360px;" placeholder="https://vintagepeptides.com">
                        <p class="description" style="margin-top:4px;">
                            Base URL of the Vercel frontend. Images are fetched from
                            <code>{url}/products/{filename}</code>.
                        </p>
                    </td>
                </tr>
            </table>
            <button type="submit" class="button button-secondary" style="margin-top:10px;">Save</button>
        </form>
    </div>

    <?php /* ── Danger zone ── */ ?>
    <div style="background:#fff;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin-bottom:20px;max-width:700px;">
        <h2 style="margin-top:0;font-size:15px;color:#dc2626;">⚠ Delete All VP Products</h2>
        <p style="margin:0 0 12px;color:#6b7280;font-size:13px;">
            Permanently deletes every WooCommerce product and variation whose SKU starts with <code>VP-</code>.
            Use this to clean up Simple products before re-importing as Variable. This cannot be undone.
        </p>
        <form method="post" onsubmit="return confirm('Delete ALL Vintage Peptides products? This cannot be undone.');">
            <?php wp_nonce_field( 'vp_delete_products', 'vp_delete_nonce' ); ?>
            <button type="submit" class="button" style="color:#dc2626;border-color:#fca5a5;height:34px;">
                Delete All VP Products
            </button>
        </form>
    </div>

    <?php /* ── Import results ── */ ?>
    <?php if ( ! empty( $results ) ) : ?>
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:20px;">
        <h2 style="margin-top:0;">Import Results</h2>
        <table class="widefat striped">
            <thead><tr><th>Product</th><th>Type</th><th>Result</th><th>Image</th><th>WC ID</th></tr></thead>
            <tbody>
            <?php foreach ( $results as $r ) : ?>
                <tr>
                    <td><strong><?php echo esc_html( $r['name'] ); ?></strong></td>
                    <td><?php echo esc_html( $r['type'] ); ?></td>
                    <td>
                        <?php if ( $r['status'] === 'created' ) : ?>
                            <span style="color:#16a34a;font-weight:600;">✓ Created</span>
                            <?php if ( ! empty( $r['variation_count'] ) ) : ?>
                                <span style="color:#6b7280;font-size:11px;">(<?php echo (int) $r['variation_count']; ?> variations)</span>
                            <?php endif; ?>
                        <?php elseif ( $r['status'] === 'exists' ) : ?>
                            <span style="color:#6b7280;">— Already exists</span>
                        <?php else : ?>
                            <span style="color:#dc2626;">✗ <?php echo esc_html( $r['error'] ?? 'Error' ); ?></span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <?php if ( ( $r['image_status'] ?? '' ) === 'set' ) : ?>
                            <span style="color:#16a34a;">✓</span>
                        <?php elseif ( ( $r['image_status'] ?? '' ) === 'error' ) : ?>
                            <span style="color:#f59e0b;" title="<?php echo esc_attr( $r['image_error'] ?? '' ); ?>">⚠ Failed</span>
                        <?php elseif ( ( $r['image_status'] ?? '' ) === 'none' ) : ?>
                            <span style="color:#d1d5db;">—</span>
                        <?php else : ?>—<?php endif; ?>
                    </td>
                    <td>
                        <?php if ( ! empty( $r['wc_id'] ) ) : ?>
                            <a href="<?php echo esc_url( get_edit_post_link( $r['wc_id'] ) ); ?>" target="_blank">#<?php echo (int) $r['wc_id']; ?></a>
                        <?php else : ?>—<?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>

    <?php /* ── Image-only results ── */ ?>
    <?php if ( ! empty( $img_results ) ) : ?>
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:20px;">
        <h2 style="margin-top:0;">Image Sync Results</h2>
        <table class="widefat striped">
            <thead><tr><th>Product</th><th>Result</th></tr></thead>
            <tbody>
            <?php foreach ( $img_results as $r ) : ?>
                <tr>
                    <td><?php echo esc_html( $r['name'] ?? '' ); ?></td>
                    <td>
                        <?php if ( $r['status'] === 'set' ) : ?>
                            <span style="color:#16a34a;font-weight:600;">✓ Image set</span>
                        <?php elseif ( $r['status'] === 'not_found' ) : ?>
                            <span style="color:#6b7280;">— Not in WC yet</span>
                        <?php elseif ( $r['status'] === 'none' ) : ?>
                            <span style="color:#9ca3af;">No image mapped</span>
                        <?php else : ?>
                            <span style="color:#dc2626;">✗ <?php echo esc_html( $r['error'] ?? 'Failed' ); ?></span>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>

    <?php /* ── Main import form ── */ ?>
    <form method="post">
        <?php wp_nonce_field( 'vp_import_products', 'vp_import_nonce' ); ?>

        <?php
        // Count stats
        $total_products = count( $catalog );
        $imported       = 0;
        $has_image      = 0;
        foreach ( $catalog as $item ) {
            $pid = vp_find_parent_id( $item );
            if ( $pid ) {
                $imported++;
                if ( get_post_thumbnail_id( $pid ) ) {
                    $has_image++;
                }
            }
        }
        ?>

        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
            <button type="submit" class="button button-primary"
                    style="background:#b8942a;border-color:#9a7a20;height:36px;padding:0 20px;font-size:14px;"
                    onclick="selectAll();">
                Import All
            </button>
            <button type="submit" class="button" style="height:36px;">
                Import Selected
            </button>
            <label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer;">
                <input type="checkbox" name="vp_with_images" value="1" checked>
                Include images
            </label>
            <span style="color:#6b7280;font-size:13px;margin-left:6px;">
                <?php echo "{$imported}/{$total_products} in WooCommerce &nbsp;·&nbsp; {$has_image}/{$total_products} with images"; ?>
            </span>
        </div>

        <table class="widefat striped">
            <thead>
                <tr>
                    <th style="width:28px;">
                        <input type="checkbox" onchange="document.querySelectorAll('.vp-cb').forEach(c=>c.checked=this.checked)">
                    </th>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Dosages / SKUs</th>
                    <th>Category</th>
                    <th>COA</th>
                    <th>Image</th>
                    <th>WC Status</th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ( $catalog as $item ) :
                $parent_id = vp_find_parent_id( $item );
                $img_set   = $parent_id && get_post_thumbnail_id( $parent_id );
                $primary_sku = $item['type'] === 'simple'
                    ? $item['sku']
                    : ( $item['variations'][0]['sku'] ?? '' );
            ?>
                <tr style="<?php echo $parent_id ? 'opacity:0.55;' : ''; ?>">
                    <td>
                        <input type="checkbox" name="selected_skus[]" class="vp-cb"
                               value="<?php echo esc_attr( $primary_sku ); ?>"
                               <?php checked( ! $parent_id ); ?>
                               <?php echo $parent_id ? 'disabled' : ''; ?>>
                    </td>
                    <td>
                        <strong><?php echo esc_html( $item['name'] ); ?></strong>
                        <div style="font-size:11px;color:#9ca3af;"><?php echo esc_html( $item['peptide_code'] ); ?></div>
                    </td>
                    <td>
                        <span style="background:<?php echo $item['type'] === 'variable' ? '#dbeafe' : '#f3f4f6'; ?>;
                                     color:<?php echo $item['type'] === 'variable' ? '#1d4ed8' : '#374151'; ?>;
                                     padding:2px 6px;border-radius:4px;font-size:11px;font-weight:600;">
                            <?php echo esc_html( $item['type'] ); ?>
                        </span>
                    </td>
                    <td style="font-size:12px;">
                        <?php if ( $item['type'] === 'variable' ) : ?>
                            <?php foreach ( $item['variations'] as $v ) : ?>
                                <div style="color:#374151;">
                                    <code style="font-size:10px;"><?php echo esc_html( $v['sku'] ); ?></code>
                                    — <?php echo esc_html( $v['dosage'] ); ?> · $<?php echo esc_html( $v['price'] ); ?>
                                </div>
                            <?php endforeach; ?>
                        <?php else : ?>
                            <code style="font-size:10px;"><?php echo esc_html( $item['sku'] ); ?></code>
                            — <?php echo esc_html( $item['dosage'] ); ?> · $<?php echo esc_html( $item['price'] ); ?>
                        <?php endif; ?>
                    </td>
                    <td><?php echo esc_html( $item['category'] ); ?></td>
                    <td><?php echo $item['has_coa'] ? '<span style="color:#16a34a;">✓</span>' : '<span style="color:#f59e0b;">Pending</span>'; ?></td>
                    <td style="font-size:11px;">
                        <?php if ( empty( $item['image'] ) ) : ?>
                            <span style="color:#d1d5db;">—</span>
                        <?php elseif ( $img_set ) : ?>
                            <span style="color:#16a34a;">✓ Set</span>
                        <?php else : ?>
                            <span style="color:#6b7280;"><?php echo esc_html( $item['image'] ); ?></span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <?php if ( $parent_id ) : ?>
                            <a href="<?php echo esc_url( get_edit_post_link( $parent_id ) ); ?>"
                               target="_blank" style="color:#16a34a;font-weight:600;">
                                In WC #<?php echo (int) $parent_id; ?>
                            </a>
                        <?php else : ?>
                            <span style="color:#6b7280;">Not imported</span>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </form>

    <?php /* ── Set Images Only ── */ ?>
    <div style="margin-top:16px;">
        <form method="post">
            <?php wp_nonce_field( 'vp_set_images', 'vp_images_nonce' ); ?>
            <button type="submit" class="button" style="height:36px;"
                    onclick="return confirm('Download and set images for all imported products?');">
                <span class="dashicons dashicons-format-image" style="line-height:1.8;margin-right:4px;"></span>
                Set Images for All Imported Products
            </button>
            <p class="description" style="margin-top:6px;">
                Downloads each mapped image from <strong><?php echo esc_html( $frontend_url ); ?>/products/…</strong>
                into the WP media library and sets it as the product thumbnail.
                Safe to run after importing products without images.
            </p>
        </form>
    </div>

    </div>
    <script>
    function selectAll() {
        document.querySelectorAll('.vp-cb:not(:disabled)').forEach(c => c.checked = true);
    }
    </script>
    <?php
}

// ─── Find parent WC product ID for a catalog entry ───────────────────────────
// For simple: look up by SKU directly.
// For variable: look up first variation's SKU, then get its parent.

function vp_find_parent_id( array $item ): ?int {
    if ( $item['type'] === 'simple' ) {
        $id = wc_get_product_id_by_sku( $item['sku'] );
        return $id ?: null;
    }
    // Variable — check first variation SKU
    $first_sku = $item['variations'][0]['sku'] ?? '';
    if ( ! $first_sku ) {
        return null;
    }
    $var_id = wc_get_product_id_by_sku( $first_sku );
    if ( ! $var_id ) {
        return null;
    }
    $product = wc_get_product( $var_id );
    if ( ! $product ) {
        return null;
    }
    // If it's a variation, return its parent; if somehow a Simple, return itself
    if ( $product->is_type( 'variation' ) ) {
        return (int) $product->get_parent_id() ?: null;
    }
    return (int) $var_id;
}

// ─── Delete all VP products ───────────────────────────────────────────────────
// Queries WC for products/variations whose _sku meta starts with "VP-".

function vp_products_delete_all(): int {
    global $wpdb;

    $ids = $wpdb->get_col(
        "SELECT post_id FROM {$wpdb->postmeta}
         WHERE meta_key = '_sku' AND meta_value LIKE 'VP-%'"
    );

    $deleted = 0;
    $parents = [];

    foreach ( $ids as $id ) {
        $product = wc_get_product( $id );
        if ( ! $product ) {
            continue;
        }
        if ( $product->is_type( 'variation' ) ) {
            $parents[] = (int) $product->get_parent_id();
        } else {
            wp_delete_post( (int) $id, true );
            $deleted++;
        }
    }

    // Delete parent Variable products (also deletes their variations)
    foreach ( array_unique( $parents ) as $pid ) {
        wp_delete_post( $pid, true );
        $deleted++;
    }

    return $deleted;
}

// ─── Import dispatcher ────────────────────────────────────────────────────────

function vp_products_import_one( array $item, bool $with_images = true ): array {
    return $item['type'] === 'variable'
        ? vp_import_variable( $item, $with_images )
        : vp_import_simple( $item, $with_images );
}

// ─── Import Variable product ──────────────────────────────────────────────────

function vp_import_variable( array $item, bool $with_images ): array {
    $base = [ 'name' => $item['name'], 'type' => 'variable', 'wc_id' => null ];

    // Already exists? Check first variation SKU
    if ( vp_find_parent_id( $item ) ) {
        $pid = vp_find_parent_id( $item );
        return array_merge( $base, [ 'status' => 'exists', 'wc_id' => $pid ] );
    }

    try {
        $parent = new WC_Product_Variable();
        $parent->set_name( $item['name'] );
        $parent->set_status( 'publish' );
        $parent->set_catalog_visibility( 'visible' );
        $parent->set_description( wp_kses_post( $item['description'] ) );
        $parent->set_short_description( wp_kses_post( $item['description'] ) );
        $parent->set_featured( $item['featured'] );

        // Shared meta
        $parent->update_meta_data( 'peptide_code',   $item['peptide_code'] );
        $parent->update_meta_data( 'cas_number',     $item['cas'] );
        $parent->update_meta_data( 'purity',         $item['purity'] );
        $parent->update_meta_data( 'has_coa',        $item['has_coa'] ? '1' : '0' );
        $parent->update_meta_data( 'ruo_disclaimer', 'For research use only. Not for human consumption.' );

        // Dosage attribute — local (id=0), variation-enabled
        $dosages   = array_column( $item['variations'], 'dosage' );
        $attribute = new WC_Product_Attribute();
        $attribute->set_id( 0 );
        $attribute->set_name( 'Dosage' );
        $attribute->set_options( $dosages );
        $attribute->set_position( 0 );
        $attribute->set_visible( true );
        $attribute->set_variation( true );
        $parent->set_attributes( [ $attribute ] );

        $parent_id = $parent->save();

        if ( ! $parent_id ) {
            return array_merge( $base, [ 'status' => 'error', 'error' => 'parent save() returned 0' ] );
        }

        // Category + tag
        vp_assign_category( $parent_id, $item['category'] );
        wp_set_object_terms(
            $parent_id,
            $item['has_coa'] ? [ 'coa-verified' ] : [ 'coa-pending' ],
            'product_tag'
        );

        // Create variations
        $var_count = 0;
        foreach ( $item['variations'] as $vdata ) {
            $variation = new WC_Product_Variation();
            $variation->set_parent_id( $parent_id );
            $variation->set_sku( $vdata['sku'] );
            $variation->set_regular_price( $vdata['price'] );
            $variation->set_status( 'publish' );
            $variation->set_manage_stock( false );
            $variation->set_stock_status( 'instock' );
            // Attribute key must be lowercase sanitized name
            $variation->set_attributes( [ 'dosage' => $vdata['dosage'] ] );

            // Per-variation COA meta if explicitly set
            if ( isset( $vdata['has_coa'] ) ) {
                $variation->update_meta_data( 'has_coa', $vdata['has_coa'] ? '1' : '0' );
            }
            $variation->update_meta_data( 'dosage', $vdata['dosage'] );

            if ( $variation->save() ) {
                $var_count++;
            }
        }

        // Sync variable product (updates price range etc.)
        WC_Product_Variable::sync( $parent_id );

        // Sideload image
        $img = [ 'image_status' => 'none' ];
        if ( $with_images && ! empty( $item['image'] ) ) {
            $img = vp_products_set_image( $parent_id, $item );
        }

        return array_merge( $base, [
            'status'          => 'created',
            'wc_id'           => $parent_id,
            'variation_count' => $var_count,
            'image_status'    => $img['image_status'] ?? 'none',
            'image_error'     => $img['error'] ?? null,
        ] );

    } catch ( Exception $e ) {
        return array_merge( $base, [ 'status' => 'error', 'error' => $e->getMessage() ] );
    }
}

// ─── Import Simple product ────────────────────────────────────────────────────

function vp_import_simple( array $item, bool $with_images ): array {
    $base = [ 'name' => $item['name'], 'type' => 'simple', 'wc_id' => null ];

    $existing_id = wc_get_product_id_by_sku( $item['sku'] );
    if ( $existing_id ) {
        return array_merge( $base, [ 'status' => 'exists', 'wc_id' => $existing_id ] );
    }

    try {
        $product = new WC_Product_Simple();
        $product->set_name( $item['name'] );
        $product->set_sku( $item['sku'] );
        $product->set_status( 'publish' );
        $product->set_catalog_visibility( 'visible' );
        $product->set_description( wp_kses_post( $item['description'] ) );
        $product->set_short_description( wp_kses_post( $item['description'] ) );
        $product->set_regular_price( $item['price'] );
        $product->set_featured( $item['featured'] );
        $product->set_manage_stock( false );
        $product->set_stock_status( 'instock' );

        $product->update_meta_data( 'peptide_code',   $item['peptide_code'] );
        $product->update_meta_data( 'cas_number',     $item['cas'] );
        $product->update_meta_data( 'dosage',         $item['dosage'] );
        $product->update_meta_data( 'purity',         $item['purity'] );
        $product->update_meta_data( 'has_coa',        $item['has_coa'] ? '1' : '0' );
        $product->update_meta_data( 'ruo_disclaimer', 'For research use only. Not for human consumption.' );

        $product_id = $product->save();
        if ( ! $product_id ) {
            return array_merge( $base, [ 'status' => 'error', 'error' => 'save() returned 0' ] );
        }

        vp_assign_category( $product_id, $item['category'] );
        wp_set_object_terms(
            $product_id,
            $item['has_coa'] ? [ 'coa-verified' ] : [ 'coa-pending' ],
            'product_tag'
        );

        $img = [ 'image_status' => 'none' ];
        if ( $with_images && ! empty( $item['image'] ) ) {
            $img = vp_products_set_image( $product_id, $item );
        }

        return array_merge( $base, [
            'status'       => 'created',
            'wc_id'        => $product_id,
            'image_status' => $img['image_status'] ?? 'none',
            'image_error'  => $img['error'] ?? null,
        ] );

    } catch ( Exception $e ) {
        return array_merge( $base, [ 'status' => 'error', 'error' => $e->getMessage() ] );
    }
}

// ─── Category helper ──────────────────────────────────────────────────────────

function vp_assign_category( int $product_id, string $cat_name ): void {
    $cat = get_term_by( 'name', $cat_name, 'product_cat' );
    if ( ! $cat ) {
        $ins = wp_insert_term( $cat_name, 'product_cat', [ 'slug' => sanitize_title( $cat_name ) ] );
        $cat_id = is_wp_error( $ins ) ? null : $ins['term_id'];
    } else {
        $cat_id = $cat->term_id;
    }
    if ( $cat_id ) {
        wp_set_object_terms( $product_id, [ (int) $cat_id ], 'product_cat' );
    }
}

// ─── Image sideload helper ────────────────────────────────────────────────────

function vp_products_set_image( int $product_id, array $item ): array {
    $base = [ 'name' => $item['name'] ?? '' ];

    if ( empty( $item['image'] ) ) {
        return array_merge( $base, [ 'image_status' => 'none' ] );
    }

    $frontend_url  = rtrim( get_option( VP_PRODUCTS_FRONTEND_URL_KEY, 'https://vintagepeptides.com' ), '/' );
    $image_url     = $frontend_url . '/products/' . rawurlencode( $item['image'] );

    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    $attachment_id = media_sideload_image( $image_url, $product_id, $item['name'] ?? '', 'id' );

    if ( is_wp_error( $attachment_id ) ) {
        return array_merge( $base, [
            'image_status' => 'error',
            'error'        => $attachment_id->get_error_message(),
        ] );
    }

    set_post_thumbnail( $product_id, $attachment_id );
    return array_merge( $base, [ 'image_status' => 'set', 'status' => 'set' ] );
}

// ─── REST endpoints ───────────────────────────────────────────────────────────

add_action( 'rest_api_init', 'vp_products_register_routes' );
function vp_products_register_routes(): void {

    // GET /wp-json/vp-products/v1/catalog — full catalog JSON
    register_rest_route( 'vp-products/v1', '/catalog', [
        'methods'             => 'GET',
        'callback'            => fn() => new WP_REST_Response( vp_products_catalog(), 200 ),
        'permission_callback' => '__return_true',
    ] );

    // GET /wp-json/vp-products/v1/by-sku?sku=VP-SEMA-5
    // Returns { product_id, variation_id, price } for any VP SKU.
    // variation_id is 0 for Simple products.
    // Used by the React checkout to build WC order line items correctly.
    register_rest_route( 'vp-products/v1', '/by-sku', [
        'methods'             => 'GET',
        'callback'            => 'vp_products_by_sku',
        'permission_callback' => '__return_true',
        'args'                => [
            'sku' => [
                'required'          => true,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
        ],
    ] );
}

function vp_products_by_sku( WP_REST_Request $request ): WP_REST_Response {
    $sku = $request->get_param( 'sku' );
    $id  = wc_get_product_id_by_sku( $sku );

    if ( ! $id ) {
        return new WP_REST_Response( [ 'error' => 'SKU not found', 'sku' => $sku ], 404 );
    }

    $product = wc_get_product( $id );
    if ( ! $product ) {
        return new WP_REST_Response( [ 'error' => 'Product not found', 'sku' => $sku ], 404 );
    }

    if ( $product->is_type( 'variation' ) ) {
        return new WP_REST_Response( [
            'sku'          => $sku,
            'product_id'   => (int) $product->get_parent_id(),
            'variation_id' => $id,
            'price'        => $product->get_price(),
            'dosage'       => $product->get_attribute( 'Dosage' ),
        ] );
    }

    return new WP_REST_Response( [
        'sku'          => $sku,
        'product_id'   => $id,
        'variation_id' => 0,
        'price'        => $product->get_price(),
        'dosage'       => $product->get_meta( 'dosage' ),
    ] );
}
