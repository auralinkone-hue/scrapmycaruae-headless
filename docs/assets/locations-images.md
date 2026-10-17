# UAE locations hub assets

Two website photographs were created with built-in image generation, inspected, then encoded as 1200 × 900 WebP images. The original generated PNGs are not required by the application.

- `public/sections/uae-vehicle-collection.webp`: ordinary mid-age silver sedan with mild bumper damage securely positioned on a plain flatbed recovery truck in a spacious UAE industrial yard. Recovery operator checking the secured vehicle from the ground. Pale concrete warehouses, practical loading area, warm daylight, believable everyday vehicle wear. Professional documentary photography; no text, branding, readable plates, maps, badges or 3D graphics.
- `public/sections/uae-car-recovery-access.webp`: technician assessing access around an older dark grey sedan beside concrete columns in underground UAE apartment parking. Narrow manoeuvring space, visible ramp and overhead pipes, plain workwear, authentic lighting and realistic scale. No towing action or oversized truck inside the garage. Professional documentary photography; no readable text, logos, plates, signs, watermarks or 3D graphics.

Both prompts used the `photorealistic-natural` use case and landscape 4:3 composition. Rounded frames and decorative graphics are CSS; caption text is HTML on a separate white surface.

The SVG coverage overview uses generalised geographic coordinates from [ARE.geo.json](https://github.com/johan/world.geo.json/blob/master/countries/ARE.geo.json). It shows no branches, internal administrative boundaries or recovery routes. Coverage-directory links currently lead to named sections of `/locations/`; separate emirate pages do not exist in this application yet.
