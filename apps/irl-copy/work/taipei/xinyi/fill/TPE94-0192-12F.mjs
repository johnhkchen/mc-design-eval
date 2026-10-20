import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/TPE94-0192-12F.cells.json`, "utf8"));

// 12 storeys of 5 blocks; roof surface at 59 above the lowest ground.
const W = 45, H = 71, D = 87;
const ROOF = 59;
const TOP = ROOF - 1;     // highest solid roof block (y 58)
const STORY = 5;

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const inside = (x, z) => ground.has(key(x, z));
const perim = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// Entrances centred on the long sides (z min/max) and short sides (x min/max)
const isEntrance = (x, z) =>
  ((z === minZ || z === maxZ) && x >= 20 && x <= 24) ||
  ((x === minX || x === maxX) && z >= 41 && z <= 45);
const isEntranceCore = (x, z) =>
  ((z === minZ || z === maxZ) && x === 22) ||
  ((x === minX || x === maxX) && z === 43);
const isCorner = (x, z) =>
  (x === minX || x === maxX) && (z === minZ || z === maxZ);

// 1. Foundation, base, walls, floor slabs, cornice and roof deck
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const isPerim = perim(x, z);
  const ent = isPerim && isEntrance(x, z);
  const core = isPerim && isEntranceCore(x, z);

  for (let y = gr; y <= TOP; y++) {
    let b = null;

    if (y === TOP) {
      b = "smooth_stone";                              // roof deck / parapet cap
    } else if (y === TOP - 1 && isPerim) {
      b = "quartz_block";                              // cornice band
    } else if (isPerim) {
      if (y < gr + STORY) {
        // Ground floor: polished granite base, shopfront glazing, framed entrance
        if (y === gr) b = "polished_granite";
        else if (ent) {
          if (y === gr + 3) b = "smooth_stone";        // canopy over entrance
          else if (core) b = "glass";
          else b = "glass";
        } else if (y === gr + STORY - 1) b = "light_gray_concrete";
        else if (y % STORY === 0) b = "light_gray_concrete";
        else b = ((x + z) % 3 === 0) ? "white_concrete" : "light_blue_stained_glass";
      } else if (y % STORY === 0) {
        b = "light_gray_concrete";                     // storey line / floor band
      } else if (y % STORY === STORY - 1) {
        b = "white_concrete";                          // spandrel
      } else if (isCorner(x, z) || (x + z) % 6 === 0) {
        b = "quartz_block";                            // relief fins every 6 cells and at corners
      } else if ((x + z) % 3 === 0) {
        b = "white_concrete";                          // mullions
      } else {
        b = "light_blue_stained_glass";                // window
      }
    } else {
      if (y % STORY === 0) b = "light_gray_concrete";  // interior floor slab, air otherwise
    }

    if (b) g.set(x, y, z, b);
  }

  // Entrance frame: quartz jambs either side of the glazing, and a hanging lantern under the canopy
  if (ent && !core) {
    // jambs at the outer edge of the entrance zone are the fins (handled above)
  }
  if (core) {
    g.set(x, gr + 2, z, "glass");
    g.set(x, gr + 2, z, "glass");
    // lantern hangs from the canopy, just inside the glazing
    const dx = (x === minX) ? 1 : (x === maxX) ? -1 : 0;
    const dz = (z === minZ) ? 1 : (z === maxZ) ? -1 : 0;
    const ix = x + dx, iz = z + dz;
    if (inside(ix, iz) && !perim(ix, iz)) {
      g.set(ix, gr + 2, iz, "lantern", { hanging: "true" });
    }
  }
}

// 2. Warm glow behind some perimeter windows (interior side), sparse
for (const [x, z, gr] of cells) {
  if (!perim(x, z)) continue;
  if (isEntrance(x, z)) continue;

  let dx = 0, dz = 0;
  if (!inside(x - 1, z)) dx = 1; else if (!inside(x + 1, z)) dx = -1;
  if (!inside(x, z - 1)) dz = 1; else if (!inside(x, z + 1)) dz = -1;
  if (dx === 0 && dz === 0) continue;
  const ix = x + dx, iz = z + dz;
  if (!inside(ix, iz) || perim(ix, iz)) continue;

  for (let y = gr + STORY + 1; y < TOP - 1; y++) {
    const band = y % STORY;
    if (band === 0 || band === STORY - 1) continue;
    if ((x + z) % 3 === 0 || (x + z) % 6 === 0) continue;
    if ((x * 7 + y * 3 + z) % 17 !== 0) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// 3. Mechanical penthouse, set back from the roof edge, with louvre band
const PH = { x0: 10, x1: 34, z0: 22, z1: 64, top: ROOF + 4 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!inside(x, z)) continue;
    const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    for (let y = ROOF; y <= PH.top - 1; y++) {
      if (edge) g.set(x, y, z, "white_concrete");
      else if (y === ROOF + 2) g.set(x, y, z, "light_gray_concrete");
    }
    g.set(x, PH.top, z, "smooth_stone");
  }
}

g.save(`${DIR}/TPE94-0192-12F.nbt`);
