# Mari-AAtha — Print On Demand Website
### Complete Setup Guide (GitHub + Cloudflare Pages + Qikink API)

---

## What you are building

A **fully passive print-on-demand store** where:
- Customers visit your site, design their own products (upload images, add text, choose colours)
- They place an order and pay
- Qikink automatically prints and ships to them
- You earn the margin between your price and Qikink's cost
- **You do nothing after setup**

---

## Files in this repository

```
mari-aatha/
├── index.html                  ← The entire website (frontend)
├── _headers                    ← Cloudflare security headers
├── _redirects                  ← URL routing rules
├── functions/
│   └── api/
│       ├── products.js         ← GET  /api/products   (fetch Qikink catalogue)
│       ├── order.js            ← POST /api/order       (place order with Qikink)
│       ├── shipping.js         ← GET  /api/shipping    (get shipping rates)
│       └── upload.js           ← POST /api/upload      (upload design image)
└── .github/
    └── workflows/
        └── deploy.yml          ← Auto-deploy to Cloudflare on every git push
```

**How it works:**
- `index.html` = what the customer sees in their browser
- `/functions/api/*.js` = your **secret backend** — runs on Cloudflare's servers, never visible to customers. Your Qikink API key lives here safely.
- Every time you push to GitHub → GitHub Actions automatically deploys to Cloudflare Pages

---

## STEP 1 — Create your Qikink account and get API keys

1. Go to **https://qikink.com** and create a seller account
2. Log in → go to your **Dashboard**
3. Find **Settings → API / Developer** (or similar — the menu may vary)
4. Copy your:
   - **API Key** (looks like a long string of letters and numbers)
   - **User ID / Store ID** (a number like `12345`)
5. Save these somewhere safe — you will need them in Steps 4 and 5

> **Important:** Qikink's API docs are at https://qikink.com/developer/
> Read through the "Create Order" endpoint to understand exactly what fields they require.
> The `/functions/api/order.js` file already handles the structure — you may need to
> adjust field names to exactly match what Qikink's docs say.

---

## STEP 2 — Create your GitHub repository

1. Go to **https://github.com** — sign in (or create a free account)
2. Click the **+** button (top right) → **New repository**
3. Set:
   - Repository name: `mari-aatha`
   - Visibility: **Private** (keeps your code secret)
   - Do NOT tick "Add a README" (we already have one)
4. Click **Create repository**
5. GitHub shows you a page with setup commands. Copy the repo URL — it looks like:
   `https://github.com/YOUR-USERNAME/mari-aatha.git`

### Upload your files to GitHub

**Option A — Using GitHub website (easiest, no command line):**
1. On your new empty repo page, click **"uploading an existing file"**
2. Drag and drop ALL the files and folders from this project
3. Make sure the folder structure is exactly:
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
4. Scroll down, write a commit message like "Initial upload"
5. Click **Commit changes**

**Option B — Using Git command line:**
```bash
# In the folder where you have these files:
git init
git add .
git commit -m "Initial Mari-AAtha setup"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/mari-aatha.git
git push -u origin main
```

---

## STEP 3 — Create your Cloudflare account and Pages project

1. Go to **https://cloudflare.com** → Sign up for a free account
   (Free plan is fine — Cloudflare Pages is free for this use case)

2. After logging in, click **Workers & Pages** in the left sidebar

3. Click **Create** → **Pages** tab → **Connect to Git**

4. Click **Connect GitHub** → Authorise Cloudflare to access your GitHub

5. Select your `mari-aatha` repository → click **Begin setup**

6. Configure the build settings:
   - **Project name:** `mari-aatha` ← write this down exactly, you need it in Step 4
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** *(leave completely empty)*
   - **Build output directory:** `/` (just a forward slash)

7. Click **Save and Deploy**
   - Cloudflare will deploy your site for the first time
   - It takes about 1–2 minutes
   - You will get a URL like: `https://mari-aatha.pages.dev`
   - **Open that URL — your site is already live!** (The API won't work yet — that's Step 5)

---

## STEP 4 — Add GitHub Secrets (so GitHub Actions can deploy automatically)

Every time you edit and push to GitHub, GitHub Actions will automatically redeploy to Cloudflare.
For this to work, GitHub needs your Cloudflare credentials as secrets.

### Get your Cloudflare API Token

1. In Cloudflare dashboard → click your **profile icon** (top right) → **My Profile**
2. Click **API Tokens** in the left menu
3. Click **Create Token**
4. Click **Use template** next to **"Cloudflare Pages — Edit"**
5. Under "Account Resources" → select your account
6. Click **Continue to summary** → **Create Token**
7. **Copy the token** — you only see it once!

### Get your Cloudflare Account ID

1. In Cloudflare dashboard → click **Workers & Pages** in the left sidebar
2. Look at the right side panel — you will see **Account ID**
3. Copy that number

### Add secrets to GitHub

1. Go to your GitHub repo → **Settings** (top menu bar)
2. Left sidebar → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each one:

| Secret Name              | Value to paste                              |
|--------------------------|---------------------------------------------|
| `CLOUDFLARE_API_TOKEN`   | The token you just created in Cloudflare    |
| `CLOUDFLARE_ACCOUNT_ID`  | The Account ID number from Cloudflare       |

> **Note:** `GITHUB_TOKEN` is automatic — GitHub creates it for you, you don't need to add it.

---

## STEP 5 — Add your Qikink API keys to Cloudflare (secret backend variables)

These are the most important secrets. They go in Cloudflare so the backend Functions can use them securely. **Never put API keys in index.html — anyone could see them.**

1. Go to **Cloudflare dashboard** → **Workers & Pages**
2. Click on your **mari-aatha** project
3. Click **Settings** (top tab) → **Environment variables**
4. Click **Add variable** and add these one by one:

| Variable Name      | Value                          | Encrypt? |
|--------------------|--------------------------------|----------|
| `QIKINK_API_KEY`   | Your Qikink API key            | ✅ Yes — tick "Encrypt" |
| `QIKINK_USER_ID`   | Your Qikink User/Store ID      | ✅ Yes — tick "Encrypt" |

5. Make sure to set them for **Production** environment (and optionally Preview too)
6. Click **Save**

> After saving, Cloudflare will automatically redeploy with the new variables active.
> Your API backend (`/functions/api/*.js`) can now securely call Qikink.

---

## STEP 6 — Test your site is working

1. Go to your site URL: `https://mari-aatha.pages.dev`
2. You should see the full colourful website
3. Test the Design Studio — upload an image, add text, add emoji
4. Test adding to cart

### Test the API backend is working

Open a new browser tab and go to:
```
https://mari-aatha.pages.dev/api/products
```

You should see a JSON response from Qikink. If you see an error:
- Check your `QIKINK_API_KEY` is correct in Cloudflare environment variables
- Check Cloudflare → Functions → Logs for error messages

---

## STEP 7 — Connect the checkout to Qikink (final step to go fully live)

Right now the "Proceed to Checkout" button shows an alert. To make it actually place orders:

Open `index.html`, find the `checkout()` function (search for `function checkout()`), and replace the `alert(...)` block with this real API call:

```javascript
async function checkout() {
  if (!cart.length) return;

  // Collect customer details (add a form to your site to get these)
  const customerName    = prompt('Your full name:');
  const customerPhone   = prompt('Your phone number:');
  const customerEmail   = prompt('Your email:');
  const addressLine1    = prompt('Address line 1:');
  const addressCity     = prompt('City:');
  const addressPincode  = prompt('Pincode:');

  if (!customerName || !addressLine1 || !addressPincode) {
    showToast('Please fill in all details.');
    return;
  }

  showToast('🚀 Placing your order…');

  // Step 1: Upload design images for any custom-designed items
  const itemsWithDesigns = await Promise.all(cart.map(async (item) => {
    if (item.preview && item.hasCustomDesign) {
      // Upload the canvas design image to Qikink
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

  // Step 2: Build the order payload (adjust field names to match Qikink's docs)
  const orderPayload = {
    customer: {
      name:  customerName,
      email: customerEmail,
      phone: customerPhone,
    },
    shipping_address: {
      name:     customerName,
      line1:    addressLine1,
      city:     addressCity,
      pincode:  addressPincode,
      country:  'IN',
    },
    items: itemsWithDesigns.map(item => ({
      product_name: item.name,
      quantity:     item.qty,
      price:        item.price,
      design_url:   item.designUrl || null,
    })),
  };

  // Step 3: Send to your backend (which calls Qikink)
  try {
    const resp = await fetch('/api/order', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(orderPayload),
    });
    const data = await resp.json();

    if (resp.ok) {
      cart = [];
      saveCart();
      updateCartUI();
      toggleCart();
      showToast('✅ Order placed! Order ID: ' + (data.order_id || data.id));
    } else {
      showToast('❌ Error: ' + (data.error || 'Order failed. Try again.'));
    }
  } catch (err) {
    showToast('❌ Network error. Please try again.');
  }
}
```

> **Note:** The exact field names (`order_id`, `file_url`, etc.) depend on Qikink's API response.
> Check your Qikink API docs to confirm the exact response structure and adjust accordingly.

---

## STEP 8 — Set your prices and go live

In `index.html`, find the `PRODUCTS_DATA` array and `STUDIO_PRODUCTS` array near the top of the `<script>` section. Update the `price` values to whatever you want to charge customers.

**Example pricing strategy:**
- Qikink charges you ₹249 for a T-shirt
- You set your price to ₹399
- You earn ₹150 per shirt automatically

---

## How automatic deployment works (after initial setup)

Once everything is set up, your workflow is:

1. Edit `index.html` or any file on your computer (or directly on GitHub.com)
2. Push/commit to the `main` branch
3. GitHub Actions automatically runs (you can see it under the **Actions** tab)
4. Within 2–3 minutes, your live site at `mari-aatha.pages.dev` is updated

**You never need to manually upload files to Cloudflare again.**

---

## Custom domain (optional)

To use your own domain (e.g. `www.mari-aatha.com`) instead of `.pages.dev`:

1. Buy a domain from any registrar (GoDaddy, Namecheap, etc.)
2. In Cloudflare → your Pages project → **Custom domains** → **Set up a custom domain**
3. Enter your domain and follow the instructions to point your DNS to Cloudflare

---

## Summary of all secrets / variables

| Where            | Name                   | What it is                              |
|------------------|------------------------|-----------------------------------------|
| GitHub Secrets   | `CLOUDFLARE_API_TOKEN` | Lets GitHub deploy to Cloudflare        |
| GitHub Secrets   | `CLOUDFLARE_ACCOUNT_ID`| Your Cloudflare account number          |
| Cloudflare Env   | `QIKINK_API_KEY`       | Your Qikink API key (encrypted)         |
| Cloudflare Env   | `QIKINK_USER_ID`       | Your Qikink store/user ID (encrypted)   |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| GitHub Actions fails | Check the Actions tab — click the failed run to see the error. Usually the secret names are wrong. |
| `/api/products` returns error | Check Cloudflare → Pages → Functions → Logs. Verify `QIKINK_API_KEY` is set. |
| Site not updating after push | Check GitHub Actions tab — is the workflow running? Check the project name in `deploy.yml` matches Cloudflare. |
| Cloudflare deploy fails | Make sure Build command is empty and Build output is `/` in Cloudflare settings. |
| Order fails | Check Cloudflare Functions logs. Compare the payload with Qikink's API docs — field names may differ. |
