import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541376803";

// Record: lidar roof ~11 blocks above lowest ground. Read as a two-storey
// late-20th-century Xinyi commercial block: polished granite base, white
// concrete piers, quartz storey bands and cornice, blue-tinted glazing,
// a central shopfront entrance on the north (z-min) street face, and a
// roof plant box.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 37, H = 23, D = 17;
const ROOF = 11;     // roof deck sits on y=11
const STOREY = 5;    // storey line
const LINTEL = 4;    // top of shopfront

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) =>
  Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));
const inward = (d) => {
  const opp = { N: "S", S: "N", W: "E", E: "W" }[d];
  return DIRS[opp];
};

// Door: north-facing (z-min) street face, nearest the middle of its run.
const northCells = cells.filter(([x, z]) => !has(x, z - 1));
let doorKey = null;
if (northCells.length) {
  const midX = northCells.reduce((s, c) => s + c[0], 0) / northCells.length;
  const best = northCells.reduce((b, c) =>
    Math.abs(c[0] - midX) < Math.abs(b[0] - midX) ? c : b);
  doorKey = key(best[0], best[1]);
}

// Pass 1: foundations, floors, interior air, roof deck, perimeter walls.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ex = exposed(x, z);
  if (ex.length === 0) {
    // Interior: ground floor slab, upper floor slab, roof deck. Air between.
    put(x, gr, z, "gray_concrete");
    if (STOREY >= gr) put(x, STOREY, z, "light_gray_concrete");
    if (ROOF >= gr) put(x, ROOF, z, "gray_concrete");
    continue;
  }

  // Perimeter wall column.
  const alongNS = ex.includes("N") || ex.includes("S");
  const idx = alongNS ? x : z;
  const win = [1, 2].includes(((idx % 4) + 4) % 4);
  const isDoor = key(x, z) === doorKey;

  for (let y = gr; y <= ROOF + 1; y++) {
    if (y === gr) {
      put(x, y, z, "polished_granite");
    } else if (y < STOREY) {
      // Shopfront ground floor.
      if (isDoor && (y === gr + 1 || y === gr + 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: "north",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (y === LINTEL) {
        put(x, y, z, "smooth_quartz");
      } else if (isDoor || win) {
        put(x, y, z, "light_blue_stained_glass");
      } else {
        put(x, y, z, "gray_concrete");
      }
    } else if (y === STOREY) {
      put(x, y, z, "smooth_quartz");           // storey band
    } else if (y <= 10) {
      // Upper floor: window grid with quartz frames top and bottom.
      if (win) {
        put(x, y, z, (y === 6 || y === 10) ? "smooth_quartz" : "light_blue_stained_glass");
      } else {
        put(x, y, z, "white_concrete");
      }
    } else if (y === ROOF) {
      put(x, y, z, "white_concrete");           // parapet
    } else if (y === ROOF + 1) {
      put(x, y, z, "smooth_quartz");            // parapet cap
    }
  }
}

// Pass 2: warm lights behind some window columns (air gap, lanterns hung
// from the floor slab above and the roof deck above).
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  if (ex.length === 0) continue;
  const alongNS = ex.includes("N") || ex.includes("S");
  const idx = alongNS ? x : z;
  if (((idx % 8) + 8) % 8 !== 1) continue;
  const [dx, dz] = inward(ex[0]);
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || exposed(ix, iz).length) continue;
  const igr = G.get(key(ix, iz));
  if (igr <= LINTEL) put(ix, LINTEL, iz, "lantern", { hanging: "true" });
  if (igr <= 10) put(ix, 10, iz, "lantern", { hanging: "true" });
}

// Pass 3: roof plant box, centred on the footprint, on the roof deck.
const cx = Math.round(W / 2), cz = Math.round(D / 2);
for (const [x, z, gr] of cells) {
  if (exposed(x, z).length) continue;
  if (Math.abs(x - cx) > 4 || Math.abs(z - cz) > 2) continue;
  if (gr > ROOF) continue;
  put(x, ROOF + 1, z, "light_gray_concrete");
  put(x, ROOF + 2, z, "light_gray_concrete");
  put(x, ROOF + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
