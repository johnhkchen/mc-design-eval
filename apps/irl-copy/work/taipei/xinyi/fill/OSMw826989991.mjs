import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no entry. Reading as a 1980s-90s commercial block in Xinyi: five storeys on a
// stone base, white tiled-concrete piers and spandrels, light-grey belt courses, blue-tinted
// glass bands, shopfront ground floor, a quartz cornice and a central plant penthouse.
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw826989991";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 22, H = 38, D = 17;
const ROOF = 26;   // roof level (top of the 5th storey's cornice)
const STOREY = 5;

const gz = new Map();
for (const [x, z, gr] of cells) gz.set(`${x},${z}`, gr);
const has = (x, z) => gz.has(`${x},${z}`);
const ground = (x, z) => gz.get(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);

// Bottom-up foundation: solid from y 0 to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// Ground floor slab for cells sitting on the lowest ground.
for (const [x, z, gr] of cells) {
  if (gr === 0 && !isEdge(x, z)) g.set(x, 0, z, "smooth_stone");
}

// Facade material for one edge cell at absolute height y.
function wallBlock(y, base, along) {
  if (y === ROOF) return "smooth_quartz";                 // cornice / parapet cap
  if (y % STOREY === 0 && y >= STOREY) return "light_gray_concrete"; // floor belt
  if (y < STOREY) {                                       // ground floor shopfronts
    if (y === base) return "stone_bricks";                // base course
    if (y === 4) return "light_gray_concrete";            // shop lintel belt
    return along % 3 === 0 ? "stone_bricks" : "light_blue_stained_glass";
  }
  const rel = y % STOREY;
  if (rel === 4) return "white_concrete";                 // spandrel
  // rel 1..3: window band with white piers every third cell
  return along % 3 === 0 ? "white_concrete" : "light_blue_stained_glass";
}

// Walls on the perimeter, glass in windows, and the warm lights behind some panes.
for (const [x, z, base] of cells) {
  if (!isEdge(x, z)) continue;
  const faces = [[-1, 0], [1, 0], [0, -1], [0, 1]].filter(([dx, dz]) => !has(x + dx, z + dz));
  const [dx, dz] = faces[0];
  const along = dx !== 0 ? z : x;

  for (let y = base; y <= ROOF; y++) {
    const b = wallBlock(y, base, along);
    g.set(x, y, z, b);
  }

  // Warm light in the room behind a window (interior cell must exist and be open).
  const ix = x - dx, iz = z - dz;
  if (has(ix, iz) && !isEdge(ix, iz) && along % 6 === 1) {
    for (let y = base; y <= ROOF - 2; y++) {
      const isWindow = (y >= STOREY && y % STOREY >= 1 && y % STOREY <= 3) ||
                       (y < STOREY && y >= base + 1 && y <= 3);
      if (isWindow && (y % STOREY === 2 || (y < STOREY && y === base + 2))) {
        if (ground(ix, iz) <= y) g.set(ix, y, iz, "glowstone");
      }
    }
  }
}

// Interior floor slabs at each storey line, and the roof deck.
for (const [x, z, base] of cells) {
  if (isEdge(x, z)) continue;
  for (let s = 1; s <= 5; s++) {
    const y = s * STOREY;
    if (y >= base && y <= ROOF - 1) g.set(x, y, z, "light_gray_concrete");
  }
  if (ROOF >= base) g.set(x, ROOF, z, "smooth_stone");
}

// Main entrance on the z-minimum face, nearest the middle.
{
  let minZ = Infinity;
  for (const [, z] of cells) minZ = Math.min(minZ, z);
  const cand = cells.filter(([, z]) => z === minZ).sort((a, b) => Math.abs(a[0] - 11) - Math.abs(b[0] - 11));
  if (cand.length) {
    const [ex, ez, eg] = cand[0];
    g.set(ex, eg + 1, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(ex, eg + 2, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    // Canopy fascia over the entrance and its neighbours on the same face.
    for (const dxo of [-1, 0, 1]) {
      if (has(ex + dxo, ez)) g.set(ex + dxo, eg + 3, ez, "light_gray_concrete");
    }
    // Flanking brass-toned lanterns (shroomlights read as warm light at dusk).
    if (has(ex - 1, ez)) g.set(ex - 1, eg + 3, ez, "shroomlight");
    if (has(ex + 1, ez)) g.set(ex + 1, eg + 3, ez, "shroomlight");
  }
}

// Roof plant: a central penthouse and four small AC units on the roof deck.
for (let x = 7; x <= 14; x++) {
  for (let z = 5; z <= 11; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    const base = ROOF + 1;
    for (let y = base; y <= 29; y++) {
      const edge = x === 7 || x === 14 || z === 5 || z === 11;
      if (!edge) continue;
      g.set(x, y, z, y === 28 ? "light_blue_stained_glass" : "white_concrete");
    }
    g.set(x, 30, z, "smooth_quartz");
  }
}
for (const [x, z] of [[3, 3], [4, 3], [3, 4], [4, 4], [17, 3], [18, 3], [17, 4], [18, 4],
                     [3, 12], [4, 12], [3, 13], [4, 13], [17, 12], [18, 12], [17, 13], [18, 13]]) {
  if (has(x, z) && !isEdge(x, z)) g.set(x, ROOF + 1, z, "iron_block");
}

g.save(`${dir}/${id}.nbt`);
