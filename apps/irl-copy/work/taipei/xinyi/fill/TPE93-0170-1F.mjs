import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE93-0170-1F: 2004 Xinyi glass-curtain office tower, 4 x 16 blocks, roof ~69 blocks.
// Articulation: light-gray base course, 5-block storeys (floor line, cyan glass with
// concrete mullions, spandrel), setback mechanical penthouse, cyan glass crown band,
// sea-lantern beacon and lightning-rod mast. Shroomlights behind some windows at dusk.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE93-0170-1F";
const W = 4, H = 81, D = 16;

const TOP = 64;      // top of last full storey band
const DECK = 65;     // roof deck / cornice level
const PENT_LO = 66;  // penthouse base
const PENT_HI = 68;  // penthouse cap
const CROWN = 69;    // beacon
const MAST_TOP = 73; // top of lightning rod mast

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;

// Ground per footprint cell, shifted so the lowest ground is y 0.
const G = new Map();
let lo = Infinity;
for (const [x, z, gr] of cells) {
  const v = Math.round(gr);
  G.set(key(x, z), v);
  lo = Math.min(lo, v);
}
for (const [k, v] of G) G.set(k, Math.min(v - lo, 60));

const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Glass pane connection props: "z" = runs along the Z axis (north/south links).
const pane = (axis) =>
  axis === "z"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

const has = (x, z) => G.has(key(x, z));

for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);

  const nW = !has(x - 1, z);
  const nE = !has(x + 1, z);
  const nN = !has(x, z - 1);
  const nS = !has(x, z + 1);
  const perim = nW || nE || nN || nS;
  const corner = (nW || nE) && (nN || nS);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Interior: air gap, with floor slabs on storey lines (above foundation).
  if (!perim) {
    for (let y = gr; y <= TOP; y++) {
      if (y % 5 === 0) put(x, y, z, "light_gray_concrete");
    }
  }

  // Facade on the perimeter.
  if (perim) {
    const axisAlong = nW || nE ? "z" : "x";
    const a = axisAlong === "z" ? z : x;

    // Interior cell behind this facade cell (for warm lights).
    let ix = x, iz = z;
    if (nW) ix = x + 1;
    else if (nE) ix = x - 1;
    else if (nN) iz = z + 1;
    else if (nS) iz = z - 1;

    for (let y = gr; y <= TOP; y++) {
      const r = y % 5;
      let b = null, p = null;

      if (y < gr + 2) {
        // Base course.
        b = "polished_andesite";
      } else if (nS && (x === 1 || x === 2) && (y === gr + 2 || y === gr + 3)) {
        // Entrance opening on the south face.
        b = "glass";
      } else if (nS && (x === 1 || x === 2) && y === gr + 4) {
        // Entrance lintel.
        b = "light_gray_concrete";
      } else if (corner) {
        b = "light_gray_concrete";
      } else if (r === 0) {
        b = "light_gray_concrete"; // storey line
      } else if (r === 4) {
        b = "white_concrete"; // spandrel
      } else if (a % 4 === 0) {
        b = "light_gray_concrete"; // mullion
      } else {
        b = "cyan_stained_glass_pane";
        p = pane(axisAlong);
      }

      put(x, y, z, b, p);

      // Warm light behind some windows (interior air cell).
      if (
        b === "cyan_stained_glass_pane" &&
        r === 2 &&
        ((Math.floor(y / 5) * 7 + a * 5) % 9 === 0) &&
        has(ix, iz) &&
        !(ix === x && iz === z)
      ) {
        put(ix, y, iz, "shroomlight");
      }
    }
  }

  // Roof deck / cornice across the whole footprint.
  put(x, DECK, z, "light_gray_concrete");

  // Setback mechanical penthouse, inset from the walls.
  if ((x === 1 || x === 2) && z >= 3 && z <= 12) {
    put(x, PENT_LO, z, "white_concrete");
    put(x, PENT_LO + 1, z, "cyan_stained_glass");
    put(x, PENT_HI, z, "light_gray_concrete");
  }
}

// Beacon and mast on the penthouse, sitting on the cap so nothing floats.
put(1, CROWN, 7, "sea_lantern");
for (let y = CROWN + 1; y <= MAST_TOP; y++) {
  put(1, y, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
