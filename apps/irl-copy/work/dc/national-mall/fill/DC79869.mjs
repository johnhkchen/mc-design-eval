import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Commercial-Office-Large, 501 13th St NW, Washington DC.
// Read as a mid-century (c. 1958-65) Modern office block: pale precast/white concrete
// piers and spandrels, a continuous band of tinted glazing, a smooth stone base,
// a stone-capped parapet and a few mechanical penthouses. Storeys are 3 blocks tall.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC79869";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 44, H = 33, D = 22;
const g = new Voxels([W, H, D]);

const STOREY = 3;
const MAX_TOP = 30; // leave room for penthouse plant above the roof

const fp = new Map();
for (const [x, z, gr, rr] of cells) fp.set(`${x},${z}`, { gr: Math.round(gr), rr: Math.round(rr) });
const inFP = (x, z) => fp.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Snap lidar roof height to whole storeys, so tiers are flat and clean.
function snapTop(gr, rr) {
  let top = Math.round(rr / STOREY) * STOREY;
  top = Math.max(gr + STOREY, Math.min(MAX_TOP, top));
  return top;
}

for (const [x, z] of cells) {
  const { gr, rr } = fp.get(`${x},${z}`);
  const top = snapTop(gr, rr);

  const edgeX = !inFP(x - 1, z) || !inFP(x + 1, z);
  const edgeZ = !inFP(x, z - 1) || !inFP(x, z + 1);
  const edge = edgeX || edgeZ;
  const corner = edgeX && edgeZ;
  const along = edgeZ ? x : z; // coordinate running along the facade

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const rel = y - gr;
    const storey = Math.floor(rel / STOREY);

    if (!edge) {
      // Interior: floor slabs and roof slab only, air between (no interiors).
      if (rel % STOREY === 0 || y === top - 1) put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (rel === 0) { put(x, y, z, "smooth_stone"); continue; }           // base course
    if (y === top - 1) { put(x, y, z, "white_concrete"); continue; }      // cornice band
    if (corner) { put(x, y, z, "smooth_quartz"); continue; }              // corner piers
    if (rel % STOREY === 0) { put(x, y, z, "white_concrete"); continue; } // floor spandrel
    if (along % 3 === 0) { put(x, y, z, "smooth_quartz"); continue; }     // mullion pier

    // Glazing bay: mostly clear blue glass, a few light-toned bays, very rare warm light.
    const bay = Math.floor(along / 3);
    const hash = (x * 7 + y * 3 + z * 5) % 61;
    if (hash === 0 && storey >= 1) {
      put(x, y, z, "glowstone");                          // warm light behind glass
    } else if ((bay + storey) % 5 === 0) {
      put(x, y, z, "white_stained_glass");
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }
  }

  // Parapet on the roof edge of the shell.
  if (edge && top < H) put(x, top, z, "stone_brick_wall");

  // Rooftop mechanical penthouses on the interior.
  if (!edge && (x % 11 === 5) && (z % 7 === 3) && top + 2 < H) {
    put(x, top, z, "light_gray_concrete");
    put(x, top + 1, z, "light_gray_concrete");
    put(x, top + 2, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Entrance on the front (lowest z) face, centred on the footprint.
const frontZ = 0;
const frontCells = cells.filter(([, z]) => z === frontZ);
if (frontCells.length) {
  const xs = frontCells.map(([x]) => x);
  const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
  const gr = fp.get(`${cx},${frontZ}`)?.gr ?? 0;

  // Wider recessed opening through the ground storey, with glazed doors inside.
  for (let x = cx - 3; x <= cx + 3; x++) {
    for (let y = gr; y <= gr + 2; y++) put(x, y, frontZ, "air");
  }
  for (let x = cx - 2; x <= cx + 2; x++) {
    put(x, gr, frontZ, "smooth_stone");                     // threshold step
    put(x, gr + 1, frontZ + 1, "air");
  }
  // Quartz door surround: full-height jambs and a lintel.
  for (let y = gr; y <= gr + 3; y++) {
    put(cx - 4, y, frontZ, "smooth_quartz");
    put(cx + 4, y, frontZ, "smooth_quartz");
  }
  for (let x = cx - 4; x <= cx + 4; x++) {
    put(x, gr + 3, frontZ, "smooth_quartz");
  }
  // Stone canopy band over the entrance, one block projecting in the wall plane.
  for (let x = cx - 5; x <= cx + 5; x++) {
    put(x, gr + 4, frontZ, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
  // Warm lanterns flanking the entrance, in the recess.
  put(cx - 3, gr + 2, frontZ + 1, "lantern", { hanging: "false", waterlogged: "false" });
  put(cx + 3, gr + 2, frontZ + 1, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
