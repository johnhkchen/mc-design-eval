// Mt Eden / Eden Terrace edge, Auckland: a 1930s brick-and-render commercial block. Four storeys on a basalt
// plinth, shopfronts on the ground floor, a cream render facade with brick string courses and quoins, glass panes in
// bays of three, a flat roof behind a brick parapet. The footprint and roof come from the lidar record (the roof is
// flat at 19 across all 212 cells), so the massing is one clean tier; the ground is level to within 1 block, so the
// foundation is one course under every cell.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_826872620.cells.json`, "utf8"));

const W = 29, D = 17, H = 32;
const TOP = Math.max(...cells.map((c) => c[3]));           // 19: the lidar roof, flat over the footprint

const BASALT = "polished_blackstone", BASALT_BRICK = "polished_blackstone_bricks";
const RENDER = "smooth_quartz", BRICK = "bricks", FLOOR = "smooth_stone", PANE = "glass_pane";
const FLOORS = [0, 1, 5, 9, 13, 17];                       // foundation, ground slab, then one slab per storey and the roof deck
const STRING = [5, 9, 13];                                 // brick string courses over the upper storeys
const WIN_ROWS = [2, 3, 6, 7, 10, 11, 14, 15];             // glass: shopfront, then two rows per upper storey

const key = (x, z) => `${x},${z}`;
const inFp = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inFp.has(key(x, z));
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// the cells that front the outside: the wall ring, with the face(s) each one shows
const exposed = new Map();
for (const [x, z] of cells) {
  const faces = Object.keys(DIRS).filter((d) => !has(x + DIRS[d][0], z + DIRS[d][1]));
  if (faces.length) exposed.set(key(x, z), faces);
}
const isWall = (x, z) => exposed.has(key(x, z));
const interior = (x, z) => has(x, z) && !isWall(x, z);
const facesOf = (x, z) => exposed.get(key(x, z)) ?? [];
const corner = (x, z) => facesOf(x, z).length >= 2;        // quoins: two faces meet, or a one-cell sliver

// bays along each face: upper storeys take two glass cells in every four (windows and piers of equal width); the
// shopfront takes two in every three. A staircase cell can show glass on either of its faces, so it is only a quoin
// when no face of it has a bay of glass.
const bay = (x, z, face) => (face === "north" || face === "south" ? x : z);
const glassFace = (x, z, y) =>
  facesOf(x, z).find((f) => (y < 4 ? bay(x, z, f) % 3 !== 0 : [1, 2].includes(bay(x, z, f) % 4))) ?? null;

// the entrance: a flush single-face wall cell nearest the middle of the footprint
const mx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const mz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
const doorCands = cells
  .filter(([x, z]) => isWall(x, z) && facesOf(x, z).length === 1 && !corner(x, z))
  .sort((a, b) => (a[0] - mx) ** 2 + (a[1] - mz) ** 2 - ((b[0] - mx) ** 2 + (b[1] - mz) ** 2));
const [dX, dZ] = doorCands[0];
const doorFace = facesOf(dX, dZ)[0];
const isDoor = (x, z) => x === dX && z === dZ;

// pane connections: a pane joins the wall cells beside it on the same storey, never the air or the outside
const paneState = (x, z) => {
  const s = { waterlogged: "false" };
  for (const d of Object.keys(DIRS)) {
    const [dx, dz] = DIRS[d];
    s[d] = isWall(x + dx, z + dz) ? "true" : "false";
  }
  return s;
};

const wallBlock = (x, z, y) => {
  if (y === 0) return [BASALT];
  if (y === 1) return [BASALT_BRICK];
  if (y === TOP - 1) return [BRICK];                       // parapet
  if (y === TOP - 2) return [RENDER];                      // cornice
  if (WIN_ROWS.includes(y) && glassFace(x, z, y)) return [PANE, paneState(x, z)];
  if (corner(x, z)) return [RENDER];                       // quoins run the full height
  if (STRING.includes(y)) return [BRICK];
  return [RENDER];
};

const g = new Voxels([W, H, D]);

// 1. shell: the foundation, every floor slab and the roof deck; the ring of walls on the footprint's edge
for (const [x, z] of cells) {
  for (let y = 0; y < TOP; y++) {
    if (isWall(x, z)) {
      const [b, s] = wallBlock(x, z, y);
      g.set(x, y, z, b, s);
    } else if (FLOORS.includes(y)) {
      g.set(x, y, z, y === 0 ? BASALT : FLOOR);
    }
  }
}

// 2. the entrance: a door at ground level, and the stone hood over it across three bays of the same face
const doorState = (half) => ({ facing: doorFace, half, hinge: "left", open: "false", powered: "false" });
g.set(dX, 2, dZ, "dark_oak_door", doorState("lower"));
g.set(dX, 3, dZ, "dark_oak_door", doorState("upper"));
const along = doorFace === "north" || doorFace === "south" ? [1, 0] : [0, 1];
for (const o of [-1, 0, 1]) {
  const x = dX + along[0] * o, z = dZ + along[1] * o;
  if (isWall(x, z) && facesOf(x, z).length === 1 && facesOf(x, z)[0] === doorFace) {
    g.set(x, 4, z, BASALT + "_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 3. warm light: some windows show a lamp just inside, standing on the floor slab below (a lantern on the shopfront,
// shroomlights above it), never a solid fill behind the glass
for (const [x, z] of cells) {
  if (!isWall(x, z) || isDoor(x, z)) continue;
  for (const y of [2, 6, 10, 14]) {
    const face = glassFace(x, z, y);
    if (!face || (x * 31 + z * 17 + y * 7) % 4 !== 0) continue;
    const [dx, dz] = DIRS[face];
    const qx = x - dx, qz = z - dz;                        // the cell behind this pane
    if (!interior(qx, qz)) continue;
    if (y === 2) g.set(qx, y, qz, "lantern", { hanging: "false", waterlogged: "false" });
    else g.set(qx, y, qz, "shroomlight");
  }
}

// 4. roof equipment: three plant boxes on the roof deck, set well in from the parapet
const deep = cells.filter(([x, z]) => interior(x, z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => interior(x + dx, z + dz)));
deep.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
for (const i of [Math.floor(deep.length * 0.2), Math.floor(deep.length * 0.5), Math.floor(deep.length * 0.8)]) {
  const [x, z] = deep[i];
  g.set(x, TOP - 1, z, "stone_bricks");                    // stands on the deck (TOP-2), under the lidar roof line
}

const out = g.save(`${DIR}/way_826872620.nbt`);
console.log(`way_826872620: ${cells.length} cells, top y=${TOP}, door ${doorFace} at (${dX},${dZ}), ${out.blocks} blocks, ${out.palette} palette entries`);
