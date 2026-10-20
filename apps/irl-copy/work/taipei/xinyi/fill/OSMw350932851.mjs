import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw350932851";
const OUT = `${DIR}/${ID}.nbt`;

// 麗園大廈: mid-century Taipei residential/office block, about 10 storeys of 5 blocks.
// Pale walls, stone pilasters and sills for relief, glass window grid, flat roof with penthouse.
const W = 57, H = 62, D = 55;
const ROOF = 50;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...cells.map((c) => c[2]));

const GROUND = new Map();
for (const [x, z, gr] of cells) GROUND.set(`${x},${z}`, gr - minG);

const inside = (x, z) => GROUND.has(`${x},${z}`);
const ground = (x, z) => GROUND.get(`${x},${z}`);
const faces = (x, z) => {
  const f = [];
  if (!inside(x, z - 1)) f.push("N");
  if (!inside(x, z + 1)) f.push("S");
  if (!inside(x - 1, z)) f.push("W");
  if (!inside(x + 1, z)) f.push("E");
  return f;
};

// Entrance on the south face if it exists, otherwise north; centred on that face.
const ENT = cells.some(([x, z]) => faces(x, z).includes("S")) ? "S" : "N";
const entXs = cells
  .filter(([x, z]) => faces(x, z).includes(ENT))
  .map((c) => c[0])
  .sort((a, b) => a - b);
const entMid = entXs.length ? entXs[Math.floor(entXs.length / 2)] : -999;

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (!inside(x, z)) return; // build only on footprint cells
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// ---- Per-cell construction ----
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const gr = ground(x, z);
  const f = faces(x, z);
  const per = f.length > 0;
  const corner = f.length >= 2;

  // Base: stone from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!per) {
    // Interior: floor slabs only, air elsewhere (no interiors).
    for (let y = gr; y < ROOF; y++) {
      if (y === gr || y % 5 === 0) put(x, y, z, "light_gray_concrete");
    }
  } else {
    const primary = f[0];
    const a = primary === "N" || primary === "S" ? x : z;
    const isEnt = f.includes(ENT) && Math.abs(x - entMid) <= 1;

    for (let y = gr; y < ROOF; y++) {
      const rel = y - gr;
      const ri = y % 5;

      // Storey lines: light grey cornice bands.
      if (y === gr || (ri === 0 && rel > 0)) {
        put(x, y, z, "light_gray_concrete");
        continue;
      }

      if (rel >= 1 && rel <= 4) {
        // Ground storey: stone base, shopfront and entrance.
        if (rel === 4) {
          put(x, y, z, "light_gray_concrete");
        } else if (isEnt && rel <= 2) {
          // Doorway opening (air), flanked by pilasters below.
          if (Math.abs(x - entMid) === 1) put(x, y, z, "stone_bricks");
        } else if (isEnt && rel === 3) {
          // Canopy row: warm light over the door.
          if (x === entMid) put(x, y, z, "glowstone");
          else put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
        } else if (corner || a % 6 === 0) {
          put(x, y, z, "stone_bricks");
        } else if (a % 3 === 0) {
          put(x, y, z, "light_gray_concrete");
        } else {
          put(x, y, z, "light_blue_stained_glass");
        }
      } else {
        // Upper storeys: window grid rows 1..3, spandrel row 4.
        if (ri >= 1 && ri <= 3) {
          if (corner || a % 6 === 0) {
            put(x, y, z, "stone_bricks"); // pilaster: full-height relief
          } else if (a % 3 === 0) {
            put(x, y, z, "light_gray_concrete"); // mullion
          } else if (ri === 1) {
            // Window sill: recessed-looking lower edge in a slab.
            put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
          } else if (hash(x, y, z) % 23 === 0) {
            put(x, y, z, "glowstone"); // occasional warm lit room
          } else {
            put(x, y, z, "light_blue_stained_glass");
          }
        } else {
          put(x, y, z, "white_concrete"); // spandrel
        }
      }
    }

    // Parapet with coping on exterior cells.
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
  }

  // Roof slab over the whole footprint.
  put(x, ROOF, z, "light_gray_concrete");
}

// ---- Penthouse ----
const PH = { x0: 19, x1: 35, z0: 18, z1: 34 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    const corner = (x === PH.x0 || x === PH.x1) && (z === PH.z0 || z === PH.z1);
    put(x, ROOF + 1, z, "light_gray_concrete"); // floor on roof slab
    put(x, ROOF + 4, z, "light_gray_concrete"); // penthouse roof
    if (edge) {
      for (let y = ROOF + 2; y <= ROOF + 3; y++) {
        if (corner) put(x, y, z, "stone_bricks");
        else if ((x + z) % 3 !== 0) put(x, y, z, "light_blue_stained_glass");
        else put(x, y, z, "light_gray_concrete");
      }
    }
  }
}

// Lightning-rod mast on the penthouse roof.
for (let y = ROOF + 5; y <= ROOF + 8; y++) {
  put(28, y, 27, "lightning_rod", { facing: "up", powered: "false" });
}

g.save(OUT);
