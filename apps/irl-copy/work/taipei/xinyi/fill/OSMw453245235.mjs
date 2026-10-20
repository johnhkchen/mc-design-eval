import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 世貿新城 (Taipei, Xinyi): late-20th-century mid-rise commercial block.
// Pale concrete frame, blue-tinted glazing, quartz cornice, black shopfront
// frames, a dark canopy over the entrance, and a plant penthouse on the roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245235";
const W = 70, H = 76, D = 15;

const STOREY = 5;        // blocks per storey
const STOREYS = 12;      // storeys 0..11 occupy y 0..59
const DECK_Y = 60;       // roof deck / cornice level
const TOP_Y = 63;        // top of parapet
const ENTRY_X = [33, 34];
const CANOPY_X = [30, 37];

const key = (x, z) => `${x},${z}`;
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Ground heights, normalised so the lowest ground under the footprint is y 0.
let gMin = Infinity;
for (const [, , gr] of raw) gMin = Math.min(gMin, Math.round(gr));
const ground = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), Math.round(gr) - gMin);
}
const has = (x, z) => ground.has(key(x, z));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Exterior faces of a footprint cell.
const exposed = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});

// Wall block for an exterior cell at a given storey line.
function wallBlock(x, z, y, s, ly, ex) {
  const longFace = ex.N || ex.S;
  const cornerCell = (ex.N || ex.S) && (ex.W || ex.E);

  if (cornerCell) return { id: "white_concrete" };

  const t = longFace ? x : z;          // position along the facade
  const onSouthEntry = ex.S && z === D - 1;

  if (s === 0) {
    if (ly === 0) return { id: "stone_bricks" };                 // base course
    if (ly >= 1 && ly <= 3) {
      if (onSouthEntry && (ENTRY_X.includes(x) && longFace)) {
        const hinge = x === ENTRY_X[0] ? "left" : "right";
        const half = ly === 1 ? "lower" : "upper";
        return {
          id: "dark_oak_door",
          props: { facing: "south", half, hinge, open: "false", powered: "false" },
        };
      }
      if (ly === 3) return { id: "light_blue_stained_glass" };     // transom
      if (t % 4 === 0) return { id: "black_concrete" };            // shopfront frame
      return { id: "light_blue_stained_glass" };                   // shop glazing
    }
    // ly 4: canopy over the entrance, spandrel elsewhere
    if (onSouthEntry && t >= CANOPY_X[0] && t <= CANOPY_X[1]) return { id: "black_concrete" };
    return { id: "light_gray_concrete" };
  }

  // Upper storeys
  if (ly === 0) return { id: "white_concrete" };                   // storey line
  if (ly >= 1 && ly <= 3) {
    if (t % 3 === 0) return { id: "white_concrete" };              // mullion / frame
    return { id: "light_blue_stained_glass_pane", props: longFace ? paneEW : paneNS };
  }
  return { id: "light_gray_concrete" };                            // spandrel
}

// Pass 1: solid foundations, walls, floor slabs, cornice, parapet.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposed(x, z);
  const isWall = ex.N || ex.S || ex.W || ex.E;

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y < DECK_Y; y++) {
    const s = Math.floor(y / STOREY);
    const ly = y % STOREY;
    if (s >= STOREYS) continue;
    if (isWall) {
      const b = wallBlock(x, z, y, s, ly, ex);
      put(x, y, z, b.id, b.props);
    } else if (ly === 0) {
      put(x, y, z, "light_gray_concrete");                         // floor slab
    }
  }

  // Roof deck / cornice
  if (isWall) {
    put(x, DECK_Y, z, "smooth_quartz");
    for (let y = DECK_Y + 1; y <= TOP_Y - 1; y++) put(x, y, z, "white_concrete");
    put(x, TOP_Y, z, "smooth_quartz");
  } else {
    put(x, DECK_Y, z, "light_gray_concrete");
  }
}

// Pass 2: plant penthouse and roof mast.
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (x >= 8 && x <= 16 && z >= 4 && z <= 10) {
    for (let y = DECK_Y + 1; y <= TOP_Y - 1; y++) put(x, y, z, "light_gray_concrete");
    put(x, TOP_Y, z, "smooth_quartz");
  }
}
if (has(35, 7)) {
  for (let y = DECK_Y + 1; y <= 67; y++) put(35, y, 7, "iron_block");
  put(35, 68, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// Pass 3: warm light behind some upper-storey windows.
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposed(x, z);
  if (!(ex.N || ex.S || ex.W || ex.E)) continue;
  if (ex.N && ex.S) continue;
  if (ex.W && ex.E) continue;
  if (ex.N || ex.S) {
    // windows only
  } else continue;
  for (let s = 1; s < STOREYS; s++) {
    const y = s * STOREY + 2;
    if (y >= DECK_Y) continue;
    if (((x * 7 + s * 3) % 11) !== 0) continue;
    let ix = x, iz = z;
    if (ex.N) iz = z + 1;
    else if (ex.S) iz = z - 1;
    if (!has(ix, iz)) continue;
    const inner = exposed(ix, iz);
    if (inner.N || inner.S || inner.W || inner.E) continue;
    put(ix, y, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
