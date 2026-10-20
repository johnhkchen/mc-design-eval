import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 7 x 16 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey reinforced-concrete shophouse with a flat roof and
// parapet, white-tiled (white concrete) walls, light-grey storey bands,
// aluminium-style glazing, and a shopfront on the street (north, z = 0) face.
// Interiors are not modelled beyond an air gap, floor slabs and a few lamps.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538617868";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 23, D = 16;
const TOP_WALL = 10;   // last wall row of the upper storey
const DECK = 11;       // roof slab
const PARAPET = 12;    // parapet course

const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const ground = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) =>
  !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const EW_PANE = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const NS_PANE = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- foundations, floors, walls ---------------------------------------------
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground, plus the ground floor at y 0.
  for (let y = 0; y <= Math.max(gr - 1, 0); y++) put(x, y, z, "stone_bricks");

  // Roof deck across the whole footprint.
  put(x, DECK, z, "light_gray_concrete");

  if (!isEdge(x, z)) {
    // Interior: floor slab for the upper storey, air elsewhere (no interior fit-out).
    put(x, 5, z, "smooth_stone");
    continue;
  }

  // Perimeter walls from this cell's ground up to the top wall row.
  for (let y = gr; y <= TOP_WALL; y++) put(x, y, z, "white_concrete");
  put(x, PARAPET, z, "white_concrete");

  // Exposed faces of this perimeter cell.
  const faces = [];
  if (!has(x, z - 1)) faces.push({ n: [0, -1] });
  if (!has(x, z + 1)) faces.push({ n: [0, 1] });
  if (!has(x - 1, z)) faces.push({ n: [-1, 0] });
  if (!has(x + 1, z)) faces.push({ n: [1, 0] });

  for (const f of faces) {
    const alongX = f.n[1] !== 0;            // north/south face runs along x
    const u = alongX ? x : z;
    const pier = u % 3 === 0;               // piers every third block
    const pane = alongX ? EW_PANE : NS_PANE;

    // Interior cell directly behind this face (for lamps).
    const ix = x - f.n[0], iz = z - f.n[1];
    const interiorOk = has(ix, iz) && !isEdge(ix, iz);

    const isStreetFace = f.n[1] === -1 && z === 0;   // north, the shopfront side
    const isDoorColumn = isStreetFace && x === 3;

    for (let y = gr; y <= TOP_WALL; y++) {
      // Base course at grade, storey bands at 4, 5 and 10.
      if (y === gr) { put(x, y, z, "light_gray_concrete"); continue; }
      if (y === 4 || y === 5 || y === 10) { put(x, y, z, "light_gray_concrete"); continue; }

      const groundStorey = y >= 1 && y <= 3;
      const upperStorey = y >= 6 && y <= 9;
      if (!(groundStorey || upperStorey)) continue;

      // Entrance door in the central pier of the street face.
      if (isDoorColumn && (y === gr + 1 || y === gr + 2)) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }

      if (pier) continue; // keep the white pier

      // Glazing: clear shopfront glass below, blue-tinted glass above.
      const glassId = groundStorey ? "glass_pane" : "light_blue_stained_glass_pane";
      put(x, y, z, glassId, pane);

      // Warm lights behind some panes: glowstone on the floor inside.
      const lampRow = y === 1 || y === 6;
      if (lampRow && interiorOk && ((u + y) % 4 === 1)) {
        put(ix, y, iz, "glowstone");
      }
    }
  }
}

// ---- roof plant ---------------------------------------------------------------
for (let x = 2; x <= 4; x++) {
  for (let z = 5; z <= 7; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    put(x, PARAPET, z, "gray_concrete");
  }
}
if (has(3, 6) && !isEdge(3, 6)) put(3, PARAPET + 1, 6, "iron_bars");

g.save(`${DIR}/${ID}.nbt`);
