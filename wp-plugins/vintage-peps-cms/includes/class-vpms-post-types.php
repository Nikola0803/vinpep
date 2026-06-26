<?php
defined( 'ABSPATH' ) || exit;

class VPMS_Post_Types {

    public static function init(): void {
        add_action( 'init', [ __CLASS__, 'register_all' ] );
    }

    public static function register_all(): void {
        // FAQs
        register_post_type( 'vpms_faq', [
            'labels'       => [ 'name' => 'FAQs', 'singular_name' => 'FAQ' ],
            'public'       => false,
            'show_ui'      => true,
            'show_in_rest' => true,
            'menu_icon'    => 'dashicons-editor-help',
            'supports'     => [ 'title', 'editor', 'custom-fields' ],
        ] );

        // Testimonials
        register_post_type( 'vpms_testimonial', [
            'labels'       => [ 'name' => 'Testimonials', 'singular_name' => 'Testimonial' ],
            'public'       => false,
            'show_ui'      => true,
            'show_in_rest' => true,
            'menu_icon'    => 'dashicons-format-quote',
            'supports'     => [ 'title', 'editor', 'custom-fields' ],
        ] );

        // COA records
        register_post_type( 'vpms_coa', [
            'labels'       => [ 'name' => 'COA Records', 'singular_name' => 'COA' ],
            'public'       => false,
            'show_ui'      => true,
            'show_in_rest' => true,
            'menu_icon'    => 'dashicons-media-document',
            'supports'     => [ 'title', 'custom-fields' ],
        ] );

        // Hero config
        register_post_type( 'vpms_hero', [
            'labels'       => [ 'name' => 'Hero Sections', 'singular_name' => 'Hero' ],
            'public'       => false,
            'show_ui'      => true,
            'show_in_rest' => true,
            'menu_icon'    => 'dashicons-cover-image',
            'supports'     => [ 'title', 'thumbnail', 'custom-fields' ],
        ] );
    }
}
