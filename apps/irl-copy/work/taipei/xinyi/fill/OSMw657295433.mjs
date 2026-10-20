import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw657295433";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 23, H = 23, D = 25;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y (relative to lowest ground = 0)
const ground = new Map();
for (const c of cells) {
  const [x, z, gy] = c;
  ground.set(`${x},${z}`, Math.max(0, Math.min(4, gy)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

const NEIGH = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

function missingFaces(x, z) {
  return Object.keys(NEIGH).filter((f) => !has(x + NEIGH[f][0], z + NEIGH[f][1]));
}
function faceOf(x, z) {
  const m = missingFaces(x, z);
  if (!m.length) return null;
  return ["south", "north", "west", "east"].find((f) => m.includes(f));
}
const isPerimeter = (x, z) => missingFaces(x, z).length > 0;

// Coordinate running along a wall face
const alongU = (f, x, z) => (f === "north" || f === "south" ? x : z);

// Pane connection props for a face
function paneProps(f) {
  const ns = f === "north" || f === "south";
  return {
    north: ns ? "false" : "true",
    south: ns ? "false" : "true",
    east: ns ? "true" : "false",
    west: ns ? "true" : "false",
    waterlogged: "false",
  };
}

// Entrance: on the south-facing side, at the median position
const southCells = cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => faceOf(x, z) === "south");
let entFace = "south";
let entU;
if (southCells.length) {
  const us = southCells.map(([x, z]) => alongU("south", x, z)).sort((a, b) => a - b);
  entU = us[Math.floor(us.length / 2)];
} else {
  entFace = null;
}

const isEntranceCell = (x, z, f) =>
  entFace && f === entFace && alongU(f, x, z) === entU;
const isEntranceFlank = (x, z, f) =>
  entFace && f === entFace && Math.abs(alongU(f, x, z) - entU) === 1;

// Pass 1: foundation, floors, deck, parapet, walls
for (const [x, z, gy] of cells.map(([a, b]) => [a, b, groundAt(a, b)])) {
  const per = isPerimeter(x, z);
  const f = faceOf(x, z);

  // Foundation fill up to this cell's ground
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  // Ground-level floor / base course
  if (per) {
    g.set(x, gy, z, "polished_andesite");
  } else {
    g.set(x, gy, z, "smooth_stone");
  }

  // Second-floor slab at y=5
  g.set(x, 5, z, per ? "quartz_block" : "smooth_stone");

  // Roof deck at y=10
  g.set(x, 10, z, per ? "white_concrete" : "light_gray_concrete");

  // Parapet at y=11 on the perimeter
  if (per) g.set(x, 11, z, "smooth_quartz");

  if (!per) continue;

  const u = alongU(f, x, z);
  const pane = f === "north" || f === "south" ? "rel" : "rel";

  // Ground storey: shopfront from gy+1 to gy+3, band at gy+4
  for (let y = gy + 1; y <= gy + 3; y++) {
    if (isEntranceCell(x, z, f)) {
      // door cells handled in pass 2; glass above
      if (y === gy + 3) g.set(x, y, z, "glass_pane", paneProps(f));
      else g.set(x, y, z, "air");
      continue;
    }
    if (isEntranceFlank(x, z, f)) {
      g.set(x, y, z, "glass_pane", paneProps(f));
      continue;
    }
    if (u % 4 === 0) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "glass_pane", paneProps(f));
    }
  }
  if (isEntranceCell(x, z, f) || isEntranceFlank(x, z, f)) {
    g.set(x, gy + 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  } else {
    g.set(x, gy + 4, z, "smooth_stone");
  }

  // Upper storey: sill y=6, windows y=7..8, lintel y=9
  for (let y = 6; y <= 9; y++) {
    if (y === 6) {
      g.set(x, y, z, "smooth_quartz");
    } else if (y === 9) {
      g.set(x, y, z, "smooth_quartz");
    } else {
      if (u % 4 === 0 || u % 4 === 3) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(f));
      }
    }
  }
}

// Pass 2: doors, lamps behind glass, roof plant
const OUTVEC = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const gy = groundAt(x, z);
  const per = isPerimeter(x, z);
  const f = faceOf(x, z);

  if (per && isEntranceCell(x, z, f)) {
    g.set(x, gy + 1, z, "dark_oak_door", {
      facing: entFace, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gy + 2, z, "dark_oak_door", {
      facing: entFace, half: "upper", hinge: "left", open: "false", powered: "false",
    });
    continue;
  }

  if (!per) {
    // Roof mechanical units on the deck, spaced out
    if (x % 7 === 3 && z % 9 === 4) {
      g.set(x, 11, z, "iron_block");
    }
    continue;
  }

  // Warm lights behind selected glass (interior cell, sitting on a slab)
  const u = alongU(f, x, z);
  const [dx, dz] = OUTVEC[f];
  const ix = x - dx, iz = z - dz;
  if (has(ix, iz) && !isPerimeter(ix, iz)) {
    if (u % 8 === 1) {
      // upper storey: glowstone at y=6 sits on the y=5 slab behind the window
      g.set(ix, 6, iz, "glowstone");
    }
    if (u % 8 === 6 && !isEntranceFlank(x, z, f)) {
      // ground storey: glowstone on the floor behind the shop glass
      g.set(ix, gy + 1, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
