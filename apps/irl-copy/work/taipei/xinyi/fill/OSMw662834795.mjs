import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unnamed commercial/office block, long and narrow, c. 1990s Taipei:
// five storeys, cream tile-clad piers, cyan-glass bands, granite base,
// shopfront entrances with canopies, and rooftop plant under a parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw662834795";
const W = 199, H = 38, D = 25;
const ROOF = 25;           // roof slab index; parapet sits on top of it (roof about 26-27 absolute)
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(ROOF - 1, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;

// Shopfront entrances on the street face (z = 0), three blocks wide, door in the middle.
const ENTRANCES = [14, 60, 118, 180];
const isEntranceCol = (x) => ENTRANCES.some((c) => x >= c && x <= c + 2);
const isDoorCol = (x) => ENTRANCES.some((c) => x === c + 1);

const g = new Voxels([W, H, D]);

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const per = isEdge(x, z);
  const alongIdx = (z === 0 || z === D - 1) ? x : z;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  // Storey slab levels: ground level, then every 5 blocks above it.
  const levels = [gr];
  for (let s = STOREY; s < ROOF; s += STOREY) if (s > gr) levels.push(s);

  for (let i = 0; i < levels.length; i++) {
    const s = levels[i];
    const next = levels[i + 1] ?? ROOF;

    // Floor / base slab.
    if (per) {
      g.set(x, s, z, s === gr ? "polished_granite" : "white_concrete");
    } else {
      g.set(x, s, z, "light_gray_concrete");
    }

    // Storey body: y = s+1 .. next-1. Top course is a white header band.
    for (let y = s + 1; y <= next - 1; y++) {
      if (!per) {
        // Interior: air gap, with occasional warm light just behind the street-facing glass.
        if (z === 0 && y === s + 2 && alongIdx % 8 === 2 && has(x, 1)) {
          g.set(x, y, 1, "shroomlight");
        }
        if (z === D - 1 && y === s + 2 && alongIdx % 8 === 2 && has(x, D - 2)) {
          g.set(x, y, D - 2, "shroomlight");
        }
        continue;
      }

      const header = y === next - 1;
      if (header) {
        g.set(x, y, z, "white_concrete");
        continue;
      }

      // Ground storey on the street face: shopfront with entrances.
      if (s === gr && z === 0 && isEntranceCol(x)) {
        if (isDoorCol(x)) {
          if (y === s + 1) {
            g.set(x, y, z, "dark_oak_door", {
              facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
            });
          } else if (y === s + 2) {
            g.set(x, y, z, "dark_oak_door", {
              facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
            });
          } else {
            g.set(x, y, z, "cyan_stained_glass");
          }
        }
        // Non-door entrance columns stay open (air) for the entry bay.
        continue;
      }

      // Pier or glass bay.
      if (alongIdx % 4 === 0) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "cyan_stained_glass");
      }

      // Warm light behind some street-facing windows (air gap at z=1 / z=D-2).
      if (z === 0 && y === s + 2 && alongIdx % 8 === 2 && has(x, 1)) {
        g.set(x, y, 1, "shroomlight");
      }
      if (z === D - 1 && y === s + 2 && alongIdx % 8 === 2 && has(x, D - 2)) {
        g.set(x, y, D - 2, "shroomlight");
      }
    }
  }

  // Roof slab at ROOF; parapet on the perimeter.
  if (per) {
    g.set(x, ROOF, z, "smooth_stone");
    g.set(x, ROOF + 1, z, "white_concrete");
  } else {
    g.set(x, ROOF, z, "light_gray_concrete");
  }
}

// Entrance canopies: a stone canopy over each entry bay at the header level.
for (const c of ENTRANCES) {
  for (let x = c; x <= c + 2; x++) {
    if (!has(x, 0)) continue;
    const gr = ground.get(`${x},0`);
    g.set(x, gr + 4, 0, "smooth_stone");
    if (has(x, 1)) g.set(x, gr + 4, 1, "smooth_stone");
  }
}

// Rooftop plant rooms set back from the parapet.
const PLANT = [[30, 44], [150, 162], [182, 190]];
for (const [x0, x1] of PLANT) {
  for (let x = x0; x <= x1; x++) {
    for (let z = 8; z <= 16; z++) {
      if (!has(x, z)) continue;
      for (let y = ROOF + 1; y <= ROOF + 3; y++) g.set(x, y, z, "light_gray_concrete");
      g.set(x, ROOF + 4, z, "stone_bricks");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
