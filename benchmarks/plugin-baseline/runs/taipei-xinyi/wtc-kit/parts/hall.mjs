// Exhibition Hall 1 (plot 1): main hall box, north block, west/east fringes, NW walkway, south pier-and-bay front with
// the lit porch entrance, the arcade canopy and porch, the frieze lettering, flags, skylights and roof plant.
// Coordinates are kit-local (plan.md, Plot 1). The footprint and ground come from site.json (cell 7, x0 93).
import { readFileSync } from "node:fs";
import { plinth_fill, arcade_pier, flag_pole, skylight_strip, ahu_box, lamp_post, roof_light, rng } from "../vocab.mjs";
import { plaque } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  HALL_BODY, HALL_GLASS, DARK_BACKING, COOL_LIGHT, WARM_LIGHT, LOBBY_GLASS, PAVING, PAVING_SLAB,
  STONE_COPING, STONE_COPING_SLAB, PALE_QUARTZ, RAIL,
} from "../vocab.mjs";

const site = JSON.parse(readFileSync(new URL("../site.json", import.meta.url), "utf8"));
const P1 = site.plots[1];

// Footprint lookup: the ground level of a '#' cell, or null off the footprint.
function cell(x, z) {
  const c = Math.floor((x - P1.x0) / P1.cell), r = Math.floor((z - P1.z0) / P1.cell);
  if (r < 0 || c < 0 || r >= P1.footprint.length || c >= P1.footprint[r].length) return null;
  return P1.footprint[r][c] === "#" ? P1.ground[r][c] : null;
}
const inFp = (x, z) => cell(x, z) !== null;

export function build(g) {
  const R = rng(93);
  const put = (x, y, z, block, opts) => g.set(x, y, z, block, opts);
  const box = (a, b, block) => g.fill(a, b, block);
  // Perimeter ring of a rectangle [x0, z0, x1, z1] at height y.
  const ring = (x0, z0, x1, z1, y, block) => {
    box([x0, y, z0], [x1, y, z0], block);
    box([x0, y, z1], [x1, y, z1], block);
    box([x0, y, z0], [x0, y, z1], block);
    box([x1, y, z0], [x1, y, z1], block);
  };

  // ---- plinths (fill down to the site ground, clipped to the footprint) ----
  plinth_fill(g, [156, 0, 35, 365, 2, 258], cell, PAVING, {});
  plinth_fill(g, [212, 0, 0, 372, 2, 34], cell, PAVING, {});
  // the rim cells come out as bottom slabs: lay full blocks on the top course so the walls above stand on whole blocks
  for (const [x0, z0, x1, z1] of [[156, 35, 365, 258], [212, 0, 372, 34]]) {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (inFp(x, z)) put(x, 2, z, PAVING);
  }

  // ---- main hall: hollow box, hall floor y 3, roof deck y 40 ----
  shellBox([156, 3, 35], [365, 40, 258], HALL_BODY);
  // cornice (1 proud at y 37), parapet 41..42 and coping at y 43
  ring(155, 34, 366, 259, 37, PALE_QUARTZ);
  ring(156, 35, 365, 258, 41, HALL_BODY);
  ring(156, 35, 365, 258, 42, HALL_BODY);
  ring(156, 35, 365, 258, 43, STONE_COPING_SLAB);

  // ---- south front: piers every 7 from x 163, bays between, lit porch entrance ----
  const FRIEZE = (x, y) => x >= 183 && x <= 345 && y >= 29 && y <= 35;
  const porch = (x) => x >= 240 && x <= 281;
  const lobby = (x, y) => x >= 245 && x <= 276 && y <= 20;
  for (let x = 163; x <= 365; x++) {
    const pier = (x - 163) % 7 < 2;
    for (let y = 3; y <= 36; y++) {
      if (lobby(x, y)) {
        put(x, y, 258, LOBBY_GLASS);
        put(x, y, 257, WARM_LIGHT);
        continue;
      }
      if (pier) {
        put(x, y, 258, HALL_BODY);
        if (!porch(x) && !FRIEZE(x, y)) put(x, y, 259, STONE_COPING);
        continue;
      }
      if (FRIEZE(x, y)) {
        put(x, y, 258, HALL_BODY);
        continue;
      }
      if (y === 14 || y === 25) {
        put(x, y, 258, HALL_BODY);
        continue;
      }
      put(x, y, 258, HALL_GLASS);
      const r = R();
      put(x, y, 257, r < 0.2 ? COOL_LIGHT : r < 0.35 ? WARM_LIGHT : DARK_BACKING);
    }
  }
  // frieze lettering band: the plaque stands raised on z 259 (the frieze is HALL_BODY on z 258 above)
  plaque(g, "TAIPEI WORLD TRADE CENTER", { at: [183, 29, 259], face: "south", width: 163, height: 7, material: "black_concrete" });

  // ---- north block: same skin, roof deck y 36, plain frieze ----
  shellBox([212, 3, 0], [372, 36, 34], HALL_BODY);
  ring(212, 0, 372, 34, 37, HALL_BODY);
  ring(212, 0, 372, 34, 38, HALL_BODY);
  ring(212, 0, 372, 34, 39, STONE_COPING_SLAB);

  // ---- west and east fringe service bays (flat roof y 12) ----
  const walkway = new Set();
  for (let x = 100; x <= 148; x++) for (let z = 35; z <= 76; z++) {
    if (!inFp(x, z)) continue;
    const h = cell(x, z);
    walkway.add(`${x},${z}`);
    for (let y = h; y <= 2; y++) put(x, y, z, PAVING);
    put(x, 3, z, PAVING);
  }
  for (const k of walkway) {
    const [x, z] = k.split(",").map(Number);
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !walkway.has(`${x + dx},${z + dz}`));
    if (edge) put(x, 4, z, RAIL);
  }
  for (let x = 110; x <= 140; x += 10) for (let z = 36; z <= 76; z++) {
    if (walkway.has(`${x},${z}`) && !walkway.has(`${x},${z + 1}`)) { lamp_post(g, x, 4, z); break; }
  }
  for (let x = 135; x <= 386; x++) for (let z = 35; z <= 258; z++) {
    if ((x >= 135 && x <= 155) || (x >= 366 && x <= 386)) {
      if (!inFp(x, z) || walkway.has(`${x},${z}`)) continue;
      const h = cell(x, z);
      for (let y = h; y <= 12; y++) put(x, y, z, y === 12 ? STONE_COPING_SLAB : HALL_BODY);
    }
  }

  // ---- south arcade: canopy deck y 22..24, quartz piers 2x2 at z 263 ----
  for (let k = 0; k <= 28; k++) arcade_pier(g, 163 + 7 * k, 263, { y0: 3, y1: 21 });
  box([163, 22, 259], [365, 24, 265], STONE_COPING);
  ring(163, 259, 365, 265, 22, PALE_QUARTZ);
  ring(163, 259, 365, 265, 23, PALE_QUARTZ);
  ring(163, 259, 365, 265, 24, PALE_QUARTZ);
  for (let x = 163; x <= 365; x += 4) put(x, 22, 262, WARM_LIGHT);

  // ---- entrance porch: deck y 23..26 on 4 piers, fascia on the south and east/west ends ----
  box([240, 23, 259], [281, 25, 272], STONE_COPING);
  box([240, 26, 259], [281, 26, 272], PALE_QUARTZ);
  ring(240, 259, 281, 272, 23, PALE_QUARTZ);
  for (let x = 240; x <= 281; x += 4) put(x, 23, 266, WARM_LIGHT);
  arcade_pier(g, 240, 261, { y0: 3, y1: 22 });
  arcade_pier(g, 279, 261, { y0: 3, y1: 22 });
  arcade_pier(g, 240, 270, { y0: 3, y1: 22 });
  arcade_pier(g, 279, 270, { y0: 3, y1: 22 });

  // ---- flags on the porch edge ----
  const colours = ["red", "white", "blue"];
  [244, 250, 256, 262, 268, 274, 280].forEach((x, i) => flag_pole(g, x, 271, colours[i % 3]));

  // ---- roof: skylight strips, AHU plant, sea-lantern roof lights ----
  for (const z0 of [60, 100, 140, 180, 220]) skylight_strip(g, 170, 350, z0, { deckY: 40, over: [HALL_BODY] });
  for (const [x, z] of [[180, 80], [230, 80], [280, 80], [180, 190], [230, 190], [280, 190]]) ahu_box(g, x, z, { y: 41 });
  for (let x = 160; x <= 364; x += 12) for (let z = 45; z <= 250; z += 12) roof_light(g, x, 41, z);
  for (let x = 218; x <= 368; x += 12) for (let z = 4; z <= 30; z += 12) roof_light(g, x, 37, z);

  function shellBox(a, b, block) {
    const [x0, y0, z0] = a, [x1, y1, z1] = b;
    box([x0, y0, z0], [x1, y0, z1], block);
    box([x0, y1, z0], [x1, y1, z1], block);
    box([x0, y0, z0], [x1, y1, z0], block);
    box([x0, y0, z1], [x1, y1, z1], block);
    box([x0, y0, z0], [x0, y1, z1], block);
    box([x1, y0, z0], [x1, y1, z1], block);
  }
}
