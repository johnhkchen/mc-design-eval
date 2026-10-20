import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001540.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001540.nbt";
const W = 29, H = 26, D = 38;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const map = new Map();
for (const c of cells) map.set(`${c[0]},${c[1]}`, { g: Math.round(c[2]), r: Math.round(c[3]) });
const has = (x, z) => map.has(`${x},${z}`);
const at = (x, z) => map.get(`${x},${z}`);

// Global base (lowest ground)
let B = Infinity;
for (const v of map.values()) B = Math.min(B, v.g);

// One flat roof tier for the whole building (median of lidar roofs, clamped)
const roofs = [...map.values()].map(v => v.r).sort((a, b) => a - b);
const ROOF_CAP = H - 4;
const T = Math.min(Math.max(roofs[Math.floor(roofs.length / 2)], B + 8), ROOF_CAP);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// ---- bounds and front (street) side ----------------------------------------
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of map.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const frontXs = [];
for (const k of map.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (z === minZ) frontXs.push(x);
}
frontXs.sort((a, b) => a - b);
const xc = frontXs[Math.floor(frontXs.length / 2)];

// ---- massing ----------------------------------------------------------------
for (const [key, cell] of map) {
  const [x, z] = key.split(",").map(Number);
  const gr = cell.g;
  const exposedX = !has(x - 1, z) || !has(x + 1, z);
  const exposedZ = !has(x, z - 1) || !has(x, z + 1);
  const edge = exposedX || exposedZ;
  const corner = exposedX && exposedZ;
  const isFront = z === minZ && exposedZ;

  // foundation from y0 up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y < T; y++) {
    const rel = (y - B) % 3;
    const floorLine = y > B && rel === 0;

    if (!edge) {
      // interior: floor slabs and roof only, air between
      if (y === gr || y === T - 1 || floorLine) put(x, y, z, "smooth_stone");
      continue;
    }

    // ---- facade cell ----
    if (y === T - 1) { put(x, y, z, "smooth_quartz"); continue; }   // cornice
    if (y === gr) { put(x, y, z, "polished_granite"); continue; }   // plinth
    if (floorLine) { put(x, y, z, "smooth_quartz"); continue; }     // string course

    if (corner) { put(x, y, z, "smooth_quartz"); continue; }        // quoins

    const i = exposedZ && !exposedX ? x : z;
    const bay = ((i % 4) + 4) % 4;
    const isPier = bay === 0 || bay === 3;

    // entrance on the street face
    if (isFront) {
      const dy = y - gr;
      if (dy === 1 || dy === 2) {
        if (x === xc) {
          put(x, y, z, "dark_oak_door", {
            facing: "north",
            half: dy === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
          continue;
        }
        if (Math.abs(x - xc) === 1) { put(x, y, z, "smooth_quartz"); continue; }
      }
      if (y === gr + 3 && Math.abs(x - xc) <= 1) { put(x, y, z, "smooth_quartz"); continue; } // lintel
    }

    const windowRow = y > gr && rel !== 0 && y < T - 1;
    if (windowRow && !isPier) {
      const warm = ((x * 7 + z * 3 + y) % 11 === 0);
      put(x, y, z, warm ? "orange_stained_glass_pane" : "glass_pane");
      continue;
    }

    put(x, y, z, "bricks");
  }

  // parapet on facade cells, one flat line
  if (edge) put(x, T, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// ---- roof penthouse on the same tier ----------------------------------------
const cx = Math.round((minX + maxX) / 2), cz = Math.round((minZ + maxZ) / 2);
for (let x = cx - 4; x <= cx + 4; x++) {
  for (let z = cz - 5; z <= cz + 5; z++) {
    if (!has(x, z)) continue;
    const ring = x === cx - 4 || x === cx + 4 || z === cz - 5 || z === cz + 5;
    for (let y = T; y <= T + 2; y++) {
      if (ring) {
        if (y === T + 2) put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
        else put(x, y, z, "bricks");
      } else if (y === T) {
        put(x, y, z, "smooth_stone");
      }
    }
  }
}

g.save(OUT);
