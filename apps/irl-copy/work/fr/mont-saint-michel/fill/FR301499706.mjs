import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499706";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 32, D = 8;
const g = new Voxels([W, H, D]);

const has = new Map();
for (const [x, z, ground, roof] of cells) has.set(`${x},${z}`, { ground, roof });
const inside = (x, z) => has.has(`${x},${z}`);

const minX = Math.min(...cells.map(c => c[0]));
const maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));
const base = Math.min(...cells.map(c => c[2]));

// Materials: Norman-village granite and stone, dark slate-less flat parapet
const STONE = "stone_bricks";
const BASE = "granite";
const FOUND = "cobblestone";
const SLAB = "smooth_stone";
const FRAME = "chiseled_stone_bricks";
const PANE = "glass_pane";
const GLASS = "glass";

// Quantise lidar roof heights to clean 5-block storey tiers (no per-cell noise)
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const mainTop = base + 5 * Math.max(1, Math.round((medianRoof - base) / 5));

function tierTop(roofRaw) {
  const n = Math.max(1, Math.round((roofRaw - base) / 5));
  return base + 5 * Math.min(n, Math.floor((H - 2 - base) / 5));
}

for (const [x, z, ground, roofRaw] of cells) {
  const edge = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  const gr = Math.max(0, Math.round(ground));
  // Main mass uses the dominant tier; only clearly lower cells step down
  let top = tierTop(roofRaw);
  if (top > mainTop) top = mainTop;
  if (top < base + 5) top = base + 5;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const corner = (x === minX || x === maxX);
  const front = (z === minZ);

  if (edge) {
    for (let y = gr; y <= top; y++) {
      const rel = (y - base) % 5;
      const k = Math.floor((y - base) / 5);

      if (y <= base) { g.set(x, y, z, BASE); continue; }
      if (y === top) { g.set(x, y, z, FRAME); continue; }       // parapet course
      if (rel === 0) { g.set(x, y, z, FRAME); continue; }        // storey string course
      if (rel === 4 || corner) { g.set(x, y, z, STONE); continue; } // spandrel / pilaster

      if (k === 0 && front) {
        // Shopfront with central door
        if (x === 5 && (y === base + 1 || y === base + 2)) {
          g.set(x, y, z, "oak_door", {
            facing: "south",
            half: y === base + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
          continue;
        }
        if (x >= 2 && x <= 8) { g.set(x, y, z, GLASS); continue; }
        g.set(x, y, z, STONE);
        continue;
      }

      if ((x - minX) % 2 === 1) {
        g.set(x, y, z, PANE, { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" });
        continue;
      }
      g.set(x, y, z, STONE);
    }
  } else {
    // Interior: air gap, floor slab per storey, solid deck below the parapet line
    for (let k = 1; base + 5 * k < top - 1; k++) g.set(x, base + 5 * k, z, SLAB);
    g.set(x, top - 1, z, SLAB);
  }
}

// Lantern above the entrance inside the shopfront, warm glow behind some panes
const doorInner = minZ + 1;
if (inside(5, doorInner)) g.set(5, base + 3, doorInner, "lantern", { hanging: "true", waterlogged: "false" });
for (let x = 2; x <= 8; x++) {
  if (x !== 5 && x % 2 === 0 && inside(x, doorInner)) g.set(x, base + 2, doorInner, "shroomlight");
}

g.save(`${DIR}/${ID}.nbt`);
