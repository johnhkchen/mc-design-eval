// Way 1097140887: a 1930s brick-and-render commercial terrace (stripped classical, early deco) on the Mt Eden side of the CBD.
// Shopfronts at street level, one storey on the western wings, three in the central bay and a four-storey corner block to the
// east, each tier stepping back from the one below. Solid envelope with a 1-block brick/glass facade, an air gap behind the
// glass and a floor slab per storey; a cream string course and parapet, dark timber fascia on the shopfronts.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1097140887.cells.json`, "utf8"));
const W = 118, H = 30, D = 21;

// lidar roof heights snapped to storey tiers (4 blocks a storey from a y 2 datum): 1, 2, 3, 4 storeys
const tierOf = (v) => (v <= 8 ? 6 : v <= 11 ? 10 : v <= 15 ? 14 : 18);
const FOOT = new Map();                               // "x,z" -> { g, T }: T is the tier top (the parapet cap sits at T)
for (const [x, z, g, r] of cells) FOOT.set(`${x},${z}`, { g, T: tierOf(r) });

const DIRS = [["east", 1, 0], ["west", -1, 0], ["south", 0, 1], ["north", 0, -1]];
const cellAt = (x, z) => FOOT.get(`${x},${z}`);
// lidar speckle: a cell keeps a tier only if two neighbours reach it too; otherwise it drops a tier (no stray spikes)
for (let pass = 0; pass < 4; pass++) {
  for (const [k, c] of FOOT) {
    const [x, z] = k.split(",").map(Number);
    const reach = DIRS.filter(([, dx, dz]) => (cellAt(x + dx, z + dz)?.T ?? 0) >= c.T).length;
    if (c.T > 6 && reach < 2) c.T = c.T - 4;
  }
}
// a facade face: outside the footprint, or against a lower tier (a setback's exposed side)
function faceOf(x, z) {
  const c = cellAt(x, z);
  if (!c) return { outside: null, lower: null, primary: null };
  const { T } = c;
  let outside = null, lower = null;
  for (const [n, dx, dz] of DIRS) {
    const nb = cellAt(x + dx, z + dz);
    if (!nb) outside ??= [n, dx, dz];
    else if (nb.T < T) lower ??= [n, dx, dz];
  }
  return { outside, lower, primary: outside ?? lower };
}
// bay index along the face: x on a north/south face, z on an east/west face
const bayOf = (x, z, [, dx]) => (dx ? z : x);

const B = new Map();                                  // "x,y,z" -> { b, s }
const put = (x, y, z, b, s) => { if (y >= 0 && y < H) B.set(`${x},${y},${z}`, { b, s }); };

for (const [k, { T }] of FOOT) {
  const [x, z] = k.split(",").map(Number);
  const f = faceOf(x, z);
  const facade = f.primary !== null;
  const bay = facade ? bayOf(x, z, f.primary) : 0;
  for (let y = 0; y < T; y++) {
    if (!facade) {                                    // interior: foundation, floor slabs, roof deck, air between
      if (y < 2) put(x, y, z, "stone");
      else if ((y - 2) % 4 === 0) put(x, y, z, "smooth_stone");
      else if (y === T - 1) put(x, y, z, "gray_concrete");
      continue;
    }
    if (y < 2) { put(x, y, z, "polished_andesite"); continue; }   // base course
    const k4 = Math.floor((y - 2) / 4), r = (y - 2) % 4;
    if (r === 0) put(x, y, z, "smooth_quartz");                  // string course over each storey
    else if (r === 3) put(x, y, z, k4 === 0 ? "dark_oak_planks" : "bricks");   // shopfront fascia / storey head
    else {                                            // window band: glass between brick piers
      const pier = k4 === 0 ? bay % 4 === 0 : bay % 3 === 0;
      put(x, y, z, pier ? (k4 === 0 ? "stone_bricks" : "bricks") : "glass_pane");
    }
  }
  if (facade) put(x, T, z, "smooth_quartz");           // parapet cap
}

// entrances: ground-floor doors on street-side outside faces, a green canopy over each
const doors = [];
for (const [k, { T }] of FOOT) {
  const [x, z] = k.split(",").map(Number);
  const f = faceOf(x, z);
  if (!f.outside || bayOf(x, z, f.outside) % 12 !== 6) continue;
  const [facing] = f.outside;
  doors.push([x, z, facing]);
  for (const [dx, dz] of [[0, 0], [f.outside[1] ? 0 : 1, f.outside[1] ? 1 : 0], [f.outside[1] ? 0 : -1, f.outside[1] ? -1 : 0]]) {
    const nb = faceOf(x + dx, z + dz);
    if (nb.primary && nb.primary[0] === facing) put(x + dx, 4, z + dz, "green_concrete");
  }
  put(x, 2, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, 3, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// warm light behind the glass: lanterns in the upper storeys, glowstone in the shopfronts; air cells just inside the facade
for (const [k, { T }] of FOOT) {
  const [x, z] = k.split(",").map(Number);
  const f = faceOf(x, z);
  if (!f.primary) continue;                           // interior cell: nothing to light
  const [, dx, dz] = f.primary;
  const bay = bayOf(x, z, f.primary);
  const ix = x - dx, iz = z - dz;
  if (!cellAt(ix, iz) || faceOf(ix, iz).primary) continue;   // the inward cell must be interior
  for (let y = 3; y < T - 1; y += 4) {
    const k4 = Math.floor((y - 3) / 4);
    if (k4 === 0 && bay % 4 === 2) put(ix, y, iz, "glowstone");
    else if (k4 > 0 && bay % 6 === 1) put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// rooftop plant rooms on the two taller tiers, set back from the parapet
for (const [k, { T }] of FOOT) {
  const [x, z] = k.split(",").map(Number);
  if (T < 14 || faceOf(x, z).primary || x % 9 !== 4 || z % 7 !== 3) continue;
  put(x, T, z, "light_gray_concrete"); put(x, T + 1, z, "light_gray_concrete");
}

// glass panes join their neighbours in the wall (other panes and solid faces), as vanilla does
const NON_SOLID = new Set(["lantern", "dark_oak_door"]);
const solid = (x, y, z) => { const c = B.get(`${x},${y},${z}`); return c && (c.b === "glass_pane" || !NON_SOLID.has(c.b)); };
for (const [key, c] of B) {
  if (c.b !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  c.s = { north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)), east: String(solid(x + 1, y, z)), west: String(solid(x - 1, y, z)) };
}

const g = new Voxels([W, H, D]);
for (const [key, { b, s }] of B) { const [x, y, z] = key.split(",").map(Number); g.set(x, y, z, b, s); }
const out = g.save(`${DIR}/way_1097140887.nbt`);
console.log(`way_1097140887: ${out.blocks} blocks, ${out.palette} palette entries, ${doors.length} entrances`);
