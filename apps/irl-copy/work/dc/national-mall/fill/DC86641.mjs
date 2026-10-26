import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86641.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86641.nbt";

// 1660 L St NW: 1970s-80s Class A office tower. White precast piers, tinted glass
// in a light gray spandrel grid, stone plinth, dark entrance canopy, one clean
// roof tier with a centred mechanical penthouse.
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 17, H = 32, D = 14;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(`${x},${z}`, { gr, r: roof });
const has = (x, z) => map.has(`${x},${z}`);

// Smooth the lidar roof into one clean tier: even-numbered median of the roof heights,
// always at least four blocks above the highest ground under the footprint.
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const median = roofs[Math.floor(roofs.length / 2)];
const maxGr = Math.max(...cells.map((c) => c[2]));
const R = Math.max(2 * Math.round(median / 2), maxGr + 4);

const S = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const GLASS = "light_blue_stained_glass";
const PIER = "white_concrete";
const SPAND = "light_gray_concrete";
const BASE = "stone_bricks";
const CORNICE = "smooth_quartz";
const CANOPY = "black_concrete";

for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const { gr } = map.get(`${x},${z}`);
  const topY = R - 1; // flat roof slab, one tier for the whole footprint

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) S(x, y, z, BASE);

  // Facade classification.
  const exZ = !has(x, z - 1) || !has(x, z + 1); // face runs along X
  const exX = !has(x - 1, z) || !has(x + 1, z); // face runs along Z
  const ext = exZ || exX;
  let pier = false;
  if (exX && exZ) pier = true;
  else if (exZ) pier = x % 3 === 0;
  else if (exX) pier = z % 3 === 0;

  // Entrance on the z=0 (north) face, centred, with canopy.
  const isDoorCell = ext && z === 0 && x === 8;
  const isCanopy = z <= 1 && x >= 6 && x <= 10;

  for (let y = gr; y <= topY; y++) {
    const rel = y - gr;

    if (!ext) {
      // Interior: floor slabs and roof slab only, air gap otherwise.
      if (rel % 2 === 0 || y === topY) {
        S(x, y, z, SPAND);
      } else if (rel >= 1 && y < topY - 2 && (x * 3 + z * 5 + rel) % 13 === 0) {
        // Sparse warm light well below the roof, behind the glass.
        S(x, y, z, "glowstone");
      }
      continue;
    }

    // Exterior shell.
    if (y === topY) {
      S(x, y, z, CORNICE);
      continue;
    }

    if (isCanopy && rel === 3) {
      S(x, y, z, CANOPY);
      continue;
    }

    if (isDoorCell && (rel === 1 || rel === 2)) {
      S(x, y, z, "dark_oak_door", {
        facing: "north",
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (rel === 0) {
      S(x, y, z, BASE);
    } else if (rel % 2 === 0) {
      S(x, y, z, rel === 2 ? CORNICE : SPAND);
    } else {
      S(x, y, z, pier ? PIER : GLASS);
    }
  }

  // Parapet band just under the roof on the exterior, reads as a cornice.
  if (ext && topY - 1 > gr) S(x, topY - 1, z, SPAND);
}

// Centred mechanical penthouse on the single roof tier.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (x < 5 || x > 11 || z < 4 || z > 9) continue;
  S(x, R, z, SPAND);
  const ring = x === 5 || x === 11 || z === 4 || z === 9;
  S(x, R + 1, z, ring ? PIER : SPAND);
}

g.save(OUT);
