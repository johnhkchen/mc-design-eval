import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw965224968";

const W = 22, H = 23, D = 18;
const TOP = 11;          // roof slab level (absolute), about 11 blocks above lowest ground
const PARAPET_TOP = 12;  // parapet coping

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---------- footprint helpers ----------
const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const DV = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

function edgeFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}
const isEdge = (x, z) => edgeFaces(x, z).length > 0;

// glass pane connection props for a wall running along its face
function paneProps(face) {
  const alongX = face === "north" || face === "south";
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
}

// bay index along the wall: piers every third bay
function isWindowBay(x, z, face) {
  const along = (face === "north" || face === "south") ? x : z;
  return along % 3 !== 0;
}

// ---------- door position: south-facing edge cell nearest the middle ----------
let door = null;
{
  const xs = cells.map(c => c[0]);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  let best = Infinity;
  for (const [x, z] of cells) {
    const f = edgeFaces(x, z);
    if (f.includes("south")) {
      const d = Math.abs(x - mid);
      if (d < best) { best = d; door = { x, z, face: "south" }; }
    }
  }
  if (!door) {
    for (const [x, z] of cells) {
      const f = edgeFaces(x, z);
      if (f.length) { door = { x, z, face: f[0] }; break; }
    }
  }
}

// ---------- main build ----------
for (const [x, z, gr] of cells) {
  if (gr >= H) continue;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const ed = edgeFaces(x, z);
  if (ed.length === 0) {
    // interior: floor slabs and roof only, air between (no interiors)
    if (gr <= 0) g.set(x, 0, z, "light_gray_concrete");
    else g.set(x, gr, z, "light_gray_concrete");
    for (const y of [5, 10]) if (y >= gr) g.set(x, y, z, "light_gray_concrete");
    if (TOP >= gr) g.set(x, TOP, z, "gray_concrete");
    continue;
  }

  // perimeter wall
  const face = ed[0];
  const win = isWindowBay(x, z, face);
  const isDoor = door && door.x === x && door.z === z;

  for (let y = gr; y <= PARAPET_TOP; y++) {
    // door occupies lower two blocks of its bay
    if (isDoor && (y === gr || y === gr + 1)) {
      g.set(x, y, z, "oak_door", {
        facing: face,
        half: y === gr ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }      // base course

    if (y <= 4) {                                                       // ground storey shopfront
      if (y === 4) { g.set(x, y, z, "light_gray_concrete"); continue; } // lintel
      if (win && y >= gr + 1) {
        g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
      } else {
        g.set(x, y, z, win ? "white_concrete" : "smooth_quartz");
      }
      continue;
    }

    if (y === 5) { g.set(x, y, z, "light_gray_concrete"); continue; } // storey line

    if (y >= 6 && y <= 9) {                                             // upper storeys
      if (win && (y === 7 || y === 8)) {
        g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
      } else if (win) {
        g.set(x, y, z, "white_concrete");                              // window head/sill
      } else {
        g.set(x, y, z, "smooth_quartz");                               // pier
      }
      continue;
    }

    if (y === 10) { g.set(x, y, z, "light_gray_concrete"); continue; } // cornice band
    if (y === 11) { g.set(x, y, z, "white_concrete"); continue; }      // parapet
    if (y === 12) { g.set(x, y, z, "light_gray_concrete"); continue; } // coping
  }
}

// ---------- warm light behind some upper-storey windows ----------
for (const [x, z, gr] of cells) {
  const ed = edgeFaces(x, z);
  if (!ed.length) continue;
  const face = ed[0];
  if (!isWindowBay(x, z, face)) continue;
  const along = (face === "north" || face === "south") ? x : z;
  if (along % 6 !== 1) continue;
  const ix = x - DV[face][0], iz = z - DV[face][1];
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  const igr = ground.get(key(ix, iz));
  if (igr >= 7) continue;
  g.set(ix, 7, iz, along % 12 === 1 ? "glowstone" : "shroomlight");
}

// ---------- roof equipment ----------
// AC plant boxes on a grid over the interior roof
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  if (x % 5 === 2 && z % 5 === 2 && gr <= TOP) {
    g.set(x, TOP + 1, z, "light_gray_concrete");
    g.set(x, TOP + 2, z, "iron_block");
  }
}

// small antenna mast near the centroid
{
  const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
  const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
  let best = null, bd = Infinity;
  for (const [x, z, gr] of cells) {
    if (isEdge(x, z) || gr > TOP) continue;
    const d = (x - cx) ** 2 + (z - cz) ** 2;
    if (d < bd) { bd = d; best = [x, z]; }
  }
  if (best) {
    for (let y = TOP + 1; y <= TOP + 4; y++) {
      g.set(best[0], y, best[1], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
