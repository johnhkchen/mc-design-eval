import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE103-0218: 2014 two-storey commercial/office block, 7 x 13 footprint.
// Flat roof at y 11 (lidar: ~11 above lowest ground). Two 5-block storeys,
// white-concrete piers, cyan glazing, light-grey storey lines, parapet and cap.
// Foundation fills from y 0 up to each cell's ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE103-0218";
const W = 7, H = 23, D = 13;
const ROOF_Y = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

const DOOR_LOWER = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" };
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };
const ROD = { facing: "up", powered: "false", waterlogged: "false" };
const LANTERN_HANG = { hanging: "true", waterlogged: "false" };

// Pass 1: foundations, floors, walls, roof
for (const [x, z, rawGround] of cells) {
  const gc = Math.min(Math.max(Math.round(rawGround), 0), ROOF_Y);

  // foundation under every footprint cell
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  const missN = !has(x, z - 1);
  const missS = !has(x, z + 1);
  const missW = !has(x - 1, z);
  const missE = !has(x + 1, z);
  const nMiss = [missN, missS, missW, missE].filter(Boolean).length;
  const ring = nMiss > 0;

  if (ring) {
    // index along the face: x for north/south faces, z for east/west faces
    const idx = (missN || missS) ? x : z;
    const corner = nMiss >= 2;
    const pier = corner || idx % 3 === 0;
    const isDoor = missS && !corner && x === 3;

    for (let y = gc; y <= ROOF_Y; y++) {
      if (y === gc) {
        put(x, y, z, "polished_granite");
      } else if (isDoor && (y === gc + 1 || y === gc + 2)) {
        put(x, y, z, "dark_oak_door", y === gc + 1 ? DOOR_LOWER : DOOR_UPPER);
      } else if (y <= 3) {
        put(x, y, z, pier ? "white_concrete" : "cyan_stained_glass");
      } else if (y === 4) {
        put(x, y, z, "white_concrete"); // ground-floor lintel band
      } else if (y === 5) {
        put(x, y, z, "light_gray_concrete"); // storey line
      } else if (y <= 9) {
        put(x, y, z, pier ? "white_concrete" : "cyan_stained_glass");
      } else if (y === 10) {
        put(x, y, z, "light_gray_concrete"); // storey line
      } else if (y === ROOF_Y) {
        put(x, y, z, "white_concrete"); // parapet
      }
    }
    put(x, ROOF_Y + 1, z, "smooth_stone_slab", SLAB_BOTTOM); // parapet cap
  } else {
    // interior: floor slabs per storey and roof, air between
    for (let y = gc; y <= ROOF_Y; y++) {
      if (y === gc) put(x, y, z, "smooth_stone");
      else if (y === 5 || y === 10) put(x, y, z, "smooth_stone");
      else if (y === ROOF_Y) put(x, y, z, "gray_concrete");
    }
  }
}

// Pass 2: roof equipment, lightning rod, entrance lantern
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  const isRing = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  if (isRing) continue;
  if ((x === 2 || x === 3) && (z === 4 || z === 5)) {
    put(x, ROOF_Y + 1, z, "light_gray_concrete");
    put(x, ROOF_Y + 2, z, "light_gray_concrete");
  }
}
{
  const rc = [3, 8];
  if (has(rc[0], rc[1])) put(rc[0], ROOF_Y + 1, rc[1], "lightning_rod", ROD);
}
// entrance lantern: hangs inside the door bay from the storey-1 floor slab
{
  const gc = Math.round(ground.get("3,12") ?? 0);
  const lg = Math.min(Math.max(gc, 0), ROOF_Y);
  const ly = lg + 3;
  if (has(3, 11) && ly < 5 && ly > lg) {
    put(3, ly, 11, "lantern", LANTERN_HANG);
  }
}

// Warm lights: glowstone one cell inside a sparse set of windows, at two heights
for (const [x, z, rawGround] of cells) {
  const gc = Math.min(Math.max(Math.round(rawGround), 0), ROOF_Y);
  const missN = !has(x, z - 1);
  const missS = !has(x, z + 1);
  const missW = !has(x - 1, z);
  const missE = !has(x + 1, z);
  const nMiss = [missN, missS, missW, missE].filter(Boolean).length;
  if (nMiss !== 1) continue;
  const idx = (missN || missS) ? x : z;
  if (idx % 3 !== 2 || idx % 6 !== 2) continue;

  let ix = x, iz = z;
  if (missN) iz = z + 1;
  else if (missS) iz = z - 1;
  else if (missW) ix = x + 1;
  else if (missE) ix = x - 1;
  if (!has(ix, iz)) continue;
  const innerRing = !has(ix, iz - 1) || !has(ix, iz + 1) || !has(ix - 1, iz) || !has(ix + 1, iz);
  if (innerRing) continue;

  for (const y of [2, 7]) {
    if (y > gc && y < ROOF_Y && y !== 5 && y !== 10) put(ix, y, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
