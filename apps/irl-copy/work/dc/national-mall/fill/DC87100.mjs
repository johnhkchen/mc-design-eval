import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87100";
const W = 36, H = 34, D = 21;
const STOREY = 3;
const MAX_TOP = 31;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint model -------------------------------------------------------
const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gd, rf] of cells) {
  cellMap.set(key(x, z), { x, z, gd, rf, top: 0 });
}
// Storey-aligned roof tiers, each on its own ground line.
for (const c of cellMap.values()) {
  const span = c.rf - c.gd;
  const n = Math.max(1, Math.round(span / STOREY));
  c.top = Math.min(MAX_TOP, c.gd + STOREY * n);
}
const maxTop = Math.max(...[...cellMap.values()].map((c) => c.top));

function topOf(x, z) {
  const c = cellMap.get(key(x, z));
  return c ? c.top : -1;
}
function exposed(x, z, y, dx, dz) {
  const nt = topOf(x + dx, z + dz);
  return nt < 0 || nt <= y;
}
function isOuter(x, z, y) {
  return exposed(x, z, y, 1, 0) || exposed(x, z, y, -1, 0) ||
         exposed(x, z, y, 0, 1) || exposed(x, z, y, 0, -1);
}
function onNSFace(x, z, y) {
  return exposed(x, z, y, 0, 1) || exposed(x, z, y, 0, -1);
}

// Entrance: the street-facing (min z) edge row, centre bay.
const minZ = Math.min(...[...cellMap.values()].map((c) => c.z));
const row = [...cellMap.values()].filter((c) => c.z === minZ).sort((a, b) => a.x - b.x);
const door = row[Math.floor(row.length / 2)];
const doorX = door ? door.x : -1;
const doorZ = door ? door.z : -1;
const bayX = new Set(row.filter((r) => Math.abs(r.x - doorX) <= 2).map((r) => r.x));
const inBay = (x, z) => z === doorZ && bayX.has(x);

// ---- build -----------------------------------------------------------------
for (const c of cellMap.values()) {
  const { x, z, gd: ground, top: T } = c;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  // Walls, floors and openings.
  for (let y = ground; y < T; y++) {
    const k = y - ground;
    const floorIdx = Math.floor(k / STOREY);
    const outer = isOuter(x, z, y);

    if (!outer) {
      if (k % STOREY === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    const isDoorCell = x === doorX && z === doorZ;
    const bay = inBay(x, z);

    // Base course at ground level.
    if (k === 0) {
      if (isDoorCell) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
        });
      } else if (bay) {
        g.set(x, y, z, "polished_granite");
      } else {
        g.set(x, y, z, "polished_granite");
      }
      continue;
    }

    // Upper door half.
    if (k === 1 && isDoorCell) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    // Ground-floor shopfront: glazed band across the street row, framed by piers.
    if (floorIdx === 0 && z === minZ && k < STOREY) {
      if (k === 2 && bay) {
        // Entrance canopy band over the door bay.
        g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
      const idx = x;
      if (idx % 3 === 0 || bay && x === doorX) {
        g.set(x, y, z, "quartz_pillar", { axis: "y" });
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
      continue;
    }

    // Storey line / spandrel.
    if (k % STOREY === 0) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }

    // Window or pier band on the upper floors.
    const idx = onNSFace(x, z, y) ? x : z;
    if (idx % 3 === 0) {
      g.set(x, y, z, "quartz_pillar", { axis: "y" });
    } else {
      const lit = ((x * 7 + z * 3 + floorIdx * 5) % 6) === 0;
      g.set(x, y, z, lit ? "yellow_stained_glass_pane" : "light_blue_stained_glass_pane");
    }
  }

  // Roof: deck on every cell, parapet and cornice on the exposed perimeter.
  if (T < H) {
    if (isOuter(x, z, T)) {
      g.set(x, T, z, "quartz_block");
      if (T + 1 < H) g.set(x, T + 1, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
    } else {
      g.set(x, T, z, "smooth_stone");
    }
  }

  // Roof plant on the tallest tier.
  if (T === maxTop && !isOuter(x, z, T) && (x % 9 === 4 || x % 9 === 5) && (z % 7 === 3 || z % 7 === 4)) {
    for (let y = T + 1; y <= T + 2 && y < H; y++) g.set(x, y, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
