# Commerce

## Critical Principle

**Commerce must NEVER distort editorial truth.**

The order is always:
```
EDITORIAL VALUE → VERIFICATION → CONTENT → COMMERCE OPPORTUNITY
```

NOT:
```
COMMERCE COMMISSION → NEWS
```

## Commerce Types

Every commerce recommendation must identify its type:

| Type | Label | Description |
|------|-------|-------------|
| `editorial` | Editorial | Genuinely helpful recommendation |
| `affiliate` | Affiliate | Revenue-generating affiliate link |
| `sponsored` | Sponsored | Paid partnership (must be disclosed) |
| `local_discovery` | Local Discovery | Local merchant/business highlight |

## Opportunity Identification

The CommerceIdentificationAgent evaluates each story for legitimate opportunities:

**Examples:**
- Story: "Heavy rain in Depok" → Rain gear, umbrella, waterproof products
- Story: "New cafe in Kemang" → Merchant profile, food discovery guide
- Story: "Traffic policy change" → Transportation guide, mobility services

**Rules:**
- Only recommend if genuinely helpful to residents
- NEVER fabricate product availability or pricing
- NEVER let commerce influence editorial decisions
- Return `recommendation_strength: 'none'` when not relevant

## Quality Gate

Commerce recommendations must satisfy:
1. **Relevance** — Actually helpful for the story topic
2. **Locality** — Specific to Depok where applicable
3. **Availability** — Not fabricating stock/pricing
4. **Transparency** — Clear commercial relationship labeling

If not satisfied: return `NO OPPORTUNITY`.

## Product Model

```typescript
interface ProductRecommendation {
  name: string;
  category: string;
  price_range: string | null;  // "IDR 50-200jt" or null
  merchant_id: string | null;
  affiliate_link: string | null;
  tracking_url: string | null;
  relevance_score: number;  // 0-100
}
```

## Affiliate Abstraction

All affiliate operations go through `AffiliateProvider` interface:
- Never expose affiliate logic throughout the application
- All affiliate links go through tracking URLs
- Revenue is tracked via `content_performance.revenue`

## Commerce Badge

In the admin UI, all commerce elements display:
```html
<span class="commerce-badge">EDITORIAL | AFFILIATE | SPONSORED</span>
```
