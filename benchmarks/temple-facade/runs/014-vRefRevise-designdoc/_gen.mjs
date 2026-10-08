// Trial 014-vRefRevise-designdoc — Temple of the Vermilion Meridian.
// Second-pass facade: ONE connected plane, engaged minarets, deep recessed iwan
// + ranked pointed-arch niches, layered relief (no flat field > ~6 wide), bold
// red/blue/gold triad held against the white reference. Generator builds a voxel
// grid (carving recesses by exclusion), then greedy-meshes into fill ops.
import { writeFileSync } from "node:fs";

const RED = "minecraft:cut_red_sandstone";
const LAPIS = "minecraft:lapis_block";
const GOLD = "minecraft:gold_block";
const QZ = "minecraft:smooth_quartz";

const CX = 23;                 // center axis
const W0 = 0, W1 = 46;         // facade width  (47)
const grid = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const S = (x, y, z, b) => grid.set(key(x, y, z), b);
const G = (x, y, z) => grid.get(key(x, y, z));
const mir = (x) => W1 - x;     // mirror about center (46-x), W0+W1 = 46

function F(x0, x1, y0, y1, z0, z1, b) {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) S(x, y, z, b);
}
function D(x0, x1, y0, y1, z0, z1) {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) grid.delete(key(x, y, z));
}
// pointed (two-centred) arch: top y of opening for a column at offset dx
function archTop(dx, hw, springY) {
  const R = 2 * hw, d = Math.abs(dx) + hw;
  const h = Math.max(0, Math.floor(Math.sqrt(Math.max(0, R * R - d * d))));
  return springY + h;
}
// a recessed pointed-arch opening, blue (lapis) back, quartz tracery outline
function archRecess(cx, hw, yBot, springY, traceColor = QZ) {
  for (let dx = -hw; dx <= hw; dx++) {
    const x = cx + dx;
    const top = archTop(dx, hw, springY);
    // carve the front layers (exclusion); keep the deep back, face it in lapis
    D(x, x, yBot, top, 3, 6);
    F(x, x, yBot, top, 0, 1, RED);
    F(x, x, yBot, top, 2, 2, LAPIS);   // recessed blue back face (depth 4)
    // quartz outline voxel just above the arch crown of this column
    S(x, top + 1, 6, traceColor);
  }
  // vertical quartz jambs framing the opening
  F(cx - hw - 1, cx - hw - 1, yBot, springY, 6, 6, traceColor);
  F(cx + hw + 1, cx + hw + 1, yBot, springY, 6, 6, traceColor);
}

// ---------------------------------------------------------------- PLINTH
// full-width red base with panelised relief (pilaster strips + recessed lapis panels)
F(W0, W1, 0, 3, 0, 6, RED);
// recessed shadow panels between pilaster strips (every ~8); each panel <=6 wide
for (let px = 2; px <= 39; px += 8) {
  const a = px, b = Math.min(px + 5, 45);
  D(a, b, 1, 2, 5, 6);
  F(a, b, 1, 2, 4, 4, LAPIS);
}
// gold string-course along the plinth head, quartz cap above it
F(W0, W1, 3, 3, 7, 7, GOLD);
F(W0, W1, 4, 4, 0, 7, QZ);

// ---------------------------------------------------------------- BODY MASS
// main red field between the engaged minarets
F(5, 41, 5, 30, 0, 6, RED);
// ENGAGED MINARETS — bonded to the body, projecting forward as relief (not free pillars)
for (const base of [0, 42]) {
  const a = base, b = base + 4;
  F(a, b, 0, 37, 0, 8, RED);            // tall engaged shaft, projects to z=8
  // quartz banding rings up the shaft -> vertical relief, never a flat field
  for (let y = 8; y <= 34; y += 5) F(a, b, y, y, 0, 8, QZ);
  F(a, b, 35, 35, 0, 8, GOLD);         // gold collar below the kiosk
  // chattri kiosk: quartz drum + small gold cupola crowning the minaret
  F(a + 1, b - 1, 36, 37, 0, 7, QZ);
  F(a + 1, b - 1, 38, 38, 0, 6, GOLD);
  S(a + 2, 39, 5, GOLD); S(a + 2, 40, 5, GOLD); // tiny finial
}

// ---------------------------------------------------------------- CENTRAL IWAN
// great pointed-arch recess, deep blue, the one mass that governs the rest
const IHW = 4, ISPRING = 20, IBOT = 5;
archRecess(CX, IHW, IBOT, ISPRING);
// pishtaq: rectangular gold-and-quartz frame wrapping the iwan, projecting forward
F(16, 30, 4, 29, 6, 7, GOLD);            // gold border block...
D(17, 29, 5, 28, 6, 7);                  // ...hollowed to a 1-thick frame (front layers)
// re-carve the iwan opening through the frame interior so the blue reads to full height
archRecess(CX, IHW, IBOT, ISPRING);
// quartz inner fillet just inside the gold pishtaq
F(17, 17, 5, 28, 7, 7, QZ); F(29, 29, 5, 28, 7, 7, QZ); F(17, 29, 28, 28, 7, 7, QZ);
// spandrel medallions: lapis squares with gold centres in the iwan spandrels
for (const sx of [19, 27]) {
  F(sx - 1, sx + 1, 24, 26, 6, 6, LAPIS);
  S(sx, 25, 7, GOLD);
}
// small gold-outlined pointed doorway at the iwan foot (axial solstice door)
F(21, 25, 5, 5, 3, 3, GOLD);             // threshold
F(20, 20, 5, 9, 3, 3, GOLD); F(26, 26, 5, 9, 3, 3, GOLD);
S(23, 11, 3, GOLD); S(22, 10, 3, GOLD); S(24, 10, 3, GOLD);

// ---------------------------------------------------------------- FLANKING NICHES
// two stacked ranked niches each side; pilaster piers between read as engaged bays
function nicheColumn(cx) {
  archRecess(cx, 3, 6, 12);              // lower niche
  archRecess(cx, 3, 18, 22);             // upper niche
  // gold sill string-course separating the two niches
  F(cx - 4, cx + 4, 16, 16, 6, 7, GOLD);
  // quartz pilaster fillets framing the niche bay
  F(cx - 4, cx - 4, 5, 27, 7, 7, QZ);
  F(cx + 4, cx + 4, 5, 27, 7, 7, QZ);
  // floret medallion in the upper-niche spandrel
  F(cx - 1, cx + 1, 24, 25, 6, 6, LAPIS); S(cx, 24, 7, GOLD);
}
nicheColumn(10);
nicheColumn(mir(10)); // 36

// ---------------------------------------------------------------- UPPER FRIEZE + PARAPET
// frieze band across the body head: gold dividers + recessed lapis blind-panels (no flat field)
F(5, 41, 28, 28, 6, 7, GOLD);            // lower frieze line
for (let px = 6; px <= 40; px += 6) {
  const a = px, b = Math.min(px + 3, 40);
  F(a, b, 29, 30, 6, 6, LAPIS);          // recessed blue panel
}
F(5, 41, 31, 31, 6, 7, GOLD);            // upper frieze line
// parapet cap + merlon crenellation along the whole skyline
F(W0, W1, 31, 31, 0, 7, QZ);
for (let x = W0; x <= W1; x += 2) F(x, x, 32, 32, 0, 6, x % 4 === 0 ? QZ : GOLD);

// intermediate chattri kiosks flanking the drum (echo the reference's four corner kiosks)
for (const cx of [14, mir(14)]) {        // 14 and 32
  F(cx - 1, cx + 1, 32, 34, 0, 6, QZ);
  F(cx - 1, cx + 1, 35, 35, 0, 6, GOLD);
  S(cx, 36, 5, GOLD);
}

// ---------------------------------------------------------------- DRUM + ONION DOME
// gold drum
F(18, 28, 32, 35, 0, 6, GOLD);
F(18, 28, 32, 32, 0, 7, QZ);             // quartz ring at drum base
// onion dome — neck pinch, belly that OVERHANGS the drum, tapering crown
const dome = [          // [y, radius]
  [36, 4], [37, 5], [38, 6], [39, 6], [40, 5], [41, 4], [42, 3], [43, 2], [44, 1],
];
for (const [y, r] of dome) F(CX - r, CX + r, y, y, 0, 6, GOLD);
// gold finial above the dome
S(CX, 45, 5, GOLD); F(CX - 1, CX + 1, 45, 45, 5, 5, GOLD);
F(CX, CX, 46, 47, 5, 5, GOLD);

// ============================================================ GREEDY MESH -> fills
const claimed = new Set();
const cells = [...grid.keys()].map((k) => {
  const [x, y, z] = k.split(",").map(Number);
  return { x, y, z, b: grid.get(k) };
});
cells.sort((a, b) => a.y - b.y || a.z - b.z || a.x - b.x);
const placements = [];
const free = (x, y, z, b) => grid.get(key(x, y, z)) === b && !claimed.has(key(x, y, z));
for (const c of cells) {
  if (claimed.has(key(c.x, c.y, c.z))) continue;
  const { b } = c;
  let x1 = c.x; while (free(x1 + 1, c.y, c.z, b)) x1++;
  let y1 = c.y;
  grow_y: for (; ;) {
    for (let x = c.x; x <= x1; x++) if (!free(x, y1 + 1, c.z, b)) break grow_y;
    y1++;
  }
  let z1 = c.z;
  grow_z: for (; ;) {
    for (let x = c.x; x <= x1; x++)
      for (let y = c.y; y <= y1; y++) if (!free(x, y, z1 + 1, b)) break grow_z;
    z1++;
  }
  for (let x = c.x; x <= x1; x++)
    for (let y = c.y; y <= y1; y++)
      for (let z = c.z; z <= z1; z++) claimed.add(key(x, y, z));
  placements.push({ op: "fill", from: [c.x, c.y, c.z], to: [x1, y1, z1], block: b });
}

const artifact = {
  schema_version: "1.0.0",
  metadata: {
    trial_id: "014-vRefRevise-designdoc",
    prompting_method_id: "temple-facade-reference-revise.v0",
    model_id: "claude-opus-4-8",
    seed: 11,
    server_state_id: "flat-creative-superflat.v1",
  },
  style: {
    name: "Mughal sun-temple (Vermilion Meridian)",
    rationale:
      "2nd pass: kept the red/blue/gold triad against the white reference and " +
      "deepened it — recessed the iwan and ranked niches to depth-4 blue, wrapped " +
      "the iwan in a projecting gold pishtaq, and resolved the corner towers into " +
      "ENGAGED minarets bonded to a single facade plane (quartz-banded, chattri-" +
      "capped) instead of free pillars. Broke every wide flat field with pilaster " +
      "fillets, string-courses, a blind-panel frieze and merlon parapet. Fixed the " +
      "crown: onion dome now pinches at the neck and its belly overhangs the drum.",
  },
  palette: { manifest: [RED, LAPIS, GOLD, QZ] },
  placements,
};

const out = new URL("./artifact.json", import.meta.url);
writeFileSync(out, JSON.stringify(artifact, null, 2));
console.error(`placements: ${placements.length}, cells: ${cells.length}`);
