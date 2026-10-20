import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1016280211";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Footprint 25 x 18. Roof about 21 blocks above lowest ground: four storeys of 5 blocks,
// a white-tiled 1990s commercial/office block with a glazed shopfront, pier-and-spandrel
// facade, dark blue glass strips, a parapet and a small rooftop penthouse.
const W = 25, H = 33, D = 18, ROOF = 21;
const g = new Voxels([W, H, D]);

const fp = new Map();
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, gr);
const has = (x, z) => fp.has(`${x},${z}`);
const edgeZ = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const edgeX = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const isEdge = (x, z) => edgeZ(x, z) || edgeX(x, z);
// window columns on the faces; piers at corners and every third column
const winCol = (x, z) => {
  const ez = edgeZ(x, z), ex = edgeX(x, z);
  if (ez && !ex) return x % 3 !== 0;
  if (ex && !ez) return z % 3 !== 0;
  return false;
};

// Entrance: outward (north, z = 0 side) edge cell nearest the centre line
const doorCands = cells.filter(([x, z]) => !has(x, z - 1)).sort((a, b) => Math.abs(a[0] - 12.5) - Math.abs(b[0] - 12.5));
const door = doorCands.length ? { x: doorCands[0][0], z: doorCands[0][1] } : null;

for (const [x, z, gr] of cells) {
  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  for (let y = gr; y < ROOF; y++) {
    // roof surface of the top storey (y 20)
    if (y === 20) {
      g.set(x, y, z, edge ? "smooth_quartz" : "gray_concrete");
      continue;
    }
    // floor slabs / string courses at every 5th row
    if (y % 5 === 0) {
      g.set(x, y, z, edge ? "smooth_quartz" : "smooth_stone");
      continue;
    }
    if (!edge) continue; // interior: air gap plus floor slabs only

    // base course on the ground cell
    if (y === gr && gr % 5 !== 0) {
      g.set(x, y, z, "polished_andesite");
      continue;
    }

    const k = Math.floor(y / 5);
    const r = y % 5;

    if (r === 4) { // spandrel under each window band
      g.set(x, y, z, "white_concrete");
      continue;
    }

    // r = 1..3: window band
    const isDoorCell = door && x === door.x && z === door.z && k === 0;
    if (k === 0) {
      // shopfront on the ground storey
      if (isDoorCell) {
        if (y === gr + 1) { g.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (y === gr + 2) { g.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        if (y === gr + 3) { g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }
      }
      if (winCol(x, z)) g.set(x, y, z, "light_blue_stained_glass");
      else g.set(x, y, z, "white_concrete");
      continue;
    }

    // upper storeys: glass panes in frames, piers in white concrete
    if (winCol(x, z)) {
      g.set(x, y, z, "light_blue_stained_glass_pane");
      // warm light behind some panes, in the air gap just inside the glass
      if (r === 2 && (x + z + k) % 4 === 0) {
        let ix = null, iz = null;
        if (edgeZ(x, z)) { ix = x; iz = !has(x, z - 1) ? z + 1 : z - 1; }
        else if (edgeX(x, z)) { iz = z; ix = !has(x - 1, z) ? x + 1 : x - 1; }
        if (ix !== null && has(ix, iz) && !isEdge(ix, iz)) g.set(ix, y, iz, "glowstone");
      }
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }
}

// Parapet and cap on the edge of the roof
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  g.set(x, ROOF, z, "white_concrete");
  g.set(x, ROOF + 1, z, "smooth_stone");
}

// Rooftop penthouse and plant, on interior roof cells only
for (let x = 7; x <= 17; x++) {
  for (let z = 5; z <= 12; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    for (let y = ROOF; y <= ROOF + 2; y++) {
      const perim = x === 7 || x === 17 || z === 5 || z === 12;
      if (perim) g.set(x, y, z, y === ROOF + 1 ? "light_blue_stained_glass_pane" : "smooth_quartz");
    }
    g.set(x, ROOF + 3, z, "smooth_stone");
  }
}

// Mechanical units
for (let x = 19; x <= 21; x++) {
  for (let z = 3; z <= 4; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    g.set(x, ROOF, z, "light_gray_concrete");
    g.set(x, ROOF + 1, z, "light_gray_concrete");
  }
}

g.save(`${dir}/${id}.nbt`);
