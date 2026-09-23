# Editable MOLD Editorial Experience

## Goal
Turn the homepage’s hero, lookbook, and Instagram areas into a premium fashion-editorial experience using the existing MOLD lifestyle photography, while giving admins a simple place to update every image and line of copy.

## What will be built

### Storefront
- Rework the homepage hero into a full-bleed campaign banner with editable label, headline, supporting copy, image, and links.
- Replace the current basic lookbook block with an asymmetrical magazine-style editorial composition using portrait, landscape, and detail photography.
- Rebuild the Instagram section as a more deliberate visual feed with editable handle, profile link, images, captions, and post links.
- Add a dedicated `/lookbook` page for the full campaign story, with its own metadata and responsive editorial layout.
- Keep current MOLD typography, high-contrast palette, sharp geometry, and kinetic streetwear character.

### Admin
- Add a “Site content” entry to `/admin` alongside product management.
- Add `/admin/content` with separate editors for:
  - Hero banner
  - Editorial/lookbook story
  - Instagram feed
- Support image previews, image URLs, alt text, captions, links, ordering, visibility, and copy fields.
- Include clear save feedback and refresh the storefront content immediately after saving.

### Content storage and safety
- Add a `site_content` table with seeded hero, editorial, and Instagram content so the first load is complete.
- Allow public read access only to published site content.
- Restrict create/update/delete access to verified admins through the existing role system.
- Use the project’s existing server-side admin checks and public read pattern.

## Technical details
- Store each editable section as a named JSON content document with publish state and timestamps; this keeps the editorial schema flexible without coupling it to products.
- Add public content query/server-function utilities and admin-only content read/update functions.
- Add reusable `EditorialLookbook` and `InstagramFeed` presentation components shared by the homepage and lookbook page.
- Use the existing bundled MOLD images as initial seeded campaign assets; admins can replace them with final campaign image URLs at any time.
- Add complete per-route title, description, Open Graph title/description, `og:type`, and Twitter card metadata.
- Verify signed-out storefront rendering, signed-in admin editing, save persistence, mobile/desktop layouts, and current build diagnostics.
