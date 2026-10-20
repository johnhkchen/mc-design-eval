import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265986";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 30, H = 33, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) G.set(x + "," + z, gr);
const inFp = (x, z) => G.has(x + "," + z);
const gAt = (x, z) => G.get(x + "," + z);

const minG = Math.min(...G.values());
const keys = [...G.keys()].map(k => k.split(",").map(Number));
const minX = Math.min(...keys.map(k => k[0]));
const maxX = Math.max(...keys.map(k => k[0]));
const minZ = Math.min(...keys.map(k => k[1]));
const maxZ = Math.max(...keys.map(k => k[1]));

// Perimeter: any side open to outside the footprint
const perim = (x, z) => !inFp(x + 1, z) || !inFp(x - 1, z) || !inFp(x, z + 1) || !inFp(x, z - 1);

// Piers: every 3 blocks along the faces, plus the corners
const pier = (x, z) => {
  if (x === minX || x === maxX) return (z - minZ) % 3 === 0 || z === maxZ;
  return (x - minX) % 3 === 0 || x === maxX;
};

// Rooftop plant room, centred on the roof
const penthouse = (x, z) => x >= 9 && x <= 20 && z >= 5 && z <= 10;

// Some windows are lit; the lit ones have a glowstone just inside them
const isLitWin = (x, z, t) => {
  if (!perim(x, z) || pier(x, z)) return false;
  const band = t % 5;
  if (band < 1 || band > 3) return false;
  return ((x * 7 + z * 3 + Math.floor(t / 5)) % 5) === 0;
};
const litInner = (x, y, z) => {
  const t = y - minG;
  if (t < 5 || t >= 20 || t % 5 !== 2) return false;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inFp(nx, nz) && isLitWin(nx, nz, t)) return true;
  }
  return false;
};

const GLASS = "light_blue_stained_glass_pane";

for (const [x, z] of keys) {
  const gr = gAt(x, z);
  const per = perim(x, z);
  const isPier = pier(x, z);
  const isEntranceRow = z === minZ && x >= 13 && x <= 16;
  const isCanopyRow = z === minZ && x >= 12 && x <= 17;

  for (let y = 0; y < H; y++) {
    // Foundation: solid from y 0 up to this cell's ground
    if (y < gr) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    const t = y - minG;

    // Roof deck and cornice
    if (t === 20) {
      g.set(x, y, z, per ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }

    // Parapet line
    if (t === 21) {
      if (per) g.set(x, y, z, "white_concrete");
      else if (penthouse(x, z)) g.set(x, y, z, "white_concrete");
      continue;
    }

    // Rooftop plant room above the parapet
    if (t > 21) {
      if (penthouse(x, z) && t <= 23) {
        g.set(x, y, z, t === 23 ? "smooth_quartz" : "white_concrete");
      }
      continue;
    }

    // Storeys below the roof
    if (!per) {
      // Interior: floor slabs per storey, air between, warm lights behind windows
      if (y === gr || t === 5 || t === 10 || t === 15) {
        g.set(x, y, z, "light_gray_concrete");
      } else if (litInner(x, y, z)) {
        g.set(x, y, z, "glowstone");
      }
      continue;
    }

    // Exterior facade
    if (t < 5) {
      // Ground floor: shopfront / entrance
      if (isEntranceRow && t <= 3 && y >= gr) continue; // open entrance
      if (t === 4) {
        g.set(x, y, z, isCanopyRow ? "smooth_stone" : "white_concrete");
        continue;
      }
      if (y === gr) {
        g.set(x, y, z, "polished_andesite"); // base course
        continue;
      }
      if (isPier) g.set(x, y, z, "stone_bricks");
      else g.set(x, y, z, GLASS);
      continue;
    }

    // Upper storeys
    const band = t % 5;
    if (band === 0 || band === 4) {
      g.set(x, y, z, "white_concrete"); // floor line / sill spandrels
    } else if (isPier) {
      g.set(x, y, z, "quartz_block");
    } else {
      g.set(x, y, z, GLASS);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
