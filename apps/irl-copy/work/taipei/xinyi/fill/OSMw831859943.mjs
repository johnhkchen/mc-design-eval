import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831859943";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const minG = Math.min(...cells.map(c => c[2]));

// Storey plan (relative to lowest ground):
//  ground storey  minG .. minG+4   (lintel at minG+4)
//  upper storey   minG+5 .. minG+9 (spandrel at minG+5, cornice at minG+9)
//  parapet / roof deck at TOP = minG+10 -> roof surface about 11 blocks above lowest ground
const TOP = minG + 10;

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  east: [1, 0],
  west: [-1, 0],
};
const INWARD = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] };

function exposed(x, z) {
  return Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));
}

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function paneProps(d) {
  const ew = d === "north" || d === "south";
  return {
    north: ew ? "false" : "true",
    south: ew ? "false" : "true",
    east: ew ? "true" : "false",
    west: ew ? "true" : "false",
    waterlogged: "false",
  };
}

// Pick the entrance: an exposed south-facing cell nearest the mean x of that face
// (falls back to any exposed cell).
const meanX = (arr) => arr.reduce((s, c) => s + c[0], 0) / arr.length;
let doorCandidates = cells
  .filter(([x, z]) => exposed(x, z).includes("south"))
  .map(([x, z]) => ({ x, z, d: "south" }));
if (doorCandidates.length === 0) {
  doorCandidates = cells
    .filter(([x, z]) => exposed(x, z).length > 0)
    .map(([x, z]) => ({ x, z, d: exposed(x, z)[0] }));
}
const mx = meanX(doorCandidates);
const door = doorCandidates.reduce((best, c) =>
  Math.abs(c.x - mx) < Math.abs(best.x - mx) ? c : best, doorCandidates[0]);

// Main shell
for (const [x, z, gr] of cells) {
  // Foundation from y=0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ex = exposed(x, z);

  if (ex.length === 0) {
    // Interior: air, with a floor slab per storey and the roof deck on top
    if (minG + 5 >= gr) put(x, minG + 5, z, "smooth_quartz");
    put(x, TOP, z, "gray_concrete");
    continue;
  }

  // Exposed perimeter cell: parapet on top, cornice below it
  put(x, TOP, z, "smooth_quartz");
  put(x, TOP - 1, z, "stone_bricks");

  const corner = ex.length >= 2;
  const d = ex[0];
  const idx = (d === "north" || d === "south") ? x : z;
  const bay = !corner && idx % 3 === 1;
  const isDoor = !corner && door.x === x && door.z === z;

  for (let y = gr; y <= TOP - 2; y++) {
    if (y <= minG + 4) {
      // Ground storey (shopfront)
      if (isDoor && (y === gr || y === gr + 1)) {
        const facing = door.d;
        put(x, y, z, "dark_oak_door", {
          facing,
          half: y === gr ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (isDoor && y === gr + 2) {
        // Small hood over the entrance
        put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      } else if (y === minG + 4) {
        put(x, y, z, "smooth_quartz"); // lintel / storey line
      } else if (y === gr) {
        put(x, y, z, "stone_bricks"); // base course
      } else if (bay && y >= gr + 1 && y <= minG + 3) {
        put(x, y, z, "glass_pane", paneProps(d));
      } else {
        put(x, y, z, "smooth_quartz");
      }
    } else {
      // Upper storey
      if (y === minG + 5) {
        put(x, y, z, "smooth_quartz"); // spandrel / storey line
      } else if (bay && y >= minG + 6 && y <= minG + 8) {
        put(x, y, z, "glass_pane", paneProps(d));
        // Warm light set back behind the glass, in the air gap
        if (y === minG + 7) {
          const [ix, iz] = INWARD[d];
          const x2 = x + 2 * ix, z2 = z + 2 * iz;
          const g2 = G.get(`${x2},${z2}`);
          if (g2 !== undefined && g2 <= y && exposed(x2, z2).length === 0) {
            put(x2, y, z2, "glowstone");
          }
        }
      } else {
        put(x, y, z, "smooth_quartz");
      }
    }
  }
}

// Roof plant: a mechanical block near the centre of the roof
const cx = Math.round(cells.reduce((s, c) => s + c[0], 0) / cells.length);
const cz = Math.round(cells.reduce((s, c) => s + c[1], 0) / cells.length);
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (exposed(x, z).length > 0) continue;
  if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 1) {
    put(x, TOP + 1, z, "light_gray_concrete");
    put(x, TOP + 2, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
