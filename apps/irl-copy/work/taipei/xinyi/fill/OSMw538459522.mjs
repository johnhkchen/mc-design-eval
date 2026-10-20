import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538459522";
const W = 9, H = 23, D = 16;

// Two-storey mid-century Taipei commercial block: white tiled concrete walls,
// grey-concrete bands and window frames, stone base, light-blue glass,
// ground-floor shopfront with a central entrance, flat roof with a stair
// housing and a mechanical box.
const FOUND = "stone_bricks";
const BASE = "smooth_stone";
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const FRAME = "gray_concrete";
const ROOFM = "light_gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const LIGHT = "glowstone";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...ground.values());
const ROOF = minG + 10; // roof slab layer; top surface at minG + 11 (~11 blocks)

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const pane = (alongX) => alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// Foundations, floors, walls, roof, parapets
for (const [x, z, gy] of cells) {
  for (let y = 0; y < gy; y++) put(x, y, z, FOUND);

  const exposed = Object.keys(OUT).filter(f => !has(x + OUT[f][0], z + OUT[f][1]));
  const edge = exposed.length > 0;
  const corner = exposed.length > 1;
  const face = exposed[0];

  for (let y = gy; y < ROOF; y++) {
    const rel = y - gy;

    if (!edge) {
      if (rel === 0 || rel === 5) put(x, y, z, BAND);
      continue;
    }

    // Edge cell: wall, piers, windows, bands
    const alongX = face === "north" || face === "south";
    const idx = alongX ? x : z;
    const L = alongX ? W : D;
    const isEntrance = face === "north" && z === 0 && x === 4 && !corner;
    const isWindow = !corner && idx % 3 !== 0 && idx !== L - 1;

    let id = WALL;
    let props;

    if (rel === 0) {
      id = BASE;
    } else if (rel === 5) {
      id = BAND;
    } else if (rel >= 1 && rel <= 4) {
      // ground storey: shopfront
      if (isEntrance) {
        if (rel === 1) { id = "dark_oak_door"; props = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }; }
        else if (rel === 2) { id = "dark_oak_door"; props = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }; }
        else if (rel === 3) { id = GLASS; props = pane(true); }
        else id = FRAME;
      } else if (isWindow || (!corner && (idx === 3 || idx === 5) && face === "north" && z === 0)) {
        if (rel === 1 || rel === 4) id = FRAME;
        else { id = GLASS; props = pane(alongX); }
      }
    } else if (rel >= 6 && rel <= 9) {
      // upper storey windows
      if (isWindow) {
        if (rel === 6 || rel === 9) id = FRAME;
        else { id = GLASS; props = pane(alongX); }
      }
    }

    put(x, y, z, id, props);

    // Warm light just behind a few glass panes (inside the air gap)
    if (id === GLASS && (rel === 2 || rel === 7) && !corner && !isEntrance && (idx + rel) % 4 === 0) {
      const ix = x - OUT[face][0];
      const iz = z - OUT[face][1];
      if (has(ix, iz)) put(ix, y, iz, LIGHT);
    }
  }

  // Roof layer: membrane inside, parapet on the edge
  put(x, ROOF, z, edge ? WALL : ROOFM);
}

// Roof equipment: mechanical box and stair housing, standing on the roof slab
const roofBox = [];
for (let x = 2; x <= 3; x++) for (let z = 6; z <= 8; z++) roofBox.push([x, z]);
for (const [x, z] of roofBox) {
  if (!has(x, z)) continue;
  put(x, ROOF + 1, z, BAND);
  put(x, ROOF + 2, z, BAND);
  put(x, ROOF + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

const stair = [[6, 1], [7, 1], [6, 2], [7, 2]];
for (const [x, z] of stair) {
  if (!has(x, z)) continue;
  for (let y = ROOF + 1; y <= ROOF + 2; y++) put(x, y, z, WALL);
  put(x, ROOF + 3, z, FRAME);
}

g.save(`${DIR}/${ID}.nbt`);
