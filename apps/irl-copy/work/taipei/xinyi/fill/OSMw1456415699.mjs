import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1456415699";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint is 7 x 8 (x 0..6, z 0..7). Storey height 5, two storeys, roof cap at rel 10.
const W = 7, H = 23, D = 8;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));
const minG = Math.min(...cells.map((c) => c[2]));

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

// Faces of a cell that look onto open air (outside the footprint).
function exposed(x, z) {
  const out = [];
  for (const [f, [dx, dz]] of Object.entries(DIRS)) {
    if (!inside(x + dx, z + dz)) out.push(f);
  }
  return out;
}

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const GLASS_PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Choose the entrance: a north-facing exposed cell nearest the middle of the street front.
const meanX = cells.reduce((s, c) => s + c[0], 0) / cells.length;
let doorKey = null;
let doorFace = "north";
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (!exposed(x, z).includes("north")) continue;
    const d = Math.abs(x - meanX);
    if (d < best) { best = d; doorKey = key(x, z); }
  }
  if (!doorKey) {
    // Fallback: any exposed face, nearest the middle.
    for (const [x, z] of cells) {
      const ex = exposed(x, z);
      if (!ex.length) continue;
      const d = Math.abs(x - meanX);
      if (d < best) { best = d; doorKey = key(x, z); doorFace = ex[0]; }
    }
  }
}

// ---- Per-cell massing ----
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ex = exposed(x, z);
  const isCorner = ex.length >= 2;

  for (let rel = 0; rel <= 10; rel++) {
    const y = minG + rel;
    if (y < gr) continue; // already foundation

    const isWallRow = (rel >= 1 && rel <= 3) || (rel >= 6 && rel <= 8);

    if (ex.length === 0) {
      // Interior: floor slabs, roof deck, otherwise air (no interiors).
      if (rel === 0 || rel === 5) put(x, y, z, "smooth_stone");
      else if (rel === 10) put(x, y, z, "gray_concrete");
      continue;
    }

    // Exterior cell: every exposed face is treated the same way.
    if (rel === 0) { put(x, y, z, "polished_granite"); continue; }
    if (rel === 4 || rel === 9) { put(x, y, z, "light_gray_concrete"); continue; }
    if (rel === 5) { put(x, y, z, "light_gray_concrete"); continue; }
    if (rel === 10) { put(x, y, z, "smooth_quartz"); continue; }

    // Structural piers between windows; panes on the window bays.
    // Interior of the cell (the solid core) is left as air behind the glass.
    if (isWallRow) {
      // Pick the primary exposed face for the cell's facade.
      const face = ex[0];
      const along = (face === "north" || face === "south") ? x : z;
      const isPier = isCorner || along % 2 === 0;

      if (key(x, z) === doorKey && rel <= 2 && face === doorFace) {
        // Door occupies the lower two rows of this bay.
        const dprops = { facing: doorFace, hinge: "left", open: "false", powered: "false" };
        if (rel === 1) put(x, y, z, "dark_oak_door", { ...dprops, half: "lower" });
        else put(x, y, z, "dark_oak_door", { ...dprops, half: "upper" });
        continue;
      }

      if (isPier) {
        put(x, y, z, "white_concrete");
      } else {
        const props = (face === "north" || face === "south") ? GLASS_PANE_NS : GLASS_PANE_EW;
        put(x, y, z, "glass_pane", props);

        // Warm light behind some glass: shroomlight in the room behind the window.
        const [dx, dz] = DIRS[face];
        const ix = x - dx, iz = z - dz; // inward neighbour
        const lightRow = rel === 2 || rel === 7;
        if (lightRow && along % 4 === 1 && inside(ix, iz) && exposed(ix, iz).length === 0) {
          put(ix, y, iz, "shroomlight");
        }
      }
      continue;
    }
  }
}

// ---- Entrance lantern over the door ----
{
  const [dxk, dzk] = doorKey.split(",").map(Number);
  put(dxk, minG + 3, dzk, "lantern", { hanging: "false", waterlogged: "false" });
}

// ---- Roof plant box and lightning rod ----
{
  const plant = [];
  for (const [x, z, gr] of cells) {
    if (x >= 2 && x <= 4 && z >= 3 && z <= 4 && exposed(x, z).length === 0) plant.push([x, z]);
  }
  for (const [x, z] of plant) {
    put(x, minG + 11, z, "light_gray_concrete");
    put(x, minG + 12, z, "light_gray_concrete");
  }
  if (plant.length) {
    const [x, z] = plant[0];
    put(x, minG + 13, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
