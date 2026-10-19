// 15 West 54th Street (NYC individual landmark, 1897, commercial & office): a 7 x 17 Renaissance Revival loft block.
// Lidar gives a 20-block shell ring on the long sides and a 16-block core (5 storeys + a flat roof), so the massing is
// a corniced perimeter over a lower core, with a notch-entry on the uptown (z 0) face and a rooftop penthouse.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${FILL}/NYC1034795.cells.json`, "utf8"));   // [x, z, ground, roof]

const BASE = "polished_granite", BRICK = "bricks", BAND = "white_terracotta", CAP = "smooth_stone";
const cell = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
// a cell carries a building when its roof stands above its own ground by more than a block (the notch at 2,0 does not)
const built = (x, z) => { const c = cell.get(`${x},${z}`); return !!c && c.r > c.g + 1; };
const shell = (x, z) => built(x, z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !built(x + dx, z + dz));

// lidar roof -> two flat tiers: a 3x3 median knocks out the noise, >= 18 is the 20-block shell, else the 16-block core
function tierOf(x, z) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (built(x + dx, z + dz)) vals.push(cell.get(`${x + dx},${z + dz}`).r);
  vals.sort((a, b) => a - b);
  return vals[Math.floor(vals.length / 2)] >= 18 ? 20 : 16;
}
const top = (x, z) => (shell(x, z) ? tierOf(x, z) : 16);

// facade of a shell cell at storey k, height offset dy (1 or 2 above the storey's band)
function facade(x, z, k, dy) {
  if (x === 2 && z === 1 && k === 0) {                  // the entry door, facing the notch on the uptown face
    return dy === 1 ? { block: "dark_oak_door", state: { facing: "north", half: "lower", hinge: "left", open: "true", powered: "false" } }
                    : { block: "dark_oak_door", state: { facing: "north", half: "upper", hinge: "left", open: "true", powered: "false" } };
  }
  const xFace = x === 0 || x === 6;
  let win;
  if (xFace) win = z !== 0 && z !== 16 && z % 3 !== 0;  // piers every third cell on the long sides
  else if (x === 2 && z === 1) win = true;              // the cell that faces the notch
  else win = (z === 0 ? [1, 4, 5] : [1, 2, 4, 5]).includes(x);
  if (!win) return { block: k === 0 ? BASE : BRICK };
  if (k === 0) return { block: "glass" };               // shopfront glass on the ground floor
  return { block: "glass_pane", state: xFace ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
                                             : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" } };
}

const v = new Voxels([7, 32, 17]);
const lamps = [];

for (const [key, { g, r }] of cell) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < g; y++) v.set(x, y, z, BASE);      // foundation under the higher cells, so nothing floats
  if (!built(x, z)) continue;
  const b = g, t = top(x, z), N = Math.floor((t - b) / 3);
  if (shell(x, z)) {
    for (let k = 0; k < N; k++) {
      const y0 = b + 3 * k;
      v.set(x, y0, z, k === 0 ? BASE : BAND);            // base course, then a stone band on every storey line
      for (const dy of [1, 2]) {
        const f = facade(x, z, k, dy);
        v.set(x, y0 + dy, z, f.block, f.state);
        if (dy === 1 && k > 0 && f.block === "glass_pane" && (x + 2 * z + k) % 4 === 0) lamps.push({ x, z, y: y0 + 1, k });
      }
    }
    const cornice = b + 3 * N;                           // cornice: a band, a brick parapet, a coping course
    for (let y = cornice; y < t - 1; y++) v.set(x, y, z, y === cornice ? BAND : BRICK);
    v.set(x, t - 1, z, CAP);
  } else {
    for (let k = 0; k < N; k++) v.set(x, b + 3 * k, z, CAP);   // a floor slab per storey, air between them
    v.set(x, t - 1, z, CAP);                                      // the core's flat roof
  }
}

// the notch at 2,0: a lintel across the entry, supported by the walls at 1,0 and 3,0
v.set(2, 3, 0, BAND);

// warm light: a lamp two cells inside a lit window, so an air gap stays between the glass and the lamp
lamps.forEach(({ x, z, y, k }, i) => {
  const ix = x === 0 ? 2 : x === 6 ? 4 : x, iz = x === 2 && z === 1 ? 3 : z === 0 ? 2 : z === 16 ? 14 : z;
  if (!built(ix, iz) || shell(ix, iz)) return;
  if (i % 2 === 0) v.set(ix, y, iz, "glowstone");
  else v.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
});

// roof: a brick penthouse and a chimney stack, both standing on the core's roof slab at y 15
for (const y of [16, 17]) for (const [x, z] of [[2, 10], [3, 10], [2, 11], [3, 11]]) v.set(x, y, z, BRICK);
for (const [x, z] of [[2, 10], [3, 10], [2, 11], [3, 11]]) v.set(x, 18, z, CAP);
for (let y = 16; y <= 19; y++) v.set(4, y, 13, BRICK);
v.set(4, 19, 13, CAP);

console.log(v.save(`${FILL}/NYC1034795.nbt`));
