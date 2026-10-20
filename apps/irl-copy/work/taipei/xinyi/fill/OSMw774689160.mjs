import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-district commercial block (no record). Reads as a late-1980s
// Taipei shophouse/office block: white tiled concrete bays, granite base,
// stone cornice, tinted-glass strip windows, glazed shopfront with a central
// entrance, and a flat roof with plant boxes. Two storeys of about 5 blocks
// plus a parapet, roof at lowest ground + 11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw774689160";
const W = 24, H = 23, D = 37;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const minG = Math.min(...cells.map((c) => c[2]));
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));

const roofRow = minG + 11;   // roof surface / parapet row
const cornice = roofRow - 1; // stone cornice course
const L1 = minG + 5;         // storey-2 floor line (spandrel / sill)
const L1lintel = minG + 4;   // storey-1 head line

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const exposure = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});
const isPerim = (x, z) => {
  if (!has(x, z)) return false;
  const e = exposure(x, z);
  return e.n || e.s || e.w || e.e;
};

const isPillar = (x, z, zFace, xFace) => {
  if (zFace && xFace) return true;
  if (zFace) return x % 3 === 0 || x === minX || x === maxX;
  return z % 3 === 0 || z === minZ || z === maxZ;
};

const paneProps = (zFace) =>
  zFace
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const innerOf = (x, z, e) => {
  if (e.n) return [x, z + 1];
  if (e.s) return [x, z - 1];
  if (e.w) return [x + 1, z];
  return [x - 1, z];
};

// Pass 1: foundations, floors, roof slab, and walls.
for (const [x, z, gr] of cells) {
  const e = exposure(x, z);
  const perim = e.n || e.s || e.w || e.e;

  // Solid foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: ground-floor slab, storey-2 floor slab, roof slab. Air otherwise.
    put(x, gr, z, "smooth_stone");
    if (gr <= L1) put(x, L1, z, "smooth_quartz");
    if (gr <= roofRow) put(x, roofRow, z, "gray_concrete");
    continue;
  }

  const zFace = e.n || e.s;
  const xFace = e.w || e.e;
  const pillar = isPillar(x, z, zFace, xFace);

  for (let y = gr; y <= roofRow; y++) {
    let id;
    let props;
    if (y === roofRow) {
      id = "white_concrete"; // parapet
    } else if (y === cornice) {
      id = "smooth_stone"; // cornice course
    } else if (y === gr) {
      id = "polished_granite"; // base course
    } else if (pillar) {
      id = "white_concrete"; // tiled pillars
    } else if (y === L1lintel) {
      id = "smooth_stone"; // storey-1 head band
    } else if (y === L1) {
      id = "white_concrete"; // storey-2 sill / spandrel
    } else if (y > gr && y < L1lintel) {
      id = "glass"; // ground-floor shopfront glazing
    } else if (y >= minG + 6 && y <= minG + 9) {
      id = "light_blue_stained_glass_pane"; // upper strip windows
      props = paneProps(zFace);
    } else {
      id = "white_concrete";
    }
    if (props) put(x, y, z, id, props);
    else put(x, y, z, id);
  }
}

// Pass 2: interior floor-level detail behind the glazing (warm lights).
for (const [x, z, gr] of cells) {
  const e = exposure(x, z);
  if (!(e.n || e.s || e.w || e.e)) continue;
  const zFace = e.n || e.s;
  if (isPillar(x, z, zFace, e.w || e.e)) continue;
  const u = zFace ? x : z;
  const [ix, iz] = innerOf(x, z, e);
  if (!has(ix, iz) || isPerim(ix, iz)) continue;

  // Upper storey: glowstone behind some windows.
  if (u % 6 === 1) put(ix, minG + 7, iz, "glowstone");
  // Ground floor: standing lanterns inside some shopfronts.
  if (u % 6 === 4) put(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Pass 3: central entrance on the z-min (north) face, on a non-pillar bay.
const frontXs = cells.filter(([, z]) => z === minZ).map((c) => c[0]);
const mid = (minX + maxX) / 2;
let doorX = null;
for (const cand of [...frontXs].sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))) {
  if (cand % 3 !== 0 && cand !== minX && cand !== maxX) { doorX = cand; break; }
}
if (doorX === null) doorX = frontXs[Math.floor(frontXs.length / 2)];

const dg = gAt(doorX, minZ);
const doorProps = (half) => ({
  facing: "south",
  half,
  hinge: "left",
  open: "false",
  powered: "false",
});
put(doorX, dg + 1, minZ, "dark_oak_door", doorProps("lower"));
put(doorX, dg + 2, minZ, "dark_oak_door", doorProps("upper"));
// Hanging entrance lantern under the lintel.
put(doorX, dg + 3, minZ, "lantern", { hanging: "true", waterlogged: "false" });

// Pass 4: roof plant boxes on the interior roof.
for (const [x, z] of cells) {
  if (isPerim(x, z)) continue;
  if (x % 8 === 4 && z % 9 === 4) {
    put(x, roofRow + 1, z, "light_gray_concrete");
    put(x, roofRow + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
