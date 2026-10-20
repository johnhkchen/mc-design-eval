import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339854465";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 10 x 11. Roof surface at y = 7 (about 7 blocks above lowest ground).
// Read as a 1970s-80s Taipei concrete commercial block: shopfront ground storey,
// one upper storey of windows, a storey line, and a stone-brick parapet.
const W = 10, H = 19, D = 11;
const ROOF_DECK = 6;   // top of the roof slab; parapet sits on it (top surface y = 7)
const STOREY_LINE = 3; // floor slab between ground and upper storey
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr | 0);
const has = (x, z) => G.has(`${x},${z}`);
const ground = (x, z) => G.get(`${x},${z}`);

function faces(x, z) {
  return { n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) };
}

// Inward neighbour for a face (where the room behind the glass is).
function inward(x, z, face) {
  if (face === "n") return [x, z + 1];
  if (face === "s") return [x, z - 1];
  if (face === "w") return [x + 1, z];
  return [x - 1, z];
}

// Entrance: a south-face cell nearest the centre, on the lowest ground.
let entrance = null;
{
  let best = Infinity;
  for (const [x, z, gr] of cells) {
    if (!faces(x, z).s || gr > 1) continue;
    const d = Math.abs(x - 4.5);
    if (d < best) { best = d; entrance = [x, z]; }
  }
}

const doorProps = (half) => ({
  facing: "south", half, hinge: "left", open: "false", powered: "false",
});

for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  const faceCount = [f.n, f.s, f.w, f.e].filter(Boolean).length;
  const exterior = faceCount > 0;
  const isCorner = faceCount >= 2;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Storey line / floor slab between ground and upper storey.
  if (gr <= STOREY_LINE) g.set(x, STOREY_LINE, z, "light_gray_concrete");

  // Roof deck across the whole footprint.
  g.set(x, ROOF_DECK, z, "light_gray_concrete");

  // Face the cell belongs to (for pattern index).
  let face = null;
  if (f.s) face = "s";
  else if (f.n) face = "n";
  else if (f.w) face = "w";
  else if (f.e) face = "e";
  const u = (face === "n" || face === "s") ? x : z;

  // Roof equipment on interior roof cells (sits on the deck, top at y 7).
  if (!exterior && (x * 3 + z) % 5 === 0) {
    g.set(x, ROOF_DECK + 1, z, "light_gray_concrete");
  }

  if (!exterior) continue;

  // Parapet ring on the roof deck.
  g.set(x, ROOF_DECK + 1 - 1 + 0, z, "stone_brick_wall"); // y = 6 handled below

  for (let y = Math.max(gr, 0); y <= 5; y++) {
    if (y === STOREY_LINE) {
      g.set(x, y, z, isCorner ? "white_concrete" : "smooth_stone");
      continue;
    }

    if (isCorner) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    if (y <= 2) {
      // Ground storey: shopfront.
      if (y === 0) {
        g.set(x, y, z, "stone_bricks"); // base course
        continue;
      }
      if (u % 3 === 0) {
        g.set(x, y, z, "white_concrete"); // pillar
      } else {
        g.set(x, y, z, "glass");
        if (y === 1 && u % 3 === 1) {
          const [ix, iz] = inward(x, z, face);
          if (has(ix, iz) && ground(ix, iz) <= 1) g.set(ix, y, iz, "shroomlight");
        }
      }
    } else {
      // Upper storey: window grid with frames.
      if (u % 2 === 1) {
        g.set(x, y, z, "light_blue_stained_glass_pane");
        if (y === 4 && u % 4 === 1) {
          const [ix, iz] = inward(x, z, face);
          if (has(ix, iz)) g.set(ix, y, iz, "glowstone");
        }
      } else {
        g.set(x, y, z, "white_concrete");
      }
    }
  }

  // Parapet on the roof edge (y = 6), stone brick wall.
  g.set(x, ROOF_DECK, z, "stone_brick_wall");
}

// Entrance door and canopy light on the south facade.
if (entrance) {
  const [ex, ez] = entrance;
  const gr = ground(ex, ez);
  g.set(ex, gr, ez, "dark_oak_door", doorProps("lower"));
  g.set(ex, gr + 1, ez, "dark_oak_door", doorProps("upper"));
  if (gr === 0) {
    g.set(ex, 2, ez, "lantern", { hanging: "true" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
