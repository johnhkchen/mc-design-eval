// Way 292861477: a 1970s concrete-frame office-apartment block on Mt Eden's flank (Auckland). Nine storeys on the
// downhill west, eight on the east, with low lobby wings. Solid core behind a one-block shell; air only in the gap
// behind each window; a white string course at every storey line; piers between glazed bays.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861477.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861477.nbt";

const X = 30, Y = 54, Z = 26;
const D = 8;                                        // the ground-floor datum: storey lines sit at 8, 12, 16 ...
// Lidar roofs snapped to clean flat tiers (surface heights): low wings, the mid body, the 41 tower on the west
const TIERS = [16, 20, 24, 28, 32, 38, 41];
const topOf = (g, r) => {
  if (r - g < 4) return Math.max(r, g);            // a lobby roof or terrace, no storeys over it
  let best = TIERS[0];
  for (const t of TIERS) if (Math.abs(t - r) < Math.abs(best - r)) best = t;
  return Math.max(best, g + 4);
};

const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { x, z, g, T: topOf(g, r) });
const at = (x, z) => fp.get(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
// faces of a cell at height y that are open to air: off the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => { const n = at(x + DIRS[d][0], z + DIRS[d][1]); return !n || n.T <= y; });
const isShell = (x, z, y) => exposed(x, z, y).length > 0;

// Where the lobby sits: the east-facing cell with the highest ground, the middle of a run of three
let lobby = null;
for (const c of fp.values()) if (!at(c.x + 1, c.z) && c.T > 30 && c.g >= 6 && (!lobby || c.g > lobby.g || (c.g === lobby.g && Math.abs(c.z - 12) < Math.abs(lobby.z - 12)))) lobby = c;
const lobbyCells = new Set([-1, 0, 1].map((dz) => `${lobby.x},${lobby.z + dz}`).filter((k) => fp.has(k)));
const doorKey = `${lobby.x},${lobby.z}`;

// Pass 1: the air gap behind each window (and a few warm lamps), so the core can skip those cells
const airs = new Set(), lamps = new Set();
for (const c of fp.values()) {
  for (let y = Math.max(c.g, D); y < c.T; y++) {
    const s = (y - D) % 4; if (s !== 1 && s !== 2) continue;
    const ex = exposed(c.x, c.z, y); if (!ex.length) continue;
    const [dx, dz] = DIRS[ex[0]];
    const inner = at(c.x - dx, c.z - dz);
    if (!inner || inner.T <= y || isShell(inner.x, inner.z, y)) continue;
    airs.add(`${inner.x},${y},${inner.z}`);
    if (s === 1 && (c.x * 3 + c.z * 5 + y) % 9 === 0) lamps.add(`${inner.x},${y},${inner.z}`);
  }
}

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => { if (y >= 0 && y < Y) g.set(x, y, z, block, state); };
const pane = (face) => (face === "north" || face === "south")
  ? { north: "false", south: "false", east: "true", west: "true" }
  : { north: "true", south: "true", east: "false", west: "false" };

for (const c of fp.values()) {
  const { x, z, g: gr, T } = c;
  // the foundation: solid from y 0 up to the cell's own ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (T - gr < 4) {                                // a low lobby roof or terrace: solid to its surface, paved on top
    for (let y = gr; y < T; y++) put(x, y, z, y === T - 1 ? "smooth_stone" : "stone_bricks");
    if (T === gr) put(x, gr - 1, z, "smooth_stone");
    continue;
  }

  for (let y = gr; y < T; y++) {
    if (y < D) { put(x, y, z, y === D - 1 ? "polished_andesite" : "stone_bricks"); continue; }   // plinth and base course
    if (y === T - 1) { put(x, y, z, "smooth_stone"); continue; }                                  // cap
    if (y === T - 2) { put(x, y, z, "white_concrete"); continue; }                                // parapet
    const s = (y - D) % 4;
    if (s === 0) { put(x, y, z, y < D + 4 ? "polished_andesite" : "white_concrete"); continue; }  // floor line / stall riser
    if (s === 3) { put(x, y, z, "white_concrete"); continue; }                                    // lintel string course
    if (airs.has(`${x},${y},${z}`)) { if (lamps.has(`${x},${y},${z}`)) put(x, y, z, "glowstone"); continue; }
    const ex = exposed(x, z, y);
    if (!ex.length) { put(x, y, z, "light_gray_concrete"); continue; }                            // core
    const face = ex[0], along = face === "north" || face === "south" ? x : z;
    // lobby: the door on its middle cell at the ground floor, glass shopfront either side
    if (lobbyCells.has(`${x},${z}`) && face === "east" && y < D + 3) {
      if (`${x},${z}` === doorKey && y < D + 2) {
        const half = y === D ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: "east", half, hinge: "left", open: "false", powered: "false" });
      } else put(x, y, z, "cyan_stained_glass_pane", pane(face));
      continue;
    }
    if (along % 3 === 0) { put(x, y, z, "white_concrete"); continue; }                            // pier between bays
    put(x, y, z, "cyan_stained_glass_pane", pane(face));
  }
}

// Lanterns hung in the lobby's gap, under the lintel
for (const k of lobbyCells) {
  const [x, z] = k.split(",").map(Number);
  if (!airs.has(`${x - 1},${D + 2},${z}`)) continue;
  put(x - 1, D + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Rooftop plant room on the 41 tower (on its cap) and a lower plant box on the 38 body
for (const c of fp.values()) {
  if (c.T === 41 && c.x >= 8 && c.x <= 11 && c.z >= 9 && c.z <= 12) {
    put(c.x, 41, c.z, "light_gray_concrete"); put(c.x, 42, c.z, "light_gray_concrete"); put(c.x, 43, c.z, "smooth_stone");
  }
  if (c.T === 38 && c.x >= 20 && c.x <= 23 && c.z >= 9 && c.z <= 11) {
    put(c.x, 38, c.z, "light_gray_concrete"); put(c.x, 39, c.z, "light_gray_concrete"); put(c.x, 40, c.z, "smooth_stone");
  }
}
put(5, 41, 12, "lightning_rod", { facing: "up", powered: "false" });

const stats = g.save(OUT);
console.log(`way_292861477: ${cells.length} cells, ${stats.blocks} blocks, ${stats.palette} palette entries -> ${OUT}`);
