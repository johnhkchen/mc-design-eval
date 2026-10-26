// DC53961: 900 7th St NW, a 1970s Modernist office block on a 28 x 21 footprint, flat ground (y 0).
// Massing from lidar roof heights, median-smoothed into three tiers: the perimeter body (roof 18), a central block (20)
// and a penthouse core (21) on the south side, plus a skylit light court in the north notch (5). Every column is solid
// on a plinth from y 0; floor slabs run every 3 blocks; the outer cells are the wall (piers, spandrels, glass in 2-high
// rows), the inner cells are air behind the glass with a few warm lights in them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC53961.cells.json", "utf8"));

const X = 28, Z = 21, Y = 33;
const roofAt = new Map(cells.map(([x, z, , r]) => [x + "," + z, r]));
const inside = (x, z) => roofAt.has(x + "," + z);
const roof = (x, z) => roofAt.get(x + "," + z);

// lidar noise to flat tiers: the mean over the 5x5 footprint neighbourhood, then a square-cornered core
const mean = (x, z, k) => {
  let s = 0, n = 0;
  for (let dx = -k; dx <= k; dx++) for (let dz = -k; dz <= k; dz++) if (inside(x + dx, z + dz)) { s += roof(x + dx, z + dz); n++; }
  return s / n;
};
const top = (x, z) => {
  if (roof(x, z) <= 8) return 5;                  // the north notch: a skylit light court, not a roof
  const m = mean(x, z, 2);
  if (x >= 14 && x <= 18 && z >= 12 && m >= 18.6) return 21;   // penthouse core on the south side
  return m >= 18.6 ? 20 : 18;                     // central block (lidar 19-20) over the perimeter body (17-18)
};

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z, T) => Object.entries(DIRS)
  .filter(([, [dx, dz]]) => !inside(x + dx, z + dz) || top(x + dx, z + dz) < T).map(([k]) => k);

const plan = new Map();                           // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => plan.get(`${x},${y},${z}`);

const ENTRANCE = new Set(["13,20", "14,20"]);    // double doors on the south face
const LANTERNS = new Set(["12,20", "15,20"]);   // hanging lanterns beside the doors

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inside(x, z)) continue;
  const T = top(x, z), faces = exposed(x, z, T), wall = faces.length > 0;
  const corner = faces.length >= 2;
  // along-face index: x on the N/S faces, z on the E/W faces; a pier every third bay
  const along = faces.includes("N") || faces.includes("S") ? x : z;
  const pier = corner || (wall && along % 3 === 0);

  put(x, 0, z, "stone_bricks");                  // plinth, all cells
  for (let y = 1; y <= T - 2; y++) {
    const floor = y % 3 === 0 && y <= T - 3;     // storey line
    if (!wall) { if (floor) put(x, y, z, "light_gray_concrete"); continue; }
    const key = `${x},${z}`;
    if (y === 1) {                                 // shopfront kickplate, or the door
      if (ENTRANCE.has(key)) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: x === 13 ? "left" : "right", open: "false", powered: "false" });
      else put(x, y, z, "stone_bricks");
      continue;
    }
    if (y === 2 && ENTRANCE.has(key)) { put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: x === 13 ? "left" : "right", open: "false", powered: "false" }); continue; }
    if (y === 2 && LANTERNS.has(key)) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
    if (pier) { put(x, y, z, "smooth_quartz"); continue; }
    if (y % 3 === 0) { put(x, y, z, "light_gray_concrete"); continue; }      // spandrel
    put(x, y, z, "light_blue_stained_glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  }
  // cap: a cornice on the wall cells, the roof field inside; the court is roofed in glass
  if (T === 5) put(x, T - 1, z, "light_blue_stained_glass");
  else put(x, T - 1, z, wall ? "smooth_quartz" : "gray_concrete");
  if (wall && T >= 18) put(x, T, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });   // parapet
}

// roof equipment on the penthouse and a short plant room on the central roof
for (const [x, z] of [[16, 17], [17, 17], [16, 18], [17, 18]]) if (inside(x, z) && top(x, z) === 21 && !exposed(x, z, 21).length) {
  put(x, 21, z, "light_gray_concrete");
}
for (const [x, z] of [[8, 9], [9, 9]]) if (inside(x, z) && top(x, z) === 20 && !exposed(x, z, 20).length) put(x, 20, z, "stone_bricks");

// warm lights: a few windows on each face get a glowstone or shroomlight just inside the glass
const lit = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inside(x, z)) continue;
  const T = top(x, z), faces = exposed(x, z, T);
  if (faces.length !== 1) continue;
  const f = faces[0];
  const along = f === "N" || f === "S" ? x : z;
  for (const y of [4, 7, 10]) {                  // a few windows per face, on the storeys above the shopfront
    if (y > T - 3 || along % 6 !== 4 || at(x, y, z)?.block !== "light_blue_stained_glass_pane") continue;
    const [dx, dz] = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[f];
    const ix = x + dx, iz = z + dz;
    if (!inside(ix, iz) || at(ix, y, iz)) continue;
    put(ix, y, iz, lit.length % 2 ? "shroomlight" : "glowstone");
    lit.push([ix, y, iz]);
  }
}

// glass panes join their neighbours along the wall, so the window band reads as one frame
const CONNECT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
for (const [key, p] of plan) {
  if (p.block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  for (const [side, [dx, dz]] of Object.entries(CONNECT)) {
    const n = at(x + dx, y, z + dz);
    p.state[side] = n && !["lantern", "dark_oak_door"].includes(n.block) ? "true" : "false";
  }
}

const g = new Voxels([X, Y, Z]);
for (const [key, p] of plan) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, p.block, p.state);
}
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC53961.nbt");
console.log(JSON.stringify(out));
