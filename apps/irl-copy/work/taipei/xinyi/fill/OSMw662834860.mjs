import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw662834860.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw662834860.nbt";

// 65 x 19 footprint, roof at y 31 (about 31 blocks above lowest ground).
// Reads as a 1990s Taipei office block: six storeys of 5 blocks, ground-floor
// shopfront with a central entrance, quartz-and-glass facade, a rooftop
// mechanical penthouse on a setback with a lightning rod mast.
const W = 65, H = 43, D = 19;
const ROOF = 31;      // parapet top
const DECK = 30;      // roof slab (top floor line)
const PH_Y0 = 31, PH_CAP = 36;

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of raw) {
  ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
}
const inF = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const perim = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);

// Pane connection props: panes run along the wall they sit in.
const paneP = (alongX) => alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const GLASS = "light_blue_stained_glass_pane";
const MULLION = "quartz_pillar";

const g = new Voxels([W, H, D]);

// ---- Main footprint pass -------------------------------------------------
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  const gr = gAt(x, z);
  if (gr >= ROOF) continue;
  const p = perim(x, z);
  const alongX = (z === 0 || z === 18);
  const idx = x + z;
  const mullion = idx % 3 === 0;

  // Foundation: solid from 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF; y++) {
    // Entrance door on the z=0 face, centred, in the shopfront storey.
    if (p && z === 0 && x === 32 && gr <= 2 && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }

    if (y === gr) { g.set(x, y, z, "polished_granite"); continue; }   // plinth / ground floor slab
    if (y === DECK) { g.set(x, y, z, "smooth_quartz"); continue; }    // roof deck, all cells

    if (!p) {
      // Interior: floor slabs only, the rest is air.
      if (y % 5 === 0 && y > 0 && y < DECK) g.set(x, y, z, "smooth_quartz");
      continue;
    }

    // Perimeter facade.
    if (y === ROOF) { g.set(x, y, z, "smooth_quartz"); continue; }     // parapet cap
    if (y <= 4) {                                                       // shopfront storey
      if (y === 4) g.set(x, y, z, "smooth_stone");                      // fascia
      else if (mullion) g.set(x, y, z, MULLION, { axis: "y" });
      else g.set(x, y, z, GLASS, paneP(alongX));
      continue;
    }
    const r = y % 5;
    if (r === 0) g.set(x, y, z, "smooth_quartz");                       // storey line
    else if (r === 4) g.set(x, y, z, "light_gray_concrete");            // spandrel
    else if (mullion) g.set(x, y, z, MULLION, { axis: "y" });           // window mullion
    else g.set(x, y, z, GLASS, paneP(alongX));                           // window glass
  }
}

// ---- Warm light behind some windows (interior cell next to the glass) ----
const inward = (x, z) => {
  if (z === 0) return [x, 1];
  if (z === 18) return [x, 17];
  if (x === 0) return [1, z];
  if (x === 64) return [63, z];
  return null;
};
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!perim(x, z)) continue;
  const idx = x + z;
  if (idx % 6 !== 2 || idx % 3 === 0) continue;
  const inn = inward(x, z);
  if (!inn || !inF(inn[0], inn[1]) || perim(inn[0], inn[1])) continue;
  for (const kf of [1, 3, 5]) {
    const y = 5 * kf + 2;
    if (y > 28 || y < gAt(inn[0], inn[1])) continue;
    g.set(inn[0], y, inn[1], "glowstone");
  }
}

// ---- Rooftop mechanical penthouse on a setback --------------------------
const phEdge = (x, z) => x === 22 || x === 42 || z === 5 || z === 13;
for (let x = 22; x <= 42; x++) {
  for (let z = 5; z <= 13; z++) {
    if (!inF(x, z)) continue;
    // Cap sits on the roof deck, spanning the penthouse walls.
    g.set(x, PH_CAP, z, "smooth_quartz");
    if (!phEdge(x, z)) continue;
    const alongX = (z === 5 || z === 13);
    g.set(x, PH_Y0, z, "smooth_quartz");                                // base course
    for (const y of [32, 33]) {                                         // glazed band
      if (x % 4 === 2) g.set(x, y, z, MULLION, { axis: "y" });
      else g.set(x, y, z, GLASS, paneP(alongX));
    }
    g.set(x, 34, z, "light_gray_concrete");                             // louvred spandrel
    g.set(x, 35, z, "smooth_quartz");                                   // cornice
  }
}

// Lightning rod mast on the penthouse cap.
g.set(32, PH_CAP + 1, 9, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
g.set(32, PH_CAP + 2, 9, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(OUT);
