import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397526";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 30, H = 23, D = 39;
const g = new Voxels([W, H, D]);

// Absolute levels (y 0 = lowest ground under the footprint)
const SLAB1 = 5;     // first-floor slab / ground storey top
const SLAB2 = 10;    // second-floor slab / cornice band
const ROOF = 11;     // roof deck
const PARAPET = 12;  // parapet course on the perimeter

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

function outward(x, z) {
  if (!has(x, z - 1)) return { nx: 0, nz: -1, face: "north" };
  if (!has(x, z + 1)) return { nx: 0, nz: 1, face: "south" };
  if (!has(x - 1, z)) return { nx: -1, nz: 0, face: "west" };
  if (!has(x + 1, z)) return { nx: 1, nz: 0, face: "east" };
  return null;
}

// Entrance: north-facing perimeter cell closest to the middle of the frontage
let door = null;
{
  let best = Infinity;
  for (const [x, z, gr] of cells) {
    const o = outward(x, z);
    if (!o || o.face !== "north") continue;
    const d = Math.abs(x - Math.floor(W / 2));
    if (d < best) { best = d; door = { x, z, gr }; }
  }
}

// Wall of a pane: runs along X on north/south faces, along Z on east/west faces
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

// Columns: foundation, walls, storey slabs
for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const o = outward(x, z);
  const isDoorCell = door && door.x === x && door.z === z && o && o.face === "north";
  const gd = gr;
  const doorFits = isDoorCell && gd + 2 <= 3;

  for (let y = gr; y <= SLAB2; y++) {
    // Storey slabs run across every footprint cell
    if (y === SLAB1 || y === SLAB2) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (!o) continue; // interior air gap

    const t = (o.face === "north" || o.face === "south") ? x : z;

    if (y === gr) {
      g.set(x, y, z, "polished_andesite"); // base course
    } else if (y <= 3) {
      // Shopfront
      if (doorFits && (y === gd + 1 || y === gd + 2)) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: y === gd + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (t % 3 === 0) {
        g.set(x, y, z, "light_gray_concrete"); // shopfront mullion
      } else {
        g.set(x, y, z, "glass");
      }
    } else if (y === 4) {
      g.set(x, y, z, "black_concrete"); // shop fascia / lintel
    } else if (y >= 6 && y <= 9) {
      // Upper-floor window grid: panes in pairs, white terracotta piers
      if (t % 4 === 1 || t % 4 === 2) {
        g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(o.face));
      } else {
        g.set(x, y, z, "white_terracotta");
      }
    } else {
      // y === 5 handled above; y === 10 handled above
      g.set(x, y, z, "white_terracotta");
    }
  }

  // Parapet and roof deck over the whole footprint
  g.set(x, ROOF, z, "smooth_stone");
  if (o) g.set(x, PARAPET, z, "light_gray_concrete");
}

// Entrance canopy band above the door (inside the shopfront line)
if (door && door.gr + 3 <= 4) {
  g.set(door.x, door.gr + 3, door.z, "black_concrete");
}

// Warm lights behind glass (interior cells only)
for (const [x, z, gr] of cells) {
  const o = outward(x, z);
  if (!o) continue;
  const ix = x - o.nx, iz = z - o.nz;
  if (!has(ix, iz) || outward(ix, iz)) continue;
  const t = (o.face === "north" || o.face === "south") ? x : z;
  const ig = gnd(ix, iz);
  // Upper floor: shroomlight behind some windows
  if ((t % 4 === 1 || t % 4 === 2) && t % 8 === 1 && 7 >= ig) {
    g.set(ix, 7, iz, "shroomlight");
  }
  // Shopfront: glowstone behind some glass
  if (t % 3 !== 0 && t % 6 === 1 && gr + 1 <= 2 && 2 >= ig) {
    g.set(ix, 2, iz, "glowstone");
  }
}

// Rooftop equipment
function boxOnRoof(x0, x1, y0, y1, z0, z1, id, hollow = false) {
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!has(x, z)) continue;
      for (let y = y0; y <= y1; y++) {
        const edge = x === x0 || x === x1 || z === z0 || z === z1;
        if (hollow && !edge && y < y1) continue;
        g.set(x, y, z, id);
      }
    }
  }
}

// Water tank on iron cradle (back of roof)
boxOnRoof(4, 6, PARAPET, PARAPET, 4, 6, "iron_block");
boxOnRoof(4, 6, PARAPET + 1, PARAPET + 2, 4, 6, "iron_block");

// Lift and stair penthouse with a flat cap
boxOnRoof(17, 23, PARAPET, PARAPET + 3, 27, 33, "light_gray_concrete", true);
boxOnRoof(17, 23, PARAPET + 4, PARAPET + 4, 27, 33, "light_gray_concrete");

// Condenser units
boxOnRoof(10, 11, PARAPET, PARAPET, 14, 15, "gray_concrete");
boxOnRoof(10, 11, PARAPET, PARAPET, 18, 19, "gray_concrete");

g.save(`${DIR}/${ID}.nbt`);
