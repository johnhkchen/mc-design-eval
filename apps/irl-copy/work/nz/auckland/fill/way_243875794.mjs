// Mt Eden side of the CBD, 1970s-80s concrete office block: a 3-storey basalt-and-concrete podium, an 8-storey setback,
// the 11-storey tower with a roof plant room, and lower wings where the lidar roof sits under 46.
// Facade: white-concrete piers, recessed grey-glass window bays with air behind, a canopied entrance on the low (z=0) face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243875794.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243875794.nbt";

const cells = JSON.parse(readFileSync(SRC, "utf8"));   // [x, z, ground, roof] per footprint cell
const K = (x, z) => `${x},${z}`;
const roof = new Map();
for (const [x, z, , r] of cells) roof.set(K(x, z), r);
const inFp = (x, z) => roof.has(K(x, z));
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];       // N, S, W, E: [dx, dz] pointing out of a cell

// Storey lines: the floor slab sits at y = 4 + 4k (k = 0..11); the roof slab of each tier is one of them.
const PODIUM = 16, SETBACK = 32, WING = 44, TOWER = 50;
const PIER = "white_concrete", SLAB = "light_gray_concrete", GLASS = "gray_stained_glass_pane";
const BASE = "polished_andesite";

// Distance in from the footprint edge (edge cells = 1), for the setbacks.
const dist = new Map(), queue = [];
for (const [x, z] of cells) if (DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz))) { dist.set(K(x, z), 1); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(K(x, z));
  for (const [dx, dz] of DIRS) if (inFp(x + dx, z + dz) && !dist.has(K(x + dx, z + dz))) { dist.set(K(x + dx, z + dz), d + 1); queue.push([x + dx, z + dz]); }
}

// The lidar roof, median-smoothed over the 3x3 footprint neighbourhood, so single noisy cells (31, 32) do not make notches.
const smoothRoof = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) v.push(roof.get(K(x + dx, z + dz)));
  v.sort((a, b) => a - b); return v[v.length >> 1];
};

// Each cell's top block: the tower core (2+ cells in from the edge, roof >= 46) to 50; its setback ring to 32;
// the podium ring to 16; and the lower wings (roof < 46) to 44, standing on the podium.
const top = new Map();
for (const [x, z] of cells) {
  const r = smoothRoof(x, z), d = dist.get(K(x, z));
  const t = r < 46 ? WING : d >= 4 ? TOWER : d >= 2 ? SETBACK : PODIUM;
  top.set(K(x, z), t);
}
const topAt = (x, z) => (inFp(x, z) ? top.get(K(x, z)) : -1);

// Outward faces of column (x, z) at height y: a neighbour outside the footprint, or standing lower than y.
const facesAt = (x, z, y) => DIRS.filter(([dx, dz]) => topAt(x + dx, z + dz) < y);
// A cell that can carry the inner layer of a facade at height y: in the footprint, reaching y, and not a wall itself.
const innerOK = (x, y, z) => inFp(x, z) && topAt(x, z) >= y && facesAt(x, z, y).length === 0;

const vox = new Map();                                  // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => vox.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => vox.get(`${x},${y},${z}`);

for (const [x, z] of cells) {
  const t = topAt(x, z);
  for (let y = 0; y <= t; y++) {
    if (y <= 3) { put(x, y, z, BASE); continue; }                       // basalt plinth, the foundation over the slope
    const F = 4 + 4 * Math.floor((y - 4) / 4), r = y - F;              // storey floor line and row within the storey
    if (r === 0 || y === t) { put(x, y, z, SLAB); continue; }           // floor slabs and the roof slab
    if (t === TOWER && y === TOWER - 1) { put(x, y, z, PIER); continue; } // attic band under the roof
    const faces = facesAt(x, z, y);
    if (!faces.length) continue;                                         // interior: air behind the glass
    const ground = F === 4;
    const [dx, dz] = faces[0];
    const u = dx ? z : x;                                                // position along that face
    const inX = x - dx, inZ = z - dz;                                    // one block in from the face
    const pier = faces.length > 1 || u % 3 === 0;
    if (pier) {
      put(x, y, z, ground ? BASE : PIER);
      if (innerOK(inX, y, inZ)) put(inX, y, inZ, ground ? BASE : PIER);
      continue;
    }
    // window bay: the glass (or spandrel) sits one block in, leaving the face cell as an air recess
    const useInner = innerOK(inX, y, inZ);
    const [gx, gz] = useInner ? [inX, inZ] : [x, z];
    if (r === 3) { put(gx, y, gz, ground ? BASE : PIER); continue; }   // spandrel under the head
    put(gx, y, gz, GLASS);
    // some bays lit warm behind the glass: a glowstone or shroomlight in the cell behind the pane
    const bay = Math.floor(u / 3);
    const lit = useInner && (bay * 31 + F * 17 + (dx ? 11 : 0)) % 6 === 0;
    const bx = inX - dx, bz = inZ - dz;
    if (lit && innerOK(bx, y, bz)) put(bx, y, bz, (bay + F) % 2 ? "glowstone" : "shroomlight");
  }
}

// Parapets on the roof edges, one block above each tier's roof slab, where the neighbour is outside or lower.
for (const [x, z] of cells) {
  const t = topAt(x, z);
  if (DIRS.some(([dx, dz]) => topAt(x + dx, z + dz) < t)) put(x, t + 1, z, SLAB);
}

// Roof plant room: a 4x4, 2-high block on the tower roof, well in from the parapet, nearest the tower's centre.
{
  const tower = cells.filter(([x, z]) => topAt(x, z) === TOWER);
  const cx = tower.reduce((s, [x]) => s + x, 0) / tower.length, cz = tower.reduce((s, [, z]) => s + z, 0) / tower.length;
  let best = null;
  for (const [x0, z0] of tower) {
    const ok = [...Array(4).keys()].every((i) => [...Array(4).keys()].every((j) => topAt(x0 + i, z0 + j) === TOWER && dist.get(K(x0 + i, z0 + j)) >= 3));
    if (!ok) continue;
    const d = Math.hypot(x0 + 1.5 - cx, z0 + 1.5 - cz);
    if (!best || d < best.d) best = { x0, z0, d };
  }
  if (best) for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (const y of [TOWER + 1, TOWER + 2]) put(best.x0 + i, y, best.z0 + j, SLAB);
}

// Entrance: a 1-wide iron door in the middle of the low (z=0) face, flanked by solid jambs under a canopy.
{
  const faceS = cells.filter(([x, z]) => facesAt(x, z, 5).some(([dx, dz]) => dx === 0 && dz === -1)).map(([x, z]) => [x, z]).sort((a, b) => a[0] - b[0]);
  if (faceS.length) {
    const [xd, zd] = faceS[Math.floor(faceS.length / 2)];
    for (const dxj of [-1, 1]) for (const y of [5, 6, 7]) put(xd + dxj, y, zd, BASE);
    for (const dxj of [-1, 0, 1]) put(xd + dxj, 7, zd, BASE);
    const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
    put(xd, 5, zd, "iron_door", { ...door, half: "lower" });
    put(xd, 6, zd, "iron_door", { ...door, half: "upper" });
  }
}

// Glass panes connect to any neighbouring block across the wall (panes, piers, spandrels, lamps), not into the air gap.
const connects = (x, y, z) => vox.has(`${x},${y},${z}`);
for (const [k, v] of vox) {
  if (v.block !== GLASS) continue;
  const [x, y, z] = k.split(",").map(Number);
  v.state = { north: String(connects(x, y, z - 1)), south: String(connects(x, y, z + 1)), west: String(connects(x - 1, y, z)), east: String(connects(x + 1, y, z)) };
}

// Hanging check: a block with nothing under it and nothing beside it at its own height would float.
let hanging = 0;
for (const [k] of vox) {
  const [x, y, z] = k.split(",").map(Number);
  if (y === 0 || connects(x, y - 1, z)) continue;
  if (!DIRS.some(([dx, dz]) => connects(x + dx, y, z + dz))) hanging++;
}

const g = new Voxels([18, 63, 18]);
for (const [k, v] of vox) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, v.block, v.state); }
const info = g.save(OUT);
console.log(JSON.stringify({ ...info, hanging, maxY: Math.max(...[...vox.keys()].map((k) => Number(k.split(",")[1]))) }));
