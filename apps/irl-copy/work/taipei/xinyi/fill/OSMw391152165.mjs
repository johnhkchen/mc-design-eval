import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw391152165";
const W = 9, H = 24, D = 23;

const cells = JSON.parse(readFileSync(`${SRC}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground (already relative to y 0)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

// outward neighbour offsets
const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };
const faces = (x, z) => Object.keys(OUT).filter(f => !has(x + OUT[f][0], z + OUT[f][1]));

// bounds-checked placement, footprint cells only
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Single entrance: exposed north face nearest the frontage middle
let door = null;
{
  let best = Infinity;
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    if (!faces(x, z).includes("N")) continue;
    const d = Math.abs(x - 4);
    if (d < best) { best = d; door = { x, z, face: "N" }; }
  }
  if (!door) {
    for (const [x, z] of cells.map(c => [c[0], c[1]])) {
      const fs = faces(x, z);
      if (fs.length) { door = { x, z, face: fs[0] }; break; }
    }
  }
}

// Interior roof plant (small AC units)
const plant = (x, z) =>
  (x >= 2 && x <= 3 && z >= 5 && z <= 6) || (x >= 5 && x <= 6 && z >= 15 && z <= 16);

const pane = "light_blue_stained_glass_pane";
const lantern = { hanging: "false", waterlogged: "false" };

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const gg = ground.get(`${x},${z}`);
  const fs = faces(x, z);
  const wall = fs.length > 0;

  // foundation from y 0 up to the cell's ground
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");

  if (!wall) {
    // interior: floor slabs at storey lines and roof slab, air between
    put(x, gg, z, "light_gray_concrete");
    put(x, gg + 5, z, "light_gray_concrete");
    put(x, gg + 10, z, "light_gray_concrete");
    if (plant(x, z)) put(x, gg + 11, z, "iron_block");
    continue;
  }

  // exterior wall cell
  const face = fs.includes("N") ? "N" : fs.includes("S") ? "S" : fs[0];
  const axisX = face === "N" || face === "S";
  const u = axisX ? x : z;
  const paneProps = axisX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const isDoor = door && door.x === x && door.z === z;
  const mullion = u % 3 === 0;
  const [ox, oz] = OUT[face];
  const ix = x - ox, iz = z - oz; // inward cell

  // base course on the ground-floor slab line
  put(x, gg, z, "stone_bricks");

  // ground storey: kickplate, shopfront with black frames, fascia
  put(x, gg + 1, z, "polished_andesite");
  if (isDoor) {
    const dp = { facing: FACING[face], hinge: "left", open: "false", powered: "false" };
    put(x, gg + 1, z, "dark_oak_door", { ...dp, half: "lower" });
    put(x, gg + 2, z, "dark_oak_door", { ...dp, half: "upper" });
  } else {
    put(x, gg + 2, z, mullion ? "black_concrete" : pane, mullion ? undefined : paneProps);
  }
  put(x, gg + 3, z, mullion ? "black_concrete" : pane, mullion ? undefined : paneProps);
  // door hood: lintel over the entrance, sits on the door head
  if (isDoor) put(x, gg + 3, z, "smooth_stone");
  put(x, gg + 4, z, "white_concrete");
  put(x, gg + 5, z, "smooth_stone"); // storey line / floor slab

  // upper storey: window band gg+6..gg+8 with white mullions, spandrel gg+9
  for (const dy of [6, 7, 8]) {
    put(x, gg + dy, z, mullion ? "white_concrete" : pane, mullion ? undefined : paneProps);
  }
  put(x, gg + 9, z, "light_gray_concrete");

  // cornice, parapet, cap
  put(x, gg + 10, z, "smooth_stone");
  put(x, gg + 11, z, "white_concrete");
  put(x, gg + 12, z, "stone_brick_slab", { type: "top", waterlogged: "false" });

  // warm lights standing just inside the glass
  if (!isDoor && has(ix, iz) && faces(ix, iz).length === 0) {
    if (u % 6 === 4) put(ix, gg + 1, iz, "lantern", lantern);
    if (u % 6 === 1) put(ix, gg + 6, iz, "lantern", lantern);
  }
}

g.save(`${SRC}/${ID}.nbt`);
