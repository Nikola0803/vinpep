<?php
defined( 'ABSPATH' ) || exit;

/**
 * Registers the Vintage Peps CMS top-level admin menu and all sub-pages.
 * Also enqueues the admin JS/CSS and provides the meta box UI
 * for custom post type extra fields.
 */
class VPMS_Admin {

    public static function init() {
        add_action( 'admin_menu',       [ __CLASS__, 'register_menus' ] );
        add_action( 'admin_enqueue_scripts', [ __CLASS__, 'enqueue_assets' ] );
        add_action( 'add_meta_boxes',   [ __CLASS__, 'add_meta_boxes' ] );
        add_action( 'save_post',        [ __CLASS__, 'save_meta_boxes' ] );
        add_action( 'admin_init',       [ __CLASS__, 'register_settings' ] );
        add_action( 'admin_post_vpms_save_settings', [ __CLASS__, 'handle_save_settings' ] );
    }

    // ── Menus ──────────────────────────────────────────────────────────────────
    public static function register_menus() {
        // Top-level
        add_menu_page(
            'Vintage Peps CMS',
            'Vintage Peps CMS',
            'edit_posts',
            'vintage-peps-cms',
            [ __CLASS__, 'render_dashboard' ],
            'dashicons-shield-alt',
            56
        );

        // Settings sub-page
        add_submenu_page( 'vintage-peps-cms', 'Site Settings', 'Site Settings', 'manage_options', 'vcms-settings', [ __CLASS__, 'render_settings' ] );

        // CPT sub-pages
        add_submenu_page( 'vintage-peps-cms', 'FAQs',          'FAQs',          'edit_posts',     'edit.php?post_type=vpms_faq' );
        add_submenu_page( 'vintage-peps-cms', 'Testimonials',  'Testimonials',  'edit_posts',     'edit.php?post_type=vpms_testimonial' );
        add_submenu_page( 'vintage-peps-cms', 'COA Files',     'COA Files',     'edit_posts',     'edit.php?post_type=vpms_coa' );
        add_submenu_page( 'vintage-peps-cms', 'Hero Slides',   'Hero Slides',   'edit_posts',     'edit.php?post_type=vpms_hero' );
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────
    public static function render_dashboard() {
        $pending = 0;
        if ( function_exists( 'wc_get_orders' ) ) {
            $pending = count( wc_get_orders( [ 'status' => [ 'pending' ], 'limit' => 100,
                'meta_query' => [ [ 'key' => '_payment_method', 'value' => [ 'zelle', 'cashapp', 'venmo' ], 'compare' => 'IN' ] ] ] ) );
        }
        ?>
        <div class="wrap">
            <h1>🛡 Vintage Peps CMS</h1>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-top:20px;">
                <?php
                $tiles = [
                    [ 'label' => 'Pending Payments', 'count' => $pending, 'url' => 'admin.php?page=vcms-pending-orders', 'color' => $pending > 0 ? '#c00' : '#16a34a' ],
                    [ 'label' => 'FAQs',         'count' => wp_count_posts( 'vpms_faq' )->publish,         'url' => 'edit.php?post_type=vpms_faq',         'color' => '#111' ],
                    [ 'label' => 'Testimonials', 'count' => wp_count_posts( 'vpms_testimonial' )->publish, 'url' => 'edit.php?post_type=vpms_testimonial', 'color' => '#111' ],
                    [ 'label' => 'COA Files',    'count' => wp_count_posts( 'vpms_coa' )->publish,         'url' => 'edit.php?post_type=vpms_coa',         'color' => '#111' ],
                    [ 'label' => 'Blog Posts',   'count' => wp_count_posts( 'post' )->publish,              'url' => 'edit.php',                            'color' => '#111' ],
                ];
                foreach ( $tiles as $t ) : ?>
                <a href="<?php echo esc_url( admin_url( $t['url'] ) ); ?>" style="background:#fff;border:1px solid #e0e0e0;padding:20px;text-decoration:none;display:block;border-radius:4px;transition:box-shadow .15s;" onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,.1)'" onmouseout="this.style.boxShadow='none'">
                    <div style="font-size:32px;font-weight:900;color:<?php echo esc_attr( $t['color'] ); ?>;"><?php echo (int) $t['count']; ?></div>
                    <div style="font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#666;margin-top:4px;"><?php echo esc_html( $t['label'] ); ?></div>
                </a>
                <?php endforeach; ?>
            </div>

            <h2 style="margin-top:32px;">API Endpoints</h2>
            <table class="widefat" style="max-width:700px;">
                <thead><tr><th>Endpoint</th><th>Auth</th></tr></thead>
                <tbody>
                    <?php
                    $base = get_rest_url( null, 'vintage-peps/v1' );
                    $rows = [
                        [ 'GET /faqs',             'Public' ],
                        [ 'GET /testimonials',     'Public' ],
                        [ 'GET /coas',             'Public' ],
                        [ 'GET /hero',             'Public' ],
                        [ 'GET /settings',         'Public' ],
                        [ 'POST /settings',        'Admin'  ],
                        [ 'GET /blog',             'Public' ],
                        [ 'GET /blog/:slug',       'Public' ],
                        [ 'GET /orders/pending',   'Admin'  ],
                        [ 'POST /orders/:id/mark-paid', 'Admin' ],
                    ];
                    foreach ( $rows as [ $path, $auth ] ) :
                    ?>
                    <tr>
                        <td><code><?php echo esc_html( $base . $path ); ?></code></td>
                        <td><?php echo $auth === 'Public' ? '🌐 Public' : '🔒 Admin'; ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php
    }

    // ── Settings page ─────────────────────────────────────────────────────────
    public static function render_settings() {
        if ( ! current_user_can( 'manage_options' ) ) wp_die( 'No access.' );
        $s = VPMS_Options::get();
        ?>
        <div class="wrap">
            <h1>Site Settings</h1>
            <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                <?php wp_nonce_field( 'vpms_save_settings' ); ?>
                <input type="hidden" name="action" value="vpms_save_settings">

                <h2>Payment Info</h2>
                <table class="form-table">
                    <?php self::text_row( 'Zelle Phone',    'zelle_phone',  $s['zelle_phone'] ); ?>
                    <?php self::text_row( 'Zelle Name',     'zelle_name',   $s['zelle_name'] ); ?>
                    <?php self::text_row( 'Cash App Tag',   'cashapp_tag',  $s['cashapp_tag'] ); ?>
                    <?php self::text_row( 'Venmo Tag',      'venmo_tag',    $s['venmo_tag'] ); ?>
                </table>

                <h2>Hero Section</h2>
                <table class="form-table">
                    <?php self::text_row( 'Headline',    'hero_headline',    $s['hero_headline'] ); ?>
                    <?php self::text_row( 'Sub-headline','hero_subheadline', $s['hero_subheadline'] ); ?>
                    <?php self::text_row( 'CTA Text',    'hero_cta_text',    $s['hero_cta_text'] ); ?>
                    <?php self::text_row( 'CTA URL',     'hero_cta_url',     $s['hero_cta_url'] ); ?>
                </table>

                <h2>Military Banner</h2>
                <table class="form-table">
                    <tr>
                        <th>Enabled</th>
                        <td><input type="checkbox" name="military_discount_enabled" value="1" <?php checked( $s['military_discount_enabled'] ); ?>></td>
                    </tr>
                    <?php self::text_row( 'Discount %',   'military_discount_pct',  $s['military_discount_pct'] ); ?>
                    <?php self::text_row( 'Banner Text',  'military_banner_text',   $s['military_banner_text'] ); ?>
                </table>

                <h2>Contact & Shipping</h2>
                <table class="form-table">
                    <?php self::text_row( 'Contact Email',      'contact_email',    $s['contact_email'] ); ?>
                    <?php self::text_row( 'Contact Phone',      'contact_phone',    $s['contact_phone'] ); ?>
                    <?php self::text_row( 'Ships From',         'ships_from',       $s['ships_from'] ); ?>
                    <?php self::text_row( 'Processing Days',    'processing_days',  $s['processing_days'] ); ?>
                </table>

                <?php submit_button( 'Save Settings' ); ?>
            </form>
        </div>
        <?php
    }

    private static function text_row( string $label, string $name, $value ) {
        echo '<tr><th><label for="' . esc_attr( $name ) . '">' . esc_html( $label ) . '</label></th>';
        echo '<td><input type="text" id="' . esc_attr( $name ) . '" name="' . esc_attr( $name ) . '" value="' . esc_attr( $value ) . '" class="regular-text"></td></tr>';
    }

    public static function register_settings() {}

    public static function handle_save_settings() {
        if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'vpms_save_settings' ) ) {
            wp_die( 'Security check failed.' );
        }

        $fields = [ 'zelle_phone', 'zelle_name', 'cashapp_tag', 'venmo_tag', 'hero_headline', 'hero_subheadline', 'hero_cta_text', 'hero_cta_url', 'military_discount_pct', 'military_banner_text', 'contact_email', 'contact_phone', 'ships_from', 'processing_days' ];
        $data   = [];

        foreach ( $fields as $f ) {
            if ( isset( $_POST[ $f ] ) ) {
                $data[ $f ] = sanitize_text_field( wp_unslash( $_POST[ $f ] ) );
            }
        }

        $data['military_discount_enabled'] = isset( $_POST['military_discount_enabled'] );

        VPMS_Options::save( $data );
        wp_redirect( add_query_arg( [ 'page' => 'vcms-settings', 'updated' => 1 ], admin_url( 'admin.php' ) ) );
        exit;
    }

    // ── Meta boxes ────────────────────────────────────────────────────────────
    public static function add_meta_boxes() {
        add_meta_box( 'vpms_faq_meta',         'FAQ Details',         [ __CLASS__, 'render_faq_meta' ],         'vpms_faq',         'normal', 'high' );
        add_meta_box( 'vpms_testimonial_meta',  'Testimonial Details', [ __CLASS__, 'render_testimonial_meta' ], 'vpms_testimonial',  'normal', 'high' );
        add_meta_box( 'vpms_coa_meta',          'COA Details',         [ __CLASS__, 'render_coa_meta' ],         'vpms_coa',         'normal', 'high' );
        add_meta_box( 'vpms_hero_meta',         'Hero Details',        [ __CLASS__, 'render_hero_meta' ],        'vpms_hero',        'normal', 'high' );
    }

    public static function render_faq_meta( WP_Post $post ) {
        wp_nonce_field( 'vpms_faq_meta', 'vpms_faq_nonce' );
        $cat = get_post_meta( $post->ID, '_vpms_faq_category', true ) ?: 'general';
        echo '<p><label><strong>Category</strong><br>';
        echo '<select name="_vpms_faq_category" style="width:100%;margin-top:4px;">';
        foreach ( [ 'general', 'products', 'shipping', 'payment', 'research' ] as $c ) {
            echo '<option value="' . esc_attr( $c ) . '"' . selected( $cat, $c, false ) . '>' . esc_html( ucfirst( $c ) ) . '</option>';
        }
        echo '</select></label></p>';
    }

    public static function render_testimonial_meta( WP_Post $post ) {
        wp_nonce_field( 'vpms_testimonial_meta', 'vpms_testimonial_nonce' );
        $title    = get_post_meta( $post->ID, '_vpms_author_title', true );
        $rating   = get_post_meta( $post->ID, '_vpms_rating', true ) ?: '5';
        $verified = get_post_meta( $post->ID, '_vpms_verified', true );
        echo '<p><label><strong>Author Title / Location</strong><br><input type="text" name="_vpms_author_title" value="' . esc_attr( $title ) . '" class="widefat"></label></p>';
        echo '<p><label><strong>Rating (1–5)</strong><br><input type="number" name="_vpms_rating" value="' . esc_attr( $rating ) . '" min="1" max="5" style="width:60px;"></label></p>';
        echo '<p><label><input type="checkbox" name="_vpms_verified" value="1" ' . checked( $verified, '1', false ) . '> Verified Purchase</label></p>';
    }

    public static function render_coa_meta( WP_Post $post ) {
        wp_nonce_field( 'vpms_coa_meta', 'vpms_coa_nonce' );
        foreach ( [
            [ '_vpms_coa_product_slug', 'Product Slug (e.g. bpc-157-10mg)' ],
            [ '_vpms_coa_lot',          'Lot Number' ],
            [ '_vpms_coa_date',         'Test Date (YYYY-MM-DD)' ],
            [ '_vpms_coa_purity',       'Purity Result (e.g. 99.2%)' ],
            [ '_vpms_coa_pdf_url',      'Purity PDF URL (upload to Media Library & paste URL)' ],
            [ '_vpms_coa_endotoxin_url','Endotoxin PDF URL (leave blank if same as purity or not available)' ],
        ] as [ $key, $label ] ) {
            $val = get_post_meta( $post->ID, $key, true );
            echo '<p><label><strong>' . esc_html( $label ) . '</strong><br><input type="text" name="' . esc_attr( $key ) . '" value="' . esc_attr( $val ) . '" class="widefat"></label></p>';
        }
    }

    public static function render_hero_meta( WP_Post $post ) {
        wp_nonce_field( 'vpms_hero_meta', 'vpms_hero_nonce' );
        foreach ( [
            [ '_vpms_hero_cta_text', 'CTA Button Text' ],
            [ '_vpms_hero_cta_url',  'CTA Button URL' ],
            [ '_vpms_hero_badge',    'Badge Text (e.g. NEW FORMULA)' ],
        ] as [ $key, $label ] ) {
            $val = get_post_meta( $post->ID, $key, true );
            echo '<p><label><strong>' . esc_html( $label ) . '</strong><br><input type="text" name="' . esc_attr( $key ) . '" value="' . esc_attr( $val ) . '" class="widefat"></label></p>';
        }
    }

    // ── Save meta boxes ───────────────────────────────────────────────────────
    public static function save_meta_boxes( int $post_id ) {
        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;

        $type = get_post_type( $post_id );

        if ( $type === 'vpms_faq' && isset( $_POST['vpms_faq_nonce'] ) && wp_verify_nonce( $_POST['vpms_faq_nonce'], 'vpms_faq_meta' ) ) {
            update_post_meta( $post_id, '_vpms_faq_category', sanitize_text_field( $_POST['_vpms_faq_category'] ?? 'general' ) );
        }

        if ( $type === 'vpms_testimonial' && isset( $_POST['vpms_testimonial_nonce'] ) && wp_verify_nonce( $_POST['vpms_testimonial_nonce'], 'vpms_testimonial_meta' ) ) {
            update_post_meta( $post_id, '_vpms_author_title', sanitize_text_field( $_POST['_vpms_author_title'] ?? '' ) );
            update_post_meta( $post_id, '_vpms_rating',       (int) ( $_POST['_vpms_rating'] ?? 5 ) );
            update_post_meta( $post_id, '_vpms_verified',     isset( $_POST['_vpms_verified'] ) ? '1' : '0' );
        }

        if ( $type === 'vpms_coa' && isset( $_POST['vpms_coa_nonce'] ) && wp_verify_nonce( $_POST['vpms_coa_nonce'], 'vpms_coa_meta' ) ) {
            foreach ( [ '_vpms_coa_product_slug', '_vpms_coa_lot', '_vpms_coa_date', '_vpms_coa_purity', '_vpms_coa_pdf_url', '_vpms_coa_endotoxin_url' ] as $key ) {
                update_post_meta( $post_id, $key, sanitize_text_field( $_POST[ $key ] ?? '' ) );
            }
        }

        if ( $type === 'vpms_hero' && isset( $_POST['vpms_hero_nonce'] ) && wp_verify_nonce( $_POST['vpms_hero_nonce'], 'vpms_hero_meta' ) ) {
            foreach ( [ '_vpms_hero_cta_text', '_vpms_hero_cta_url', '_vpms_hero_badge' ] as $key ) {
                update_post_meta( $post_id, $key, sanitize_text_field( $_POST[ $key ] ?? '' ) );
            }
        }
    }

    // ── Assets ────────────────────────────────────────────────────────────────
    public static function enqueue_assets( $hook ) {
        if ( strpos( $hook, 'valkyrie' ) === false && strpos( $hook, 'vcms' ) === false ) return;

        wp_add_inline_style( 'wp-admin', '
            .vcms-badge { display:inline-block; padding:2px 8px; border-radius:3px; font-size:11px; font-weight:700; }
            .vcms-badge-zelle { background:#6d1ed4; color:#fff; }
            .vcms-badge-cashapp { background:#00c244; color:#fff; }
            .vcms-badge-venmo { background:#3d95ce; color:#fff; }
        ' );
    }
}
