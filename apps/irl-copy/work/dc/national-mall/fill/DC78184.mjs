// DC78184: Special Purpose-Misc on 4th St NW (Judiciary Square). Read as a stripped-classical 1930s government block:
// a stone-brick base, calcite walls with smooth-stone storey bands, glazed bays, a dark roof with a stepped central
// core and parapets, and a recessed entrance on the street (west) face. Hollow: an air gap behind each glass bay and
// one floor slab per storey, the slabs carried by the walls.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC78184.cells.json`, "utf8"));

// Lidar roof heights (block tops above y 0). The two 1-block cells on the west edge are a low annex: lifted to 3.
const roofAt = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, Math.max(r, 3)]));
const R = (x, z) => roofAt.get(`${x},${z}`) ?? 0;
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
// A face is exposed when its neighbour is missing or lower: the outer skin, or the step of a setback.
const exposed = (x, z) => Object.keys(DIRS).filter((d) => R(x + DIRS[d][0], z + DIRS[d][1]) < R(x, z));

// A window sits on a lone exposed face, away from the corners and the run's ends; piers every third cell.
const windowFace = (x, z, d) => {
  const [dx, dz] = DIRS[d];
  const [ax, az] = dx ? [0, 1] : [1, 0];                       // along the face
  const runs = [-1, 1].every((s) => { const nx = x + ax * s, nz = z + az * s; return R(nx, nz) > 0 && exposed(nx, nz).includes(d); });
  const k = az ? z : x;
  return exposed(x, z).length === 1 && runs && k % 3 !== 0;
};

// Every block placed, keyed by "x,y,z"; panes are resolved last, once their neighbours are known.
const B = new Map();
const put = (x, y, z, block, extra = {}) => B.set(`${x},${y},${z}`, { block, state: extra.state, face: extra.face });
const solid = (x, y, z) => B.has(`${x},${y},${z}`);

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const r = R(x, z), top = r - 1, ex = exposed(x, z);
  const shell = ex.length > 0;
  for (let y = 0; y < r; y++) {
    if (shell) {
      if (y === 0) put(x, y, z, "stone_bricks");                                   // base course
      else if (y === top || y % 2 === 0) put(x, y, z, "smooth_stone");             // cornice and storey bands
      else if (windowFace(x, z, ex[0])) {
        // one bay in six, on the upper storeys, is lit from behind
        if (y >= 3 && (x * 5 + y * 3 + z * 7) % 6 === 0) put(x, y, z, "glowstone");
        else put(x, y, z, "gray_stained_glass_pane", { face: ex[0] });
      } else put(x, y, z, "calcite");                                              // pier
    } else {
      if (y === top) put(x, y, z, "gray_concrete");                                // roof covering
      else if (y === 0) put(x, y, z, "stone_bricks");                              // ground slab
      else if (y % 2 === 0) put(x, y, z, "smooth_stone");                          // floor slab
    }
  }
  if (ex.some((d) => R(x + DIRS[d][0], z + DIRS[d][1]) === 0)) put(x, r, z, "smooth_stone"); // parapet on the outer edge
}

// Roof plant: two 2x2 units on the 9-block roof, set on interior cells only.
for (const [x0, z0] of [[5, 10], [9, 24]]) {
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    const x = x0 + dx, z = z0 + dz;
    if (R(x, z) === 9 && exposed(x, z).length === 0) put(x, 9, z, "light_gray_concrete");
  }
}

// Recessed entrance on the street face: the middle bay of the west wall, a door set one step in, a stone
// lintel as the canopy over it, and smooth-stone reveals either side.
const zE = 19;
const wx = Math.min(...cells.filter(([, z]) => z === zE).map(([x]) => x));
put(wx, 1, zE, "dark_oak_door", { state: { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" } });
put(wx, 2, zE, "dark_oak_door", { state: { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" } });
for (const z of [zE - 1, zE + 1]) for (const y of [1, 2]) put(wx, y, z, "smooth_stone");
for (let z = zE - 2; z <= zE + 2; z++) put(wx, 3, z, "smooth_stone_slab", { state: { type: "top", waterlogged: "false" } });

// Panes connect to the solid blocks around them, as the game would draw them.
for (const [k, e] of B) {
  if (!e.face) continue;
  const [x, y, z] = k.split(",").map(Number);
  const arm = (v) => String(v);
  e.state = {
    north: arm(solid(x, y, z - 1)), south: arm(solid(x, y, z + 1)),
    east: arm(solid(x + 1, y, z)), west: arm(solid(x - 1, y, z)), waterlogged: "false",
  };
}

const g = new Voxels([16, 22, 39]);
for (const [k, { block, state }] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/DC78184.nbt`);
console.log(JSON.stringify(out));
