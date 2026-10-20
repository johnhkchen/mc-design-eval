import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000072.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000072.nbt";

const W = 12, H = 24, D = 12;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(x + "," + z, { g: Math.round(gr), r: Math.round(rf) });
const has = (x, z) => map.has(x + "," + z);

// Smoothed flat roof: median lidar roof height, clamped to a sensible 1869 commercial range.
const roofs = cells.map((c) => Math.round(c[3])).sort((a, b) => a - b);
const Tbase = clamp(roofs[Math.floor(roofs.length / 2)] || 12, 8, 20);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (let z = 0; z < D; z++) {
  for (let x = 0; x < W; x++) {
    if (!has(x, z)) continue;
    const { g: gc } = map.get(x + "," + z);
    const T = clamp(Math.max(Tbase, gc + 9), 9, 23); // roof top (exclusive)
    const f1 = gc + 4;   // first storey line
    const f2 = gc + 8;   // second storey line

    // Outward faces (n = -z, s = +z, w = -x, e = +x)
    const faces = [];
    if (!has(x, z - 1)) faces.push("n");
    if (!has(x, z + 1)) faces.push("s");
    if (!has(x - 1, z)) faces.push("w");
    if (!has(x + 1, z)) faces.push("e");
    const isWall = faces.length > 0;
    const face = faces[0];
    const idx = face === "n" || face === "s" ? x : z;
    const pier = idx % 3 === 0 || idx === 11;
    const isDoorCell = face === "n" && idx === 5;

    for (let y = 0; y < T; y++) {
      if (y < gc) {
        // Foundation fill up to this cell's ground
        put(x, y, z, "stone_bricks");
        continue;
      }
      if (y >= T - 1) {
        // Roof cap / cornice
        put(x, y, z, isWall ? "smooth_stone" : "stone");
        continue;
      }
      if (!isWall) {
        // Interior: floor slabs per storey, air otherwise; a few lanterns behind glass
        if (y === gc || y === f1 || y === f2) {
          put(x, y, z, "polished_andesite");
        } else if ((y === f1 + 1 || y === f2 + 1) && (x + z) % 5 === 0) {
          put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
        }
        continue;
      }

      // Exterior wall
      if (y === gc) {
        put(x, y, z, "stone_bricks"); // base course
      } else if (y === T - 2) {
        put(x, y, z, "stone_bricks"); // frieze under cornice
      } else if (y === f1 || y === f2) {
        put(x, y, z, "smooth_stone"); // storey string course
      } else if (y < f1) {
        // Ground-floor shopfront
        if (y === gc + 3) {
          put(x, y, z, "bricks"); // transom course
        } else if (isDoorCell && (y === gc + 1 || y === gc + 2)) {
          put(x, y, z, "oak_door", {
            facing: "north",
            half: y === gc + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (pier) {
          put(x, y, z, "bricks");
        } else {
          put(x, y, z, "glass");
        }
      } else {
        // Upper storeys: two window rows, lintel row above
        const base = y >= f2 ? f2 : f1;
        const rel = y - base;
        if (rel === 3) {
          put(x, y, z, "bricks");
        } else if (rel === 1 || rel === 2) {
          put(x, y, z, pier ? "bricks" : "glass");
        } else {
          put(x, y, z, "bricks");
        }
      }
    }
  }
}

g.save(OUT);
