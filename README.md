# PostPurchase — Advertiser Platform

Lightweight self-serve CPC ad network for native offers on partner thank-you pages.

## Stack

- **Next.js 15** — advertiser dashboard
- **Supabase** — auth, Postgres, storage, edge functions
- **Tailwind CSS 4** — minimal high-tech UI

## Setup (real data)

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Copy env vars:

```bash
cp .env.local.example .env.local
```

3. Fill in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` — Project URL (Settings → API)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon public key
   - `NEXT_PUBLIC_API_DOMAIN` — `https://<project-ref>.supabase.co/functions/v1`

### 3. Run database migrations

Install the [Supabase CLI](https://supabase.com/docs/guides/cli), link your project, then:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Or paste these files into the Supabase SQL editor, in order:

1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_ads.sql`
3. `supabase/migrations/003_campaign_destination.sql`
4. `supabase/migrations/004_demo_accounts.sql`
5. `supabase/migrations/005_conversion_goal.sql`
6. `supabase/migrations/006_drop_api_key.sql`
7. `supabase/migrations/007_invoices.sql`
8. `supabase/migrations/008_backfill_campaign_ads.sql`
9. `supabase/migrations/009_ensure_advertiser_profile.sql`
10. `supabase/migrations/010_accounts_and_members.sql`
11. `supabase/migrations/011_campaigns_active_on_launch.sql`
12. `supabase/migrations/012_ad_is_draft.sql`
13. `supabase/migrations/013_click_attribution.sql`
14. `supabase/migrations/014_publisher_placements.sql`

### 4. Deploy edge functions

```bash
npx supabase functions deploy click
npx supabase functions deploy postback
```

Both functions use `verify_jwt = false` (public endpoints).

### 5. Start the app

```bash
npm run dev
```

Open [http://localhost:3000/signup](http://localhost:3000/signup), create an account, then sign in.

### 6. Clear all data (reset database)

The app has **no mock campaigns** in code — the list always comes from Supabase. Old demo rows (e.g. Green Energy Switch) stay until you delete them.

Run in Supabase SQL Editor, or:

```bash
node --env-file=.env.local scripts/wipe-database.mjs
```

Or paste `supabase/scripts/wipe_all_data.sql`.

### 7. Activate your account (first-time)

New campaigns start as **pending** and your wallet starts at **€0**. Run this in the Supabase SQL editor (replace the email):

```sql
-- Fund wallet + approve campaigns for your account
update advertisers
set wallet_balance = 1000
where email = 'you@example.com';

update campaigns
set status = 'approved', on_off = true
where advertiser_id = (
  select id from advertisers where email = 'you@example.com'
);
```

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Email/password sign in |
| `/signup` | Create advertiser account |
| `/dashboard` | Metrics, chart, campaign table |
| `/campaigns` | Campaign list + ads tab |
| `/campaigns/new` | Create campaign |
| `/campaigns/[id]` | Campaign detail |
| `/campaigns/[id]/edit` | Edit campaign |
| `/settings` | Wallet + integration URLs |
| `/publisher/dashboard` | Traffic partner dashboard (same UX as advertiser) |
| `/publisher/manager` | Offers manager (like Campaigns) — Add offer, embed |
| `/p/[placementId]` | Full redirect offers page |
| `/widget/[placementId]` | Public widget preview (no login) |
| `/admin` | Admin portal |

## Edge Functions

**Click** — `GET /click/{campaign_id}?…`

Records click, charges wallet, redirects to destination with `?click_id=...`. Auto-pauses on budget/wallet exhaustion.

Pass attribution on the click URL (widget / thank-you page):

| Query param | Aliases | Stored as |
|-------------|---------|-----------|
| `widget_url` | `wu`, `widget` | Full widget URL; **page** is parsed from `page` param or URL path |
| `publisher_id` | `pub`, `partner` | Traffic partner (UUID from admin) |
| `intent_product` | `intent` | First-intent product |
| `product_choose` | `chosen`, `offer` | Clicked offer (defaults to campaign · ad name) |
| `product_selection` | `offers`, `selection` | JSON array or comma-separated list of all offers shown |
| `geo` | `country`, `geo_country` | ISO country code (fallback: `cf-ipcountry` header) |
| `placement` | `format` | `popup`, `native`, or `in_page` |
| `ad_id` | `ad` | Optional specific ad (else random active ad) |

Lookup attribution by click ID: `GET /api/clicks/{click_id}` (service role).

## Publisher widget (confirmation page)

1. Admin creates a **Traffic partner** account; user signs in at `/login/publisher`.
2. Publisher creates a **Confirmation page** placement (site URL, page path, intent product, format).
3. Copy **Embed code** from the portal and paste on the thank-you page in your other app.
4. Widget loads offers from `GET /api/widget/offers?placement_id=…` and sends clicks to the click edge function with full attribution.

Set `NEXT_PUBLIC_APP_URL` to your public app URL (e.g. ngrok) when embedding from another origin.

**Postback** — `GET /postback?click_id={CLICK_ID}`

Records a conversion for the click. Event type comes from the campaign's conversion goal. Dedupes by `click_id`. Optional `value` param for revenue tracking.

## Design

- Background `#FBFBFD`, text `#0A0A0A`, accent `#5B47FB`
- Inter (UI) + Geist Mono (IDs, URLs, keys)
- Thin borders, rounded-2xl cards, status pills
