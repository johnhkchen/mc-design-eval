import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise commercial office block, c. 1985-1995, Xinyi district.
// Ten storeys of 5 blocks on a 26 x 16 footprint: a white-concrete and quartz
// grid with cyan glass, a granite-faced shopfront, a setback at storey 8 with
// a terrace, a stone parapet, and a central plant penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw385940765";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"))
  .map(([x, z, gr]) => [x, z, Math.round(gr)]);

const W = 26, H = 66, D = 16;
const ROOF = 54;          // roof surface, blocks above lowest ground
const SETBACK = 35;       // storey 7 line: upper tier begins here
const FLOOR = 5;          // storey height in blocks
const GLASS = "cyan_stained_glass";

const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const inFoot = (x, z) => x >= 0 && x < W && z >= 0 && z < D && ground.has(`${x},${z}`);

// Footprint at height y: full plate below the setback, inset tier above it.
const inTier = (x, z, y) => {
  if (!inFoot(x, z)) return false;
  if (y >= SETBACK) return x >= 2 && x <= W - 3 && z >= 2 && z <= D - 3;
  return true;
};
const tierAt = (y) => (x, z) => inTier(x, z, y);

// Penthouse plan: a central rectangle sitting on the roof slab.
const inPent = (x, z) => x >= 8 && x <= 17 && z >= 4 && z <= 11 && inTier(x, z, ROOF - 1);

const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];

// First side whose neighbour lies outside the set; null means interior.
function faceOf(x, z, inS) {
  for (const [name, dx, dz] of DIRS) if (!inS(x + dx, z + dz)) return name;
  return null;
}

// Facade material on a wall cell. u runs along the face so piers line up.
function facadeBlock(x, y, z, face) {
  const u = face === "north" || face === "south" ? x : z;
  const o = y % FLOOR;
  if (y < FLOOR) {                       // ground storey: granite base, shopfront glass
    if (o === 0) return "polished_granite";
    return u % 3 === 0 ? "smooth_quartz" : GLASS;
  }
  if (o === 0) return "white_concrete";  // spandrel
  if (o === 4) return "smooth_quartz";   // storey line
  return u % 3 === 0 ? "smooth_quartz" : GLASS;
}

function penthouseBlock(x, y, z, face) {
  const u = face === "north" || face === "south" ? x : z;
  if (y === ROOF + 1) return "white_concrete";
  return u % 3 === 0 ? "smooth_quartz" : GLASS;
}

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Storeys, setback and roof structure, cell by cell.
for (let y = 0; y < ROOF; y++) {
  const S = tierAt(y);
  for (const [x, z, gr] of cells) {
    if (y < gr) continue;
    if (!inTier(x, z, y)) {
      // Lower-tier ring at the setback line becomes a terrace.
      if (y === SETBACK) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const face = faceOf(x, z, S);
    if (face) {
      g.set(x, y, z, facadeBlock(x, y, z, face));
    } else if (y === gr || y % FLOOR === 0) {
      g.set(x, y, z, "smooth_stone");     // floor slab
    }
  }
}

// 3. Terrace parapet on the lower-tier perimeter ring.
for (const [x, z, gr] of cells) {
  if (gr > SETBACK + 1 || inTier(x, z, SETBACK)) continue;
  if (faceOf(x, z, inFoot)) g.set(x, SETBACK + 1, z, "stone_brick_wall");
}

// 4. Roof: stone parapet on the perimeter, slab across the interior.
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (!inTier(x, z, ROOF - 1)) continue;
  if (faceOf(x, z, tierAt(ROOF - 1))) g.set(x, ROOF, z, "stone_brick_wall");
  else g.set(x, ROOF, z, "smooth_stone");
}

// 5. Plant penthouse on the roof slab.
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (!inPent(x, z)) continue;
  const face = faceOf(x, z, inPent);
  for (let y = ROOF + 1; y <= ROOF + 3; y++) {
    if (face) g.set(x, y, z, penthouseBlock(x, y, z, face));
  }
  g.set(x, ROOF + 4, z, "smooth_stone");
}
g.set(12, ROOF + 5, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// 6. Main entrance on the north face, centred on that face.
const northFace = cells
  .filter(([x, z]) => !inFoot(x, z - 1))
  .sort((a, b) => a[0] - b[0]);
if (northFace.length) {
  const [mx, mz, mg] = northFace[Math.floor(northFace.length / 2)];
  g.set(mx, mg + 1, mz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(mx, mg + 2, mz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Quartz lintel across the entrance bay.
  for (const [x, z] of northFace) {
    if (Math.abs(x - mx) <= 1 && z === mz) g.set(x, mg + 3, z, "smooth_quartz");
  }
  // Warm lantern in the lobby behind the door.
  if (inTier(mx, mz + 1, mg + 1)) {
    g.set(mx, mg + 1, mz + 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 7. Warm glow behind some windows: glowstone on the floor just inside the glass.
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };
for (let k = 0; k < ROOF / FLOOR; k++) {
  if (k % 2 !== 0) continue;
  const y = k * FLOOR + 1;
  if (y >= ROOF) continue;
  const S = tierAt(y);
  for (const [x, z, gr] of cells) {
    if (y <= gr || !inTier(x, z, y)) continue;
    const face = faceOf(x, z, S);
    if (!face) continue;
    const u = face === "north" || face === "south" ? x : z;
    if (u % 6 !== 2) continue;
    const [dx, dz] = INWARD[face];
    const ix = x + dx, iz = z + dz;
    if (inTier(ix, iz, y) && !faceOf(ix, iz, S)) {
      g.set(ix, y, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
