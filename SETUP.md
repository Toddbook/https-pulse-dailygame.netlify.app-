# PULSE+ with Stripe: setup

What is in this folder
- public/index.html : your website (PULSE+ is switched OFF, so it shows "coming soon")
- netlify/functions : three small programs that talk to Stripe (checkout, status, portal)
- netlify/lib/stripe.mjs : shared helper
- netlify.toml, package.json : settings Netlify reads

Why this differs from your drag-and-drop site: Netlify's drag-and-drop upload does not run the
programs in netlify/functions (Netlify's forums say functions only work from Git or the command line).
Stripe needs them, so this version is deployed from GitHub, below.

## 1. Stripe dashboard (stay in TEST mode first)
1. Product catalogue > Add product: "PULSE+". Add two recurring prices in GBP: £3.99 every month, and £24.99 every year.
   Copy the two price IDs (they start price_).
2. Settings > Billing > Customer portal: switch it on and press Save. Allow customers to cancel subscriptions.
3. Developers > API keys: copy the Secret key (starts sk_test_). Never paste it in chat, into the website file or onto GitHub.

## 2. Put the folder on GitHub (no command line)
1. Make a free account at github.com and press New repository. Name it pulse-site. Choose Private.
2. Press "uploading an existing file" and drag in EVERYTHING from this folder, keeping the folders. Commit.

## 3. Connect Netlify to it
1. Netlify > Add new site > Import an existing project > GitHub > pulse-site. Leave the build settings as they are. Deploy.
2. Site configuration > Environment variables. Add, marking the key as secret:
   - STRIPE_SECRET_KEY : your sk_test_ key
   - STRIPE_PRICE_MONTHLY : the monthly price ID
   - STRIPE_PRICE_YEARLY : the yearly price ID
3. Deploys > Trigger deploy > Deploy site.
To keep your current address, make this the site called pulse-dailygame, or move the address across.

## 4. Turn PULSE+ on and test
1. In public/index.html change  enabled:false  to  enabled:true  (GitHub's pencil icon), and commit.
2. Open the site, press PULSE+ > Yearly, and pay with card 4242 4242 4242 4242, any future date, any CVC.
3. You should land back on the site with PULSE+ unlocked. Check that Manage subscription opens Stripe's page.
4. In Stripe, cancel the test subscription and reload the site: PULSE+ should lock.

## 5. Go live
Repeat step 1 in live mode (live prices have new IDs), swap the three environment variables to the live values, and redeploy.
Do one real £3.99 purchase yourself, then refund it.

## Things to know
- VAT: Stripe does not collect UK VAT for you the way Lemon Squeezy would. Check with an accountant whether you must
  register, and consider switching on Stripe Tax.
- The lock is in the browser, and anyone with the unlock link can use PULSE+. That is fine for extras like the archive and themes.
- Update your privacy policy and terms: Stripe takes the payments, not Lemon Squeezy.

## Visitor counter
The "All-time visits" box is back. netlify/functions/visitor-count.mjs adds one to a single number kept in Netlify Blobs, and stores
nothing about the visitor. It needs no setup beyond the GitHub deploy (the first deploy installs @netlify/blobs from package.json).
The count starts at 0 on the new site, because the old number lived somewhere I can't see. Every page load counts, so refreshes
and bots add to it. If the counter ever fails, the box simply stays hidden.
