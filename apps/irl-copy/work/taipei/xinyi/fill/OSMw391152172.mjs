import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw391152172";
const W = 52, H = 90, D = 16;
const ROOF_Y = 78;            // roof height above the lowest ground (lidar record)
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => (p ? g.set(x, y, z, b, p) : g.set(x, y, z, b));

const cellG = new Map();
for (const [x, z, gr] of cells) cellG.set(`${x},${z}`, gr);
const has = (x, z) => cellG.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

// Residential tower, c.1990s Xinyi: quartz-clad storeys, light-blue glass,
// polished andesite base, stone foundation, mechanical penthouse on the roof.
for (const [x, z, gr] of cells) {
  const per = isPerim(x, z);
  const longFace = !has(x, z - 1) || !has(x, z + 1);
  const u = longFace ? x : z;
  const uMax = longFace ? W - 1 : D - 1;
  const corner = u <= 1 || u >= uMax - 1;   // pilaster columns at the corners
  let inw = [0, 0];
  if (per) {
    if (!has(x, z - 1)) inw = [0, 1];
    else if (!has(x, z + 1)) inw = [0, -1];
    else if (!has(x - 1, z)) inw = [1, 0];
    else inw = [-1, 0];
  }
  const lobby = per && longFace && inw[1] === -1 && x >= 22 && x <= 29;
  const firstLine = minG + 5 * Math.ceil((gr - minG + 1) / 5);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  for (let y = gr; y <= ROOF_Y; y++) {
    const rel = (((y - minG) % 5) + 5) % 5;
    const s = Math.floor((y - minG) / 5);

    if (!per) {
      if (y === ROOF_Y - 1) put(x, y, z, "smooth_quartz");                 // roof deck
      else if (y === ROOF_Y) continue;
      else if (y === gr || rel === 0) put(x, y, z, "light_gray_concrete"); // floor slab
      else if (lobby === false && isLobbyInterior(x, z) && y < firstLine - 1 && y > gr) {
        // lobby interior: hanging lanterns under the canopy
        if ((x === 23 || x === 28) && z === D - 2 && y === firstLine - 2) {
          put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        }
      }
      continue;
    }

    // Perimeter
    if (y === ROOF_Y) { put(x, y, z, "quartz_block"); continue; }          // parapet
    if (y === ROOF_Y - 1) { put(x, y, z, "smooth_quartz"); continue; }     // roof deck
    if (y === ROOF_Y - 2) { put(x, y, z, "smooth_quartz"); continue; }     // cornice

    if (y < firstLine) {                                                   // ground storey
      if (y === gr) { put(x, y, z, "polished_andesite"); continue; }       // base course
      if (lobby && (x === 25 || x === 26) && y <= gr + 1) {
        const half = y === gr ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === firstLine - 1) { put(x, y, z, "smooth_quartz"); continue; } // transom / canopy line
      if (lobby) { put(x, y, z, "tinted_glass"); continue; }
      put(x, y, z, u % 3 === 0 || corner ? "quartz_pillar" : "tinted_glass");
      continue;
    }

    if (rel === 0) { put(x, y, z, "smooth_quartz"); continue; }           // storey line
    if (rel === 4) { put(x, y, z, "quartz_block"); continue; }            // spandrel
    if (corner || u % 3 === 0) { put(x, y, z, "quartz_pillar"); continue; } // pilaster / mullion

    // Window: glass, with a warm glowstone behind some panes
    put(x, y, z, "light_blue_stained_glass");
    const lamp = rel === 2 && (u + s * 2) % 6 === 4;
    if (lamp && has(x + inw[0], z + inw[1])) {
      put(x + inw[0], y, z + inw[1], "glowstone");
    }
  }
}

// Lobby interior: the cells behind the south entrance glazing
function isLobbyInterior(x, z) {
  return z === D - 2 && x >= 22 && x <= 29 && has(x, z);
}

// Mechanical penthouse, set back on the roof deck
const PH = { x0: 14, x1: 30, z0: 4, z1: 11 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!has(x, z) || isPerim(x, z)) continue;
    put(x, ROOF_Y, z, "light_gray_concrete");                       // plinth
    const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    for (let y = ROOF_Y + 1; y <= ROOF_Y + 2; y++) {
      if (edge) {
        if (y === ROOF_Y + 1 && (x + z) % 2 === 0) put(x, y, z, "iron_bars");   // louvres
        else put(x, y, z, "light_gray_concrete");
      }
    }
    put(x, ROOF_Y + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
