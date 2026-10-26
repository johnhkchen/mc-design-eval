import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87130";
const W = 8, D = 15, H = 29;

// ---- read footprint: [x, z, ground, roof] per cell ----
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const byKey = new Map();
for (const [x, z, gr, rf] of raw) {
  byKey.set(`${x},${z}`, { x, z, G: Math.round(gr), R0: Math.round(rf) });
}
const cells = [...byKey.values()];

// ---- smooth lidar roof noise into flat tiers (3x3 median) ----
function median(vals) {
  vals.sort((a, b) => a - b);
  return vals[Math.floor(vals.length / 2)];
}
for (const c of cells) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = byKey.get(`${c.x + dx},${c.z + dz}`);
    if (n) near.push(n.R0);
  }
  c.R = Math.min(median(near), 25);           // roof height above y0 (cap row = R-1)
  c.G = Math.min(c.G, c.R - 8);
  if (c.G < 0) c.G = 0;
}

const g = new Voxels([W, H, D]);
const DOOR_FACING = "north"; // front face is z = 0

for (const c of cells) {
  const { x, z, G, R } = c;
  const top = R - 1;                                   // roof cap row
  const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const corner = edge && (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

  // solid foundation up to this cell's ground, plinth at ground
  for (let y = 0; y <= G; y++) g.set(x, y, z, "stone_bricks");

  // facade face and position along it
  let face = null, u = 0;
  if (edge && !corner) {
    if (z === 0)          { face = "front"; u = x; }
    else if (z === D - 1) { face = "back";  u = x; }
    else if (x === 0)     { face = "west";  u = z; }
    else                  { face = "east";  u = z; }
  }

  // interior cell directly behind this facade cell (air gap, lights go here)
  let inner = null;
  if (face === "front") inner = [x, 1];
  else if (face === "back") inner = [x, D - 2];
  else if (face === "west") inner = [1, z];
  else if (face === "east") inner = [W - 2, z];

  for (let y = G + 1; y <= top; y++) {
    const rel = y - G;
    const isFloor = rel >= 4 && (rel - 4) % 3 === 0;   // storey string courses at 4,7,10,...

    if (y === top) {                                   // roof cap / cornice
      g.set(x, y, z, edge ? "calcite" : "smooth_stone");
      continue;
    }
    if (isFloor) {                                     // floor slab / string course
      g.set(x, y, z, edge ? "calcite" : "smooth_stone");
      continue;
    }
    if (!edge) continue;                               // interior: air gap
    if (corner) { g.set(x, y, z, "bricks"); continue; }

    if (rel <= 3) {
      // ground-floor commercial shopfront: stone bulkhead, glass lights, brick piers
      if (rel === 3) { g.set(x, y, z, "dark_oak_planks"); continue; }   // signboard band
      if (rel === 1) {
        if (face === "front" && u === 3) {
          g.set(x, y, z, "dark_oak_door", {
            facing: DOOR_FACING, half: "lower", hinge: "left", open: "false", powered: "false",
          });
        } else {
          g.set(x, y, z, "stone_bricks");                                // bulkhead
        }
        continue;
      }
      // rel === 2: glass lights over the bulkhead, brick piers between
      if (face === "front" && u === 3) {
        g.set(x, y, z, "dark_oak_door", {
          facing: DOOR_FACING, half: "upper", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (u % 2 === 1) {
        g.set(x, y, z, "glass_pane");
        if (u === 5 && inner) g.set(inner[0], y, inner[1], "glowstone");
      } else {
        g.set(x, y, z, "bricks");
      }
      continue;
    }

    // upper storeys: two window rows per 3-block storey, brick piers between
    const windowRow = (rel - 4) % 3 !== 0;
    if (windowRow && u % 2 === 1) {
      g.set(x, y, z, "glass_pane");
      if (rel === 5 && u % 4 === 1 && inner) g.set(inner[0], y, inner[1], "glowstone");
    } else {
      g.set(x, y, z, "bricks");
    }
  }

  // parapet on perimeter above the cap
  if (edge && R <= H - 2) g.set(x, R, z, "calcite");
}

// rooftop plant room on the interior, sitting on the cap of its own cells
for (const c of cells) {
  const { x, z, R } = c;
  const interior = x > 0 && x < W - 1 && z > 0 && z < D - 1;
  if (!interior) continue;
  if (x >= 3 && x <= 4 && z >= 6 && z <= 8 && R + 1 <= H - 1) {
    g.set(x, R, z, "light_gray_concrete");
    g.set(x, R + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
