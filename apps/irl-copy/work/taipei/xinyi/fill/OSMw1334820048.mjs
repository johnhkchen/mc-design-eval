import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi street frontage: one commercial storey on a stone plinth,
// cream quartz walls, glass shopfront with white pillars, a stone cornice,
// and a flat roof with parapet and rooftop plant.
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1334820048.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1334820048.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 8, D = 70, H = 19;
const ROOF = 7;          // roof top sits 7 blocks above the lowest ground
const CORNICE = 6;
const LINTEL = 5;

const gmap = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, Math.max(0, Math.round(gr))]));

const g = new Voxels([W, H, D]);

const paneNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const key = `${x},${z}`;
    if (!gmap.has(key)) continue;
    const G = gmap.get(key);

    // Foundation: solid from y 0 up to this cell's ground.
    for (let y = 0; y <= Math.min(G, H - 1); y++) g.set(x, y, z, "stone_bricks");

    const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;
    const street = x === 0 || x === W - 1;
    const endFace = !street && (z === 0 || z === D - 1);

    for (let y = G + 1; y <= ROOF && y < H; y++) {
      const rel = y - G;
      let id = null;
      let props;

      if (y === ROOF) {
        // Roof slab; white parapet ring on the perimeter.
        id = edge ? "white_concrete" : "smooth_stone";
      } else if (!edge) {
        // Interior: air gap, with a ceiling slab at the cornice level.
        if (y === CORNICE) id = "smooth_stone";
        else if (y <= LINTEL && (x === 1 || x === 6) && rel === 3 && z % 6 === 3) {
          // Warm glowstone just behind the shopfront glass.
          id = "glowstone";
        }
      } else if (y === CORNICE) {
        id = "stone_bricks";
      } else if (rel === 1) {
        // Base course / plinth.
        id = "stone_bricks";
      } else if (y === LINTEL) {
        id = "smooth_stone";
      } else if (street) {
        if (z % 6 === 0) id = "white_concrete";
        else { id = "glass_pane"; props = paneNS; }
      } else if (endFace) {
        if ([1, 2, 5, 6].includes(x)) { id = "glass_pane"; props = paneEW; }
        else if ((x === 3 || x === 4) && rel === 3) id = "tinted_glass";
        else id = "smooth_quartz";
      }

      if (id === null) {
        // Cream quartz wall face (non-edge handled by interior air).
        if (edge) g.set(x, y, z, "smooth_quartz");
        continue;
      }
      if (props) g.set(x, y, z, id, props);
      else g.set(x, y, z, id);
    }
  }
}

// Entrances on both short ends: double dark oak doors at x=3,4.
for (const [z, facing] of [[0, "north"], [D - 1, "south"]]) {
  for (const x of [3, 4]) {
    const G = gmap.get(`${x},${z}`);
    if (G === undefined) continue;
    const yl = G + 1, yu = G + 2;
    if (yu > ROOF) continue;
    const hinge = x === 3 ? "left" : "right";
    g.set(x, yl, z, "dark_oak_door", { facing, half: "lower", hinge, open: "false", powered: "false" });
    g.set(x, yu, z, "dark_oak_door", { facing, half: "upper", hinge, open: "false", powered: "false" });
  }
}

// Rooftop plant: two iron boxes on the roof at x=2 and x=5.
for (const x of [2, 5]) {
  for (const z of [14, 34, 54]) {
    const G = gmap.get(`${x},${z}`);
    if (G === undefined || G > ROOF) continue;
    g.set(x, ROOF + 1, z, "iron_block");
    g.set(x, ROOF + 2, z, "iron_block");
  }
}

g.save(OUT);
