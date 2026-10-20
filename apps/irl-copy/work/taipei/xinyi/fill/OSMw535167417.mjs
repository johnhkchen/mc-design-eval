import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Commercial mid-rise, c. 1980s-90s Taipei: five storeys of white tiled concrete
// on a stone plinth, a dark-tinted shopfront at street level, a central door
// under a dark-oak canopy, a flat roof with a parapet and a small penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535167417";
const W = 15, H = 38, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));
const ROOF = minG + 25;        // roof slab level (5 storeys of 5 blocks)
const STOREY = 5;

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Which block belongs on an exterior wall cell at height y.
function wallBlock(x, z, y, gr, face) {
  const off = y - minG;
  const k = Math.floor(off / STOREY);
  const r = off % STOREY;
  if (y === gr) return { id: "stone_bricks" };             // base course
  if (r === 0) return { id: k === 0 ? "stone_bricks" : "smooth_quartz" }; // spandrel / storey line
  if (r === 4) return { id: "white_concrete" };            // lintel band
  const pillar = face.i % 3 === 0;
  if (pillar) return { id: "white_concrete" };             // window pier
  const glass = {
    id: "light_blue_stained_glass_pane",
    props: face.xFace
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" },
  };
  return { ...glass, glass: true, k, r };
}

// Pass 1: foundations, walls, floor slabs, roof, parapet.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const missW = !has(x - 1, z), missE = !has(x + 1, z);
  const missN = !has(x, z - 1), missS = !has(x, z + 1);
  const perimeter = missW || missE || missN || missS;

  // Inward direction for the facade (used for interior lighting).
  let ix = 0, iz = 0;
  if (missW) ix = 1; else if (missE) ix = -1; else if (missN) iz = 1; else if (missS) iz = -1;
  const xFace = missW || missE;
  const face = { xFace, i: xFace ? z : x };

  if (perimeter) {
    for (let y = gr; y < ROOF; y++) {
      const b = wallBlock(x, z, y, gr, face);
      put(x, y, z, b.id, b.props);
      if (b.glass) {
        const off = y - minG;
        const k = Math.floor(off / STOREY);
        const r = off % STOREY;
        const inX = x + ix, inZ = z + iz;
        const lit = k >= 1 && r === 2 && ((x * 3 + z * 5 + k) % 6 === 0);
        if (lit && has(inX, inZ) && !(!has(inX - 1, inZ) || !has(inX + 1, inZ) || !has(inX, inZ - 1) || !has(inX, inZ + 1))) {
          put(inX, y - 1, inZ, "glowstone");
        }
      }
    }
    put(x, ROOF + 1, z, "white_concrete"); // parapet
  }

  // Floor slabs at each storey line above the cell's ground.
  for (let k = 1; k <= 4; k++) {
    const b = minG + k * STOREY;
    if (b > gr && b < ROOF) put(x, b, z, "smooth_quartz");
  }

  // Roof slab.
  if (ROOF > gr) put(x, ROOF, z, "smooth_stone");
}

// Pass 2: main entrance on the south (z+1) face, with canopy.
const fronts = cells
  .filter(([x, z]) => !has(x, z + 1))
  .sort((a, b) => a[0] - b[0]);
if (fronts.length > 0) {
  const [dx, dz, dg] = fronts[Math.floor(fronts.length / 2)];
  const doorProps = (half) => ({
    facing: "south", half, hinge: "left", open: "false", powered: "false", waterlogged: "false",
  });
  put(dx, dg + 1, dz, "oak_door", doorProps("lower"));
  put(dx, dg + 2, dz, "oak_door", doorProps("upper"));
  // Canopy: dark oak slabs over the entrance bay, on the front row.
  for (const [fx, fz, fg] of fronts) {
    if (Math.abs(fx - dx) <= 1 && fg + 3 < ROOF) {
      put(fx, fg + 3, fz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Pass 3: penthouse and mast on the roof.
for (let x = 5; x <= 9; x++) {
  for (let z = 8; z <= 11; z++) {
    if (!has(x, z)) continue;
    if (ground.get(`${x},${z}`) >= ROOF) continue;
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
  }
}
if (has(7, 9) && ground.get("7,9") < ROOF) {
  for (let y = ROOF + 3; y <= ROOF + 5; y++) put(7, y, 9, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
