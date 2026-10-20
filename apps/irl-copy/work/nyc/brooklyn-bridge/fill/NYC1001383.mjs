import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1001383.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1001383.nbt";
const W = 6, H = 17, D = 18;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// 1950 reinforced-concrete parking garage with a granite-like base.
const BASE = "stone_bricks";
const PIER = "white_concrete";
const SLAB = "light_gray_concrete";
const OPEN = "iron_bars";
const SIGN = "yellow_concrete";

const key = (x, z) => `${x},${z}`;
const inFoot = new Set(cells.map(([x, z]) => key(x, z)));
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Vehicle ramp mouth on the z=0 end, cells x 2..3, ground storey.
const isRamp = (x, z, y, g0) =>
  z === 0 && (x === 2 || x === 3) && (y === g0 || y === g0 + 1);
// Framing piers beside the ramp mouth.
const isRampFrame = (x, z, y, g0) =>
  z === 0 && (x === 1 || x === 4) && (y === g0 || y === g0 + 1);

const cellInfo = cells.map(([x, z, gr, rf]) => {
  const g0 = Math.round(gr);
  const R = Math.max(Math.round(rf), g0 + 4);
  return { x, z, g0, R };
});

for (const { x, z, g0, R } of cellInfo) {
  const top = R - 1;
  const hasW = inFoot.has(key(x - 1, z));
  const hasE = inFoot.has(key(x + 1, z));
  const hasN = inFoot.has(key(x, z - 1));
  const hasS = inFoot.has(key(x, z + 1));
  const edge = !(hasW && hasE && hasN && hasS);

  // Foundation up to this cell's ground.
  for (let y = 0; y < g0; y++) put(x, y, z, BASE);

  const onXFace = !hasW || !hasE;
  const onZFace = !hasN || !hasS;
  const index = onXFace && !onZFace ? z : onZFace && !onXFace ? x : x + z;
  const corner = onXFace && onZFace;
  const pier = corner || index % 3 === 0;
  const barProps = onXFace && !onZFace
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  for (let y = g0; y <= top; y++) {
    const off = y - g0;
    if (y === top) { put(x, y, z, SLAB); continue; }
    if (off > 0 && off % 2 === 0) { put(x, y, z, SLAB); continue; }
    if (!edge) continue;

    if (off === 0) {
      if (!isRamp(x, z, y, g0)) put(x, y, z, BASE);
      continue;
    }
    if (isRamp(x, z, y, g0)) continue;
    if (isRampFrame(x, z, y, g0)) { put(x, y, z, BASE); continue; }
    if (pier) put(x, y, z, PIER);
    else put(x, y, z, OPEN, barProps);
  }

  // Parapet with a stone cornice cap; yellow band on the entrance end.
  if (edge) {
    put(x, R, z, z === 0 ? SIGN : PIER);
    put(x, R + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Canopy over the ramp mouth: a stone slab shelf one row above the ground storey ceiling line.
for (const { x, z, g0 } of cellInfo) {
  if (z === 0 && (x === 1 || x === 2 || x === 3 || x === 4)) {
    put(x, g0 + 2, z - 0, SLAB);
  }
}

// Hanging warm lanterns under the ground-storey ceiling inside the ramp.
for (const { x, z, g0 } of cellInfo) {
  if (z === 1 && (x === 2 || x === 3)) {
    put(x, g0 + 1, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Standing roof lamps on the deck.
for (const { x, z, R } of cellInfo) {
  if (x === 2 && (z === 5 || z === 12)) {
    put(x, R, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Warm shroomlights behind a few upper-storey openings on the side faces.
for (const { x, z, g0 } of cellInfo) {
  const onWest = !inFoot.has(key(x - 1, z));
  const onEast = !inFoot.has(key(x + 1, z));
  if ((onWest || onEast) && z % 6 === 4 && x % 3 === 1) {
    put(x, g0 + 3, z, "shroomlight");
  }
}

g.save(OUT);
