import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588101260";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint is 30 x 43 blocks; roof about 31 blocks above lowest ground.
// Reads as a six-storey mid-rise office block (1990s-2000s Xinyi),
// pale concrete frame, blue-tinted glazing, shopfront at street level.
const W = 30, H = 43, D = 43;
const STOREY = 5;          // blocks per storey
const STOREYS = 6;
const DECK = STOREY * STOREYS; // y=30 roof deck
const PARAPET = DECK + 1;      // y=31 parapet top

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const grd = new Map();
for (const [x, z, gy] of cells) grd.set(key(x, z), Math.round(gy));
const base = Math.min(...grd.values());
const inside = (x, z) => grd.has(key(x, z));
const gnd = (x, z) => grd.get(key(x, z)) - base;
const perim = (x, z) =>
  inside(x, z) && (!inside(x + 1, z) || !inside(x - 1, z) || !inside(x, z + 1) || !inside(x, z - 1));

const all = [...grd.keys()].map((k) => k.split(",").map(Number));
const perimCells = all.filter(([x, z]) => perim(x, z));
const zMin = Math.min(...perimCells.map(([, z]) => z));
const frontCells = perimCells.filter(([, z]) => z === zMin);
const cx = frontCells.reduce((s, [x]) => s + x, 0) / frontCells.length;
const doorXs = frontCells
  .map(([x]) => x)
  .sort((a, b) => Math.abs(a - cx) - Math.abs(b - cx))
  .slice(0, 2);

// 1. Foundations: solid from y 0 up to each cell's ground.
for (const [x, z] of all) {
  const gy = gnd(x, z);
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Floor slabs on interior cells at every storey line, including roof deck.
for (const [x, z] of all) {
  if (perim(x, z)) continue;
  const gy = gnd(x, z);
  for (let k = 1; k <= STOREYS; k++) {
    const y = k * STOREY;
    if (y >= gy) g.set(x, y, z, "light_gray_concrete");
  }
}

// 3. Perimeter walls: base courses, spandrels, window grid, shopfront, door, lights.
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (const [x, z] of perimCells) {
  const gy = gnd(x, z);
  const isDoorCell = z === zMin && doorXs.includes(x);
  // inward neighbour for lamps placed behind glass
  let inward = null;
  for (const [dx, dz] of dirs) {
    if (!inside(x + dx, z + dz)) {
      const ix = x - dx, iz = z - dz;
      if (inside(ix, iz) && !perim(ix, iz)) inward = [ix, iz];
      break;
    }
  }
  for (let y = gy; y <= DECK; y++) {
    const s = Math.floor(y / STOREY);
    const r = y % STOREY;
    if (isDoorCell && s === 0 && y <= gy + 1) {
      const half = y === gy ? "lower" : "upper";
      g.set(x, y, z, "oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (r === 0) {
      g.set(x, y, z, "white_concrete");
    } else if (r === 4) {
      g.set(x, y, z, "gray_concrete");
    } else {
      const pillar = (x + z) % 3 === 0;
      if (pillar) {
        g.set(x, y, z, "quartz_block");
      } else {
        g.set(x, y, z, s === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");
        if (s >= 1 && r === 2 && (x + z) % 6 === 1 && inward) {
          g.set(inward[0], y, inward[1], "glowstone");
        }
      }
    }
  }
}

// 4. Parapet cap on perimeter.
for (const [x, z] of perimCells) g.set(x, PARAPET, z, "white_concrete");

// 5. Corner lanterns on the parapet.
for (const [x, z] of perimCells) {
  const openX = !inside(x - 1, z) || !inside(x + 1, z);
  const openZ = !inside(x, z - 1) || !inside(x, z + 1);
  if (openX && openZ) {
    g.set(x, PARAPET + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 6. Roof plant: solid box with louvred glass band, capped.
const PH_Y0 = DECK + 1, PH_Y1 = DECK + 3, PH_CAP = DECK + 4;
for (const [x, z] of all) {
  if (perim(x, z)) continue;
  if (x < 9 || x > 20 || z < 14 || z > 28) continue;
  for (let y = PH_Y0; y <= PH_Y1; y++) {
    const ring = x === 9 || x === 20 || z === 14 || z === 28;
    if (ring && y === PH_Y0 + 1 && (x + z) % 2 === 0) {
      g.set(x, y, z, "gray_stained_glass");
    } else {
      g.set(x, y, z, "light_gray_concrete");
    }
  }
  g.set(x, PH_CAP, z, "gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
