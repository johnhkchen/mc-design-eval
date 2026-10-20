import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw549457247";
const W = 30, H = 23, D = 43;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) G.set(x + "," + z, gr);
}
const g = new Voxels([W, H, D]);

const inFP = (x, z) => G.has(x + "," + z);
const gr = (x, z) => G.get(x + "," + z);
const minG = Math.min(...G.values());
const TOP = Math.min(minG + 11, H - 1);           // parapet top, roof ~11 blocks above lowest ground
const xs = [...G.keys()].map(k => +k.split(",")[0]);
const zs = [...G.keys()].map(k => +k.split(",")[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs);
const cx = Math.floor((minX + maxX) / 2);          // portico centred on the street (north) face

const exposure = (x, z) => ({
  n: !inFP(x, z - 1), s: !inFP(x, z + 1),
  w: !inFP(x - 1, z), e: !inFP(x + 1, z),
});
const isFacade = (x, z) => {
  const e = exposure(x, z);
  return e.n || e.s || e.w || e.e;
};

// Place only above the cell's ground and inside the footprint.
function put(x, y, z, id, props) {
  if (!inFP(x, z)) return;
  if (y < 0 || y >= H) return;
  if (y <= gr(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const PIER = "light_gray_concrete";
const SPAN = "smooth_quartz";
const paneZ = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneX = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1) Foundation fill to each cell's ground, then ground-floor slab.
for (const [k, gv] of G) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gv && y < H; y++) g.set(x, y, z, "stone");
  if (gv < H) g.set(x, gv, z, "smooth_stone");
}

// 2) Facade walls: base course, windows in two storeys, yellow floor band, cornice, parapet.
for (const [k, gv] of G) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposure(x, z);
  if (!(ex.n || ex.s || ex.w || ex.e)) continue;
  const zFace = ex.n || ex.s;
  const xFace = ex.w || ex.e;
  const corner = zFace && xFace;

  for (let y = gv + 1; y <= TOP; y++) {
    if (y === TOP) { put(x, y, z, SPAN); continue; }                 // parapet cap
    if (y === minG + 10) { put(x, y, z, PIER); continue; }           // cornice
    if (y <= minG + 1) { put(x, y, z, "stone_bricks"); continue; }   // base course
    if (y === minG + 5) { put(x, y, z, "yellow_concrete"); continue; } // storey line
    const inS1 = y >= minG + 2 && y <= minG + 4;
    const inS2 = y >= minG + 6 && y <= minG + 8;
    if (inS1 || inS2) {
      if (corner) { put(x, y, z, PIER); continue; }
      const idx = zFace ? x : z;
      if (idx % 3 === 0) { put(x, y, z, PIER); continue; }           // mullion pier
      if (zFace) put(x, y, z, "glass_pane", paneZ);
      else put(x, y, z, "glass_pane", paneX);
      continue;
    }
    put(x, y, z, SPAN);                                               // spandrel
  }
}

// 3) Interior floor slabs and roof deck for non-facade cells.
for (const [k, gv] of G) {
  const [x, z] = k.split(",").map(Number);
  if (isFacade(x, z)) continue;
  if (minG + 5 > gv && minG + 5 < H) g.set(x, minG + 5, z, "smooth_stone");
  if (minG + 10 > gv && minG + 10 < H) g.set(x, minG + 10, z, "smooth_stone");
}

// 4) Street-side portico: canopy on two columns, central glass entrance door.
for (let dx = -2; dx <= 2; dx++) {
  const x = cx + dx;
  if (!inFP(x, minZ)) continue;
  // canopy over the portico, two rows deep
  put(x, minG + 4, minZ, "yellow_concrete");
  if (inFP(x, minZ + 1)) put(x, minG + 4, minZ + 1, "yellow_concrete");
  if (Math.abs(dx) <= 1) {
    for (let y = minG + 1; y <= minG + 3; y++) put(x, y, minZ, "air");
  }
  if (Math.abs(dx) === 2) {
    for (let y = minG + 1; y <= minG + 3; y++) put(x, y, minZ, SPAN);   // columns
  }
  if (dx === 0) {
    put(x, minG + 1, minZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, minG + 2, minZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, minG + 3, minZ, PIER);                                     // lintel
  }
  if (Math.abs(dx) === 1) {
    put(x, minG + 1, minZ, "stone_bricks");
    put(x, minG + 2, minZ, "glass_pane", paneZ);
    put(x, minG + 3, minZ, "glass_pane", paneZ);
  }
}

// 5) Rooftop plant room, set back from the parapet.
for (let x = cx + 3; x <= cx + 5; x++) {
  for (let z = minZ + 12; z <= minZ + 14; z++) {
    if (!inFP(x, z) || isFacade(x, z)) continue;
    put(x, TOP, z, PIER);
    if (TOP + 1 < H) put(x, TOP + 1, z, "smooth_stone");
  }
}

// 6) Warm lights: glowstone set just inside some windows.
for (const [k, gv] of G) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposure(x, z);
  if (!(ex.n || ex.s || ex.w || ex.e)) continue;
  const zFace = ex.n || ex.s;
  const xFace = ex.w || ex.e;
  if (zFace && xFace) continue;
  const idx = zFace ? x : z;
  if (idx % 3 === 0) continue;                           // only window cells
  let ix = x, iz = z;
  if (ex.n) iz = z + 1; else if (ex.s) iz = z - 1; else if (ex.w) ix = x + 1; else ix = x - 1;
  if (!inFP(ix, iz) || isFacade(ix, iz)) continue;
  const gi = gr(ix, iz);
  if ((x + z) % 4 === 0 && gi <= minG + 5 && minG + 6 < H) {
    g.set(ix, minG + 6, iz, "glowstone");                // storey 2, on the floor slab
  }
  if ((x + z) % 6 === 0 && gi + 1 <= minG + 4 && gi + 1 < H) {
    g.set(ix, gi + 1, iz, "glowstone");                  // storey 1, on the ground slab
  }
}

g.save(`${DIR}/${ID}.nbt`);
