import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC53964";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 34, D = 19;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const cellMap = new Map();
for (const [x, z, gr, roof] of cells) cellMap.set(`${x},${z}`, { x, z, gr, roof });
const has = (x, z) => cellMap.has(`${x},${z}`);

const DIRS = [
  { name: "east", dx: 1, dz: 0 },
  { name: "west", dx: -1, dz: 0 },
  { name: "south", dx: 0, dz: 1 },
  { name: "north", dx: 0, dz: -1 },
];
const exposedDirs = (x, z) => DIRS.filter(d => !has(x + d.dx, z + d.dz));
const isExposed = (x, z) => has(x, z) && exposedDirs(x, z).length > 0;

function paneProps(x, z) {
  return {
    north: String(isExposed(x, z - 1)),
    south: String(isExposed(x, z + 1)),
    east: String(isExposed(x + 1, z)),
    west: String(isExposed(x - 1, z)),
    waterlogged: "false",
  };
}

// ---- materials ----------------------------------------------------------------
const FOUNDATION = "stone_bricks";
const BASE = "stone_bricks";
const WALL = "smooth_quartz";
const PIER = "quartz_pillar";
const CORNICE = "quartz_block";
const PARAPET = "smooth_quartz_slab";
const DECK = "smooth_quartz";
const GLASS = "gray_stained_glass_pane";
const SHOP_GLASS = "light_blue_stained_glass_pane";
const MECH = "stone_bricks";
const MECH_CAP = "smooth_stone_slab";

const STOREY = 3;

// ---- main massing pass --------------------------------------------------------
for (const c of cells) {
  const x = c[0], z = c[1];
  const gr = Math.max(0, c[2]);
  const roof = Math.min(c[3], H - 5);
  const top = roof - 1;
  const exposed = isExposed(x, z);
  const u = x + z;

  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);

  for (let y = gr; y <= top; y++) {
    const rel = y - gr;

    if (!exposed) {
      // Interior: floor slabs and roof deck only; air between.
      if (y === top || rel % STOREY === 0) g.set(x, y, z, DECK);
      continue;
    }

    // Exposed shell.
    if (y === top) {
      g.set(x, y, z, CORNICE);
      continue;
    }
    if (rel === 0) {
      g.set(x, y, z, BASE);
      continue;
    }
    if (rel < STOREY) {
      // Ground-floor shopfront with pilasters.
      if (u % 3 === 0) g.set(x, y, z, PIER);
      else g.set(x, y, z, SHOP_GLASS, paneProps(x, z));
      continue;
    }
    if (rel % STOREY === 0) {
      g.set(x, y, z, WALL); // storey line
      continue;
    }
    // Window bands with pilasters between bays.
    if (u % 3 === 0) g.set(x, y, z, PIER);
    else g.set(x, y, z, GLASS, paneProps(x, z));
  }

  // Parapet lip on exposed edges, one slab above the cornice.
  if (exposed && top + 1 < H) {
    g.set(x, top + 1, z, PARAPET, { type: "bottom", waterlogged: "false" });
  }

  // Roof plant: low stone boxes with a slab cap, sitting on the roof deck.
  if (!exposed && x % 4 === 1 && z % 5 === 2 && top + 2 < H) {
    g.set(x, top + 1, z, MECH);
    g.set(x, top + 2, z, MECH_CAP, { type: "bottom", waterlogged: "false" });
  }
}

// ---- warm lights behind some upper-storey windows -----------------------------
for (const c of cells) {
  const x = c[0], z = c[1];
  const gr = Math.max(0, c[2]);
  const top = Math.min(c[3], H - 5) - 1;
  if (!isExposed(x, z)) continue;
  const ex = exposedDirs(x, z);
  const inX = x - ex[0].dx, inZ = z - ex[0].dz;
  if (!has(inX, inZ) || isExposed(inX, inZ)) continue;
  if ((x + z) % 2 !== 0) continue;
  for (let y = gr + STOREY + 1; y < top; y++) {
    const rel = y - gr;
    if (rel % STOREY === 2 && (x + z) % 3 !== 0) {
      g.set(inX, y, inZ, "glowstone");
    }
  }
}

// ---- entrance on the south (max z) street face --------------------------------
const maxZ = Math.max(...cells.map(c => c[1]));
const entranceCands = cells
  .filter(c => c[1] === maxZ && isExposed(c[0], c[1]))
  .sort((a, b) => Math.abs(a[0] - 6) - Math.abs(b[0] - 6));
if (entranceCands.length) {
  const [ex, ez, egr] = entranceCands[0];
  const gr = Math.max(0, egr);
  const doorProps = (half) => ({
    facing: "south",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  // Clear the entrance bay, then set the doorway and a stone surround.
  g.set(ex, gr, ez, "dark_oak_door", doorProps("lower"));
  g.set(ex, gr + 1, ez, "dark_oak_door", doorProps("upper"));
  g.set(ex, gr + 2, ez, "chiseled_quartz_block");
  for (const dx of [-1, 1]) {
    if (has(ex + dx, ez)) {
      g.set(ex + dx, gr, ez, PIER);
      g.set(ex + dx, gr + 1, ez, PIER);
      g.set(ex + dx, gr + 2, ez, PIER);
    }
  }
  // Warm light at the doorway.
  if (has(ex, ez - 1) && !isExposed(ex, ez - 1)) {
    g.set(ex, gr + 2, ez - 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
