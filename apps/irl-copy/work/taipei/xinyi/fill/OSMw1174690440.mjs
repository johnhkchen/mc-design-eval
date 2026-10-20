import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1174690440";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 40, H = 23, D = 23;
const g = new Voxels([W, H, D]);

// Two-storey low commercial block: stone base, glazed shopfront, upper glass bays,
// white concrete frame, cornice and parapet, flat roof with a plant box.
const ROOF_Y = 10;      // roof slab level (absolute)
const PARAPET_Y = 11;   // parapet / coping level (absolute)
const STOREY_Y = 5;     // floor line between storeys (absolute)

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const ext = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

// Entrance: north-most exterior edge, nearest to the middle of the frontage.
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
const frontCells = cells.filter(([x, z]) => z === minZ && ext(x, z));
let entrance = null;
if (frontCells.length) {
  frontCells.sort((a, b) => Math.abs(a[0] - 20) - Math.abs(b[0] - 20));
  entrance = frontCells[0];
}

for (const [x, z, gr] of cells) {
  const e = ext(x, z);

  // Foundation from y 0 up to the ground under this cell.
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone_bricks");

  // Floor slab / base course at ground level.
  g.set(x, gr, z, e ? "stone_bricks" : "smooth_stone");

  // Ground storey walls (shopfront).
  if (e) {
    for (let y = gr + 1; y <= 4 && y < H; y++) {
      if (y <= gr + 2) {
        // shopfront: glass bays with stone piers
        g.set(x, y, z, (x + z) % 4 === 0 ? "smooth_stone" : "glass_pane");
      } else {
        // lintel band above the shopfront
        g.set(x, y, z, "white_concrete");
      }
    }
  }

  // Storey floor line.
  if (STOREY_Y > gr && STOREY_Y < H) {
    g.set(x, STOREY_Y, z, e ? "smooth_quartz" : "light_gray_concrete");
  }

  // Upper storey windows (y 6..9): frame rows top and bottom, glass bays between mullions.
  const bay = (x + z) % 3 !=0;
  if (e) {
    for (let y = 6; y <= 9 && y < H; y++) {
      if (y <= gr) continue;
      if (y === 6 || y === 9) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, bay ? "glass_pane" : "white_concrete");
      }
    }
  }

  // Roof slab and cornice.
  if (ROOF_Y > gr && ROOF_Y < H) {
    g.set(x, ROOF_Y, z, e ? "smooth_quartz" : "light_gray_concrete");
  }

  // Parapet on the perimeter.
  if (e && PARAPET_Y > gr && PARAPET_Y < H) {
    g.set(x, PARAPET_Y, z, "smooth_quartz");
  }
}

// Warm lights behind upper-storey glass, placed in the interior air.
for (const [x, z, gr] of cells) {
  if (!ext(x, z)) continue;
  if (!((x + z) % 3 !== 0 && (x * 5 + z * 7) % 9 === 0)) continue;
  const inward = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]
    .find(([a, b]) => has(a, b) && !ext(a, b));
  if (inward && gr < 7) g.set(inward[0], 7, inward[1], "glowstone");
}

// Entrance door on the north frontage with warm light behind it.
if (entrance) {
  const [ex, ez, egr] = entrance;
  g.set(ex, egr + 1, ez, "oak_door", {
    facing: "north", half: "lower", hinge: "left",
    open: "false", powered: "false",
  });
  g.set(ex, egr + 2, ez, "oak_door", {
    facing: "north", half: "upper", hinge: "left",
    open: "false", powered: "false",
  });
  if (has(ex, ez + 1)) g.set(ex, egr + 3, ez + 1, "glowstone");
}

// Roof plant enclosure in the middle of the roof.
for (let x = 14; x <= 25; x++) {
  for (let z = 8; z <= 14; z++) {
    if (!has(x, z)) continue;
    const gr = ground.get(key(x, z));
    if (gr > ROOF_Y) continue;
    if (ext(x, z)) continue;
    g.set(x, ROOF_Y + 1, z, "light_gray_concrete");
    g.set(x, ROOF_Y + 2, z, "light_gray_concrete");
    g.set(x, ROOF_Y + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${dir}/${id}.nbt`);
