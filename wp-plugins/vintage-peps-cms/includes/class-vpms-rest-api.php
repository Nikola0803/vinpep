<?php
defined( 'ABSPATH' ) || exit;

/**
 * Custom REST endpoints for the Vintage Peptides React frontend.
 *
 * Base: /wp-json/vintage-peps/v1/
 *
 * Endpoints:
 *   GET  /faqs            — all FAQs (public)
 *   GET  /testimonials    — all testimonials (public)
 *   GET  /coas            — COAs optionally filtered by ?product=<slug>
 *   GET  /hero            — hero slides (public)
 *   GET  /settings        — site settings (handled by VPMS_Options)
 *   POST /settings        — update settings (admin)
 *   GET  /blog            — blog posts with excerpt (public)
 *   GET  /blog/:slug      — single blog post (public)
 *   GET  /orders/pending  — pending Zelle/CashApp/Venmo WC orders (admin)
 *   POST /orders/:id/mark-paid — mark order as processing (admin)
 */
class VPMS_REST_API {

    const NS = 'vintage-peps/v1';

    public static function init() {
        add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
        add_filter( 'rest_post_type_collections_private', [ __CLASS__, 'allow_private_cpt_in_rest' ], 10, 2 );
    }

    // Allow private CPTs to be read via REST (auth handled per-route)
    public static function allow_private_cpt_in_rest( $private, $post_type ) {
        $vpms_types = [ 'vpms_faq', 'vpms_testimonial', 'vpms_coa', 'vpms_hero' ];
        return in_array( $post_type, $vpms_types, true ) ? false : $private;
    }

    public static function register_routes() {
        // FAQs
        register_rest_route( self::NS, '/faqs', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [ __CLASS__, 'get_faqs' ],
            'permission_callback' => '__return_true',
        ] );

        // Testimonials
        register_rest_route( self::NS, '/testimonials', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [ __CLASS__, 'get_testimonials' ],
            'permission_callback' => '__return_true',
        ] );

        // COAs
        register_rest_route( self::NS, '/coas', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [ __CLASS__, 'get_coas' ],
            'permission_callback' => '__return_true',
            'args'                => [
                'product' => [ 'type' => 'string', 'default' => '' ],
            ],
        ] );

        // Hero slides
        register_rest_route( self::NS, '/hero', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [ __CLASS__, 'get_hero' ],
            'permission_callback' => '__return_true',
        ] );

        // Blog list
        register_rest_route( self::NS, '/blog', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [ __CLASS__, 'get_blog' ],
            'permission_callback' => '__return_true',
            'args'                => [
                'per_page' => [ 'type' => 'integer', 'default' => 10 ],
                'page'     => [ 'type' => 'integer', 'default' => 1 ],
            ],
        ] );

        // Single blog post
        register_rest_route( self::NS, '/blog/(?P<slug>[a-z0-9\-]+)', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [ __CLASS__, 'get_blog_post' ],
            'permission_callback' => '__return_true',
        ] );

        // Pending manual-payment orders
        register_rest_route( self::NS, '/orders/pending', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [ __CLASS__, 'get_pending_orders' ],
            'permission_callback' => function () {
                return current_user_can( 'edit_shop_orders' );
            },
        ] );

        // Mark order paid → processing
        register_rest_route( self::NS, '/orders/(?P<id>\d+)/mark-paid', [
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => [ __CLASS__, 'mark_order_paid' ],
            'permission_callback' => function () {
                return current_user_can( 'edit_shop_orders' );
            },
        ] );
    }

    // ── FAQs ──────────────────────────────────────────────────────────────────
    public static function get_faqs(): WP_REST_Response {
        $posts = get_posts( [
            'post_type'      => 'vpms_faq',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'orderby'        => 'menu_order',
            'order'          => 'ASC',
        ] );

        $data = array_map( function ( $p ) {
            return [
                'id'       => $p->ID,
                'question' => $p->post_title,
                'answer'   => wp_strip_all_tags( apply_filters( 'the_content', $p->post_content ) ),
                'category' => get_post_meta( $p->ID, '_vpms_faq_category', true ) ?: 'general',
                'order'    => (int) $p->menu_order,
            ];
        }, $posts );

        return new WP_REST_Response( $data, 200 );
    }

    // ── Testimonials ──────────────────────────────────────────────────────────
    public static function get_testimonials(): WP_REST_Response {
        $posts = get_posts( [
            'post_type'      => 'vpms_testimonial',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'orderby'        => 'menu_order',
            'order'          => 'ASC',
        ] );

        $data = array_map( function ( $p ) {
            return [
                'id'       => $p->ID,
                'author'   => $p->post_title,
                'title'    => get_post_meta( $p->ID, '_vpms_author_title', true ),
                'body'     => wp_strip_all_tags( $p->post_content ),
                'rating'   => (int) ( get_post_meta( $p->ID, '_vpms_rating', true ) ?: 5 ),
                'verified' => (bool) get_post_meta( $p->ID, '_vpms_verified', true ),
                'order'    => (int) $p->menu_order,
            ];
        }, $posts );

        return new WP_REST_Response( $data, 200 );
    }

    // ── COAs ──────────────────────────────────────────────────────────────────
    public static function get_coas( WP_REST_Request $req ): WP_REST_Response {
        $args = [
            'post_type'      => 'vpms_coa',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ];

        $product_slug = sanitize_text_field( $req->get_param( 'product' ) );
        if ( $product_slug ) {
            $args['meta_query'] = [ [
                'key'     => '_vpms_coa_product_slug',
                'value'   => $product_slug,
                'compare' => '=',
            ] ];
        }

        $posts = get_posts( $args );

        $data = array_map( function ( $p ) {
            return [
                'id'             => $p->ID,
                'product_name'   => $p->post_title,
                'product_slug'   => get_post_meta( $p->ID, '_vpms_coa_product_slug', true ),
                'lot'            => get_post_meta( $p->ID, '_vpms_coa_lot', true ),
                'date'           => get_post_meta( $p->ID, '_vpms_coa_date', true ),
                'purity'         => get_post_meta( $p->ID, '_vpms_coa_purity', true ),
                'pdf_url'        => get_post_meta( $p->ID, '_vpms_coa_pdf_url', true ),
                'endotoxin_url'  => get_post_meta( $p->ID, '_vpms_coa_endotoxin_url', true ) ?: null,
            ];
        }, $posts );

        return new WP_REST_Response( $data, 200 );
    }

    // ── Hero slides ───────────────────────────────────────────────────────────
    public static function get_hero(): WP_REST_Response {
        $posts = get_posts( [
            'post_type'      => 'vpms_hero',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'orderby'        => 'menu_order',
            'order'          => 'ASC',
        ] );

        $data = array_map( function ( $p ) {
            $thumb = get_the_post_thumbnail_url( $p->ID, 'full' );
            return [
                'id'       => $p->ID,
                'headline' => $p->post_title,
                'body'     => wp_strip_all_tags( $p->post_content ),
                'image'    => $thumb ?: '',
                'cta_text' => get_post_meta( $p->ID, '_vpms_hero_cta_text', true ),
                'cta_url'  => get_post_meta( $p->ID, '_vpms_hero_cta_url', true ),
                'badge'    => get_post_meta( $p->ID, '_vpms_hero_badge', true ),
            ];
        }, $posts );

        return new WP_REST_Response( $data, 200 );
    }

    // ── Blog ──────────────────────────────────────────────────────────────────
    public static function get_blog( WP_REST_Request $req ): WP_REST_Response {
        $per_page = (int) $req->get_param( 'per_page' );
        $page     = (int) $req->get_param( 'page' );

        $query = new WP_Query( [
            'post_type'      => 'post',
            'post_status'    => 'publish',
            'posts_per_page' => $per_page,
            'paged'          => $page,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ] );

        $posts = array_map( function ( $p ) {
            return [
                'id'       => $p->ID,
                'slug'     => $p->post_name,
                'title'    => $p->post_title,
                'excerpt'  => has_excerpt( $p ) ? wp_strip_all_tags( get_the_excerpt( $p ) ) : wp_trim_words( wp_strip_all_tags( $p->post_content ), 30 ),
                'date'     => $p->post_date,
                'image'    => get_the_post_thumbnail_url( $p->ID, 'large' ) ?: '',
                'category' => implode( ', ', wp_list_pluck( get_the_category( $p->ID ), 'name' ) ),
                'read_time'=> max( 1, (int) ceil( str_word_count( wp_strip_all_tags( $p->post_content ) ) / 200 ) ) . ' min read',
            ];
        }, $query->posts );

        return new WP_REST_Response( [
            'posts'       => $posts,
            'total'       => (int) $query->found_posts,
            'total_pages' => (int) $query->max_num_pages,
        ], 200 );
    }

    public static function get_blog_post( WP_REST_Request $req ): WP_REST_Response {
        $slug  = sanitize_text_field( $req->get_param( 'slug' ) );
        $posts = get_posts( [ 'post_type' => 'post', 'post_status' => 'publish', 'name' => $slug ] );

        if ( empty( $posts ) ) {
            return new WP_REST_Response( [ 'error' => 'Not found' ], 404 );
        }

        $p = $posts[0];
        return new WP_REST_Response( [
            'id'       => $p->ID,
            'slug'     => $p->post_name,
            'title'    => $p->post_title,
            'content'  => apply_filters( 'the_content', $p->post_content ),
            'date'     => $p->post_date,
            'image'    => get_the_post_thumbnail_url( $p->ID, 'full' ) ?: '',
            'category' => implode( ', ', wp_list_pluck( get_the_category( $p->ID ), 'name' ) ),
        ], 200 );
    }

    // ── Pending orders ────────────────────────────────────────────────────────
    public static function get_pending_orders(): WP_REST_Response {
        if ( ! function_exists( 'wc_get_orders' ) ) {
            return new WP_REST_Response( [ 'error' => 'WooCommerce not active' ], 503 );
        }

        $orders = wc_get_orders( [
            'status'  => [ 'pending' ],
            'limit'   => 50,
            'orderby' => 'date',
            'order'   => 'DESC',
            'meta_query' => [ [
                'key'     => '_payment_method',
                'value'   => [ 'zelle', 'cashapp', 'venmo' ],
                'compare' => 'IN',
            ] ],
        ] );

        $data = array_map( function ( $order ) {
            return [
                'id'             => $order->get_id(),
                'number'         => $order->get_order_number(),
                'status'         => $order->get_status(),
                'total'          => $order->get_total(),
                'currency'       => $order->get_currency(),
                'payment_method' => $order->get_payment_method(),
                'payment_title'  => $order->get_payment_method_title(),
                'date_created'   => $order->get_date_created() ? $order->get_date_created()->date( 'Y-m-d H:i:s' ) : '',
                'billing'        => [
                    'name'  => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
                    'email' => $order->get_billing_email(),
                    'phone' => $order->get_billing_phone(),
                ],
                'items' => array_map( function ( $item ) {
                    return [
                        'name'     => $item->get_name(),
                        'quantity' => $item->get_quantity(),
                        'total'    => $item->get_total(),
                    ];
                }, array_values( $order->get_items() ) ),
            ];
        }, $orders );

        return new WP_REST_Response( $data, 200 );
    }

    // ── Mark order paid ───────────────────────────────────────────────────────
    public static function mark_order_paid( WP_REST_Request $req ): WP_REST_Response {
        if ( ! function_exists( 'wc_get_order' ) ) {
            return new WP_REST_Response( [ 'error' => 'WooCommerce not active' ], 503 );
        }

        $order_id = (int) $req->get_param( 'id' );
        $order    = wc_get_order( $order_id );

        if ( ! $order ) {
            return new WP_REST_Response( [ 'error' => 'Order not found' ], 404 );
        }

        $note = sanitize_text_field( $req->get_param( 'note' ) ?? '' );

        $order->update_status( 'processing', $note ?: 'Payment confirmed manually via Vintage Peps CMS.' );
        $order->set_date_paid( time() );
        $order->save();

        // Trigger WC order confirmation email
        do_action( 'woocommerce_order_status_changed', $order->get_id(), 'pending', 'processing', $order );

        return new WP_REST_Response( [
            'id'     => $order->get_id(),
            'status' => $order->get_status(),
        ], 200 );
    }
}
