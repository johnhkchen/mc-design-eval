import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540296180";

const W = 9, H = 23, D = 15;
const ROOF = 11;          // roof deck top, about 11 blocks above lowest ground
const FOUNDATION = "stone_bricks";
const WALL = "white_concrete";
const PILLAR = "light_gray_concrete";
const BAND = "light_gray_concrete";
const FASCIA = "red_terracotta";
const GLASS = "light_blue_stained_glass_pane";
const SHOP_GLASS = "white_stained_glass_pane";
const DECK = "smooth_stone";
const PARAPET = "white_concrete";
const LIGHT = "glowstone";
const ROOF_BOX = "light_gray_concrete";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((c) =>
  Array.isArray(c)
    ? { x: c[0], z: c[1], g: Number(c[2] ?? 0) }
    : { x: c.x, z: c.z, g: Number(c.g ?? c.ground ?? 0) }
);

const key = (x, z) => `${x},${z}`;
const groundOf = new Map();
for (const c of cells) groundOf.set(key(c.x, c.z), c.g);
const has = (x, z) => groundOf.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const g = new Voxels([W, H, D]);

// Door: on the south (+z) facade, nearest the middle column.
let doorCell = null;
for (const c of cells) {
  if (!has(c.x, c.z + 1)) {
    if (!doorCell || Math.abs(c.x - 4) < Math.abs(doorCell.x - 4)) doorCell = c;
  }
}
const doorKey = doorCell ? key(doorCell.x, doorCell.z) : null;

// 1. Foundations, roof deck, interior floor slabs.
for (const c of cells) {
  const { x, z, g: gr } = c;
  const perim = DIRS.some(([dx, dz]) => !has(x + dx, z + dz));

  for (let y = 0; y <= gr && y < H; y++) g.set(x, y, z, FOUNDATION);

  if (ROOF > gr) g.set(x, ROOF, z, DECK);

  if (!perim) {
    if (5 > gr) g.set(x, 5, z, BAND);
    if (10 > gr) g.set(x, 10, z, BAND);
  }
}

// 2. Walls, shopfronts, bands, parapet, lights.
for (const c of cells) {
  const { x, z, g: gr } = c;
  const faces = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  if (faces.length === 0) continue;

  const corner = faces.length >= 2;
  const [fdx, fdz] = faces[0];
  const base = gr + 1;
  const isDoorCell = key(x, z) === doorKey;

  const along = fdx !== 0 ? z : x;
  const hi = (fdx !== 0 ? D : W) - 1;
  const isPillar = corner || along % 3 === 0 || along === 0 || along === hi;

  const paneProps = fdx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

  // Parapet cap above the roof deck.
  g.set(x, ROOF + 1, z, PARAPET);

  for (let y = base; y <= 10 && y < H; y++) {
    if (y <= 3) {
      if (isDoorCell && y <= base + 1) {
        const half = y === base ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false",
        });
      } else if (isPillar) {
        g.set(x, y, z, PILLAR);
      } else {
        g.set(x, y, z, SHOP_GLASS, paneProps);
      }
    } else if (y === 4) {
      g.set(x, y, z, FASCIA);
    } else if (y === 5 || y === 10) {
      g.set(x, y, z, BAND);
    } else {
      // Upper floors 6..9
      if (isPillar) {
        g.set(x, y, z, PILLAR);
      } else {
        g.set(x, y, z, GLASS, paneProps);
      }
    }
  }

  // Warm light behind some upper windows: glowstone in the interior cell.
  if (!isPillar && !corner && base <= 7 && 7 <= 9 && along % 2 === 0) {
    const ix = x - fdx, iz = z - fdz;
    if (has(ix, iz) && !DIRS.some(([dx, dz]) => !has(ix + dx, iz + dz))) {
      const ig = groundOf.get(key(ix, iz));
      if (7 > ig) g.set(ix, 7, iz, LIGHT);
    }
  }
}

// 3. Roof equipment: a plant box and a small tank, standing on the roof deck.
for (const c of cells) {
  const { x, z } = c;
  const interior = DIRS.every(([dx, dz]) => has(x + dx, z + dz));
  if (!interior) continue;
  if (x >= 2 && x <= 4 && z >= 5 && z <= 8) {
    g.set(x, 12, z, ROOF_BOX);
    g.set(x, 13, z, ROOF_BOX);
  }
  if (x >= 6 && x <= 7 && z >= 2 && z <= 3) {
    g.set(x, 12, z, "oak_planks");
    g.set(x, 13, z, "oak_planks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
