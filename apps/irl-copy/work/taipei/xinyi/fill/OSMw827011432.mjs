import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011432";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 5 x 9. Roof sits about 11 blocks above the lowest ground.
// Read as a two-storey 1980s-style Taipei shophouse: white tiled concrete walls,
// stone base, shopfront glass at street level, a punched upper storey,
// a stone cornice, flat roof with parapet and a rooftop AC unit.
const W = 5, H = 23, D = 9;
const g = new Voxels([W, H, D]);

const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (gr < minG) minG = gr;
}
if (!Number.isFinite(minG)) minG = 0;
const base = minG;
const L = (r) => base + r; // storey-relative level -> absolute y

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isCell = (x, z) => ground.has(`${x},${z}`);
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const IN = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };
const exposedFaces = (x, z) =>
  Object.keys(DIRS).filter((k) => {
    const [dx, dz] = DIRS[k];
    return !isCell(x + dx, z + dz);
  });

const doorProps = (half) => ({
  facing: "south",
  half,
  hinge: "left",
  open: "false",
  powered: "false",
});

// Returns [blockId, props?] for a perimeter wall voxel, or null.
function facade(x, z, y, ex, gc) {
  const r = y - base;
  if (r === 10) return ["smooth_stone"];          // cornice course
  if (ex.length >= 2) return ["white_concrete"];  // corner pier
  const face = ex[0];
  const along = face === "W" || face === "E" ? z : x;
  const isDoor = face === "S" && x === 2 && z === 8;

  if (r <= 4) {
    // Ground storey: shopfront
    if (isDoor) {
      if (y === gc) return ["dark_oak_door", doorProps("lower")];
      if (y === gc + 1) return ["dark_oak_door", doorProps("upper")];
      if (y > gc + 1) return ["white_concrete"];
    }
    if (y === gc) return ["stone_bricks"];        // plinth course
    if (r === 4) return ["dark_oak_planks"];      // shop sign band
    return ["glass_pane"];                        // shopfront glazing
  }

  // Upper storey: punched window bays on odd along-positions
  const bay = along % 2 === 1;
  if (r === 6 || r === 9) return bay ? ["stone_bricks"] : ["white_concrete"];
  if (r === 7 || r === 8) return bay ? ["glass_pane"] : ["white_concrete"];
  return ["white_concrete"];
}

// Main massing
for (const [x, z, gc] of cells) {
  const ex = exposedFaces(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) put(x, y, z, "stone");

  // Walls from ground to the cornice, skipping the floor slab level
  for (let y = gc; y <= L(10); y++) {
    if (y === L(5)) continue;
    if (ex.length === 0) continue; // interior stays air
    const b = facade(x, z, y, ex, gc);
    if (b) put(x, y, z, b[0], b[1]);
  }

  // Storey floor slab (also closes interior floors)
  if (L(5) >= gc) put(x, L(5), z, "light_gray_concrete");

  // Flat roof deck on every footprint cell
  if (L(11) >= gc) put(x, L(11), z, "stone_bricks");

  // Parapet on the perimeter
  if (ex.length > 0 && L(12) >= gc) put(x, L(12), z, "white_concrete");
}

// Rooftop plant: a small AC unit on the interior roof
if (isCell(2, 4) && exposedFaces(2, 4).length === 0) {
  const gc = ground.get("2,4");
  if (L(12) >= gc) {
    put(2, L(12), 4, "iron_block");
    put(2, L(13), 4, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Warm light behind the shopfront glass, just inside the door
if (isCell(2, 7) && exposedFaces(2, 7).length === 0) {
  const gc = ground.get("2,7");
  if (L(2) >= gc) put(2, gc + 2 <= L(4) ? gc + 2 : L(2), 7, "glowstone");
}

// Warm light behind selected upper-storey windows
for (const [x, z, gc] of cells) {
  const ex = exposedFaces(x, z);
  if (ex.length !== 1) continue;
  const face = ex[0];
  const along = face === "W" || face === "E" ? z : x;
  if (along % 4 !== 1) continue;
  const [ix, iz] = IN[face];
  const ix2 = x + ix, iz2 = z + iz;
  if (!isCell(ix2, iz2)) continue;
  if (exposedFaces(ix2, iz2).length !== 0) continue;
  const gi = ground.get(`${ix2},${iz2}`);
  if (L(7) < gi || L(7) === L(5)) continue;
  put(ix2, L(7), iz2, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
