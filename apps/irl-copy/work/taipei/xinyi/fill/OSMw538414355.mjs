import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414355";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 23, D = 20;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, b, p) => {
  if (!has(x, z)) return;                 // only footprint cells
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Classification
const xEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const zEdge = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const perim = (x, z) => xEdge(x, z) || zEdge(x, z);
const corner = (x, z) => xEdge(x, z) && zEdge(x, z);

// Pane connections: a pane on a north/south face runs along x (connect east/west)
const paneProps = (x, z) => {
  const alongX = zEdge(x, z) && !xEdge(x, z); // wall runs along x
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
};
const along = (x, z) => (zEdge(x, z) && !xEdge(x, z) ? x : z);

// Entrance: non-corner north-facing (min z) perimeter cell nearest the centre
let entrance = null;
{
  const cand = [];
  let mx = 0, n = 0;
  for (const [x, z] of cells) { mx += x; n++; }
  mx /= n;
  for (const [x, z] of cells) {
    if (!has(x, z - 1) && has(x - 1, z) && has(x + 1, z)) cand.push([x, z]);
  }
  if (cand.length) {
    cand.sort((a, b) => Math.abs(a[0] - mx) - Math.abs(b[0] - mx));
    entrance = cand[0];
  } else {
    for (const [x, z] of cells) if (perim(x, z) && !corner(x, z)) { entrance = [x, z]; break; }
  }
}

// 1) Foundations: solid from y 0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2) Building body per footprint cell
for (const [x, z, gr] of cells) {
  const top = gr + 10; // last wall/cornice course (roof about 11 blocks above base)

  if (perim(x, z)) {
    if (corner(x, z)) {
      // Corner pilasters, light concrete for articulation
      put(x, gr, z, "polished_granite");
      for (let y = gr + 1; y <= top; y++) put(x, y, z, "light_gray_concrete");
      continue;
    }

    const a = along(x, z);
    const mullion = a % 3 === 0;
    const pp = paneProps(x, z);
    const isEntrance = entrance && entrance[0] === x && entrance[1] === z;

    // Base course
    put(x, gr, z, "polished_granite");

    // Ground floor shopfront band (gr+1..gr+3)
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (mullion) put(x, y, z, "white_terracotta");
      else put(x, y, z, "light_blue_stained_glass_pane", pp);
    }
    // Lintel / spandrel
    put(x, gr + 4, z, "light_gray_concrete");

    // Storey line
    put(x, gr + 5, z, "light_gray_concrete");

    // Second storey windows (gr+6..gr+8)
    for (let y = gr + 6; y <= gr + 8; y++) {
      if (mullion) put(x, y, z, "white_terracotta");
      else put(x, y, z, "light_blue_stained_glass_pane", pp);
    }
    put(x, gr + 9, z, "white_terracotta");

    // Cornice / parapet top
    put(x, top, z, "light_gray_concrete");

    // Entrance: glass doors, transom, canopy
    if (isEntrance) {
      const facing = "north";
      put(x, gr + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "white_terracotta");
    }
    // Canopy slabs over entrance (same face, neighbours along the wall)
    if (entrance && z === entrance[1] && Math.abs(x - entrance[0]) <= 1 && !corner(x, z)) {
      put(x, gr + 4, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
    }
  } else {
    // Interior: floors and roof only; air between
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, top, z, "gray_concrete");

    // Warm lights standing on the floor, close to the glazing
    const nearWall = perim(x - 1, z) || perim(x + 1, z) || perim(x, z - 1) || perim(x, z + 1);
    if (nearWall && (x + z) % 5 === 0) {
      put(x, gr + 1, z, "glowstone");
      put(x, gr + 6, z, "glowstone");
    }

    // Roof equipment: AC plant boxes standing on the roof slab
    if ((x * 5 + z * 7) % 13 === 0) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
