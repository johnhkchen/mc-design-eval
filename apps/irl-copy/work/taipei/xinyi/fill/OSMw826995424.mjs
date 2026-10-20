import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Early-1980s to 1990s Xinyi-area mid-rise: two storeys of white-tile facade over a granite base,
// a red fascia over a glazed shopfront, a quartz cornice, a flat roof with plant boxes.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw826995424";
const W = 16, H = 23, D = 17;
const ROOF = 11;     // roof deck top, about 11 blocks above lowest ground
const PARAPET = 12;  // parapet course on the perimeter

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(key(x, z), Math.max(0, Math.round(gr)));
const inF = (x, z) => foot.has(key(x, z));
const gnd = (x, z) => foot.get(key(x, z));

const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));

function setp(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Exposed faces of a footprint cell (neighbour outside the footprint).
function exposed(x, z) {
  const f = [];
  if (!inF(x, z - 1)) f.push("N");
  if (!inF(x, z + 1)) f.push("S");
  if (!inF(x - 1, z)) f.push("W");
  if (!inF(x + 1, z)) f.push("E");
  return f;
}
const isPerim = (x, z) => exposed(x, z).length > 0;

// Pane connections so a glass pane runs along the wall it sits in.
const paneProps = (face) =>
  face === "N" || face === "S"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Door column: the north face cell nearest the middle of the north frontage.
const northXs = cells.filter(([x, z]) => exposed(x, z).includes("N")).map((c) => c[0]);
let doorX = null;
if (northXs.length) {
  const mid = (minX + maxX) / 2;
  doorX = northXs.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
}

// 1. Foundation: solid stone under every cell up to its own ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) setp(x, y, z, "stone_bricks");
}

// 2. Walls, floors, roof, parapet, plant.
const glowSpots = [];
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  const perim = ex.length > 0;

  if (!perim) {
    // Interior: floor slabs only (air gap behind glass, no interiors).
    for (const y of [gr, 5, 10, ROOF]) {
      if (y >= gr && y <= ROOF) setp(x, y, z, "light_gray_concrete");
    }
    // Rooftop plant boxes on a grid.
    if (x % 5 === 2 && z % 5 === 2) setp(x, ROOF + 1, z, "iron_block");
    continue;
  }

  const corner = ex.length >= 2;
  const face = ex.includes("N") ? "N" : ex.includes("S") ? "S" : ex.includes("W") ? "W" : "E";
  const t = face === "N" || face === "S" ? x : z;

  for (let y = gr; y <= PARAPET; y++) {
    // Roof deck and parapet.
    if (y === PARAPET) {
      setp(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y === ROOF) {
      setp(x, y, z, "smooth_quartz");
      continue;
    }
    if (y === 10) {
      setp(x, y, z, "smooth_quartz");
      continue;
    }
    // Base course.
    if (y === gr) {
      setp(x, y, z, "polished_granite");
      continue;
    }
    // Corner piers run the full height.
    if (corner) {
      setp(x, y, z, "quartz_pillar", { axis: "y" });
      continue;
    }
    // Storey 1: shopfront with door, glazed bays and piers.
    if (y >= gr + 1 && y <= gr + 3) {
      if (face === "N" && x === doorX && (y === gr + 1 || y === gr + 2)) {
        const half = y === gr + 1 ? "lower" : "upper";
        setp(x, y, z, "dark_oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (face === "N" && x === doorX && y === gr + 3) {
        setp(x, y, z, "smooth_quartz");
        continue;
      }
      if (t % 4 === 0) {
        setp(x, y, z, "quartz_pillar", { axis: "y" });
      } else {
        setp(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
      }
      continue;
    }
    // Fascia band over the shopfront.
    if (y === gr + 4) {
      setp(x, y, z, "red_terracotta");
      continue;
    }
    // Storey line between floors.
    if (y === 5) {
      setp(x, y, z, "smooth_quartz");
      continue;
    }
    // Storey 2: window grid with piers.
    if (y >= 6 && y <= 9) {
      if (t % 3 === 0) {
        setp(x, y, z, "quartz_pillar", { axis: "y" });
      } else if (y === 7 || y === 8) {
        setp(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
        if (y === 7 && t % 6 === 1) glowSpots.push([x, z, face]);
      } else {
        setp(x, y, z, "white_concrete");
      }
      continue;
    }
    // Plain tile wall.
    setp(x, y, z, "white_concrete");
  }
}

// 3. Warm light behind selected upper windows (glowstone in the interior cell).
for (const [x, z, face] of glowSpots) {
  const nx = face === "W" ? x + 1 : face === "E" ? x - 1 : x;
  const nz = face === "N" ? z + 1 : face === "S" ? z - 1 : z;
  if (inF(nx, nz) && !isPerim(nx, nz)) setp(nx, 7, nz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
