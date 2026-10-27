// Way 291095274: a three-storey 1930s brick commercial block with a stripped-classical plaster frame, on the
// volcanic-basalt-plinth Mt Eden / Eden Terrace street grid. Facade ring = brick piers, glass panes in plaster
// string courses, a shopfront with dark-timber piers, a recessed-by-air window gap with lanterns, a plaster cornice,
// a gravel roof and a plant-room setback. Solid core (no interiors) except one air cell behind each window.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291095274.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291095274.nbt";
const W = 34, D = 40, H = 26;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { x, z, g: ground, r: roof });
const inF = (x, z) => cell.has(key(x, z));

// Smooth the lidar roof into flat tiers: the median of each cell's 3x3 neighbourhood (lone low cells and 12-vs-13 noise go).
for (const c of cell.values()) {
  const rs = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cell.get(key(c.x + dx, c.z + dz)); if (n) rs.push(n.r); }
  rs.sort((a, b) => a - b); c.R = rs[rs.length >> 1];
}

// Which sides of a footprint cell are open to the outside, and so what kind of facade cell it is.
const miss = (x, z, dx, dz) => !inF(x + dx, z + dz);
const isRing = (x, z) => miss(x, z, 0, -1) || miss(x, z, 0, 1) || miss(x, z, -1, 0) || miss(x, z, 1, 0);
// A convex corner: open on one vertical and one horizontal side, with the diagonal outside too.
const rawCorner = (x, z) => {
  const N = miss(x, z, 0, -1), S = miss(x, z, 0, 1), Wd = miss(x, z, -1, 0), E = miss(x, z, 1, 0);
  return (N || S) && (Wd || E) && !inF(x + (Wd ? -1 : 1), z + (N ? -1 : 1));
};
function face(x, z) {
  const N = miss(x, z, 0, -1), S = miss(x, z, 0, 1), Wd = miss(x, z, -1, 0), E = miss(x, z, 1, 0);
  // Pilasters only on an isolated corner: a staircase edge has a corner in every step, so those cells stay wall.
  if (rawCorner(x, z) && ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => rawCorner(x + dx, z + dz))) return { kind: "corner" };
  if (N) return { kind: "face", out: "north", inward: [0, 1], idx: x, along: "ew" };
  if (S) return { kind: "face", out: "south", inward: [0, -1], idx: x, along: "ew" };
  if (Wd) return { kind: "face", out: "west", inward: [1, 0], idx: z, along: "ns" };
  if (E) return { kind: "face", out: "east", inward: [-1, 0], idx: z, along: "ns" };
  return null;
}

// Entrance: the north-facing wall, at the middle of its run.
const northFace = [...cell.values()].filter((c) => face(c.x, c.z)?.out === "north").sort((a, b) => a.x - b.x);
const door = northFace[northFace.length >> 1];

// Inward distance from the outside (street) for the plant-room setback.
const dist = new Map();
const queue = [];
for (const c of cell.values()) {
  if (isRing(c.x, c.z)) { dist.set(key(c.x, c.z), 1); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const n = cell.get(key(c.x + dx, c.z + dz));
    if (n && !dist.has(key(n.x, n.z))) { dist.set(key(n.x, n.z), d + 1); queue.push(n); }
  }
}

const v = new Voxels([W, H, D]);
const windowCarve = [];   // [x, z, inward dx, dz, ground, roof, lamp] to open after the solid pass
const doorCanopy = [];

// Pass 1: foundation, solid core, facade skin.
for (const c of cell.values()) {
  const { x, z, g, R } = c;
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone_bricks");             // foundation up to the cell's own ground
  for (let y = g; y < R; y++) v.set(x, y, z, "stone");                    // solid core: no interiors
  const f = face(x, z);
  if (!f) continue;
  for (let y = g; y < R; y++) {
    const d = y - g;
    let b;
    if (d === 0) b = "polished_blackstone_bricks";                        // base course
    else if (f.kind === "corner") b = "smooth_quartz";                    // stripped-classical pilaster
    else if (y === R - 1) b = "smooth_quartz";                            // cornice
    else if (d % 4 === 0) b = "smooth_quartz";                            // storey string course
    else if (d % 4 === 3) b = d === 3 ? "smooth_quartz" : "bricks";       // transom / spandrel
    else if (f.idx % 3 === 0) b = d < 4 ? "dark_oak_planks" : "bricks";   // pier (ground: timber shopfront pier)
    else {
      const states = f.along === "ew"
        ? { east: "true", west: "true", north: "false", south: "false" }
        : { north: "true", south: "true", east: "false", west: "false" };
      v.set(x, y, z, "glass_pane", states);
      continue;
    }
    v.set(x, y, z, b);
  }
  const isDoor = x === door.x && z === door.z;
  if (f.kind === "face" && f.idx % 3 !== 0 && !isDoor && inF(x + f.inward[0], z + f.inward[1])) {
    windowCarve.push({ x, z, f, g, R });
  }
}

// Entrance: two-high dark oak door with a canopy over the walk, cantilevered off the transom.
{
  const { x, z, g } = door;
  v.set(x, g + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(x, g + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) if (!inF(x + dx, z - 1)) doorCanopy.push([x + dx, g + 3, z - 1, dx]);
}

// Pass 2: open the air gap behind each window (one cell deep, never through a ring cell), then the lamps.
for (const w of windowCarve) {
  const { x, z, f, g, R } = w;
  const cx = x + f.inward[0], cz = z + f.inward[1];
  if (isRing(cx, cz)) continue;
  const h = (x * 7 + z * 3 + g) % 15;
  for (const d of [1, 2, 5, 6, 9, 10]) {                                    // the window rows (d % 4 is 1 or 2)
    if (g + d >= R - 1) continue;
    v.set(cx, g + d, cz, "air");
    if (d % 4 === 2 && (h + d) % 3 === 0) v.set(cx, g + d, cz, "lantern", { hanging: "true" });  // hangs from the core above the head
  }
  if (h % 5 === 0) v.set(cx, g + 1, cz, "glowstone");                       // warm lamp on the sill, behind the glass
}
for (const [x, y, z, dx] of doorCanopy) {
  v.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  if (dx === 0) v.set(x, y - 1, z, "lantern", { hanging: "true" });
}

// Roof: parapet caps on the ring, gravel on the flat roof, and a plant-room setback set in from the street.
for (const c of cell.values()) {
  const { x, z, R } = c;
  if (isRing(x, z)) v.set(x, R, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  else v.set(x, R, z, "gravel");
}
for (const c of cell.values()) {
  const { x, z, R } = c;
  const d = dist.get(key(x, z)) ?? 0;
  if (d < 10) continue;
  for (const y of [R + 1, R + 2]) v.set(x, y, z, "stone_bricks");
  v.set(x, R + 3, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  if (d === 10 && (x + z) % 2 === 0) v.set(x, R + 1, z, "iron_bars");
}

const stats = v.save(OUT);
console.log(`way_291095274: ${cells.length} footprint cells, ${stats.blocks} blocks, ${stats.palette} palette entries -> ${OUT}`);
