import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075558";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 11 x 15, roof about 13 blocks above the lowest ground.
// Reading: a 1980s-style two-storey commercial/residential block in Xinyi,
// white concrete frame, stone-brick plinth and cornice, tinted glass bays,
// flat roof with parapet, water tank and a small shopfront entrance.
const W = 11, H = 25, D = 15;
const ROOF = 13;   // parapet top (absolute y)
const DECK = 12;   // roof deck (absolute y)
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const baseOf = (x, z) => Math.min(Math.max(ground.get(`${x},${z}`) | 0, 0), 8);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

const GLASS = "light_blue_stained_glass";
const FRAME = "white_concrete";
const PLINTH = "stone_bricks";
const STOREY = "smooth_stone";
const DECKB = "light_gray_concrete";
const FOUND = "stone";

// Entrance: on the z-max face, the cell nearest the middle of the width.
let doorX = null;
{
  const maxZ = Math.max(...cells.map(c => c[1]));
  const cand = cells.filter(c => c[1] === maxZ).map(c => c[0]);
  if (cand.length) doorX = cand.reduce((a, b) => (Math.abs(b - 5) < Math.abs(a - 5) ? b : a));
}
const doorZ = Math.max(...cells.map(c => c[1]));

// Pass 1: foundations, floor slabs, roof deck over every footprint cell.
for (const [x, z] of cells) {
  const base = baseOf(x, z);
  for (let y = 0; y < base; y++) put(x, y, z, FOUND);
  put(x, base, z, STOREY);       // ground floor slab
  put(x, base + 5, z, STOREY);   // second floor slab
  if (DECK > base + 5) put(x, DECK, z, DECKB);
}

// Pass 2: exterior shell on perimeter cells.
for (const [x, z] of cells) {
  const exX = !has(x - 1, z) || !has(x + 1, z);
  const exZ = !has(x, z - 1) || !has(x, z + 1);
  if (!exX && !exZ) continue;
  const corner = exX && exZ;
  const base = baseOf(x, z);
  const along = exZ ? x : z;          // coordinate varying along the exposed face
  const bayOdd = (along % 2) === 1;
  // inward offset for lights behind glass
  const dx = exX ? (has(x - 1, z) ? -1 : 1) : 0;
  const dz = exZ ? (has(x, z - 1) ? -1 : 1) : 0;
  const isDoorCell = doorX !== null && x === doorX && z === doorZ;

  put(x, base, z, PLINTH);
  for (let y = base + 1; y <= ROOF; y++) {
    const rel = y - base;
    let b = null, p = null;

    if (y === ROOF) {
      b = PLINTH;                                   // parapet cap
    } else if (y === DECK) {
      b = PLINTH;                                   // cornice band
    } else if (rel === 5) {
      b = STOREY;                                   // floor line
    } else if (rel === 4) {
      b = corner ? FRAME : (isDoorCell || (doorX !== null && Math.abs(x - doorX) <= 1 && z === doorZ)) ? "red_concrete" : STOREY;
    } else if (rel >= 1 && rel <= 3) {
      if (corner) b = FRAME;
      else if (isDoorCell) {
        b = "dark_oak_door";
        p = { facing: "south", half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
      }
      else if (bayOdd) b = GLASS;
      else b = FRAME;
    } else if (rel >= 6 && rel <= 11) {
      if (corner) b = FRAME;
      else if (bayOdd && rel >= 7 && rel <= 10) b = GLASS;
      else b = FRAME;
    }

    if (b === null) continue;
    if (p) put(x, y, z, b, p); else put(x, y, z, b);
  }

  // Warm light behind some upper-floor glass (in the air gap inside the shell).
  if (!corner) {
    const lit = ((along + (exZ ? z : x)) % 3) === 0;
    if (lit && base + 8 <= ROOF - 1) {
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz)) put(ix, base + 8, iz, "glowstone");
    }
  }
}

// Entrance canopy: the door cell and its neighbours at the storey-line row.
if (doorX !== null) {
  for (const dxx of [-1, 0, 1]) {
    const cx = doorX + dxx;
    if (has(cx, doorZ)) {
      const base = baseOf(cx, doorZ);
      put(cx, base + 4, doorZ, "red_concrete");
    }
  }
}

// Roof: water tank (2x2, three high) and a small plant unit, all on the deck.
const tankCells = [[3, 5], [4, 5], [3, 6], [4, 6]];
if (tankCells.every(([x, z]) => has(x, z) && baseOf(x, z) + 5 < DECK)) {
  for (const [x, z] of tankCells) {
    for (let y = DECK + 1; y <= DECK + 3; y++) put(x, y, z, FRAME);
    put(x, DECK + 4, z, "gray_concrete");
  }
}
if (has(8, 3) && baseOf(8, 3) + 5 < DECK) {
  put(8, DECK + 1, 3, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
