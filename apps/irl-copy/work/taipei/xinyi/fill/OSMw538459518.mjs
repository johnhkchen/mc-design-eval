import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538459518";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 21 x 10, flat roof at y 11 (about 11 blocks above lowest ground),
// two storeys of about 5 blocks, 1980s-style concrete commercial block with a
// shopfront ground storey, quartz piers and a stone-brick base, parapet on top.
const W = 21, H = 23, D = 10;
const ROOF_Y = 11;
const CORNICE_Y = 10;
const STOREY_Y = 5;
const LINTEL_Y = 4;

const g = new Voxels([W, H, D]);

const has = (x, z) => cellMap.has(`${x},${z}`);
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(`${x},${z}`, gr);

const xs = cells.map((c) => c[0]);
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const zs = cells.map((c) => c[1]);
const minZ = Math.min(...zs);
const midX = (minX + maxX) / 2;

function faceInfo(x, z) {
  const north = !has(x, z - 1);
  const south = !has(x, z + 1);
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const edge = north || south || west || east;
  const corner = (north || south) && (west || east);
  return { north, south, west, east, edge, corner };
}

// Entrance: north-facing non-corner facade cell closest to the middle of the frontage.
let doorCell = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    const f = faceInfo(x, z);
    if (f.north && !f.corner) {
      const d = Math.abs(x - midX);
      if (d < best) { best = d; doorCell = `${x},${z}`; }
    }
  }
}

function paneProps(face) {
  // Pane connects along the wall it sits in.
  if (face === "north" || face === "south") {
    return { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
  }
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

function facadeBlock(x, z, y, gr, f, face) {
  const idx = (face === "north" || face === "south") ? x - minX : z - minZ;
  const isDoor = doorCell === `${x},${z}`;

  if (y === gr) return ["stone_bricks"];                       // base course
  if (y === ROOF_Y) return ["smooth_quartz_slab", { type: "bottom", waterlogged: "false" }]; // parapet
  if (y === CORNICE_Y) return ["smooth_quartz"];               // cornice band
  if (y === STOREY_Y) return ["smooth_quartz"];                // storey line
  if (f.corner) return ["polished_andesite"];                  // corner columns

  if (y < STOREY_Y) {
    // Ground storey: shopfront.
    if (y === LINTEL_Y) return ["polished_andesite"];           // shopfront lintel
    if (isDoor && f.north && (y === gr + 1 || y === gr + 2) && gr <= 1) {
      const half = y === gr + 1 ? "lower" : "upper";
      return ["dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" }];
    }
    if (isDoor && f.north && y === 3 && gr <= 0) {
      return ["lantern", { hanging: "true", waterlogged: "false" }];
    }
    if (idx % 3 === 1) {
      const lit = (idx * 3 + y * 5 + x + z) % 5 === 0;
      return [lit ? "yellow_stained_glass_pane" : "light_blue_stained_glass_pane", paneProps(face)];
    }
    return ["polished_andesite"];                               // piers
  }

  // Upper storey.
  if (y === 6 || y === 9) return ["polished_andesite"];         // window frame / sill
  if (idx % 2 === 1) {
    const lit = (idx * 7 + y * 3 + x * 2 + z) % 4 === 0;
    return [lit ? "yellow_stained_glass_pane" : "light_blue_stained_glass_pane", paneProps(face)];
  }
  return ["smooth_quartz"];                                     // wall piers
}

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(10, Math.round(gr0)));
  const f = faceInfo(x, z);
  const face = f.north ? "north" : f.south ? "south" : f.west ? "west" : f.east ? "east" : null;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!f.edge) {
    // Interior: floor, storey slab and roof deck only; air between.
    g.set(x, gr, z, "smooth_stone");
    if (STOREY_Y > gr) g.set(x, STOREY_Y, z, "smooth_stone");
    g.set(x, ROOF_Y, z, "gray_concrete");
    // Rooftop plant room on the deck.
    if (x >= minX + 5 && x <= minX + 10) {
      g.set(x, ROOF_Y + 1, z, "light_gray_concrete");
      g.set(x, ROOF_Y + 2, z, "light_gray_concrete");
    }
    continue;
  }

  // Facade cells: full envelope from ground to roof.
  for (let y = gr; y <= ROOF_Y; y++) {
    const [id, props] = facadeBlock(x, z, y, gr, f, face);
    if (props) g.set(x, y, z, id, props);
    else g.set(x, y, z, id);
  }
}

g.save(`${DIR}/${ID}.nbt`);
