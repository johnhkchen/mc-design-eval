import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw965224971";
const W = 22, H = 23, D = 19;

// Era: 1980s Xinyi low-rise commercial block. Two storeys of ~5 blocks,
// stone-base concrete frame, glass shopfront and upper windows,
// smooth-stone spandrels and cornice, parapet, rooftop water tank.

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? raw.footprint ?? []);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const c of list) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  ground.set(key(x, z), Math.round(gr));
}
const cells = [...ground].map(([k, g]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, g };
});
const B = Math.min(...cells.map((c) => c.g));          // lowest ground: base level
const gAt = (x, z) => ground.get(key(x, z));
const has = (x, z) => ground.has(key(x, z));

const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Materials
const M = {
  base: "stone_bricks",
  frame: "light_gray_concrete",
  glass: "light_blue_stained_glass_pane",
  band: "smooth_stone",
  slab: "smooth_stone_slab",
  tank: "white_concrete",
};

// 1. Foundation, interior floor and roof slabs
for (const c of cells) {
  const { x, z, g: gr } = c;
  const perim = faces(x, z).length > 0;
  for (let y = 0; y < gr; y++) put(x, y, z, M.base);
  if (!perim) {
    put(x, gr, z, M.band);                       // ground-floor slab
    if (B + 5 >= gr) put(x, B + 5, z, M.band);   // upper-floor slab
    put(x, Math.max(B + 10, gr), z, M.frame);    // roof slab
  }
}

// 2. Facade on perimeter cells
for (const c of cells) {
  const { x, z, g: gr } = c;
  const fs = faces(x, z);
  if (!fs.length) continue;
  const corner = fs.length > 1;
  const face = fs[0];
  const along = face === "north" || face === "south" ? x : z;
  const pier = corner || along % 3 === 0;
  for (let y = gr; y <= B + 11; y++) {
    const off = y - B;
    let id = null;
    if (off === 0) id = M.base;
    else if (off >= 1 && off <= 3) id = pier ? M.frame : M.glass;
    else if (off === 4) id = M.frame;                       // shopfront transom
    else if (off === 5) id = M.band;                        // spandrel
    else if (off >= 6 && off <= 8) id = pier ? M.frame : M.glass;
    else if (off === 9) id = M.frame;                       // upper lintel
    else if (off === 10) id = M.band;                       // cornice
    else if (off === 11) id = M.frame;                      // parapet
    if (id) put(x, y, z, id);
  }
}

// 3. Entrance on the street side (north or south facade), nearest centre
const cx = (Math.min(...cells.map((c) => c.x)) + Math.max(...cells.map((c) => c.x))) / 2;
let door = null;
for (const c of cells) {
  const fs = faces(c.x, c.z);
  if (!fs.length || fs.length > 1) continue;
  if (!(fs[0] === "north" || fs[0] === "south")) continue;
  const d = Math.abs(c.x - cx);
  if (!door || d < door.d) door = { ...c, face: fs[0], d };
}
if (door) {
  const props = (half) => ({ facing: door.face, half, hinge: "left", open: "false", powered: "false" });
  put(door.x, door.g, door.z, "dark_oak_door", props("lower"));
  put(door.x, door.g + 1, door.z, "dark_oak_door", props("upper"));
  // Canopy-level lintel above the door, on the facade cell
  put(door.x, door.g + 2, door.z, M.frame);
}

// 4. Warm lights behind glass (on interior floor slabs)
let lamp = 0;
for (const c of cells) {
  const { x, z, g: gr } = c;
  const fs = faces(x, z);
  if (!fs.length || fs.length > 1) continue;
  const face = fs[0];
  const along = face === "north" || face === "south" ? x : z;
  if (along % 3 === 0) continue;                            // piers, no light
  const [ox, oz] = OUT[face];
  const ix = x - ox, iz = z - oz;
  if (!has(ix, iz) || faces(ix, iz).length) continue;       // must be interior
  const floorIn = gAt(ix, iz);
  if (along % 6 === 1) {
    put(ix, floorIn + 1, iz, "glowstone");                  // shopfront, dusk glow
  } else if (along % 6 === 4 && B + 5 >= floorIn) {
    put(ix, B + 6, iz, "shroomlight");                      // upper window
  }
  lamp++;
}

// 5. Rooftop water tank with stand, near the centre
let tc = null;
for (const c of cells) {
  if (faces(c.x, c.z).length) continue;
  const d = Math.abs(c.x - cx) + Math.abs(c.z - (cells.reduce((s, q) => s + q.z, 0) / cells.length));
  if (!tc || d < tc.d) tc = { ...c, d };
}
if (tc) {
  const roofY = Math.max(B + 10, tc.g);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const x = tc.x + dx, z = tc.z + dz;
    if (!has(x, z) || faces(x, z).length) continue;
    put(x, roofY + 1, z, M.base);                           // stand
    put(x, roofY + 2, z, M.tank);                           // tank body
    put(x, roofY + 3, z, M.tank);
    put(x, roofY + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
