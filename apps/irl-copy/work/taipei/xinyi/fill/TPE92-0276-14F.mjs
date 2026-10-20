import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE92-0276-14F: 2003 Xinyi office/mixed-use tower, 14 storeys of 5 blocks.
// Light tiled cladding: white piers, light-gray spandrels, blue-green glass bays,
// a glazed ground-floor shopfront with a lit lobby opening on the south face,
// cornice and parapet at the top, a rooftop plant enclosure and a short mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE92-0276-14F";
const W = 26, H = 81, D = 38;
const ROOF = 69;          // roof level above lowest ground (lidar)
const STOREY = 5;         // blocks per storey

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground level
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(ROOF - 1, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = (minX + maxX) / 2;

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];
const outs = (x, z) => DIRS.filter(d => !has(x + d.dx, z + d.dz));
const isPerim = (x, z) => outs(x, z).length > 0;
const nearPerim = (x, z) =>
  DIRS.some(d => has(x + d.dx, z + d.dz) && isPerim(x + d.dx, z + d.dz));

// lobby cells: south-face cells two wide, centred; their inward neighbours are the lobby
const isLobbyEdge = (x, z, o) => o.some(d => d.n === "south") && Math.abs(x - cx) <= 1;

// 1. Foundation and envelope, cell by cell
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gr = ground.get(key);
  const o = outs(x, z);
  const perim = o.length > 0;
  const corner = o.length > 1;

  // plinth from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const ent = perim && isLobbyEdge(x, z, o);

  // position along the facade, used for the pier rhythm
  const face = o[0];
  const t = face ? (face.dx === 0 ? x - minX : z - minZ) : 0;

  for (let y = gr; y <= ROOF; y++) {
    const b = Math.floor(y / STOREY);
    const r = y % STOREY;

    if (ent && y <= gr + 2) continue;             // doorway opening
    if (ent && y === gr + 3) { g.set(x, y, z, "smooth_stone"); continue; } // lintel

    if (!perim) {
      // interior: floor slabs, roof deck, lamps behind the glass
      if (y === gr || r === 0) g.set(x, y, z, "light_gray_concrete");
      else if (y === ROOF) g.set(x, y, z, "light_gray_concrete");
      else if (r === 2 && b >= 1 && nearPerim(x, z) && (x * 7 + z * 13 + b * 5) % 9 === 0)
        g.set(x, y, z, "glowstone");
      else if (r === 2 && b === 0 && nearPerim(x, z) && (x * 5 + z * 3) % 6 === 0)
        g.set(x, y, z, "sea_lantern");
      continue;
    }

    // envelope
    if (y === ROOF) {
      g.set(x, y, z, "white_concrete");           // cornice
    } else if (r === 0 || r === 4) {
      g.set(x, y, z, "light_gray_concrete");      // spandrels, storey lines
    } else {
      const pier = corner || t % 3 === 0;
      if (pier) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, b === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");
    }
  }

  // parapet cap
  if (perim) g.set(x, ROOF + 1, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
}

// 2. Lobby lighting: lanterns on the lobby floor behind the south entrance
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gr = ground.get(key);
  const o = outs(x, z);
  if (!isLobbyEdge(x, z, o)) continue;
  const inX = x; const inZ = z - 1;             // interior cell just inside the door
  if (!has(inX, inZ) || isPerim(inX, inZ)) continue;
  if (x === 12) g.set(inX, gr + 1, inZ, "lantern", { hanging: "false", waterlogged: "false" });
}

// 3. Rooftop plant enclosure
const inPH = (x, z) => x >= 6 && x <= 19 && z >= 8 && z <= 29 && has(x, z);
for (let x = 6; x <= 19; x++) {
  for (let z = 8; z <= 29; z++) {
    if (!inPH(x, z)) continue;
    const edge = x === 6 || x === 19 || z === 8 || z === 29;
    for (let y = ROOF + 1; y <= 73; y++) {
      if (edge) g.set(x, y, z, "smooth_stone");
    }
    g.set(x, 70, z, edge ? "smooth_stone" : ((x + z) % 3 === 0 ? "iron_block" : "air"));
    g.set(x, 74, z, "smooth_stone");
  }
}

// 4. Short mast on the enclosure roof
if (has(12, 18)) {
  for (let y = 75; y <= 79; y++) g.set(12, y, 18, "iron_bars");
  g.set(12, 80, 18, "redstone_lamp");
}

g.save(`${DIR}/${ID}.nbt`);
