import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3326014";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, D = 9, H = 22;
const g = new Voxels([W, H, D]);

const map = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr, roof] of cells) map.set(key(x, z), { gr: Math.round(gr), roof: Math.round(roof) });
const has = (x, z) => map.has(key(x, z));

// One flat roof height: the most common lidar roof value, never below the tallest ground + 6
const counts = {};
for (const [, , , roof] of cells) {
  const r = Math.round(roof);
  counts[r] = (counts[r] || 0) + 1;
}
let R = Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
const maxGround = Math.max(...cells.map(c => Math.round(c[2])));
R = Math.min(H - 2, Math.max(R, maxGround + 6));

const STONE = "stone_bricks";
const CHISEL = "chiseled_stone_bricks";
const BRICK = "bricks";
const FLOOR = "smooth_stone";
const GLASS = "glass_pane";
const LIGHT = "shroomlight";

function faces(x, z) {
  const zFace = !has(x, z - 1) ? "front" : !has(x, z + 1) ? "back" : null;
  const xFace = !has(x - 1, z) ? "west" : !has(x + 1, z) ? "east" : null;
  return { zFace, xFace };
}

function isWindow(x, z, face, lvl) {
  if (lvl < 1 || lvl > 2) return false;
  if (face === "front" || face === "back") return x === 1 || x === 4;
  if (face === "west" || face === "east") return z === 1 || z === 3 || z === 5 || z === 7;
  return false;
}

const lights = [];

for (const [x, z, grRaw] of cells) {
  const cx = Math.round(x), cz = Math.round(z);
  const gr = Math.round(grRaw);
  const { zFace, xFace } = faces(cx, cz);
  const perim = zFace !== null || xFace !== null;
  const face = zFace ?? xFace;

  // Foundation up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(cx, y, cz, STONE);

  for (let y = gr; y <= R - 1; y++) {
    const lvl = y - gr;
    if (y === R - 1) {
      // Flat roof deck; perimeter edge is a stone parapet
      g.set(cx, y, cz, perim ? STONE : FLOOR);
      continue;
    }
    if (perim) {
      // Entrance: a single door at the centre of the front, ground storey
      if (zFace === "front" && cx === 2 && (lvl === 1 || lvl === 2)) {
        g.set(cx, y, cz, "oak_door", {
          facing: "north",
          half: lvl === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (lvl === 0) { g.set(cx, y, cz, STONE); continue; }          // brownstone base course
      if (lvl % 3 === 0) { g.set(cx, y, cz, CHISEL); continue; }      // storey string course
      if (isWindow(cx, cz, face, lvl)) {
        g.set(cx, y, cz, GLASS);
        if (lvl === 1) {
          let ix = cx, iz = cz;
          if (face === "front") iz = cz + 1;
          else if (face === "back") iz = cz - 1;
          else if (face === "west") ix = cx + 1;
          else if (face === "east") ix = cx - 1;
          if (has(ix, iz) && (cx + cz) % 3 === 0) lights.push([ix, y, iz]);
        }
      } else {
        g.set(cx, y, cz, BRICK);
      }
    } else {
      // Interior: floor slabs only, air between
      if (lvl % 3 === 0) g.set(cx, y, cz, FLOOR);
    }
  }

  // Cornice: a stone slab lip projecting above the parapet on the perimeter
  if (perim && R < H) {
    g.set(cx, R, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

for (const [x, y, z] of lights) g.set(x, y, z, LIGHT);

g.save(`${DIR}/${ID}.nbt`);
