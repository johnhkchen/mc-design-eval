import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538461861";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 16 x 23 x 20: two storeys of about 5 blocks under a parapet that tops out near y = 11.
const W = 16, H = 23, D = 20;
const vox = new Voxels([W, H, D]);

const ROOF_DECK = 10;   // cornice course on the perimeter, roof deck inside
const PARAPET = 11;     // top of the parapet, about 11 blocks above lowest ground
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isPerim = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  vox.set(x, y, z, b, p);
};

const paneProps = (dz) => dz !== 0
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

// Footprint extents and the front (south, +z) entrance cell nearest the centre.
const xs = cells.map(c => c[0]);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2;

const perim = cells.filter(([x, z]) => isPerim(x, z));
const exteriorSides = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

let door = null;
{
  const cands = perim.filter(([x, z]) => {
    const s = exteriorSides(x, z);
    return s.some(([dx, dz]) => dx === 0 && dz === 1) && !(s.length > 1) && x % 3 !== 0;
  });
  cands.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
  if (cands.length) door = { x: cands[0][0], z: cands[0][1] };
}

// Foundation, walls, floors and roof for every footprint cell.
for (const [x, z, gr] of cells) {
  const g0 = gr;
  const hasUpper = g0 + 5 <= 8;

  // Foundation: solid from y 0 up to the cell's own ground.
  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");

  if (isPerim(x, z)) {
    const sides = exteriorSides(x, z);
    const s0 = sides[0];
    const t = s0[1] !== 0 ? x : z;
    const pier = sides.length > 1 || t % 3 === 0;

    if (pier) {
      // Full-height pilasters on corners and every third bay.
      for (let y = g0; y <= PARAPET; y++) {
        put(x, y, z, y === g0 ? "stone_bricks" : "smooth_quartz");
      }
      continue;
    }

    const isDoorCell = door && door.x === x && door.z === z;

    for (let y = g0; y <= PARAPET; y++) {
      if (y === g0) { put(x, y, z, "stone_bricks"); continue; }
      if (y === ROOF_DECK) { put(x, y, z, "smooth_stone"); continue; }
      if (y === PARAPET) { put(x, y, z, "white_concrete"); continue; }

      // Canopy band over the entrance, across the front bays.
      if (y === g0 + 4 && door && sides.some(([dx, dz]) => dx === 0 && dz === 1) &&
          Math.abs(x - door.x) <= 1) {
        put(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
        continue;
      }

      // Ground floor: shopfront glazing with a door.
      if (y >= g0 + 1 && y <= g0 + 3) {
        if (isDoorCell && y <= g0 + 2) {
          const dp = { facing: "south", hinge: "left", open: "false", powered: "false" };
          put(x, y, z, "dark_oak_door", { ...dp, half: y === g0 + 1 ? "lower" : "upper" });
          continue;
        }
        put(x, y, z, "light_blue_stained_glass_pane", paneProps(s0[1]));
        continue;
      }

      if (y === g0 + 4) { put(x, y, z, "white_concrete"); continue; }

      // Upper storey.
      if (hasUpper) {
        if (y === g0 + 5) { put(x, y, z, "white_concrete"); continue; }
        if (y >= g0 + 6 && y <= g0 + 8) {
          put(x, y, z, "light_blue_stained_glass_pane", paneProps(s0[1]));
          continue;
        }
        if (y === g0 + 9) { put(x, y, z, "white_concrete"); continue; }
      }

      put(x, y, z, "white_concrete");
    }
  } else {
    // Interior: a floor slab per storey and the roof deck, with an air gap between.
    put(x, g0, z, "smooth_stone");
    if (hasUpper) put(x, g0 + 5, z, "smooth_stone");
    put(x, ROOF_DECK, z, "gray_concrete");
  }
}

// Warm light: glowstone behind some upper and ground glazing, in the air gap inside.
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const sides = exteriorSides(x, z);
  if (sides.length !== 1) continue;
  const [dx, dz] = sides[0];
  const t = dz !== 0 ? x : z;
  if (t % 3 === 0) continue;
  if (door && door.x === x && door.z === z) continue;
  if ((x + z) % 2 !== 0) continue;

  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;

  const g0 = gr;
  put(ix, g0 + 2, iz, "glowstone");
  if (g0 + 5 <= 8) put(ix, g0 + 7, iz, "glowstone");
}

// Roof equipment: a couple of plant boxes on the roof deck.
let plant = 0;
for (const [x, z, gr] of cells) {
  if (plant >= 3) break;
  if (isPerim(x, z)) continue;
  if ((x * 7 + z * 3) % 11 !== 0) continue;
  put(x, PARAPET, z, "iron_block");
  plant++;
}

vox.save(`${DIR}/${ID}.nbt`);
