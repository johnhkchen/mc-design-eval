import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw226945262";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 113, H = 62, D = 30;
const ROOF = 50;               // roof deck, about 50 blocks above lowest ground; 10 storeys of 5
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground y
const gm = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gy] of cells) {
  gm.set(`${x},${z}`, gy);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => gm.has(`${x},${z}`);
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

for (const [x, z, rawGround] of cells) {
  const gy = Math.max(0, Math.min(ROOF - 1, Math.round(rawGround)));

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  // roof deck on every footprint cell
  g.set(x, ROOF, z, "light_gray_concrete");

  const faces = [];
  if (!has(x, z - 1)) faces.push("n");
  if (!has(x, z + 1)) faces.push("s");
  if (!has(x - 1, z)) faces.push("w");
  if (!has(x + 1, z)) faces.push("e");
  const boundary = faces.length > 0;

  // interior cells: floor slabs only, leaving an air gap behind the glass
  if (!boundary) {
    for (let y = gy; y < ROOF; y++) {
      if (y % 5 === 0) g.set(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  const face = faces[0];
  const along = face === "n" || face === "s" ? x : z;   // bay index along the facade
  const corner = faces.length > 1;
  const inward =
    face === "n" ? [0, 1] :
    face === "s" ? [0, -1] :
    face === "w" ? [1, 0] : [-1, 0];
  const ix = x + inward[0], iz = z + inward[1];
  const inwardOk = has(ix, iz);
  const onLongFace = face === "n" || face === "s";

  // central entrance: 7 bays wide on the long faces
  const entranceBay = onLongFace && Math.abs(x - cx) <= 3;
  const entranceJamb = onLongFace && Math.abs(x - cx) === 4;

  // base course on the ground line
  g.set(x, gy, z, "polished_granite");

  for (let y = gy + 1; y < ROOF; y++) {
    const s = y % 5;                       // position within storey
    const k = Math.floor(y / 5);           // storey index
    const ground = y < 5;
    let id;

    if (s === 0) {
      id = "light_gray_concrete";          // floor line band
    } else if (s === 4) {
      id = "white_concrete";               // spandrel
    } else if (corner || along % 4 === 0) {
      id = "white_concrete";               // mullion / pier
    } else if (ground) {
      id = "light_blue_stained_glass";     // shopfront glazing
    } else {
      id = "gray_stained_glass";           // office glazing
    }

    // a stone pavilion marks the centre of each long facade, reading from the street
    if (onLongFace && Math.abs(x - cx) <= 6 && s !== 0 && y < ROOF - 1 && !(ground && entranceBay)) {
      if (y >= 5 && s === 2 && along % 2 === 0) id = "stone_bricks";
    }

    if (ground && entranceJamb && y >= gy + 1 && y <= gy + 3) {
      id = "polished_granite";             // entrance jambs
    }
    if (ground && entranceBay && y >= gy + 1 && y <= gy + 2) {
      id = "glass";                        // glass doors
    }
    if (ground && entranceBay && y === gy + 3) {
      id = "smooth_stone";                 // entrance canopy soffit
    }
    if (ground && entranceBay && y === 4) {
      id = "smooth_stone";                 // projecting canopy band
    }

    g.set(x, y, z, id);

    // warm lights behind glass: more of them, so the facade glows at dusk
    if (
      inwardOk &&
      !corner &&
      (id === "gray_stained_glass" || id === "light_blue_stained_glass") &&
      s === 2 &&
      ((along * 3 + k * 5) % 7 === 0)
    ) {
      g.set(ix, y, iz, "glowstone");
    }
    // lobby lights behind the entrance doors
    if (inwardOk && ground && entranceBay && y === gy + 2) {
      g.set(ix, y, iz, "lantern");
    }
  }

  // parapet with coping on the roof edge
  g.set(x, ROOF + 1, z, "white_concrete");
  g.set(x, ROOF + 2, z, corner ? "stone_brick_slab" : "light_gray_concrete");
}

// rooftop plant room, set back in the middle of the roof
for (let x = 30; x <= 80; x++) {
  for (let z = 9; z <= 20; z++) {
    if (!has(x, z)) continue;
    const rim = x === 30 || x === 80 || z === 9 || z === 20;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      g.set(x, y, z, rim && y === ROOF + 2 ? "gray_stained_glass" : "white_concrete");
    }
    g.set(x, ROOF + 4, z, "light_gray_concrete");   // crown
  }
}

// antenna mast on the plant room
if (has(cx, cz)) {
  for (let y = ROOF + 5; y <= ROOF + 8; y++) g.set(cx, y, cz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
