<?php
defined( 'ABSPATH' ) || exit;

/**
 * Adds a "Pending Payments" admin page under the Vintage Peps CMS menu.
 * Shows all WC orders with status=pending and payment_method in {zelle,cashapp,venmo}.
 * One-click "Mark Paid" button updates status → processing and sends confirmation email.
 */
class VPMS_Order_Panel {

    public static function init() {
        add_action( 'admin_menu', [ __CLASS__, 'register_page' ], 20 );
        add_action( 'admin_post_vpms_mark_paid', [ __CLASS__, 'handle_mark_paid' ] );
        add_action( 'admin_notices', [ __CLASS__, 'show_notices' ] );
    }

    public static function register_page() {
        add_submenu_page(
            'vintage-peps-cms',                 // Parent slug (registered by VPMS_Admin)
            'Pending Payments',
            'Pending Payments',
            'edit_shop_orders',
            'vcms-pending-orders',
            [ __CLASS__, 'render_page' ]
        );
    }

    public static function render_page() {
        if ( ! function_exists( 'wc_get_orders' ) ) {
            echo '<div class="wrap"><h1>Pending Payments</h1><p>WooCommerce is not active.</p></div>';
            return;
        }

        // Fetch all pending orders — meta_query on _payment_method doesn't work
        // with WooCommerce HPOS (payment method is in wc_orders table, not post meta).
        $all_orders = wc_get_orders( [
            'status'  => [ 'pending' ],
            'limit'   => 100,
            'orderby' => 'date',
            'order'   => 'DESC',
        ] );

        // Filter client-side to only manual payment methods
        $manual_methods = [ 'zelle', 'cashapp', 'venmo', 'btc', 'usdc', 'usdt' ];
        $orders = array_values( array_filter( $all_orders, fn( $o ) =>
            in_array( $o->get_payment_method(), $manual_methods, true ) || ! $o->get_payment_method()
        ) );

        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline">⚡ Pending Payments</h1>
            <span class="title-count" style="background:#c00;color:#fff;border-radius:11px;padding:2px 8px;font-size:12px;margin-left:8px;"><?php echo count( $orders ); ?></span>
            <hr class="wp-header-end">

            <?php if ( empty( $orders ) ) : ?>
                <p style="margin-top:20px;color:#666;">✅ No pending manual payments. All clear!</p>
            <?php else : ?>
            <table class="wp-list-table widefat fixed striped" style="margin-top:16px;">
                <thead>
                    <tr>
                        <th width="80">Order</th>
                        <th width="180">Customer</th>
                        <th width="120">Payment</th>
                        <th width="120">Amount</th>
                        <th width="160">Date</th>
                        <th>Items</th>
                        <th width="120">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ( $orders as $order ) :
                        $method = $order->get_payment_method();
                        $badge  = match( $method ) {
                            'zelle'   => '<span style="background:#6d1ed4;color:#fff;padding:2px 8px;border-radius:3px;font-size:11px;">Zelle</span>',
                            'cashapp' => '<span style="background:#00c244;color:#fff;padding:2px 8px;border-radius:3px;font-size:11px;">Cash App</span>',
                            'venmo'   => '<span style="background:#3d95ce;color:#fff;padding:2px 8px;border-radius:3px;font-size:11px;">Venmo</span>',
                            'btc'     => '<span style="background:#f7931a;color:#fff;padding:2px 8px;border-radius:3px;font-size:11px;">Bitcoin</span>',
                            'usdc'    => '<span style="background:#2775ca;color:#fff;padding:2px 8px;border-radius:3px;font-size:11px;">USDC</span>',
                            'usdt'    => '<span style="background:#26a17b;color:#fff;padding:2px 8px;border-radius:3px;font-size:11px;">USDT</span>',
                            default   => esc_html( $order->get_payment_method_title() ),
                        };
                        $items_summary = implode( ', ', array_map(
                            fn( $i ) => $i->get_name() . ' ×' . $i->get_quantity(),
                            array_values( $order->get_items() )
                        ) );
                    ?>
                    <tr>
                        <td>
                            <a href="<?php echo esc_url( $order->get_edit_order_url() ); ?>" target="_blank">
                                #<?php echo esc_html( $order->get_order_number() ); ?>
                            </a>
                        </td>
                        <td>
                            <strong><?php echo esc_html( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() ); ?></strong><br>
                            <small><?php echo esc_html( $order->get_billing_email() ); ?></small><br>
                            <small><?php echo esc_html( $order->get_billing_phone() ); ?></small>
                        </td>
                        <td><?php echo $badge; ?></td>
                        <td><strong><?php echo wc_price( $order->get_total() ); ?></strong></td>
                        <td><?php echo esc_html( $order->get_date_created() ? $order->get_date_created()->date( 'M j, Y g:i a' ) : '—' ); ?></td>
                        <td style="font-size:12px;"><?php echo esc_html( $items_summary ); ?></td>
                        <td>
                            <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" onsubmit="return confirm('Mark order #<?php echo esc_js( $order->get_order_number() ); ?> as PAID and send confirmation email?');">
                                <?php wp_nonce_field( 'vpms_mark_paid_' . $order->get_id() ); ?>
                                <input type="hidden" name="action"   value="vpms_mark_paid">
                                <input type="hidden" name="order_id" value="<?php echo esc_attr( $order->get_id() ); ?>">
                                <button type="submit" class="button button-primary" style="background:#16a34a;border-color:#15803d;font-weight:700;">
                                    ✓ Mark Paid
                                </button>
                            </form>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <?php endif; ?>
        </div>
        <?php
    }

    public static function handle_mark_paid() {
        $order_id = (int) ( $_POST['order_id'] ?? 0 );

        if ( ! $order_id || ! check_admin_referer( 'vpms_mark_paid_' . $order_id ) ) {
            wp_die( 'Security check failed.' );
        }

        if ( ! current_user_can( 'edit_shop_orders' ) ) {
            wp_die( 'Insufficient permissions.' );
        }

        $order = wc_get_order( $order_id );
        if ( $order ) {
            $order->update_status( 'processing', 'Payment confirmed manually via Vintage Peps CMS admin panel.' );
            $order->set_date_paid( time() );
            $order->save();

            // Trigger WC processing email
            do_action( 'woocommerce_order_status_changed', $order->get_id(), 'pending', 'processing', $order );

            wp_redirect( add_query_arg( [
                'page'    => 'vcms-pending-orders',
                'marked'  => $order->get_order_number(),
            ], admin_url( 'admin.php' ) ) );
            exit;
        }

        wp_redirect( admin_url( 'admin.php?page=vcms-pending-orders&error=1' ) );
        exit;
    }

    public static function show_notices() {
        $screen = get_current_screen();
        if ( ! $screen || strpos( $screen->id, 'vcms-pending-orders' ) === false ) return;

        if ( isset( $_GET['marked'] ) ) {
            echo '<div class="notice notice-success is-dismissible"><p>✅ Order #' . esc_html( $_GET['marked'] ) . ' marked as paid. Confirmation email sent.</p></div>';
        }
        if ( isset( $_GET['error'] ) ) {
            echo '<div class="notice notice-error is-dismissible"><p>❌ Could not update order. Please try again.</p></div>';
        }
    }
}
