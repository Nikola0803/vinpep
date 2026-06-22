<?php
/**
 * Plugin Name:  Vintage Peps — Product Importer
 * Plugin URI:   https://vintagepeptides.com
 * Description:  One-click WooCommerce product importer for the confirmed Vintage Peptides
 *               SKU catalog. Creates Simple products with full meta (CAS, purity, dosage,
 *               COA flag, category) and sideloads product images from the Vercel frontend.
 *               Skips existing products by SKU. Safe to re-run.
 * Version:      1.1.0
 * Author:       Velocity72 / Vintage Peptides
 * Requires WC:  6.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// ─── Constants ────────────────────────────────────────────────────────────────

define( 'VP_PRODUCTS_FRONTEND_URL_KEY', 'vp_products_frontend_url' );

// ─── Product Catalog ──────────────────────────────────────────────────────────
// Source of truth for all SKUs. Mirrors src/mocks/products.ts exactly.
// image: filename inside public/products/ on the frontend (empty = no image yet).

function vp_products_catalog(): array {
    return [
        // ── BPC-157 / TB-500 ─────────────────────────────────────────────────
        [
            'sku'          => 'VP-BPC-TB-10',
            'name'         => 'BPC-157 / TB-500 Blend — 10mg',
            'peptide_code' => 'BPC-157 + Thymosin β4 Fragment',
            'cas'          => '137525-51-0 / 885340-08-9',
            'dosage'       => '10mg',
            'purity'       => '99.1%',
            'price'        => '89.00',
            'category'     => 'Blends',
            'featured'     => true,
            'has_coa'      => true,
            'image'        => 'bpc-157 tb-500 blend.png',
            'description'  => 'Synergistic blend of pentadecapeptide BPC-157 and Thymosin Beta-4 fragment for connective tissue, cellular repair, and angiogenesis research. For research use only.',
        ],
        [
            'sku'          => 'VP-BPC-TB-20',
            'name'         => 'BPC-157 / TB-500 Blend — 20mg',
            'peptide_code' => 'BPC-157 + Thymosin β4 Fragment',
            'cas'          => '137525-51-0 / 885340-08-9',
            'dosage'       => '20mg',
            'purity'       => '99.1%',
            'price'        => '149.00',
            'category'     => 'Blends',
            'featured'     => false,
            'has_coa'      => true,
            'image'        => 'bpc-157 tb-500 blend.png',
            'description'  => 'Synergistic blend of pentadecapeptide BPC-157 and Thymosin Beta-4 fragment for connective tissue, cellular repair, and angiogenesis research. For research use only.',
        ],

        // ── CJC-1295 / Ipamorelin ─────────────────────────────────────────────
        [
            'sku'          => 'VP-CJC-IPA-10',
            'name'         => 'CJC-1295 / Ipamorelin Blend — 10mg',
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

        // ── Semaglutide ──────────────────────────────────────────────────────
        [
            'sku'          => 'VP-SEMA-5',
            'name'         => 'Semaglutide — 5mg',
            'peptide_code' => 'GLP-1 Receptor Agonist',
            'cas'          => '910463-68-2',
            'dosage'       => '5mg',
            'purity'       => '99.2%',
            'price'        => '149.00',
            'category'     => 'GLP-1 Compounds',
            'featured'     => true,
            'has_coa'      => true,
            'image'        => 'semaglitude 5mg.png',
            'description'  => 'Long-acting GLP-1 analog for metabolic homeostasis, pancreatic beta-cell function, and glycemic regulation research. For research use only.',
        ],
        [
            'sku'          => 'VP-SEMA-10',
            'name'         => 'Semaglutide — 10mg',
            'peptide_code' => 'GLP-1 Receptor Agonist',
            'cas'          => '910463-68-2',
            'dosage'       => '10mg',
            'purity'       => '99.2%',
            'price'        => '249.00',
            'category'     => 'GLP-1 Compounds',
            'featured'     => true,
            'has_coa'      => true,
            'image'        => 'semaglitude 5mg.png',
            'description'  => 'Long-acting GLP-1 analog for metabolic homeostasis, pancreatic beta-cell function, and glycemic regulation research. For research use only.',
        ],

        // ── Tirzepatide ──────────────────────────────────────────────────────
        [
            'sku'          => 'VP-TIRZ-10',
            'name'         => 'Tirzepatide — 10mg',
            'peptide_code' => 'Dual GIP / GLP-1 Agonist',
            'cas'          => '2023788-19-2',
            'dosage'       => '10mg',
            'purity'       => '99.0%',
            'price'        => '219.00',
            'category'     => 'GLP-1 Compounds',
            'featured'     => true,
            'has_coa'      => true,
            'image'        => 'tirzepaatide 10mg.png',
            'description'  => 'Novel dual incretin receptor agonist activating both GIP and GLP-1 pathways for advanced metabolic signaling research. For research use only.',
        ],
        [
            'sku'          => 'VP-TIRZ-15',
            'name'         => 'Tirzepatide — 15mg',
            'peptide_code' => 'Dual GIP / GLP-1 Agonist',
            'cas'          => '2023788-19-2',
            'dosage'       => '15mg',
            'purity'       => '99.0%',
            'price'        => '279.00',
            'category'     => 'GLP-1 Compounds',
            'featured'     => false,
            'has_coa'      => true,
            'image'        => 'tirzepaatide 10mg.png',
            'description'  => 'Novel dual incretin receptor agonist activating both GIP and GLP-1 pathways for advanced metabolic signaling research. For research use only.',
        ],
        [
            'sku'          => 'VP-TIRZ-30',
            'name'         => 'Tirzepatide — 30mg',
            'peptide_code' => 'Dual GIP / GLP-1 Agonist',
            'cas'          => '2023788-19-2',
            'dosage'       => '30mg',
            'purity'       => '99.0%',
            'price'        => '399.00',
            'category'     => 'GLP-1 Compounds',
            'featured'     => false,
            'has_coa'      => true,
            'image'        => 'tirzepaatide 10mg.png',
            'description'  => 'Novel dual incretin receptor agonist activating both GIP and GLP-1 pathways for advanced metabolic signaling research. For research use only.',
        ],

        // ── Retatrutide ──────────────────────────────────────────────────────
        [
            'sku'          => 'VP-RETA-10',
            'name'         => 'Retatrutide — 10mg',
            'peptide_code' => 'Triple GLP-1 / GIP / Glucagon Agonist',
            'cas'          => '2381089-83-2',
            'dosage'       => '10mg',
            'purity'       => '98.9%',
            'price'        => '229.00',
            'category'     => 'GLP-1 Compounds',
            'featured'     => true,
            'has_coa'      => true,
            'image'        => 'retatrutide 15mg.png',
            'description'  => 'Triple agonist targeting GLP-1, GIP, and glucagon receptors for multi-pathway incretin and energy homeostasis research. For research use only.',
        ],
        [
            'sku'          => 'VP-RETA-15',
            'name'         => 'Retatrutide — 15mg',
            'peptide_code' => 'Triple GLP-1 / GIP / Glucagon Agonist',
            'cas'          => '2381089-83-2',
            'dosage'       => '15mg',
            'purity'       => '98.9%',
            'price'        => '299.00',
            'category'     => 'GLP-1 Compounds',
            'featured'     => false,
            'has_coa'      => true,
            'image'        => 'retatrutide 15mg.png',
            'description'  => 'Triple agonist targeting GLP-1, GIP, and glucagon receptors for multi-pathway incretin and energy homeostasis research. For research use only.',
        ],
        [
            'sku'          => 'VP-RETA-30',
            'name'         => 'Retatrutide — 30mg',
            'peptide_code' => 'Triple GLP-1 / GIP / Glucagon Agonist',
            'cas'          => '2381089-83-2',
            'dosage'       => '30mg',
            'purity'       => '98.9%',
            'price'        => '449.00',
            'category'     => 'GLP-1 Compounds',
            'featured'     => false,
            'has_coa'      => true,
            'image'        => 'retatrutide 15mg.png',
            'description'  => 'Triple agonist targeting GLP-1, GIP, and glucagon receptors for multi-pathway incretin and energy homeostasis research. For research use only.',
        ],

        // ── Glow ─────────────────────────────────────────────────────────────
        [
            'sku'          => 'VP-GLOW-70',
            'name'         => 'Glow — 70mg',
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

        // ── Klow ─────────────────────────────────────────────────────────────
        [
            'sku'          => 'VP-KLOW-80',
            'name'         => 'Klow — 80mg',
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

        // ── KPV ──────────────────────────────────────────────────────────────
        [
            'sku'          => 'VP-KPV-10',
            'name'         => 'KPV — 10mg',
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

        // ── MOTS-C ───────────────────────────────────────────────────────────
        [
            'sku'          => 'VP-MOTSC-10',
            'name'         => 'MOTS-C — 10mg',
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

        // ── Tesamorelin ──────────────────────────────────────────────────────
        [
            'sku'          => 'VP-TESA-10',
            'name'         => 'Tesamorelin — 10mg',
            'peptide_code' => 'GHRH Analog (Trans-3-Hexenoic Acid)',
            'cas'          => '218949-48-9',
            'dosage'       => '10mg',
            'purity'       => '99.1%',
            'price'        => '149.00',
            'category'     => 'Peptides',
            'featured'     => false,
            'has_coa'      => true,
            'image'        => 'tesamorelin vp.png',
            'description'  => 'Stabilized GHRH analog for growth hormone axis activation, adipogenesis modulation, and somatotropic signaling research. For research use only.',
        ],

        // ── GHK-Cu ───────────────────────────────────────────────────────────
        [
            'sku'          => 'VP-GHKCU-50',
            'name'         => 'GHK-Cu — 50mg',
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

        // ── NAD+ ─────────────────────────────────────────────────────────────
        [
            'sku'          => 'VP-NAD-500',
            'name'         => 'NAD+ — 500mg',
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

        // ── Tesamorelin 20mg (no COA yet) ────────────────────────────────────
        [
            'sku'          => 'VP-TESA-20',
            'name'         => 'Tesamorelin — 20mg',
            'peptide_code' => 'GHRH Analog (Trans-3-Hexenoic Acid)',
            'cas'          => '218949-48-9',
            'dosage'       => '20mg',
            'purity'       => '99.1%',
            'price'        => '249.00',
            'category'     => 'Peptides',
            'featured'     => false,
            'has_coa'      => false,
            'image'        => 'tesamorelin vp.png',
            'description'  => 'Stabilized GHRH analog for growth hormone axis activation, adipogenesis modulation, and somatotropic signaling research. For research use only.',
        ],

        // ── Thymosin Alpha-1 (no COA yet) ────────────────────────────────────
        [
            'sku'          => 'VP-TA1-5',
            'name'         => 'Thymosin Alpha-1 — 5mg',
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

        // ── Cartalax (no COA yet) ─────────────────────────────────────────────
        [
            'sku'          => 'VP-CARTA-20',
            'name'         => 'Cartalax — 20mg',
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
    $results      = [];
    $img_results  = [];

    // Save settings
    if ( isset( $_POST['vp_save_settings_nonce'] ) && wp_verify_nonce( $_POST['vp_save_settings_nonce'], 'vp_save_settings' ) ) {
        $url = esc_url_raw( rtrim( $_POST['vp_frontend_url'] ?? '', '/' ) );
        update_option( VP_PRODUCTS_FRONTEND_URL_KEY, $url );
        echo '<div class="notice notice-success is-dismissible"><p>Settings saved.</p></div>';
    }

    // Import products
    if ( isset( $_POST['vp_import_nonce'] ) && wp_verify_nonce( $_POST['vp_import_nonce'], 'vp_import_products' ) ) {
        $selected    = $_POST['selected_skus'] ?? [];
        $with_images = ! empty( $_POST['vp_with_images'] );
        $catalog     = vp_products_catalog();
        foreach ( $catalog as $item ) {
            if ( ! empty( $selected ) && ! in_array( $item['sku'], $selected, true ) ) {
                continue;
            }
            $results[] = vp_products_import_one( $item, $with_images );
        }
    }

    // Set images only (for already-imported products)
    if ( isset( $_POST['vp_images_nonce'] ) && wp_verify_nonce( $_POST['vp_images_nonce'], 'vp_set_images' ) ) {
        $catalog = vp_products_catalog();
        foreach ( $catalog as $item ) {
            if ( empty( $item['image'] ) ) {
                continue;
            }
            $product_id = wc_get_product_id_by_sku( $item['sku'] );
            if ( ! $product_id ) {
                $img_results[] = [ 'sku' => $item['sku'], 'name' => $item['name'], 'status' => 'not_found' ];
                continue;
            }
            $img_results[] = vp_products_set_image( $product_id, $item );
        }
    }

    $catalog      = vp_products_catalog();
    $frontend_url = get_option( VP_PRODUCTS_FRONTEND_URL_KEY, 'https://vintagepeptides.com' );

    // Pre-check which SKUs already exist and which have images
    $existing = [];
    foreach ( $catalog as $item ) {
        $pid = wc_get_product_id_by_sku( $item['sku'] ) ?: null;
        $existing[ $item['sku'] ] = [
            'wc_id'     => $pid,
            'has_image' => $pid ? (bool) get_post_thumbnail_id( $pid ) : false,
        ];
    }
    ?>
    <div class="wrap">
    <h1 style="display:flex;align-items:center;gap:10px;">
        <span class="dashicons dashicons-archive" style="font-size:26px;color:#b8942a;"></span>
        Vintage Peptides — Product Importer
    </h1>

    <?php /* ── Settings ── */ ?>
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px;max-width:680px;">
        <h2 style="margin-top:0;font-size:15px;">Settings</h2>
        <form method="post">
            <?php wp_nonce_field( 'vp_save_settings', 'vp_save_settings_nonce' ); ?>
            <table class="form-table" style="margin:0;">
                <tr>
                    <th style="padding:8px 16px 8px 0;white-space:nowrap;font-weight:600;">Frontend URL</th>
                    <td>
                        <input type="url" name="vp_frontend_url" value="<?php echo esc_attr( $frontend_url ); ?>"
                               style="width:380px;" placeholder="https://vintagepeptides.com">
                        <p class="description" style="margin-top:4px;">
                            Base URL where product images are served from
                            (e.g. <code>https://vintagepeptides.com</code>).<br>
                            Images are fetched from <code>{url}/products/{filename}</code>.
                        </p>
                    </td>
                </tr>
            </table>
            <button type="submit" class="button button-secondary" style="margin-top:12px;">Save Settings</button>
        </form>
    </div>

    <?php /* ── Import results ── */ ?>
    <?php if ( ! empty( $results ) ) : ?>
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:24px;">
        <h2 style="margin-top:0;">Import Results</h2>
        <table class="widefat striped">
            <thead>
                <tr><th>SKU</th><th>Name</th><th>Result</th><th>Image</th><th>WC ID</th></tr>
            </thead>
            <tbody>
            <?php foreach ( $results as $r ) : ?>
                <tr>
                    <td><code><?php echo esc_html( $r['sku'] ); ?></code></td>
                    <td><?php echo esc_html( $r['name'] ); ?></td>
                    <td>
                        <?php if ( $r['status'] === 'created' ) : ?>
                            <span style="color:#16a34a;font-weight:600;">✓ Created</span>
                        <?php elseif ( $r['status'] === 'exists' ) : ?>
                            <span style="color:#6b7280;">— Already exists</span>
                        <?php else : ?>
                            <span style="color:#dc2626;">✗ <?php echo esc_html( $r['error'] ?? 'Error' ); ?></span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <?php if ( isset( $r['image_status'] ) ) : ?>
                            <?php if ( $r['image_status'] === 'set' ) : ?>
                                <span style="color:#16a34a;">✓ Image set</span>
                            <?php elseif ( $r['image_status'] === 'none' ) : ?>
                                <span style="color:#9ca3af;">No image file</span>
                            <?php else : ?>
                                <span style="color:#f59e0b;"><?php echo esc_html( $r['image_error'] ?? 'Failed' ); ?></span>
                            <?php endif; ?>
                        <?php else : ?>
                            —
                        <?php endif; ?>
                    </td>
                    <td>
                        <?php if ( ! empty( $r['wc_id'] ) ) : ?>
                            <a href="<?php echo esc_url( get_edit_post_link( $r['wc_id'] ) ); ?>" target="_blank">
                                #<?php echo esc_html( $r['wc_id'] ); ?>
                            </a>
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
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:24px;">
        <h2 style="margin-top:0;">Image Sync Results</h2>
        <table class="widefat striped">
            <thead>
                <tr><th>SKU</th><th>Name</th><th>Result</th></tr>
            </thead>
            <tbody>
            <?php foreach ( $img_results as $r ) : ?>
                <tr>
                    <td><code><?php echo esc_html( $r['sku'] ); ?></code></td>
                    <td><?php echo esc_html( $r['name'] ); ?></td>
                    <td>
                        <?php if ( $r['status'] === 'set' ) : ?>
                            <span style="color:#16a34a;font-weight:600;">✓ Image set</span>
                        <?php elseif ( $r['status'] === 'not_found' ) : ?>
                            <span style="color:#6b7280;">— Product not in WC yet</span>
                        <?php elseif ( $r['status'] === 'none' ) : ?>
                            <span style="color:#9ca3af;">No image file mapped</span>
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

    <?php /* ── Main form ── */ ?>
    <form method="post" id="vp-import-form">
        <?php wp_nonce_field( 'vp_import_products', 'vp_import_nonce' ); ?>

        <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap;">
            <button type="submit" class="button button-primary"
                    style="background:#b8942a;border-color:#9a7a20;font-size:14px;height:36px;padding:0 20px;"
                    onclick="selectAll()">
                Import All
            </button>
            <button type="submit" class="button"
                    style="height:36px;"
                    onclick="/* submit selected only */">
                Import Selected
            </button>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;margin-left:4px;">
                <input type="checkbox" name="vp_with_images" value="1" checked>
                Include images
            </label>
            <span style="color:#6b7280;font-size:13px;margin-left:8px;">
                <?php
                $already = count( array_filter( array_column( $existing, 'wc_id' ) ) );
                $total   = count( $catalog );
                $imaged  = count( array_filter( array_column( $existing, 'has_image' ) ) );
                echo "{$already}/{$total} in WooCommerce &nbsp;·&nbsp; {$imaged}/{$total} have images";
                ?>
            </span>
        </div>

        <table class="widefat striped">
            <thead>
                <tr>
                    <th style="width:30px;">
                        <input type="checkbox" id="vp-select-all"
                               onchange="document.querySelectorAll('.vp-sku-cb').forEach(cb => cb.checked = this.checked)">
                    </th>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>COA</th>
                    <th>Image</th>
                    <th>WC Status</th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ( $catalog as $item ) :
                $wc_id     = $existing[ $item['sku'] ]['wc_id'] ?? null;
                $has_image = $existing[ $item['sku'] ]['has_image'] ?? false;
            ?>
                <tr style="<?php echo $wc_id ? 'opacity:0.55;' : ''; ?>">
                    <td>
                        <input type="checkbox" name="selected_skus[]" class="vp-sku-cb"
                               value="<?php echo esc_attr( $item['sku'] ); ?>"
                               <?php checked( ! $wc_id ); ?>
                               <?php echo $wc_id ? 'disabled' : ''; ?>>
                    </td>
                    <td><code style="font-size:11px;"><?php echo esc_html( $item['sku'] ); ?></code></td>
                    <td>
                        <strong><?php echo esc_html( $item['name'] ); ?></strong>
                        <div style="font-size:11px;color:#9ca3af;margin-top:2px;"><?php echo esc_html( $item['peptide_code'] ); ?></div>
                    </td>
                    <td><?php echo esc_html( $item['category'] ); ?></td>
                    <td style="font-family:monospace;">$<?php echo esc_html( $item['price'] ); ?></td>
                    <td><?php echo $item['has_coa'] ? '<span style="color:#16a34a;">✓</span>' : '<span style="color:#f59e0b;">Pending</span>'; ?></td>
                    <td>
                        <?php if ( ! empty( $item['image'] ) ) : ?>
                            <?php if ( $has_image ) : ?>
                                <span style="color:#16a34a;">✓ Set</span>
                            <?php else : ?>
                                <span style="color:#6b7280;font-size:11px;"><?php echo esc_html( $item['image'] ); ?></span>
                            <?php endif; ?>
                        <?php else : ?>
                            <span style="color:#d1d5db;font-size:11px;">—</span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <?php if ( $wc_id ) : ?>
                            <a href="<?php echo esc_url( get_edit_post_link( $wc_id ) ); ?>" target="_blank"
                               style="color:#16a34a;font-weight:600;">In WC #<?php echo $wc_id; ?></a>
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
    <div style="margin-top:20px;">
        <form method="post">
            <?php wp_nonce_field( 'vp_set_images', 'vp_images_nonce' ); ?>
            <button type="submit" class="button"
                    style="height:36px;"
                    onclick="return confirm('This will download and set images for all already-imported products. Continue?');">
                <span class="dashicons dashicons-format-image" style="line-height:1.8;margin-right:4px;"></span>
                Set Images for All Imported Products
            </button>
            <p class="description" style="margin-top:6px;">
                Use this if products were already imported without images.
                Downloads each image from <strong><?php echo esc_html( $frontend_url ); ?>/products/…</strong>
                into the WP media library and sets it as the product thumbnail.
            </p>
        </form>
    </div>

    </div>

    <script>
    function selectAll() {
        document.querySelectorAll('.vp-sku-cb').forEach(cb => cb.checked = true);
    }
    </script>
    <?php
}

// ─── Import single product ────────────────────────────────────────────────────

function vp_products_import_one( array $item, bool $with_images = true ): array {
    $base = [
        'sku'          => $item['sku'],
        'name'         => $item['name'],
        'wc_id'        => null,
        'image_status' => null,
    ];

    // Skip if SKU already exists
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

        // Custom meta — read by the React frontend via WC REST API
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

        // Assign WC product category (creates if missing)
        $cat_name = $item['category'];
        $cat      = get_term_by( 'name', $cat_name, 'product_cat' );
        if ( ! $cat ) {
            $inserted = wp_insert_term( $cat_name, 'product_cat', [
                'slug' => sanitize_title( $cat_name ),
            ] );
            $cat_id = is_wp_error( $inserted ) ? null : $inserted['term_id'];
        } else {
            $cat_id = $cat->term_id;
        }
        if ( $cat_id ) {
            wp_set_object_terms( $product_id, [ (int) $cat_id ], 'product_cat' );
        }

        // Tag: COA status
        wp_set_object_terms(
            $product_id,
            $item['has_coa'] ? [ 'coa-verified' ] : [ 'coa-pending' ],
            'product_tag'
        );

        // Sideload product image
        $img_result = [ 'image_status' => 'none' ];
        if ( $with_images ) {
            $img_result = vp_products_set_image( $product_id, $item );
        }

        return array_merge( $base, [
            'status'       => 'created',
            'wc_id'        => $product_id,
            'image_status' => $img_result['status'] ?? 'none',
            'image_error'  => $img_result['error'] ?? null,
        ] );

    } catch ( Exception $e ) {
        return array_merge( $base, [ 'status' => 'error', 'error' => $e->getMessage() ] );
    }
}

// ─── Sideload image for a product ─────────────────────────────────────────────
// Downloads the image from the Vercel frontend into the WP media library
// and sets it as the WooCommerce product thumbnail.

function vp_products_set_image( int $product_id, array $item ): array {
    $base = [ 'sku' => $item['sku'], 'name' => $item['name'] ];

    if ( empty( $item['image'] ) ) {
        return array_merge( $base, [ 'status' => 'none' ] );
    }

    $frontend_url = rtrim( get_option( VP_PRODUCTS_FRONTEND_URL_KEY, 'https://vintagepeptides.com' ), '/' );
    $image_url    = $frontend_url . '/products/' . rawurlencode( $item['image'] );

    // WP media functions needed for sideloading
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    $attachment_id = media_sideload_image( $image_url, $product_id, $item['name'], 'id' );

    if ( is_wp_error( $attachment_id ) ) {
        return array_merge( $base, [
            'status' => 'error',
            'error'  => $attachment_id->get_error_message(),
        ] );
    }

    set_post_thumbnail( $product_id, $attachment_id );

    return array_merge( $base, [ 'status' => 'set', 'attachment_id' => $attachment_id ] );
}

// ─── REST endpoint: catalog list ─────────────────────────────────────────────
// GET /wp-json/vp-products/v1/catalog

add_action( 'rest_api_init', 'vp_products_register_routes' );
function vp_products_register_routes() {
    register_rest_route( 'vp-products/v1', '/catalog', [
        'methods'             => 'GET',
        'callback'            => fn() => new WP_REST_Response( vp_products_catalog(), 200 ),
        'permission_callback' => '__return_true',
    ] );
}
