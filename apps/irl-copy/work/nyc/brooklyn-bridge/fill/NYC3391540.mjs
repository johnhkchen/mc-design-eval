import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3391540";
const W = 22, H = 44, D = 21;
const STOREY = 4;

// ---- load footprint cells: [x, z, ground, roof] ----
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
function norm(c) {
  if (Array.isArray(c)) return { x: c[0], z: c[1], g: c[2], r: c[3] };
  return { x: c.x, z: c.z, g: c.ground ?? c.g ?? 0, r: c.roof ?? c.r ?? 0 };
}
const rawList = Array.isArray(raw) ? raw : (raw.cells ?? raw.footprint ?? Object.values(raw));

const cells = new Map();
for (const c0 of rawList) {
  const c = norm(c0);
  const x = Math.round(c.x), z = Math.round(c.z);
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const g = Math.max(0, Math.round(c.g));
  const rr = Math.round(c.r);
  const levels = Math.max(2, Math.round((rr - g) / STOREY));
  cells.set(`${x},${z}`, { x, z, g, levels, top: 0 });
}
const has = (x, z) => cells.has(`${x},${z}`);

// ---- smooth massing: snap cells near the dominant roof level to one flat roof ----
const tally = new Map();
for (const c of cells.values()) {
  const k = c.g + STOREY * c.levels;
  tally.set(k, (tally.get(k) ?? 0) + 1);
}
let mainTop = 0, best = -1;
for (const [k, n] of tally) if (n > best) { best = n; mainTop = k; }
mainTop = Math.min(mainTop, 36);
for (const c of cells.values()) {
  const raw0 = c.g + STOREY * c.levels;
  // within two storeys of the main roof: same flat roof; otherwise a genuine lower wing
  c.top = Math.abs(raw0 - mainTop) <= 2 * STOREY ? Math.max(c.g + 2 * STOREY, mainTop) : Math.min(raw0, 36);
  c.top = Math.min(c.top, 36);
}

// outward face of an edge cell (null for interior)
function outward(x, z) {
  if (!has(x, z - 1)) return [0, -1];
  if (!has(x, z + 1)) return [0, 1];
  if (!has(x - 1, z)) return [-1, 0];
  if (!has(x + 1, z)) return [1, 0];
  return null;
}
const FACE = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };

const g = new Voxels([W, H, D]);

// ---- entrance: north-facing edge cell nearest the centre of the street face ----
let doorCell = null, doorScore = Infinity;
for (const c of cells.values()) {
  const o = outward(c.x, c.z);
  if (!o) continue;
  const pref = o[0] === 0 && o[1] === -1 ? 0 : 100;
  const score = pref + Math.abs(c.x - W / 2);
  if (score < doorScore) { doorScore = score; doorCell = { ...c, o }; }
}
const doorKey = doorCell ? `${doorCell.x},${doorCell.z}` : null;

for (const c of cells.values()) {
  const { x, z, g: gr, top } = c;
  const out = outward(x, z);
  const edge = out !== null;

  // foundation fill up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // body
  for (let y = gr; y < top; y++) {
    if (y === top - 1) {
      g.set(x, y, z, "smooth_stone"); // roof deck, solid everywhere
      continue;
    }
    const rel = y - gr;
    const s = Math.floor(rel / STOREY);
    const py = rel % STOREY;
    if (!edge) {
      if (py === 0) g.set(x, y, z, "smooth_stone"); // interior floor slab
      continue;
    }
    const t = out[0] !== 0 ? z : x;
    const groundFloor = s === 0;
    if (py === 0) {
      g.set(x, y, z, "stone_bricks"); // belt course / sill line
    } else if (py === 1 || py === 2) {
      // ground floor: wider shopfront glass; upper floors: punched windows
      const isGlass = groundFloor ? (t % 3 !== 0) : (t % 3 === 1);
      if (isGlass) {
        g.set(x, y, z, "glass_pane");
        if (py === 1 && !groundFloor && (t + s * 2) % 4 === 0) {
          const ix = x - out[0], iz = z - out[1];
          if (has(ix, iz)) g.set(ix, y, iz, "glowstone");
        }
        if (py === 1 && groundFloor && t % 6 === 1) {
          const ix = x - out[0], iz = z - out[1];
          if (has(ix, iz)) g.set(ix, y, iz, "glowstone");
        }
      } else {
        g.set(x, y, z, "bricks");
      }
    } else {
      g.set(x, y, z, "bricks"); // spandrel
    }
  }

  // parapet cap on edges
  if (edge) g.set(x, top, z, "stone_bricks");

  // a few chimney stacks, two blocks square, on interior roof cells
  if (!edge && (x % 6 === 2) && (z % 6 === 2) && top + 2 < H) {
    for (let y = top; y < top + 2; y++) g.set(x, y, z, "bricks");
    g.set(x, top + 2, z, "stone_brick_slab", { type: "bottom" });
  }
}

// ---- entrance: opening, stone surround and lintel on the street face ----
if (doorCell) {
  const { x, z, g: gr, o } = doorCell;
  const facing = FACE[`${o[0]},${o[1]}`];
  const ix = x - o[0], iz = z - o[1];
  // flank cells along the wall (perpendicular to the outward face)
  const px = o[0] !== 0 ? 0 : 1, pz = o[0] !== 0 ? 1 : 0;
  for (const side of [-1, 1]) {
    const fx = x + side * px, fz = z + side * pz;
    if (has(fx, fz)) {
      for (let y = gr; y < gr + 4; y++) g.set(fx, y, fz, "stone_bricks");
    }
  }
  // clear the interior at the door so it opens into a room
  if (has(ix, iz)) {
    g.set(ix, gr, iz, "air");
    g.set(ix, gr + 1, iz, "air");
  }
  g.set(x, gr, z, "oak_door", {
    facing, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, gr + 1, z, "oak_door", {
    facing, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // lintel over the door opening
  g.set(x, gr + 2, z, "stone_bricks");
  g.set(x, gr + 3, z, "stone_bricks");
  // warm light inside the entrance
  if (has(ix, iz)) g.set(ix, gr + 2, iz, "lantern", { hanging: "true" });
}

g.save(`${DIR}/${ID}.nbt`);
