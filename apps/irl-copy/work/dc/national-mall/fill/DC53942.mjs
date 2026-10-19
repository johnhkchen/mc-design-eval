// 490 L'Enfant Plaza SW: a 1970s precast-concrete office block on the L'Enfant Plaza superblock. Two wings
// (x 0..13 and x 19..39) split by a light court (x 14..18) open the full length, a low north pavilion and a
// south pavilion, and a central tower core. Tiers snap the lidar roof to a few clean levels; each storey is
// three blocks (a spandrel course and two rows of glazing), so the ~21-block roof reads as ~6 office floors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${HERE}/DC53942.cells.json`, "utf8"));   // [x, z, ground, roof]

const TIERS = [6, 8, 11, 18, 21, 23];
const snap = (r) => (r === 22 ? 21 : TIERS.reduce((best, t) => (Math.abs(t - r) <= Math.abs(best - r) ? t : best)));

const GROUND = new Map(), TOP = new Map();
for (const [x, z, gr, roof] of cells) { GROUND.set(`${x},${z}`, gr); TOP.set(`${x},${z}`, snap(roof)); }
const inFoot = (x, z) => TOP.has(`${x},${z}`);
const top = (x, z) => TOP.get(`${x},${z}`);
const ground = (x, z) => GROUND.get(`${x},${z}`);
const solid = (x, y, z) => y >= 0 && inFoot(x, z) && y < top(x, z);

// outward direction of each face; `along` is the coordinate that runs along that wall
const FACES = [
  { dx: 0, dz: -1, face: "north" }, { dx: 0, dz: 1, face: "south" },
  { dx: -1, dz: 0, face: "west" }, { dx: 1, dz: 0, face: "east" },
];
const exposed = (x, y, z) => FACES.filter(({ dx, dz }) => !solid(x + dx, y, z + dz));
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const plan = new Map();           // "x,y,z" -> { block, state }
const gaps = new Map();           // "x,y,z" -> lit?  (air behind a window, one cell in)
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });

for (const [x, z] of [...TOP.keys()].map((k) => k.split(",").map(Number))) {
  const G = ground(x, z), H = top(x, z);
  for (let y = 0; y < H; y++) {
    const faces = exposed(x, y, z);
    if (y < G) { put(x, y, z, "stone_bricks"); continue; }                      // foundation to the lowest ground
    if (y === H - 1) { put(x, y, z, faces.length ? "polished_andesite" : "gray_concrete"); continue; }  // cornice / roof membrane
    const r = y - G, k = Math.floor(r / 3), rr = r % 3;
    if (faces.length === 0) { put(x, y, z, "white_concrete"); continue; }     // solid core
    if (faces.length >= 2) { put(x, y, z, "white_concrete"); continue; }      // corner pier
    const { dx, dz } = faces[0];
    const u = dz !== 0 ? x : z;                                               // position along the wall
    if (rr === 0) { put(x, y, z, k === 0 ? "polished_granite" : "light_gray_concrete"); continue; }  // base course / storey line
    if (u % 3 === 0) { put(x, y, z, "white_concrete"); continue; }            // precast pier, the window frame
    if (k === 0) put(x, y, z, "gray_stained_glass");                          // lobby glass
    else put(x, y, z, "gray_stained_glass_pane", dz !== 0
      ? { north: "false", south: "false", east: "true", west: "true" }
      : { north: "true", south: "true", east: "false", west: "false" });
    // air one cell behind the glass, where that cell is interior (not itself a wall)
    const ix = x - dx, iz = z - dz;
    if (inFoot(ix, iz) && solid(ix, y, iz) && exposed(ix, y, iz).length === 0)
      gaps.set(`${ix},${y},${iz}`, hash(x, y, z) % 6 === 0 && rr === 1);
  }
}

// rooftop plant on the tiers: a few stone boxes on open roof, clear of the parapet
for (const [k] of TOP) {
  const [x, z] = k.split(",").map(Number), H = top(x, z);
  if (![18, 21, 23].includes(H) || x % 6 !== 3 || z % 6 !== 3) continue;
  if (![[1,0],[-1,0],[0,1],[0,-1]].every(([dx, dz]) => solid(x + dx, H - 1, z + dz) && exposed(x + dx, H - 1, z + dz).length === 0)) continue;
  put(x, H, z, "smooth_stone"); put(x, H + 1, z, "smooth_stone");
}

const g = new Voxels([40, 35, 39]);
for (const [key, { block, state }] of plan) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
for (const [key, lit] of gaps) {
  const [x, y, z] = key.split(",").map(Number);
  if (lit) g.set(x, y, z, "glowstone"); else g.set(x, y, z, "air");
}

// Entrance on the north pavilion: a two-door bay set one block back, a polished canopy on the wall above,
// lanterns hanging under the canopy at its ends.
const gy = ground(23, 0);
for (const x of [22, 23, 24, 25]) { g.set(x, gy, 0, "air"); g.set(x, gy + 1, 0, "air"); g.set(x, gy + 2, 0, "polished_andesite"); }
g.set(22, gy + 1, 0, "lantern", { hanging: "true", waterlogged: "false" });
g.set(25, gy + 1, 0, "lantern", { hanging: "true", waterlogged: "false" });
for (const [x, hinge] of [[23, "left"], [24, "right"]]) {
  const door = { facing: "north", hinge, open: "false", powered: "false" };
  g.set(x, gy, 0, "dark_oak_door", { ...door, half: "lower" });
  g.set(x, gy + 1, 0, "dark_oak_door", { ...door, half: "upper" });
}

const { blocks, palette } = g.save(`${HERE}/DC53942.nbt`);
console.log(`DC53942.nbt: ${blocks} blocks, ${palette} palette entries`);
