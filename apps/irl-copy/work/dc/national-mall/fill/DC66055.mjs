// 602 N St NW, a religious building on a 5 x 9 footprint, roof 5 blocks above its lowest ground. Read as a 1900-1920
// DC neighbourhood church: red brick walls on a stone base, calcite (limestone) quoins and string course, one storey of
// tall stained-glass lights on the ground floor and a clerestory row above, a stone cornice and a flat roof with a small
// lantern-topped tower. The lidar's 6-block cells are noise on a flat roof, so the massing is smoothed to the median roof.
// Walls are the edge cells, air behind the glass, a floor slab per storey (the ground floor's and the gallery's), and a
// roof deck at the top of the wall. Each column fills from y 0 up to its ground as foundation, then the walls stand on it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC66055.cells.json`, "utf8"));

const W = 5, D = 9, H = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, ground, roof] of cells) raw.set(key(x, z), { ground, roof });
const has = (x, z) => raw.has(key(x, z));

// the massing: the lidar roof is 5 or 6 (noise); the median is the flat roof, the wall's last course sits under the deck
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const ROOF = roofs[Math.floor(roofs.length / 2)];   // 5: the roof surface, the parapet course stands on the wall at y 5
const TOP = ROOF - 1;                               // y 4: the last wall course and the roof deck beneath the surface

// ---- blocks ----
const BRICK = "bricks", TRIM = "quartz_pillar", STONE = "stone_bricks", FLOOR = "smooth_stone", DECK = "smooth_stone";
const PARAPET = { block: "stone_brick_slab", state: { type: "bottom", waterlogged: "false" } };

// ---- the ring: the walls are the cells on the outline (a neighbour missing), and the corners are the pilasters ----
const ring = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const corner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

// window lights: the front (z 0, north) and back (z 8) have pairs of lancets either side of the door, a rose at the
// top; the sides (x 0, x 4) have three lights each, between the corners
const front = (x, z) => z === 0 && (x === 1 || x === 3);
const back = (x, z) => z === D - 1 && (x === 1 || x === 3);
const side = (x, z) => (x === 0 || x === W - 1) && (z === 2 || z === 4 || z === 6);
const door = (x, z) => z === 0 && x === 2;
const glassAt = (x, z, y) => {
  if (corner(x, z) || door(x, z)) return null;
  if (y === 1 || y === 2) {                                   // the ground floor's lights
    if (front(x, z)) return { block: x === 1 ? "purple_stained_glass_pane" : "yellow_stained_glass_pane", side: "ew" };
    if (back(x, z)) return { block: "light_blue_stained_glass_pane", side: "ew" };
    if (side(x, z)) return { block: z === 4 ? "red_stained_glass_pane" : "light_blue_stained_glass_pane", side: "ns" };
  }
  if (y === TOP) {                                            // the clerestory row, with the rose over the door
    if (z === 0 && x === 2) return { block: "red_stained_glass_pane", side: "ew" };
    if ((z === 0 || z === D - 1) && (x === 1 || x === 3)) return { block: "white_stained_glass_pane", side: "ew" };
    if (side(x, z)) return { block: "white_stained_glass_pane", side: "ns" };
  }
  return null;
};
const paneState = (side) => (side === "ew"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// warm light inside behind the ground-floor lights, and a lantern hung from the gallery slab over the nave
const LIGHT = new Set([key(1, 1), key(3, 1), key(1, 7), key(3, 7)]);
const LANTERN = [2, 2, 4];

// ---- build ----
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!has(x, z)) continue;
  const { ground } = raw.get(key(x, z));

  // foundation: solid from y 0 up to this cell's ground (the base course, and nothing floats on a slope)
  for (let y = 0; y < ground; y++) g.set(x, y, z, STONE);

  if (ring(x, z)) {
    // walls from the ground to the wall's top, one storey of lights, a string course, a clerestory row
    for (let y = ground; y <= TOP; y++) {
      if (y === 0) { g.set(x, y, z, STONE); continue; }           // the plinth
      if (corner(x, z)) { g.set(x, y, z, TRIM, { axis: "y" }); continue; }
      if (door(x, z) && (y === 1 || y === 2)) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === 3) { g.set(x, y, z, STONE); continue; }            // string course
      const glass = glassAt(x, z, y);
      if (glass) { g.set(x, y, z, glass.block, paneState(glass.side)); continue; }
      g.set(x, y, z, BRICK);
    }
    g.set(x, ROOF, z, PARAPET.block, PARAPET.state);              // the cornice course on every ring cell
  } else {
    // the nave: a floor slab at ground and gallery, air between, a deck at the wall's top
    g.set(x, 3, z, FLOOR);
    g.set(x, TOP, z, DECK);
    if (LIGHT.has(key(x, z))) g.set(x, 1, z, "glowstone");
  }
}

// the roof: a small lantern tower on the deck, over the nave
g.set(LANTERN[0], ROOF, 4, STONE);
g.set(LANTERN[0], ROOF + 1, 4, "lantern", { hanging: "false", waterlogged: "false" });

// the lantern hanging from the gallery slab over the nave
g.set(LANTERN[0], LANTERN[1], LANTERN[2], "lantern", { hanging: "true", waterlogged: "false" });

const out = `${DIR}/DC66055.nbt`;
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, palette ${r.palette}`);
