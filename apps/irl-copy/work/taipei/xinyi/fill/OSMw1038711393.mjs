import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw1038711393: no record. 1980s-style Taipei mid-rise shophouse-block:
// granite-look base course, cream quartz piers and bands, blue-tinted glass
// windows, a dark-oak entrance on the south face, a flat roof with a plant box.
// Two storeys of ~5 blocks each, parapet top at minG + 11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711393";
const W = 11, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const minG = Math.min(...cells.map((c) => c[2]));
const S1 = minG + 4;   // top of shopfront storey
const FL = minG + 5;   // storey line / floor band
const CAP = minG + 10; // roof slab and cornice
const R = minG + 11;   // parapet top

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const perimeter = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const pierCell = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// Entrance: on the south (max z) face, nearest to the centre line.
const maxZ = Math.max(...cells.map((c) => c[1]));
let door = cells
  .filter(([x, z]) => z === maxZ && perimeter(x, z))
  .sort((a, b) => Math.abs(a[0] - Math.floor(W / 2)) - Math.abs(b[0] - Math.floor(W / 2)))[0];
if (!door) door = cells.find(([x, z]) => perimeter(x, z));
const doorKey = door ? `${door[0]},${door[1]}` : null;

// Foundations and envelope
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (perimeter(x, z)) {
    const pier = pierCell(x, z) || (x + z) % 3 === 0;
    const isDoor = `${x},${z}` === doorKey;
    for (let y = gr; y <= R; y++) {
      if (isDoor && (y === gr + 1 || y === gr + 2) && y <= S1) continue; // door handled below
      let id;
      if (y === gr) id = "stone_bricks";
      else if (y === R || y === CAP || y === FL || y === S1) id = "smooth_quartz";
      else if (y < S1) id = pier ? "smooth_quartz" : "light_blue_stained_glass";
      else if (y < CAP) id = pier ? "smooth_quartz" : "light_blue_stained_glass";
      else id = "smooth_quartz";
      put(x, y, z, id);
    }
  } else {
    if (gr <= FL) put(x, FL, z, "smooth_quartz");
    if (gr <= CAP) put(x, CAP, z, "smooth_quartz");
    for (let y = gr; y < CAP; y++) {
      if (y === FL) put(x, y, z, "smooth_quartz");
    }
  }
}

// Entrance door (lower and upper halves) on the south face
if (door) {
  const [dx, dz, dg] = door;
  const base = { facing: "south", hinge: "left", open: "false", powered: "false" };
  put(dx, dg + 1, dz, "dark_oak_door", { ...base, half: "lower" });
  put(dx, dg + 2, dz, "dark_oak_door", { ...base, half: "upper" });
}

// Warm glow behind some upper and shop windows (glowstone in the air gap inside)
for (const [x, z, gr] of cells) {
  if (!perimeter(x, z) || pierCell(x, z)) continue;
  const inward = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]
    .find(([ix, iz]) => has(ix, iz) && !perimeter(ix, iz));
  if (!inward) continue;
  const [ix, iz] = inward;
  if ((x * 7 + z * 3) % 5 === 0) {
    const y = FL + 2;
    if (y >= gAt(ix, iz) && y < CAP) put(ix, y, iz, "glowstone");
  }
  if ((x + z) % 6 === 0) {
    const y = S1 - 1;
    if (y >= gr + 1 && y >= gAt(ix, iz)) put(ix, y, iz, "glowstone");
  }
}

// Roof plant box in the centre of the roof, on the CAP slab
for (const [x, z, gr] of cells) {
  if (perimeter(x, z)) continue;
  if (x < 4 || x > 6 || z < 6 || z > 9) continue;
  if (gr > CAP) continue;
  for (let y = CAP + 1; y <= CAP + 2; y++) put(x, y, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
