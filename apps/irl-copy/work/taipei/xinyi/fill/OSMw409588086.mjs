import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Building OSMw409588086, Xinyi district, Taipei.
// Inferred from the lidar: roof about 35 blocks above the lowest ground, roughly 7 storeys of 5 blocks.
// Era: late-1980s to 1990s Taipei mid-rise office/retail. White tile frame, blue-green glass bands,
// a granite base, a shopfront ground storey with a doorway on the south face under a canopy,
// a parapet with cap, and a rooftop mechanical penthouse with louvres and a small mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw409588086";
const W = 32, H = 47, D = 29;
const ROOF = 35;            // roof slab top, relative to lowest ground (y 0)
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();   // "x,z" -> ground y
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);
const key = (x, z) => `${x},${z}`;
const has = (x, z) => ground.has(key(x, z));

// Exterior faces: a footprint cell whose neighbour lies outside the footprint.
const FACES = [
  [0, 1, "south"], [0, -1, "north"], [1, 0, "east"], [-1, 0, "west"],
];
const face = new Map();     // "x,z" -> { dx, dz, name, bay }
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  for (const [dx, dz, name] of FACES) {
    if (!has(x + dx, z + dz)) {
      // Along-wall coordinate: x on north/south faces, z on east/west faces.
      face.set(key(x, z), { dx, dz, name, bay: dz !== 0 ? x : z });
      break;
    }
  }
}

// Inward distance from the exterior, used for the penthouse.
const dist = new Map();
const queue = [];
for (const k of face.keys()) { dist.set(k, 0); queue.push(k); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i].split(",").map(Number);
  const d = dist.get(queue[i]);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nk = key(x + dx, z + dz);
    if (has(x + dx, z + dz) && !dist.has(nk)) {
      dist.set(nk, d + 1);
      queue.push(nk);
    }
  }
}

// Entrance on the south face: centred on the median south-facing bay.
const southXs = [...face.entries()]
  .filter(([, f]) => f.name === "south")
  .map(([k]) => Number(k.split(",")[0]))
  .sort((a, b) => a - b);
const E = southXs.length ? southXs[Math.floor(southXs.length / 2)] : null;

// Storey lines sit at ROOF - 5k, so every tier stands on the one below it.
const isLine = (y) => y <= ROOF && (ROOF - y) % STOREY === 0;

// Entrance layout by bay: pilasters at E-1 and E+2, door at E, open bay at E+1, canopy E-1..E+2.
const inEntrance = (f, bay) => E !== null && f.name === "south" && bay >= E - 1 && bay <= E + 2;

const g = new Voxels([W, H, D]);

// Pass 1: foundation, floors, facade bands, entrance, roof and penthouse.
for (const [x, z, gr] of cells) {
  const gy = Math.min(gr, ROOF - 1);
  const f = face.get(key(x, z));
  const edge = !!f;
  const d = dist.get(key(x, z)) ?? 0;

  // Foundation fills solid up to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  // Ground-level floor and everything above it, up to the roof.
  for (let y = gy; y <= ROOF; y++) {
    if (y === gy) {
      g.set(x, y, z, edge ? "polished_granite" : "smooth_stone");
      continue;
    }
    if (y === ROOF) {
      g.set(x, y, z, edge ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    if (isLine(y)) {
      g.set(x, y, z, edge ? "light_gray_concrete" : "smooth_stone");
      continue;
    }

    // Band between two storey lines.
    const k = Math.floor((ROOF - y) / STOREY) + 1;
    const a = ROOF - STOREY * k;
    const b = a + STOREY;
    const p = y - a;
    if (!edge) continue; // interior air, behind the glass

    const bay = f.bay;
    const isGround = a <= gy;

    if (isGround) {
      if (inEntrance(f, bay)) {
        if (y === gy + 3) {
          g.set(x, y, z, "smooth_stone");                       // canopy
        } else if (y <= gy + 2) {
          if (bay === E) {
            // Door: lower and upper halves, facing out of the south wall.
            if (y === gy + 1) {
              g.set(x, y, z, "dark_oak_door", {
                facing: "south", half: "lower", hinge: "left",
                open: "false", powered: "false",
              });
            } else {
              g.set(x, y, z, "dark_oak_door", {
                facing: "south", half: "upper", hinge: "left",
                open: "false", powered: "false",
              });
            }
          } else if (bay === E + 1) {
            // Open bay: lantern hangs from the canopy.
            if (y === gy + 2) g.set(x, y, z, "lantern", { hanging: "true" });
          } else {
            g.set(x, y, z, "smooth_stone");                       // pilaster
          }
        } else {
          g.set(x, y, z, "white_concrete");
        }
        continue;
      }
      // Shopfront storey: glass with white mullions, darker spandrel at the top.
      if (y === b - 1) g.set(x, y, z, "light_gray_concrete");
      else if (bay % 3 === 0) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "light_blue_stained_glass");
    } else {
      // Upper office storeys: lintel and sill bands, mullions every third bay, glass between.
      if (p === 1) g.set(x, y, z, "light_gray_concrete");
      else if (p === 4) g.set(x, y, z, "white_concrete");
      else if (bay % 3 === 0) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "light_blue_stained_glass");
    }
  }

  // Parapet and cap on the exterior.
  if (edge) {
    g.set(x, ROOF + 1, z, "white_concrete");
    g.set(x, ROOF + 2, z, "smooth_quartz");
  }

  // Mechanical penthouse: louvred ring five cells in from the edge, solid cap over the core.
  if (d === 5) {
    for (let y = ROOF + 1; y <= ROOF + 4; y++) {
      if (y === ROOF + 4) g.set(x, y, z, "white_concrete");
      else if ((y === ROOF + 2 || y === ROOF + 3) && (x + z) % 2 === 0) g.set(x, y, z, "iron_bars");
      else g.set(x, y, z, "light_gray_concrete");
    }
    g.set(x, ROOF + 5, z, "smooth_stone");
  } else if (d > 5) {
    g.set(x, ROOF + 5, z, "smooth_stone");
  }
}

// Pass 2: warm light behind some windows, placed in the interior cell inside each lit window.
for (const [x, z, gr] of cells) {
  const f = face.get(key(x, z));
  if (!f) continue;
  const gy = Math.min(gr, ROOF - 1);
  const bay = f.bay;
  if (bay % 3 === 0) continue;
  const ix = x - f.dx, iz = z - f.dz;
  if (!has(ix, iz) || face.has(key(ix, iz))) continue;
  if (inEntrance(f, bay)) continue;

  for (let y = gy + 2; y < ROOF; y++) {
    if (isLine(y)) continue;
    const k = Math.floor((ROOF - y) / STOREY) + 1;
    const a = ROOF - STOREY * k;
    const p = y - a;
    const isGround = a <= gy;
    const lit = ((x * 7 + z * 5 + y) % 5) === 0;
    if (!lit) continue;
    if (isGround ? y === gy + 2 : p === 2) g.set(ix, y, iz, "glowstone");
  }
}

// Mast and beacon on the highest core cell.
let top = null;
for (const [k, d] of dist) if (!top || d > top.d) top = { k, d };
if (top && top.d > 5) {
  const [tx, tz] = top.k.split(",").map(Number);
  for (let y = ROOF + 6; y <= ROOF + 9; y++) g.set(tx, y, tz, "iron_bars");
  g.set(tx, ROOF + 10, tz, "lantern", { hanging: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
