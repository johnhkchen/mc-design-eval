# mc-design — guidelines for Figma Make

Paste this file into the Make file's `guidelines/Guidelines.md` before the first prompt. Make reads it on every prompt, so
the per-page prompts can stay short.

## What this is

mc-design (mc-design.b28.dev) designs Minecraft towns and buildings that fit a player's own land, and delivers them as
schematics a Create-mod schematicannon pastes in survival. The site is the public catalog and portfolio, and later the
place where players upload their land and get a town back.

- Audience: players on our server, and the wider Minecraft public. Not developers.
- The site's job: show real builds, prove they fit real land, and make a player want one.
- The catalog is the product: every building in it was approved and built on a real server.

## Pages (routes)

| Route | Page |
|---|---|
| `/` | Home |
| `/catalog` | Catalog: grid of building thumbnails, filter by type |
| `/catalog/:id` | Building: one 3-D view with a print scrubber, specs, materials, download |
| `/projects/:id` | Case study: 3-D before/after scrubber, the story, the buildings used |
| `/how` | How it works |
| `/board` | Construction board (an ops tool for the builder and client; plainer than the rest) |
| `/upload` | Coming soon: upload your land (survey → plan → town) |

Top navigation: Catalog, Projects, How it works, Board. A Sign in with Discord button sits at the right of the nav.

## Content rules

- Use the real content in the attached data. Never invent buildings, clients, numbers or testimonials.
- Builds are credited by gamer name: the client is **Antipolar**. The town is **Dragonholde**.
- Projects: **DH-01 Polarton** (working name; built) and **DH-02 Swamp reclamation** (earthworks planned, not built).
- Buildings are numbered like a catalog: "No. 04 · Church". The number comes from the id (`polarton-04-church` → 04).
- Specs use real units: plot in blocks (12 × 14), height in blocks, block count, cannon time at 1.5 seconds per block.
- Say "schematic" and "schematicannon", never "blueprint file". The download is a `.nbt` file.
- Do not use Minecraft, Mojang or Microsoft logos, the Minecraft wordmark, or the Minecraft font. Footer says: "Not
  affiliated with Mojang or Microsoft."

## Voice

- Plain, confident, short sentences. Write like a builder talking to a player.
- Name things the way players do: plot, street, terrain, cannon, materials.
- Never: "unleash", "seamless", "revolutionize", "AI-powered" in headlines, emoji as icons, exclamation marks.

## Visual rules

- The builds are the design. Renders and 3-D views are large; chrome is quiet.
- Not pixel-art kitsch: no pixel fonts, no grass-block borders, no creeper faces.
- Must work in light and dark (follow the system setting), at phone width (390 px) and desktop (1280 px+).
- Body text at least 16 px. Small text only for captions and spec lines.
- Use one accent colour for actions and the current page. Status colours (queued, loaded, running, done) are separate.
- Specs and coordinates use a monospace face with tabular numbers.
- Visible keyboard focus on everything interactive.

## Components that matter

- **3-D viewer (building page).** A large canvas area, about 4:3, sky-tinted background. Shows the render image as a
  poster until loaded. Under it: a ▶ Print button, a scrubber (0 → all blocks), and a live caption
  "412 / 868 blocks · 10 min of cannon time". Drag rotates, scroll zooms. Build it as a placeholder that shows the
  poster image; the real WebGL view is wired in later.
- **Before/after scrubber (case studies, home).** A wide canvas area, about 16:10, with a vertical divider and a round
  handle, "Before" tag top-left and "Built" (or "Planned") tag top-right. Dragging the divider reveals the after image
  over the before image. Placeholder: two attached render images, same framing.
- **Catalog card.** Square thumbnail, eyebrow "No. 04 · civic", the name, one spec line "12 × 14 plot · 868 blocks".
- **Spec list.** Label/value pairs: Plot, Door, Blocks, Cannon time, Version, Built in.
- **Board job row.** Status chip (queued / loaded / running / done / dropped), title, file name, world corner with a
  copy button, blocks and hours. This page can be denser and more utilitarian than the rest.

## Technical constraints

- React + TypeScript, Tailwind is fine. Keep components small and named for what they show.
- Data comes from the attached `catalog.json`; keep it in one data file so it can be swapped for an API later.
- No real sign-in, payments, or uploads: show the UI and stub the action.
- Don't add pages or features that aren't listed here.
