# ClothCraft

ClothCraft is an AI virtual try-on product for combining a model photo with one or more garment images. The core experience lives directly in the homepage Hero.

Production domain: `clothycraft.ai`

## Product Rules

| User | Daily try-ons | Garments per result | Watermark |
| --- | ---: | ---: | --- |
| Anonymous | Login required | 0 | N/A |
| Free | 3 | 1 | ClothCraft |
| Paid | 20 | 1-3 | None |

Daily usage resets at midnight in `America/New_York`, including daylight-saving time changes. Paid access requires an active, unexpired subscription record.

## AI Provider

The try-on flow uses Volcano Engine Seedream 5.0 Lite only:

- Model: `doubao-seedream-5-0-260128`
- Endpoint: `/api/v3/images/generations`
- Input: lowercase PNG, JPEG, or WebP Base64 data URLs
- Output: one 2K PNG
- Native provider watermark: disabled
- Free watermark: added server-side with `sharp`

The dedicated endpoint is `GET/POST /api/try-on`. Existing starter image, video, and chat routes remain separate.

## Pricing

ClothCraft exposes one paid plan with monthly and yearly billing:

- Monthly list price: `$19.90`
- Yearly list price: `$199`

Future promotional prices (`$9.90` monthly and `$99` yearly) should be implemented with Creem coupons or discounts, not hard-coded into the app.

Legacy Starter and Pro plan keys remain in the billing catalog for webhook and historical subscription compatibility, but they are hidden from public pricing.

## Local Setup

Install dependencies:

```bash
pnpm install
```

Copy the environment template if `.env.local` does not exist:

```bash
Copy-Item .env.example .env.local
```

Configure at least:

```dotenv
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."

VOLCANO_ENGINE_API_KEY="..."
VOLCANO_ENGINE_API_URL="https://ark.cn-beijing.volces.com/api/v3"

CREEM_API_KEY="..."
CREEM_WEBHOOK_SECRET="..."
CREEM_CLOTHCRAFT_MONTHLY_PRODUCT_ID="prod_..."
CREEM_CLOTHCRAFT_YEARLY_PRODUCT_ID="prod_..."

RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="ClothCraft <onboarding@resend.dev>"
```

The Resend test sender only delivers to the email address associated with the Resend account. Use a verified domain before sending to other recipients.

Start development:

```bash
pnpm dev:webpack
```

Open `http://localhost:3000`.

## Validation

```bash
pnpm lint
pnpm test
pnpm build
```

## Main Files

- `components/hero.tsx`: homepage try-on workspace
- `app/api/try-on/route.ts`: auth, subscription, quota, generation, and watermark flow
- `lib/image-generation.ts`: input validation, plan rules, prompt, and Eastern day window
- `lib/try-on-watermark.ts`: free-plan ClothCraft watermark
- `lib/volcano-engine/image.ts`: Seedream API integration
- `constants/billing.ts`: billing catalog and Creem product IDs
- `messages/en.json`, `messages/zh.json`: product translations

Do not commit `.env.local` or expose provider, Google, database, payment, or email secrets in client code.
