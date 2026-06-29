# VPS / WordPress Deployment Checklist
> All code changes are already saved in the repo. This document covers everything that must be done
> **on the VPS / WP Admin** to make them live. Work top-to-bottom — order matters.

---

## 1. Upload All Four WP Plugins

Copy the entire folder for each plugin into `/var/www/html/wp-content/plugins/` on the VPS
(or upload via WP Admin → Plugins → Add New → Upload Plugin → ZIP the folder first).

| Plugin folder | What changed | Why it matters |
|---|---|---|
| `vintage-peps-crm/` | Added `/wp-json/vp-crm/v1/contact-notify` REST endpoint; sends admin email when contact form submitted | Contact form submissions were going nowhere — no admin notification |
| `vintage-peps-shipstation/` | Switched hook from `woocommerce_new_order` → `woocommerce_rest_insert_order_object` | Old hook fires BEFORE order meta (payment handle, memo code) is saved. New hook fires AFTER — P2P confirmation emails now include the correct Zelle/CashApp handle and memo |
| `vintage-peps-subscriptions/` | Added public `/wp-json/vp-subs/v1/discount-tiers` REST endpoint; renamed admin menu to "Subscribe & Save" | Frontend was hitting `vps/v1/discount-tiers` (wrong namespace, 404). Fixed namespace is `vp-subs/v1`. Without this endpoint live, Subscribe & Save pricing always shows defaults |
| `vintage-peps-crm/` | (same upload — already covered above) | |

**After uploading each plugin:**
- Go to WP Admin → Plugins
- Deactivate the old version, then Activate the new one
  (or if the plugin wasn't active, just activate it)

---

## 2. Flush WordPress Permalinks

WP Admin → Settings → Permalinks → click **Save Changes** (no need to change anything).

This re-registers all REST API routes. Without this step, the new endpoints (`/discount-tiers`,
`/contact-notify`) will return 404 even after the plugin is activated.

**Do this every time a plugin is uploaded.**

---

## 3. Add Vercel Environment Variable

In the Vercel dashboard → Project → Settings → Environment Variables, add:

| Key | Value |
|---|---|
| `VITE_LAUNCH_PASSWORD` | `vintage2026` |

This powers the access-code gate on the video screen. If this var is missing on Vercel, the gate
defaults to `vintage2026` from source code anyway, but it's better to have it explicit so you can
change the password without redeploying — just update the env var and redeploy.

To **open the site publicly** later (no access code): set `VITE_LAUNCH_PASSWORD` to an empty string `""`.

---

## 4. Enable HTTPS on the VPS (SSL Certificate)

SSH into the VPS and run:

```bash
sudo certbot --nginx -d db.vintagepeptides.com
```

**Why this matters:** Vercel serverless functions run over HTTPS and refuse to make outbound HTTP
calls to non-HTTPS URLs in production. All Vercel→VPS API calls (`/api/create-order`,
`/api/crm-subscribe`, `/api/contact`, etc.) are currently failing silently or erroring because the
VPS only responds on HTTP.

The newsletter and contact form were patched to call the VPS directly from the browser (HTTP is fine
browser→VPS), but the following Vercel proxy calls still need HTTPS to work properly:

- `POST /api/create-order` → creates WooCommerce order
- `POST /api/crm-subscribe` → fallback newsletter subscribe
- `POST /api/contact` → admin notification email
- `GET /api/products` → product catalog
- `GET /api/coas` → COA documents

Until SSL is live, orders go through but some email notifications may be delayed or lost.

---

## 5. Deactivate Old Newsletter Plugin

If there is a legacy "Newsletter Signups" or "Readdy" plugin still active in WP Admin → Plugins,
deactivate and delete it.

The `vintage-peps-crm` plugin fully replaces it. Having both active can cause double-inserts or
conflicts on the `wp_vp_subscribers` table.

---

## 6. Configure ShipStation (First-Time Setup)

### In WP Admin → Settings → VP Payments:
- Enter your **ShipStation API key** (from ShipStation → Account Settings → API)
- Enter your **ShipStation API secret**

### In ShipStation dashboard:
1. Settings → Selling Channels → Connect a Store → **Custom Store (Generic)**
2. Set the XML feed URL to:
   ```
   https://db.vintagepeptides.com/wp-json/vp-shipstation/v1/orders
   ```
3. Set authentication: **Basic Auth**
   - Username: the value of `SHIPSTATION_API_KEY` in WP options (whatever you entered above)
   - Password: same as secret
4. Set import frequency: every 30 minutes or on-demand

When ShipStation pulls the feed, it gets all WooCommerce orders formatted as ShipStation XML with
customer name, address, items, and line items. Once you mark an order as shipped in ShipStation, it
can push the tracking number back via webhook (that endpoint is already built at
`POST /api/shipstation-webhook` on Vercel).

---

## 7. Verify Order Confirmation Emails Are Working

After uploading the updated `vintage-peps-shipstation` plugin and placing a test order with
Zelle/CashApp/Venmo selected:

1. Customer should receive an email with:
   - Order total
   - Payment method (e.g., "Cash App")
   - Payment handle (e.g., `$VintagePeptides`)
   - Memo code (the unique order reference)
   - Instructions to send exact amount within 48 hours

2. Admin (`orders@vintagepeptides.com`) should receive a separate copy

If emails still don't arrive, check:
- WP Admin → WooCommerce → Settings → Emails — confirm "From" address is set
- Confirm SMTP plugin is active and sending (test via SMTP plugin's test email button)
- Check spam folder

The root cause of missing P2P emails was `woocommerce_new_order` firing before meta was saved.
The fix (`woocommerce_rest_insert_order_object`) is in the uploaded plugin — just needs to be live.

---

## 8. Test Newsletter Signup

After uploading `vintage-peps-crm`:

1. Open the site in an incognito window (clears sessionStorage so the intro flow runs fresh)
2. Enter access code `vintage2026` on the video screen → click Enter
3. Newsletter popup appears → enter a test email → click Notify Me
4. Check WP Admin → Email Signups — the email should appear with source `newsletter-popup`

If it doesn't appear:
- Open browser DevTools → Network → look for a POST to `db.vintagepeptides.com/wp-json/vp-crm/v1/subscribe`
- Check the response — if 404, permalink flush is needed; if 500, check PHP error log on VPS

---

## 9. Test Contact Form

1. Go to `/contact` on the site
2. Fill out and submit the form
3. Check WP Admin → Email Signups — submitter's email should appear with source `contact-form`
4. Check `orders@vintagepeptides.com` inbox — admin notification email should arrive with name, email, institution, and message

---

## Summary Checklist

- [ ] Upload `vintage-peps-crm` plugin → deactivate old → activate new
- [ ] Upload `vintage-peps-shipstation` plugin → deactivate old → activate new
- [ ] Upload `vintage-peps-subscriptions` plugin → deactivate old → activate new
- [ ] WP Admin → Settings → Permalinks → Save Changes
- [ ] Vercel → add `VITE_LAUNCH_PASSWORD=vintage2026` env var
- [ ] SSH: `sudo certbot --nginx -d db.vintagepeptides.com`
- [ ] Deactivate any old newsletter/Readdy plugins
- [ ] WP Admin → Settings → VP Payments → enter ShipStation API key
- [ ] ShipStation → connect Custom Store with XML feed URL
- [ ] Test newsletter signup (incognito window, enter code, subscribe)
- [ ] Test contact form submission
- [ ] Place test P2P order → verify customer gets payment instructions email
