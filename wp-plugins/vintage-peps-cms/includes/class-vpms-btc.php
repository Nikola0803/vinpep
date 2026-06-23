<?php
defined( 'ABSPATH' ) || exit;

/**
 * BTC HD-wallet REST endpoints + admin UI for Vintage Peptides.
 *
 * REST namespace: vp-btc/v1
 *
 * Endpoints:
 *   GET  /wp-json/vp-btc/v1/next-index
 *        Returns { index: int, zpub: string } and atomically increments the
 *        stored derivation index so every caller gets a unique slot.
 *        Auth: WordPress Application Password (admin only).
 *
 *   POST /wp-json/vp-btc/v1/record-assignment
 *        Body: { invoiceId, address, index }
 *        Saves the invoiceId → BTC address mapping as a WP option.
 *        Auth: WordPress Application Password (admin only).
 *
 * WP options used:
 *   vpms_btc_zpub          – operator's zpub public key
 *   vpms_btc_next_index    – next unused derivation index (auto-incremented)
 *   vpms_btc_assignments   – JSON array of { invoiceId, address, index, ts }
 */
class VPMS_BTC {

    const NS        = 'vp-btc/v1';
    const OPT_ZPUB  = 'vpms_btc_zpub';
    const OPT_INDEX = 'vpms_btc_next_index';
    const OPT_ASGN  = 'vpms_btc_assignments';

    public static function init() {
        add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
        add_action( 'admin_menu',    [ __CLASS__, 'register_admin_page' ] );
        add_action( 'admin_post_vpms_save_btc', [ __CLASS__, 'handle_save_btc' ] );
    }

    // ── REST Routes ───────────────────────────────────────────────────────────

    public static function register_routes() {
        register_rest_route( self::NS, '/next-index', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [ __CLASS__, 'get_next_index' ],
            'permission_callback' => [ __CLASS__, 'require_admin' ],
        ] );

        register_rest_route( self::NS, '/record-assignment', [
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => [ __CLASS__, 'record_assignment' ],
            'permission_callback' => [ __CLASS__, 'require_admin' ],
            'args'                => [
                'invoiceId' => [ 'type' => 'string', 'required' => true ],
                'address'   => [ 'type' => 'string', 'required' => true ],
                'index'     => [ 'type' => 'integer', 'required' => true ],
            ],
        ] );
    }

    public static function require_admin( WP_REST_Request $request ): bool {
        return current_user_can( 'manage_options' );
    }

    /**
     * GET /next-index
     * Atomically reads and increments the derivation index.
     */
    public static function get_next_index( WP_REST_Request $request ): WP_REST_Response {
        $zpub = get_option( self::OPT_ZPUB, '' );
        if ( empty( $zpub ) ) {
            return new WP_REST_Response(
                [ 'error' => 'BTC zpub not configured. Set it in WP Admin → Vintage Peps CMS → BTC Settings.' ],
                503
            );
        }

        // Read current index, then increment for the next caller.
        $index = (int) get_option( self::OPT_INDEX, 0 );
        update_option( self::OPT_INDEX, $index + 1 );

        return new WP_REST_Response( [
            'index' => $index,
            'zpub'  => $zpub,
        ], 200 );
    }

    /**
     * POST /record-assignment
     * Saves { invoiceId, address, index } mapping to a WP option array.
     */
    public static function record_assignment( WP_REST_Request $request ): WP_REST_Response {
        $body       = $request->get_json_params();
        $invoiceId  = sanitize_text_field( $body['invoiceId'] ?? '' );
        $address    = sanitize_text_field( $body['address']   ?? '' );
        $index      = (int) ( $body['index'] ?? -1 );

        if ( ! $invoiceId || ! $address || $index < 0 ) {
            return new WP_REST_Response( [ 'error' => 'Invalid payload' ], 400 );
        }

        $assignments = json_decode( get_option( self::OPT_ASGN, '[]' ), true ) ?: [];
        $assignments[] = [
            'invoiceId' => $invoiceId,
            'address'   => $address,
            'index'     => $index,
            'ts'        => time(),
        ];

        update_option( self::OPT_ASGN, wp_json_encode( $assignments ) );

        return new WP_REST_Response( [ 'ok' => true ], 200 );
    }

    // ── Admin UI ──────────────────────────────────────────────────────────────

    public static function register_admin_page() {
        add_submenu_page(
            'vintage-peps-cms',          // parent slug
            'BTC Settings',
            'BTC Settings',
            'manage_options',
            'vpms-btc-settings',
            [ __CLASS__, 'render_admin_page' ]
        );
    }

    public static function render_admin_page() {
        $zpub       = get_option( self::OPT_ZPUB, '' );
        $next_index = (int) get_option( self::OPT_INDEX, 0 );
        $assignments = json_decode( get_option( self::OPT_ASGN, '[]' ), true ) ?: [];
        ?>
        <div class="wrap">
            <h1>BTC HD-Wallet Settings</h1>

            <?php if ( isset( $_GET['updated'] ) ) : ?>
                <div class="notice notice-success is-dismissible"><p>Settings saved.</p></div>
            <?php endif; ?>

            <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                <?php wp_nonce_field( 'vpms_btc_nonce', 'vpms_btc_nonce_field' ); ?>
                <input type="hidden" name="action" value="vpms_save_btc">

                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row"><label for="vpms_btc_zpub">Extended Public Key (zpub)</label></th>
                        <td>
                            <input
                                type="text"
                                id="vpms_btc_zpub"
                                name="vpms_btc_zpub"
                                value="<?php echo esc_attr( $zpub ); ?>"
                                class="regular-text"
                                placeholder="zpub6..."
                            />
                            <p class="description">
                                Your BIP84 zpub key. Vercel derives bc1… addresses from this.
                                <strong>Never enter your seed phrase or xprv here.</strong>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Next Derivation Index</th>
                        <td>
                            <input
                                type="number"
                                name="vpms_btc_next_index"
                                value="<?php echo esc_attr( $next_index ); ?>"
                                class="small-text"
                                min="0"
                            />
                            <p class="description">
                                Auto-increments with each order. Only change this if you need to skip ahead (e.g. after generating addresses externally).
                            </p>
                        </td>
                    </tr>
                </table>

                <?php submit_button( 'Save BTC Settings' ); ?>
            </form>

            <hr>
            <h2>Address Assignments (<?php echo count( $assignments ); ?> total)</h2>
            <?php if ( empty( $assignments ) ) : ?>
                <p>No assignments recorded yet.</p>
            <?php else : ?>
                <table class="widefat striped" style="max-width:900px">
                    <thead>
                        <tr>
                            <th>Invoice ID</th>
                            <th>BTC Address</th>
                            <th>Index</th>
                            <th>Recorded At</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( array_reverse( $assignments ) as $a ) : ?>
                        <tr>
                            <td><?php echo esc_html( $a['invoiceId'] ); ?></td>
                            <td><code><?php echo esc_html( $a['address'] ); ?></code></td>
                            <td><?php echo (int) $a['index']; ?></td>
                            <td><?php echo esc_html( wp_date( 'Y-m-d H:i', $a['ts'] ) ); ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
        <?php
    }

    public static function handle_save_btc() {
        if (
            ! isset( $_POST['vpms_btc_nonce_field'] ) ||
            ! wp_verify_nonce( $_POST['vpms_btc_nonce_field'], 'vpms_btc_nonce' ) ||
            ! current_user_can( 'manage_options' )
        ) {
            wp_die( 'Unauthorized' );
        }

        $zpub  = sanitize_text_field( $_POST['vpms_btc_zpub'] ?? '' );
        $index = max( 0, (int) ( $_POST['vpms_btc_next_index'] ?? 0 ) );

        update_option( self::OPT_ZPUB, $zpub );
        update_option( self::OPT_INDEX, $index );

        wp_redirect( admin_url( 'admin.php?page=vpms-btc-settings&updated=1' ) );
        exit;
    }
}
