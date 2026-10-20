import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 37 x 11 footprint, roof about 21 blocks above lowest ground.
// Reading: a four-storey Taipei commercial block of the 1980s to 1990s.
// Pale quartz tile facade, piers every three cells, blue-green glass,
// shopfront on the ground floor, parapet and water tanks on the roof.

const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw662834766.cells.json", "utf8")
);

const W = 37, H = 33, D = 11;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
let F0 = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  if (gr < F0) F0 = gr;
}
if (!Number.isFinite(F0)) F0 = 0;

const inside = (x, z) => ground.has(key(x, z));
const perim = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

const TOP = F0 + 21; // parapet top
const safeSet = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Door: on the lowest-z perimeter row, the cell nearest the middle x.
let doorCell = null;
{
  let minZ = Infinity;
  for (const [x, z] of cells) if (z < minZ) minZ = z;
  const xs = cells.filter(([x, z]) => z === minZ && perim(x, z)).map(([x]) => x).sort((a, b) => a - b);
  if (xs.length) {
    const mid = xs[Math.floor(xs.length / 2)];
    doorCell = { x: mid, z: minZ };
  }
}

// Pass 1: foundation, storeys, facade, roof edge.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) safeSet(x, y, z, "stone_bricks");

  const p = perim(x, z);
  for (let y = Math.max(gr, F0); y <= TOP; y++) {
    const rel = y - F0;
    const k = Math.floor(rel / 5);
    const r = rel % 5;

    if (y === TOP) {
      if (p) safeSet(x, y, z, "smooth_quartz");
      continue;
    }
    if (y === TOP - 1) {
      // cornice band and roof slab
      if (p) safeSet(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else safeSet(x, y, z, "light_gray_concrete");
      continue;
    }

    if (r === 0) {
      // floor slab level (storey line)
      if (k === 0 && p) safeSet(x, y, z, "stone_bricks");
      else if (p) safeSet(x, y, z, "white_concrete");
      else safeSet(x, y, z, "light_gray_concrete");
      continue;
    }

    if (!p) continue; // interior air gap

    if (r === 4) {
      // spandrel between windows and next floor
      safeSet(x, y, z, "smooth_quartz");
      continue;
    }

    // r = 1..3: window band
    const isDoor = doorCell && doorCell.x === x && doorCell.z === z && k === 0;
    if (isDoor) {
      if (r === 1) {
        safeSet(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (r === 2) {
        safeSet(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        safeSet(x, y, z, "stone_bricks");
      }
      continue;
    }

    const isPier = (x + z) % 3 === 0 || x === 0 || x === W - 1;
    if (isPier) safeSet(x, y, z, "quartz_pillar");
    else safeSet(x, y, z, "light_blue_stained_glass");
  }
}

// Pass 2: warm lights behind some windows (glowstone in the air gap).
for (const [x, z, gr] of cells) {
  if (!perim(x, z)) continue;
  let dx = 0, dz = 0;
  if (!inside(x - 1, z)) dx = 1;
  else if (!inside(x + 1, z)) dx = -1;
  if (!inside(x, z - 1)) dz = 1;
  else if (!inside(x, z + 1)) dz = -1;
  if (dx === 0 && dz === 0) continue;
  if (dx !== 0 && dz !== 0) dz = 0; // corner: step inward on one axis only
  const ix = x + dx, iz = z + dz;
  if (!inside(ix, iz) || perim(ix, iz)) continue;
  for (let k = 0; k < 4; k++) {
    const y = F0 + 5 * k + 2;
    if (y < gr || y >= TOP - 1) continue;
    if (((x * 7 + z * 5 + k * 3) % 9) === 0) {
      safeSet(ix, y, iz, "glowstone");
    }
  }
}

// Pass 3: roof equipment on interior cells, and a short antenna mast.
if (TOP + 4 < H) {
  const boxes = [[4, 7], [29, 32]];
  for (const [x0, x1] of boxes) {
    for (let x = x0; x <= x1; x++) {
      for (let z = 3; z <= 7; z++) {
        if (!inside(x, z) || perim(x, z)) continue;
        for (let y = TOP; y <= TOP + 1; y++) {
          safeSet(x, y, z, y === TOP ? "light_gray_concrete" : "iron_block");
        }
      }
    }
  }
  if (inside(18, 5)) {
    for (let y = TOP; y <= TOP + 4; y++) safeSet(18, y, 5, "iron_bars");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw662834766.nbt");
