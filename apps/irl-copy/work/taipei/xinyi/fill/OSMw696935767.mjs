import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw696935767";
const cells = JSON.parse(readFileSync(BASE + ".cells.json", "utf8"));

// 博愛廣場大廈: a 1980s-90s Taipei commercial block. Two storeys of about 5 blocks
// over a shopfront base, white tiled piers, tinted glazing, a stone cornice,
// a white parapet, and a set-back roof penthouse with AC plant.
const W = 32, H = 23, D = 25;
const ROOF = 11;
const g = new Voxels([W, H, D]);

const G = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  G.set(x + "," + z, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => G.has(x + "," + z);
const groundOf = (x, z) => G.get(x + "," + z);

// outward normals: [dx, dz]
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

const isPerim = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Door cell on the front (north, z-min) face, at the centre column.
const cx = Math.floor((minX + maxX) / 2);
let doorZ = null;
for (let z = minZ; z <= maxZ; z++) {
  if (has(cx, z) && !has(cx, z - 1)) { doorZ = z; break; }
}
const isDoor = (x, z) => doorZ !== null && x === cx && z === doorZ;

function facade(x, y, z, dir, gr) {
  const [dx, dz] = dir;
  const u = dz !== 0 ? x - minX : z - minZ;

  // Door and lantern on the front face.
  if (isDoor(x, z) && dz === -1 && (y === gr || y === gr + 1)) {
    const props = {
      facing: "north",
      hinge: "left",
      open: "false",
      powered: "false",
      half: y === gr ? "lower" : "upper",
    };
    put(x, y, z, "dark_oak_door", props);
    return;
  }
  if (isDoor(x, z) && dz === -1 && y === gr + 2 && gr + 2 === 3) {
    put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
    return;
  }

  if (y === 10) { put(x, y, z, "smooth_stone"); return; }          // cornice
  if (y === 5) { put(x, y, z, "smooth_stone"); return; }           // storey line
  if (y === 4) { put(x, y, z, "stone_bricks"); return; }           // lintel band
  if (y === gr && gr <= 3) { put(x, y, z, "stone_bricks"); return; } // plinth

  if (y <= 3) {                                                      // shopfront
    put(x, y, z, u % 4 === 0 ? "white_concrete" : "glass");
    return;
  }

  // Upper storey, y 6..9: tiled piers and tinted glazing.
  if (u % 3 === 0) {
    put(x, y, z, "white_concrete");
    return;
  }
  put(x, y, z, "gray_stained_glass");

  // Warm light behind some upper windows, inside the room.
  if (y === 7 && u % 3 === 2) {
    const ix = -dx, iz = -dz;
    const xx = x + ix, zz = z + iz;
    if (has(xx, zz) && !isPerim(xx, zz)) put(xx, 7, zz, "glowstone");
  }
}

// Roof penthouse rectangle, set back from the street-facing walls.
const px0 = minX + 7, px1 = maxX - 7, pz0 = minZ + 6, pz1 = maxZ - 6;
const inPent = (x, z) => x >= px0 && x <= px1 && z >= pz0 && z <= pz1;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const perim = isPerim(x, z);
  const out = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

  // Roof deck at the top of the main block.
  put(x, ROOF, z, perim ? "white_concrete" : "light_gray_concrete");

  // Storey floor slab at y 5 across the footprint (interior air elsewhere).
  if (!perim) put(x, 5, z, "smooth_stone");

  if (perim && gr <= 10) {
    const dir = out[0];
    for (let y = gr; y <= 10; y++) facade(x, y, z, dir, gr);
  }

  // Roof plant outside the penthouse: small AC boxes on interior roof.
  if (!perim && !inPent(x, z) && (x * 3 + z * 5) % 11 === 0) {
    put(x, ROOF + 1, z, "light_gray_concrete");
  }

  // Penthouse walls, glazed band, and roof.
  if (inPent(x, z)) {
    const edge = x === px0 || x === px1 || z === pz0 || z === pz1;
    put(x, ROOF + 4, z, "smooth_stone");          // roof of penthouse at y 15
    if (edge) {
      put(x, ROOF + 1, z, "white_concrete");      // y 12
      put(x, ROOF + 2, z, "gray_stained_glass");  // y 13
      put(x, ROOF + 3, z, "white_concrete");      // y 14
    }
  }
}

// Antenna on the penthouse centre.
const acx = Math.floor((px0 + px1) / 2), acz = Math.floor((pz0 + pz1) / 2);
if (has(acx, acz)) {
  for (let y = ROOF + 5; y <= ROOF + 7; y++) {
    put(acx, y, acz, "chain", { axis: "y", waterlogged: "false" });
  }
}

g.save(BASE + ".nbt");
