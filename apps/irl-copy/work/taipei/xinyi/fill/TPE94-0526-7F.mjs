import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 臺北市災害應變中心大樓 (Taipei City Emergency Operations Center), 2005.
// Seven-storey government office block: pale concrete frame, blue glass
// curtain wall with mullions, stone plinth, a recessed stone entrance bay
// with doors and a canopy, flat roof with parapet, rooftop plant and a mast.
// Storeys are 5 blocks; roof deck at y 35.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0526-7F";
const W = 63, H = 47, D = 104;
const TOP = 35;
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

const groundOf = new Map();
for (const [x, z, gr] of cells) {
  groundOf.set(`${Math.round(x)},${Math.round(z)}`, Math.min(TOP - 1, Math.max(0, Math.round(gr))));
}
const inside = (x, z) => groundOf.has(`${x},${z}`);
const isEdge = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

function set(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
}

// Entrance: centred on the north (min z) face.
const northCells = cells.map(([x, z]) => [Math.round(x), Math.round(z)]).filter(([x, z]) => !inside(x, z - 1));
let mid = Math.round(W / 2);
if (northCells.length) {
  const xs = northCells.map(c => c[0]);
  mid = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
}

// Centroid for the rooftop plant and mast.
let sx = 0, sz = 0;
for (const [x, z] of groundOf.keys().map(k => k.split(",").map(Number))) { sx += x; sz += z; }
const cx = Math.round(sx / groundOf.size), cz = Math.round(sz / groundOf.size);

for (const [x, z] of groundOf.keys().map(k => k.split(",").map(Number))) {
  const gr = groundOf.get(`${x},${z}`);
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  // Roof: deck at TOP, stone rim on the edge, parapet above it.
  if (edge) {
    set(x, TOP, z, "smooth_stone");
    set(x, TOP + 1, z, "white_concrete");
    set(x, TOP + 2, z, "white_concrete");
  } else {
    set(x, TOP, z, "light_gray_concrete");
  }

  const runsX = !inside(x, z - 1) || !inside(x, z + 1); // wall lies along x
  const t = runsX ? x : z;
  const faceNorth = !inside(x, z - 1);
  const dEntry = x - mid;
  const inBay = faceNorth && Math.abs(dEntry) <= 3;

  for (let y = gr; y < TOP; y++) {
    if (!edge) {
      if (y === gr || y % STOREY === 0) set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Entrance bay on the north face: stone surround, glass doors, canopy.
    if (inBay && y <= gr + 4) {
      const d = dEntry;
      const ad = Math.abs(d);
      if (y === gr + 4) {
        // Canopy: a full course of stone slab over the bay.
        set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      } else if (ad === 3) {
        set(x, y, z, "polished_andesite");                   // outer jamb
      } else if (ad === 2) {
        set(x, y, z, "stone_bricks");                        // inner jamb
      } else if (d === 0 && y === gr) {
        set(x, y, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (d === 0 && y === gr + 1) {
        set(x, y, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (d === 0) {
        set(x, y, z, "stone_bricks");                        // lintel over door
      } else {
        // Glass panels either side of the door, warm light above the door line.
        if (y === gr + 2 && ad === 1) {
          set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
        } else {
          set(x, y, z, "light_blue_stained_glass_pane", {
            north: "false", south: "false", east: "true", west: "true", waterlogged: "false",
          });
        }
      }
      continue;
    }

    // Base course / plinth.
    if (y === gr) { set(x, y, z, "smooth_stone"); continue; }

    const rel = y % STOREY;
    const s = Math.floor(y / STOREY);
    if (rel === 0) {
      set(x, y, z, "white_concrete");                        // storey line
    } else if (rel === 4) {
      set(x, y, z, "gray_concrete");                         // spandrel, darker band
    } else {
      // Window band rows 1..3.
      if (t % 3 === 0) {
        set(x, y, z, "white_concrete");                      // mullion
      } else if (rel === 2 && (t + 2 * s) % 9 === 4) {
        set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      } else {
        const connectNS = !runsX;
        set(x, y, z, "light_blue_stained_glass_pane", {
          north: connectNS ? "true" : "false",
          south: connectNS ? "true" : "false",
          east: runsX ? "true" : "false",
          west: runsX ? "true" : "false",
          waterlogged: "false",
        });
      }
    }
  }
}

// Rooftop plant: one 5x5 mechanical house at the centroid with a louvred top, and a mast.
let boxOK = true;
for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
  if (!inside(cx + dx, cz + dz) || isEdge(cx + dx, cz + dz)) boxOK = false;
}
if (boxOK) {
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    for (let y = TOP + 1; y <= TOP + 2; y++) set(cx + dx, y, cz + dz, "light_gray_concrete");
    set(cx + dx, TOP + 3, cz + dz, (dx + dz) % 2 === 0 ? "iron_bars" : "light_gray_concrete");
  }
  for (let y = TOP + 4; y <= TOP + 9; y++) {
    set(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

// Two larger rooftop units (3x3) well away from the edge, instead of scattered single blocks.
for (const [ox, oz] of [[-14, 18], [14, -18]]) {
  const ux = cx + ox, uz = cz + oz;
  let ok = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!inside(ux + dx, uz + dz) || isEdge(ux + dx, uz + dz)) ok = false;
  }
  if (!ok) continue;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    set(ux + dx, TOP + 1, uz + dz, "light_gray_concrete");
    set(ux + dx, TOP + 2, uz + dz, "light_gray_concrete");
  }
}

vox.save(`${DIR}/${ID}.nbt`);
