# Figma Make prompts for mc-design.b28.dev

## How to run them

1. Create a Make file. Paste `Guidelines.md` into its `guidelines/Guidelines.md`. Do this once: it saves repeating the
   brief in every prompt.
2. Run **Prompt 1**. It's front-loaded: the shell, the home page and the visual direction in one go.
3. Run the page prompts **one at a time**, in order, and check each before the next. Small scope gives better output
   and uses fewer credits.
4. For fixes, select the element in the preview and prompt about just that ("make this card's spec line monospace"),
   or attach a screenshot of the problem.
5. At most 3 attachments per prompt. Attachments are direction, not pixel specs. Files are in `attach/`.
6. To compare directions, duplicate the file after Prompt 1 and run one of the alternative direction lines in each.

Bringing it back: Make writes React. We keep the site in Astro + Svelte, so its code is a reference, not a drop-in.
Download the code or push it to GitHub from Make's settings, then I port the layout and styles across and wire the real
3-D views and data.

---

## Prompt 1 — shell and home

Attach: `current-home.png`, `dh01-before.jpg`, `dh01-after.jpg`

```
Build the mc-design website described in Guidelines.md: the shared layout (top nav, footer) and the Home page. Stub
the other routes with a page title so the nav works.

Home, top to bottom:
1. Hero, two columns on desktop, stacked on phones. Left: eyebrow "Minecraft towns, made to fit the land", headline
   "Send us your land. Get back a town you can build.", one paragraph: "Each town is designed around the hills, water
   and trees of the land you send us. You get schematics a schematicannon pastes in survival, with world coordinates
   and the materials list." Two buttons: "Browse the catalog" (primary), "See a town come together" (secondary).
   Right: the before/after scrubber from Guidelines.md, using the two attached renders (before = the bare hill,
   after = the town). Caption: "DH-01 Polarton, for Antipolar in Dragonholde. Drag the divider."
2. Three short points: "Fits your land", "Builds in survival", "A catalog that grows".
3. "From the catalog": four catalog cards and a link "All 8 buildings →".
4. "Projects": two large cards, DH-01 Polarton (Built) and DH-02 Swamp reclamation (Earthworks planned).
5. "Coming: upload your own land": three numbered steps, Survey, Plan, Town.

The attached screenshot is the current site: keep its content and order, improve the design.

Direction: a builder's pattern book, like the mail-order house catalogs of 1880 to 1930, the era these builds come
from. Confident slab or grotesque headings, plain sans body text, monospace specs, copper-green accent, generous
white space. Light and dark.
```

Alternative direction lines (swap for the last paragraph, one per duplicated file):

- `Direction: a surveyor's field book: graph-paper texture used sparingly, contour-line motifs, ink-blue and ochre,
  condensed headings, specs set like survey notes.`
- `Direction: a quiet modern gallery: near-white or near-black ground, the renders as the only colour, one bold
  grotesque for headings, everything else small and precise.`

## Prompt 2 — catalog

Attach: `catalog.json`, `polarton-04-church.jpg`, `polarton-07-owners-house.jpg`

```
Build /catalog from the attached catalog.json. Header: eyebrow "The catalog", title "Buildings", one paragraph:
"Every building here has been approved and built on a real server. Each sits on a standard plot with its door to the
street, ready to drop into a town." Filter chips by type (all, industry, civic, house, workshop, farm), then a grid of
catalog cards: 4 across on desktop, 2 on tablets, 1 on phones. Use the attached renders as thumbnails for the church
and owner's house; give the rest a sky-tinted placeholder with the building name.
```

## Prompt 3 — building page

Attach: `current-building.png`, `polarton-04-church.jpg`

```
Build /catalog/:id, shown for the Church (polarton-04-church). Desktop: the 3-D viewer from Guidelines.md on the left
(about 60%), details on the right. Phones: viewer first. Details: back link "← Catalog", eyebrow
"No. 04 · civic · Southern mill village, 1880–1930", title "Church", spec list (Plot 12 × 14 blocks, 27 high; Door
faces the street; Blocks 868; Cannon time about 22 min at 1.5 s a block; Version Minecraft 1.21.1; Built in DH-01
Polarton, Dragonholde), "Main materials" in two columns from catalog.json, a primary button "Download the schematic
(.nbt)", and a note: "Paste with Create's schematicannon using Replace Solid with Solid. It carries no air, so it won't
remove anything already there." Make the Print scrubber work on the placeholder: moving it updates the caption.
```

## Prompt 4 — case study

Attach: `current-project.png`, `dh01-before.jpg`, `dh01-after.jpg`

```
Build /projects/:id, shown for DH-01. Top: tabs DH-01 / DH-02, eyebrow "DH-01 · Built · for Antipolar in Dragonholde
· 93 × 90 blocks", title "Polarton (working name)", lede "A bare hillside west of the village, turned into a terraced
working town: gin, smithy and barns by the stream, school, church and houses up on the plateau." Then a full-width
before/after scrubber with the attached renders. Then three short sections side by side: "The land", "The plan",
"The build" (write two sentences each from the lede; no invented numbers). Then "The buildings": catalog cards for
all 8 from catalog.json. For DH-02 the after tag reads "Planned" and there are no building cards.
```

## Prompt 5 — how it works

```
Build /how: title "From your land to a town you can paste", then five numbered steps with a short paragraph each:
Capture (export your land with Create's Schematic and Quill), Plan (roads, plots and earthworks over your land; we
count the blocks and the cannon time), Kit (buildings from the catalog on standard plots with accessible approaches),
Deliver (files split so every cannon gets the same work, each with world corner, paste mode and materials), Build
(paste in survival; the board tracks every job). Then a short "Behind it" paragraph: an AI pipeline plans each
project once, cheaper models build variations, plain code places the blocks, and a person approves every building.
Make the steps feel like a process, not a feature grid.
```

## Prompt 6 — construction board

Attach: `board.png` (screenshot of /board)

```
Build /board as a denser, utilitarian tool in the same visual language. Header stats: Projects, Cannons busy (0/20),
Blocks left, Cannon-hours left, Critical path, Est. finish. Left: a top-down site map with parcels DH-01 and DH-02 and
job footprints coloured by status. Right: "Next up", the jobs ready to load. Below: the cannon yard (20 slots, idle
or showing the job) and a schedule chart with one row per cannon. Then each project's tasks by stage (capture, plan,
earthworks, buildings) with job rows from Guidelines.md. Tapping a status chip advances it: queued → loaded →
running → done. Sample data: 15 earthworks jobs for DH-02 (staging, A–H fills, A/C/E digs).
```

## Prompt 7 — upload (coming soon) and sign-in

```
Build /upload as a "coming soon" page: a drop zone for an .nbt export (disabled, with "Coming soon"), and the three
stages Survey, Plan, Town with one line each and a small illustration slot. Also add a "Sign in with Discord" button
at the right of the nav that opens a small modal explaining that signed-in players will be able to request builds.
No real auth.
```

---

## Iteration prompts that work well

- `Keep everything else the same. Only change <element>: <what>.`
- `On phones (390 px wide) the <section> overflows. Stack it and keep a 16 px side margin.`
- `Dark mode: <element> is unreadable. Fix its colours using the existing theme tokens.`
- `Replace any invented text on this page with content from catalog.json or Guidelines.md.`
