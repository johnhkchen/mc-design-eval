import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538752141.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538752141.nbt";

const W = 12, H = 23, D = 34;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

// Absolute levels. y 0 is the lowest ground under the footprint.
const base = Math.min(...cells.map((c) => c[2]));
const GF_TOP = base + 4;   // top of ground storey (fascia row)
const FLOOR2 = base + 5;   // storey line between floors
const ROOF = base + 10;    // cornice / parapet cap layer (roof about 11 above lowest ground)

// Put the entrance on the long west face, middle bay.
const westZs = cells.filter(([x]) => x === 0).map(([, z]) => z).sort((a, b) => a - b);
const DOOR_Z = westZs.length ? westZs[Math.floor(westZs.length / 2)] : -1;

function set(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function dirsOf(x, z) {
  const d = [];
  if (!has(x, z - 1)) d.push("north");
  if (!has(x, z + 1)) d.push("south");
  if (!has(x + 1, z)) d.push("east");
  if (!has(x - 1, z)) d.push("west");
  return d;
}

const OPPOSITE = { north: "south", south: "north", east: "west", west: "east" };
const INWARD = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] };

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  const dirs = dirsOf(x, z);

  // Interior cells: floor slabs per storey and a roof deck. No interior spaces.
  if (dirs.length === 0) {
    set(x, gr, z, "smooth_stone");
    if (FLOOR2 > gr) set(x, FLOOR2, z, "smooth_stone");
    set(x, ROOF, z, "light_gray_concrete");
    // Roof equipment: a few AC units / plant boxes on the roof deck.
    if (x % 3 === 2 && (x * 7 + z * 3) % 11 === 0) set(x, ROOF + 1, z, "iron_block");
    continue;
  }

  // Corner columns.
  if (dirs.length > 1) {
    for (let y = gr; y < ROOF; y++) set(x, y, z, "light_gray_concrete");
    set(x, ROOF, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    continue;
  }

  // Single-face perimeter cells.
  const face = dirs[0];
  const isNS = face === "north" || face === "south";
  const along = isNS ? x : z;
  const pilaster = along % 3 === 0;
  const paneProps = isNS
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const isDoor = face === "west" && x === 0 && z === DOOR_Z;

  for (let y = gr; y <= ROOF; y++) {
    if (y === gr) {
      // Base course.
      set(x, y, z, "polished_andesite");
    } else if (y === ROOF) {
      // Cornice cap.
      set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    } else if (y === FLOOR2) {
      // Storey line.
      set(x, y, z, "smooth_stone");
    } else if (y === GF_TOP) {
      // Fascia band over the shopfronts.
      set(x, y, z, "red_concrete");
    } else if (y < FLOOR2) {
      // Ground storey: shopfront glass, pilasters, entrance door.
      if (isDoor && (y === gr + 1 || y === gr + 2)) {
        set(x, y, z, "dark_oak_door", {
          facing: "west",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (pilaster) {
        set(x, y, z, "light_gray_concrete");
      } else {
        set(x, y, z, "light_blue_stained_glass_pane", paneProps);
      }
    } else {
      // Upper storey: sill, glazed bays with frames, header.
      if (y === FLOOR2 + 1 || y === ROOF - 1) {
        set(x, y, z, "white_concrete");
      } else if (pilaster) {
        set(x, y, z, "light_gray_concrete");
      } else {
        set(x, y, z, "light_blue_stained_glass_pane", paneProps);
        // Warm glowstone just inside some glazed bays.
        if (y === FLOOR2 + 2 && along % 6 === 2) {
          const [dx, dz] = INWARD[face];
          if (has(x + dx, z + dz) && dirsOf(x + dx, z + dz).length === 0) {
            set(x + dx, y, z + dz, "glowstone");
          }
        }
      }
    }
  }
}

g.save(OUT);
