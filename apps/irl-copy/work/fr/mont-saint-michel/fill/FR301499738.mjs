import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499738";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 27, D = 11;
const g = new Voxels([W, H, D]);

// ---- footprint lookup ----
const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, gr, rf] of cells) cell.set(key(x, z), { gr, rf });
const has = (x, z) => cell.has(key(x, z));

// ---- massing: 1965 residential, 3 storeys of 5 blocks, flat roof ----
const grounds = [...cell.values()].map(c => c.gr);
const roofs = [...cell.values()].map(c => c.rf).sort((a, b) => a - b);
const maxG = Math.max(...grounds);
let top = Math.round(roofs[Math.floor(roofs.length / 2)]);
top = Math.max(top, maxG + 15);
top = Math.min(top, 23);

// outward directions: N = z-1, S = z+1, W = x-1, E = x+1
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
function exteriorFaces(x, z) {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!has(x + dx, z + dz)) out.push(name);
  }
  return out;
}

// Windows on even positions 2..8 along each face; odd positions are stone piers
function windowOn(face, x, z) {
  const pos = (face === "N" || face === "S") ? x : z;
  return pos >= 2 && pos <= 8 && pos % 2 === 0;
}

// ---- entrance: exterior cell on the south face nearest the middle, else nearest mid-face cell ----
let DOOR = null;
{
  const cands = cells
    .map(([x, z]) => [x, z, exteriorFaces(x, z)])
    .filter(([, , f]) => f.length > 0)
    .sort((a, b) => {
      const sa = a[2].includes("S") ? 0 : 1, sb = b[2].includes("S") ? 0 : 1;
      if (sa !== sb) return sa - sb;
      return (Math.abs(a[0] - 5) + Math.abs(a[1] - 10)) - (Math.abs(b[0] - 5) + Math.abs(b[1] - 10));
    });
  if (cands.length) {
    const [x, z, f] = cands[0];
    DOOR = { x, z, face: f.includes("S") ? "S" : f[0] };
  }
}

// ---- build each footprint cell ----
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const { gr } = cell.get(key(x, z));
  const faces = exteriorFaces(x, z);
  const perim = faces.length > 0;
  const face = faces[0];

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // is this perimeter cell a pier (corner or odd position) rather than a window bay?
  const pierCell = perim && face && !windowOn(face, x, z);

  for (let y = gr; y < top; y++) {
    const rel = y - gr;
    const k = Math.floor(rel / 5);
    const r = rel % 5;

    if (perim) {
      const isWin = face && windowOn(face, x, z) && k < 3 && r >= 1 && r <= 3;
      if (isWin) {
        const alongEW = (face === "N" || face === "S");
        const props = alongEW
          ? { north: "false", south: "false", east: "true", west: "true" }
          : { north: "true", south: "true", east: "false", west: "false" };
        g.set(x, y, z, "glass_pane", props);
      } else if (r === 0) {
        // storey band course, a shade lighter than the wall
        g.set(x, y, z, "smooth_stone");
      } else if (pierCell) {
        // piers and corners in darker stone for vertical rhythm
        g.set(x, y, z, "stone_bricks");
      } else {
        g.set(x, y, z, "stone");
      }
    } else {
      // interior: floor slab per storey, air otherwise
      if (r === 0) g.set(x, y, z, "smooth_stone");
    }
  }

  // warm lights behind some windows
  if (perim && face && windowOn(face, x, z)) {
    for (let k = 0; k < 3; k++) {
      const base = gr + 5 * k;
      if (base + 2 >= top) continue;
      if ((x + z + k) % 3 === 0) {
        const [dx, dz] = DIRS[face];
        const ix = x - dx, iz = z - dz;
        if (has(ix, iz)) g.set(ix, base + 2, iz, "glowstone");
      }
    }
  }

  // roof deck
  g.set(x, top, z, "smooth_stone");

  // flat stone cornice on perimeter (no battlements, 1965 block)
  if (perim) {
    g.set(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// ---- entrance ----
if (DOOR) {
  const { x, z, face } = DOOR;
  const gr = cell.get(key(x, z)).gr;
  const dir = { N: "north", S: "south", E: "east", W: "west" }[face];
  const dprops = (half) => ({
    facing: dir, half, hinge: "left", open: "false", powered: "false",
  });
  g.set(x, gr, z, "oak_door", dprops("lower"));
  g.set(x, gr + 1, z, "oak_door", dprops("upper"));
  // stone surround over the door
  g.set(x, gr + 2, z, "stone_bricks");
  g.set(x, gr + 3, z, "smooth_stone");
  // lantern just inside the entrance
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz;
  if (has(ix, iz) && gr + 3 < top) {
    g.set(ix, gr + 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// ---- roof plant: two AC cabinets on the deck ----
for (const [x, z] of [[3, 3], [7, 7]]) {
  if (has(x, z)) {
    g.set(x, top + 1, z, "light_gray_concrete");
    g.set(x, top + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
