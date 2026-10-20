import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538464243";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 4, H = 23, D = 23;
const g = new Voxels([W, H, D]);

// Lowest ground under the footprint; the whole building sits on this datum.
const minG = Math.min(...cells.map(c => c[2]));
const has = new Set(cells.map(([x, z]) => `${x},${z}`));

// Era: 1970s-80s Taipei low-rise commercial block. Two storeys (~5 blocks each)
// on a shophouse-style street frontage (west), cream render with white frames,
// red tile fascia, glazed bays, flat deck with parapet and a small roof tank.
const ROOF = minG + 10;   // roof deck
const PAR = minG + 11;    // parapet course
const STREET = "W";

const set = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  // Exterior faces: a face is exterior when its neighbour is not in the footprint.
  const exW = !has.has(`${x - 1},${z}`);
  const exE = !has.has(`${x + 1},${z}`);
  const exN = !has.has(`${x},${z - 1}`);
  const exS = !has.has(`${x},${z + 1}`);
  const face = exW ? "W" : exE ? "E" : exN ? "N" : exS ? "S" : null;
  const edge = face !== null;

  // Floor slabs at storey lines (ground, mid, roof deck), only at or above this cell's ground.
  const slabYs = new Set([gr]);
  for (const b of [minG + 5, ROOF]) if (b >= gr) slabYs.add(b);
  for (const y of slabYs) set(x, y, z, "smooth_stone");

  if (!edge) continue;

  // Facade walls, windows, bands and piers on the boundary cells.
  for (let y = gr + 1; y < ROOF; y++) {
    if (slabYs.has(y)) continue;
    const storey = y < minG + 5 ? 0 : 1;
    const base = storey === 0 ? minG : minG + 5;
    const rel = y - base;               // 1..4 within a storey
    const t = (face === "W" || face === "E") ? z : x;
    const isWindow = (t % 4 === 1 || t % 4 === 2);

    // Door on the street frontage at the ground storey.
    if (face === STREET && storey === 0 && t === 11 && gr === minG && (rel === 1 || rel === 2)) {
      const half = rel === 1 ? "lower" : "upper";
      set(x, y, z, "dark_oak_door", { facing: "west", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }

    if (rel === 1) {
      // Sill / plinth course.
      set(x, y, z, storey === 0 && face === STREET ? "stone_bricks" : "white_concrete");
    } else if (rel === 4) {
      // Head / fascia course.
      set(x, y, z, storey === 0 && face === STREET ? "red_terracotta" : "white_concrete");
    } else if (isWindow) {
      const axisProps = (face === "W" || face === "E")
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
      set(x, y, z, "glass_pane", axisProps);

      // Warm light behind some glazed bays, in the air gap inside the facade.
      if (rel === 2 && t % 8 === 1) {
        const ix = face === "W" ? x + 1 : face === "E" ? x - 1 : x;
        const iz = face === "N" ? z + 1 : face === "S" ? z - 1 : z;
        if (has.has(`${ix},${iz}`)) set(ix, y, iz, "glowstone");
      }
    } else {
      set(x, y, z, "smooth_quartz");      // piers between bays
    }
  }

  // Parapet on the roof edge.
  set(x, PAR, z, "smooth_quartz");
}

// Roof equipment: a small water tank on the deck, set back from the parapet.
for (let x = 1; x <= 2; x++) {
  for (let z = 9; z <= 12; z++) {
    if (has.has(`${x},${z}`)) set(x, PAR, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
