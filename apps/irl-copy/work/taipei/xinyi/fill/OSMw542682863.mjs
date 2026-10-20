import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682863";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 23, D = 9;
const g = new Voxels([W, H, D]);

// Footprint lookup and lowest ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const G = Math.min(...ground.values());
const inside = (x, z) => ground.has(`${x},${z}`);

// Storey lines (absolute y), from lidar record: roof about G + 11
const TOP_GROUND = G + 4;   // fascia row over the ground storey
const FLOOR2 = G + 5;       // upper floor slab / storey band
const WALL2_TOP = G + 9;
const ROOF = G + 10;        // cornice / roof deck
const PARAPET = G + 11;

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const exteriorFace = (x, z) => {
  if (!inside(x, z - 1)) return "north";
  if (!inside(x, z + 1)) return "south";
  if (!inside(x - 1, z)) return "west";
  if (!inside(x + 1, z)) return "east";
  return null;
};
const isCorner = (x, z) =>
  (!inside(x - 1, z) || !inside(x + 1, z)) && (!inside(x, z - 1) || !inside(x, z + 1));
const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

const paneProps = (face) =>
  face === "north" || face === "south"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const doorProps = (half) => ({
  facing: "north", half, hinge: "left", open: "false", powered: "false",
});

// Pass 1: foundations, floors, walls, roof for every footprint cell
for (const [x, z, gr] of cells) {
  const face = exteriorFace(x, z);
  const ext = face !== null;
  const corner = ext && isCorner(x, z);
  const u = face === "north" || face === "south" ? x : z;
  const isFront = face === "north";

  // Foundation up to the cell's ground, then base course / ground floor slab
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, ext ? "stone_bricks" : "smooth_stone");

  if (ext) {
    // Ground storey: shopfront / windows, fascia at TOP_GROUND
    for (let y = gr + 1; y <= TOP_GROUND; y++) {
      if (y === TOP_GROUND) { put(x, y, z, "red_terracotta"); continue; }
      if (y > TOP_GROUND) break;
      if (corner) { put(x, y, z, "smooth_quartz"); continue; }
      if (isFront) {
        if (u === 6) {
          if (y === gr + 1) put(x, y, z, "dark_oak_door", doorProps("lower"));
          else if (y === gr + 2) put(x, y, z, "dark_oak_door", doorProps("upper"));
          else put(x, y, z, "smooth_quartz");
        } else if (y === gr + 1 || u === 4 || u === 10) {
          put(x, y, z, "black_concrete");
        } else {
          put(x, y, z, "glass");
        }
      } else {
        if (u % 3 === 0) put(x, y, z, "smooth_quartz");
        else if (y === gr + 1) put(x, y, z, "smooth_stone");
        else put(x, y, z, "glass_pane", paneProps(face));
      }
    }

    // Storey band at FLOOR2
    if (FLOOR2 > gr) put(x, FLOOR2, z, "smooth_quartz");

    // Upper storey walls with window grid
    for (let y = FLOOR2 + 1; y <= WALL2_TOP; y++) {
      if (corner || u % 3 === 0) { put(x, y, z, "smooth_quartz"); continue; }
      if (y === FLOOR2 + 1 || y === WALL2_TOP) { put(x, y, z, "light_gray_concrete"); continue; }
      put(x, y, z, "glass_pane", paneProps(face));
    }

    // Cornice and parapet
    if (gr < ROOF) put(x, ROOF, z, "smooth_quartz");
    if (corner) put(x, PARAPET, z, "smooth_quartz");
    else put(x, PARAPET, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // Interior: floor slabs and roof deck only (air elsewhere)
    if (FLOOR2 > gr) put(x, FLOOR2, z, "smooth_stone");
    if (gr < ROOF) put(x, ROOF, z, "light_gray_concrete");
  }
}

// Pass 2: warm lights behind some windows (interior cell just inside the glass)
for (const [x, z, gr] of cells) {
  const face = exteriorFace(x, z);
  if (!face || isCorner(x, z)) continue;
  const u = face === "north" || face === "south" ? x : z;
  const [dx, dz] = inward[face];
  const ix = x + dx, iz = z + dz;
  if (!inside(ix, iz)) continue;
  if (face === "north" && (u === 2 || u === 8) && gr + 2 < FLOOR2) {
    put(ix, gr + 2, iz, "glowstone");
  }
  if (u % 6 === 4 && u % 3 !== 0) {
    put(ix, FLOOR2 + 2, iz, "shroomlight");
  }
}

// Entrance lantern on the inside of the door
if (inside(6, 1)) {
  const gr = ground.get("6,0") ?? G;
  put(6, gr + 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// Pass 3: roof penthouse with a cap slab and a lightning rod
for (let x = 5; x <= 8; x++) {
  for (let z = 3; z <= 5; z++) {
    if (!inside(x, z)) continue;
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
    put(x, ROOF + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}
if (inside(2, 2)) {
  put(2, PARAPET, 2, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
