import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE92-0372-12F-4: 2003 Xinyi office tower, 12 storeys of 5 blocks, roof at y=60,
// parapet and penthouse to y=69. Lower tier to y=40, then a setback tier to the roof.
// Cyan curtain-wall glazing in white concrete frames, light-grey floor bands,
// warm yellow panes in some windows at dusk.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE92-0372-12F-4";
const W = 67, H = 81, D = 45;
const SB = 40;            // setback: lower tier ends at the storey-8 floor line
const ROOF = 60;          // top of storey 12 (12 x 5)
const TOP = 69;           // mast tip

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Upper tier: cells at least 3 deep inside the lower footprint.
const inset = (x, z) => {
  for (let d = 1; d <= 2; d++) {
    if (!has(x + d, z) || !has(x - d, z) || !has(x, z + d) || !has(x, z - d)) return d;
  }
  return 3;
};
const upperHas = (x, z) => has(x, z) && inset(x, z) >= 3;

const facesOf = (x, z, pred) => {
  const f = [];
  if (!pred(x, z - 1)) f.push("N");
  if (!pred(x, z + 1)) f.push("S");
  if (!pred(x - 1, z)) f.push("W");
  if (!pred(x + 1, z)) f.push("E");
  return f;
};

const hash = (x, y, z) => (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);

const g = new Voxels([W, H, D]);

for (const [x, z] of cells) {
  const inUp = upperHas(x, z);
  const fl = facesOf(x, z, has);
  const fu = inUp ? facesOf(x, z, upperHas) : [];
  const gr = ground.get(`${x},${z}`);
  const maxY = inUp ? ROOF : SB;

  for (let y = 0; y <= maxY; y++) {
    const useU = inUp && y > SB;
    const f = useU ? fu : fl;
    const edge = f.length > 0;

    // Solid foundation under interior cells; exterior faces carry the storeys
    // all the way down so the downhill side shows its extra floors.
    if (y < gr && !edge) { g.set(x, y, z, "gray_concrete"); continue; }

    if (y === ROOF) { g.set(x, y, z, "light_gray_concrete"); continue; }   // roof membrane

    const k = Math.floor(y / 5);
    const r = y % 5;

    if (!edge) {
      if (r === 0) g.set(x, y, z, "light_gray_concrete");                  // floor slab
      continue;
    }

    if (r === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }     // floor band
    if (r === 4) { g.set(x, y, z, "white_concrete"); continue; }          // spandrel beam

    const u = f[0] === "N" || f[0] === "S" ? x : z;   // position along the exterior face
    const onSouth = f.includes("S");

    // Entrance: centred on the south face at ground level, dark glazed doors.
    if (k === 0 && onSouth && u >= 30 && u <= 36) {
      g.set(x, y, z, "black_stained_glass");
      continue;
    }

    // Ground storey shopfront: wide glazing with mullions every 6 blocks.
    if (k === 0) {
      g.set(x, y, z, u % 6 === 0 ? "white_concrete" : "light_blue_stained_glass");
      continue;
    }

    // Typical storey: mullion every 3 blocks, glazing elsewhere, some lit panes.
    if (u % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }
    const lit = r === 2 && hash(x, y, z) % 7 === 0;
    g.set(x, y, z, lit ? "yellow_stained_glass" : "cyan_stained_glass");
  }

  // Terrace parapet around the setback ledge at y=41.
  if (!inUp && fl.length > 0) g.set(x, SB + 1, z, "white_concrete");

  // Roof parapet on the upper tier perimeter.
  if (inUp && fu.length > 0) {
    for (let y = ROOF + 1; y <= ROOF + 2; y++) g.set(x, y, z, "white_concrete");
  }

  // Roof penthouse on the upper-tier core.
  if (inUp && fu.length === 0 && x >= 22 && x <= 44 && z >= 12 && z <= 32) {
    for (let y = ROOF + 1; y <= ROOF + 3; y++) g.set(x, y, z, "light_gray_concrete");
    if (x >= 26 && x <= 40 && z >= 16 && z <= 28) {
      g.set(x, ROOF + 4, z, "smooth_stone");
    }
  }
}

// Antenna mast on the penthouse axis.
if (upperHas(33, 22)) {
  for (let y = 65; y <= TOP; y++) {
    g.set(33, y, 22, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
