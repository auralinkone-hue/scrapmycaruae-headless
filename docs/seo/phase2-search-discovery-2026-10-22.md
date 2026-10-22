# Phase 2 — search discovery and structured data

Scope: development only, starting at `92e2aa483980f4b0c5f1a71ee883e10c7739c23a`. No Wix edits, blog crawl, production deployment, indexing change, DNS, secrets or notification changes.

## Before / after

| Area | Before | Implemented |
| --- | --- | --- |
| Homepage identity | FAQPage only | One connected WebSite + Organization graph with stable IDs, existing name, production URL, logo, phone and email. |
| Article identity | BlogPosting omitted the visible author; raw optional dates | Reuses already-loaded public Wix author and normalized dates/images, includes publisher logo and stable publisher/site IDs; absent author omitted, no extra API requests. The known SMC UAE Team byline is an Organization, not a fictional person. |
| Homepage FAQs | JSON-LD emitted even when CMS hides the section | Emits FAQPage only when the section is visible and has questions. Visible answers and all other page FAQ/breadcrumb sources are retained. |
| Services | No Service schema | Conservative Service descriptions on Sell My Car and Scrap My Car only; UAE coverage, stable business provider, no invented offers, prices or physical branches. |
| Navigation | Header provides six priority destinations; footer omits parent sell/scrap hubs | Adds descriptive Sell My Car and Scrap My Car footer links. Existing Free Quote, Locations, Contact Us and Blogs links remain. No menu redesign. |
| Sharing | Layout default has no image | Existing local automotive image provides OG/Twitter fallback and alt text. Explicit per-page/article images take precedence; titles, descriptions and canonicals remain unchanged. |
| Search crawlers | Production wildcard Allow; staging Disallow and noindex | Unchanged; actual robots handler regression verifies the policy covering Googlebot, Bingbot and OAI-SearchBot. No special AI-only schema or hidden content. |

Organization facts are taken from the existing public header/footer/contact UI. The displayed address identifies an industrial area, not a confirmed precise street/premises location. LocalBusiness, coordinates, opening hours, registrations, review ratings and social `sameAs` are deliberately absent pending evidence. Coverage pages describe service areas, not business branches. No authenticated social URLs were found in the project.

## Structured-data audit and validation boundaries

- Existing manufacturer/service/location BreadcrumbList and FAQPage sources use the same arrays as their visible content. Prior audit evidence records 34 matched FAQ documents; this task does not rerun that crawl.
- Homepage and article schemas reference the same business ID. Nested publisher/provider descriptions reuse that ID, rather than inventing separate businesses.
- Automated tests check identities, absence of unsupported claims, real author/date/image mapping, script-safe JSON serialization, conditional FAQ wiring, service scope and navigation destinations. Existing generated-HTML build tests additionally check default sharing metadata.
- Representative staging HTML/JSON-LD is checked after deployment where access permits; report that outcome separately. Local regression checks are not Google's Rich Results Test or proof of indexing. Staging remains intentionally ineligible for indexing.
- No sitelink, rich-result, ranking or AI citation guarantee is made. Search platforms choose what to display.

## Existing blog connections and editorial opportunities

Current articles already link to their Wix author/category, related articles, latest articles and Free Quote; shared navigation reaches service, manufacturer and location hubs. Parent service and manufacturer pages already expose Wix-backed guides. No new automated article-link insertion was added.

The following retained manifest URLs are candidates for individual Wix editorial review, not claims that these links are presently missing from their article bodies:

| Existing article | Potential contextual destination | Editorial check |
| --- | --- | --- |
| `/post/selling-a-car-with-a-faulty-engine-in-the-uae-your-options` | `/sell-car-with-engine-problems/` | Link where the article explains assessment options. |
| `/post/discover-the-smartest-options-for-dealing-with-a-non-running-car-in-the-uae` | `/sell-non-running-car/` | Link when discussing a car that does not start. |
| `/post/does-flood-damage-impact-your-car-s-scrap-value-uae-specific-guide` | `/sell-flood-damaged-car/` | Distinguish assessment guidance from a diagnosis or fixed price. |
| `/post/can-you-scrap-a-car-without-the-mulkiya-in-the-uae` | `/scrap-my-car/#paperwork-title` | Cite the relevant current authority; missing documents are not the same as expired registration. |
| `/post/how-scrap-car-pickup-works-in-the-uae-what-to-expect-on-collection-day` | `/car-removal/`, `/locations/` | Link the access/collection discussion to actual coverage. |
| `/post/a-step-by-step-guide-to-scrapping-your-car-in-dubai-with-scrap-my-car-uae` | `/locations/dubai/` | Add only if it helps the actual collection discussion. |

Review manufacturer-specific articles individually before linking to the matching `/cars/[make]/` guide. Preserve original Wix slugs, canonical/SEO fields and article content unless an editor authorizes that specific change. Do not append the same list of links to hundreds of posts.

## Business evidence and citation opportunities

Owner confirmation needed: exact registered/trading name if different, full premises address and customer access policy, verified Google Business Profile and official social URLs, current hours, author identity/team affiliation and editorial review process, documented collection conditions/payment methods, and evidence for any licences, certifications, timelines or testimonials. Never infer these from generic area coverage or generated imagery.

Useful future material: anonymized real collection cases with permission; dated vehicle-condition/access examples; a factual document checklist by emirate linked to the relevant official authority; transparent factors affecting valuation without invented instant estimates; clearly attributed expert answers. Keep material visibly useful, source factual/legal statements and record meaningful review dates in Wix. Avoid mass-generated location/make boilerplate and unsupported “best”, “guaranteed” or certification claims.

## External verification still required

- Check Cloudflare WAF, bot protection, AI crawler controls and legitimate crawler IP access in the intended production configuration. Repository robots rules cannot prove these dashboard settings.
- At an approved launch, inspect actual production canonical/indexing/sitemap delivery in Search Console and Bing Webmaster Tools, and the applicable Search Console generative-AI inclusion setting. No production setting is changed here.
- Validate representative public production markup with the relevant schema tools. WebSite/site-name validation differs from Google rich-result eligibility.
- Existing historical intermittent blog availability and live-production verification remain separate Phase 1 follow-ups; they are not re-audited or pronounced resolved here.

## Primary guidance consulted

- [Google sitelinks](https://developers.google.com/search/docs/appearance/sitelinks): automated selection; logical hierarchy and useful anchor text.
- [Google site names](https://developers.google.com/search/docs/appearance/site-names): WebSite identity on the homepage.
- [Google Organization](https://developers.google.com/search/docs/appearance/structured-data/organization) and [Article](https://developers.google.com/search/docs/appearance/structured-data/article): applicable verified fields, authors, publisher and images.
- [Structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies): markup must represent visible content.
- [Google AI search features](https://developers.google.com/search/docs/appearance/ai-features): crawlability, useful content and internal discovery.
- [OpenAI crawlers](https://developers.openai.com/api/docs/bots): OAI-SearchBot is the search crawler; crawler network access matters independently of robots.txt. No training-crawler policy is changed.
- [Schema.org Service](https://schema.org/Service): provider and service-area semantics; not a sitelink guarantee.

## Executed local results

242 tests passed, zero failed/skipped. The staging build passed. The suite includes isolated generated-HTML builds checking default sharing metadata and retained index/noindex protections, plus eight new structured-data/navigation/crawler regressions. The rendered staging FAQ page parsed successfully with one FAQPage containing its ten visible questions, the default OG/Twitter image and staging noindex. No full blog crawl was performed.
