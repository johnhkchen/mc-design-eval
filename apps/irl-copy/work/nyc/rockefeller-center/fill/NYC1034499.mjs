// 58 West 48th Street (NYC1034499): a 1920 mixed residential and commercial block, 7 x 27 blocks on a 25-foot midtown lot.
// Built as the era's grammar: a red brick shell on a granite base, limestone piers and storey lines, a 2-block shopfront
// on the street end, five storeys over the middle of the lot, a two-storey rear wing, a tar roof with a timber water tower.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1034499.cells.json`, "utf8"));

// Lidar roofs become three clean tiers: 14+ is the five-storey block topped at 16 (the east column's parapet at 17),
// 12 and under is the two-storey wing topped at 7, and 0 is the light court (paved, open to the sky).
const col = new Map();
for (const [x, z, g, r] of cells) {
  const court = r === 0;
  const S = court ? 0 : r >= 14 ? (x === 6 ? 17 : 16) : 7;
  col.set(`${x},${z}`, { x, z, g, S, court });
}
const built = (x, z) => (col.get(`${x},${z}`)?.S ?? 0) > 0;

const out = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => out.set(key(x, y, z), { block, state });
const solid = (x, y, z) => out.has(key(x, y, z));

// Storey grammar, by height: base course at 0, storey lines at 3/6/9/12, two window rows between them, a cap at the top.
const FLOORS = [3, 6, 9, 12];
const kindAt = (y, S) => (y === 0 ? "base" : y === S - 1 ? "cap" : FLOORS.includes(y) ? "string" : y <= 14 && y % 3 !== 0 ? "window" : "wall");
const NEI = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };   // the neighbour across each face
const IN = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };    // the cell behind each face

// Pass 1: solid massing (no interiors), granite base, tar roof, courtyard paving.
for (const c of col.values()) {
  if (c.court) { put(c.x, 0, c.z, "smooth_stone"); continue; }
  for (let y = 0; y < c.S; y++) put(c.x, y, c.z, y === 0 ? "polished_granite" : y === c.S - 1 ? "gray_concrete" : "bricks");
}

// Pass 2: the exterior skin on every face that has no building across it (courts count as open).
const windows = [];   // { x, y, z, dx, dz, shop } cells that get an air gap or a lamp behind the glass
const panes = [];     // { x, y, z, alongZ } glass panes, joined to their neighbours in pass 4
for (const c of col.values()) {
  if (!c.S) continue;
  for (const side of ["N", "S", "W", "E"]) {
    const [nx, nz] = NEI[side];
    if (built(c.x + nx, c.z + nz)) continue;
    const alongZ = side === "N" || side === "S";   // the face runs along x
    const idx = alongZ ? c.x : c.z;                 // position along the face: piers every third block
    const [dx, dz] = IN[side];
    const street = side === "N" && c.z === 0;      // the 48th Street end
    for (let y = 0; y < c.S; y++) {
      const kind = kindAt(y, c.S);
      if (street && (y === 1 || y === 2)) {
        if (idx === 3) {                             // the entrance: a dark oak door, the marquee above it
          put(c.x, y, c.z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        } else if (idx % 3 === 0) {
          put(c.x, y, c.z, "bricks");
        } else {
          put(c.x, y, c.z, y === 1 ? "dark_oak_planks" : "glass");   // bulkhead, then the shop glass
          windows.push({ x: c.x, y, z: c.z, dx, dz, shop: true });
        }
        continue;
      }
      if (street && y === 3 && idx >= 2 && idx <= 4) { put(c.x, y, c.z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }
      if (kind === "base") put(c.x, y, c.z, "polished_granite");
      else if (kind === "cap") put(c.x, y, c.z, "stone_bricks");
      else if (kind === "string") put(c.x, y, c.z, "calcite");
      else if (kind === "window" && idx % 3 === 0) put(c.x, y, c.z, "bricks");
      else if (kind === "window") { put(c.x, y, c.z, "glass_pane"); panes.push({ x: c.x, y, z: c.z, alongZ }); windows.push({ x: c.x, y, z: c.z, dx, dz, shop: false }); }
      else put(c.x, y, c.z, "bricks");
    }
  }
}

// Pass 3: an air gap behind each window (one cell, the floor slabs above and below are solid), a lamp behind some of them.
for (const w of windows) {
  const k = key(w.x + w.dx, w.y, w.z + w.dz);
  const inner = out.get(k);
  if (!inner || inner.block !== "bricks") continue;
  const lit = w.shop ? w.y === 2 && (w.x === 1 || w.x === 4) : (w.x * 7 + w.y * 5 + w.z * 3) % 7 === 0;
  if (lit) out.set(k, { block: "glowstone" });
  else out.delete(k);
}
out.delete(key(3, 1, 1));   // the entry hall behind the door
out.delete(key(3, 2, 1));

// Pass 4: panes join the panes and piers beside them along the face, so the grid reads as framed glass.
for (const p of panes) {
  if (out.get(key(p.x, p.y, p.z))?.block !== "glass_pane") continue;
  const state = p.alongZ
    ? { north: "false", south: "false", east: String(solid(p.x + 1, p.y, p.z)), west: String(solid(p.x - 1, p.y, p.z)), waterlogged: "false" }
    : { north: String(solid(p.x, p.y, p.z - 1)), south: String(solid(p.x, p.y, p.z + 1)), east: "false", west: "false", waterlogged: "false" };
  out.set(key(p.x, p.y, p.z), { block: "glass_pane", state });
}

// Pass 5: roof plant. Four legs, a timber tank with a flat lid, and two condenser units, all on the tar.
for (const [x, z] of [[1, 10], [3, 10], [1, 12], [3, 12]]) for (let y = 16; y <= 17; y++) put(x, y, z, "spruce_log");
for (let y = 18; y <= 21; y++) for (let x = 1; x <= 3; x++) for (let z = 10; z <= 12; z++) put(x, y, z, x !== 2 && z !== 11 ? "spruce_log" : "spruce_planks");
for (let x = 1; x <= 3; x++) for (let z = 10; z <= 12; z++) put(x, 22, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
put(4, 16, 5, "light_gray_concrete"); put(4, 16, 6, "light_gray_concrete");

// Pass 6: write the structure.
const g = new Voxels([7, 29, 27]);
for (const [k, b] of out) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b.block, b.state);
}
const stats = g.save(`${dir}/NYC1034499.nbt`);
console.log(JSON.stringify(stats));
