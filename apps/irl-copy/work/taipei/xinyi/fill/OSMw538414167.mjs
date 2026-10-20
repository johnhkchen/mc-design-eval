import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Era read: 1980s-90s Taipei commercial mid-rise, two storeys of cream tile and
// quartz-tone panels, ground-floor shopfront, flat roof with parapet and rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414167";
const W = 17, H = 23, D = 20;
const TOP = 11;   // parapet top, relative to lowest ground
const ROOF = 10;  // roof slab / cornice row
const STOREY_LINE = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const gmin = Math.min(...cells.map((c) => c[2]));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr - gmin);

const inside = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

function outFaces(x, z) {
  const f = [];
  if (!inside(x, z - 1)) f.push("north");
  if (!inside(x, z + 1)) f.push("south");
  if (!inside(x - 1, z)) f.push("west");
  if (!inside(x + 1, z)) f.push("east");
  return f;
}

// Front = north (lowest z) face. Door on the middle north-face cell.
const northCells = cells
  .filter(([x, z]) => !inside(x, z - 1))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = northCells.length ? northCells[Math.floor(northCells.length / 2)] : -1;

const g = new Voxels([W, H, D]);

// Pass 1: foundations and interior floor slabs / roof
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const g0 = gAt(x, z);
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");
  if (outFaces(x, z).length === 0) {
    if (g0 <= STOREY_LINE) {
      g.set(x, STOREY_LINE, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    }
    if (g0 <= ROOF) g.set(x, ROOF, z, "light_gray_concrete");
  }
}

// Pass 2: perimeter facade
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const faces = outFaces(x, z);
  if (faces.length === 0) continue;
  const g0 = gAt(x, z);
  const corner = faces.length > 1;
  const front = faces.includes("north");
  const alongFace = faces.includes("north") || faces.includes("south") ? x : z;
  const pier = corner || alongFace % 3 === 0;
  const isDoor = front && x === doorX && g0 + 2 < STOREY_LINE;

  // Inward cell for backlight (only meaningful on a single-face wall cell)
  let inward = null;
  if (!corner) {
    const f = faces[0];
    const dx = f === "west" ? 1 : f === "east" ? -1 : 0;
    const dz = f === "north" ? 1 : f === "south" ? -1 : 0;
    const ix = x + dx, iz = z + dz;
    if (inside(ix, iz) && outFaces(ix, iz).length === 0 && gAt(ix, iz) <= 7) {
      inward = [ix, iz];
    }
  }

  for (let y = g0; y <= TOP; y++) {
    let b = null, props;

    if (y === g0) {
      b = "stone_bricks"; // base course
    } else if (y === STOREY_LINE || y === ROOF) {
      b = "smooth_quartz"; // storey line and cornice band
    } else if (y === TOP) {
      // crenellated parapet
      if (corner || pier || alongFace % 2 === 0) b = "white_concrete";
    } else if (y < STOREY_LINE) {
      // ground storey
      if (isDoor && (y === g0 + 1 || y === g0 + 2)) {
        b = "dark_oak_door";
        props = {
          facing: "north",
          half: y === g0 + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
      } else if (pier) {
        b = "smooth_quartz";
      } else {
        b = front ? "glass" : "light_blue_stained_glass";
      }
    } else {
      // upper storey, y 6..9
      if (pier) {
        b = "smooth_quartz";
      } else if (y === 6 || y === 9) {
        b = "white_concrete"; // sill and lintel frame
      } else {
        b = "light_blue_stained_glass";
      }
    }

    if (b) g.set(x, y, z, b, props);
  }

  // warm light behind some upper windows
  if (inward && (x + z) % 3 === 0 && g0 <= 6) {
    g.set(inward[0], 7, inward[1], "glowstone");
  }
}

// Pass 3: roof plant - AC box and stair/lift penthouse, both on the roof slab
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
const acOk = [];
for (let x = cx - 2; x <= cx + 1; x++)
  for (let z = cz - 1; z <= cz + 1; z++) acOk.push([x, z]);
if (acOk.every(([x, z]) => inside(x, z) && gAt(x, z) <= TOP - 1 && outFaces(x, z).length === 0)) {
  for (const [x, z] of acOk) {
    g.set(x, TOP, z, "light_gray_concrete");
    g.set(x, TOP + 1, z, "light_gray_concrete");
  }
  for (const [x, z] of acOk) g.set(x, TOP + 2, z, "iron_bars");
}

const pxs = [12, 13, 14], pzs = [2, 3, 4];
const pOk = [];
for (const x of pxs) for (const z of pzs) pOk.push([x, z]);
if (pOk.every(([x, z]) => inside(x, z) && gAt(x, z) <= TOP - 1 && outFaces(x, z).length === 0)) {
  for (const [x, z] of pOk) {
    const edge = x === 12 || x === 14 || z === 2 || z === 4;
    g.set(x, TOP, z, edge ? "white_concrete" : "light_gray_concrete");
    g.set(x, TOP + 1, z, edge ? "white_concrete" : "light_gray_concrete");
    if (!edge) continue;
    g.set(x, TOP + 2, z, "smooth_quartz");
  }
  // glass lantern-lit stair-head window on the penthouse north face
  g.set(13, TOP + 1, 2, "glass");
  g.set(13, TOP + 1, 1, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
