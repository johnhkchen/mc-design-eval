import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001570";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 17, D = 6;
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Footprint lookup
const fp = new Map();
for (const c of cells) fp.set(`${c[0]},${c[1]}`, c);
const has = (x, z) => fp.has(`${x},${z}`);
const isFacade = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => {
  const ns = !has(x, z - 1) || !has(x, z + 1);
  const ew = !has(x - 1, z) || !has(x + 1, z);
  return ns && ew;
};

// One smoothed roof level for the whole block (median of lidar roofs)
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const roofMed = roofs[Math.floor(roofs.length / 2)];
const groundMax = Math.max(...cells.map(c => Math.round(c[2])));
const R = clamp(Math.max(roofMed, groundMax + 4), 4, H - 2);

// Front door on the lowest-z edge, nearest the middle
const minZ = Math.min(...cells.map(c => c[1]));
let doorCell = null;
{
  let best = Infinity;
  for (const c of cells) {
    const [x, z] = c;
    if (z !== minZ || !isFacade(x, z) || isCorner(x, z)) continue;
    const d = Math.abs(x - 2.5);
    if (d < best) { best = d; doorCell = c; }
  }
}

const outward = (x, z) => {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  return "east";
};

const BRICK = "bricks";
const TRIM = "smooth_stone";
const PIER = "stone_bricks";
const FOUND = "stone_bricks";

for (const c of cells) {
  const [x, z] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  const gr = clamp(Math.round(c[2]), 0, H - 7);
  const r = Math.max(R, gr + 4);

  const facade = isFacade(x, z);
  const corner = isCorner(x, z);
  const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z;
  const ns = !has(x, z - 1) || !has(x, z + 1);
  const winCell = facade && !corner && ((ns && x % 2 === 1) || (!ns && z % 2 === 1));

  // Foundation from y 0 up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  // Base course
  put(x, gr, z, facade ? TRIM : TRIM);

  // Storeys: window rows at gr+1, gr+3...; belt/floor rows at gr+2, gr+4...
  for (let y = gr + 1; y <= r - 2; y++) {
    const rel = y - gr;
    const beltRow = rel % 2 === 0;
    if (facade) {
      if (isDoor && (y === gr + 1 || y === gr + 2)) {
        put(x, y, z, "oak_door", {
          facing: outward(x, z),
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (isDoor && y === gr + 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else if (corner) {
        put(x, y, z, PIER);
      } else if (beltRow) {
        put(x, y, z, TRIM);
      } else if (winCell) {
        put(x, y, z, "glass_pane", {
          north: "true", south: "true", east: "true", west: "true", waterlogged: "false",
        });
      } else {
        put(x, y, z, BRICK);
      }
    } else {
      if (beltRow) {
        put(x, y, z, TRIM); // floor slab
      } else if ((x + z) % 3 === 0) {
        put(x, y, z, "glowstone"); // warm light behind glass
      }
      // otherwise air gap
    }
  }

  // Sill under each window bay (stone slab on the belt course's underside row)
  if (winCell && !isDoor) {
    const sillY = gr + 1;
    if (sillY <= r - 2) put(x, sillY, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Cornice course and roof deck
  put(x, r - 1, z, facade ? TRIM : "stone");

  // Parapet cap on facade cells
  if (facade) put(x, r, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
