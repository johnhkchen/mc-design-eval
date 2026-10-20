import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: footprint 23 x 20, roof ~11 blocks above lowest ground.
// Reading: a low two-storey Xinyi-era commercial block (1980s-90s shophouse
// type), cream tiled facade, stone base, shopfront at street level,
// punched windows above with sills and lintels, cornice and parapet, flat roof
// with plant boxes. Storeys are 5 blocks, roof top at base + 11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833579";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 20;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(x + "," + z, gr);
  if (gr < minG) minG = gr;
}
const has = (x, z) => ground.has(x + "," + z);

// Absolute levels so every storey and the roof are level across the footprint.
const B = minG;
const L = {
  groundTop: B + 4,   // last block of ground-floor storey
  cornice: B + 5,     // floor slab / cornice belt
  s2lo: B + 6,        // first block of upper storey
  s2hi: B + 9,        // last block of upper storey
  roof: B + 10,       // roof slab
  parapet: B + 11,    // parapet top (roof ~11 above lowest ground)
};

function put(x, y, z, b, p) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

// Outward facing of an edge cell (first missing neighbour), or null if interior.
function outward(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}

// Glass pane connected along the wall line only.
function pane(facing, block) {
  const along = facing === "north" || facing === "south";
  return {
    north: along ? "false" : "true",
    south: along ? "false" : "true",
    east: along ? "true" : "false",
    west: along ? "true" : "false",
    waterlogged: "false",
  };
}

// ---- foundation, slabs, walls ----------------------------------------------
const cellList = [...ground.entries()]
  .map(([k, gr]) => { const [x, z] = k.split(",").map(Number); return { x, z, gr }; })
  .sort((a, b) => a.z - b.z || a.x - b.x);

for (const { x, z, gr } of cellList) {
  // Foundation: solid from 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab between storeys and roof slab, on every cell.
  if (L.cornice >= gr) put(x, L.cornice, z, "light_gray_concrete");
  if (L.roof >= gr) put(x, L.roof, z, "light_gray_concrete");

  const edge = outward(x, z);

  if (!edge) {
    // Roof plant boxes on interior roof cells, on a grid.
    if (x % 5 === 2 && z % 5 === 2 && gr <= L.roof) {
      put(x, L.parapet, z, "iron_block");
    }
    continue;
  }

  // Facade column for this edge cell.
  const along = edge === "north" || edge === "south" ? x : z;
  const bay = along % 3; // 0 = pier/pilaster, 1 and 2 = glazing

  for (let y = gr; y <= L.parapet; y++) {
    if (y === gr) {
      put(x, y, z, "stone_bricks"); // base course
    } else if (y <= L.groundTop) {
      if (y === L.groundTop) put(x, y, z, "dark_oak_planks"); // shop fascia
      else if (bay === 0) put(x, y, z, "polished_andesite");   // shop pier
      else put(x, y, z, "light_blue_stained_glass_pane", pane(edge, "light_blue_stained_glass_pane"));
    } else if (y === L.cornice) {
      put(x, y, z, "smooth_stone"); // cornice belt
    } else if (y <= L.s2hi) {
      if (bay === 0) put(x, y, z, "smooth_quartz");                      // tiled pier
      else if (y === L.s2lo) put(x, y, z, "smooth_stone");              // sill
      else if (y === L.s2hi) put(x, y, z, "smooth_stone");              // lintel
      else put(x, y, z, "white_stained_glass_pane", pane(edge, "white_stained_glass_pane"));
    } else if (y === L.roof) {
      put(x, y, z, "smooth_stone"); // roof cornice
    } else {
      put(x, y, z, "smooth_stone"); // parapet
    }
  }
}

// ---- entrance: one door on the lowest-ground street frontage ---------------
let door = null;
for (const c of cellList) {
  const f = outward(c.x, c.z);
  if (!f || c.gr !== B) continue;
  const along = f === "north" || f === "south" ? c.x : c.z;
  if (along % 3 === 1) { door = { ...c, facing: f }; break; }
}
if (!door) {
  for (const c of cellList) {
    const f = outward(c.x, c.z);
    if (f) { door = { ...c, facing: f }; break; }
  }
}
if (door) {
  const y0 = door.gr + 1;
  put(door.x, y0, door.z, "oak_door", {
    facing: door.facing, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(door.x, y0 + 1, door.z, "oak_door", {
    facing: door.facing, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Lintel over the door, and a small canopy-style sign band.
  put(door.x, L.groundTop - 1, door.z, "smooth_stone");
  put(door.x, L.groundTop, door.z, "dark_oak_planks");
}

// ---- warm lights behind some upper windows (interior, one cell in) --------
for (const { x, z, gr } of cellList) {
  if (outward(x, z)) continue;               // interior only
  if ((x + z) % 6 !== 1) continue;           // about a third of bays
  const nearEdge = ["north", "south", "east", "west"].some((d) => {
    const nx = d === "west" ? x - 1 : d === "east" ? x + 1 : x;
    const nz = d === "north" ? z - 1 : d === "south" ? z + 1 : z;
    return has(nx, nz) && outward(nx, nz) !== null;
  });
  if (!nearEdge) continue;
  if (gr > L.s2lo) continue;
  put(x, L.s2lo + 1, z, "glowstone");
}

// ---- ground-floor shop lights ---------------------------------------------
for (const { x, z, gr } of cellList) {
  if (outward(x, z)) continue;
  if (gr > L.groundTop) continue;
  if ((x * 2 + z) % 7 === 3) put(x, gr + 1, z, "lantern");
}

g.save(`${DIR}/${ID}.nbt`);
