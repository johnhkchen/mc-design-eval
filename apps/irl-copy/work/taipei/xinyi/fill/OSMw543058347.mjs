import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw543058347";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 20;
const g = new Voxels([W, H, D]);

// Low-rise commercial block, c. 1980s Taiwan: two storeys of shopfront and
// tiled-concrete upper floors, stone base and cornice, flat roof with a
// water tank and a rooftop planter.
const TOP = 11;   // roof deck layer
const PAR = 12;   // parapet layer

const key = (x, z) => `${x},${z}`;
const G = new Map(cells.map(([x, z, h]) => [key(x, z), h]));
const has = (x, z) => G.has(key(x, z));
const baseOf = (x, z) => Math.max(0, Math.min(10, Math.round(G.get(key(x, z)) ?? 0)));
const isPer = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Pass 1: foundation, floors, walls, cornice, parapet and roof deck per cell.
for (const [x, z] of cells) {
  const base = baseOf(x, z);
  const onN = !has(x, z - 1), onS = !has(x, z + 1);
  const onW = !has(x - 1, z), onE = !has(x + 1, z);
  const onNS = onN || onS, onEW = onW || onE;
  const per = onNS || onEW;
  const corner = onNS && onEW;

  // Foundation up to the local ground.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");
  // Floor at ground level.
  put(x, base, z, per ? "stone_bricks" : "smooth_stone");

  // Storey line between the two floors, all cells.
  if (base < 5) put(x, 5, z, "smooth_stone");

  if (per) {
    // Bays: piers at corners and every third bay along each face.
    const idx = onNS ? x : z;
    const pier = corner || idx % 3 === 0;
    const pierId = pier ? "white_concrete" : null;

    // Ground storey: shopfront glass in piered frame, lintel above.
    for (let y = base + 1; y <= 3; y++) {
      put(x, y, z, pier ? "white_concrete" : "glass");
    }
    if (base < 4) put(x, 4, z, pier ? "white_concrete" : "light_gray_concrete");

    // Upper storey: sill, glazing, header.
    for (let y = Math.max(6, base + 1); y <= 9; y++) {
      if (y === 6 || y === 9) {
        put(x, y, z, pier ? "white_concrete" : "light_gray_concrete");
      } else {
        put(x, y, z, pier ? "white_concrete" : "glass");
      }
    }

    // Cornice band.
    if (base < 10) put(x, 10, z, "stone_bricks");

    // Parapet capping the wall.
    put(x, PAR, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    void pierId;
  }

  // Roof deck over every footprint cell.
  put(x, TOP, z, "smooth_stone");
}

// Pass 2: warm lights behind glass (inward interior cells), using the
// inward cell's own ground height.
for (const [x, z] of cells) {
  if (!isPer(x, z)) continue;
  const onN = !has(x, z - 1), onS = !has(x, z + 1);
  const onW = !has(x - 1, z), onE = !has(x + 1, z);
  const onNS = onN || onS, onEW = onW || onE;
  if (onNS && onEW) continue; // corners are piers

  let ix = 0, iz = 0;
  if (onN) iz = 1;
  else if (onS) iz = -1;
  else if (onW) ix = 1;
  else if (onE) ix = -1;

  const x2 = x + ix, z2 = z + iz;
  if (!has(x2, z2) || isPer(x2, z2)) continue;
  const idx = onNS ? x : z;
  const b2 = baseOf(x2, z2);

  if (idx % 6 === 1) {
    put(x2, 7, z2, "glowstone");
  } else if (idx % 5 === 2 && b2 + 2 <= 3) {
    put(x2, b2 + 2, z2, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Entrance on the south face, nearest the middle.
{
  const southCells = cells.filter(([x, z]) => !has(x, z + 1));
  if (southCells.length) {
    const maxZ = Math.max(...southCells.map(([, z]) => z));
    const faceCells = southCells.filter(([, z]) => z === maxZ);
    const [dx, dz] = faceCells.reduce((best, c) =>
      Math.abs(c[0] - 9.5) < Math.abs(best[0] - 9.5) ? c : best);
    const b = baseOf(dx, dz);
    put(dx, b + 1, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(dx, b + 2, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(dx, b + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Roof equipment: water tank block, rooftop planter, and a small rail.
for (let x = 4; x <= 7; x++) {
  for (let z = 4; z <= 7; z++) {
    if (!has(x, z)) continue;
    put(x, 12, z, "white_concrete");
    put(x, 13, z, "white_concrete");
    put(x, 14, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}
for (let x = 12; x <= 16; x++) {
  for (let z = 12; z <= 16; z++) {
    if (!has(x, z)) continue;
    put(x, 12, z, "oak_leaves", { persistent: "true", distance: "7", waterlogged: "false" });
  }
}
if (has(10, 10)) {
  for (let y = 12; y <= 16; y++) put(10, y, 10, "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
