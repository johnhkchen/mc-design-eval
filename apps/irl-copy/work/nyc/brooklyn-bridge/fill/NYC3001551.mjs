import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001551.cells.json`, "utf8"));

const W = 19, H = 23, D = 6;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const c of cells) {
  const [x, z, gr, r] = c;
  map.set(`${Math.round(x)},${Math.round(z)}`, { gr: Math.round(gr), r: Math.round(r) });
}
const has = (x, z) => map.has(`${x},${z}`);

// One flat roof level for the main mass (median of lidar roof heights),
// snapped to an even course so storey lines land cleanly.
const roofs = [...map.values()].map(v => v.r).sort((a, b) => a - b);
const L = Math.min(H - 2, 2 * Math.round(roofs[Math.floor(roofs.length / 2)] / 2));

// Entrance cell: north face, x = 9
const doorCell = map.get("9,0");
const doorGnd = doorCell ? doorCell.gr : 0;

for (const [key, { gr, r }] of map) {
  const [x, z] = key.split(",").map(Number);
  const gnd = gr;
  // Lower wings keep their own (even-snapped) height; the main mass sits on L.
  let top = r >= L - 2 ? L : Math.max(gnd + 4, 2 * Math.round(r / 2));
  top = Math.min(top, H - 1);

  const exterior = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const xFace = !has(x - 1, z) || !has(x + 1, z);
  const northFace = !has(x, z - 1);
  const zInward = northFace ? 1 : -1;

  // Foundation up to this cell's ground
  for (let y = 0; y < gnd; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gnd; y <= top; y++) {
    if (exterior) {
      if (y === top) { g.set(x, y, z, "stone_brick_wall"); continue; }
      if (y === top - 1) { g.set(x, y, z, "smooth_stone"); continue; }
      if (y === gnd) { g.set(x, y, z, "stone_bricks"); } else { g.set(x, y, z, "brick"); }

      // Absolute storey lines: windows on odd y, slabs on even y
      const windowRow = y > gnd && y % 2 === 1 && y <= top - 3;

      // Entrance on north face, centred at x = 9
      if (northFace && x === 9 && (y === gnd || y === gnd + 1)) {
        g.set(x, y, z, "oak_door", {
          facing: "north",
          half: y === gnd ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (northFace && x === 9 && y === gnd + 2) {
        g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
        continue;
      }

      if (windowRow) {
        if (zFace && !xFace && x % 3 !== 0) {
          g.set(x, y, z, "glass_pane", {
            east: "true", west: "true", north: "false", south: "false", waterlogged: "false",
          });
          if ((x * 7 + y * 3) % 11 === 0) g.set(x, y, z + zInward, "glowstone");
        } else if (xFace && !zFace && z >= 1 && z <= 4) {
          g.set(x, y, z, "glass_pane", {
            east: "false", west: "false", north: "true", south: "true", waterlogged: "false",
          });
        }
      }
    } else {
      // Interior: floor slabs on even absolute y, air between, gravel roof cap
      if (y === top - 1) g.set(x, y, z, "gravel");
      else if (y < top - 1 && y % 2 === 0) g.set(x, y, z, "smooth_stone");
    }
  }
}

g.save(`${DIR}/NYC3001551.nbt`);
