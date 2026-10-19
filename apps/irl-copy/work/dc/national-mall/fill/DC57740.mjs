// DC57740: 500 1st St NW, a stripped-classical office block of about 1930 in pale limestone (smooth quartz over a
// rusticated stone base). Lidar tiers, smoothed: a 4-high shoulder ring round a 5-high core on the west, 2-high wings
// at the north-west, a 2x1 pavilion pair on the courtyard's edges, a 4-high tower at the south-east on the lower side,
// and a low plinth terrace. Each storey is one block; interiors are hollow (air behind the glass, floors where a window
// cannot reach them, a deck over every tier).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC57740.cells.json`, "utf8"));   // [x, z, ground, roof]

// Clean tiers per cell, z 0..11 down, x 0..23 across. '.' = outside the footprint, 0 = lower ground with nothing on it,
// 1 = open ground (the courtyard), 2..5 = building tiers.
const TIERS = [
  "22" + "1".repeat(18) + "....",
  "22" + "1".repeat(18) + "....",
  "222222" + "1111" + "55" + "111111" + "33" + "....",
  "3" + "2222222" + "1".repeat(12) + "0000",
  "4" + "22" + "555" + "4" + "2" + "1".repeat(12) + "0000",
  "444" + "55555" + "4" + "1".repeat(14) + "0",
  "444" + "55555" + "4" + "1".repeat(8) + "00" + "1111" + "0",
  "444" + "55555" + "4" + "1".repeat(8) + "00" + "1111" + "0",
  "4444" + "5555" + "4" + "1".repeat(8) + "0000000",
  "444444444" + "1" + "55" + "11111" + "0" + "44",
  "444444444" + "1".repeat(8) + "0" + "44",
  "444" + "3333" + "2" + "1".repeat(8) + "000" + "1",
];
const W = 24, D = 12;
const tier = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? -1 : Number(TIERS[z][x]));
const isFoot = (x, z) => tier(x, z) >= 0;
const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const G = (x, z) => ground.get(`${x},${z}`);

// The clean tiers must cover exactly the lidar footprint.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (isFoot(x, z) !== ground.has(`${x},${z}`)) throw new Error(`footprint mismatch at ${x},${z}`);
for (const [x, z, , r] of cells) if (tier(x, z) < 0) throw new Error(`no tier at ${x},${z}`);

const DIRS = [
  { name: "north", dx: 0, dz: -1, plane: "ns" }, { name: "south", dx: 0, dz: 1, plane: "ns" },
  { name: "west", dx: -1, dz: 0, plane: "ew" }, { name: "east", dx: 1, dz: 0, plane: "ew" },
];
// A face is exposed at height y when the neighbour is outside, or its tier is below y.
const open = (x, z, y) => tier(x, z) < 0 || y >= tier(x, z);
const facesOf = (x, z, y) => DIRS.filter((d) => open(x + d.dx, z + d.dz, y));

// Distance (in cells) from the perimeter, so floors only go where no window can see them.
const dist = new Map();
const queue = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!isFoot(x, z)) continue;
  const edge = DIRS.some((d) => tier(x + d.dx, z + d.dz) < 0 || tier(x + d.dx, z + d.dz) < tier(x, z));
  if (edge) { dist.set(`${x},${z}`, 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i]; const d0 = dist.get(`${x},${z}`);
  for (const d of DIRS) {
    const nx = x + d.dx, nz = z + d.dz, k = `${nx},${nz}`;
    if (isFoot(nx, nz) && !dist.has(k)) { dist.set(k, d0 + 1); queue.push([nx, nz]); }
  }
}
const depth = (x, z) => dist.get(`${x},${z}`) ?? 0;

const v = new Voxels([W, 8, D]);
const panes = [];
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const g = G(x, z), r = tier(x, z);
  if (r < 0) continue;
  if (r <= g) { if (g >= 1) put(x, 0, z, "smooth_stone"); continue; }            // open ground: paving at y0
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");                       // foundation
  const h = r - g;
  if (h === 1) { put(x, g, z, "stone_bricks"); continue; }                        // low plinth terrace
  for (let y = g; y < r; y++) {
    const faces = facesOf(x, z, y);
    if (y === r - 1) {                                                             // cornice or roof deck
      if (faces.length === 0) put(x, y, z, "polished_andesite");
      else if (faces.length === 1) put(x, y, z, "smooth_quartz_stairs", { facing: faces[0].name, half: "bottom", shape: "straight", waterlogged: "false" });
      else put(x, y, z, "smooth_quartz");
      continue;
    }
    if (faces.length === 0) {                                                      // hollow: floors only out of window reach
      if (depth(x, z) >= 2 && (y - g) % 2 === 0) put(x, y, z, "smooth_stone");
      continue;
    }
    const sIdx = y - g;
    if (faces.length >= 2) { put(x, y, z, sIdx === 0 ? "stone_bricks" : "smooth_quartz"); continue; }
    const f = faces[0];
    const bay = sIdx === 0 || (f.plane === "ns" ? x : z) % 2 === 1;               // shopfront glass; upper windows every other cell
    if (bay) { put(x, y, z, "glass_pane"); panes.push({ x, y, z, plane: f.plane }); }
    else put(x, y, z, sIdx === 0 ? "stone_bricks" : "quartz_pillar", sIdx === 0 ? undefined : { axis: "y" });
  }
}

// Warm windows: a hanging lantern just inside a top-storey window, under the deck, in every fourth bay.
for (const p of panes) {
  const x0 = p.x, z0 = p.z, g = G(x0, z0), r = tier(x0, z0);
  if (p.y !== r - 2 || r - g < 3 || (p.x % 4) !== 1) continue;
  const face = DIRS.find((d) => open(x0 + d.dx, z0 + d.dz, p.y));
  const nx = x0 - face.dx, nz = z0 - face.dz;
  if (!isFoot(nx, nz) || tier(nx, nz) !== r || facesOf(nx, nz, p.y).length) continue;
  put(nx, p.y, nz, "lantern", { hanging: "true", waterlogged: "false" });
}

// Panes join the wall beside them, in the plane of their facade.
for (const p of panes) {
  const has = (x, z) => v.get(x, p.y, z) !== null;
  const [dx, dz] = p.plane === "ns" ? [1, 0] : [0, 1];
  const a = has(p.x + dx, p.z + dz), b = has(p.x - dx, p.z - dz);
  const st = p.plane === "ns"
    ? { north: "false", south: "false", east: String(a), west: String(b) }
    : { north: String(a), south: String(b), east: "false", west: "false" };
  put(p.x, p.y, p.z, "glass_pane", { ...st, waterlogged: "false" });
}

// The entrance on the courtyard face of the core: a door into the recess, with a canopy on two pillars.
const DOOR = [10, 2];
put(DOOR[0], 1, DOOR[1], "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(DOOR[0], 2, DOOR[1], "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [9, 11]) for (const y of [1, 2]) put(x, y, 1, "quartz_pillar", { axis: "y" });
for (const x of [9, 10, 11]) put(x, 3, 1, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

// Roof plant on the core's deck.
for (const [x, z] of [[4, 6], [6, 6]]) put(x, tier(x, z), z, "light_gray_concrete");

const out = `${DIR}/DC57740.nbt`;
const info = v.save(out);
console.log(JSON.stringify({ file: out, ...info }));
