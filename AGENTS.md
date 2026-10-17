## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)


## Service-page design requirements

Apply these defaults when creating or updating service pages:
- Design the phone layout intentionally. Keep the hero heading to two readable lines, then the description, then QuoteForm, then the feature/trust points. Do not put the points ahead of the form on phones.
- Reuse SectionActionButton for action links, preserving the existing site pill shape, green styling and circular icon treatment. Every CTA must have an appropriate icon. Do not invent a separate button style for a new page.
- Automotive photos need a premium responsive frame, with subtle decorative graphics confined behind the photo. Captions must be on a clean white background with strong contrast, at least 14px text and comfortable line height on phones. Never let patterns overlap caption text.
- Verify the hero line count, element order, photo captions, CTA icons and overflow at 390, 430, 768, 1024 and 1440px before finishing.

- Avoid arrow-only CTA controls on service and coverage pages. Use descriptive pill buttons with meaningful icons; keep ordinary navigation links semantically distinct.
- Vary photographic section types. Use full-width image backgrounds with high-contrast text overlays, floating readable panels and compact supporting information, rather than repeating 50/50 image-and-paragraph sections.
- Use restrained page reveals, image hover zoom and button feedback. Honour prefers-reduced-motion, retain keyboard support, and keep content readable without JavaScript. Do not add heavy animation libraries.
