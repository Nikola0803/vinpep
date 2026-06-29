# Crypto Addresses & Payment Handle System
> Reference for all live addresses, how BTC address generation works,
> how P2P handle rotation works, and what needs to be configured where.

---

## 1. Stablecoin Addresses (Hardcoded in Frontend)

These are static — same address is shown to every customer.
Location: `src/pages/checkout/page.tsx` → `CRYPTO_ADDRESSES`

| Asset | Network | Address |
|---|---|---|
| USDC | Ethereum (ERC-20) | `0xf751e21093e7aD4Da07039A6Cd1581132C5f03A1` |
| USDC | Solana (SPL) | `H3GvD8jnDMCWmQb5njWXfEG4rWWUnXHswcUfFo3oGEdM` |
| USDT | Ethereum (ERC-20) | `0xf751e21093e7aD4Da07039A6Cd1581132C5f03A1` |
| USDT | Solana (SPL) | `H3GvD8jnDMCWmQb5njWXfEG4rWWUnXHswcUfFo3oGEdM` |

> **Note:** USDC and USDT currently share the same ETH and SOL addresses.
> If these are separate wallets, update `CRYPTO_ADDRESSES` in `checkout/page.tsx`.
> These should also be set in WP Admin → Settings → VP Payments
> (`vpss_usdc_address`, `vpss_usdt_address`) for the P2P email confirmation.

---

## 2. P2P Handles (CashApp / Venmo / Zelle)

### Static fallback (in source code)
Location: `src/config/workers.ts`

| Method | Handle | Worker ID |
|---|---|---|
| Cash App | `$VVGOps` | `vvg-ops` |
| Venmo | `@VVGOps` | `vvg-ops` |
| Zelle | *(pending — U.S. Bank restriction)* | `vvg-ops` |

These are the **fallback** handles used when the WordPress API is unreachable.

### Also hardcoded in checkout page
Location: `src/pages/checkout/page.tsx` → `PAYMENT_METHODS` array

| Method | Handle | Instruction shown to customer |
|---|---|---|
| Cash App | `$VVGOps` | Send to `$VVGOps` — enter only your memo code in the notes field |
| Venmo | `@VVGOps` | Send to `@VVGOps` — enter only your memo code in the notes field |
| Zelle | `VintageVitality` | Send to `VintageVitality` via Zelle — enter only your memo code |

> **Note:** Zelle handle in the checkout page (`VintageVitality`) differs from the workers.ts
> entry (blank/pending). One of these needs updating once the Zelle account is active.

### Live source of truth (WordPress)
WP Admin → Settings → VP Payments stores:

| WP Option Key | What it holds |
|---|---|
| `vpss_cashapp_handle` | Live Cash App handle (overrides static) |
| `vpss_venmo_handle` | Live Venmo handle (overrides static) |
| `vpss_usdc_address` | USDC wallet address |
| `vpss_usdt_address` | USDT wallet address |
| `vpss_btc_xpub` | BTC extended public key (xpub/zpub) for HD derivation |
| `vpss_btc_surcharge` | BTC surcharge % (default: 5) |
| `vpss_btc_enabled` | Whether BTC is offered at checkout |

---

## 3. P2P Handle Rotation System

### How it works
When a customer picks CashApp / Venmo / Zelle at checkout, the frontend calls:

```
GET /wp-json/vp-p2p/v1/assign?method=cashapp|venmo|zelle
```

WordPress increments a server-side rotation counter atomically and returns the next
worker's handle. This ensures concurrent orders hit different workers evenly.

**If the WP API is unreachable**, the frontend falls back to the static `WORKERS`
config in `src/config/workers.ts` using a `localStorage` counter (per-device only).

### Rotation flow
```
Checkout page
  └─ assignWorker('cashapp')            [workerRotation.ts]
       ├─ assignFromServer()            → GET /wp-json/vp-p2p/v1/assign?method=cashapp
       │    └─ returns { handle: '$VVGOps', worker_id: 'vvg-ops', ... }
       └─ (fallback) getLocalNextWorker()
            └─ reads WORKERS array, round-robins by localStorage index
```

### Adding a new worker / handle
**Code side** (`src/config/workers.ts`):
```ts
{
  id: 'new-worker',
  name: 'Worker Name',
  handles: {
    cashapp: '$NewHandle',
    venmo:   '@NewHandle',
    zelle:   'phone@email.com',
  },
  active: true,
}
```
**WP side**: The `vp-p2p/v1/assign` endpoint (in the shipstation plugin) reads payment
accounts from WP options. Add the new handles in WP Admin → Settings → VP Payments.

### Temporarily removing a worker
Set `active: false` in `workers.ts`. Their handle won't be assigned to new orders but
their history is preserved. Mirror this on the WP side by removing them from the VP Payments admin.

---

## 4. Bitcoin — HD Address Generation

Bitcoin uses **hierarchical deterministic (HD) derivation** — a fresh `bc1...` address
is generated for every order. No address is ever reused.

### Setup required (one-time, in WP Admin)

1. Generate a **zpub** (native SegWit) or **xpub** from your Bitcoin wallet software
   (Electrum, Sparrow, Ledger Live, etc.)
2. Go to **WP Admin → Settings → VP Payments**
3. Paste the key into **BTC xPub Key** field (`vpss_btc_xpub`)
4. Set **BTC Surcharge %** to `5` (5% premium to cover network fees)
5. Set **BTC Enabled** to `1`

> **NEVER paste a private key or seed phrase.** Only the extended public key (xpub/zpub).
> The private key stays in your wallet — VP only needs the public key to derive receive addresses.

### How address generation works (per order)

```
Customer selects Bitcoin at checkout
  └─ fetchBtcAddress(invoiceId)          [checkout/page.tsx]
       └─ GET /api/btc?invoiceId=VTG-xxx  [Vercel → api/btc.ts → api/btc-address.ts]
            ├─ GET /wp-json/vp-btc/v1/next-index
            │    └─ WP reads vpss_btc_address_index from wp_options
            │    └─ Atomically increments the counter
            │    └─ Returns { index: N, zpub: "zpub..." }
            ├─ Vercel derives address:
            │    HDKey.fromExtendedKey(zpub) → deriveChild(0) → deriveChild(N)
            │    p2wpkh(publicKey).address  →  "bc1q..."
            ├─ Registers the address with BlockCypher for webhook monitoring
            └─ POST /wp-json/vp-btc/v1/record-assignment
                 └─ Saves { invoiceId → address, index } in WP order meta
```

### Derivation path
`m/0/{index}` — external chain, standard for BIP84 native SegWit wallets.

Supported key prefixes: `zpub` (BIP84, native SegWit, produces `bc1q...` addresses),
`ypub` (BIP49, wrapped SegWit), `xpub` (BIP32, standard).

### Payment confirmation (automatic)
BlockCypher sends a webhook to `/api/btc-payment-notify` when the address receives
≥1 confirmation on mainnet. The Vercel function:

1. Looks up the WC order by BTC address (via `/wp-json/vp-btc/v1/order-by-address`)
2. Updates order status to `processing`
3. Saves `btc_tx_hash`, `btc_confirmed_sats`, `btc_confirmed_at` to order meta
4. Adds an admin order note with the TX hash and BTC amount

**Env var required on Vercel:** `BLOCKCYPHER_TOKEN` — free tier allows 3 req/sec.
Without it, address monitoring is skipped and admin must manually verify BTC orders.

---

## 5. What Needs to Be Set in WP Admin (Right Now)

Go to **WP Admin → Settings → VP Payments** and fill in:

| Field | Value |
|---|---|
| Cash App Handle | `$VVGOps` (or updated handle) |
| Venmo Handle | `@VVGOps` (or updated handle) |
| USDC Wallet (ERC-20) | `0xf751e21093e7aD4Da07039A6Cd1581132C5f03A1` |
| USDT Wallet (ERC-20) | `0xf751e21093e7aD4Da07039A6Cd1581132C5f03A1` |
| BTC xPub Key | *(paste from your wallet — zpub preferred)* |
| BTC Surcharge % | `5` |
| BTC Enabled | `1` |

---

## 6. What Needs to Be Set in Vercel Environment Variables

| Var | Purpose |
|---|---|
| `BLOCKCYPHER_TOKEN` | BTC payment monitoring — get free token at blockcypher.com |
| `VITE_LAUNCH_PASSWORD` | Access code gate — set to `vintage2026` |
| `WC_URL` | WP/WC base URL — `http://db.vintagepeptides.com` |
| `WC_USER` | WP username (Application Password auth) |
| `WC_APP_PASSWORD` | WP Application Password |
| `WC_KEY` | WC consumer key (fallback auth) |
| `WC_SECRET` | WC consumer secret (fallback auth) |

---

## 7. Memo Code System (All P2P Methods)

Every order gets a **6-character alphanumeric memo code** (e.g. `A4K9XZ`).

Generated in checkout: `generateMemo()` → stored as WC order meta key `memo_code`.

Customers are told: **"Enter only this code in the notes / memo field — nothing else."**

The shipstation plugin reads `memo_code` from order meta and includes it in the
P2P confirmation email so both sides have a matching reference.

Admin matches incoming payments manually by searching the memo code in WP Admin → Orders.
