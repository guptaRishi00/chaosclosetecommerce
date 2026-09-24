# nextjs-fullstack

Next.js 15 (App Router) · TypeScript · MongoDB/Mongoose · JWT cookie auth (jose) · Zod · Cloudinary · Tailwind v4 · cash on delivery.

## Run

```bash
cp .env.example .env.local   # fill in; the server refuses to boot if anything is missing
bun install
bun dev
```

## Where things go

| Need | Put it in |
| --- | --- |
| Mutation from our own UI | Server Action in `lib/actions/<domain>.actions.ts` — check `getSession()` first, validate with the domain's Zod schema, then `revalidatePath` |
| Endpoint called by someone else (webhook, partner, mobile app) | Route Handler in `app/api/.../route.ts` |
| Input shape | `lib/validations/<domain>.ts` — the same schema is used by the client form (`useValidatedAction`) and the server |
| Collection | `models/<Name>.ts` (`models.X ?? model(...)` pattern) |
| New protected area | add the prefix to `PROTECTED_PREFIXES` **and** `config.matcher` in `middleware.ts` |

## Auth

`lib/auth.ts` → `signToken`, `verifyToken`, `getSession`, `setSessionCookie`, `clearSessionCookie`.
The JWT (HS256, 7 days) lives in an `httpOnly`, `SameSite=Strict`, `Secure`-in-production cookie.
It's checked three times: `middleware.ts` (redirect), `(dashboard)/layout.tsx` (server render), and inside every
Server Action (they're public POST endpoints that middleware doesn't gate).
`lib/auth.ts` must stay Edge-safe; password hashing (scrypt) is in `lib/password.ts`.

## Orders (cash on delivery)

No online payments. `placeOrder` (`lib/actions/checkout.actions.ts`) → `placeOrderWithStock` (`lib/stock.ts`):
one MongoDB transaction takes the units with a guarded `$inc` (fails if the size has fewer left) and creates the
order — so stock can't be oversold, even under concurrent orders. Payment is `pending` ("to collect") until the
admin marks the order delivered, which records the cash as collected. Returns can put stock back once.

## Known limits

- `lib/rate-limit.ts` is in-memory and **per instance**. Use a shared store (e.g. Upstash Redis) before relying on it on serverless.
