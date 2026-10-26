import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC76122: 600 13th St NW, Commercial-Office-Large.
// Mid-century Stripped-Classical office: limestone-clad (calcite piers and
// spandrels) on a polished andesite base, chiseled cornice and stone parapet,
// 4-block storey rhythm, and a central entrance on the street (north, z=0) face
// with a glazed shopfront and lantern-lit door surround. A single set-back
// penthouse sits on the tallest roof; no scattered roof clutter.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC76122";
const W = 13, H = 32, D = 33;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((c) => ({ x: c[0], z: c[1], g: Math.round(c[2]), r: Math.round(c[3]) }));

const key = (x, z) => `${x},${z}`;
const map = new Map(cells.map((c) => [key(c.x, c.z), c]));
const has = (x, z) => map.has(key(x, z));
const mod = (a, n) => ((a % n) + n) % n;

// Lidar smoothing: 3x3 median of roof heights, clamped to a sane range.
for (const c of cells) {
  const nb = [];
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      if (has(c.x + dx, c.z + dz)) nb.push(map.get(key(c.x + dx, c.z + dz)).r);
  nb.sort((a, b) => a - b);
  let R = nb[Math.floor(nb.length / 2)];
  R = Math.max(c.g + 8, Math.min(H - 6, R));
  c.R = R;
}

// Global storey grid anchored on the lowest ground under the footprint.
const G = Math.min(...cells.map((c) => c.g));

const OUT = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];
const exposures = (c) => OUT.filter(([dx, dz]) => !has(c.x + dx, c.z + dz));

// Street entrance: north-facing perimeter cell nearest the middle of the front.
const frontCells = cells
  .filter((c) => exposures(c).some((e) => e[1] === -1))
  .sort((a, b) => Math.abs(a.x - 6) - Math.abs(b.x - 6));
const doorCell = frontCells[0];
const doorX = doorCell.x, doorZ = doorCell.z;

const g = new Voxels([W, H, D]);

// Pass 1: massing, foundations, floors, facades.
for (const c of cells) {
  const ex = exposures(c);
  const perim = ex.length > 0;
  const { x, z, g: ground, R } = c;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y <= R; y++) {
    if (!perim) {
      // Interior: floor slabs per storey and a roof deck; air otherwise.
      if (y === R - 1) g.set(x, y, z, "smooth_stone");
      else if (y < R - 1 && (y === ground || mod(y - G, 4) === 0)) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Perimeter envelope.
    if (y === R) { g.set(x, y, z, "stone_brick_wall"); continue; }          // parapet
    if (y === R - 1) { g.set(x, y, z, "chiseled_stone_bricks"); continue; } // cornice
    if (y === ground) { g.set(x, y, z, "polished_andesite"); continue; }    // base course

    const isCorner = ex.length >= 2;
    const along = ex[0][1] !== 0 ? x : z;
    const pier = isCorner || mod(along, 3) === 0;
    const front = ex.some((e) => e[1] === -1);
    const rel = mod(y - G, 4);

    // Entrance door, two blocks tall, standing on the base course.
    if (c === doorCell) {
      const props = { facing: "north", hinge: "left", open: "false", powered: "false" };
      if (y === ground + 1) { g.set(x, y, z, "dark_oak_door", { ...props, half: "lower" }); continue; }
      if (y === ground + 2) { g.set(x, y, z, "dark_oak_door", { ...props, half: "upper" }); continue; }
    }

    // Door surround: quartz jambs flank the door in the shopfront band.
    const jamb = front && Math.abs(along - doorX) === 1 && y <= ground + 2;
    if (jamb) { g.set(x, y, z, "smooth_quartz"); continue; }

    if (pier) { g.set(x, y, z, "calcite"); continue; }
    if (rel === 0 || rel === 3) { g.set(x, y, z, "calcite"); continue; }

    // Glazing: shopfront at street level, office windows above.
    g.set(x, y, z, "light_blue_stained_glass");
  }
}

// Pass 2: a lintel lantern over the entrance and warm lights behind some windows.
for (let y = doorCell.g + 3; y < doorCell.R - 1; y++) {
  if (mod(y - G, 4) !== 3) continue;
}
const lintelY = doorCell.g + 3;
if (has(doorX, doorZ + 1)) {
  g.set(doorX, doorCell.g + 2, doorZ + 1, "lantern", { hanging: "true", waterlogged: "false" });
}

for (const c of cells) {
  const ex = exposures(c);
  if (!ex.length) continue;
  const [dx, dz] = ex[0];
  const ix = c.x - dx, iz = c.z - dz;
  if (!has(ix, iz)) continue;
  if (exposures(map.get(key(ix, iz))).length) continue; // true interior cells only
  const along = dz !== 0 ? c.x : c.z;
  if (mod(along, 3) === 0 || ex.length >= 2) continue;  // piers and corners
  if (c === doorCell) continue;
  for (let y = c.g + 1; y < c.R - 1; y++) {
    if (mod(y - G, 4) !== 1) continue;
    if (mod(c.x + c.z + y, 5) === 0) {
      g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Pass 3: one set-back penthouse on the tallest interior roof, with a glazed band.
const maxR = Math.max(...cells.map((c) => c.R));
for (const c of cells) {
  if (exposures(c).length) continue;
  if (c.R < maxR - 1) continue;
  if (c.x < 4 || c.x > 8 || c.z < 10 || c.z > 22) continue;
  const top = c.R + 3;
  if (top >= H - 1) continue;
  for (let y = c.R; y <= top; y++) {
    if (y === c.R || y === top) g.set(c.x, y, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    else if (c.x === 4 || c.x === 8 || c.z === 10 || c.z === 22) g.set(c.x, y, c.z, "calcite");
    else g.set(c.x, y, c.z, "light_blue_stained_glass");
  }
}

g.save(`${DIR}/${ID}.nbt`);
