import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000026.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000026.nbt";
const W = 17, H = 32, D = 16;
const MAX_TOP = 28;

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const arr = Array.isArray(raw) ? raw : (raw.cells ?? []);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Footprint map: "x,z" -> { x, z, g: ground, top: roof deck y }
const fp = new Map();
for (const c of arr) {
  const [x, z, gr, rf] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  const g = clamp(Math.round(Number(gr) || 0), 0, 24);
  const r = Number.isFinite(Number(rf)) ? Math.round(Number(rf)) : g + 10;
  const top = clamp(r, g + 5, MAX_TOP);
  fp.set(`${x},${z}`, { x, z, g, top });
}
const has = (x, z) => fp.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Floor/spandrel lines: ground storey is 3 high, then 2-high storeys.
const isDeck = (cell, y) => {
  if (y === cell.top) return true;
  const rel = y - cell.g;
  return rel >= 3 && rel % 2 === 1 && y < cell.top;
};

// Pass 1: foundations, base plinth and floor decks
for (const cell of fp.values()) {
  const { x, z, g: gr, top } = cell;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  for (let y = gr; y <= top; y++) {
    if (isDeck(cell, y)) put(x, y, z, "smooth_stone");
  }
}

// Pass 2: perimeter walls with brick piers, framed windows, shopfront, cornice
const glowTargets = [];
for (const cell of fp.values()) {
  const { x, z, g: gr, top } = cell;
  const n = !has(x, z - 1), s = !has(x, z + 1), w = !has(x - 1, z), e = !has(x + 1, z);
  if (!(n || s || w || e)) continue;
  const corner = (n || s) && (w || e);
  const idx = (n || s) ? x : z;
  // Piers every third bay; the ground storey gets a narrower pier rhythm for a shopfront
  const groundPier = idx % 2 === 0;

  for (let y = gr; y < top; y++) {
    if (isDeck(cell, y)) continue;
    const rel = y - gr;
    let id;
    if (rel === 0) id = "stone_brick_slab";                    // base course, projecting lip
    else if (y === top - 1) id = "stone_bricks";                // cornice course
    else if (y === top - 2) id = "smooth_stone";                // cornice band
    else if (rel <= 2) {                                        // ground storey
      id = (corner || groundPier) ? "dark_oak_planks" : "glass";
    } else {                                                     // upper storeys
      const pier = corner || idx % 3 === 0;
      id = pier ? "bricks" : "light_gray_stained_glass";
    }
    put(x, y, z, id, id === "stone_brick_slab" ? { type: "top", waterlogged: "false" } : undefined);
  }

  // Parapet cap
  put(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Warm lights behind some upper-storey windows
  const pierUpper = corner || idx % 3 === 0;
  if (!pierUpper && idx % 6 === 2 && top - gr > 5) {
    let ix = x, iz = z;
    if (n) iz = z + 1; else if (s) iz = z - 1; else if (w) ix = x + 1; else if (e) ix = x - 1;
    if (has(ix, iz)) glowTargets.push([ix, gr + 4, iz]);
  }
}
for (const [x, y, z] of glowTargets) put(x, y, z, "glowstone");

// Pass 3: roof equipment (penthouse and mechanical boxes) on interior roof cells
for (const cell of fp.values()) {
  const { x, z, top } = cell;
  const perimeter = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  if (perimeter) continue;
  if (x % 6 === 3 && z % 6 === 3 && top + 2 < H) {
    put(x, top + 1, z, "light_gray_concrete");
    put(x, top + 2, z, "light_gray_concrete");
  }
  if (x % 6 === 3 && z % 6 === 3 && top + 2 < H) {
    put(x, top + 1, z, "iron_block");
  }
}

// Pass 4: street entrance on the north face, near the middle, with a recessed portal
{
  let best = null;
  for (const cell of fp.values()) {
    const { x, z, g: gr } = cell;
    if (has(x, z - 1)) continue;
    const d = Math.abs(x - 8);
    if (!best || d < best.d) best = { d, x, z, gr };
  }
  if (best) {
    const { x, z, gr } = best;
    // Flanking stone jambs
    for (const dx of [-1, 1]) {
      if (has(x + dx, z)) {
        put(x + dx, gr + 1, z, "stone_bricks");
        put(x + dx, gr + 2, z, "stone_bricks");
      }
    }
    put(x, gr + 1, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, gr + 2, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Lantern hangs from the storey line above the door
    put(x, gr + 2, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    if (has(x, z + 1)) put(x, gr + 3, z + 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(OUT);
