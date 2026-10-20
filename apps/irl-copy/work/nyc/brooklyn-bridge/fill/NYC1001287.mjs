import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001287";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 27, D = 6;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const have = new Set(cells.map(c => key(c[0], c[1])));

// Storey lines are shared across the footprint, anchored at the lowest ground.
const G = Math.min(...cells.map(c => c[2]));

// One smoothed roof line for the whole block (median of lidar roofs), so the
// massing is a clean flat-topped slab rather than a stepped lidar mosaic.
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const TOP = Math.min(Math.max(roofs[Math.floor(roofs.length / 2)], G + 12), 23);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Limestone piers on the long (z) faces, at these x columns.
const PIERS_Z_FACE = new Set([0, 3, 6, 9, 12, 14]);
const DOOR_X = 7;

const isEdge = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !have.has(key(x + dx, z + dz)));

const groundOf = new Map(cells.map(c => [key(c[0], c[1]), c[2]]));

for (const [x, z, ground] of cells) {
  const top = TOP;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const xFace = x === 0 || x === W - 1;
  const zFaceEntrance = !xFace && z === D - 1;
  const pier = xFace ? (z === 0 || z === D - 1) : PIERS_Z_FACE.has(x);

  const paneProps = xFace
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  for (let y = ground; y < top; y++) {
    const rel = y - G;

    if (edge) {
      // Cornice and parapet.
      if (y === top - 2) { put(x, y, z, "stone_bricks"); continue; }
      if (y === top - 1) { put(x, y, z, "smooth_stone"); continue; }

      // Ground storey: granite base, shopfront glass, entrance door.
      if (rel === 0 || rel === 1) {
        if (zFaceEntrance && x === DOOR_X) {
          const half = rel === 0 ? "lower" : "upper";
          put(x, y, z, "oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (pier || (zFaceEntrance && Math.abs(x - DOOR_X) === 1)) { put(x, y, z, "polished_granite"); continue; }
        if (rel === 0) { put(x, y, z, "polished_granite"); continue; }
        put(x, y, z, "glass_pane", paneProps); continue;
      }

      // Entrance surround: stone lintel, then a stone hood projecting over the door.
      if (zFaceEntrance && rel === 2 && Math.abs(x - DOOR_X) <= 1) {
        put(x, y, z, "calcite"); continue;
      }
      if (zFaceEntrance && rel === 3 && Math.abs(x - DOOR_X) <= 1) {
        put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue;
      }

      // Upper storeys: brick spandrels on even rows, window rows on odd rows.
      if (rel % 2 === 0) {
        put(x, y, z, pier ? "calcite" : "bricks");
      } else {
        if (pier) put(x, y, z, "calcite");
        else put(x, y, z, "glass_pane", paneProps);
      }
    } else {
      // Interior: roof slab and floor slab per storey, air gap otherwise.
      if (y === top - 1) { put(x, y, z, "smooth_stone"); continue; }
      if (rel % 2 === 0) put(x, y, z, "smooth_stone");
    }
  }
}

// Warm lights behind some window glass (interior cell just inside the wall).
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (!isEdge(x, z)) continue;
  const ground = groundOf.get(key(x, z));
  const top = TOP;
  const xFace = x === 0 || x === W - 1;
  const zFaceEntrance = !xFace && z === D - 1;
  for (let y = ground; y < top - 2; y++) {
    const rel = y - G;
    if (rel < 3 || rel % 2 === 0) continue;
    const pier = xFace ? (z === 0 || z === D - 1) : PIERS_Z_FACE.has(x);
    if (pier) continue;
    if (!((x + rel) % 5 === 0)) continue;
    let ix = x, iz = z;
    if (xFace) ix = x === 0 ? 1 : W - 2;
    else iz = z === 0 ? 1 : D - 2;
    if (!have.has(key(ix, iz))) continue;
    put(ix, y, iz, "glowstone");
  }
  // Shroomlight just inside the entrance for a warm doorway glow.
  if (zFaceEntrance && x === DOOR_X && have.has(key(DOOR_X, D - 2))) {
    put(DOOR_X, G + 1, D - 2, "shroomlight");
  }
}

// Rooftop penthouse on the central cells, sitting on the roof slab.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (x < 5 || x > 9 || z < 2 || z > 3) continue;
  put(x, TOP, z, "bricks");
  put(x, TOP + 1, z, "bricks");
  put(x, TOP + 2, z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
