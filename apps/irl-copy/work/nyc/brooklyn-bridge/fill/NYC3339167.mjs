import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3339167.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3339167.nbt";

// 1967 Brooklyn Heights elevator walk-up: brick walk-up with a stone base,
// stone storey line and cornice, a grid of full glass windows between brick piers,
// a recessed stone-framed entrance on the south face, and a roof bulkhead.
const W = 9, H = 17, D = 5;
const g = new Voxels([W, H, D]);

const raw = JSON.parse(readFileSync(SRC, "utf8"));
const cells = Array.isArray(raw) ? raw : raw.cells;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const cm = new Map();
for (const [x, z, gnd, roof] of cells) {
  cm.set(`${x},${z}`, { gnd: clamp(Math.round(gnd), 0, 9), roof });
}
const has = (x, z) => cm.has(`${x},${z}`);

function faceOf(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

// pass 1: classify cells, find windows and the interior cells behind them
const info = new Map();
const pockets = new Map();
for (const [key] of cm) {
  const [x, z] = key.split(",").map(Number);
  const faces = faceOf(x, z);
  const corner = faces.length >= 2;
  const face = faces.length === 1 ? faces[0] : null;
  const idx = face === "N" || face === "S" ? x : z;
  const entrance = face === "S" && x === 4 && z === 4;
  const pillar = face === "S" && z === 4 && (x === 3 || x === 5);
  const windowCell = !!face && !corner && !entrance && !pillar && idx % 2 === 1;
  info.set(key, { x, z, faces, corner, face, idx, entrance, pillar, windowCell });

  if (windowCell) {
    let ix = x, iz = z;
    if (face === "N") iz = z + 1;
    else if (face === "S") iz = z - 1;
    else if (face === "W") ix = x + 1;
    else if (face === "E") ix = x - 1;
    const lit = (idx * 7 + face.charCodeAt(0)) % 3 === 0;
    const pk = `${ix},${iz}`;
    const prev = pockets.get(pk);
    pockets.set(pk, { lit: (prev && prev.lit) || lit });
  }
}

// pass 2: foundations and facade
for (const [key, c] of cm) {
  const cell = info.get(key);
  const { x, z } = cell;
  const gnd = c.gnd;

  for (let y = 0; y < gnd; y++) g.set(x, y, z, "stone_bricks");

  if (cell.faces.length === 0) continue;

  for (let r = 0; r <= 6; r++) {
    const y = gnd + r;
    let id = "bricks";
    let props;

    if (r === 0) id = "polished_granite";              // base course
    else if (r === 3) id = "smooth_stone";             // storey line
    else if (r === 5) id = "smooth_stone";             // cornice
    else if (r === 6) id = "bricks";                   // parapet
    else if (cell.windowCell && (r === 1 || r === 2 || r === 4)) id = "glass";

    if (cell.entrance) {
      if (r === 0) { id = "dark_oak_door"; props = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }; }
      else if (r === 1) { id = "dark_oak_door"; props = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }; }
      else if (r === 2) id = "smooth_stone";           // canopy
    }
    if (cell.pillar && (r === 1 || r === 2)) id = "polished_granite";

    g.set(x, y, z, id, props);
  }
}

// lantern beside the entrance, under the canopy, so the door reads at dusk
g.set(3, (cm.get("3,4")?.gnd ?? 0) + 1, 4, "lantern", { hanging: "false", waterlogged: "false" });
g.set(5, (cm.get("5,4")?.gnd ?? 0) + 1, 4, "lantern", { hanging: "false", waterlogged: "false" });

// pass 3: interior core, dark pockets behind glass, warm lights in some windows
for (let x = 1; x <= W - 2; x++) {
  for (let z = 1; z <= D - 2; z++) {
    const pk = pockets.get(`${x},${z}`);
    const gnd = cm.get(`${x},${z}`)?.gnd ?? 0;
    for (let r = 0; r <= 5; r++) {
      const y = gnd + r;
      let id = "stone";
      if (pk) {
        if (r === 1 || r === 2 || r === 4) id = pk.lit ? "glowstone" : "black_concrete";
        else if (r === 0 || r === 3) id = "black_concrete";
      }
      g.set(x, y, z, id);
    }
  }
}

// roof bulkhead on the interior roof deck
for (const [x, z] of [[5, 1], [6, 1], [5, 2], [6, 2]]) {
  const gnd = cm.get(`${x},${z}`)?.gnd ?? 0;
  g.set(x, gnd + 6, z, "light_gray_concrete");
}

g.save(OUT);
