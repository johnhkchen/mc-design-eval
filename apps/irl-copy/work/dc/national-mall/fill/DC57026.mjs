// DC57026: 1850 M St NW, a 1980s-style Commercial-Office-Large on the Mall's north side. Pale limestone-clad piers,
// blue-tinted glazing in a grid, granite plinth, a gray roof field, a stepped tower on a podium, a 2-storey east annex,
// and a recessed entrance with a canopy. Hollow: an exterior skin, a floor plate per storey, air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const OUT = `${DIR}/DC57026.nbt`;
const cells = JSON.parse(readFileSync(`${DIR}/DC57026.cells.json`, "utf8"));

// Materials
const STONE = "smooth_quartz";                       // piers, storey lines, cornice, parapet
const BASE = "polished_granite";                     // plinth course
const ROOF = "gray_concrete";                        // roof field
const GLASS = "light_blue_stained_glass_pane";
const LIGHT = "lantern";
const EQUIP = "light_gray_concrete";
const DOOR = "dark_oak_door";

const W = 25, H = 33, D = 17;
const STOREY = 3;                                    // 1 floor-plate layer + 2 window layers per storey

// Lidar roof snapped to clean tiers. Noise specks (19/20/21 scattered in the tower, 18s at the SE corner) are folded in.
function tierRoof(x, z) {
  if (x >= 10 && x <= 12 && z >= 7 && z <= 9) return 21;   // mechanical penthouse on the tower's centre
  if (x >= 4 && x <= 18 && z >= 3 && z <= 14) return 19;   // tower
  if (x >= 23 && z >= 3 && z <= 5) return 6;               // east annex, two storeys
  if (z === 0 && (x === 11 || x === 12)) return 5;         // entrance canopy (lidar 4-5)
  if (z === 1 && (x === 11 || x === 12)) return 14;        // recessed entrance bay (lidar 14)
  return 17;                                               // podium
}

const key = (x, z) => `${x},${z}`;
const fp = new Map();                                      // "x,z" -> { ground, roof }
for (const [x, z, ground] of cells) fp.set(key(x, z), { ground, roof: tierRoof(x, z) });
const roofOf = (x, z) => fp.get(key(x, z))?.roof ?? -1;    // -1 outside the footprint: always an exposed edge

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const OPP = { N: "S", S: "N", E: "W", W: "E" };
// faces a cell shows at height y: outside the footprint, or next to a neighbour that stands no higher than y
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => roofOf(x + DIRS[d][0], z + DIRS[d][1]) <= y);

const P = new Map();                                       // "x,y,z" -> { block, state?, face? }
const put = (x, y, z, block, extra = {}) => P.set(`${x},${y},${z}`, { block, ...extra });
const at = (x, y, z) => P.get(`${x},${y},${z}`);

// 1. The shell, column by column
for (const [k, { ground, roof: R }] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < R; y++) {
    const exp = exposed(x, z, y);
    if (y < ground) { put(x, y, z, BASE); continue; }                       // foundation under a slope (none here: ground 0)
    if (y === R - 1) { put(x, y, z, exp.length ? STONE : ROOF); continue; }  // parapet ring, roof field
    if (y === 0 && exp.length) { put(x, y, z, BASE); continue; }             // plinth
    if (y % STOREY === 0) { put(x, y, z, STONE); continue; }                 // floor plate / storey line
    if (y === R - 2 && exp.length) { put(x, y, z, STONE); continue; }        // cornice course
    if (!exp.length) continue;                                               // interior: air behind the glass

    // facade
    if (z === 0 && (x === 11 || x === 12) && (y === 1 || y === 2)) {          // double entrance door under the canopy
      const hinge = x === 11 ? "left" : "right";
      const half = y === 1 ? "lower" : "upper";
      put(x, y, z, DOOR, { state: { facing: "south", half, hinge, open: "false", powered: "false" } });
      continue;
    }
    const onNS = exp.includes("N") || exp.includes("S");
    const onEW = exp.includes("E") || exp.includes("W");
    if (onNS && onEW) { put(x, y, z, STONE); continue; }                    // corner pier
    const u = onNS ? x : z;                                                  // along-face index
    if (u % 3 === 0) put(x, y, z, STONE);                                    // pier
    else put(x, y, z, GLASS, { face: onNS ? "NS" : "EW" });                  // glazing
  }
}

// 2. Warm lights just inside some windows (on the storey's floor plate, behind the glass)
for (const [k, v] of [...P]) {
  if (v.block !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  if (y % STOREY !== 1) continue;
  if ((x * 7 + y * 5 + z * 3) % 6 !== 0) continue;                          // about one window in six
  const exp = exposed(x, z, y);
  if (exp.length !== 1) continue;
  const [dx, dz] = DIRS[OPP[exp[0]]];
  const ix = x + dx, iz = z + dz;
  if (roofOf(ix, iz) <= y || at(ix, y, iz)) continue;                      // needs an empty interior cell
  put(ix, y, iz, LIGHT, { state: { hanging: "false", waterlogged: "false" } });
}

// 3. Roof equipment on the podium roof (2 x 2 units, 2 high, on the roof field)
for (const [ux, uz] of [[20, 5], [20, 10], [1, 12]]) {
  const cells4 = [[ux, uz], [ux + 1, uz], [ux, uz + 1], [ux + 1, uz + 1]];
  if (!cells4.every(([cx, cz]) => roofOf(cx, cz) === 17)) continue;
  for (const [cx, cz] of cells4) for (const y of [17, 18]) put(cx, y, cz, EQUIP);
}

// 4. Glazing joins its neighbours in the same plane (pier or pane), so the grid reads as framed glass
const joins = (x, y, z) => { const v = at(x, y, z); return v && (v.block === STONE || v.block === GLASS); };
const paneState = (x, y, z, face) => {
  const c = (d) => { const [dx, dz] = DIRS[d]; return joins(x + dx, y, z + dz) ? "true" : "false"; };
  return face === "NS"
    ? { north: "false", south: "false", east: c("E"), west: c("W"), waterlogged: "false" }
    : { north: c("N"), south: c("S"), east: "false", west: "false", waterlogged: "false" };
};

// 5. Write the volume
const g = new Voxels([W, H, D]);
for (const [k, v] of P) {
  const [x, y, z] = k.split(",").map(Number);
  let state = v.state;
  if (v.face) state = paneState(x, y, z, v.face);
  g.set(x, y, z, v.block, state);
}

// Checks: nothing above its own tier unless it is equipment; every block stands on, or is held by, its neighbours.
const bad = [];
for (const [k, v] of P) {
  const [x, y, z] = k.split(",").map(Number);
  if (v.block === EQUIP) continue;
  if (y > roofOf(x, z) - 1 && v.block !== LIGHT) bad.push(`above roof ${k}`);
  if (y === 0) continue;
  const below = at(x, y - 1, z);
  const side = Object.values(DIRS).some(([dx, dz]) => at(x + dx, y, z + dz));
  if (!below && !side) bad.push(`unsupported ${k} ${v.block}`);
}
if (bad.length) console.warn(`${bad.length} check(s):`, bad.slice(0, 12).join("; "));

const stats = g.save(OUT);
console.log(`wrote ${OUT}: ${stats.blocks} blocks, ${stats.palette} palette entries`);
