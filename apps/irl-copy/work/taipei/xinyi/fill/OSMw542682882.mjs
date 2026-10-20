import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1990s Xinyi-style mid-rise commercial block: two storeys over a shopfront,
// cream quartz facade with stone-brick bands, tinted-glass window grid,
// stone cornice and parapet, flat roof with plant boxes.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682882";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 8;
const g = new Voxels([W, H, D]);

// Storey lines (absolute y): shopfront below 4, band 4-5, upper storey 6-8,
// band 9, cornice 10, parapet 11.
const FLOOR2 = 5, LINTEL1 = 4, LINTEL2 = 9, CORNICE = 10, PARAPET = 11;

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));
const faces = (x, z) => ({
  N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z),
});
const isEdge = (f) => f.N || f.S || f.W || f.E;
const isInterior = (x, z) => has(x, z) && !isEdge(faces(x, z));

const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs);
const doorX = Math.round((minX + maxX) / 2);

const WALL = "smooth_quartz";
const BAND = "stone_bricks";
const PIER = "chiseled_stone_bricks";
const GLASS = "light_blue_stained_glass_pane";
const ROOF = "gray_concrete";
const FLOOR = "smooth_stone";

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone_bricks");

  const f = faces(x, z);

  if (!isEdge(f)) {
    // Interior: floor slab at the storey line and roof deck; air otherwise.
    g.set(x, FLOOR2, z, FLOOR);
    g.set(x, CORNICE, z, ROOF);
    continue;
  }

  const ns = f.N || f.S;
  const ew = f.W || f.E;
  const corner = ns && ew;
  const idx = ns ? x - minX : z - minZ;
  const pier = corner || idx % 3 === 0;
  const isDoor = f.N && x === doorX;

  for (let y = gr; y <= LINTEL2; y++) {
    if (y >= H) break;

    if (isDoor && (y === gr || y === gr + 1)) {
      const props = {
        facing: "north",
        half: y === gr ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
      g.set(x, y, z, "oak_door", props);
      continue;
    }

    if (y === LINTEL1 || y === FLOOR2 || y === LINTEL2) {
      g.set(x, y, z, BAND);
      continue;
    }

    const windowBand = (y > gr && y <= 3) || (y >= 6 && y <= 8);
    if (windowBand && !pier) {
      if (ns) {
        g.set(x, y, z, GLASS, {
          north: "false", south: "false", east: "true", west: "true", waterlogged: "false",
        });
      } else {
        g.set(x, y, z, GLASS, {
          north: "true", south: "true", east: "false", west: "false", waterlogged: "false",
        });
      }
      continue;
    }

    g.set(x, y, z, pier && y > gr ? PIER : WALL);
  }

  // Cornice and parapet.
  g.set(x, CORNICE, z, BAND);
  g.set(x, PARAPET, z, pier ? PIER : WALL);
}

// Warm light behind some upper-storey windows (glowstone in the air gap).
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  if (!isEdge(f)) continue;
  const ns = f.N || f.S;
  const ew = f.W || f.E;
  if (ns && ew) continue;
  const idx = ns ? x - minX : z - minZ;
  if (idx % 3 === 0 || idx % 6 !== 2) continue;
  if (f.N && x === doorX) continue;
  let lx = x, lz = z;
  if (f.N) lz = z + 1;
  else if (f.S) lz = z - 1;
  else if (f.W) lx = x + 1;
  else if (f.E) lx = x - 1;
  if (isInterior(lx, lz)) g.set(lx, 7, lz, "glowstone");
}

// Roof plant: two small units and a lightning rod on the interior roof deck.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!isInterior(x, z)) continue;
  const unitA = (x === 4 || x === 5) && (z === 3 || z === 4);
  const unitB = (x === 11 || x === 12) && (z === 3 || z === 4);
  if (unitA || unitB) {
    g.set(x, PARAPET, z, "light_gray_concrete");
    g.set(x, PARAPET + 1, z, "light_gray_concrete");
  }
}
if (isInterior(8, 4)) {
  g.set(8, PARAPET, 4, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
