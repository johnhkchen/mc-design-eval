import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey, flat-roofed concrete commercial block with a shopfront on the
// north (z = 0) street face, punched windows with light-grey frames and a
// stone parapet. Roof deck at y = 10 (about 11 blocks above the lowest ground),
// parapet to y = 11, roof plant to y = 13.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542517905";
const W = 35, H = 23, D = 16;
const ROOF = 10;      // roof deck top course
const STOREY = 5;     // storey line / upper floor slab level

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Which exterior face a footprint cell sits on (null = interior).
function faceOf(x, z) {
  if (!has(x, z - 1)) return "n";   // street frontage
  if (!has(x, z + 1)) return "s";
  if (!has(x - 1, z)) return "w";
  if (!has(x + 1, z)) return "e";
  return null;
}

const ENTRANCE_U = [16, 17, 18];
const DOOR_U = 17;

// Facade block for an exterior cell at height y (y >= ground, y < ROOF).
function facadeBlock(face, x, z, y, gr) {
  const alongX = face === "n" || face === "s";
  const u = alongX ? x - minX : z - minZ;
  const uMax = alongX ? maxX - minX : maxZ - minZ;
  const corner = (x === minX || x === maxX) && (z === minZ || z === maxZ);
  const pier = corner || u % 3 === 0 || u === uMax;

  if (y === gr) return { id: "polished_andesite" };       // base course
  if (pier) return { id: "quartz_block" };                // piers / pilasters

  if (face === "n" && y < STOREY) {                       // shopfront
    if (y === 4) return { id: "red_terracotta" };         // sign band
    if (ENTRANCE_U.includes(u) && u === DOOR_U && gr <= 1 && (y === gr + 1 || y === gr + 2)) {
      return {
        id: "dark_oak_door",
        props: {
          facing: "north",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        },
      };
    }
    return { id: "glass" };
  }

  if (y < STOREY) {                                       // ground storey, other faces
    if (y === 4) return { id: "light_gray_concrete" };
    return { id: "glass" };
  }

  // Upper storey
  if (y === STOREY) return { id: "light_gray_concrete" }; // storey line
  if (y === 6 || y === 9) return { id: "light_gray_concrete" }; // sill / head
  return { id: "light_blue_stained_glass" };              // y 7, 8
}

for (const [x, z, gr] of cells) {
  // Foundation up to the cell's own ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const face = faceOf(x, z);

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {
      put(x, y, z, face ? "smooth_stone" : "light_gray_concrete");   // roof / cornice
      continue;
    }
    if (!face) {
      // Interior: air behind glass, floor slab at the storey line.
      if (y === STOREY) put(x, y, z, "light_gray_concrete");
      continue;
    }
    const b = facadeBlock(face, x, z, y, gr);
    put(x, y, z, b.id, b.props);
  }

  if (face) {
    // Parapet course on the exterior ring.
    put(x, 11, z, "white_concrete");
  }
}

// Warm light behind selected windows (glowstone just inside the glass).
for (const [x, z, gr] of cells) {
  const face = faceOf(x, z);
  if (!face) continue;
  const alongX = face === "n" || face === "s";
  const u = alongX ? x - minX : z - minZ;
  const ix = face === "w" ? x + 1 : face === "e" ? x - 1 : x;
  const iz = face === "n" ? z + 1 : face === "s" ? z - 1 : z;
  if (!has(ix, iz) || faceOf(ix, iz) !== null) continue;
  const iGround = gAt(ix, iz);

  // Upper storey lights.
  if (u % 6 === 1) {
    const y = 7;
    if (y >= iGround && y > gr && u % 3 !== 0) put(ix, y, iz, "glowstone");
  }
  // Shopfront lights.
  if (face === "n" && u % 6 === 3) {
    const y = gr + 2;
    if (y >= iGround && y < STOREY && y > gr) put(ix, y, iz, "glowstone");
  }
}

// Rooftop plant: two AC/mechanical boxes and a short antenna mast.
function roofBox(x0, x1, z0, z1, h) {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++)
      if (has(x, z) && !faceOf(x, z))
        for (let y = 11; y < 11 + h; y++) put(x, y, z, "light_gray_concrete");
}
roofBox(5, 8, 4, 6, 2);
roofBox(24, 28, 9, 11, 2);
if (has(31, 5) && !faceOf(31, 5)) {
  for (let y = 11; y <= 13; y++) put(31, y, 5, "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
