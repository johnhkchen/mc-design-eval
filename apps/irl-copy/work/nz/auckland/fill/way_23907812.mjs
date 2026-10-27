// Davis Law Library, Auckland (way 23907812): a 1970s-80s concrete-frame university block, read from the lidar record.
// Three flat tiers (10, 13, 16 blocks: 2.5, 3 and 4 storeys, parapet to 17) stepping in toward the taller NW corner;
// a stone plinth on the foundation fill, light concrete panels with glass bands between dark stone piers, a flush
// entrance with a canopy band on the south face, glowstone behind some windows, and a planted roof on the low tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_23907812.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const fp = new Map();                                          // "x,z" -> { x, z, g (ground), roof, tier }
for (const [x, z, g, roof] of cells) fp.set(key(x, z), { x, z, g, roof, tier: 0 });
const at = (x, z) => fp.get(key(x, z));

// Massing: the lidar roof is noisy, so snap each cell to the nearest tier, then take the 3x3 majority twice (ties keep
// the cell's own tier) so each tier is one flat, clean step.
const TIERS = [10, 13, 16];
const nearest = (h) => TIERS.reduce((a, b) => (Math.abs(b - h) < Math.abs(a - h) ? b : a));
for (const c of fp.values()) c.tier = nearest(c.roof);
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const c of fp.values()) {
    const n = new Map();
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const o = at(c.x + dx, c.z + dz); if (o) n.set(o.tier, (n.get(o.tier) || 0) + 1);
    }
    let best = c.tier, bn = n.get(c.tier) || 0;
    for (const [t, k] of n) if (k > bn) { best = t; bn = k; }
    next.set(key(c.x, c.z), best);
  }
  for (const c of fp.values()) c.tier = next.get(key(c.x, c.z));
}

// Faces: a side is exposed to the outside of the footprint, or to a lower tier (a setback wall rising off the step).
const DIRS = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };
for (const c of fp.values()) {
  c.faces = Object.entries(DIRS).filter(([, [dx, dz]]) => { const o = at(c.x + dx, c.z + dz); return !o || o.tier < c.tier; }).map(([d]) => d);
  c.ext = Object.entries(DIRS).filter(([, [dx, dz]]) => !at(c.x + dx, c.z + dz)).map(([d]) => d);
  c.perim = c.faces.length > 0;
  c.face = c.faces[0];
}

const g = new Voxels([55, 29, 55]);
const solid = new Set();
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); solid.add(`${x},${y},${z}`); };
const isSolid = (x, y, z) => solid.has(`${x},${y},${z}`);

// Entrance: the south face where the street runs (fallback any outward face), the lowest ground, nearest the middle.
const entranceCands = [...fp.values()].filter((c) => c.ext.length).sort((a, b) =>
  (a.ext.includes("s") ? 0 : 1) - (b.ext.includes("s") ? 0 : 1) || a.g - b.g || Math.abs(a.x - 27) - Math.abs(b.x - 27));
const entrance = entranceCands[0];
const entranceDir = entrance.ext.includes("s") ? "s" : entrance.ext[0];
const facing = { n: "north", e: "east", s: "south", w: "west" };
const entranceAlong = entranceDir === "n" || entranceDir === "s" ? (c) => c.x : (c) => c.z;

// Glazing and piers on a side: the wall runs along x on a north or south face, along z on east or west.
const alongX = (face) => face === "n" || face === "s";
const paneState = (face) => (alongX(face)
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// Facade of a perimeter cell at height y: [block, state?].
function facade(c, y) {
  const R = c.tier, r = y - c.g;
  if (y === R) return ["stone_bricks"];                         // parapet
  if (r === 0) return ["stone_bricks"];                         // plinth course on the foundation
  if (y === R - 1) return ["smooth_stone"];                     // cornice
  const l = r % 4;                                              // storey: line, two glass rows, spandrel
  if (l === 0) return ["smooth_stone"];
  const along = alongX(c.face) ? c.x : c.z;
  if (along % 4 === 0) return ["stone_bricks"];                 // stone pier between bays
  if (l === 3) return ["light_gray_concrete"];
  return ["glass_pane", paneState(c.face)];
}

for (const c of fp.values()) {
  const { x, z, g: gr, tier: R } = c;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");    // foundation fill up to the cell's ground
  if (c.perim) {
    for (let y = gr; y <= R; y++) {
      const [block, state] = facade(c, y);
      put(x, y, z, block, state);
    }
  } else {
    for (let y = gr; y <= R - 4; y += 4) put(x, y, z, "smooth_stone");   // floor slab per storey, air between
    put(x, R - 1, z, "stone");                                            // roof deck: mid-grey, not the dark pit gray_concrete read as
  }
}

// Entrance: dark oak doors on the ground storey, a glazed transom, a stone surround and a canopy band over the three bays.
const ex = entrance.x, ez = entrance.z, eg = entrance.g;
put(ex, eg, ez, "dark_oak_door", { facing: facing[entranceDir], half: "lower", hinge: "left", open: "false", powered: "false" });
put(ex, eg + 1, ez, "dark_oak_door", { facing: facing[entranceDir], half: "upper", hinge: "left", open: "false", powered: "false" });
put(ex, eg + 2, ez, "glass_pane", paneState(entranceDir));
const [sdx, sdz] = alongX(entranceDir) ? [1, 0] : [0, 1];
for (const side of [-1, 1]) {
  const o = at(ex + side * sdx, ez + side * sdz);
  if (!o || !o.perim || o.face !== entranceDir) continue;
  for (let y = eg; y <= eg + 2; y++) put(o.x, y, o.z, "stone_bricks");
}
for (const side of [-1, 0, 1]) {
  const o = at(ex + side * sdx, ez + side * sdz);
  if (o && o.perim && (side === 0 || o.face === entranceDir)) put(o.x, eg + 3, o.z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
}

// Warm light: glowstone on the floor just inside every third window of the first glass row, where the floor is solid.
for (const c of fp.values()) {
  if (!c.perim || c.face === undefined) continue;
  const [dx, dz] = DIRS[c.face];
  const inward = at(c.x - dx, c.z - dz);
  if (!inward || inward.perim) continue;
  for (let y = c.g + 1; y < c.tier - 1; y += 4) {
    const along = alongX(c.face) ? c.x : c.z;
    if (along % 4 === 0 || along % 3 !== 1) continue;           // every third window bay
    if (!isSolid(inward.x, y - 1, inward.z) || isSolid(inward.x, y, inward.z)) continue;
    if (y - 1 < inward.g) continue;
    put(inward.x, y, inward.z, "glowstone");
  }
}

// Roof: small plant pads on the top tier, planted beds on the low tier's roof terraces.
for (const c of fp.values()) {
  if (c.perim) continue;
  if (c.tier === 16 && c.x % 9 >= 3 && c.x % 9 <= 4 && c.z % 9 >= 3 && c.z % 9 <= 4) put(c.x, 16, c.z, "stone_bricks");
  if (c.tier === 10 && c.x % 4 === 1 && c.z % 4 === 1) { put(c.x, 10, c.z, "moss_block"); put(c.x, 11, c.z, "azalea"); }
}

g.save(`${DIR}/way_23907812.nbt`);
