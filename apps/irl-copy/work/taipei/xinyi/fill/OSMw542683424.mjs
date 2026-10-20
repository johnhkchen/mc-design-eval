import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey mid-1990s Xinyi-style commercial block: granite plinth, smooth quartz
// facade, dark bronze-toned frames, glass shopfront and upper windows, stone cornice,
// stone-brick parapet, and roof plant. Each cell's storeys stand on its own ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542683424";
const OUT = `${DIR}/${ID}.nbt`;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 26, H = 23, D = 20;
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

// outward faces of a footprint cell (neighbour missing from the footprint)
const outsOf = (x, z) =>
  Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));

// along-wall coordinate for a face
const alongU = (d, x, z) => (d === "north" || d === "south" ? x : z);

// glass pane connection props depending on wall orientation
const paneProps = d =>
  d === "north" || d === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// choose the entrance face: prefer the south (+z) face, else any single-face wall
const singleFaceCells = cells.filter(([x, z]) => outsOf(x, z).length === 1);
const doorDir = singleFaceCells.some(([x, z]) => outsOf(x, z)[0] === "south")
  ? "south"
  : (singleFaceCells[0] ? outsOf(singleFaceCells[0][0], singleFaceCells[0][1])[0] : null);

let doorCell = null;
if (doorDir) {
  const cand = cells
    .filter(([x, z]) => outsOf(x, z).includes(doorDir))
    .sort((a, b) => alongU(doorDir, a[0], a[1]) - alongU(doorDir, b[0], b[1]));
  if (cand.length) doorCell = cand[Math.floor(cand.length / 2)];
}

for (const [x, z, b] of cells) {
  // foundation up to this cell's ground
  for (let y = 0; y < b; y++) g.set(x, y, z, "stone_bricks");

  // floor slab at ground, storey slab at +5, roof slab at +10 (all cells)
  g.set(x, b, z, "smooth_stone");
  g.set(x, b + 5, z, "smooth_stone");
  g.set(x, b + 10, z, "smooth_stone");

  const outs = outsOf(x, z);

  // interior cell: roof plant on the roof slab
  if (outs.length === 0) {
    if (x % 8 === 4 && z % 6 === 3) {
      g.set(x, b + 11, z, "light_gray_concrete");
    }
    continue;
  }

  // corner cell: solid quartz pier, parapet on top
  if (outs.length > 1) {
    g.set(x, b, z, "polished_granite");
    for (let y = b + 1; y <= b + 10; y++) g.set(x, y, z, "smooth_quartz");
    g.set(x, b + 10, z, "stone_bricks");
    g.set(x, b + 11, z, "stone_brick_wall");
    continue;
  }

  // single-face wall cell
  const d = outs[0];
  const [dx, dz] = DIRS[d];
  const u = alongU(d, x, z);
  const pane = paneProps(d);

  // granite plinth
  g.set(x, b, z, "polished_granite");

  // ground floor shopfront: glass bays with dark frame piers
  for (let y = b + 1; y <= b + 3; y++) {
    if (u % 4 === 0) g.set(x, y, z, "dark_oak_planks");
    else g.set(x, y, z, "glass_pane", pane);
  }
  g.set(x, b + 4, z, "dark_oak_planks"); // shopfront head frame

  // storey band
  g.set(x, b + 5, z, "stone_bricks");

  // upper floor: quartz piers, glass bays, dark head frame
  for (let y = b + 6; y <= b + 8; y++) {
    if (u % 3 === 0) g.set(x, y, z, "smooth_quartz");
    else g.set(x, y, z, "glass_pane", pane);
  }
  g.set(x, b + 9, z, "dark_oak_planks");

  // cornice and parapet
  g.set(x, b + 10, z, "stone_bricks");
  g.set(x, b + 11, z, "stone_brick_wall");

  // warm light behind some glass bays (interior cell just inside the wall)
  const ix = x - dx, iz = z - dz;
  if (has(ix, iz) && u % 6 === 1) {
    g.set(ix, b + 2, iz, "glowstone");
    g.set(ix, b + 7, iz, "shroomlight");
  }
}

// entrance door on the chosen face, centred on that wall
if (doorCell) {
  const [x, z, b] = doorCell;
  g.set(x, b + 1, z, "dark_oak_door", {
    facing: doorDir, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, b + 2, z, "dark_oak_door", {
    facing: doorDir, half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

g.save(OUT);
