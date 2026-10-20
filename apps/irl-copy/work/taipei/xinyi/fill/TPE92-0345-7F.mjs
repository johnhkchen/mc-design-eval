import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE92-0345-7F: Xinyi office block, built 2003, 31 x 18 footprint, roof 35 blocks above lowest ground.
// Read as a seven-storey (5 blocks each) glass curtain-wall office with a granite base,
// white-concrete mullions and corner piers, a quartz parapet, and a roof plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE92-0345-7F";
const W = 31, H = 47, D = 18;
const ROOF = 35;      // roof slab top, from lidar record
const STOREY = 5;     // blocks per storey
const PARAPET_TOP = 37;
const CAP = 38;       // parapet cap slab (bottom half)
const PLANT_TOP = 38;
const PLANT_CAP = 39; // plant box cap slab (bottom half)

// ---- read footprint ---------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? raw.footprint ?? []);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const c of list) {
  let x, z, gr;
  if (Array.isArray(c)) [x, z, gr] = c;
  else { x = c.x; z = c.z; gr = c.ground ?? c.y ?? c[2] ?? 0; }
  if (!Number.isInteger(x) || !Number.isInteger(z)) continue;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), Math.max(0, Math.round(Number(gr) || 0)));
}

// y 0 is the lowest ground under the footprint
const minG = Math.min(...ground.values());
for (const [k, v] of ground) ground.set(k, v - minG);

const has = (x, z) => ground.has(key(x, z));
const missing = (x, z, dx, dz) => !has(x + dx, z + dz);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = Math.floor((minX + maxX) / 2); // entrance axis

const isPerim = (x, z) =>
  missing(x, z, -1, 0) || missing(x, z, 1, 0) || missing(x, z, 0, -1) || missing(x, z, 0, 1);
const isCorner = (x, z) =>
  (missing(x, z, -1, 0) || missing(x, z, 1, 0)) && (missing(x, z, 0, -1) || missing(x, z, 0, 1));

const g = new Voxels([W, H, D]);

const paneProps = (alongX) =>
  alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const doorProps = (half) => ({
  facing: "north", half, hinge: "left", open: "false", powered: "false",
});

// ---- main pass: foundation, floors, facade, glow -----------------------------
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const ge = gr; // this cell's ground (already shifted so min is 0)

  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < ge; y++) g.set(x, y, z, "stone_bricks");

  const perim = isPerim(x, z);
  const corner = isCorner(x, z);
  const alongX = missing(x, z, 0, -1) || missing(x, z, 0, 1); // face runs along x
  const idx = alongX ? x - minX : z - minZ;
  const entranceFace = perim && !corner && alongX && z === minZ;
  const nearEntrance = entranceFace && Math.abs(x - cx) <= 2;

  // storey base for a given y: ground, or the last 5-block floor line above it
  const baseOf = (y) => {
    let b = ge;
    for (let m = STOREY; m <= y; m += STOREY) if (m > ge) b = m;
    return b;
  };
  const isFloor = (y) => y === ge || (y > ge && y % STOREY === 0 && y < ROOF);

  for (let y = ge; y <= ROOF; y++) {
    // roof slab
    if (y === ROOF) {
      g.set(x, y, z, perim ? (corner ? "white_concrete" : "smooth_quartz") : "light_gray_concrete");
      continue;
    }

    // floor slabs at every storey line (solid under all cells)
    if (isFloor(y)) {
      if (!perim) {
        g.set(x, y, z, "light_gray_concrete");
      } else if (corner && y !== ge) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, y === ge ? "polished_granite" : "smooth_quartz");
      }
      continue;
    }

    if (!perim) continue; // air gap behind the glass

    if (corner) { g.set(x, y, z, "white_concrete"); continue; }

    const ly = y - baseOf(y);

    // entrance lintel: granite band over the lobby, spanning the entrance bay
    if (ly === 4 && nearEntrance) { g.set(x, y, z, "polished_granite"); continue; }

    if (ly === 4) { g.set(x, y, z, "light_gray_concrete"); continue; } // spandrel
    if (ly < 1 || ly > 3) continue;

    // window bays
    if (entranceFace && Math.abs(x - cx) <= 1) {
      if (x === cx && ly === 1) {
        g.set(x, y, z, "iron_door", doorProps("lower"));
      } else if (x === cx && ly === 2) {
        g.set(x, y, z, "iron_door", doorProps("upper"));
      } else {
        g.set(x, y, z, "glass");
      }
      continue;
    }

    // entrance jambs: white concrete either side of the lobby glass
    if (nearEntrance && Math.abs(x - cx) === 2) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    if (idx % 3 === 0) {
      g.set(x, y, z, "white_concrete"); // mullion
    } else {
      g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(alongX));
    }

    // warm light just behind some glass, in the interior cell
    if (ly === 2 && idx % 6 === 1) {
      const dxIn = missing(x, z, -1, 0) ? 1 : (missing(x, z, 1, 0) ? -1 : 0);
      const dzIn = missing(x, z, 0, -1) ? 1 : (missing(x, z, 0, 1) ? -1 : 0);
      const ix = x + dxIn, iz = z + dzIn;
      if (has(ix, iz) && !isPerim(ix, iz)) g.set(ix, y, iz, "glowstone");
    }
  }
}

// ---- parapet and cap over the perimeter -------------------------------------
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const corner = isCorner(x, z);
  for (let y = ROOF + 1; y <= PARAPET_TOP; y++) {
    g.set(x, y, z, corner ? "white_concrete" : "smooth_quartz");
  }
  g.set(x, CAP, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// ---- roof plant box, inset from the parapet ----------------------------------
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (isPerim(x, z)) continue;
  if (x < 7 || x > 23 || z < 5 || z > 12) continue;
  g.set(x, ROOF + 1, z, "gray_concrete");
  g.set(x, ROOF + 2, z, "light_gray_concrete");
  g.set(x, PLANT_TOP, z, "light_gray_concrete");
  g.set(x, PLANT_CAP, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
