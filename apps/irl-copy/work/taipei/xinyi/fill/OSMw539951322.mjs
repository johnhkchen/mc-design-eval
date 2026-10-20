import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951322";
const W = 23, H = 23, D = 17;

// Record: 2-storey low-rise commercial block, Taipei 1970s-80s concrete frame,
// white tiled/rendered facade, shopfront at grade, flat roof with parapet and a
// small mechanical penthouse. Roof sits ~11 blocks above lowest ground.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (gr < minG) minG = gr;
}
const has = (x, z) => ground.has(`${x},${z}`);
const relG = (x, z) => ground.get(`${x},${z}`) - minG;

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const missing = (x, z) =>
  Object.keys(DIRS).filter(n => !has(x + DIRS[n][0], z + DIRS[n][1]));
const isEdge = (x, z) => missing(x, z).length > 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pick the entrance: single-sided edge cell facing south, nearest the middle.
let doorKey = null;
{
  const cx = (W - 1) / 2;
  let best = Infinity;
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    const m = missing(x, z);
    if (m.length !== 1) continue;
    const pref = m[0] === "south" ? 0 : 1000; // prefer street frontage
    const score = pref + Math.abs(x - cx);
    if (score < best) { best = score; doorKey = `${x},${z}`; }
  }
}

// Penthouse anchor: interior cell nearest the footprint centroid.
let penKey = null;
{
  const mx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
  const mz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
  let best = Infinity;
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    if (isEdge(x, z)) continue;
    const d = Math.hypot(x - mx, z - mz);
    if (d < best) { best = d; penKey = `${x},${z}`; }
  }
}

for (const [x, z, gr] of cells) {
  const gg = gr - minG;

  // Foundation plinth up to the ground under this cell.
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");
  // Ground-floor slab / base course.
  put(x, gg, z, "smooth_stone");
  // Storey 2 floor slab on every cell (storey line / sill).
  put(x, gg + 5, z, "smooth_stone");

  const miss = missing(x, z);

  if (miss.length === 0) {
    // Interior: roof deck at top of storey 2, air elsewhere (no interiors).
    put(x, gg + 10, z, "light_gray_concrete");
    continue;
  }

  // Edge cells: cornice and parapet.
  put(x, gg + 10, z, "smooth_stone");
  put(x, gg + 11, z, "white_concrete");

  // Corner: solid quoin column.
  if (miss.length >= 2) {
    for (const y of [1, 2, 3, 4, 6, 7, 8, 9]) put(x, gg + y, z, "smooth_quartz");
    put(x, gg + 5, z, "smooth_stone");
    continue;
  }

  const out = miss[0];
  const along = (out === "north" || out === "south") ? x : z;
  const p = ((along % 3) + 3) % 3;
  const key = `${x},${z}`;

  // Ground storey: shopfront glazing between pillars, lintel above.
  for (let y = 1; y <= 3; y++) {
    if (p === 0) put(x, gg + y, z, "smooth_quartz");
    else put(x, gg + y, z, "glass_pane");
  }
  put(x, gg + 4, z, p === 0 ? "smooth_quartz" : "white_concrete");

  // Upper storey: punched windows with white wall between.
  for (let y = 6; y <= 8; y++) {
    if (p === 0) put(x, gg + y, z, "white_concrete");
    else put(x, gg + y, z, "glass_pane");
  }
  put(x, gg + 9, z, "white_concrete");

  // Entrance on the chosen cell.
  if (key === doorKey) {
    put(x, gg + 1, z, "oak_door", { facing: out, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gg + 2, z, "oak_door", { facing: out, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gg + 3, z, "glass_pane");
    put(x, gg + 4, z, "smooth_stone");
  }

  // Warm interior lights: lanterns hanging from the storey slab, seen through glass.
  const [dx, dz] = DIRS[OPP[out]];
  const ix = x + dx, iz = z + dz;
  if (has(ix, iz) && missing(ix, iz).length === 0) {
    if (p === 2) put(ix, gg + 4, iz, "lantern", { hanging: "true" });
    if (p === 1 && (x + z) % 2 === 0) put(ix, gg + 9, iz, "lantern", { hanging: "true" });
  }
}

// Roof: small mechanical penthouse on interior cells around the centroid.
if (penKey) {
  const [px, pz] = penKey.split(",").map(Number);
  for (let ox = -1; ox <= 1; ox++) {
    for (let oz = -1; oz <= 1; oz++) {
      const x = px + ox, z = pz + oz;
      if (!has(x, z) || isEdge(x, z)) continue;
      const gg = relG(x, z);
      for (const y of [11, 12]) put(x, gg + y, z, "light_gray_concrete");
    }
  }
  const gc = relG(px, pz);
  put(px, gc + 13, pz, "lantern", { hanging: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
