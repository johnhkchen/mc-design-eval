import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "TPE91-0012-4F";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 11, H = 33, D = 7;
const g = new Voxels([W, H, D]);

const ROOF = 20;      // roof deck / top floor slab line
const PARAPET = 21;   // parapet course on the perimeter
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const dirs = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const exposed = (x, z) => Object.keys(dirs).filter(k => !has(x + dirs[k][0], z + dirs[k][1]));
const nearEdge = (x, z) => Object.values(dirs).some(([dx, dz]) => has(x + dx, z + dz) && exposed(x + dx, z + dz).length > 0);

// entrance: north-facing exposed cell nearest the median x of that face
const northXs = cells.filter(([x, z]) => exposed(x, z).includes("n")).map(c => c[0]).sort((a, b) => a - b);
const medianX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : -1;
let entranceKey = null, bestD = Infinity;
for (const [x, z] of cells) {
  if (!exposed(x, z).includes("n")) continue;
  const d = Math.abs(x - medianX);
  if (d < bestD) { bestD = d; entranceKey = `${x},${z}`; }
}

let coreCell = null;

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(gr0, PARAPET - 1));
  const ex = exposed(x, z);

  // foundation under every footprint cell, up to its own ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // interior cells: structural core (deep) or ring with floor slabs only (air gap at the glass)
  if (ex.length === 0) {
    const ring = nearEdge(x, z);
    if (!coreCell && !ring) coreCell = [x, z];
    for (let y = gr; y <= ROOF; y++) {
      const slabLine = y === gr || y % 5 === 0;
      if (ring) {
        if (slabLine) g.set(x, y, z, y === gr ? "smooth_stone" : "white_concrete");
      } else {
        g.set(x, y, z, slabLine && y !== gr ? "white_concrete" : "light_gray_concrete");
      }
    }
    continue;
  }

  // perimeter shell
  const corner = ex.length >= 2;
  const along = ex.includes("n") || ex.includes("s") ? x : z;
  for (let y = gr; y <= PARAPET; y++) {
    let b, p = null;
    if (y === PARAPET) b = "white_concrete";                  // parapet
    else if (y === ROOF) b = "polished_andesite";             // roof-edge cornice
    else if (y === gr) b = "smooth_stone";                    // base course
    else if (y < 5) {                                         // ground storey shopfront
      if (y === 4) b = "polished_andesite";                   // lintel / canopy band
      else if (corner) b = "quartz_pillar";                   // corner columns
      else if (along % 2 === 0) b = "stone_bricks";           // shopfront piers
      else b = "glass";                                       // shopfront glazing
    }
    else if (y % 5 === 0) b = "polished_andesite";            // storey line spandrel
    else if (corner) b = "quartz_pillar";                     // corner columns
    else if (along % 2 === 0) b = "white_concrete";           // mullions / piers
    else if ((x + z + y) % 7 === 0 && y % 5 === 2) b = "glowstone"; // lit window
    else {
      b = "light_blue_stained_glass_pane";
      p = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
    }
    if (p) g.set(x, y, z, b, p);
    else g.set(x, y, z, b);
  }

  // entrance door with the glazed shopfront
  if (`${x},${z}` === entranceKey && ex.includes("n") && gr + 1 <= 3) {
    g.set(x, gr, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// roof plant: a small mechanical box on one core cell
if (coreCell) {
  const [cx, cz] = coreCell;
  g.set(cx, PARAPET, cz, "stone_bricks");
  g.set(cx, PARAPET + 1, cz, "smooth_stone");
}

g.save(`${dir}/${id}.nbt`);
