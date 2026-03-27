# Viršupis — GEO (Generative Engine Optimization) Plan

**Goal:** Make virsupis.com appear in AI-generated answers (ChatGPT, Perplexity, Google AI Overviews, Bing Copilot, Gemini) when people in Lithuania search for private residential developments / houses to buy.

**Current state:** Technical foundation implemented. Content-dependent tasks waiting for finalized pages.

---

## Implementation Status

### Done
- [x] `robots.txt` — AI crawlers explicitly allowed (GPTBot, ClaudeBot, PerplexityBot, etc.) — `public/robots.txt`
- [x] `llms.txt` — machine-readable site summary for LLMs — `public/llms.txt`
- [x] XML Sitemap — `@astrojs/sitemap` installed and configured, auto-generates `sitemap-index.xml`
- [x] Organization JSON-LD schema — company info, address, contact, logo, social links — `BaseLayout.astro`
- [x] Open Graph meta tags — title, description, image, locale (lt_LT) — `BaseLayout.astro`
- [x] Twitter/X meta tags — summary_large_image card — `BaseLayout.astro`
- [x] Canonical URLs — per-page canonical tags — `BaseLayout.astro`
- [x] hreflang tags — lt language signal — `BaseLayout.astro`
- [x] Google Business Profile — live

### Waiting for content
- [ ] RealEstateListing JSON-LD schema — needs finalized specs, pricing, confirmed dates
- [ ] FAQPage JSON-LD schema — needs FAQ content written
- [ ] FAQ section on site — needs finalized project details and pricing
- [ ] Blog/guide articles (3-5 in Lithuanian) — better once site has pages to link to
- [ ] Restructure first 200 words for AI extraction — page content not final yet
- [ ] `llms-full.txt` — full content dump, pointless until content is finalized
- [ ] Update `llms.txt` — expand with new pages as they are added

### External / non-code tasks (can start anytime)
- [ ] Register virsupis.lt domain and redirect to virsupis.com
- [ ] List on Aruodas.lt and Domoplius.lt
- [ ] Media outreach (Delfi, 15min, VZ.lt, Statybunaujienos.lt)
- [ ] YouTube property tour videos
- [ ] LinkedIn thought leadership (Mindaugas Plisas)
- [ ] Directory listings (Rekvizitai.lt, Apple Maps, Waze)

---

## How AI Search Engines Choose Sources

Understanding this is critical before acting:

| Factor | Impact |
|--------|--------|
| **Third-party mentions** | Brands in top 25% for web mentions get **10x more AI citations** |
| **Multi-platform presence** | Sites on 4+ platforms are **2.8x more likely** to appear in ChatGPT |
| **Statistics & original data** | Adding stats increases citation probability by **37%** |
| **Direct-answer structure** | Opening paragraphs answering queries get cited **67% more often** |
| **FAQ schema markup** | Pages with FAQPage schema are **3.2x more likely** to appear in Google AI Overviews |
| **Recency signals** | "Last Updated" dates and fresh statistics outperform older content |
| **Content rendered server-side** | AI crawlers cannot execute JavaScript — SSR content is mandatory |

**Platform-specific preferences:**
- **ChatGPT:** Favors Wikipedia (47.9% of citations), authoritative sources, specific data
- **Perplexity:** Cites 3x more sources, favors Reddit (6.6%), conversational/experience-driven content
- **Google AI Overviews:** Emphasizes E-E-A-T, fresh content, featured-snippet-friendly formatting

---

## Phase 1: Technical Foundation (Week 1–2)

### 1.1 Create `robots.txt` — Allow AI Crawlers

Currently missing. Create `/public/robots.txt`:

```
User-agent: *
Allow: /

# AI Search Crawlers — explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Bytespider
Allow: /

Sitemap: https://www.virsupis.com/sitemap-index.xml
```

### 1.2 Create `llms.txt` — Machine-Readable Site Summary

Place at `/public/llms.txt`. This emerging standard (llmstxt.org) gives LLMs a structured overview of the site:

```markdown
# Viršupis

> Privatus namų kvartalas Antakalnyje, Vilniuje. 32 dvibučiai namai šalia Pavilnių regioninio parko.
> Private residential community of 32 semi-detached homes in Antakalnis, Vilnius, Lithuania, adjacent to Pavilniai Regional Park.

## Key Facts
- Location: Viršupio Sodų g. 2A, Vilnius, Lithuania (Antakalnis district)
- Type: Gated residential community (privatus namų kvartalas)
- Units: 32 semi-detached homes (dvibučiai namai)
- Home sizes: 79–162 m²
- Plot sizes: 200–400 m²
- Available from: April 2026
- Heating: Geothermal
- Amenities: Community pool, shared spaces, gated security
- Developer contact: Mindaugas Plisas, mindaugas@virsupis.com

## Pages
- [Home](https://www.virsupis.com/): Main landing page with project overview
- [Preview](https://www.virsupis.com/preview): Full project details, philosophy, amenities, and specifications

## Social
- Instagram: @virsupis_vilnius
```

Also create `/public/llms-full.txt` — a Markdown dump of the full site content (all text from preview.astro) so LLMs can ingest everything in one request.

### 1.3 Add XML Sitemap

Install `@astrojs/sitemap` and configure in `astro.config.mjs`:

```bash
npm install @astrojs/sitemap
```

```js
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.virsupis.com',
  integrations: [sitemap()],
});
```

### 1.4 Add Structured Data (JSON-LD Schema Markup)

Add to `BaseLayout.astro` `<head>`:

**a) Organization schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Viršupis",
  "url": "https://www.virsupis.com",
  "logo": "https://www.virsupis.com/images/logo.svg",
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "mindaugas@virsupis.com",
    "contactType": "sales"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Viršupio Sodų g. 2A",
    "addressLocality": "Vilnius",
    "addressRegion": "Vilniaus apskritis",
    "postalCode": "10101",
    "addressCountry": "LT"
  },
  "sameAs": [
    "https://www.instagram.com/virsupis_vilnius/"
  ]
}
```

**b) RealEstateListing schema (on preview page):**
```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": "Viršupis — Privatus namų kvartalas Vilniuje",
  "description": "32 dvibučiai namai Antakalnyje, šalia Pavilnių regioninio parko. 79–162 m² namai, 200–400 m² sklypai.",
  "url": "https://www.virsupis.com/preview",
  "datePosted": "2025-01-01",
  "image": "https://www.virsupis.com/images/hero.webp",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Viršupio Sodų g. 2A",
    "addressLocality": "Vilnius",
    "addressRegion": "Vilniaus apskritis",
    "addressCountry": "LT"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "54.7167",
    "longitude": "25.3167"
  },
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "EUR",
    "availability": "https://schema.org/PreOrder",
    "availabilityStarts": "2026-04-01"
  },
  "numberOfRooms": "2-5",
  "floorSize": {
    "@type": "QuantitativeValue",
    "minValue": 79,
    "maxValue": 162,
    "unitCode": "MTK"
  }
}
```

**c) FAQPage schema (once FAQ content is created — see Phase 2)**

### 1.5 Add Open Graph & Twitter Meta Tags

In `BaseLayout.astro`:

```html
<meta property="og:title" content="Viršupis — Privatus namų kvartalas Vilniuje" />
<meta property="og:description" content="32 dvibučiai namai Antakalnyje, šalia Pavilnių regioninio parko. Nuo 79 m², sklypai nuo 200 m²." />
<meta property="og:image" content="https://www.virsupis.com/images/hero.webp" />
<meta property="og:url" content="https://www.virsupis.com" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="lt_LT" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Viršupis — Privatus namų kvartalas Vilniuje" />
<meta name="twitter:description" content="Privatus namų kvartalas Antakalnyje, Vilniuje" />
<meta name="twitter:image" content="https://www.virsupis.com/images/hero.webp" />
```

### 1.6 Add Canonical Tags & hreflang

```html
<link rel="canonical" href="https://www.virsupis.com/" />
<link rel="alternate" hreflang="lt" href="https://www.virsupis.com/" />
```

---

## Phase 2: Content for AI Discoverability (Month 1–2)

AI engines cite **content that directly answers questions**. The current site is beautifully designed but its narrative/editorial style makes it hard for AI to extract citable facts. This phase adds AI-friendly content.

### 2.1 Add FAQ Section to the Site

Create a dedicated FAQ section (or page) answering the questions Lithuanian homebuyers actually ask AI. Structure: question as H3, answer as a direct 40–60 word paragraph, then detail.

**Priority questions to answer:**

**About the project:**
- Kas yra Viršupis? (What is Viršupis?)
- Kur yra Viršupis kvartalas? (Where is the Viršupis community?)
- Kiek namų yra Viršupyje? (How many homes are in Viršupis?)
- Kokio dydžio namai Viršupyje? (What size are the homes?)
- Kada galima įsikelti į Viršupį? (When can you move in?)
- Kiek kainuoja namas Viršupyje? (How much does a house cost?)
- Ar Viršupis yra uždara gyvenvietė? (Is Viršupis a gated community?)

**About buying a house in Lithuania (broader queries):**
- Kaip nusipirkti namą Vilniuje? (How to buy a house in Vilnius?)
- Kokie nauji gyvenamieji kvartalai Vilniuje 2026? (New residential developments in Vilnius 2026?)
- Privatus namas ar butas — kas geriau? (Private house or apartment — which is better?)
- Kiek kainuoja naujas namas Vilniuje? (How much does a new house cost in Vilnius?)

**Each answer must include:** specific numbers (m², unit count, dates), the location (Antakalnis, Vilnius), and a clear factual statement AI can extract.

### 2.2 Add "Last Updated" Dates

Add visible "Atnaujinta: 2026-XX-XX" dates to content. AI engines strongly favor recent content.

### 2.3 Restructure Key Content for AI Extraction

The first 200 words on the preview page should contain a **self-contained factual summary**:

> Viršupis — tai privatus 32 dvibučių namų kvartalas Antakalnyje, Vilniuje, šalia Pavilnių regioninio parko. Namų plotas nuo 79 iki 162 m², sklypai nuo 200 iki 400 m². Kvartalas siūlo geoterminį šildymą, bendruomenės baseiną, uždarą teritoriją ir tiesioginę prieigą prie miško. Įsikėlimas nuo 2026 m. balandžio.

This paragraph is designed to be directly citable by any AI engine answering "What is Viršupis?" or "New residential developments in Vilnius."

### 2.4 Blog / Guide Content (High Impact)

Create 3–5 blog posts in Lithuanian targeting common AI queries. These become the pages AI engines cite:

| Article | Target Query |
|---------|-------------|
| "Nauji gyvenamieji kvartalai Vilniuje 2026: Pilnas gidas" | "nauji namai Vilniuje", "gyvenamieji kvartalai Vilnius" |
| "Kaip išsirinkti privatų namą Vilniuje" | "kaip nusipirkti namą", "ką žiūrėti perkant namą" |
| "Privatus namas vs butas Vilniuje: Palyginimas" | "namas ar butas", "privatus namas privalumai" |
| "Antakalnis: Kodėl tai geriausias rajonas gyventi Vilniuje" | "geriausi rajonai Vilniuje", "Antakalnis gyvenimui" |
| "Geoterminis šildymas privačiame name: Ką reikia žinoti" | "geoterminis šildymas namuose", "šildymo sistemos namui" |

**Content structure for each article:**
1. Direct answer in first 200 words (TLDR)
2. Specific statistics and numbers
3. H2/H3 headings as questions
4. FAQ schema markup
5. "Last Updated" date
6. Internal link to Viršupis project page

---

## Phase 3: Authority & Third-Party Signals (Month 2–4)

This is the most impactful phase for AI citation. AI engines primarily cite brands that are **mentioned by others across multiple platforms**.

### 3.1 Real Estate Portals

List the project on:
- **Aruodas.lt** — Lithuania's dominant real estate portal
- **Domoplius.lt** — second largest portal
- **NT.lt** — additional coverage

These portals are indexed by AI crawlers and feed entity recognition.

### 3.2 Google Business Profile

Create/optimize a Google Business Profile for Viršupis:
- Complete all fields (address, hours, photos, description)
- Add Google Posts weekly (construction updates, renders, area photos)
- Encourage early buyer reviews
- Use Q&A section — seed it with common questions
- This directly feeds Google AI Overviews for local queries

### 3.3 Media Coverage (Earned)

Target Lithuanian publications:
- **Delfi.lt** — largest Lithuanian news portal
- **15min.lt** — major news/lifestyle
- **VZ.lt** — business news (ideal for developer profile)
- **Statybunaujienos.lt** — construction industry
- **Būsto pasaulis** — housing/real estate media

Pitch angles:
- "Unique small-scale development philosophy vs. mass builders"
- "Geothermal heating in Lithuanian residential development"
- "The growing demand for gated communities in Vilnius"
- "Developer interview: Mindaugas Plisas on quality over quantity"

### 3.4 Social & Community Presence

- **Instagram** (@virsupis_vilnius): Already active. Post construction progress, area beauty shots, design details. Use Lithuanian hashtags.
- **YouTube**: Create property tour videos, area walkthroughs, construction progress timelapses. YouTube transcripts are indexed by AI engines.
- **LinkedIn**: Mindaugas Plisas thought leadership posts about residential development, market insights, building philosophy.
- **Reddit**: Engage in r/lithuania, r/Vilnius when housing topics come up. Organic mentions only — not promotional.
- **Facebook**: Create a page and community group. Lithuanian homebuyers are heavily active on Facebook.

### 3.5 Directory Listings

List on:
- Rekvizitai.lt (Lithuanian business directory)
- Google Maps
- Apple Maps
- Waze
- TripAdvisor (for the area/neighborhood)

---

## Phase 4: Ongoing Optimization (Monthly)

### 4.1 Content Freshness
- Update all statistics quarterly
- Add new FAQ questions as they arise
- Publish monthly construction updates with photos
- Update "Last Updated" dates

### 4.2 Monitor AI Mentions
- Regularly query ChatGPT, Perplexity, and Google for:
  - "Nauji namai Vilniuje" / "New houses in Vilnius"
  - "Viršupis"
  - "Privatus namų kvartalas Vilnius"
  - "Geriausios gyvenvietės Vilniuje"
- Track which competitors appear and what content is cited
- Tools: Semrush AIO, Conductor, or manual checking

### 4.3 Publish Original Data
- If possible, publish quarterly market insights:
  - Average price per m² in Antakalnis
  - Demand trends for private houses vs apartments
  - Construction cost trends
- **Original data makes you a primary source** — AI engines are 3.7x more likely to cite original data

---

## Lithuanian-Specific SEO/GEO Considerations

### Language
- Lithuanian is highly inflected — keyword research must cover all grammatical cases:
  - "namas" (house, nom.) → "namo" (gen.) → "namą" (acc.) → "name" (loc.) → "namai" (pl.)
  - "kvartalas" → "kvartalo" → "kvartalą" → "kvartale" → "kvartalai"
- Ensure all diacritics are correct: ą, č, ę, ė, į, š, ų, ū, ž
- Content must be natively written Lithuanian, not translated

### Domain
- Current domain (virsupis.com) works, but consider also registering **virsupis.lt** and redirecting it — .lt domains signal local relevance to Google and Lithuanian users

### Search Landscape
- Google.lt dominates Lithuanian search (95%+ market share)
- AI Overviews are rolling out on google.lt
- Lithuanian users increasingly use ChatGPT and Perplexity in Lithuanian

---

## Implementation Priority Summary

| Priority | Task | Impact | Effort |
|----------|------|--------|--------|
| 1 | robots.txt + AI crawler access | High | 30 min |
| 2 | llms.txt + llms-full.txt | Medium | 1 hour |
| 3 | Sitemap integration | High | 30 min |
| 4 | JSON-LD structured data | High | 2 hours |
| 5 | Open Graph / Twitter meta tags | Medium | 1 hour |
| 6 | FAQ section with schema | Very High | 4 hours |
| 7 | Factual summary in first 200 words | High | 1 hour |
| 8 | Google Business Profile | Very High | 2 hours |
| 9 | Aruodas.lt / Domoplius.lt listings | Very High | 3 hours |
| 10 | Blog/guide content (3–5 articles) | Very High | 2–3 days |
| 11 | Media outreach / PR | Very High | Ongoing |
| 12 | YouTube content | High | Ongoing |
| 13 | Original market data | High | Ongoing |

---

## Expected Timeline

- **Weeks 1–2:** Technical foundation (robots.txt, llms.txt, sitemap, schema, meta tags)
- **Month 1–2:** Content creation (FAQ, blog posts, page restructuring)
- **Month 2–4:** Authority building (media, portals, Google Business, social)
- **Month 3–6:** First AI mentions start appearing
- **Month 6+:** Consistent presence in AI search results for Lithuanian residential development queries

---

## Key Metrics to Track

1. **AI mentions:** Does "Viršupis" appear when querying ChatGPT/Perplexity/Google AI for "nauji namai Vilniuje"?
2. **Organic traffic:** Google Search Console impressions and clicks
3. **Referral traffic from AI:** Check analytics for traffic from chat.openai.com, perplexity.ai
4. **Schema validation:** Google Rich Results Test passes
5. **Brand search volume:** "Viršupis" search volume in Google Trends (Lithuania)
6. **Third-party mentions:** Count of external sites mentioning Viršupis

---

*Plan created: 2026-03-27*
*Sources: Search Engine Land, Frase.io, Foundation Inc, Schema.org, llmstxt.org, Semrush, and 20+ additional sources on GEO best practices.*
