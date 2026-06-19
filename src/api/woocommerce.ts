// Order creation/cancellation client.
//
// These call our own serverless functions (/api/create-order, /api/cancel-order)
// rather than WooCommerce directly. The WC REST consumer key/secret must never
// reach the browser bundle — see api/create-order.ts and api/cancel-order.ts,
// which hold the only copy of those credentials (server-side env vars).

export interface WcLineItem {
  product_id?: number;
  name: string;
  quantity: number;
  price: string;
  subtotal: string;
  total: string;
  meta_data?: Array<{ key: string; value: string }>;
}

export interface WcAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}

export interface CreateOrderPayload {
  payment_method: string;
  payment_method_title: string;
  billing: WcAddress;
  shipping: WcAddress;
  line_items: WcLineItem[];
  coupon_lines?: Array<{ code: string }>;
  meta_data: Array<{ key: string; value: string }>;
  status: 'pending';
}

export interface WcOrder {
  id: number;
  order_key: string;
  status: string;
}

export async function createWcOrder(payload: CreateOrderPayload): Promise<WcOrder> {
  let res: Response;
  try {
    res = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Unable to reach the order service. Please check your connection and try again.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string })?.error || `Order service error (${res.status})`);
  }

  return res.json();
}

export async function cancelWcOrder(orderId: number): Promise<void> {
  try {
    await fetch('/api/cancel-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
  } catch (err) {
    // Non-fatal: if cancellation fails, the order just sits as 'pending'
    // in WC until manually reviewed. Don't block the UI on this.
    console.warn('[cancelWcOrder] failed to cancel order', orderId, err);
  }
}
