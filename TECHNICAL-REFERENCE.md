# Vintage Peptides — Full Stack Technical Reference
> React 19 + WooCommerce Headless Storefront  
> Use this as the blueprint for the second project (same functionality, different design)

---

## 1. ARCHITECTURE

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite + TypeScript → Vercel |
| Backend / CMS | WordPress 6 + WooCommerce 8 → VPS (db.vintagepeptides.com) |
| API Layer | Vercel Serverless Functions (`/api/*.ts`, `@vercel/node` v5, Node 20) |
| Styling | Tailwind CSS v3 + custom design tokens |
| Routing | React Router v7 — SPA with `vercel.json` rewrites |
| Auth (server→WP) | WordPress Application Password (Basic Auth) |
| BTC Wallets | `@scure/bip32` + `@scure/btc-signer` — pure JS HD wallet derivation |
| BTC Monitoring | BlockCypher webhooks — `confirmed-tx` after 1 confirmation |
| Email | FluentSMTP WordPress plugin → all email via `wp_mail()` |
| Shipping | ShipStation — WP plugin pushes orders on status→processing |
| Payments | Cash App, Venmo, Zelle (P2P rotation), BTC, USDC/USDT (ETH+Solana) |

**Request flow:**
```
Browser → Vercel Edge → /api/* → WordPress REST API (WooCommerce v3)
ShipStation → POST /wp-json/vp-ss/v1/shipped → WP marks completed → FluentSMTP email
BlockCypher → POST /api/btc-payment-notify → WP order lookup → marks processing
```

---

## 2. VERCEL API FUNCTIONS

All auth: `WC_USER` + `WC_APP_PASSWORD` preferred, `WC_KEY` + `WC_SECRET` fallback.  
**Never use `VITE_WC_*` prefix** — VITE_ vars are baked into the browser bundle at build time.

### `api/create-order.ts`
- **POST** `/api/create-order`
- Creates WooCommerce order server-side (credentials never hit browser)
- Validates payload before hitting WC, detects 301/302 redirects, 15s timeout
- Returns `{ id, order_key, status }`

### `api/products.ts`
- **GET** `/api/products`
- Fetches all published WC products + variations, maps to frontend Product interface
- Fetches variable product variations in parallel
- Edge-cached: `s-maxage=300, stale-while-revalidate=600`
- Category mapping: `blends` / `glp` / `metabolic` / `peptides`

### `api/track-order.ts`
- **GET** `/api/track-order?q={invoiceId|wcOrderId}`
- Public order lookup — returns status, tracking, items. No credentials exposed.
- Searches by `invoice_id` meta first (VTG- prefix), falls back to numeric WC ID
- Returns mock data if env vars not configured (dev fallback)

### `api/cancel-order.ts`
- **POST** `/api/cancel-order` with body `{ orderId: number }`
- Sets WC order status → `cancelled`
- Called when payment countdown expires unpaid
- Stock restore requires "Manage stock" enabled per-product in WC

### `api/btc-address.ts`
- **GET** `/api/btc-address?invoiceId={id}`
- Gets next derivation index from WP, derives bc1... address, registers BlockCypher webhook
- Packages: `@scure/bip32` + `@scure/btc-signer` (pure JS — no native deps, Vercel-safe)
- Supports `zpub` (BIP84 native SegWit), `xpub` (BIP44), `ypub` (BIP49)
- Strips whitespace from stored key, regex-extracts valid key if corrupted
- WP endpoints used:
  - `GET /wp-json/vp-btc/v1/next-index` → `{ index, zpub }`
  - `POST /wp-json/vp-btc/v1/record-assignment` → saves invoice→address log

### `api/btc-payment-notify.ts`
- **POST** `/api/btc-payment-notify`
- BlockCypher webhook receiver — fires on confirmed BTC tx to monitored address
- Flow: find WC order via `/wp-json/vp-btc/v1/order-by-address` → update status → add order note
- Always returns 200 (prevents BlockCypher retry loops)
- Skips if `confirmations < 1`

### `api/shipstation-webhook.ts`
- Present but **NOT USED** — the WP plugin handles ShipStation directly
- ShipStation webhook URL points to WordPress, not Vercel

---

## 3. WORDPRESS PLUGINS

Upload all to `/wp-content/plugins/` on VPS. After each upload: **Settings → Permalinks → Save Changes** (flushes rewrite rules so REST routes register).

---

### `vintage-peps-shipstation` ⭐ MOST IMPORTANT

Handles ShipStation, P2P rotation, BTC wallet, and shipping emails. All in one file.

**ShipStation outbound:**
- Hooks `woocommerce_order_status_processing` → pushes order to ShipStation API
- Admin: WooCommerce → ShipStation Sync (enter API Key, API Secret, Webhook Secret)

**ShipStation inbound:**
- `POST /wp-json/vp-ss/v1/shipped` — ShipStation calls this on `SHIP_NOTIFY`
- Marks WC order completed, injects tracking meta, sends shipping email via `wp_mail()` → FluentSMTP
- Configure in ShipStation → Settings → Webhooks: `https://{wp-domain}/wp-json/vp-ss/v1/shipped`

**P2P payment account rotation:**
- Admin: WooCommerce → Payment Accounts (add/edit/toggle Cash App, Venmo, Zelle handles)
- `GET /wp-json/vp-p2p/v1/assign?method={zelle|cashapp|venmo}` → returns next worker handle, advances rotation
- Frontend calls this on payment method selection

**BTC wallet endpoints:**
- Admin: WooCommerce → BTC Payments (paste zpub, view assignment log)
- `GET /wp-json/vp-btc/v1/next-index` → `{ index, zpub }` (atomic increment)
- `POST /wp-json/vp-btc/v1/record-assignment` → saves address→invoiceId log
- `GET /wp-json/vp-btc/v1/order-by-address?address={bc1...}` → `{ orderId }` for BlockCypher webhook
- WP option keys: `vp_btc_zpub`, `vp_btc_index`, `vp_btc_assignments`

---

### `vintage-peps-cms` (v1.1.0)

Content management for React frontend.

**Custom post types:** `vpms_faq`, `vpms_testimonial`, `vpms_coa`, `vpms_hero`

**REST endpoints (all public):**
- `GET /wp-json/vintage-peps/v1/faqs`
- `GET /wp-json/vintage-peps/v1/testimonials`
- `GET /wp-json/vintage-peps/v1/coas?product={slug}`
- `GET /wp-json/vintage-peps/v1/hero`
- `GET /wp-json/vintage-peps/v1/blog` + `/blog/{slug}`

**Admin endpoints (require `edit_shop_orders`):**
- `GET /wp-json/vintage-peps/v1/orders/pending`
- `POST /wp-json/vintage-peps/v1/orders/{id}/mark-paid`

> ⚠️ **Do NOT include `class-vpms-btc.php`** when uploading. It conflicts with BTC endpoints in the shipstation plugin. The `require_once` for it was already removed from `vintage-peps-cms.php`.

---

### `vintage-peps-subscriptions`

Subscribe & Save engine.

- DB table: `wp_vp_subscriptions`
- `GET /wp-json/vps/v1/discount-tiers` → `{ "30": 10, "60": 12, "90": 15, "180": 20 }` (percent off per interval days)
- `POST /wp-json/vps/v1/renewal` — processes renewal token from email deep-link
- Daily WP cron at 06:00 sends renewal reminder emails
- Admin: configurable discount tiers
- Token secret auto-generated on activation → `vps_token_secret` WP option

---

### `vintage-peps-products`

Imports 21-SKU catalog into WooCommerce.

- Run once via WP Admin → Tools → Import Products
- Sets meta per product: `peptide_code`, `cas_number`, `purity`, `has_coa`, `coa_url`, `test_url`
- `GET /wp-json/vp-products/v1/by-sku?sku={sku}` → `{ product_id, variation_id }` (used by create-order)
- Upload product images to WP Media **before** running importer
- Fixed image fields: KPV (`kpv.png`), GHK-Cu (`ghk-cu.png`), NAD+ (`nad=.png`), Cartalax (`cartalax.png`)

---

### `vintage-peps-crm`

Newsletter/waitlist capture.

- DB table: `wp_vp_crm_leads`
- `POST /wp-json/vp-crm/v1/subscribe` — used by coming-soon page
- Admin: view subscribers, export CSV
- Auto-adds WC customers to CRM on order creation

---

## 4. REACT FRONTEND — KEY FILES

### `src/hooks/useProducts.ts`
- Module-level cache (`cachedProducts` + `inflightPromise`) prevents redundant fetches
- Exposes `{ products, loading, error }`
- Cancellation-safe via `cancelled` flag in `useEffect` cleanup

### `src/pages/checkout/page.tsx`
The most complex file. Key areas:
- `PAYMENT_METHODS` array — add/remove payment methods here
- `CRYPTO_ADDRESSES` config — ETH and Solana wallet addresses per token
- P2P methods: call `/wp-json/vp-p2p/v1/assign?method={method}` on confirmation
- BTC: call `/api/btc-address`, show bc1 address + copy button + countdown
- USDC/USDT: network selector (ETH/Solana) → wallet address display
- All P2P memo: "enter ONLY memo code — nothing else"
- BTC price: CoinGecko free API for display amount
- Countdown 2h → calls `/api/cancel-order` on expiry
- Subscription meta (`subscribeInterval`, `discountPct`) passed to WC order

### `src/index.css`
```css
html { font-size: 18px }  /* scales all Tailwind rem-based sizes site-wide */

/* Unlayered overrides — outside @layer, so they win over Tailwind utilities */
[class*="text-[9px]"]  { font-size: 12px; line-height: 1.6; }
[class*="text-[10px]"] { font-size: 13px; line-height: 1.6; }
[class*="text-[11px]"] { font-size: 14px; line-height: 1.6; }
[class*="text-[12px]"] { font-size: 14px; line-height: 1.6; }
```

### `src/pages/home/components/ProductCard.tsx`
- `loading="lazy"` + `decoding="async"` on all product images
- Fade-in on load: `opacity: 0` → `1` via `onLoad` inline style

### `src/pages/home/components/HeroSection.tsx`
- Hero image uses `loading="eager"` (above fold — don't lazy-load)
- **Must use HTTPS URL** — http:// images are blocked by browsers on HTTPS pages

---

## 5. VERCEL ENVIRONMENT VARIABLES

| Variable | Required | Notes |
|---|---|---|
| `WC_URL` | ✅ | WordPress root URL e.g. `https://db.yourdomain.com` |
| `WC_USER` | ✅ | WordPress username |
| `WC_APP_PASSWORD` | ✅ | Generated: WP Admin → Users → {user} → Application Passwords |
| `WC_KEY` | ✅ | WooCommerce consumer key (`ck_...`) — fallback auth |
| `WC_SECRET` | ✅ | WooCommerce consumer secret (`cs_...`) — fallback auth |
| `BLOCKCYPHER_TOKEN` | ✅ BTC only | BlockCypher API token |
| `SS_API_KEY` | Optional | Only needed if using Vercel ShipStation handler (not recommended) |
| `SS_API_SECRET` | Optional | Only needed if using Vercel ShipStation handler |
| `SS_WEBHOOK_SECRET` | Optional | HMAC secret for ShipStation webhook signature verification |

---

## 6. DEPLOYMENT CHECKLIST (for new project)

### Step 1 — VPS WordPress
- [ ] Install WordPress 6 + WooCommerce 8
- [ ] Install FluentSMTP plugin (handles all `wp_mail()`)
- [ ] Generate Application Password: WP Admin → Users → {admin} → Application Passwords
- [ ] Create WC REST API key: WooCommerce → Settings → Advanced → REST API

### Step 2 — Upload WP Plugins
- [ ] `vintage-peps-shipstation/` — most critical
- [ ] `vintage-peps-cms/` — without `class-vpms-btc.php` in includes/
- [ ] `vintage-peps-subscriptions/`
- [ ] `vintage-peps-products/`
- [ ] `vintage-peps-crm/`
- [ ] **After each upload:** Settings → Permalinks → Save Changes

### Step 3 — Configure WP Plugins
- [ ] WooCommerce → ShipStation Sync: enter API Key, API Secret, Webhook Secret
- [ ] WooCommerce → Payment Accounts: add worker handles (Cash App, Venmo, Zelle)
- [ ] WooCommerce → BTC Payments: paste zpub (Native SegWit, 111 chars, starts with `zpub`)
- [ ] ShipStation → Settings → Webhooks: `SHIP_NOTIFY` URL = `https://{wp-domain}/wp-json/vp-ss/v1/shipped`

### Step 4 — Vercel
- [ ] Connect GitHub repo to Vercel
- [ ] Set all environment variables (mark Sensitive, scope: Production + Preview)
- [ ] `npm install` locally after any `package.json` changes → commit `package-lock.json`
- [ ] Push to main → auto-deploys
- [ ] Confirm `vercel.json` has: `/api/(*) → /api/$1` and `/(*) → /index.html`

### Step 5 — Frontend (per-project customisation)
- [ ] `CRYPTO_ADDRESSES` in `checkout/page.tsx` — update ETH/Solana wallet addresses
- [ ] `PAYMENT_METHODS` array — update handles
- [ ] Hero image URL — upload to WP Media, use HTTPS URL
- [ ] `html { font-size }` in `index.css` — adjust for new design
- [ ] Tailwind config — update color tokens

### Step 6 — Verify
- [ ] `GET /api/btc-address?invoiceId=TEST-001` → `{ "address": "bc1q...", "index": 0 }`
- [ ] `GET /api/products` → live WC products (not empty)
- [ ] `GET /api/track-order?q={invoiceId}` → real order (not mock)
- [ ] Place test Cash App order → WC order created, handle shown, pushed to ShipStation
- [ ] Regenerate WC API keys if old ones were ever exposed in chat/logs

---

## 7. KNOWN GOTCHAS

### BTC / zpub
- **`bip84` npm package crashes Vercel** — uses `tiny-secp256k1` (native C addon). Use `@scure/bip32` + `@scure/btc-signer` instead (pure JS).
- **Exodus exports 3 separate keys**: `xpub` (Legacy 1...), `zpub` (Native SegWit bc1q), `zpub` (Taproot bc1p). Use the **first zpub only**.
- **Never paste multiple keys** — they concatenate without spaces and corrupt the stored value. Paste once, save.
- **Invalid checksum** = stored key is corrupted. Clear field, paste fresh.

### Vercel Functions
- All env vars must use `WC_URL / WC_USER / WC_APP_PASSWORD` — **NOT `VITE_WC_*`**.
- `FUNCTION_INVOCATION_FAILED` = module crash at startup (native dep, bad import). Handler-returned `500` = runtime error.
- `createRequire(import.meta.url)` works for CJS packages in ESM context but fails if the CJS package uses native addons.

### WordPress Plugins
- **Two plugins registering the same REST namespace** → silent conflict, first registered wins. Always check for duplicate route namespaces.
- **After any plugin upload: flush permalinks** (Settings → Permalinks → Save). New REST routes aren't recognized until rewrite rules rebuild.
- WC stock restore on cancel only works if "Manage stock" is enabled per-product.
- FluentSMTP intercepts `wp_mail()` globally — no SMTP config needed anywhere else.

### CSS / Frontend
- Tailwind utilities are inside `@layer utilities` — unlayered CSS rules outside all `@layer` blocks win without `!important`.
- `html { font-size: 18px }` scales all rem-based Tailwind spacing/sizing site-wide.
- **Hero images must use HTTPS** — `http://` images are blocked by browsers when site is `https://`.

### Package Management
- Always run `npm install` locally and commit `package-lock.json` before deploying — Vercel uses the lock file.

---

*Vintage Peptides — vintagepeptides.com*
