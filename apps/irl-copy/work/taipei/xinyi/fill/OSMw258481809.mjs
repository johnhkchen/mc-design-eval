import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 世貿新城大廈 莊敬: late-1990s Xinyi commercial/office tower, 11 storeys of 5 blocks,
// full-width podium with ground-floor shopfronts, two setback tiers, bronze/blue tinted
// curtain-wall glazing on light cream concrete with quartz mullions and a roof plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw258481809";
const W = 78, H = 66, D = 34;
const TOP = 54;                 // roof slab sits at y = 54
const LEVELS = [0, 25, 40];     // tier base heights (multiples of the 5-block storey)
const INSET = [[0, 0], [4, 3], [10, 7]]; // setback inset per tier (x, z)
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

// Main entrance: a 5-cell recessed bay on the south face, centred on x = 39.
const ENT_X0 = 37, ENT_X1 = 41, ENT_DOOR_L = 39, ENT_DOOR_R = 40;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const GROUND = new Map();
for (const [x, z, gr] of cells) GROUND.set(`${x},${z}`, Math.max(0, Math.round(gr)));

const inFp = (x, z) => GROUND.has(`${x},${z}`);
const groundOf = (x, z) => GROUND.get(`${x},${z}`);
const tierOf = (y) => (y < LEVELS[1] ? 0 : y < LEVELS[2] ? 1 : 2);

function inRegion(t, x, z) {
  if (!inFp(x, z)) return false;
  const [ix, iz] = INSET[t];
  return x >= ix && x < W - ix && z >= iz && z < D - iz;
}

function outDirs(t, x, z) {
  const out = [];
  for (const [dx, dz, name] of DIRS) {
    if (!inRegion(t, x + dx, z + dz)) out.push([dx, dz, name]);
  }
  return out;
}

const isEdge = (t, x, z) => inRegion(t, x, z) && outDirs(t, x, z).length > 0;

// Plant box on the roof, centred on the tier-2 plate.
const inBox = (x, z) => x >= 22 && x <= 55 && z >= 12 && z <= 21;

const glassFor = (t) => (t === 2 ? "cyan_stained_glass" : "light_blue_stained_glass");

const isEntryBay = (x, z, dz) => dz === 1 && z === D - 1 && x >= ENT_X0 && x <= ENT_X1;

function blockAt(x, z, y, g) {
  // Ground floor plinth on every footprint cell.
  if (y === g) return ["polished_andesite"];

  // Roof, parapet, plant box, lightning rod.
  if (y >= TOP) {
    if (y === TOP) return inRegion(2, x, z) ? ["gray_concrete"] : null;
    if (x === 38 && z === 16 && y >= TOP + 4 && y <= TOP + 7) {
      return ["lightning_rod", { facing: "up", powered: "false", waterlogged: "false" }];
    }
    if (y === TOP + 1 && inRegion(2, x, z) && isEdge(2, x, z)) return ["smooth_quartz"];
    if (y <= TOP + 3 && inBox(x, z)) return ["light_gray_concrete"];
    return null;
  }

  // Floor slabs: a slab at y covers the region of the tier below, so setback
  // terraces get their own roof slab and nothing floats.
  if (y % 5 === 0 && y > g && inRegion(tierOf(y - 1), x, z)) {
    return ["light_gray_concrete"];
  }

  // Terrace parapets on each lower tier's exposed edge.
  if (y === LEVELS[1] + 1 || y === LEVELS[2] + 1) {
    const tp = tierOf(y) - 1;
    if (inRegion(tp, x, z) && !inRegion(tp + 1, x, z) && isEdge(tp, x, z)) {
      return ["smooth_quartz"];
    }
  }

  // Facades.
  const t = tierOf(y);
  if (!inRegion(t, x, z) || !isEdge(t, x, z)) return null;

  const [dx, dz] = outDirs(t, x, z)[0];
  const idx = dz !== 0 ? x : z; // position along the face

  // Ground-floor shopfront band; rel = height above this cell's ground.
  if (t === 0 && y < g + 5) {
    const rel = y - g;
    if (rel === 4) return ["smooth_quartz"];

    if (isEntryBay(x, z, dz)) {
      if (rel === 1 || rel === 2) {
        if (x === ENT_DOOR_L || x === ENT_DOOR_R) {
          return ["iron_door", {
            facing: "south",
            half: rel === 1 ? "lower" : "upper",
            hinge: x === ENT_DOOR_L ? "left" : "right",
            open: "false",
            powered: "false",
          }];
        }
        // Glass flanking the doors, framed in quartz.
        return x === ENT_X0 || x === ENT_X1
          ? ["smooth_quartz"]
          : ["light_blue_stained_glass"];
      }
      // Lintel over the bay.
      return ["smooth_quartz"];
    }

    return idx % 3 === 0 ? ["smooth_quartz"] : ["light_blue_stained_glass"];
  }

  // Upper storeys: 5-block rhythm.
  const r = y % 5;
  if (r === 0) return ["light_gray_concrete"];
  if (r === 4) return ["white_concrete"];        // spandrel belt under each slab
  if (idx % 3 === 0) return ["smooth_quartz"];   // mullions
  return [glassFor(t)];                          // glazing
}

const vox = new Voxels([W, H, D]);

// Pass 1: foundations, then the building shell.
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inFp(x, z)) continue;
    const g = Math.min(groundOf(x, z), H - 1);
    for (let y = 0; y < g; y++) vox.set(x, y, z, "stone_bricks");
    for (let y = g; y < H; y++) {
      const b = blockAt(x, z, y, g);
      if (b) vox.set(x, y, z, b[0], b[1]);
    }
  }
}

// Pass 2: entrance lanterns inside the bay, and warm light behind some glass.
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inFp(x, z)) continue;
    const g = groundOf(x, z);

    // Lanterns standing on the lobby floor either side of the doors.
    if (z === D - 2 && (x === 38 || x === 41) && inRegion(0, x, z)) {
      vox.set(x, g + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    }

    for (let y = g + 1; y < TOP; y++) {
      const t = tierOf(y);
      if (!inRegion(t, x, z) || !isEdge(t, x, z)) continue;
      const r = y % 5;
      if (t === 0 && y < g + 5) continue;
      if (r < 1 || r > 3) continue;
      const [dx, dz] = outDirs(t, x, z)[0];
      const idx = dz !== 0 ? x : z;
      if (idx % 3 === 0) continue;
      if (((idx * 5 + y * 7) % 17) !== 0) continue;
      const ix = x - dx, iz = z - dz;
      if (inRegion(t, ix, iz) && !isEdge(t, ix, iz)) {
        vox.set(ix, y, iz, "glowstone");
      }
    }
  }
}

vox.save(`${DIR}/${ID}.nbt`);
