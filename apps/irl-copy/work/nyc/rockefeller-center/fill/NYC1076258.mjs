// 10 West 46th Street, 1987 commercial & office building: a 20-storey tinted-glass office block on a two-storey andesite
// base, behind an 8-storey wing on West 46th Street (the north side, low z). A 68-block tower stands at the west centre
// with a 4 x 2 open light well through it; a 45-block corner pinnacle sits at the north-west corner. Footprint 18 x 20.
// The lidar roofs (wing 23-25, main 59-61, tower 65-68, corner 45, well 0) are smoothed into flat tiers, the spikes in
// the wing's south row are ignored, and the well's ground stays open and paved. The facade is the 1980s office grid:
// light-gray precast piers and spandrels, gray glass one block back from the face with air behind it, an andesite base
// course, storey lines and cornice, a parapet, double doors between hanging lanterns, glowstone in some offices, and
// roof units. No interiors: each storey is a slab, and the air gap behind the glass stops at the storey line.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1076258.cells.json`, "utf8"));
const X = 18, Z = 20, Y = 68;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Smoothed massing per footprint cell. D = the solid deck (layers 0..D-1 are full), H = top of the parapet ring.
const lidar = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));
const tierOf = (x, z) => {
  if (lidar.get(`${x},${z}`) === 0) return { D: 1, H: 1, court: true };    // lidar sees ground: the open paved light well
  if (x === 0 && z <= 3) return { D: 45, H: 45 };                          // corner pinnacle (one lidar column at 45)
  if (x <= 8 && z >= 8 && z <= 15) return { D: 66, H: 68, tower: true };   // tower (lidar 65-68) with a parapet to 68
  if (z <= 3) return { D: 24, H: 24 };                                     // 46th Street wing (lidar 23-25)
  return { D: 60, H: 61 };                                                 // main office block (lidar 59-61), coping to 61
};
const tiers = new Map(cells.map(([x, z]) => [`${x},${z}`, tierOf(x, z)]));
const T = (x, z) => tiers.get(`${x},${z}`);
const solid = (x, y, z) => { const t = T(x, z); return !!t && y < t.D; };
const parapet = (x, y, z) => {
  const t = T(x, z);
  return !!t && y >= t.D && y < t.H && NB.some(([dx, dz]) => !solid(x + dx, y, z + dz));
};

// Depth of each solid cell inside its own outer skin, one slice per layer: 1 = touches open air, 2 = behind that, ...
const di = (x, y, z) => (y * X + x) * Z + z;
const depth = new Uint8Array(X * Y * Z);
for (let y = 0; y < Y; y++) {
  const q = [];
  for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
    if (solid(x, y, z) && NB.some(([dx, dz]) => !solid(x + dx, y, z + dz))) { depth[di(x, y, z)] = 1; q.push([x, z]); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i], d = depth[di(x, y, z)];
    for (const [dx, dz] of NB) {
      const nx = x + dx, nz = z + dz;
      if (solid(nx, y, nz) && !depth[di(nx, y, nz)]) { depth[di(nx, y, nz)] = d + 1; q.push([nx, nz]); }
    }
  }
}
const dep = (x, y, z) => (solid(x, y, z) ? depth[di(x, y, z)] : 0);

// Facade roles. Storey lines are the layers with y % 3 == 0 (spandrels); the cornice is the top layer of each tier.
const crown = (x, y, z) => y === T(x, z).D - 1;
const openDirs = (x, y, z) => NB.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const pier = (x, y, z) => {
  const o = openDirs(x, y, z);
  const xo = o.some(([dx]) => dx !== 0), zo = o.some(([, dz]) => dz !== 0);
  if (xo && zo) return true;                       // a corner
  return (xo ? z : x) % 3 === 0;                   // a pier every third block along the face
};
// A window needs wall behind it: a one-block skin (the corner pinnacle above the wing) stays solid rather than a hole.
const isWin = (x, y, z) => dep(x, y, z) === 1 && !crown(x, y, z) && y % 3 !== 0 && !pier(x, y, z)
  && NB.some(([dx, dz]) => dep(x + dx, y, z + dz) === 2);
const winDir = (x, y, z) => NB.find(([dx, dz]) => isWin(x + dx, y, z + dz));
const isGlass = (x, y, z) => dep(x, y, z) === 2 && !crown(x, y, z) && y % 3 !== 0 && !!winDir(x, y, z);
const isGap = (x, y, z) => dep(x, y, z) === 3 && !crown(x, y, z) && y % 3 !== 0 && NB.some(([dx, dz]) => isGlass(x + dx, y, z + dz));
const lit = (x, y, z) => (x * 7 + y * 5 + z * 11) % 9 === 0;                 // deterministic, roughly one office in nine
const frameOf = (y) => (y < 6 ? "polished_andesite" : "light_gray_concrete");   // andesite base, then precast
const paneState = (x, y, z) => {
  const [dx] = winDir(x, y, z);                    // the pane lies in the plane of the face it sits behind
  return dx !== 0 ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
};

function spec(x, y, z) {
  const t = T(x, z);
  if (y === 0) return { block: t.court ? "smooth_stone" : "polished_andesite" };   // plinth, paved well
  if (parapet(x, y, z)) return { block: "polished_andesite" };                       // coping and parapet
  if (!solid(x, y, z)) return null;
  const d = dep(x, y, z);
  if (crown(x, y, z)) return { block: d === 1 ? "polished_andesite" : "stone" };    // cornice; roof deck behind it
  if (d === 1) return isWin(x, y, z) ? null : { block: frameOf(y) };                 // a window opening is air
  if (isGlass(x, y, z)) return { block: t.tower ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane", state: paneState(x, y, z) };
  if (isGap(x, y, z)) return y % 3 === 1 && lit(x, y, z) ? { block: "glowstone" } : null;   // air behind the glass
  return { block: "gray_concrete" };
}

// Hand-placed features on top of the facade: the lobby on West 46th Street, lanterns, the penthouse, roof units.
const over = new Map();
const put = (x, y, z, block, state) => over.set(`${x},${y},${z}`, { block, state });
const door = (x, y, z, hinge, half) => put(x, y, z, "iron_door", { facing: "north", half, hinge, open: "false", powered: "false" });
for (const y of [1, 2]) {
  door(8, y, 0, "left", y === 1 ? "lower" : "upper");
  door(9, y, 0, "right", y === 1 ? "lower" : "upper");
  for (const x of [8, 9]) for (const z of [1, 2]) put(x, y, z, "air");          // the lobby behind the doors
  put(7, y, 0, "polished_andesite");
  put(10, y, 0, "polished_andesite");
}
put(7, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
put(10, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
put(3, 1, 13, "lantern", { hanging: "false", waterlogged: "false" });            // lanterns on the paving of the well
put(6, 1, 14, "lantern", { hanging: "false", waterlogged: "false" });
for (let x = 2; x <= 5; x++) for (let z = 9; z <= 11; z++) {                      // penthouse: a ring to 67 with a cap
  put(x, 66, z, x === 2 || x === 5 || z === 9 || z === 11 ? "light_gray_concrete" : "air");
  put(x, 67, z, "polished_andesite");
}
for (let x = 12; x <= 13; x++) for (let z = 1; z <= 2; z++) for (const y of [24, 25]) put(x, y, z, "gray_concrete");
for (let x = 10; x <= 11; x++) for (let z = 5; z <= 6; z++) for (const y of [60, 61]) put(x, y, z, "gray_concrete");

const g = new Voxels([X, Y, Z]);
for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const s = over.get(`${x},${y},${z}`) ?? (T(x, z) ? spec(x, y, z) : null);
  if (s) g.set(x, y, z, s.block, s.state);
}

// Sanity: nothing hangs. A block with air straight below it must sit in a course (solid on a horizontal side), and
// a hanging lantern hangs from a block. Spandrels over window openings are courses between their piers.
let floating = 0;
const solidAt = (x, y, z) => !!g.get(x, y, z);
for (let y = 1; y < Y; y++) for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!solidAt(x, y, z) || solidAt(x, y - 1, z)) continue;
  const b = g.get(x, y, z).block;
  if (b === "minecraft:lantern" && solidAt(x, y + 1, z)) continue;
  if (b === "minecraft:iron_door" && g.get(x, y, z).state?.half === "upper") continue;
  if (NB.some(([dx, dz]) => solidAt(x + dx, y, z + dz))) continue;
  floating++;
  if (floating <= 12) console.log("hanging", x, y, z, b);
}
const stats = g.save(`${DIR}/NYC1076258.nbt`);
console.log(`NYC1076258.nbt: ${stats.blocks} blocks, ${stats.palette} palette entries, height ${Y}, floating ${floating}`);
