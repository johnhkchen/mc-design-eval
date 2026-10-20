import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537991762";
const W = 29, H = 23, D = 19;
const ROOF = 10;        // roof slab / cornice layer (top surface at 11)
const PARAPET = 11;     // parapet course on the perimeter

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const key = (x, y, z) => `${x},${y},${z}`;

// perimeter = any 4-neighbour outside the footprint
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
// street face (N = low z) first, then S, W, E
const faceOf = (x, z) => (!has(x, z - 1) ? "N" : !has(x, z + 1) ? "S" : !has(x - 1, z) ? "W" : "E");

// entrance column: middle of the north (street) face
let nMin = Infinity, nMax = -Infinity;
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!has(x, z - 1)) { nMin = Math.min(nMin, x); nMax = Math.max(nMax, x); }
}
const MID = Math.floor((nMin + nMax) / 2);

// roof plant boxes on the interior roof
const mech = (x, z) => !isPerim(x, z) && (x % 9 >= 3 && x % 9 <= 5) && (z % 7 >= 3 && z % 7 <= 4);

// facade of a perimeter wall cell in the storey zones
function facade(x, y, z, g, face) {
  const t = (face === "N" || face === "S") ? x : z;
  const pier = t % 4 === 0;
  const alongX = face === "N" || face === "S";
  const winProps = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  if (y <= 4) {                                  // ground storey
    if (face === "N") {
      if (y === 4) return { name: "red_concrete" };                  // sign fascia
      if (x === MID && g <= 2 && (y === g + 1 || y === g + 2)) {    // entrance door
        return {
          name: "oak_door",
          props: {
            facing: "south", half: y === g + 1 ? "lower" : "upper",
            hinge: "left", open: "false", powered: "false",
          },
        };
      }
      if (pier) return { name: "polished_granite" };
      return { name: "glass" };                                     // shopfront glazing
    }
    if (y === g + 1) return { name: "polished_granite" };           // plinth
    if (y === 4) return { name: "light_gray_concrete" };            // spandrel
    if (pier) return { name: "light_gray_concrete" };
    return { name: "glass_pane", props: winProps };
  }

  // upper storey (y 6..9)
  if (y === 9) return { name: "light_gray_concrete" };              // lintel band
  if (pier) return { name: "light_gray_concrete" };
  return { name: "glass_pane", props: winProps };
}

// warm lights behind some upper-storey windows (in the air gap)
const overrides = new Map();
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const g = G(x, z);
  if (g >= 7) continue;
  const f = faceOf(x, z);
  const t = (f === "N" || f === "S") ? x : z;
  if (t % 4 === 0) continue;
  if ((x * 31 + z * 17) % 5 !== 0) continue;
  const [dx, dz] = INWARD[f];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isPerim(ix, iz) || G(ix, iz) >= 7) continue;
  overrides.set(key(ix, 7, iz), { name: "glowstone" });
}

// block spec for one voxel of one footprint column
function spec(x, z, g, y) {
  if (y < g) return { name: "stone_bricks" };                       // foundation
  if (y === g) return { name: "smooth_stone" };                     // ground floor slab
  if (y === 5 || y === ROOF) return { name: "smooth_stone" };       // storey slab / roof slab
  const per = isPerim(x, z);
  if (y === PARAPET) {
    if (per) return { name: "white_concrete" };
    return mech(x, z) ? { name: "light_gray_concrete" } : null;
  }
  if (y === PARAPET + 1) return mech(x, z) ? { name: "light_gray_concrete" } : null;
  if (y > ROOF) return null;
  if (!per) return null;                                            // interior air behind glass
  return facade(x, y, z, g, faceOf(x, z));
}

const vox = new Voxels([W, H, D]);

for (const [x, z, g0] of cells) {
  const g = Math.min(Math.round(g0), H - 1);
  for (let y = 0; y <= PARAPET + 1; y++) {
    if (y >= H) break;
    const o = overrides.get(key(x, y, z));
    const s = o ?? spec(x, z, g, y);
    if (!s) continue;
    if (s.props) vox.set(x, y, z, s.name, s.props);
    else vox.set(x, y, z, s.name);
  }
}

// lights placed in interior cells that are not footprint-driven above
for (const [k, s] of overrides) {
  const [x, y, z] = k.split(",").map(Number);
  if (!has(x, z)) continue;
  vox.set(x, y, z, s.name);
}

vox.save(`${DIR}/${ID}.nbt`);
