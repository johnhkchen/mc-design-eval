import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw542608898: 3 x 13 footprint, roof about 11 blocks above lowest ground.
// Read as a two-storey Xinyi shophouse: concrete frame with pale tile facade,
// red fascia over a glazed shopfront, upper-floor windows, parapet and a roof tank.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608898";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 3, H = 23, D = 13;
const g = new Voxels([W, H, D]);

// Storey levels (absolute y, lowest ground = 0)
const FLOOR_2 = 5;   // floor slab between storeys
const ROOF = 10;     // roof deck / cornice level
const PARAPET = 11;  // top of parapet, about 11 blocks above lowest ground

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const S = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const LANTERN = { hanging: "true", waterlogged: "false" };
const CORNICE = { type: "bottom", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  // Faces that are exposed to the outside
  const front = !has(x, z - 1);   // street side (north, z = 0)
  const back = !has(x, z + 1);
  const left = !has(x - 1, z);
  const right = !has(x + 1, z);
  const perimeter = front || back || left || right;

  // Floor slab at storey line and roof deck, across the whole footprint
  S(x, FLOOR_2, z, "smooth_quartz");
  S(x, ROOF, z, "stone_bricks");

  if (perimeter) {
    const base = Math.max(gr, 0);

    // Ground storey wall (base course at grade, quartz above)
    for (let y = base; y <= FLOOR_2 - 1; y++) {
      S(x, y, z, y === base ? "polished_andesite" : "smooth_quartz");
    }

    // Upper storey: pale tile wall with window grid
    for (let y = FLOOR_2 + 1; y <= ROOF - 2; y++) {
      const winBand = y >= 6 && y <= 8;
      if (!winBand) {
        S(x, y, z, "smooth_quartz");
        continue;
      }
      if (front || back) {
        // Continuous ribbon of panes across the three bays
        S(x, y, z, "glass_pane", PANE_X);
      } else if (left || right) {
        // Side bays: one pane every third block, quartz piers between
        if (z % 3 === 1) {
          S(x, y, z, "glass_pane", PANE_Z);
        } else {
          S(x, y, z, "smooth_quartz");
        }
      } else {
        S(x, y, z, "smooth_quartz");
      }
    }
    // Lintel above upper windows
    S(x, 9, z, "smooth_quartz");

    // Cornice ledge and parapet on the roof edge
    S(x, ROOF, z, "quartz_slab", CORNICE);
    S(x, PARAPET, z, "smooth_quartz");
  }
}

// Street frontage: shopfront on the z = 0 face
for (const [x, z, gr] of cells) {
  if (z !== 0 || !has(x, z)) continue;
  const b = gr;
  // Red fascia band over the shopfront
  S(x, b + 4, z, "red_concrete");
  if (x === 1) {
    // Open entrance bay with a warm lantern under the fascia
    S(x, b + 3, z, "lantern", LANTERN);
  } else {
    // Glazed shop bays flanking the entrance
    for (let y = b + 1; y <= b + 3; y++) S(x, y, z, "glass_pane", PANE_X);
  }
}

// Warm light just inside the entrance and behind a few side windows
if (has(1, 1)) S(1, 2, 1, "glowstone");
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  if ((x === 0 || x === 2) && z % 6 === 1 && z >= 1 && z <= D - 2 && has(1, z)) {
    S(1, 7, z, "glowstone");
  }
}

// Roof plant: a water tank on the deck, set back from the parapet
if (has(1, 6)) {
  for (let y = PARAPET; y <= PARAPET + 2; y++) {
    S(1, y, 6, "iron_block");
    if (has(1, 7)) S(1, y, 7, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
