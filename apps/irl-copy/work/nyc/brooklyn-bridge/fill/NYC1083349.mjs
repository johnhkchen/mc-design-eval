import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1083349.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1083349.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 23, H = 69, D = 23;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, ground, roof] of cells) {
  map.set(`${x},${z}`, { ground: Math.round(ground), roof: Math.round(roof) });
}
const has = (x, z) => map.has(`${x},${z}`);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const minZ = Math.min(...cells.map(c => c[1]));

// Pass 1: massing, foundation, core, shell, string courses, parapet
for (const [x, z, gnd, roof] of cells) {
  const ground = Math.round(gnd);
  const top = clamp(Math.round(roof), ground + 4, 67);
  const xFaceExposed = !has(x - 1, z) || !has(x + 1, z);
  const zFaceExposed = !has(x, z - 1) || !has(x, z + 1);
  const ext = xFaceExposed || zFaceExposed;
  const corner = xFaceExposed && zFaceExposed;

  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  const a = xFaceExposed && !zFaceExposed ? z : x;
  const pier = corner || a % 3 === 0;

  for (let y = ground; y < top; y++) {
    if (!ext) {
      g.set(x, y, z, "gray_concrete");
      continue;
    }
    const s = Math.floor((y - ground) / 2);
    const local = (y - ground) % 2;

    if (s === 0) {
      // Granite base and shopfront glass with brick piers
      if (local === 0) g.set(x, y, z, pier ? "polished_granite" : "smooth_stone");
      else g.set(x, y, z, pier ? "polished_granite" : "light_blue_stained_glass");
    } else if (s % 3 === 0 && local === 0) {
      // Granite string course every third storey
      g.set(x, y, z, "polished_granite");
    } else if (local === 0) {
      // Concrete spandrel under each window band
      g.set(x, y, z, pier ? "bricks" : "white_concrete");
    } else {
      // Window band with brick piers
      if (pier) {
        g.set(x, y, z, "bricks");
      } else if ((a + s * 3) % 11 === 5) {
        g.set(x, y, z, "glowstone");
      } else {
        g.set(x, y, z, "gray_stained_glass_pane");
      }
    }
  }

  // Roof: full-block stone-brick parapet on the perimeter, concrete deck inside
  if (top < H) {
    if (ext) g.set(x, top, z, "stone_bricks");
    else g.set(x, top, z, "gray_concrete");
  }
}

// Pass 2: mechanical penthouse set back from the edges
for (const [x, z, gnd, roof] of cells) {
  const ground = Math.round(gnd);
  const top = clamp(Math.round(roof), ground + 4, 67);
  const inner = x >= 6 && x <= 16 && z >= 6 && z <= 16;
  if (!inner || top + 3 >= H) continue;
  g.set(x, top + 1, z, "light_gray_concrete");
  g.set(x, top + 2, z, (x + z) % 4 === 0 ? "iron_bars" : "light_gray_concrete");
}

// Pass 3: entrance on the street face (low z), centred, with canopy and lanterns
let doorCell = null;
let bestDist = Infinity;
for (const [x, z, gnd] of cells) {
  if (z !== minZ) continue;
  const d = Math.abs(x - 11);
  if (d < bestDist) { bestDist = d; doorCell = { x, z, ground: Math.round(gnd) }; }
}
if (doorCell) {
  const { x, z, ground } = doorCell;
  const doorProps = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(x, ground, z, "oak_door", { ...doorProps, half: "lower" });
  g.set(x, ground + 1, z, "oak_door", { ...doorProps, half: "upper" });

  // Canopy on the street row, one storey above the door, spanning the entrance
  const canopyY = ground + 2;
  for (const dx of [-1, 0, 1]) {
    if (has(x + dx, z)) {
      g.set(x + dx, canopyY, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  // Lanterns under the canopy, flanking the door
  if (has(x - 1, z)) g.set(x - 1, ground + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  if (has(x + 1, z)) g.set(x + 1, ground + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(OUT);
