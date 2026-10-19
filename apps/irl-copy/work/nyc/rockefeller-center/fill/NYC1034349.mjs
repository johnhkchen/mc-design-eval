// 54 West 47th Street, 1925: a seven-storey brick office block on a granite plinth, the street front at z = 0 with a
// granite shopfront and a centre door, smooth stone spandrels and mullions on every storey, a 3-storey north wing,
// an 18-block shoulder, a setback penthouse, and a light well in the footprint (lidar roof 0) open to the sky.
// Floors are solid slabs at every third block (the storey lines), so each storey stands on the one below; walls are
// one block thick on the outside and every window has an air gap behind it, with a lantern or glowstone in some.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034349.cells.json`, "utf8"));   // [x, z, ground, roof] per cell

const NX = 6, NZ = 27, NY = 33;
const BRICK = "bricks", GRANITE = "polished_granite", SAND = "smooth_sandstone", GLASS = "glass", STONE = "stone";

// Each cell's ground (0 or 1) and a clean massing tier from the lidar roof. Lidar 0 is the light well.
const G = new Map(), H = new Map();
for (const [x, z, g, r] of cells) {
  G.set(`${x},${z}`, g);
  let h;
  if (r === 0) h = 0;                                                        // light well: open to the sky
  else if (z <= 1) h = 9;                                                    // north wing, lidar 6-16 -> 3 storeys
  else if (z === 2) h = 18;                                                  // shoulder, lidar 14-19 -> 6 storeys
  else if (x >= 1 && x <= 4 && z >= 6 && z <= 22) h = 24;                    // setback penthouse over the body's 21
  else h = 21;                                                               // body, lidar 18-21 -> 7 storeys
  H.set(`${x},${z}`, h);
}
const hAt = (x, z) => (H.has(`${x},${z}`) ? H.get(`${x},${z}`) : -1);      // off the footprint: nothing, so always exposed
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
// The faces of a cell at height y that look onto air: the neighbour is lower (top row: lower than the roof itself).
const exposed = (x, z, y, top) => DIRS.filter(([, dx, dz]) => (top ? hAt(x + dx, z + dz) < y : hAt(x + dx, z + dz) <= y)).map(([d]) => d);

const vox = new Voxels([NX, NY, NZ]);
const windows = [];                                                          // glass cells, for the lights behind them

// Shopfront on the street face (z = 0): granite piers, glass, a centre door.
const shop = (x, y) => (x === 0 || x === NX - 1 ? GRANITE : x === 2 ? null : GLASS);

// 1. Walls, floors and roofs, cell by cell.
for (const [key, h] of H) {
  const [x, z] = key.split(",").map(Number), g = G.get(key);
  if (h === 0) { vox.set(x, 0, z, "polished_andesite"); continue; }        // light well paving
  for (let y = 0; y < g; y++) vox.set(x, y, z, GRANITE);                    // foundation to the ground
  for (let y = g; y <= h; y++) {
    const floor = y === g || y % 3 === 0;
    if (floor) {
      const f = exposed(x, z, y, y === h);
      // Floor and roof slabs. Outer edges get the plinth, the spandrel band or the cornice.
      let b = STONE;
      if (f.length) b = y === g ? GRANITE : y === h ? GRANITE : SAND;
      vox.set(x, y, z, b);
      continue;
    }
    const f = exposed(x, z, y, false);
    if (!f.length) continue;                                                // interior air behind the glass
    let b;
    if (z === 0 && f.includes("N")) b = shop(x, y);
    else if (f.length > 1) b = BRICK;                                       // corner pier
    else if (f[0] === "N" || f[0] === "S") b = x === 0 || x === NX - 1 ? BRICK : x % 2 === 0 ? SAND : GLASS;
    else b = z === 0 || z === NZ - 1 ? BRICK : z % 3 === 0 ? SAND : GLASS;
    if (b === null) continue;                                               // the door's opening
    vox.set(x, y, z, b);
    if (b === GLASS) windows.push({ x, y, z, dx: f[0] === "E" ? -1 : f[0] === "W" ? 1 : 0, dz: f[0] === "S" ? -1 : f[0] === "N" ? 1 : 0 });
  }
}

// 2. The centre door on the street face, lit from above by a lantern hung from the first-floor slab.
vox.set(2, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
vox.set(2, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
vox.set(2, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// 3. Lights in some windows: a lantern or shroomlight on the storey floor just inside the glass.
for (const w of windows) {
  if (w.y % 3 !== 1) continue;                                              // only where there is a floor under the light
  const xi = w.x + w.dx, zi = w.z + w.dz;
  if (!H.has(`${xi},${zi}`) || hAt(xi, zi) <= w.y || vox.get(xi, w.y, zi)) continue;
  const roll = (w.x * 7 + w.y * 5 + w.z * 3) % 11;
  if (roll === 0 || roll === 6) vox.set(xi, w.y, zi, "lantern", { hanging: "false", waterlogged: "false" });
  else if (roll === 4) vox.set(xi, w.y, zi, "shroomlight");
}

// 4. Roof equipment on the body roof (y 21): two stone-brick plant rooms, standing on the roof slab.
for (const [x0, z0] of [[1, 24], [3, 24]]) for (let y = 22; y <= 23; y++) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++)
  vox.set(x0 + dx, y, z0 + dz, "stone_bricks");

const { blocks, palette } = vox.save(`${DIR}/NYC1034349.nbt`);
console.log(`NYC1034349: ${blocks} blocks, ${palette} palette entries`);
