import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1990s-2000s Xinyi commercial block: three storeys of pale quartz-clad
// facade with pilasters, light-blue glass bands, a shopfront ground floor, a
// cornice and a parapet, plus rooftop plant. Front faces z=0, back faces z=3.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw591075596.cells.json`, "utf8"));

const W = 37, H = 29, D = 4;
const TOP = 16;        // top of the parapet/roof cap (absolute y)
const CORNICE = 14;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, st) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
};

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const GLASS = "light_blue_stained_glass";
const TRIM = "smooth_quartz";
const FOUND = "stone_bricks";
const BASE = "polished_andesite";

for (const [x, z, gr0] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = Math.max(0, Math.min(gr0, TOP - 2));

  // Foundation: solid from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  // Ends and the roof cap are solid; interior cells are air except floor slabs.
  const endCell = x === 0 || x === W - 1;
  const front = z === 0;
  const back = z === D - 1;
  const facade = front || back;

  if (endCell) {
    for (let y = gr; y <= TOP; y++) put(x, y, z, TRIM);
    continue;
  }

  // Roof cap across the full footprint.
  put(x, TOP, z, TRIM);

  // Floor slabs at each storey line (interior and facade), and the base at ground.
  if (!facade) {
    put(x, gr, z, TRIM);
    put(x, 5, z, TRIM);
    put(x, 10, z, TRIM);
  }

  if (!facade) {
    // Rooftop plant on the interior cells (sits on the roof cap).
    if (x >= 10 && x <= 16) put(x, TOP + 1, z, "light_gray_concrete");
    if (x >= 12 && x <= 14 && z >= 1 && z <= 2) put(x, TOP + 2, z, "gray_concrete");
    continue;
  }

  // Facade (z=0 street face, z=3 back face). Pilaster bays every 4 blocks.
  const pilaster = x % 4 === 0;
  const warm = x % 8 === 2;                  // glowstone behind some windows
  const behind = front ? 1 : 2;              // air gap cell just inside the glass

  // Ground storey (shopfront): y from gr to 4.
  for (let y = gr; y <= 4; y++) {
    if (pilaster) { put(x, y, z, TRIM); continue; }
    if (y === gr) { put(x, y, z, BASE); continue; }
    if (y === 4) { put(x, y, z, TRIM); continue; }
    if (front && x === 18 && (y === 1 || y === 2)) continue; // door cells, set below
    put(x, y, z, GLASS);
    if (warm && y === 2) put(x, y, behind, "glowstone");
  }

  // Storey 2 (5..9) and storey 3 (10..13).
  for (const [lo, hi] of [[5, 9], [10, 13]]) {
    for (let y = lo; y <= hi; y++) {
      if (y < gr) continue;
      if (pilaster) { put(x, y, z, TRIM); continue; }
      if (y === lo || y === hi) { put(x, y, z, TRIM); continue; }
      put(x, y, z, GLASS);
      if (warm && y === lo + 2) put(x, y, behind, "glowstone");
    }
  }

  // Cornice band and parapet.
  if (CORNICE >= gr) put(x, CORNICE, z, TRIM);
  for (let y = CORNICE + 1; y <= TOP; y++) put(x, y, z, TRIM);
}

// Shopfront entrance, centred at x=18 on the street face.
if (ground.has("18,0")) {
  put(18, 1, 0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(18, 2, 0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(18, 3, 0, "lantern");
}

g.save(`${DIR}/OSMw591075596.nbt`);
