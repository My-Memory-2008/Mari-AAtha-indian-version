# Mari-AAtha — Print On Demand Website
### Setup Guide: Public GitHub Repo + Cloudflare Pages + Qikink API

---

## How it works

```
Customer browser  →  index.html (Cloudflare Pages CDN)
                  →  /api/*    (Cloudflare Pages Functions — your secret backend)
                             →  Qikink API (prints & ships the order)
```

- **index.html** — the full website, runs in the customer's browser
- **functions/api/*.js** — your backend, runs on Cloudflare's servers. Your Qikink API key lives here, encrypted. Customers can never see it.
- **GitHub repo is public** — that's fine. The API keys are NOT in the code. They live only in Cloudflare's environment variables.
- **Auto-deploy** — every push to `main` → Cloudflare automatically rebuilds and deploys within 1–2 minutes. No manual steps ever again.

---

## Files in this repo

```
mari-aatha/
├── index.html                        ← the entire website (frontend)
├── _headers                          ← Cloudflare security headers
├── _redirects                        ← URL routing rules
├── README.md                         ← this guide
├── functions/
│   └── api/
│       ├── products.js               ← GET  /api/products  (Qikink catalogue)
│       ├── order.js                  ← POST /api/order     (place order)
│       ├── shipping.js               ← GET  /api/shipping  (shipping rates)
│       └── upload.js                 ← POST /api/upload    (upload design image)
└── .github/
    └── workflows/
        └── deploy.yml                ← deployment notification workflow
```

---

## STEP 1 — Get your Qikink API credentials

1. Go to **https://qikink.com** → log in to your seller account
2. Dashboard → **Settings → API** (or Developer section)
3. Copy and save:
   - **API Key** — a long string like `abc123xyz...`
   - **User ID / Store ID** — a number like `12345`
4. You will add these in Step 4. Do not put them in any file.

---

## STEP 2 — Create your GitHub repository

1. Go to **https://github.com** → sign in
2. Click **+** (top right) → **New repository**
3. Settings:
   - Repository name: `mari-aatha`
   - Visibility: **Public** ✅ (Cloudflare connects to public repos for free, no token needed)
   - Do NOT tick "Add a README"
4. Click **Create repository**

### Upload files to GitHub

On the empty repo page, click **"uploading an existing file"**, then upload all 9 files keeping this exact folder structure:

```
index.html
_headers
_redirects
README.md
functions/api/products.js
functions/api/order.js
functions/api/shipping.js
functions/api/upload.js
.github/workflows/deploy.yml
```

Write commit message: `Initial Mari-AAtha setup` → click **Commit changes**

---

## STEP 3 — Create Cloudflare Pages project (connect to GitHub)

1. Go to **https://dash.cloudflare.com** → create a free account if you don't have one
2. Left sidebar → **Workers & Pages** → **Create** → **Pages** tab
3. Click **Connect to Git** → **Connect GitHub** → authorise Cloudflare
4. Select your `mari-aatha` repository → click **Begin setup**
5. Build settings:
   - **Project name:** `mari-aatha`
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** *(leave completely empty)*
   - **Build output directory:** `/`
6. Click **Save and Deploy**

Cloudflare will deploy in about 1–2 minutes. You get a live URL:
**`https://mari-aatha.pages.dev`**

From this point, every push to your GitHub `main` branch → Cloudflare automatically redeploys. No tokens, no Actions secrets needed.

---

## STEP 4 — Add Qikink API keys to Cloudflare (THE most important step)

Your API keys go here — in Cloudflare, encrypted. They are never in your code.

1. Cloudflare dashboard → **Workers & Pages** → click **mari-aatha**
2. Click the **Settings** tab → **Environment variables**
3. Click **Add variable** — add these one at a time:

| Variable Name    | Value                   | Encrypt?       |
|------------------|-------------------------|----------------|
| `QIKINK_API_KEY` | Your Qikink API key     | ✅ Yes, encrypt |
| `QIKINK_USER_ID` | Your Qikink User/Store ID | ✅ Yes, encrypt |

4. Make sure **Environment** is set to **Production**
5. Click **Save**

Cloudflare will automatically redeploy with the keys active.

---

## STEP 4b — (Optional) Also add to GitHub Secrets

If you want GitHub Actions to be able to use the Qikink keys in future (e.g. for automated testing), add them to GitHub too:

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add:

| Secret Name      | Value                      |
|------------------|----------------------------|
| `QIKINK_API_KEY` | Your Qikink API key        |
| `QIKINK_USER_ID` | Your Qikink User/Store ID  |

> These are encrypted by GitHub and never visible in your public code.
> They are separate from the Cloudflare variables — both can have them.

---

## STEP 5 — Test everything is working

### Test the website
Open: `https://mari-aatha.pages.dev`
- Site loads with full colour design studio ✅
- Design studio works (upload image, add text, emoji) ✅
- Products grid shows ✅

### Test the backend API
Open in a new browser tab: `https://mari-aatha.pages.dev/api/products`
- You should see a JSON response from Qikink ✅
- If you see `{"error":"QIKINK_API_KEY not set"}` → go back to Step 4 and check the variable name is exactly `QIKINK_API_KEY`

### Check Cloudflare logs if something is wrong
Cloudflare dashboard → **Workers & Pages** → **mari-aatha** → **Functions** tab → **Logs**
This shows every API call and any errors in real time.

---

## STEP 6 — Connect the checkout to Qikink (go fully live)

The checkout button currently shows an alert. To make it place real orders with Qikink,
open `index.html`, find `function checkout()` and replace the contents with:

```javascript
async function checkout() {
  if (!cart.length) return;

  // Simple checkout form — replace with a proper form on your page
  const customerName   = prompt('Your full name:');
  const customerPhone  = prompt('Your phone number:');
  const customerEmail  = prompt('Your email:');
  const addressLine1   = prompt('Address line 1:');
  const addressCity    = prompt('City:');
  const addressPincode = prompt('Pincode:');

  if (!customerName || !addressLine1 || !addressPincode) {
    showToast('Please fill in all details.'); return;
  }

  showToast('🚀 Placing your order…');

  // Upload design images for custom-designed items
  const itemsWithDesigns = await Promise.all(cart.map(async (item) => {
    if (item.preview && item.hasCustomDesign) {
      const uploadResp = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: item.preview }),
      });
      const uploadData = await uploadResp.json();
      return { ...item, designUrl: uploadData.url || uploadData.file_url };
    }
    return item;
  }));

  // Build order payload — adjust field names to match Qikink's docs exactly
  const orderPayload = {
    customer: { name: customerName, email: customerEmail, phone: customerPhone },
    shipping_address: {
      name: customerName, line1: addressLine1,
      city: addressCity, pincode: addressPincode, country: 'IN',
    },
    items: itemsWithDesigns.map(item => ({
      product_name: item.name,
      quantity:     item.qty,
      price:        item.price,
      design_url:   item.designUrl || null,
    })),
  };

  try {
    const resp = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    const data = await resp.json();
    if (resp.ok) {
      cart = []; saveCart(); updateCartUI(); toggleCart();
      showToast('✅ Order placed! ID: ' + (data.order_id || data.id));
    } else {
      showToast('❌ ' + (data.error || 'Order failed. Try again.'));
    }
  } catch (err) {
    showToast('❌ Network error. Please try again.');
  }
}
```

---

## STEP 7 — Set your prices

In `index.html`, find the `PRODUCTS_DATA` array and `STUDIO_PRODUCTS` array in the `<script>` section.
Change the `price:` values to what you want to charge customers.

Example:
- Qikink charges you ₹249 for a basic tee → you sell at ₹399 → you earn ₹150 per order
- Qikink charges you ₹180 for a mug → you sell at ₹299 → you earn ₹119 per order

---

## How to update the site in future

1. Edit any file (on GitHub.com directly, or on your computer + git push)
2. Commit to the `main` branch
3. Cloudflare automatically redeploys in ~1–2 minutes
4. Your live site is updated

That's it. You never need to touch Cloudflare manually again.

---

## Summary — where your secrets live

| Secret           | GitHub Secrets | Cloudflare Env Vars | In your code? |
|------------------|----------------|---------------------|---------------|
| `QIKINK_API_KEY` | ✅ Optional    | ✅ Required          | ❌ Never      |
| `QIKINK_USER_ID` | ✅ Optional    | ✅ Required          | ❌ Never      |
| CF API Token     | ❌ Not needed  | ❌ Not needed        | ❌ Never      |

Your GitHub repo is public. Anyone can see your code. That is perfectly fine because:
- The API keys are in Cloudflare's encrypted environment variables, not in any file
- The `/functions/api/*.js` files run on Cloudflare's servers — customers never execute them

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Site doesn't update after pushing | Check Cloudflare → Pages → Deployments — is it building? |
| `/api/products` returns key error | Check Cloudflare → Settings → Environment variables — name must be exactly `QIKINK_API_KEY` |
| `/api/products` returns 502 | Qikink API is down or your key is wrong |
| Orders not going through | Check Cloudflare → Functions → Logs. Compare payload with Qikink's API docs |
| Design not uploading | Check `/api/upload` endpoint — Qikink's file upload field name may differ |
