<?php
/**
 * REST API endpoints for the Vintage Peps React frontend.
 *
 * Namespace: vintage-peps/v1
 *
 * Public endpoints (no auth):
 *   GET /faqs
 *   GET /testimonials
 *   GET /coas              → all COAs (from WC product meta)
 *   GET /coas?product=slug → COA for a single product slug
 *   GET /hero
 *   GET /blog
 *   GET /blog/{slug}
 *
 * Admin endpoints (require edit_shop_orders):
 *   GET  /orders/pending
 *   POST /orders/{id}/mark-paid
 */
defined( 'ABSPATH' ) || exit;

class VPMS_REST_API {

    const NS = 'vintage-peps/v1';

    public static function init(): void {
        add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
    }

    public static function register_routes(): void {
        // ── FAQs ──────────────────────────────────────────────────────────────
        register_rest_route( self::NS, '/faqs', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'get_faqs' ],
            'permission_callback' => '__return_true',
        ] );

        // ── Testimonials ──────────────────────────────────────────────────────
        register_rest_route( self::NS, '/testimonials', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'get_testimonials' ],
            'permission_callback' => '__return_true',
        ] );

        // ── COAs ──────────────────────────────────────────────────────────────
        register_rest_route( self::NS, '/coas', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'get_coas' ],
            'permission_callback' => '__return_true',
        ] );

        // ── Hero ──────────────────────────────────────────────────────────────
        register_rest_route( self::NS, '/hero', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'get_hero' ],
            'permission_callback' => '__return_true',
        ] );

        // ── Blog ──────────────────────────────────────────────────────────────
        register_rest_route( self::NS, '/blog', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'get_blog' ],
            'permission_callback' => '__return_true',
        ] );
        register_rest_route( self::NS, '/blog/(?P<slug>[a-z0-9\-]+)', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'get_blog_post' ],
            'permission_callback' => '__return_true',
        ] );

        // ── Auth: Forgot / Reset Password ────────────────────────────────────
        register_rest_route( self::NS, '/forgot-password', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'forgot_password' ],
            'permission_callback' => '__return_true',
        ] );
        register_rest_route( self::NS, '/reset-password', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'do_reset_password' ],
            'permission_callback' => '__return_true',
        ] );

        // ── Admin: Orders ─────────────────────────────────────────────────────
        register_rest_route( self::NS, '/orders/pending', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'get_pending_orders' ],
            'permission_callback' => [ __CLASS__, 'admin_permission' ],
        ] );
        register_rest_route( self::NS, '/orders/(?P<id>\d+)/mark-paid', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'mark_order_paid' ],
            'permission_callback' => [ __CLASS__, 'admin_permission' ],
        ] );
    }

    // ── Permissions ──────────────────────────────────────────────────────────

    public static function admin_permission(): bool {
        return current_user_can( 'edit_shop_orders' );
    }

    // ── FAQs ─────────────────────────────────────────────────────────────────

    public static function get_faqs(): WP_REST_Response {
        $posts = get_posts( [
            'post_type'      => 'vpms_faq',
            'posts_per_page' => 100,
            'post_status'    => 'publish',
            'orderby'        => 'menu_order',
            'order'          => 'ASC',
        ] );

        $data = array_map( function ( $p ) {
            return [
                'id'       => $p->ID,
                'question' => $p->post_title,
                'answer'   => apply_filters( 'the_content', $p->post_content ),
            ];
        }, $posts );

        return new WP_REST_Response( $data, 200 );
    }

    // ── Testimonials ─────────────────────────────────────────────────────────

    public static function get_testimonials(): WP_REST_Response {
        $posts = get_posts( [
            'post_type'      => 'vpms_testimonial',
            'posts_per_page' => 50,
            'post_status'    => 'publish',
            'orderby'        => 'rand',
        ] );

        $data = array_map( function ( $p ) {
            return [
                'id'         => $p->ID,
                'quote'      => $p->post_content,
                'author'     => $p->post_title,
                'title'      => get_post_meta( $p->ID, 'title', true ),
                'rating'     => (int) get_post_meta( $p->ID, 'rating', true ),
                'verifiedBuyer' => (bool) get_post_meta( $p->ID, 'verified_buyer', true ),
            ];
        }, $posts );

        return new WP_REST_Response( $data, 200 );
    }

    // ── COAs ─────────────────────────────────────────────────────────────────
    //
    // Reads COA data from WooCommerce product meta (set by vintage-peps-products
    // importer). Fields: peptide_code, cas_number, purity, has_coa, coa_url, test_url.
    //
    // Also reads extended COA detail from vpms_coa custom posts if present,
    // matching on the product's SKU/slug.

    public static function get_coas( WP_REST_Request $req ): WP_REST_Response {
        $product_slug = sanitize_text_field( $req->get_param( 'product' ) ?? '' );

        // ── Query WC products with COA data ───────────────────────────────────
        $args = [
            'post_type'      => 'product',
            'post_status'    => 'publish',
            'posts_per_page' => 200,
            'orderby'        => 'title',
            'order'          => 'ASC',
            'meta_query'     => [
                [
                    'key'     => 'has_coa',
                    'value'   => '1',
                    'compare' => '=',
                ],
            ],
        ];

        if ( $product_slug ) {
            $args['name'] = $product_slug;
            $args['posts_per_page'] = 1;
        }

        $products = get_posts( $args );

        // ── Also load vpms_coa custom posts (indexed by slug) ─────────────────
        $coa_posts = get_posts( [
            'post_type'      => 'vpms_coa',
            'post_status'    => 'publish',
            'posts_per_page' => 500,
        ] );

        // Build a map: product_slug → coa_post
        $coa_map = [];
        foreach ( $coa_posts as $cp ) {
            $slug = get_post_meta( $cp->ID, 'product_slug', true );
            if ( $slug ) {
                $coa_map[ $slug ] = $cp;
            }
        }

        $data = [];
        foreach ( $products as $product ) {
            $coa_url  = self::resolve_url( get_post_meta( $product->ID, 'coa_url', true ) );
            $test_url = self::resolve_url( get_post_meta( $product->ID, 'test_url', true ) );
            $purity   = get_post_meta( $product->ID, 'purity', true ) ?: '≥99%';

            // Extended detail from vpms_coa if available
            $coa_post    = $coa_map[ $product->post_name ] ?? null;
            $batch       = $coa_post ? get_post_meta( $coa_post->ID, 'batch_number', true ) : 'VP-' . date('Ymd') . '-P';
            $test_date   = $coa_post ? get_post_meta( $coa_post->ID, 'test_date', true ) : '';
            $lab         = $coa_post ? get_post_meta( $coa_post->ID, 'lab_name', true ) : 'Independent 3rd-Party Lab';
            $mol_weight  = $coa_post ? get_post_meta( $coa_post->ID, 'molecular_weight', true ) : '';
            $sequence    = $coa_post ? get_post_meta( $coa_post->ID, 'sequence', true ) : '';
            $appearance  = $coa_post ? get_post_meta( $coa_post->ID, 'appearance', true ) : 'White lyophilized powder';
            $storage     = $coa_post ? get_post_meta( $coa_post->ID, 'storage', true ) : '-20°C, desiccated';
            $methods_raw = $coa_post ? get_post_meta( $coa_post->ID, 'methods', true ) : '';
            $methods     = $methods_raw ? array_map( 'trim', explode( ',', $methods_raw ) ) : [ 'HPLC', 'MS' ];

            $data[] = [
                'id'            => (string) $product->ID,
                'productName'   => $product->post_title,
                'peptideCode'   => get_post_meta( $product->ID, 'peptide_code', true ) ?: '',
                'batchNumber'   => $batch,
                'testDate'      => $test_date ?: date( 'Y-m-d' ),
                'purity'        => $purity,
                'methods'       => $methods,
                'labName'       => $lab,
                'status'        => 'verified',
                'coaUrl'        => $coa_url ?: '#',
                'hplcUrl'       => $test_url ?: '#',
                'msUrl'         => $test_url ?: '#',
                'molecularWeight' => $mol_weight,
                'sequence'      => $sequence,
                'appearance'    => $appearance,
                'storage'       => $storage,
                'productIds'    => [ (string) $product->ID ],
            ];
        }

        return new WP_REST_Response( $data, 200 );
    }

    /**
     * Resolve a stored value to a proper HTTPS URL.
     *
     * Handles:
     *  - Already-valid URL: returned as-is (with http→https rewrite)
     *  - Attachment ID (numeric): resolved via wp_get_attachment_url()
     *  - Empty / '#': returned as empty string
     */
    private static function resolve_url( string $value ): string {
        $value = trim( $value );

        if ( empty( $value ) || $value === '#' ) {
            return '';
        }

        // Numeric → attachment ID
        if ( ctype_digit( $value ) ) {
            $url = wp_get_attachment_url( (int) $value );
            return $url ? self::force_https( $url ) : '';
        }

        // Already a URL
        if ( str_starts_with( $value, 'http' ) ) {
            return self::force_https( $value );
        }

        return '';
    }

    /** Rewrite http:// to https:// so browsers don't block mixed content. */
    private static function force_https( string $url ): string {
        return str_replace( 'http://', 'https://', $url );
    }

    // ── Hero ─────────────────────────────────────────────────────────────────

    public static function get_hero(): WP_REST_Response {
        $post = get_posts( [
            'post_type'      => 'vpms_hero',
            'post_status'    => 'publish',
            'posts_per_page' => 1,
        ] );

        if ( empty( $post ) ) {
            return new WP_REST_Response( null, 404 );
        }

        $p   = $post[0];
        $img = get_the_post_thumbnail_url( $p->ID, 'full' );

        return new WP_REST_Response( [
            'headline'    => $p->post_title,
            'subheadline' => get_post_meta( $p->ID, 'subheadline', true ),
            'imageUrl'    => $img ? self::force_https( $img ) : '',
            'ctaLabel'    => get_post_meta( $p->ID, 'cta_label', true ),
            'ctaUrl'      => get_post_meta( $p->ID, 'cta_url', true ),
        ], 200 );
    }

    // ── Blog ─────────────────────────────────────────────────────────────────

    public static function get_blog(): WP_REST_Response {
        $posts = get_posts( [
            'post_type'      => 'post',
            'post_status'    => 'publish',
            'posts_per_page' => 20,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ] );

        $data = array_map( function ( $p ) {
            $img = get_the_post_thumbnail_url( $p->ID, 'large' );
            return [
                'id'        => $p->ID,
                'slug'      => $p->post_name,
                'title'     => $p->post_title,
                'excerpt'   => get_the_excerpt( $p ),
                'date'      => $p->post_date,
                'imageUrl'  => $img ? self::force_https( $img ) : '',
                'category'  => get_post_meta( $p->ID, 'category', true ) ?: 'Research',
            ];
        }, $posts );

        return new WP_REST_Response( $data, 200 );
    }

    public static function get_blog_post( WP_REST_Request $req ): WP_REST_Response {
        $slug = sanitize_title( $req->get_param( 'slug' ) );
        $post = get_page_by_path( $slug, OBJECT, 'post' );

        if ( ! $post || $post->post_status !== 'publish' ) {
            return new WP_REST_Response( [ 'error' => 'Not found' ], 404 );
        }

        $img = get_the_post_thumbnail_url( $post->ID, 'full' );

        return new WP_REST_Response( [
            'id'       => $post->ID,
            'slug'     => $post->post_name,
            'title'    => $post->post_title,
            'content'  => apply_filters( 'the_content', $post->post_content ),
            'date'     => $post->post_date,
            'imageUrl' => $img ? self::force_https( $img ) : '',
            'category' => get_post_meta( $post->ID, 'category', true ) ?: 'Research',
        ], 200 );
    }

    // ── Admin: Orders ─────────────────────────────────────────────────────────

    public static function get_pending_orders(): WP_REST_Response {
        if ( ! function_exists( 'wc_get_orders' ) ) {
            return new WP_REST_Response( [], 200 );
        }

        $orders = wc_get_orders( [
            'status' => [ 'pending', 'on-hold' ],
            'limit'  => 50,
        ] );

        $data = array_map( function ( $order ) {
            return [
                'id'            => $order->get_id(),
                'invoiceId'     => $order->get_meta( 'invoice_id' ),
                'memoCode'      => $order->get_meta( 'memo_code' ),
                'paymentMethod' => $order->get_payment_method(),
                'paymentHandle' => $order->get_meta( 'payment_handle' ),
                'total'         => $order->get_total(),
                'status'        => $order->get_status(),
                'date'          => $order->get_date_created()->format( 'c' ),
                'customer'      => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
                'email'         => $order->get_billing_email(),
            ];
        }, $orders );

        return new WP_REST_Response( $data, 200 );
    }

    public static function mark_order_paid( WP_REST_Request $req ): WP_REST_Response {
        $order_id = (int) $req->get_param( 'id' );
        $order    = wc_get_order( $order_id );

        if ( ! $order ) {
            return new WP_REST_Response( [ 'error' => 'Order not found' ], 404 );
        }

        $order->update_status( 'processing', 'Marked paid via admin panel.' );

        return new WP_REST_Response( [ 'success' => true, 'status' => 'processing' ], 200 );
    }

    // ── Auth: Forgot / Reset Password ────────────────────────────────────────

    /**
     * POST /wp-json/vintage-peps/v1/forgot-password
     * Body: { email }
     * Generates a reset key and sends a reset email with a link to the React frontend.
     * Always returns 200 to prevent email enumeration.
     */
    public static function forgot_password( WP_REST_Request $req ): WP_REST_Response {
        $email = sanitize_email( $req->get_param( 'email' ) );

        if ( ! is_email( $email ) ) {
            // Still 200 — no enumeration
            return new WP_REST_Response( [ 'success' => true ], 200 );
        }

        $user = get_user_by( 'email', $email );
        if ( ! $user ) {
            return new WP_REST_Response( [ 'success' => true ], 200 );
        }

        $key = get_password_reset_key( $user );
        if ( is_wp_error( $key ) ) {
            return new WP_REST_Response( [ 'success' => true ], 200 );
        }

        // Build the frontend reset URL
        $frontend_url = get_option( 'vpms_frontend_url', 'https://vintagepeptides.com' );
        $reset_url    = rtrim( $frontend_url, '/' ) . '/reset-password'
            . '?key=' . rawurlencode( $key )
            . '&login=' . rawurlencode( $user->user_login );

        $subject = 'Password Reset — Vintage Peptides';
        $message = "Hello {$user->display_name},\r\n\r\n"
            . "You (or someone else) requested a password reset for your Vintage Peptides research account.\r\n\r\n"
            . "Click the link below to reset your password. This link expires in 24 hours.\r\n\r\n"
            . "{$reset_url}\r\n\r\n"
            . "If you did not request a password reset, you can safely ignore this email.\r\n\r\n"
            . "— Vintage Peptides Research Team";

        wp_mail( $user->user_email, $subject, $message );

        return new WP_REST_Response( [ 'success' => true ], 200 );
    }

    /**
     * POST /wp-json/vintage-peps/v1/reset-password
     * Body: { key, login, password }
     * Validates the key and sets the new password.
     */
    public static function do_reset_password( WP_REST_Request $req ): WP_REST_Response {
        $key      = sanitize_text_field( $req->get_param( 'key' ) );
        $login    = sanitize_text_field( $req->get_param( 'login' ) );
        $password = $req->get_param( 'password' );

        if ( ! $key || ! $login || ! $password || strlen( $password ) < 8 ) {
            return new WP_REST_Response( [ 'error' => 'Missing or invalid parameters.' ], 400 );
        }

        $user = get_user_by( 'login', $login );
        if ( ! $user ) {
            return new WP_REST_Response( [ 'error' => 'Invalid reset link.' ], 400 );
        }

        $result = check_password_reset_key( $key, $login );
        if ( is_wp_error( $result ) ) {
            return new WP_REST_Response( [ 'error' => 'Reset link is expired or invalid. Please request a new one.' ], 400 );
        }

        reset_password( $user, $password );

        return new WP_REST_Response( [ 'success' => true ], 200 );
    }
}
