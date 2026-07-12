# ⚡ QUICK START — Copy-Paste Commands

## 🔴 GOOGLE ANALYTICS — 5 Minutes

### Step 1: Get GA ID
- [ ] Go to https://analytics.google.com
- [ ] Create account "MAASGA Climatisation"
- [ ] Note your ID: `G-XXXXXXXXXX`

### Step 2: Update Code
```bash
# Open with your editor:
code src/components/Layout.tsx

# Find & Replace (2 times):
# Search:  G-XXXXXXXXXX
# Replace: G-YOUR-REAL-ID
```

### Step 3: Deploy
```powershell
npm run build
npx wrangler pages deploy dist --project-name maasga-website
```

### Step 4: Test
- [ ] Open https://139799f9.maasga-website.pages.dev
- [ ] Go to Google Analytics → Realtime
- [ ] Should see yourself as visitor ✅

---

## 📱 SMS NOTIFICATIONS — 10 Minutes

### Step 1: Twilio Setup
- [ ] Go to https://www.twilio.com/console
- [ ] Sign up (free $15 credit)
- [ ] Copy **Account SID**: `AC...`
- [ ] Copy **Auth Token**: `...`
- [ ] Buy a phone number (e.g., +1234567890)
- [ ] Note your **FROM number**: `+1234567890`

### Step 2: Update Config
```powershell
# Open wrangler.jsonc:
code wrangler.jsonc

# Uncomment & fill this section:
"vars": {
  "TWILIO_ACCOUNT_SID": "ACxxxxxxxxxxxxxxxxxxxxx",
  "TWILIO_AUTH_TOKEN": "your_auth_token_keep_safe",
  "TWILIO_FROM": "+1234567890"
}
```

### Step 3: Deploy
```powershell
npm run build
npx wrangler pages deploy dist --project-name maasga-website
```

### Step 4: Test
- [ ] Go to https://139799f9.maasga-website.pages.dev/rendez-vous
- [ ] Fill form, submit RDV
- [ ] Should receive SMS within 30 seconds ✅

---

## 🌐 CUSTOM DOMAIN — 10 Minutes

### Step 1: Buy Domain
Choose registrar:
- **Sénégal (.sn):** registry.sn or ionos.sn (~$15/year)
- **International:** namecheap.com (~$7/year)

```
Suggested: maasga-climatisation.sn
```

### Step 2: Point to Cloudflare Nameservers

If domain at **Namecheap:**
```
1. Login to Namecheap
2. Go to Dashboard → Domain → Nameservers
3. Change to Custom Nameservers
4. Add Cloudflare nameservers (you'll get from next step)
5. Save & wait 4-24h for propagation
```

If domain at **Registry.sn:**
```
1. Login to registry
2. Modify DNS → Point to Cloudflare
3. (Cloudflare will give exact instructions)
```

### Step 3: Add to Cloudflare Pages
```powershell
# First, add domain to Cloudflare account via dashboard
# Then run:
npx wrangler pages project add-domain maasga-website \
  --domain maasga-climatisation.sn
```

### Step 4: Test
- [ ] Wait 4-24h for DNS propagation
- [ ] Visit https://maasga-climatisation.sn
- [ ] Should load (redirect from old URL works too) ✅

---

## 💾 BACKUP D1 — 15 Minutes (Optional)

### Option A: Manual Backup (Simple)
```powershell
# Run anytime to export DB:
npx wrangler d1 execute maasga_db --remote --command "SELECT * FROM products" > backup_$(date +%Y%m%d).sql

# Save file somewhere safe
```

### Option B: Scheduled Daily Backup (Advanced)
```powershell
# Create Windows Scheduled Task:
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$action = New-ScheduledTaskAction -Execute "powershell" `
  -Argument "-Command `"npx wrangler d1 execute maasga_db --remote --command 'SELECT * FROM products' > 'backup_`$((Get-Date).ToString('yyyyMMdd')).sql'`""
Register-ScheduledTask -TaskName "MAASGA Backup D1" -Trigger $trigger -Action $action
```

### Option C: Cloudflare Workers Cron (Most Reliable)
Creates `functions/backup-d1.ts`:
```typescript
export async function onRequest(context: any) {
  const db = context.env.DB
  const backup = {
    timestamp: new Date().toISOString(),
    products: (await db.prepare('SELECT * FROM products').all()).results,
    clients: (await db.prepare('SELECT * FROM clients').all()).results,
    appointments: (await db.prepare('SELECT * FROM appointments').all()).results
  }
  await context.env.BACKUP_KV?.put(
    'backup-' + new Date().toISOString().split('T')[0],
    JSON.stringify(backup),
    { expirationTtl: 30 * 24 * 60 * 60 }
  )
  return new Response('✅ Backup créé')
}
```

---

## 🧪 VERIFY EVERYTHING WORKS

### Test Checklist
```bash
# 1. Build succeeds
npm run build
# Expected: "✓ built in X.XXs"

# 2. Deploy succeeds
npx wrangler pages deploy dist --project-name maasga-website
# Expected: "✨ Deployment complete! Take a peek over at https://..."

# 3. Site loads
# Open: https://139799f9.maasga-website.pages.dev
# Should see homepage, catalog, all pages load

# 4. Products persist
# - Add climatiseur via admin
# - Refresh browser multiple times
# - Should still be there

# 5. RDV works
# - Fill RDV form
# - Submit
# - Should see confirmation
# - (Optional: Check SMS received)

# 6. Analytics (if configured)
# - Go to Google Analytics Realtime
# - Visit site
# - Should see visit counted

# All tests pass? ✅ YOU'RE GOOD TO GO!
```

---

## 🚨 TROUBLESHOOTING

### Build fails
```powershell
# Clean and retry:
rm -r dist node_modules
npm install
npm run build
```

### Deploy fails
```powershell
# Reauth:
npx wrangler logout
npx wrangler login

# Then retry:
npx wrangler pages deploy dist --project-name maasga-website
```

### SMS not working
```powershell
# Check logs:
npx wrangler tail --project-name maasga-website

# Verify Twilio config in wrangler.jsonc
# Make sure account has credit
```

### Domain not resolving
```bash
# Test DNS:
nslookup maasga-climatisation.sn

# If not working, check:
# 1. Nameservers updated in registrar
# 2. Waited 24h for propagation
# 3. Domain added to Cloudflare Pages correctly
```

---

## 📋 COMPLETION CHECKLIST

- [ ] Site loads at https://139799f9.maasga-website.pages.dev
- [ ] Admin can add climatiseur with media
- [ ] Client can view catalog + add to cart
- [ ] RDV form works
- [ ] Data persists after browser refresh
- [ ] (Optional) Google Analytics configured
- [ ] (Optional) SMS notifications working
- [ ] (Optional) Custom domain pointing correctly

---

## 🎯 URLS TO SAVE

```
Production:        https://139799f9.maasga-website.pages.dev
Admin Dashboard:   https://139799f9.maasga-website.pages.dev/admin
Google Analytics:  https://analytics.google.com
Twilio Console:    https://www.twilio.com/console
Cloudflare Pages:  https://dash.cloudflare.com → Pages
Wrangler Logs:     npx wrangler tail --project-name maasga-website
```

---

## ✅ YOU'RE DONE!

Your MAASGA site is:
- ✅ Live
- ✅ Fully functional
- ✅ Ready for clients
- ✅ Persistent
- ✅ Scalable
- ✅ Secure

Now go get those RDV! 🚀
