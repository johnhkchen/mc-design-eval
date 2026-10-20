import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded low-rise commercial block, two storeys, Xinyi style:
// a plinth, a shopfront storey with a red awning band, a painted quartz
// upper storey with window bays, a cornice and a parapet, and a small
// penthouse on the roof. Roof deck is level at y 10 (parapet top y 11),
// so the roof sits about 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343813";
const W = 26, H = 23, D = 21;
const DECK = 5;   // second-storey floor slab
const ROOF = 10;  // roof deck; parapet sits at ROOF + 1

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));

const inside = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const INWARD = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] };

function outFaces(x, z) {
  const out = [];
  for (const [face, [dx, dz]] of Object.entries(DIRS)) {
    if (!inside(x + dx, z + dz)) out.push(face);
  }
  return out;
}

// Facade face and position along it (x for north/south walls, z otherwise).
function facade(x, z) {
  const out = outFaces(x, z);
  if (out.length === 0) return null;
  const ns = out.find((f) => f === "north" || f === "south");
  if (ns) return { face: ns, pos: x };
  return { face: out[0], pos: z };
}

// Pane connections run along the wall.
function pane(face) {
  return (face === "north" || face === "south")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
const set = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Pass 1: foundations, floors, walls, shopfronts, upper storey, cornice, parapet.
for (const [key, G] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation fill from y 0 up to this cell's ground.
  for (let y = 0; y < G; y++) set(x, y, z, "stone_bricks");

  const fc = facade(x, z);

  if (!fc) {
    // Interior cell: floor slabs only, air elsewhere (no interiors).
    if (G <= DECK) set(x, DECK, z, "smooth_stone");
    if (G <= ROOF) set(x, ROOF, z, "gray_concrete");
    continue;
  }

  const { face, pos } = fc;
  const isPier4 = pos % 4 === 0;
  const isDoor = (face === "north" || face === "south") && pos === 13;
  const doorOk = isDoor && G + 2 <= 3;

  // Plinth course.
  if (G <= 3) set(x, G, z, "stone_bricks");

  // Shopfront storey: glass bays between quartz piers.
  for (let y = Math.max(G + 1, 1); y <= 3; y++) {
    if (doorOk && (y === G + 1 || y === G + 2)) continue;
    if (isPier4) set(x, y, z, "quartz_block");
    else set(x, y, z, "glass_pane", pane(face));
  }

  // Entrance door with a hanging lantern under the awning band.
  if (doorOk) {
    set(x, G + 1, z, "oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
    set(x, G + 2, z, "oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
    if (G + 3 === 3) set(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Red awning band across the ground-storey top.
  if (G <= 4) set(x, 4, z, "red_concrete");

  // Storey line at the second-floor deck.
  if (G <= DECK) set(x, DECK, z, "stone_bricks");

  // Upper storey: window bays with sills and headers.
  const win = pos % 3 !== 0;
  for (let y = Math.max(G, 6); y <= 9; y++) {
    if (y === 6) {
      if (win) set(x, 6, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
      else set(x, 6, z, "quartz_block");
    } else if (y <= 8 && win) {
      set(x, y, z, "glass_pane", pane(face));
    } else {
      set(x, y, z, "quartz_block");
    }
  }

  // Roof edge: cornice band, then parapet.
  if (G <= ROOF) {
    set(x, ROOF, z, "stone_bricks");
    set(x, ROOF + 1, z, "quartz_block");
  }
}

// Pass 2: warm light behind some upper windows (air gap sits between glass and light).
for (const [key, G] of ground) {
  const [x, z] = key.split(",").map(Number);
  const fc = facade(x, z);
  if (!fc) continue;
  const { face, pos } = fc;
  if (pos % 6 !== 1 || pos % 3 === 0) continue;
  if (G > 6) continue;
  const [dx, dz] = INWARD[face];
  const ix = x + dx, iz = z + dz;
  if (!inside(ix, iz) || outFaces(ix, iz).length > 0) continue;
  if (gAt(ix, iz) > 6) continue;
  set(ix, 7, iz, "glowstone");
}

// Pass 3: penthouse and roof equipment on interior roof cells.
for (const [key, G] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (facade(x, z) || G > ROOF) continue;
  if (x >= 8 && x <= 13 && z >= 7 && z <= 12) {
    set(x, 11, z, "stone_bricks");
    set(x, 12, z, "smooth_stone");
  }
}
for (const [x, z] of [[3, 4], [20, 15], [4, 16]]) {
  if (inside(x, z) && !facade(x, z) && gAt(x, z) <= ROOF) set(x, 11, z, "iron_block");
}
if (inside(10, 9) && gAt(10, 9) <= ROOF && !facade(10, 9)) {
  set(10, 13, 9, "shroomlight");
}

g.save(`${DIR}/${ID}.nbt`);
