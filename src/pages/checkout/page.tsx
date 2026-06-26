import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageLayout from '@/components/feature/PageLayout';
import { useCart } from '@/context/CartContext';
import {
  generateMemo,
  generateInvoiceId,
  getExpiryTimestamp,
  formatCountdown,
  isExpired,
  saveAuditEntry,
  updateAuditEntry,
  type AuditLogEntry,
} from '@/utils/orderUtils';
import { createWcOrder, cancelWcOrder, type CreateOrderPayload } from '@/api/woocommerce';
import { assignWorker, saveAssignment } from '@/utils/workerRotation';

// ─── US States autocomplete ─────────────────────────────────────────────────

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
];

function StateAutocomplete({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.length === 0 ? US_STATES : US_STATES.filter(s =>
    s.name.toLowerCase().startsWith(query.toLowerCase()) ||
    s.code.toLowerCase().startsWith(query.toLowerCase())
  );

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function select(code: string) {
    setQuery(code);
    onChange(code);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        required
        value={query}
        placeholder="State"
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-2.5 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/40"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 max-h-48 overflow-y-auto bg-parchment border border-brass/40 border-t-0 shadow-lg">
          {filtered.map(s => (
            <button
              key={s.code}
              type="button"
              onMouseDown={() => select(s.code)}
              className="w-full text-left px-3 py-2 font-body text-sm text-espresso hover:bg-brass/10 flex items-center gap-2"
            >
              <span className="font-mono text-xs text-brass w-6">{s.code}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Payment methods ──────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  {
    id: 'cashapp',
    name: 'Cash App',
    handle: '$VVGOps',
    displayEntity: 'Vintage Vitality',
    icon: 'ri-money-dollar-circle-line',
    instruction: 'Send to $VVGOps — enter only your memo code in the notes field.',
    disabled: false,
  },
  {
    id: 'venmo',
    name: 'Venmo',
    handle: '@VVGOps',
    displayEntity: 'Vintage Vitality',
    icon: 'ri-wallet-3-line',
    instruction: 'Send to @VVGOps — enter only your memo code in the notes field.',
    disabled: false,
  },
  {
    id: 'zelle',
    name: 'Zelle',
    handle: 'VintageVitality',
    displayEntity: 'Vintage Vitality',
    icon: 'ri-bank-card-line',
    instruction: 'Send to VintageVitality via Zelle — enter only your memo code in the notes field.',
    disabled: false,
  },
  {
    id: 'usdc',
    name: 'USDC (Stablecoin)',
    handle: 'usdc',
    displayEntity: '',
    icon: 'ri-coins-line',
    instruction: 'Send USDC on Ethereum (ERC-20) or Solana (SPL) — choose network after selecting.',
    disabled: false,
  },
  {
    id: 'usdt',
    name: 'USDT (Tether)',
    handle: 'usdt',
    displayEntity: '',
    icon: 'ri-coin-line',
    instruction: 'Send USDT on Ethereum (ERC-20) or Solana (SPL) — choose network after selecting.',
    disabled: false,
  },
  {
    id: 'btc',
    name: 'Bitcoin (BTC) — Save 5% Instantly',
    handle: 'btc-hd',
    displayEntity: '',
    icon: 'ri-bit-coin-line',
    instruction: 'A unique BTC address is generated for your order. 5% discount applied automatically.',
    disabled: false,
  },
];

// ─── Mock coupons (replace with WC API call in production) ───────────────────

const VALID_COUPONS: Record<string, { type: 'flat' | 'percent'; value: number; label: string }> = {
  RESEARCH15: { type: 'percent', value: 15, label: '15% off' },
  SAVE20: { type: 'flat', value: 20, label: '$20 off' },
};

// ─── Crypto stablecoin addresses ─────────────────────────────────────────────

const CRYPTO_ADDRESSES: Record<string, Record<'eth' | 'sol', string>> = {
  usdc: {
    eth: '0xf751e21093e7aD4Da07039A6Cd1581132C5f03A1',
    sol: 'H3GvD8jnDMCWmQb5njWXfEG4rWWUnXHswcUfFo3oGEdM',
  },
  usdt: {
    eth: '0xf751e21093e7aD4Da07039A6Cd1581132C5f03A1',
    sol: 'H3GvD8jnDMCWmQb5njWXfEG4rWWUnXHswcUfFo3oGEdM',
  },
};

// ─── BTC address fetch ────────────────────────────────────────────────────────

async function fetchBtcAddress(invoiceId: string): Promise<{ address: string; index: number }> {
  const res = await fetch(`/api/btc-address?invoiceId=${encodeURIComponent(invoiceId)}`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { const j = await res.json(); detail = j.error ?? detail; } catch { /* ignore */ }
    throw new Error(detail);
  }
  return res.json();
}

// ─── BTC price fetch (CoinGecko, free tier) ───────────────────────────────────

async function fetchBtcPriceUsd(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      { signal: AbortSignal.timeout(5_000) }
    );
    const data = await res.json();
    return data?.bitcoin?.usd ?? null;
  } catch {
    return null;
  }
}

// ─── Countdown component ──────────────────────────────────────────────────────

function Countdown({ expiresAt, onExpired }: { expiresAt: number; onExpired: () => void }) {
  const [display, setDisplay] = useState(formatCountdown(expiresAt));

  useEffect(() => {
    const id = setInterval(() => {
      if (isExpired(expiresAt)) {
        clearInterval(id);
        onExpired();
      } else {
        setDisplay(formatCountdown(expiresAt));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpired]);

  return <span className="font-mono text-brass font-bold text-lg tabular-nums">{display}</span>;
}

// ─── Payment Proof Upload (crypto orders) ────────────────────────────────────

function PaymentProofUpload({ orderId, invoiceId }: { orderId: number; invoiceId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 10 * 1024 * 1024) {
        setUploadError('File too large (max 10 MB).');
        return;
      }
      setFile(f);
      setUploadError('');
    }
  };

  const handleUpload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setUploadError('');
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip the data:...;base64, prefix
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/upload-payment-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, invoiceId, imageBase64: base64, imageType: file.type }),
      });

      if (res.ok) {
        setUploadDone(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setUploadError((data as { error?: string }).error ?? 'Upload failed.');
      }
    } catch {
      setUploadError('Upload failed. Please email orders@vintagepeptides.com.');
    } finally {
      setUploading(false);
    }
  };

  if (uploadDone) {
    return (
      <div className="p-3 border border-green-700/30 bg-green-700/5 flex items-center gap-2 mt-3">
        <i className="ri-check-line text-green-700" />
        <span className="font-mono text-xs text-green-800">Payment proof uploaded — we'll verify your transaction shortly.</span>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="font-display text-[10px] tracking-[0.2em] uppercase text-saddle">
        Upload Payment Screenshot (optional)
      </p>
      <div className="flex items-center gap-2">
        <label className="flex-1 flex items-center gap-2 px-3 py-2 border border-brass/30 bg-parchment cursor-pointer hover:border-brass/50 transition-colors">
          <i className="ri-upload-2-line text-brass" />
          <span className="font-mono text-xs text-saddle truncate">
            {file ? file.name : 'Choose screenshot…'}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
        {file && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 bg-brass hover:bg-brass-light text-espresso font-display text-[10px] tracking-wider uppercase border border-brass transition-colors disabled:opacity-60"
          >
            {uploading ? (
              <span className="w-3 h-3 border border-espresso border-t-transparent rounded-full animate-spin inline-block" />
            ) : 'Upload'}
          </button>
        )}
      </div>
      {uploadError && <p className="font-mono text-[10px] text-red-700">{uploadError}</p>}
    </div>
  );
}

// ─── Payment FAQ / Guidance ───────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'Why no credit cards?',
    a: 'Research peptide companies are considered high-risk by card networks. We use P2P apps and crypto to ensure reliable, uninterrupted service.',
  },
  {
    q: 'How does the memo code work?',
    a: 'When you pay, enter your 6-character memo code in the Notes / Memo field — nothing else. Our system auto-matches your payment by code. Extra text causes delays.',
  },
  {
    q: 'When will my order ship?',
    a: 'Once payment is confirmed (usually within a few hours), orders ship within 1–2 business days. You\'ll receive tracking via email.',
  },
  {
    q: 'What if I have a payment issue?',
    a: 'Email orders@vintagepeptides.com with your Order # and memo code. We respond within one business day.',
  },
  {
    q: 'Is my information safe?',
    a: 'All data is encrypted in transit and at rest. We never sell or share personal information. Orders are stored in an immutable audit log.',
  },
];

function PaymentFAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="border border-brass/20 bg-cream/40">
      <button
        type="button"
        onClick={() => setOpen(open === -1 ? null : -1)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <span className="font-display text-sm tracking-[0.2em] uppercase text-espresso flex items-center gap-3">
          <i className="ri-question-line text-brass" />
          How does payment work?
        </span>
        <i className={`ri-arrow-${open === -1 ? 'up' : 'down'}-s-line text-brass text-lg transition-transform`} />
      </button>
      {open === -1 && (
        <div className="px-6 pb-4 space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border border-brass/10">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="font-display text-xs tracking-wider uppercase text-espresso">{item.q}</span>
                <i className={`ri-arrow-${open === i ? 'up' : 'down'}-s-line text-brass text-sm flex-shrink-0 ml-2`} />
              </button>
              {open === i && (
                <div className="px-4 pb-3">
                  <p className="font-body text-sm text-saddle leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();

  const [selectedPayment, setSelectedPayment] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<typeof VALID_COUPONS[string] | null>(null);
  const [couponError, setCouponError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    institution: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    notes: '',
  });
  const [tosAccepted, setTosAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<AuditLogEntry | null>(null);
  const [orderExpired, setOrderExpired] = useState(false);
  const [btcAddress, setBtcAddress] = useState<string | null>(null);
  const [btcAmountSats, setBtcAmountSats] = useState<number | null>(null);
  const [btcPriceUsd, setBtcPriceUsd] = useState<number | null>(null);
  const [cryptoNetwork, setCryptoNetwork] = useState<'eth' | 'sol'>('eth');
  const [cryptoAddress, setCryptoAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const wcOrderIdRef = useRef<number | null>(null);

  // ── Computed totals ──────────────────────────────────────────────────────────

  const shipping = totalPrice >= 200 ? 0 : 15;
  const isBtc = selectedPayment === 'btc';
  const isCrypto = selectedPayment === 'usdc' || selectedPayment === 'usdt';
  const btcDiscount = isBtc ? parseFloat(((totalPrice * 5) / 100).toFixed(2)) : 0;
  let couponDiscount = 0;
  if (appliedCoupon) {
    couponDiscount =
      appliedCoupon.type === 'percent'
        ? parseFloat(((totalPrice * appliedCoupon.value) / 100).toFixed(2))
        : appliedCoupon.value;
  }
  const discount = couponDiscount; // kept for AuditLogEntry compat

  // ── Tax (Idaho physical nexus only) ──────────────────────────────────────────
  // We collect sales tax only for Idaho (physical nexus). All other states are
  // exempt until we reach the $100,000 economic nexus threshold for that state.
  const IDAHO_TAX_RATE = 0.06; // 6% Idaho state sales tax
  const taxableSubtotal = Math.max(0, totalPrice - couponDiscount - btcDiscount);
  const tax = formData.state.trim().toUpperCase() === 'ID'
    ? parseFloat((taxableSubtotal * IDAHO_TAX_RATE).toFixed(2))
    : 0;

  const orderTotal = Math.max(0, taxableSubtotal + shipping + tax);

  // ── Coupon ───────────────────────────────────────────────────────────────────

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const coupon = VALID_COUPONS[code];
    if (coupon) {
      setAppliedCoupon(coupon);
      setCouponError('');
    } else {
      setCouponError('Invalid or expired coupon code.');
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || submitting) return;

    setSubmitting(true);
    setSubmitError('');

    const memo = generateMemo();
    const invoiceId = generateInvoiceId(memo);
    const expiresAt = getExpiryTimestamp();
    const method = PAYMENT_METHODS.find((p) => p.id === selectedPayment)!;

    // Assign next worker in rotation for P2P payments (Cash App / Venmo / Zelle).
    // BTC and crypto stablecoins use fixed addresses — no worker rotation needed.
    const isP2P = ['cashapp', 'venmo', 'zelle'].includes(selectedPayment);
    const assignment = isP2P
      ? await assignWorker(selectedPayment as 'zelle' | 'cashapp' | 'venmo')
      : null;
    const resolvedCryptoAddress = isCrypto
      ? (CRYPTO_ADDRESSES[selectedPayment]?.[cryptoNetwork] ?? null)
      : null;
    if (resolvedCryptoAddress) setCryptoAddress(resolvedCryptoAddress);
    const resolvedHandle = resolvedCryptoAddress ?? assignment?.handle ?? method.handle;
    const assignedWorker  = assignment ? { id: assignment.workerId, name: assignment.workerName } : null;

    // For BTC — generate unique HD-wallet address for this order
    let resolvedBtcAddress: string | null = null;
    if (selectedPayment === 'btc') {
      try {
        const { address } = await fetchBtcAddress(invoiceId);
        resolvedBtcAddress = address;
        setBtcAddress(address);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setSubmitError(`BTC address error: ${msg}`);
        setSubmitting(false);
        return;
      }
      // Fetch current BTC price for the amount display
      const price = await fetchBtcPriceUsd();
      setBtcPriceUsd(price);
      if (price) {
        const sats = Math.round((orderTotal / price) * 1e8);
        setBtcAmountSats(sats);
      }
    }

    // Split full name
    const nameParts = formData.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '-';

    const address = {
      first_name: firstName,
      last_name: lastName,
      address_1: formData.address,
      city: formData.city,
      state: formData.state,
      postcode: formData.zip,
      country: 'US',
      email: formData.email,
      phone: formData.phone,
    };

    const wcPayload: CreateOrderPayload = {
      payment_method: selectedPayment,
      payment_method_title: method.name,
      billing: address,
      shipping: address,
      line_items: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: String(item.price),
        subtotal: String((item.price * item.quantity).toFixed(2)),
        total: String((item.price * item.quantity).toFixed(2)),
        meta_data: [{ key: 'peptide_code', value: item.peptideCode }],
      })),
      ...(appliedCoupon ? { coupon_lines: [{ code: couponInput.trim().toUpperCase() }] } : {}),
      meta_data: [
        { key: 'memo_code', value: memo },
        { key: 'payment_handle', value: resolvedBtcAddress ?? resolvedHandle },
        { key: 'expires_at', value: new Date(expiresAt).toISOString() },
        { key: 'invoice_id', value: invoiceId },
        ...(assignedWorker ? [{ key: 'assigned_worker_id', value: assignedWorker.id }] : []),
        ...(resolvedBtcAddress ? [{ key: 'btc_address', value: resolvedBtcAddress }] : []),
        ...(btcAmountSats ? [{ key: 'btc_amount_sats', value: String(btcAmountSats) }] : []),
        ...(resolvedCryptoAddress ? [
          { key: 'crypto_token', value: selectedPayment.toUpperCase() },
          { key: 'crypto_network', value: cryptoNetwork },
          { key: 'crypto_address', value: resolvedCryptoAddress },
        ] : []),
        ...(formData.institution ? [{ key: 'institution', value: formData.institution }] : []),
        ...(formData.notes ? [{ key: 'order_notes', value: formData.notes }] : []),
        // Subscribe & Save — present when any cart item has a subscribeInterval
        ...(() => {
          const subItem = items.find((i) => i.subscribeInterval);
          if (!subItem) return [];
          return [
            { key: 'subscription_interval', value: String(subItem.subscribeInterval) },
            { key: 'subscription_discount_pct', value: String(subItem.subscriptionDiscountPct ?? 0) },
          ];
        })(),
      ],
      // on-hold triggers WooCommerce's "Customer On Hold Order" email automatically
      // (pending does not send any customer email)
      status: 'on-hold',
    };

    try {
      const wcOrder = await createWcOrder(wcPayload);
      wcOrderIdRef.current = wcOrder.id;

      // Persist worker assignment so admin dashboard can look it up
      if (assignment) {
        saveAssignment(invoiceId, assignment.workerId, assignment.source);
      }

      const auditEntry: AuditLogEntry = {
        invoiceId,
        timestamp: new Date().toISOString(),
        expiresAt,
        memoCode: memo,
        paymentMethod: selectedPayment,
        paymentHandle: resolvedHandle,
        assignedWorkerId: assignment?.workerId,
        customerName: formData.fullName,
        customerEmail: formData.email,
        shippingAddress: `${formData.address}, ${formData.city} ${formData.state} ${formData.zip}`,
        items: items.map((i) => ({
          name: i.name,
          peptideCode: i.peptideCode,
          quantity: i.quantity,
          unitPrice: i.price,
          lineTotal: i.price * i.quantity,
        })),
        subtotal: totalPrice,
        shipping,
        tax,
        total: orderTotal,
        ...(appliedCoupon ? { couponCode: couponInput.trim().toUpperCase(), couponDiscount: discount } : {}),
        wcOrderId: wcOrder.id,
        status: 'pending',
      };

      saveAuditEntry(auditEntry);
      clearCart();
      setConfirmedOrder(auditEntry);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOrderExpired = () => {
    setOrderExpired(true);
    if (confirmedOrder) {
      updateAuditEntry(confirmedOrder.invoiceId, { status: 'expired' });
      if (confirmedOrder.wcOrderId) {
        cancelWcOrder(confirmedOrder.wcOrderId);
      }
    }
  };

  const handleChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // ── Empty cart ───────────────────────────────────────────────────────────────

  if (items.length === 0 && !confirmedOrder) {
    return (
      <PageLayout>
        <div className="py-24 text-center parchment-grain">
          <div className="relative z-10 max-w-xl mx-auto px-4">
            <span className="w-12 h-12 flex items-center justify-center text-brass/40 mx-auto mb-4">
              <i className="ri-shopping-bag-line text-2xl" />
            </span>
            <h1 className="font-display text-xl tracking-[0.2em] uppercase text-espresso mb-3">
              Your Cart is Empty
            </h1>
            <p className="font-body text-sm italic text-saddle mb-6">
              Add some research compounds to your cart before proceeding to checkout.
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="bg-brass hover:bg-brass-light text-espresso font-display text-xs tracking-[0.2em] uppercase py-3 px-8 border border-brass transition-all duration-300"
            >
              Browse Products
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // ── Order confirmed view ─────────────────────────────────────────────────────

  if (confirmedOrder) {
    const method = PAYMENT_METHODS.find((p) => p.id === confirmedOrder.paymentMethod)!;
    return (
      <PageLayout>
        <div className="py-12 parchment-grain">
          <div className="relative z-10 max-w-2xl mx-auto px-4">
            {orderExpired ? (
              <div className="text-center p-8 border border-red-900/30 bg-red-900/5">
                <i className="ri-time-line text-red-700 text-3xl mb-3 block" />
                <h2 className="font-display text-lg tracking-[0.15em] uppercase text-red-800 mb-2">
                  Order Expired
                </h2>
                <p className="font-body text-sm text-saddle leading-relaxed mb-4">
                  Payment was not received within 2 hours. Your order has been automatically cancelled and inventory released.
                </p>
                <button onClick={() => navigate('/shop')}
                  className="bg-brass text-espresso font-display text-xs tracking-[0.2em] uppercase py-3 px-8 border border-brass transition-all duration-300">
                  Shop Again
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  <span className="w-16 h-16 flex items-center justify-center text-brass mx-auto mb-4 border border-brass rounded-full">
                    <i className="ri-check-line text-xl" />
                  </span>
                  <h1 className="font-display text-2xl tracking-[0.15em] uppercase text-espresso mb-2">
                    Order Confirmed
                  </h1>
                  <p className="font-mono text-xs text-saddle">{confirmedOrder.invoiceId}</p>
                </div>

                {/* Memo + Expiry */}
                <div className="p-6 border border-brass/40 bg-brass/5 mb-6 text-center">
                  <p className="font-display text-[10px] tracking-[0.3em] uppercase text-saddle mb-2">
                    Your Payment Memo Code
                  </p>
                  <div className="font-mono text-4xl tracking-[0.5em] text-brass font-bold mb-4">
                    {confirmedOrder.memoCode}
                  </div>
                  <p className="font-body text-xs italic text-saddle/70 mb-4">
                    Include this code in your payment note or reference field.
                  </p>
                  <div className="brass-rule mb-4" />
                  <p className="font-display text-[9px] tracking-[0.2em] uppercase text-saddle mb-1">
                    Payment window closes in
                  </p>
                  <Countdown expiresAt={confirmedOrder.expiresAt} onExpired={handleOrderExpired} />
                  <p className="font-mono text-[10px] text-saddle/50 mt-1">
                    Unpaid orders auto-cancel after 2 hours
                  </p>
                </div>

                {/* Payment instructions */}
                <div className="p-5 border border-brass/20 bg-cream/40 mb-5">
                  <h3 className="font-display text-xs tracking-[0.2em] uppercase text-espresso mb-3 flex items-center gap-2">
                    <i className={`${method.icon} text-brass`} />
                    {method.name} — Payment Instructions
                  </h3>

                  {(confirmedOrder.paymentMethod === 'usdc' || confirmedOrder.paymentMethod === 'usdt') ? (
                    <>
                      <p className="font-body text-xs text-saddle/70 mb-3 leading-relaxed">
                        Send exactly{' '}
                        <strong>${confirmedOrder.total.toFixed(2)} {confirmedOrder.paymentMethod.toUpperCase()}</strong>{' '}
                        to the address below on <strong>{cryptoNetwork === 'eth' ? 'Ethereum (ERC-20)' : 'Solana (SPL)'}</strong>.
                        Your order will be marked Paid once we verify the transaction.
                      </p>
                      <div className="p-3 bg-espresso/5 border border-brass/20 mb-3 break-all">
                        <p className="font-mono text-[10px] text-saddle/50 mb-1 uppercase tracking-wider">
                          {confirmedOrder.paymentMethod.toUpperCase()} Address — {cryptoNetwork === 'eth' ? 'Ethereum' : 'Solana'}
                        </p>
                        <p className="font-mono text-xs text-espresso font-bold">
                          {cryptoAddress ?? confirmedOrder.paymentHandle}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-brass/5 border border-brass/20 mb-3">
                        <span className="font-mono text-xs text-saddle">Send exactly:</span>
                        <span className="font-mono text-lg text-brass font-bold">
                          ${confirmedOrder.total.toFixed(2)} {confirmedOrder.paymentMethod.toUpperCase()}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const addr = cryptoAddress ?? confirmedOrder.paymentHandle;
                          navigator.clipboard.writeText(addr).then(() => {
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          });
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 border border-brass/30 hover:bg-brass/10 transition-colors mb-3"
                      >
                        <i className={copied ? 'ri-check-line text-green-700' : 'ri-file-copy-line text-brass'} />
                        <span className="font-mono text-[10px] tracking-wider uppercase text-espresso">
                          {copied ? 'Copied!' : `Copy ${confirmedOrder.paymentMethod.toUpperCase()} Address`}
                        </span>
                      </button>
                      {/* Prominent confirmation alert */}
                      <div className="p-4 border-2 border-brass bg-brass/10 flex items-start gap-3">
                        <i className="ri-mail-send-line text-brass text-xl flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-display text-xs tracking-[0.15em] uppercase text-espresso mb-1">
                            Required: Email Your Transaction Hash
                          </p>
                          <p className="font-mono text-xs text-saddle leading-relaxed">
                            After sending, email your <strong>transaction hash (TXID)</strong> to{' '}
                            <strong className="text-brass">orders@vintagepeptides.com</strong>{' '}
                            with subject <strong>Order #{confirmedOrder.wcOrderId}</strong>.
                            Without this your order cannot be verified.
                          </p>
                        </div>
                      </div>
                      {/* Screenshot upload */}
                      {confirmedOrder.wcOrderId && (
                        <PaymentProofUpload
                          orderId={confirmedOrder.wcOrderId}
                          invoiceId={confirmedOrder.invoiceId}
                        />
                      )}
                    </>
                  ) : confirmedOrder.paymentMethod === 'btc' ? (
                    <>
                      <p className="font-body text-xs text-saddle/70 mb-3 leading-relaxed">
                        Send Bitcoin to the address below. The exact amount in BTC is calculated at current market rate. Your order is automatically marked <strong>Paid</strong> once the network confirms.
                      </p>
                      <div className="p-3 bg-espresso/5 border border-brass/20 mb-3 break-all">
                        <p className="font-mono text-[10px] text-saddle/50 mb-1 uppercase tracking-wider">BTC Address</p>
                        <p className="font-mono text-xs text-espresso font-bold">{btcAddress ?? confirmedOrder.paymentHandle}</p>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-brass/5 border border-brass/20">
                        <span className="font-mono text-xs text-saddle">Send exactly:</span>
                        <span className="font-mono text-lg text-brass font-bold">
                          ${confirmedOrder.total.toFixed(2)}
                        </span>
                        {btcAmountSats && (
                          <span className="ml-auto font-mono text-xs text-saddle/70">
                            ≈ {(btcAmountSats / 1e8).toFixed(6)} BTC
                          </span>
                        )}
                      </div>
                      {/* Copy address button */}
                      <button
                        onClick={() => {
                          const addr = btcAddress ?? confirmedOrder.paymentHandle;
                          navigator.clipboard.writeText(addr).then(() => {
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          });
                        }}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2 border border-brass/30 hover:bg-brass/10 transition-colors"
                      >
                        <i className={copied ? 'ri-check-line text-green-700' : 'ri-file-copy-line text-brass'} />
                        <span className="font-mono text-[10px] tracking-wider uppercase text-espresso">
                          {copied ? 'Copied!' : 'Copy BTC Address'}
                        </span>
                      </button>
                      {btcPriceUsd && (
                        <p className="font-mono text-[10px] text-saddle/40 mt-2 text-center">
                          BTC rate: ${btcPriceUsd.toLocaleString()}/BTC at time of order
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="font-body text-sm text-saddle leading-relaxed mb-3">
                        Send payment to:{' '}
                        <span className="font-mono text-brass font-bold">
                          {confirmedOrder.paymentHandle}
                        </span>
                      </p>

                      {/* Memo code instruction */}
                      <div className="p-3 border border-brass/40 bg-brass/5 mb-3">
                        <p className="font-display text-[9px] tracking-[0.25em] uppercase text-saddle mb-1">
                          Memo / Notes Field — Enter This Code Only
                        </p>
                        <p className="font-mono text-2xl tracking-[0.5em] text-brass font-bold">
                          {confirmedOrder.memoCode}
                        </p>
                        <p className="font-mono text-[10px] text-saddle/60 mt-1.5">
                          Enter only this code in the notes or memo field — nothing else. Our system auto-verifies your payment by code. Any extra text may delay matching.
                        </p>
                      </div>

                      <p className="font-mono text-[10px] text-saddle/50 mb-3">
                        Payments process under our parent entity <strong>Vintage Vitality</strong>.
                      </p>
                      <div className="flex items-center gap-3 p-3 bg-brass/5 border border-brass/20 mb-4">
                        <span className="font-mono text-xs text-saddle">Send exactly:</span>
                        <span className="font-mono text-lg text-brass font-bold">
                          ${confirmedOrder.total.toFixed(2)}
                        </span>
                      </div>
                      {/* Prominent confirmation alert */}
                      <div className="p-4 border-2 border-brass bg-brass/10 flex items-start gap-3">
                        <i className="ri-screenshot-line text-brass text-xl flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-display text-xs tracking-[0.15em] uppercase text-espresso mb-1">
                            Required: Send Payment Screenshot
                          </p>
                          <p className="font-mono text-xs text-saddle leading-relaxed">
                            After paying, email a screenshot of your payment confirmation to{' '}
                            <strong className="text-brass">orders@vintagepeptides.com</strong>{' '}
                            with subject <strong>Order #{confirmedOrder.wcOrderId}</strong> and your memo code{' '}
                            <strong>{confirmedOrder.memoCode}</strong>.
                            Without this your order cannot be confirmed.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Order summary */}
                <div className="p-5 border border-brass/20 bg-cream/40 mb-5">
                  <h3 className="font-display text-xs tracking-[0.2em] uppercase text-espresso mb-4">
                    Order Summary
                  </h3>
                  <div className="space-y-2 mb-4">
                    {confirmedOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="font-body text-xs text-saddle">
                          {item.name} <span className="text-saddle/50">×{item.quantity}</span>
                        </span>
                        <span className="font-mono text-xs text-espresso">
                          ${item.lineTotal.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="brass-rule mb-3" />
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-body text-saddle">
                      <span>Subtotal</span>
                      <span className="font-mono">${confirmedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    {confirmedOrder.couponDiscount ? (
                      <div className="flex justify-between text-xs font-body text-green-700">
                        <span>Coupon ({confirmedOrder.couponCode})</span>
                        <span className="font-mono">−${confirmedOrder.couponDiscount.toFixed(2)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-xs font-body text-saddle">
                      <span>Shipping</span>
                      <span className="font-mono">
                        {confirmedOrder.shipping === 0 ? 'Free' : `$${confirmedOrder.shipping.toFixed(2)}`}
                      </span>
                    </div>
                    {confirmedOrder.tax > 0 && (
                      <div className="flex justify-between text-xs font-body text-saddle">
                        <span>Tax (Idaho 6%)</span>
                        <span className="font-mono">${confirmedOrder.tax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-display tracking-wider uppercase text-espresso pt-1 border-t border-brass/20 mt-1">
                      <span>Total</span>
                      <span className="font-mono text-brass font-bold">${confirmedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <p className="font-mono text-[10px] text-saddle/50 text-center leading-relaxed mb-6">
                  A confirmation will be sent to {confirmedOrder.customerEmail} once payment is verified.
                  Order #{confirmedOrder.wcOrderId}
                </p>

                <button onClick={() => navigate('/shop')}
                  className="w-full bg-brass hover:bg-brass-light text-espresso font-display text-xs tracking-[0.2em] uppercase py-3 border border-brass transition-all duration-300">
                  Continue Shopping
                </button>
              </>
            )}
          </div>
        </div>
      </PageLayout>
    );
  }

  // ── Checkout form ────────────────────────────────────────────────────────────

  return (
    <PageLayout>
      <div className="py-8 md:py-12 parchment-grain">
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8 font-body text-xs text-saddle">
            <button onClick={() => navigate('/')} className="hover:text-brass transition-colors">Home</button>
            <span>/</span>
            <span className="text-espresso uppercase tracking-wider">Checkout</span>
          </div>

          <h1 className="font-display text-2xl md:text-3xl tracking-[0.15em] uppercase text-espresso mb-8">
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">

            {/* ── Left: Form ── */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-8">

                {/* Contact */}
                <div className="p-6 border border-brass/20 bg-cream/40">
                  <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso mb-5 flex items-center gap-3">
                    <i className="ri-user-line text-brass" />
                    Contact Information
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      ['fullName', 'Full Name *', 'text', 'Dr. Jane Smith', true],
                      ['email', 'Email Address *', 'email', 'research@institution.edu', true],
                      ['phone', 'Phone Number', 'tel', '(208) 243-9222', false],
                      ['institution', 'Institution / Lab', 'text', 'Boston Research Institute', false],
                    ].map(([field, label, type, placeholder, required]) => (
                      <div key={field as string}>
                        <label className="font-display text-xs tracking-[0.15em] uppercase text-saddle mb-1.5 block">
                          {label as string}
                        </label>
                        <input
                          type={type as string}
                          required={required as boolean}
                          value={formData[field as keyof typeof formData]}
                          onChange={(e) => handleChange(field as string, e.target.value)}
                          placeholder={placeholder as string}
                          className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-2.5 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/40"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping */}
                <div className="p-6 border border-brass/20 bg-cream/40">
                  <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso mb-5 flex items-center gap-3">
                    <i className="ri-truck-line text-brass" />
                    Shipping Address
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="font-display text-xs tracking-[0.15em] uppercase text-saddle mb-1.5 block">
                        Street Address *
                      </label>
                      <input type="text" required value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="247 Research Way, Suite 400"
                        className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-2.5 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/40"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="font-display text-xs tracking-[0.15em] uppercase text-saddle mb-1.5 block">City *</label>
                        <input type="text" required value={formData.city}
                          onChange={(e) => handleChange('city', e.target.value)}
                          placeholder="Boston"
                          className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-2.5 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/40"
                        />
                      </div>
                      <div>
                        <label className="font-display text-xs tracking-[0.15em] uppercase text-saddle mb-1.5 block">State *</label>
                        <StateAutocomplete value={formData.state} onChange={(v) => handleChange('state', v)} />
                      </div>
                      <div>
                        <label className="font-display text-xs tracking-[0.15em] uppercase text-saddle mb-1.5 block">ZIP Code *</label>
                        <input type="text" required value={formData.zip}
                          onChange={(e) => handleChange('zip', e.target.value)}
                          placeholder="02118"
                          className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-2.5 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/40"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="p-6 border border-brass/20 bg-cream/40">
                  <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso mb-5 flex items-center gap-3">
                    <i className="ri-secure-payment-line text-brass" />
                    Payment Method
                  </h2>
                  <div className="space-y-3">
                    {PAYMENT_METHODS.map((method) => (
                      <button key={method.id} type="button"
                        disabled={method.disabled}
                        onClick={() => !method.disabled && setSelectedPayment(method.id)}
                        className={`w-full flex items-center gap-4 p-4 border transition-all duration-300 text-left ${
                          method.disabled
                            ? 'border-brass/10 bg-cream/10 opacity-40 cursor-not-allowed'
                            : selectedPayment === method.id
                              ? 'border-brass bg-cream/80'
                              : 'border-brass/20 bg-cream/30 hover:border-brass/40'
                        }`}>
                        <span className={`w-10 h-10 flex items-center justify-center text-lg ${selectedPayment === method.id ? 'text-brass' : 'text-saddle/40'}`}>
                          <i className={method.icon} />
                        </span>
                        <div className="flex-1">
                          <p className="font-display text-xs tracking-wider uppercase text-espresso">
                            {method.name}
                            {method.disabled && (
                              <span className="ml-2 font-mono text-[9px] normal-case tracking-normal text-saddle/50">(coming soon)</span>
                            )}
                          </p>
                          <p className="font-body text-xs text-saddle/70 mt-0.5">{method.instruction}</p>
                        </div>
                        <span className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${selectedPayment === method.id ? 'border-brass bg-brass' : 'border-brass/30'}`}>
                          {selectedPayment === method.id && <i className="ri-check-line text-[10px] text-espresso" />}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* P2P — memo code + entity disclosure */}
                  {(selectedPayment === 'cashapp' || selectedPayment === 'venmo' || selectedPayment === 'zelle') && (
                    <div className="mt-3 p-3 border border-brass/20 bg-cream/60 space-y-2">
                      <p className="font-mono text-[10px] text-saddle/80 leading-relaxed">
                        <i className="ri-information-line text-brass mr-1" />
                        Payments process under our parent entity, <strong>Vintage Vitality</strong>. You may see "Vintage Vitality" on your transaction record — this is expected.
                      </p>
                      <p className="font-mono text-[10px] text-saddle/80 leading-relaxed">
                        <i className="ri-error-warning-line text-brass mr-1" />
                        <strong>Enter only your memo code in the notes / memo field</strong> — nothing else. Our system auto-verifies payments by code. Any additional text may cause a matching delay.
                      </p>
                    </div>
                  )}

                  {/* USDC / USDT — network selector */}
                  {isCrypto && (
                    <div className="mt-3 p-3 border border-brass/20 bg-cream/60 space-y-3">
                      <p className="font-mono text-[10px] text-saddle/80 leading-relaxed">
                        <i className="ri-coins-line text-brass mr-1" />
                        Send {selectedPayment.toUpperCase()} directly from your wallet. Select your preferred network:
                      </p>
                      <div className="flex gap-2">
                        {(['eth', 'sol'] as const).map((net) => (
                          <button key={net} type="button"
                            onClick={() => setCryptoNetwork(net)}
                            className={`flex-1 py-2 font-mono text-[10px] tracking-wider uppercase border transition-colors ${
                              cryptoNetwork === net
                                ? 'border-brass bg-brass/10 text-brass'
                                : 'border-brass/30 text-saddle/60 hover:border-brass/50'
                            }`}>
                            {net === 'eth' ? 'Ethereum (ERC-20)' : 'Solana (SPL)'}
                          </button>
                        ))}
                      </div>
                      <div className="p-2 bg-espresso/5 border border-brass/20 break-all">
                        <p className="font-mono text-[9px] text-saddle/50 mb-1 uppercase tracking-wider">
                          {selectedPayment.toUpperCase()} Wallet — {cryptoNetwork === 'eth' ? 'Ethereum' : 'Solana'}
                        </p>
                        <p className="font-mono text-[10px] text-espresso font-bold">
                          {CRYPTO_ADDRESSES[selectedPayment]?.[cryptoNetwork]}
                        </p>
                      </div>
                      <p className="font-mono text-[10px] text-saddle/60 leading-relaxed">
                        After sending, email your transaction hash to <strong>orders@vintagepeptides.com</strong> for fast verification.
                      </p>
                    </div>
                  )}

                  {/* BTC — info panel */}
                  {selectedPayment === 'btc' && (
                    <div className="mt-3 p-3 border border-brass/20 bg-cream/60 space-y-2">
                      <p className="font-mono text-[10px] text-saddle/80 leading-relaxed">
                        <i className="ri-bit-coin-line text-brass mr-1" />
                        A unique Bitcoin address is generated for your order. Send the exact BTC amount shown on the confirmation screen. Your order is automatically marked <strong>Paid</strong> once the blockchain confirms.
                      </p>
                      <p className="font-mono text-[10px] text-green-700 font-bold">
                        ✓ 5% discount automatically applied at checkout
                      </p>
                    </div>
                  )}

                  {!selectedPayment && (
                    <p className="font-body text-xs text-red-900/70 mt-3">
                      Please select a payment method to continue.
                    </p>
                  )}
                </div>

                {/* Payment Guidance FAQ */}
                <PaymentFAQ />

                {/* Order Notes */}
                <div className="p-6 border border-brass/20 bg-cream/40">
                  <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso mb-5 flex items-center gap-3">
                    <i className="ri-file-text-line text-brass" />
                    Order Notes
                  </h2>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={3} maxLength={500}
                    className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-2.5 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/40 resize-none"
                    placeholder="Any special instructions for your order..."
                  />
                  <p className="font-mono text-[10px] text-saddle/50 mt-1.5 text-right">{formData.notes.length}/500</p>
                </div>

                {/* Terms of Service */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 accent-brass cursor-pointer flex-shrink-0"
                    checked={tosAccepted}
                    onChange={(e) => setTosAccepted(e.target.checked)}
                  />
                  <span className="font-body text-xs text-saddle leading-relaxed">
                    I have read and agree to the{' '}
                    <Link to="/terms-of-service" className="text-brass underline underline-offset-2 hover:text-brass-light">
                      Terms of Service
                    </Link>
                    {' '}and confirm that all products will be used for lawful{' '}
                    <strong className="text-espresso">laboratory research purposes only</strong>.
                    I am a qualified researcher aged 21 or older.
                  </span>
                </label>

                {/* Submit */}
                {submitError && (
                  <div className="p-4 border border-red-900/30 bg-red-900/5">
                    <p className="font-mono text-xs text-red-700">{submitError}</p>
                  </div>
                )}

                <button type="submit" disabled={!selectedPayment || !tosAccepted || submitting}
                  className={`w-full font-display text-xs tracking-[0.2em] uppercase py-4 border transition-all duration-300 whitespace-nowrap ${
                    selectedPayment && tosAccepted && !submitting
                      ? 'bg-brass hover:bg-brass-light text-espresso border-brass hover:shadow-[0_0_20px_rgba(184,148,42,0.3)]'
                      : 'bg-saddle/10 text-saddle/40 border-saddle/20 cursor-not-allowed'
                  }`}>
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3 h-3 border border-saddle/40 border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : 'Place Order'}
                </button>

                {/* Disclaimer */}
                <div className="p-4 border border-dashed border-red-900/20 bg-red-900/[0.02]">
                  <div className="flex items-start gap-3">
                    <i className="ri-error-warning-line text-red-900/50 mt-0.5" />
                    <div>
                      <p className="font-display text-[10px] tracking-[0.15em] uppercase text-red-900/80 mb-1">
                        For Research Use Only
                      </p>
                      <p className="font-mono text-[10px] leading-relaxed text-saddle/60">
                        By placing this order you confirm you are a qualified researcher aged 21+. All products are for laboratory research use only and not intended for human consumption, injection, or therapeutic use.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* ── Right: Order Summary ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-4">

                {/* Items */}
                <div className="border border-brass/20 bg-cream/40 p-6">
                  <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso mb-5">
                    Order Summary
                  </h2>
                  <div className="space-y-4 mb-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-brass/10 flex items-center justify-center flex-shrink-0">
                          <span className="font-mono text-[10px] text-brass">{item.quantity}×</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-xs tracking-wider uppercase text-espresso truncate">{item.name}</p>
                          <p className="font-body text-[10px] italic text-saddle/70 truncate">{item.peptideCode}</p>
                          <p className="font-mono text-[10px] text-leather">{item.dosage}</p>
                        </div>
                        <span className="font-mono text-xs text-brass font-bold flex-shrink-0">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="brass-rule mb-5" />

                  {/* Coupon */}
                  <div className="mb-5">
                    <label className="font-display text-xs tracking-[0.15em] uppercase text-saddle mb-2 block">
                      Coupon Code
                    </label>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-2.5 border border-brass/30 bg-brass/5">
                        <span className="font-mono text-xs text-brass font-bold">{couponInput.toUpperCase()}</span>
                        <span className="font-body text-xs text-green-700">{appliedCoupon.label}</span>
                        <button type="button" onClick={() => { setAppliedCoupon(null); setCouponInput(''); }}
                          className="text-saddle/50 hover:text-red-700 transition-colors">
                          <i className="ri-close-line text-sm" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input type="text" value={couponInput}
                          onChange={(e) => { setCouponInput(e.target.value); setCouponError(''); }}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCoupon())}
                          placeholder="ENTER CODE"
                          className="flex-1 bg-parchment border border-brass/40 font-mono text-xs text-espresso py-2 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/30 uppercase"
                        />
                        <button type="button" onClick={applyCoupon}
                          className="px-4 py-2 bg-brass/10 border border-brass/30 text-brass font-display text-[10px] tracking-wider uppercase hover:bg-brass/20 transition-colors">
                          Apply
                        </button>
                      </div>
                    )}
                    {couponError && <p className="font-mono text-[10px] text-red-700 mt-1">{couponError}</p>}
                  </div>

                  {/* Totals */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="font-body text-xs text-saddle">Subtotal</span>
                      <span className="font-mono text-sm text-espresso">${totalPrice.toFixed(2)}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between items-center">
                        <span className="font-body text-xs text-green-700">Coupon ({couponInput.toUpperCase()})</span>
                        <span className="font-mono text-sm text-green-700">−${couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {isBtc && btcDiscount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="font-body text-xs text-green-700">BTC Discount (5%)</span>
                        <span className="font-mono text-sm text-green-700">−${btcDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="font-body text-xs text-saddle">Shipping</span>
                      <span className="font-mono text-sm text-espresso">
                        {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-body text-xs text-saddle">Tax</span>
                      <span className="font-mono text-sm text-espresso">
                        {tax > 0 ? `$${tax.toFixed(2)}` : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="brass-rule my-5" />

                  <div className="flex justify-between items-center">
                    <span className="font-display text-xs tracking-wider uppercase text-espresso">Total</span>
                    <span className="font-mono text-xl text-brass font-bold">${orderTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Trust notes */}
                <div className="border border-brass/20 bg-cream/40 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <i className="ri-truck-line text-brass text-xs mt-0.5" />
                    <div>
                      <p className="font-display text-[10px] tracking-[0.15em] uppercase text-espresso">Free Shipping</p>
                      <p className="font-mono text-[10px] text-saddle/70 mt-0.5">On orders over $200</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <i className="ri-time-line text-brass text-xs mt-0.5" />
                    <div>
                      <p className="font-display text-[10px] tracking-[0.15em] uppercase text-espresso">2-Hour Payment Window</p>
                      <p className="font-mono text-[10px] text-saddle/70 mt-0.5">Orders auto-cancel if unpaid</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <i className="ri-shield-check-line text-brass text-xs mt-0.5" />
                    <div>
                      <p className="font-display text-[10px] tracking-[0.15em] uppercase text-espresso">Immutable Audit Log</p>
                      <p className="font-mono text-[10px] text-saddle/70 mt-0.5">Every order permanently recorded</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
