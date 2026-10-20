import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 世貿新城 (Taipei World Trade New City): 1990s Xinyi-district office block.
// 17 x 36 footprint, roof deck at y 64 (~64 blocks above lowest ground), 12 storeys of 5 blocks.
// Materials: white concrete mullions, light-grey spandrels and floor slabs, blue-tinted glass
// panes, polished-granite shopfront base, a single street entrance, a setback mechanical crown
// with a lightning-rod mast, and warm glowstone behind some panes.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245239";
const W = 17, H = 76, D = 36;
const ROOF = 64;   // roof deck course
const FIRST = 4;   // top of plinth / first floor slab
const STOREY = 5;  // blocks per storey
const NSTOREY = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faces = (x, z) =>
  Object.keys(DIRS).filter(f => {
    const [dx, dz] = DIRS[f];
    return !has(x + dx, z + dz);
  });
const tOf = (f, x, z) => (f === "N" || f === "S" ? x : z);

// Street frontage: the face with the most exposed cells; entrance at its middle cell.
const faceCells = { N: [], S: [], W: [], E: [] };
for (const [x, z] of cells) for (const f of faces(x, z)) faceCells[f].push([x, z]);
let entFace = "S", best = -1;
for (const f of Object.keys(faceCells)) {
  if (faceCells[f].length > best) { best = faceCells[f].length; entFace = f; }
}
const entTs = faceCells[entFace].map(([x, z]) => tOf(entFace, x, z)).sort((a, b) => a - b);
const entT = entTs.length ? entTs[Math.floor(entTs.length / 2)] : -1;
const isEntrance = (x, z, f) => f === entFace && tOf(f, x, z) === entT;

// Glass pane whose row runs along the facade; connect only along the wall.
function pane(x, y, z, f) {
  const alongX = f === "N" || f === "S";
  g.set(x, y, z, "light_blue_stained_glass_pane", {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
  });
}

// ---- Foundation, plinth, floors, facade -------------------------------------
for (const [x, z, gr] of cells) {
  const fs = faces(x, z);
  const facade = fs.length > 0;
  const corner = fs.length > 1;
  const primary = fs[0];

  // Foundation down to this cell's ground, then plinth up to the first floor.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gr; y < FIRST; y++) g.set(x, y, z, "smooth_stone");

  // Storeys: slab at r=0 and r=4 across the footprint, facade windows in r=1..3.
  for (let y = Math.max(gr, FIRST); y < ROOF; y++) {
    const r = (y - FIRST) % STOREY;
    const s = Math.floor((y - FIRST) / STOREY);
    if (r === 0 || r === 4) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (!facade) continue; // interior air

    const t = primary ? tOf(primary, x, z) : 0;
    const column = corner || t % 3 === 0;

    if (s === 0) {
      // Shopfront
      if (isEntrance(x, z, primary)) {
        if (r === 1) g.set(x, y, z, "dark_oak_door", { facing: DIRS[primary] ? cardinal(primary) : "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (r === 2) g.set(x, y, z, "dark_oak_door", { facing: cardinal(primary), half: "upper", hinge: "left", open: "false", powered: "false" });
        else g.set(x, y, z, "light_gray_concrete");
      } else if (r === 1) {
        g.set(x, y, z, "polished_granite");
      } else if (column) {
        g.set(x, y, z, "white_concrete");
      } else {
        pane(x, y, z, primary);
      }
    } else {
      // Office floors: mullion columns and blue glass bays
      if (column) g.set(x, y, z, "white_concrete");
      else pane(x, y, z, primary);
    }
  }

  // Roof deck course
  g.set(x, ROOF, z, "light_gray_concrete");

  // Parapet on the exterior cells
  if (facade) {
    g.set(x, ROOF + 1, z, "white_concrete");
    g.set(x, ROOF + 2, z, "white_concrete");
  }
}

// ---- Warm light behind some panes -------------------------------------------
for (const [x, z, gr] of cells) {
  const fs = faces(x, z);
  if (fs.length !== 1) continue; // single-face cells only: lit bays are straight runs
  const f = fs[0];
  const t = tOf(f, x, z);
  if (t % 3 === 0) continue; // mullion, not glass
  if (isEntrance(x, z, f)) continue;
  const [dx, dz] = DIRS[f];
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || faces(ix, iz).length) continue; // need a free interior cell
  for (let s = 0; s < NSTOREY; s++) {
    if ((x * 7 + z * 3 + s * 5) % 5 !== 0) continue;
    const y = FIRST + s * STOREY + 2;
    if (y < ground.get(`${ix},${iz}`)) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// ---- Setback mechanical crown and mast --------------------------------------
for (const [x, z] of cells) {
  if (x >= 4 && x <= 12 && z >= 6 && z <= 29) {
    for (let y = ROOF + 1; y <= ROOF + 3; y++) g.set(x, y, z, "white_concrete");
  }
}
if (has(8, 17)) {
  for (let y = ROOF + 4; y <= ROOF + 6; y++) g.set(8, y, 17, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);

function cardinal(f) {
  return { N: "north", S: "south", W: "west", E: "east" }[f];
}
