// 1700 M St NW, Commercial-Office-Large: a 1960s-70s stone-and-glass office, five storeys on a
// podium, a six-storey core stepping up at the centre with a penthouse, and a low west wing.
// Massing comes from the lidar roof (cells.json), quantised to clean tiers; facades are built
// from storey bands (plate row + two glass rows), so every slab and wall stands on the course below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC72111.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [33, 35, 17];

// lidar roof -> clean tier (top of the massing, y 0..R-1 solid-or-hollow)
const tierOf = (x, z, r) => {
  if (r <= 2) return 2;                                                   // street-level terrace
  if (r === 3) return 3;                                                  // low podium (south-west)
  if (r <= 15) return 15;                                                 // west wing
  if (r >= 22 && x >= 19 && x <= 22 && z >= 8 && z <= 11) return 23;      // penthouse on the core
  if (r >= 19) return 21;                                                 // six-storey core
  return 18;                                                              // five-storey body
};

const K = (x, y, z) => `${x},${y},${z}`;
const fp = new Map();                                                     // "x,z" -> { g, R }
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, R: tierOf(x, z, r) });
const colR = (x, z) => fp.get(`${x},${z}`)?.R ?? 0;                      // 0 = off the footprint
const occupied = (x, y, z) => y >= 0 && y < colR(x, z);

// storey lines: a plate row every 3 blocks; the core carries its own deck at 17 and 20
const plateRows = (R) => (R >= 21 ? [1, 4, 7, 10, 13, 16, 17, 20] : [1, 4, 7, 10, 13, 16]).filter((y) => y < R - 1);
const DIRS = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };
const exposed = (x, y, z) => Object.keys(DIRS).filter((d) => !occupied(x + DIRS[d][0], y, z + DIRS[d][1]));

// kind of each massing cell: found (foundation), plate (floor slab), deck (roof top), wall (facade), support, or air
const kindOf = new Map();
for (const [k, { R }] of fp) {
  const [x, z] = k.split(",").map(Number);
  const plates = plateRows(R);
  for (let y = 0; y < R; y++) {
    let kind = null;
    if (y === 0) kind = "found";
    else if (y === R - 1) kind = "deck";
    else if (plates.includes(y)) kind = "plate";
    else if (exposed(x, y, z).length) kind = "wall";
    if (kind) kindOf.set(K(x, y, z), kind);
  }
}
// a facade cell with air beneath it is carried down to solid (nothing hangs in the air)
for (const [key, kind] of [...kindOf]) {
  if (kind !== "wall") continue;
  const [x, y, z] = key.split(",").map(Number);
  for (let yy = y - 1; yy >= 0 && !kindOf.has(K(x, yy, z)); yy--) kindOf.set(K(x, yy, z), "support");
}

// the blocks, keyed "x,y,z" -> { block, state }
const want = new Map();
const put = (x, y, z, block, state) => want.set(K(x, y, z), { block, state });
const GLASS = "light_blue_stained_glass_pane", PIER = "white_concrete";
for (const [key, kind] of kindOf) {
  const [x, y, z] = key.split(",").map(Number);
  const dirs = exposed(x, y, z);
  if (kind === "found") put(x, y, z, "stone_bricks");
  else if (kind === "plate") put(x, y, z, y === 1 && dirs.length ? "polished_andesite" : "smooth_quartz");
  else if (kind === "deck") put(x, y, z, dirs.length ? "smooth_quartz" : "light_gray_concrete");
  else if (kind === "support") put(x, y, z, PIER);
  else if (kind === "wall") {
    // piers every third bay, glass between; corners are always piers
    const ns = dirs.some((d) => d === "N" || d === "S"), ew = dirs.some((d) => d === "E" || d === "W");
    const corner = ns && ew;
    const along = ns ? x : z;
    const pier = corner || along % 3 === 0;
    put(x, y, z, pier ? PIER : GLASS);
  }
}

// rooftop equipment on the five-storey body roof (cells at 18)
for (const [x0, z0, w, d] of [[15, 1, 2, 2], [25, 13, 2, 2]])
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) for (let y = 18; y <= 19; y++) put(x, y, z, "gray_concrete");

// entrance on the south face: a double door in the glass with lanterns hung under the canopy band
for (const x of [21, 22]) {
  put(x, 2, 16, "dark_oak_door", { facing: "south", half: "lower", hinge: x === 21 ? "left" : "right", open: "false", powered: "false" });
  put(x, 3, 16, "dark_oak_door", { facing: "south", half: "upper", hinge: x === 21 ? "left" : "right", open: "false", powered: "false" });
}
for (const x of [20, 23]) put(x, 3, 16, "lantern", { hanging: "true", waterlogged: "false" });

// warm lights behind some upper-storey windows: placed on the inside of the glass, in the air gap
for (const [key, kind] of kindOf) {
  if (kind !== "wall") continue;
  const [x, y, z] = key.split(",").map(Number);
  if (y < 5 || want.get(key).block !== GLASS) continue;
  if ((x * 5 + y * 7 + z * 3) % 13 !== 0) continue;
  const dirs = exposed(x, y, z);
  const [dx, dz] = DIRS[dirs[0]];
  const ix = x - dx, iz = z - dz;
  if (kindOf.has(K(ix, y, iz))) continue;                                  // not in the air gap
  put(ix, y, iz, (x + y + z) % 2 ? "glowstone" : "shroomlight");
}

// panes join their neighbours: another pane, or any solid block in that direction
const NOT_JOIN = new Set(["dark_oak_door", "lantern", "glowstone", "shroomlight"]);
const joins = (x, y, z) => {
  const n = want.get(K(x, y, z));
  return !!n && (n.block === GLASS || !NOT_JOIN.has(n.block));
};
for (const [key, { block }] of [...want]) {
  if (block !== GLASS) continue;
  const [x, y, z] = key.split(",").map(Number);
  const state = { east: joins(x + 1, y, z), west: joins(x - 1, y, z), north: joins(x, y, z - 1), south: joins(x, y, z + 1), waterlogged: "false" };
  for (const d of Object.keys(state)) if (typeof state[d] === "boolean") state[d] = String(state[d]);
  put(x, y, z, GLASS, state);
}

const g = new Voxels(SIZE);
for (const [key, { block, state }] of want) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/DC72111.nbt`);
console.log(`DC72111.nbt: ${out.blocks} blocks, palette ${out.palette}`);
