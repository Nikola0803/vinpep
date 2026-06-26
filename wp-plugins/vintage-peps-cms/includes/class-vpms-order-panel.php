<?php
/**
 * Order Panel — adds a "Pending P2P Orders" submenu under WooCommerce
 * so staff can see and mark-paid incoming Cash App / Venmo / Zelle orders.
 */
defined( 'ABSPATH' ) || exit;

class VPMS_Order_Panel {

    public static function init(): void {
        add_action( 'admin_menu', [ __CLASS__, 'add_menu' ] );
    }

    public static function add_menu(): void {
        add_submenu_page(
            'woocommerce',
            'Pending P2P Orders',
            'P2P Orders',
            'edit_shop_orders',
            'vpms-p2p-orders',
            [ __CLASS__, 'render_page' ]
        );
    }

    public static function render_page(): void {
        if ( ! function_exists( 'wc_get_orders' ) ) {
            echo '<div class="wrap"><p>WooCommerce not active.</p></div>';
            return;
        }

        $orders = wc_get_orders( [
            'status' => [ 'pending', 'on-hold' ],
            'limit'  => 100,
        ] );

        echo '<div class="wrap"><h1>Pending P2P Orders</h1>';
        echo '<p>Orders waiting for payment confirmation. After verifying payment, click Mark Paid.</p>';

        if ( empty( $orders ) ) {
            echo '<p><em>No pending orders.</em></p></div>';
            return;
        }

        echo '<table class="widefat striped"><thead><tr>';
        echo '<th>Order</th><th>Customer</th><th>Method</th><th>Handle</th><th>Memo</th><th>Total</th><th>Date</th><th>Action</th>';
        echo '</tr></thead><tbody>';

        foreach ( $orders as $order ) {
            $id     = $order->get_id();
            $memo   = esc_html( $order->get_meta( 'memo_code' ) );
            $method = esc_html( $order->get_payment_method_title() );
            $handle = esc_html( $order->get_meta( 'payment_handle' ) );
            $total  = wc_price( $order->get_total() );
            $name   = esc_html( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() );
            $date   = $order->get_date_created()->date_i18n( 'M j, Y H:i' );
            $url    = admin_url( "admin.php?page=vpms-p2p-orders&mark_paid={$id}&_nonce=" . wp_create_nonce( "vpms_mark_paid_{$id}" ) );

            echo "<tr><td><a href='" . esc_url( get_edit_post_link( $id ) ) . "'>#{$id}</a></td>";
            echo "<td>{$name}</td><td>{$method}</td><td>{$handle}</td><td><code>{$memo}</code></td>";
            echo "<td>{$total}</td><td>{$date}</td>";
            echo "<td><a class='button button-primary' href='" . esc_url( $url ) . "'>Mark Paid</a></td></tr>";
        }

        echo '</tbody></table></div>';

        // Handle mark-paid action
        if ( isset( $_GET['mark_paid'] ) ) {
            $order_id = (int) $_GET['mark_paid'];
            $nonce    = sanitize_text_field( $_GET['_nonce'] ?? '' );
            if ( wp_verify_nonce( $nonce, "vpms_mark_paid_{$order_id}" ) ) {
                $o = wc_get_order( $order_id );
                if ( $o ) {
                    $o->update_status( 'processing', 'Marked paid via P2P admin panel.' );
                    echo '<div class="notice notice-success"><p>Order #' . esc_html( $order_id ) . ' marked as paid.</p></div>';
                }
            }
        }
    }
}
