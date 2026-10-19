// 16 West 48th Street, 2005 mixed residential and commercial tower. Massing follows the lidar roof as five clean tiers
// (open court, 9-block south wing, 24-block limestone-and-brick podium on the 48th Street (north, low z) frontage, a
// 105-block glass tower, and a 114-block crown on its north-east core with a mechanical penthouse). A 3x3 mode filter
// removes lidar spikes at the tier edges. The shell is one block thick with an air gap behind it and a floor slab every
// storey (no interiors). Storeys are 3 blocks: spandrel row, two rows of pane between mullion piers. The podium has
// storefronts with a canopied entrance; glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1087455.cells.json`, "utf8"));
const X = 20, Y = 125, Z = 26;

const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));

// Lidar roof -> tier. Below 5 is open ground (court, no building); 5..12 the south wing; 13..60 the podium.
const tierOfRoof = (r) => (r <= 4 ? "open" : r <= 12 ? "low" : r <= 60 ? "podium" : r <= 109 ? "tower" : "crown");
const TOP = { low: 9, podium: 24, tower: 105, crown: 114 };      // block tops: whole storeys (3 each) on the lidar

// Mode filter over the building tiers (open ground is not a vote): a cell takes a neighbour's tier only when that
// tier outnumbers its own among the 3x3 footprint cells around it.
const raw = new Map(cells.map(([x, z, , r]) => [key(x, z), tierOfRoof(r)]));
const tier = new Map();
for (const [k, t] of raw) {
  if (t === "open") { tier.set(k, t); continue; }
  const [x, z] = k.split(",").map(Number);
  const votes = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const u = raw.get(key(x + dx, z + dz));
    if (u && u !== "open") votes.set(u, (votes.get(u) ?? 0) + 1);
  }
  let best = t;
  for (const [u, n] of votes) if (n > (votes.get(best) ?? 0)) best = u;
  tier.set(k, best);
}

// Columns of the building: the cells that carry a tier, with their ground and top.
const col = new Map();
for (const [k, { ground }] of foot) {
  const t = tier.get(k);
  if (t === "open") continue;
  col.set(k, { ground, tier: t, top: TOP[t] });
}
const inV = (x, y, z) => { const c = col.get(key(x, z)); return !!c && y >= c.ground && y < c.top; };
const exposed = (x, y, z) =>
  !inV(x + 1, y, z) || !inV(x - 1, y, z) || !inV(x, y, z + 1) || !inV(x, y, z - 1) || !inV(x, y + 1, z) || !inV(x, y - 1, z);

// Materials: tower and crown are blue-grey curtain wall on precast piers; the podium is limestone-coloured piers with
// brick spandrels; the south wing is brick with plain glass.
const MAT = {
  crown: { pier: "light_gray_concrete", spandrel: "gray_concrete", pane: "light_blue_stained_glass_pane", base: "polished_granite", cornice: "polished_granite" },
  tower: { pier: "light_gray_concrete", spandrel: "gray_concrete", pane: "light_blue_stained_glass_pane", base: "polished_granite", cornice: "polished_granite" },
  podium: { pier: "smooth_quartz", spandrel: "stone_bricks", pane: "light_blue_stained_glass_pane", base: "polished_granite", cornice: "smooth_quartz" },
  low: { pier: "bricks", spandrel: "stone_bricks", pane: "glass_pane", base: "polished_granite", cornice: "polished_granite" },
};

// The block for one exposed cell of the shell. The top row is the cornice, the ground row the base course, the
// 48th Street frontage has storefronts on its first two rows, and each storey line (y % 3 == 0) is a spandrel.
function skinBlock(x, y, z) {
  const c = col.get(key(x, z)), m = MAT[c.tier];
  if (y === c.top - 1) return m.cornice;
  if (y === c.ground) return m.base;
  const zFace = !inV(x, y, z - 1) || !inV(x, y, z + 1);
  const xFace = !inV(x - 1, y, z) || !inV(x + 1, y, z);
  const idx = zFace && !xFace ? x : z;                     // position along the face the cell is on
  if (z === 0 && zFace && (c.tier === "podium" || c.tier === "low") && (y === c.ground + 1 || y === c.ground + 2))
    return idx % 3 === 0 ? m.base : "glass";              // storefront with granite mullions
  if (y % 3 === 0) return m.spandrel;
  if ((zFace && xFace) || idx % 3 === 0) return m.pier;
  return m.pane;
}

const isPane = (name) => name === "light_blue_stained_glass_pane" || name === "glass_pane";
const g = new Voxels([X, Y, Z]);
const panes = [];
for (const [k, c] of col) {
  const [x, z] = k.split(",").map(Number);
  for (let y = c.ground; y < c.top; y++) {
    if (exposed(x, y, z)) {
      const name = skinBlock(x, y, z);
      g.set(x, y, z, name);
      if (isPane(name)) panes.push([x, y, z]);
    } else if (y % 3 === 0) g.set(x, y, z, "smooth_stone");   // floor slab, one per storey
  }
}

// Foundations: solid from y 0 up to each cell's ground.
for (const [k, { ground }] of foot) {
  if (ground <= 0) continue;
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "polished_granite");
}

// The entrance on the 48th Street frontage: a two-leaf-high door in the storefront, under a canopy at the storey line.
for (const y of [1, 2]) {
  g.set(9, y, 0, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
}
for (let x = 8; x <= 11; x++) g.set(x, 3, 0, "black_concrete");

// Warm lights: glowstone in the air gap behind a deterministic share of the panes.
const hash = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; };
let lamps = 0;
for (const [x, y, z] of panes) {
  if (hash(x, y, z) % 7 !== 0) continue;
  const [dx, dz] = !inV(x, y, z - 1) ? [0, 1] : !inV(x, y, z + 1) ? [0, -1] : !inV(x - 1, y, z) ? [1, 0] : [-1, 0];
  const [tx, ty, tz] = [x + dx, y, z + dz];
  if (!inV(tx, ty, tz) || exposed(tx, ty, tz) || ty % 3 === 0) continue;
  g.set(tx, ty, tz, "glowstone");
  lamps++;
}

// Pane connections: a pane joins the neighbouring panes, glass and piers, so the grid reads as one wall.
for (const [x, y, z] of panes) {
  const joins = (dx, dz) => g.get(x + dx, y, z + dz) !== null;
  const state = { north: String(joins(0, -1)), south: String(joins(0, 1)), east: String(joins(1, 0)), west: String(joins(-1, 0)), waterlogged: "false" };
  g.set(x, y, z, g.get(x, y, z).block, state);
}

// Mechanical penthouse on the crown: a 6 x 5 box of three storeys, louvred on its perimeter, with a roof slab.
for (let x = 5; x <= 10; x++) for (let z = 7; z <= 11; z++) {
  for (let y = 114; y <= 116; y++) {
    const edge = x === 5 || x === 10 || z === 7 || z === 11;
    g.set(x, y, z, edge && y === 115 ? "gray_concrete" : "light_gray_concrete");
  }
  g.set(x, 117, z, "gray_concrete");
}

const stats = g.save(`${DIR}/NYC1087455.nbt`);
console.log(JSON.stringify({ ...stats, panes: panes.length, glowstone: lamps, tiers: Object.fromEntries(["open", "low", "podium", "tower", "crown"].map((t) => [t, [...tier.values()].filter((v) => v === t).length])) }));
