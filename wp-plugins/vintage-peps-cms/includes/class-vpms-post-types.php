<?php
defined( 'ABSPATH' ) || exit;

class VPMS_Post_Types {

    public static function init() {
        add_action( 'init', [ __CLASS__, 'register_all' ] );
    }

    public static function register_all() {
        self::register_faq();
        self::register_testimonial();
        self::register_coa();
        self::register_hero_slide();
    }

    // ── FAQ ───────────────────────────────────────────────────────────────────
    private static function register_faq() {
        register_post_type( 'vpms_faq', [
            'labels'       => [
                'name'          => 'FAQs',
                'singular_name' => 'FAQ',
                'add_new_item'  => 'Add New FAQ',
                'edit_item'     => 'Edit FAQ',
            ],
            'public'       => false,
            'show_ui'      => true,
            'show_in_menu' => false,   // Added under Vintage Peps CMS menu
            'show_in_rest' => true,
            'rest_base'    => 'vcms-faqs',
            'supports'     => [ 'title', 'editor', 'page-attributes' ],
            'menu_icon'    => 'dashicons-editor-help',
        ] );

        register_post_meta( 'vpms_faq', '_vpms_faq_category', [
            'type'         => 'string',
            'single'       => true,
            'show_in_rest' => true,
            'default'      => 'general',
        ] );
    }

    // ── Testimonial ───────────────────────────────────────────────────────────
    private static function register_testimonial() {
        register_post_type( 'vpms_testimonial', [
            'labels'       => [
                'name'          => 'Testimonials',
                'singular_name' => 'Testimonial',
                'add_new_item'  => 'Add New Testimonial',
            ],
            'public'       => false,
            'show_ui'      => true,
            'show_in_menu' => false,
            'show_in_rest' => true,
            'rest_base'    => 'vcms-testimonials',
            'supports'     => [ 'title', 'editor', 'page-attributes' ],
        ] );

        foreach ( [ '_vpms_rating', '_vpms_author_title', '_vpms_verified' ] as $meta ) {
            register_post_meta( 'vpms_testimonial', $meta, [
                'type'         => 'string',
                'single'       => true,
                'show_in_rest' => true,
                'default'      => '',
            ] );
        }
    }

    // ── COA (Certificates of Analysis) ───────────────────────────────────────
    private static function register_coa() {
        register_post_type( 'vpms_coa', [
            'labels'       => [
                'name'          => 'COA Files',
                'singular_name' => 'COA',
                'add_new_item'  => 'Upload New COA',
            ],
            'public'       => false,
            'show_ui'      => true,
            'show_in_menu' => false,
            'show_in_rest' => true,
            'rest_base'    => 'vcms-coas',
            'supports'     => [ 'title', 'page-attributes' ],
        ] );

        foreach ( [ '_vpms_coa_product_slug', '_vpms_coa_lot', '_vpms_coa_date', '_vpms_coa_pdf_url', '_vpms_coa_endotoxin_url', '_vpms_coa_purity' ] as $meta ) {
            register_post_meta( 'vpms_coa', $meta, [
                'type'         => 'string',
                'single'       => true,
                'show_in_rest' => true,
                'default'      => '',
            ] );
        }
    }

    // ── Hero Slide ────────────────────────────────────────────────────────────
    private static function register_hero_slide() {
        register_post_type( 'vpms_hero', [
            'labels'       => [
                'name'          => 'Hero Slides',
                'singular_name' => 'Hero Slide',
            ],
            'public'       => false,
            'show_ui'      => true,
            'show_in_menu' => false,
            'show_in_rest' => true,
            'rest_base'    => 'vcms-hero',
            'supports'     => [ 'title', 'editor', 'thumbnail', 'page-attributes' ],
        ] );

        foreach ( [ '_vpms_hero_cta_text', '_vpms_hero_cta_url', '_vpms_hero_badge' ] as $meta ) {
            register_post_meta( 'vpms_hero', $meta, [
                'type'         => 'string',
                'single'       => true,
                'show_in_rest' => true,
                'default'      => '',
            ] );
        }
    }
}
