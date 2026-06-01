<?php
defined( 'ABSPATH' ) || exit;

/**
 * Manages all Vintage Peps CMS settings stored in a single wp_option key.
 * Exposed via REST at /wp-json/vintage-peps/v1/settings (GET + POST).
 */
class VPMS_Options {

    const OPTION_KEY = 'vpms_settings';

    public static function init() {
        add_action( 'rest_api_init', [ __CLASS__, 'register_settings_route' ] );
    }

    // ── Defaults ──────────────────────────────────────────────────────────────
    public static function defaults(): array {
        return [
            // Payment info (shown on OrderPage)
            'zelle_phone'       => '(208) 243-9222',
            'zelle_name'        => 'Valkyrie Research LLC',
            'cashapp_tag'       => '$ValkyrieResearch',
            'venmo_tag'         => '@ValkyrieResearch',

            // Homepage sections
            'hero_headline'     => 'SCIENCE-BACKED\nPEPTIDE RESEARCH',
            'hero_subheadline'  => 'Premium research peptides lyophilized and verified in the USA.',
            'hero_cta_text'     => 'Shop All Peptides',
            'hero_cta_url'      => '/shop',

            // Military discount
            'military_discount_enabled' => true,
            'military_discount_pct'     => 15,
            'military_banner_text'      => '15% off for active military & veterans — use code VALOR at checkout',

            // Contact
            'contact_email'     => 'support@vintagepeptides.com',
            'contact_phone'     => '(208) 243-9222',

            // Shipping
            'free_shipping_threshold' => 0,
            'ships_from'              => 'Boise, ID',
            'processing_days'         => '1-2',

            // Trust badges
            'trust_badges' => [
                [ 'icon' => 'ri-shield-check-line', 'label' => '3rd Party Lab Tested',     'active' => true ],
                [ 'icon' => 'ri-truck-line',         'label' => 'Ships 1–2 Business Days', 'active' => true ],
                [ 'icon' => 'ri-map-pin-line',        'label' => 'Made in the USA',         'active' => true ],
                [ 'icon' => 'ri-lock-2-line',         'label' => 'Secure Checkout',         'active' => true ],
            ],
        ];
    }

    // ── Get ───────────────────────────────────────────────────────────────────
    public static function get(): array {
        $saved = get_option( self::OPTION_KEY, [] );
        return array_replace_recursive( self::defaults(), (array) $saved );
    }

    // ── Save ──────────────────────────────────────────────────────────────────
    public static function save( array $data ): bool {
        $current = self::get();
        $merged  = array_replace_recursive( $current, $data );
        return update_option( self::OPTION_KEY, $merged );
    }

    // ── REST route ───────────────────────────────────────────────────────────
    public static function register_settings_route() {
        register_rest_route( 'vintage-peps/v1', '/settings', [
            [
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => [ __CLASS__, 'rest_get' ],
                'permission_callback' => '__return_true',   // Public — frontend reads it
            ],
            [
                'methods'             => WP_REST_Server::EDITABLE,
                'callback'            => [ __CLASS__, 'rest_save' ],
                'permission_callback' => function () {
                    return current_user_can( 'manage_options' );
                },
            ],
        ] );
    }

    public static function rest_get( WP_REST_Request $req ): WP_REST_Response {
        return new WP_REST_Response( self::get(), 200 );
    }

    public static function rest_save( WP_REST_Request $req ): WP_REST_Response {
        $data = $req->get_json_params();
        if ( empty( $data ) ) {
            return new WP_REST_Response( [ 'error' => 'No data provided' ], 400 );
        }
        self::save( $data );
        return new WP_REST_Response( self::get(), 200 );
    }
}
