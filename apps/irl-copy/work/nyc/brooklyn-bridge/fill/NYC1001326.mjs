import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001326";
const W = 4, H = 25, D = 17;
const STOREY = 3;
const MAX_TOP = 22;

// [x, z, ground, roof] per footprint cell
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const [x, z, gr, rf] of raw) {
  cells.set(`${x},${z}`, { g: Math.round(gr), rawRoof: Math.round(rf) });
}
const has = (x, z) => cells.has(`${x},${z}`);

// Common datum for storey lines: lowest ground under the footprint.
let datum = Infinity;
for (const c of cells.values()) datum = Math.min(datum, c.g);

// Snap each cell's roof to a storey line measured from the datum.
for (const c of cells.values()) {
  const n = Math.max(1, Math.round((c.rawRoof - datum) / STOREY));
  c.top = Math.min(MAX_TOP, datum + STOREY * n);
  if (c.top < c.g + STOREY) c.top = Math.min(MAX_TOP, c.g + STOREY);
}

// One main roof tier: the median snapped top. Taller cells are cut down to it;
// shorter cells remain as lower wings.
const tops = [...cells.values()].map((c) => c.top).sort((a, b) => a - b);
const mainTop = tops[Math.floor(tops.length / 2)];
for (const c of cells.values()) {
  if (c.top > mainTop) c.top = mainTop;
}

const g = new Voxels([W, H, D]);

for (const [key, c] of cells) {
  const [x, z] = key.split(",").map(Number);
  const gr = c.g;
  const r = c.top;

  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const fw = !has(x - 1, z);
  const fe = !has(x + 1, z);
  const fn = !has(x, z - 1);
  const fs = !has(x, z + 1);
  const facade = fw || fe;
  const exterior = fw || fe || fn || fs;

  for (let y = gr; y < r; y++) {
    const t = y - datum;
    const k = Math.floor(t / STOREY);
    const w = ((t % STOREY) + STOREY) % STOREY;

    // Cornice / roof cover on the top row.
    if (y === r - 1) {
      g.set(x, y, z, exterior ? "smooth_stone" : "bricks");
      continue;
    }

    // Storey string course / floor slab.
    if (w === 0) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (facade) {
      const bay = z % 4;
      const win = bay === 1 || bay === 2;
      const street = fw;

      // Entrance in the middle bay of the street front, ground storey.
      if (street && z === 2 && k === 0) {
        const doorBase = gr; // door sits on this cell's own ground
        if (y === doorBase) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "west", half: "lower", hinge: "left", open: "false", powered: "false"
          });
          continue;
        }
        if (y === doorBase + 1) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "west", half: "upper", hinge: "left", open: "false", powered: "false"
          });
          continue;
        }
      }

      if (win) {
        g.set(x, y, z, "glass");

        // Warm light in the room behind some windows.
        if (w === 1 && y < r - 1) {
          const ix = fw ? x + 1 : x - 1;
          if (has(ix, z)) {
            const inner = cells.get(`${ix},${z}`);
            if (inner.g < y && inner.top > y + 1 && (k + z) % 3 === 0) {
              g.set(ix, y, z, "glowstone");
            }
          }
        }
      } else if (street && k === 0) {
        // Shopfront piers.
        g.set(x, y, z, "dark_oak_planks");
      } else {
        g.set(x, y, z, "bricks");
      }
      continue;
    }

    // Plain brick end walls.
    if (fn || fs) {
      g.set(x, y, z, "bricks");
    }
    // Other interior cells stay open behind the glass.
  }

  // Stone surround for the entrance, above the door.
  if (fw && z === 2 && gr + 2 < r - 1) {
    g.set(x, gr + 2, z, "smooth_stone");
  }
}

// Two chimney stacks on the main roof tier.
let chimneyCount = 0;
for (const [cx, cz] of [[1, 5], [2, 11]]) {
  if (!has(cx, cz)) continue;
  const c = cells.get(`${cx},${cz}`);
  if (c.top !== mainTop || mainTop + 3 >= H) continue;
  for (let y = mainTop; y <= mainTop + 2; y++) {
    g.set(cx, y, cz, "bricks");
  }
  g.set(cx, mainTop + 3, cz, "smooth_stone");
  chimneyCount++;
}

g.save(`${DIR}/${ID}.nbt`);
