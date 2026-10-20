import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE103-0263: 2014 low-rise commercial/residential block, Xinyi district.
// Two storeys (ground shopfront + upper storey) on a granite base, white
// quartz-tile facade, belt course at the storey line, quartz roof slab,
// flush roof deck inside a raised parapet, and roof-top AC plant.

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/TPE103-0263.cells.json`, "utf8"));

const W = 5, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Absolute storey lines (y 0 = lowest ground under the footprint).
const BELT = 5;     // top of ground storey / second-floor line
const ROOF = 10;    // roof slab layer
const DECK = 11;    // flush roof deck (interior) / wall cap (shell)
const PARAPET = 12; // parapet cap on shell cells

const gm = new Map();
for (const [x, z, gr] of cells) gm.set(`${x},${z}`, gr);
const has = (x, z) => gm.has(`${x},${z}`);

const isShell = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const paneX = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneZ = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, g0] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");

  const exposedX = !has(x - 1, z) || !has(x + 1, z);
  const exposedZ = !has(x, z - 1) || !has(x, z + 1);
  const shell = exposedX || exposedZ;
  const corner = exposedX && exposedZ;
  const xFace = exposedX && !exposedZ;   // long street / rear facades
  const zFace = exposedZ && !exposedX;   // narrow ends
  const westFace = !has(x - 1, z);
  const eastFace = !has(x + 1, z);

  if (g0 > PARAPET) continue;

  if (!shell) {
    // Interior: floor slabs and a flush roof deck; air between (no interiors modelled).
    if (g0 <= 11) put(x, g0, z, "smooth_stone");
    if (BELT >= g0) put(x, BELT, z, "smooth_stone");
    if (ROOF >= g0) put(x, ROOF, z, "smooth_stone");
    if (DECK >= g0) put(x, DECK, z, "smooth_stone");
    continue;
  }

  for (let y = g0; y <= PARAPET; y++) {
    // Structural lines shared by every shell cell.
    if (y === g0) { put(x, y, z, "polished_andesite"); continue; }   // granite base course
    if (y === BELT) { put(x, y, z, "smooth_quartz"); continue; }     // belt course
    if (y === ROOF) { put(x, y, z, "smooth_quartz"); continue; }     // roof slab edge
    if (y === DECK) { put(x, y, z, "white_concrete"); continue; }    // wall above roof
    if (y === PARAPET) { put(x, y, z, "smooth_quartz"); continue; }  // parapet cap

    if (corner) { put(x, y, z, "white_concrete"); continue; }

    // Position along the facade (z for long faces, x for narrow ends).
    const t = xFace ? z : x;
    const inward = xFace
      ? (westFace ? [x + 1, z] : [x - 1, z])
      : (!has(x, z - 1) ? [x, z + 1] : [x, z - 1]);
    const inwardInterior = has(inward[0], inward[1]) && !isShell(inward[0], inward[1]);
    const mullion = t % 3 === 0;

    if (y < BELT) {
      // Ground storey: shopfront band between granite base and transom.
      if (y === 4) { put(x, y, z, "white_concrete"); continue; }   // transom
      if (zFace) {
        if (x === 2 && y >= g0 + 1 && y <= 3) {
          put(x, y, z, "light_blue_stained_glass_pane", paneZ);
          if (y === g0 + 2 && inwardInterior) put(inward[0], y, inward[1], "shroomlight");
        } else {
          put(x, y, z, "white_concrete");
        }
        continue;
      }
      // Long facade: entrance zone at the middle of the street face.
      const entranceZone = xFace && t >= 7 && t <= 9 && (westFace || eastFace);
      if (entranceZone && y >= g0 + 1 && y <= g0 + 2) {
        const facing = westFace ? "west" : "east";
        if (t === 8 && g0 <= 2) {
          const half = y === g0 + 1 ? "lower" : "upper";
          put(x, y, z, "oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
        } else {
          put(x, y, z, "smooth_quartz");
        }
        continue;
      }
      if (y >= g0 + 1 && y <= 3) {
        if (mullion) put(x, y, z, "stone_bricks");
        else {
          put(x, y, z, "light_blue_stained_glass_pane", paneX);
          if (y === g0 + 2 && t % 6 === 4 && inwardInterior) put(inward[0], y, inward[1], "shroomlight");
        }
        continue;
      }
      put(x, y, z, "white_concrete");
      continue;
    }

    // Upper storey (above belt course, below roof slab).
    if (y === 6) { put(x, y, z, "smooth_quartz"); continue; }   // sill
    if (y === 9) { put(x, y, z, "white_concrete"); continue; }  // header
    if (zFace) {
      if (x === 2) {
        put(x, y, z, "light_blue_stained_glass_pane", paneZ);
        if (y === 7 && inwardInterior) put(inward[0], y, inward[1], "glowstone");
      } else {
        put(x, y, z, "white_concrete");
      }
      continue;
    }
    if (mullion) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, "light_blue_stained_glass_pane", paneX);
    if (y === 7 && t % 6 === 1 && inwardInterior) put(inward[0], y, inward[1], "glowstone");
  }
}

// Roof-top plant on interior roof cells: two AC units and a small mechanical box.
for (const [x, z, g0] of cells) {
  if (isShell(x, z) || g0 > DECK) continue;
  if (x === 2 && (z === 4 || z === 12)) {
    put(x, DECK + 1, z, "light_gray_concrete");
    put(x, DECK + 2, z, "light_gray_concrete");
  }
  if (x === 1 && z === 8) put(x, DECK + 1, z, "iron_block");
}

g.save(`${dir}/TPE103-0263.nbt`);
