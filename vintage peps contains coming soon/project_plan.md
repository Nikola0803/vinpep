# Vintage Peptides — Project Plan

## 1. Project Description
Vintage Peptides is a premium research peptide e-commerce brand with an old-world, apothecary-inspired visual identity. The site serves researchers and laboratories seeking high-purity peptide compounds. The core value is trust through transparency — batch COAs, HPLC purity data, and a rigorous testing philosophy communicated through a distinctive vintage aesthetic.

**Target Users:** Research scientists, lab technicians, academic researchers in the US.
**Core Value:** 99%+ purity peptides with transparent COAs and vintage brand trust.

## 2. Page Structure
- `/` — Home (ticker, hero, accordion, trust pillars, categories, product grid, editorial, brand story, bundles, blog, newsletter, footer)
- `/shop` — Full product catalog with search, filter, sort
- `/product/:id` — Product detail page (COA, tests, dosage, variants)
- `/about` — Brand story, founding principles, testing standards
- `/faqs` — Frequently asked questions accordion page
- `/contact` — Contact form + hours + location
- `/track-order` — Order tracking lookup
- `/bundles` — Bundle/stack product pages
- `/login` — Age-gated login page
- `/register` — Age-gated registration page
- `/cart` — Shopping cart page (mock for now)

## 3. Core Features
- [ ] Age gate modal (21+ research confirmation) on first visit
- [ ] Authentication wall — login required to browse
- [ ] Scrolling ticker bar
- [ ] Sticky navigation with VP monogram
- [ ] Hero section with dark espresso gradient + vials imagery
- [ ] "Why We're Different" accordion strip
- [ ] 4-icon trust pillars
- [ ] Category 4-tile grid (Compounds, Blends, Bioregulators, Capsules)
- [ ] Product grid with filter tabs, badges, star ratings
- [ ] "Popular" and "Featured" product rows
- [ ] Editorial trust strip (photo + testing copy)
- [ ] Brand story section
- [ ] Bundles/stack cards
- [ ] Research blog cards ("The Archive")
- [ ] Newsletter subscription
- [ ] Shopping cart (mock — visual + local state)
- [ ] Full footer with 4 columns + disclaimer

## 4. Data Model Design

### Table: profiles (extends auth.users)
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | FK to auth.users |
| full_name | text | User's full name |
| institution | text | Research institution |
| created_at | timestamp | Account creation |

### Table: products
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| name | text | Product name |
| peptide_code | text | Italic peptide identifier |
| cas_number | text | CAS registry number |
| category | text | compounds/blends/bioregulators/capsules |
| subcategory | text | peptides/blends/glp/metabolic |
| purity | text | e.g. "99%+" |
| price_min | numeric | Starting price |
| price_max | numeric | Top price range |
| dosage | text | e.g. "5mg / 10mg / 15mg" |
| description | text | Product description |
| image_url | text | Product image |
| rating | numeric | Star rating (0-5) |
| featured | boolean | Show in featured |
| popular | boolean | Show in popular |
| coa_url | text | COA document link |
| test_url | text | Test results link |
| created_at | timestamp | |

### Table: bundles
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | PK |
| name | text | Bundle name |
| contents | text[] | List of included peptides |
| original_price | numeric | Sum of individual prices |
| bundle_price | numeric | Discounted bundle price |
| savings_pct | integer | Savings percentage |
| image_url | text | Bundle image |

### Table: blog_posts
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | PK |
| title | text | Post title |
| excerpt | text | Short excerpt |
| date | date | Publication date |
| category | text | Research / Testing / Protocol |
| image_url | text | Cover image |

## 5. Backend / Third-party Integration Plan
- **Supabase Auth:** Required for login/register. Row-level security on all tables.
- **Supabase Database:** Products, bundles, blog posts, profiles, cart items (for authenticated users).
- **Stripe:** Not needed in Phase 1-3. Mock cart only. Will integrate in future phase if requested.
- **Shopify:** Not needed. Products stored in Supabase.

## 6. Development Phase Plan

### Phase 1: Design System + Home Page
- Goal: Establish the full visual identity (colors, fonts, textures) and build the complete Home page with all sections.
- Deliverable: Fully styled homepage with ticker, hero, accordion, trust pillars, categories, product grid, editorial, brand story, bundles, blog, newsletter, footer. Age gate modal. Mock data for all sections.

### Phase 2: Shop + Product Detail + Cart Pages
- Goal: Build the full product catalog experience.
- Deliverable: Shop page with search/filter/sort, Product detail page with COA/tests tabs, Cart page with add/remove/update. All using mock data.

### Phase 3: Auth System + About / FAQs / Contact / Track Order
- Goal: Connect Supabase auth and build all remaining static/dynamic pages.
- Deliverable: Login/Register with age gate, protected routes, About, FAQs, Contact, Track Order pages. Auth context wrapper.

### Phase 4: Supabase Data Integration
- Goal: Replace mock data with real Supabase data for products, bundles, blog posts.
- Deliverable: All pages pulling from Supabase DB. Admin would manage data through Supabase dashboard.