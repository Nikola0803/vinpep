<?php
/**
 * Admin UI — settings page, FAQ/testimonial meta boxes.
 */
defined( 'ABSPATH' ) || exit;

class VPMS_Admin {

    public static function init(): void {
        add_action( 'add_meta_boxes', [ __CLASS__, 'add_meta_boxes' ] );
        add_action( 'save_post',      [ __CLASS__, 'save_meta' ] );
    }

    public static function add_meta_boxes(): void {
        add_meta_box( 'vpms_testimonial_meta', 'Testimonial Details', [ __CLASS__, 'testimonial_meta_box' ], 'vpms_testimonial', 'normal' );
        add_meta_box( 'vpms_coa_meta',         'COA Details',         [ __CLASS__, 'coa_meta_box' ],         'vpms_coa',         'normal' );
        add_meta_box( 'vpms_hero_meta',         'Hero Details',        [ __CLASS__, 'hero_meta_box' ],        'vpms_hero',        'normal' );
    }

    public static function testimonial_meta_box( WP_Post $post ): void {
        $rating   = get_post_meta( $post->ID, 'rating', true ) ?: 5;
        $title    = get_post_meta( $post->ID, 'title', true );
        $verified = get_post_meta( $post->ID, 'verified_buyer', true );
        wp_nonce_field( 'vpms_meta', 'vpms_nonce' );
        echo '<table class="form-table">';
        echo '<tr><th>Rating (1-5)</th><td><input type="number" min="1" max="5" name="vpms_rating" value="' . esc_attr( $rating ) . '"></td></tr>';
        echo '<tr><th>Title / Role</th><td><input type="text" name="vpms_title" value="' . esc_attr( $title ) . '" style="width:100%"></td></tr>';
        echo '<tr><th>Verified Buyer</th><td><input type="checkbox" name="vpms_verified_buyer" value="1"' . checked( $verified, '1', false ) . '></td></tr>';
        echo '</table>';
    }

    public static function coa_meta_box( WP_Post $post ): void {
        $fields = [
            'product_slug'   => 'Product Slug (matches WC product)',
            'batch_number'   => 'Batch Number',
            'test_date'      => 'Test Date (YYYY-MM-DD)',
            'lab_name'       => 'Lab Name',
            'molecular_weight' => 'Molecular Weight',
            'sequence'       => 'Amino Acid Sequence',
            'appearance'     => 'Appearance',
            'storage'        => 'Storage Conditions',
            'methods'        => 'Methods (comma-separated, e.g. HPLC, MS)',
        ];
        wp_nonce_field( 'vpms_meta', 'vpms_nonce' );
        echo '<table class="form-table">';
        foreach ( $fields as $key => $label ) {
            $val = get_post_meta( $post->ID, $key, true );
            echo '<tr><th>' . esc_html( $label ) . '</th><td><input type="text" name="vpms_' . esc_attr( $key ) . '" value="' . esc_attr( $val ) . '" style="width:100%"></td></tr>';
        }
        echo '</table>';
    }

    public static function hero_meta_box( WP_Post $post ): void {
        $fields = [
            'subheadline' => 'Sub-headline',
            'cta_label'   => 'CTA Button Label',
            'cta_url'     => 'CTA Button URL',
        ];
        wp_nonce_field( 'vpms_meta', 'vpms_nonce' );
        echo '<table class="form-table">';
        foreach ( $fields as $key => $label ) {
            $val = get_post_meta( $post->ID, $key, true );
            echo '<tr><th>' . esc_html( $label ) . '</th><td><input type="text" name="vpms_' . esc_attr( $key ) . '" value="' . esc_attr( $val ) . '" style="width:100%"></td></tr>';
        }
        echo '</table>';
    }

    public static function save_meta( int $post_id ): void {
        if ( ! isset( $_POST['vpms_nonce'] ) ) return;
        if ( ! wp_verify_nonce( sanitize_text_field( $_POST['vpms_nonce'] ), 'vpms_meta' ) ) return;
        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;

        $text_fields = [
            'vpms_rating', 'vpms_title', 'vpms_product_slug', 'vpms_batch_number',
            'vpms_test_date', 'vpms_lab_name', 'vpms_molecular_weight', 'vpms_sequence',
            'vpms_appearance', 'vpms_storage', 'vpms_methods', 'vpms_subheadline',
            'vpms_cta_label', 'vpms_cta_url',
        ];

        foreach ( $text_fields as $field ) {
            $meta_key = str_replace( 'vpms_', '', $field );
            if ( isset( $_POST[ $field ] ) ) {
                update_post_meta( $post_id, $meta_key, sanitize_text_field( $_POST[ $field ] ) );
            }
        }

        // Checkbox
        update_post_meta( $post_id, 'verified_buyer', isset( $_POST['vpms_verified_buyer'] ) ? '1' : '0' );
    }
}
