import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499665";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, H = 25, D = 12;
const g = new Voxels([W, H, D]);

// Footprint membership
const inFp = new Set(cells.map(c => c[0] + "," + c[1]));
const has = (x, z) => inFp.has(x + "," + z);

// Palette: 1991 commercial, render/stone facade, dark oak shopfront
const WALL = "smooth_stone";
const BASE = "stone_bricks";
const FLOOR = "smooth_stone";
const GLASS = "glass";
const FRAME = "stone_bricks";
const SHOP_FRAME = "dark_oak_planks";
const CORNICE = "stone_brick_slab";
const HVAC = "light_gray_concrete";

const STOREY = 5;

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const clampGround = gr0 => Math.max(0, Math.min(H - 8, Math.round(gr0)));
const clampRoof = (roof0, gr) => Math.max(gr + STOREY, Math.min(H - 4, Math.round(roof0)));

// Pass 1: structure per footprint cell
for (const [x, z, gr0, roof0] of cells) {
  const gr = clampGround(gr0);
  const roof = clampRoof(roof0, gr);

  const westFace = !has(x - 1, z);
  const eastFace = !has(x + 1, z);
  const northFace = !has(x, z - 1);
  const southFace = !has(x, z + 1);
  const perim = westFace || eastFace || northFace || southFace;
  const corner = (westFace || eastFace) && (northFace || southFace);

  const xFace = westFace || eastFace;
  const p = xFace ? z : x;

  // Foundation from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  // Floor slabs at each storey line, roof deck at top
  for (let y = gr; y < roof; y += STOREY) put(x, y, z, FLOOR);
  put(x, roof - 1, z, FLOOR);

  if (!perim) continue;

  // Perimeter walls, windows, spandrels
  for (let y = gr + 1; y < roof; y++) {
    const rel = y - gr;
    const k = Math.floor(rel / STOREY);
    const local = rel % STOREY;
    if (local === 0) continue;

    if (corner) {
      put(x, y, z, BASE);
      continue;
    }
    if (local === 4) {
      // Spandrel course; a thin base band marks each storey line
      put(x, y, z, k === 0 ? SHOP_FRAME : WALL);
      continue;
    }

    // Local 1..3: window band
    const mullion = p % 2 === 0;
    if (k === 0) {
      put(x, y, z, mullion ? SHOP_FRAME : GLASS);
    } else {
      put(x, y, z, mullion ? FRAME : GLASS);
    }
  }

  // Continuous cornice: a bottom slab ledge on top of the perimeter wall
  // (replaces the crenellated wall caps, which read as battlements)
  put(x, roof, z, CORNICE, { type: "bottom", waterlogged: "false" });
}

// Pass 2: entrance on the south face, with a dark oak surround and transom
const doorX = 3, doorZ = 11;
if (has(doorX, doorZ)) {
  const gr = clampGround(cells.find(c => c[0] === doorX && c[1] === doorZ)[2]);
  const lower = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
  const upper = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
  // Clear the opening cells first so the door reads cleanly
  put(doorX, gr + 1, doorZ, "oak_door", lower);
  put(doorX, gr + 2, doorZ, "oak_door", upper);
  // Transom glass above the door
  put(doorX, gr + 3, doorZ, GLASS);
  // Dark oak surround on each side of the door
  for (const dx of [-1, 1]) {
    const xx = doorX + dx;
    if (has(xx, doorZ)) {
      put(xx, gr + 1, doorZ, SHOP_FRAME);
      put(xx, gr + 2, doorZ, SHOP_FRAME);
    }
  }
  // Lintel band across the shopfront head
  put(doorX, gr + 4, doorZ, SHOP_FRAME);
}

// Pass 3: warm lights behind glass, roof HVAC boxes
for (const [x, z, gr0, roof0] of cells) {
  const gr = clampGround(gr0);
  const roof = clampRoof(roof0, gr);
  const westFace = !has(x - 1, z);
  const eastFace = !has(x + 1, z);
  const northFace = !has(x, z - 1);
  const southFace = !has(x, z + 1);
  const perim = westFace || eastFace || northFace || southFace;
  const corner = (westFace || eastFace) && (northFace || southFace);

  if (perim && !corner) {
    const xFace = westFace || eastFace;
    const p = xFace ? z : x;
    let dx = 0, dz = 0;
    if (westFace) dx = 1;
    else if (eastFace) dx = -1;
    else if (northFace) dz = 1;
    else if (southFace) dz = -1;
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && p % 4 === 1) {
      for (let y = gr + 2; y < roof - 1; y += STOREY) {
        put(ix, y, iz, "glowstone");
      }
    }
  }

  // Roof equipment on the interior of the roof deck
  if (!perim && ((x === 2 && z === 4) || (x === 5 && z === 7))) {
    put(x, roof, z, HVAC);
    put(x, roof + 1, z, HVAC);
  }
}

g.save(`${DIR}/${ID}.nbt`);
