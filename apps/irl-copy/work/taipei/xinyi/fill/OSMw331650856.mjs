import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// CTS Guangfu Building, Xinyi. Two-storey commercial block: smooth-quartz
// facade with stone base, blue-tinted glazing, a cyan shopfront and entrance
// on the south (street) face, a red sign band, and a plant box on the roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw331650856";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 4, H = 23, D = 9;
const ROOF = 11;     // roof deck (absolute y), about 11 above lowest ground
const CAP = 12;      // parapet cap level
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const inBox = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const setb = (x, y, z, id, props) => { if (inBox(x, y, z)) g.set(x, y, z, id, props); };
const perim = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

const panes = new Map();  // "x,y,z" -> pane block id

// Which outer faces a perimeter cell sits on
function faces(x, z) {
  const n = !has(x, z - 1), s = !has(x, z + 1), w = !has(x - 1, z), e = !has(x + 1, z);
  return { n, s, w, e, corner: (n || s) && (w || e) };
}

// Wall content for one perimeter cell at height y
function wallAt(x, z, y, gr, f) {
  // Base course
  if (y === gr) return { id: "stone_bricks" };

  // Entrance door on the street face, bottom on the local ground
  if (f.s && x === 1 && (y === gr + 1 || y === gr + 2) && !f.corner) {
    return {
      id: "dark_oak_door",
      props: {
        facing: "south",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      },
    };
  }

  // Roof edge: parapet and cap, cornice band
  if (y === CAP) return { id: "smooth_quartz_slab", props: { type: "bottom" } };
  if (y === ROOF) return { id: "smooth_quartz" };
  if (y === 10) return { id: "quartz_slab", props: { type: "bottom" } };

  // Storey lines: belt course at 5 and lintel at 9
  if (y === 5 || y === 9) return { id: "smooth_quartz" };

  // Sign band over the shopfront, quartz on the other faces
  if (y === 4) return { id: f.s ? "red_terracotta" : "smooth_quartz" };

  // Glazed rows: storey 1 above ground at y gr+1..3, storey 2 at 6..8
  const glazed = (y > gr && y <= 3) || (y >= 6 && y <= 8);
  if (!glazed) return { id: "smooth_quartz" };

  // Corner pillars run the full height of the glazed bays
  if (f.corner) return { id: "quartz_pillar", props: { axis: "y" } };

  // Street and rear faces: two bays between the corners
  if (f.s || f.n) {
    return { pane: f.s && y <= 3 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane" };
  }

  // Long faces: glass bays with a quartz mullion every third block
  if (z % 3 === 0) return { id: "quartz_pillar", props: { axis: "y" } };
  return { pane: y <= 3 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane" };
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) setb(x, y, z, "stone_bricks");

  if (perim(x, z)) {
    const f = faces(x, z);
    for (let y = gr; y <= CAP; y++) {
      const w = wallAt(x, z, y, gr, f);
      if (w.pane) panes.set(`${x},${y},${z}`, w.pane);
      else setb(x, y, z, w.id, w.props);
    }
  } else {
    // Interior: floor slabs per storey and a roof deck, air elsewhere
    setb(x, gr, z, "smooth_stone");
    setb(x, 5, z, "smooth_stone_slab", { type: "bottom" });
    setb(x, 10, z, "smooth_stone_slab", { type: "bottom" });
    if (gr <= ROOF) setb(x, ROOF, z, "gray_concrete");
  }
}

// Panes connect to neighbouring panes on the same plane
for (const [key, id] of panes) {
  const [x, y, z] = key.split(",").map(Number);
  const c = (dx, dz) => (panes.has(`${x + dx},${y},${z + dz}`) ? "true" : "false");
  setb(x, y, z, id, {
    north: c(0, -1),
    south: c(0, 1),
    east: c(1, 0),
    west: c(-1, 0),
    waterlogged: "false",
  });
}

// Warm lights set back behind the glazing, leaving an air gap at the glass
for (const z of [2, 4, 6]) {
  if (has(2, z) && !perim(2, z) && ground.get(`2,${z}`) < 7) setb(2, 7, z, "glowstone");
}
if (has(2, 5) && !perim(2, 5)) {
  const gr = ground.get("2,5");
  if (gr + 2 <= 3) setb(2, gr + 2, 5, "glowstone");
}

// Roof plant enclosure on the roof deck, centred on the interior
for (let x = 1; x <= 2; x++) {
  for (let z = 3; z <= 5; z++) {
    if (!has(x, z) || perim(x, z)) continue;
    setb(x, ROOF + 1, z, "light_gray_concrete");
    setb(x, ROOF + 2, z, "light_gray_concrete");
    setb(x, ROOF + 3, z, "smooth_quartz_slab", { type: "bottom" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
