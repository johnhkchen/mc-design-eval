import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831857638";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 14;
const g = new Voxels([W, H, D]);

// Helpers
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const fp = new Map();
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, gr);
const has = (x, z) => fp.has(`${x},${z}`);
const sidesOf = (x, z) => {
  const s = [];
  if (!has(x, z - 1)) s.push("N");
  if (!has(x, z + 1)) s.push("S");
  if (!has(x - 1, z)) s.push("W");
  if (!has(x + 1, z)) s.push("E");
  return s;
};
const xmin = Math.min(...cells.map((c) => c[0]));
const xmax = Math.max(...cells.map((c) => c[0]));
const zmin = Math.min(...cells.map((c) => c[1]));
const xmid = (xmin + xmax) / 2;

// Pillar rule: every 3rd block along a facade, plus all corners
const pillarIndex = (x, z, sides) => {
  const zFace = sides.includes("N") || sides.includes("S");
  return zFace ? x - xmin : z - zmin;
};
const isPillar = (x, z, sides) => sides.length >= 2 || pillarIndex(x, z, sides) % 3 === 0;

// Main entrance: centred on the north (street) face, on a window bay (not a pillar)
let doorX = null, doorZ = null;
{
  let best = null;
  for (const [x, z] of cells) {
    const s = sidesOf(x, z);
    if (!s.includes("N") || s.length !== 1) continue;
    if (isPillar(x, z, s)) continue;
    const d = Math.abs(x - xmid);
    if (!best || d < best.d) best = { d, x, z };
  }
  if (!best) {
    for (const [x, z] of cells) {
      if (sidesOf(x, z).includes("N")) { best = { x, z }; break; }
    }
  }
  if (best) { doorX = best.x; doorZ = best.z; }
}

// Materials
const FOUND = "stone_bricks";
const WALL = "light_gray_concrete";
const PILLAR = "white_concrete";
const BAND = "smooth_stone";
const SIGN = "red_terracotta";
const GLASS = "light_blue_stained_glass_pane";
const ROOF = "light_gray_concrete";
const PARAPET = "smooth_stone";

const glassProps = (sides) => {
  const zFace = sides.includes("N") || sides.includes("S");
  return zFace
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};

// Pass 1: foundations, floors, walls, storey lines, roofs
for (const [x, z, gr] of cells) {
  const sides = sidesOf(x, z);
  const perim = sides.length > 0;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  // Ground floor slab (base course on the perimeter)
  put(x, gr, z, perim ? FOUND : BAND);

  // Storey 2 floor line (all cells)
  put(x, gr + 5, z, BAND);

  // Roof slab (all cells)
  put(x, gr + 10, z, perim ? BAND : ROOF);

  // Parapet on the perimeter
  if (perim) put(x, gr + 11, z, PARAPET);

  // Roof equipment on some interior roof cells
  if (!perim && (x * 3 + z) % 7 === 0) put(x, gr + 11, z, "iron_block");

  if (!perim) continue;

  const pillar = isPillar(x, z, sides);
  const isFront = sides.includes("N");
  const gp = glassProps(sides);

  // Ground floor (y gr+1..gr+3): shopfront glass between pillars
  for (let dy = 1; dy <= 3; dy++) {
    const y = gr + dy;
    if (pillar) put(x, y, z, PILLAR);
    else put(x, y, z, GLASS, gp);
  }
  // Sign band at gr+4
  put(x, gr + 4, z, pillar ? PILLAR : (isFront ? SIGN : WALL));

  // Storey 2 (y gr+6..gr+9): lintel/sill rows plus glass
  put(x, gr + 6, z, pillar ? PILLAR : BAND);
  put(x, gr + 9, z, pillar ? PILLAR : BAND);
  for (const dy of [7, 8]) {
    const y = gr + dy;
    if (pillar) put(x, y, z, PILLAR);
    else put(x, y, z, GLASS, gp);
  }

  // Storey 1 and 2 wall infill where not glass
  if (!pillar) {
    // walls are already placed by the rows above where glass/band; fill remaining wall rows
    put(x, gr + 4, z, isFront ? SIGN : WALL);
  }
}

// Front door (two blocks tall, through the ground floor shopfront)
if (doorX !== null) {
  const gr = fp.get(`${doorX},${doorZ}`);
  const dprops = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(doorX, gr + 1, doorZ, "dark_oak_door", dprops("lower"));
  put(doorX, gr + 2, doorZ, "dark_oak_door", dprops("upper"));
  // Transom above the door
  put(doorX, gr + 3, doorZ, GLASS, glassProps(["N"]));
}

// Pass 2: warm lights behind some glass (interior air cells only)
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
for (const [x, z, gr] of cells) {
  const sides = sidesOf(x, z);
  if (sides.length === 0 || isPillar(x, z, sides)) continue;
  const s = sides[0];
  const [dx, dz] = inward[s];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz)) continue;
  if (sidesOf(ix, iz).length > 0) continue; // only interior cells
  const gi = fp.get(`${ix},${iz}`);
  // Upper windows: some lit
  if ((x + z) % 4 === 0) put(ix, gi + 7, iz, "glowstone");
  // Ground-floor shop lights: some lit
  if ((x + z) % 5 === 0) put(ix, gi + 2, iz, "shroomlight");
}

g.save(`${DIR}/${ID}.nbt`);
