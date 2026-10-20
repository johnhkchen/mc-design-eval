import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi commercial block, c. 1980s: two storeys of white tile over a granite-look plinth,
// dark glass shopfront at grade, glass window bands above with white piers, grey roof deck,
// parapet, rooftop plant. Roof parapet sits ~11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833561";
const W = 18, H = 23, D = 20;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = Array.isArray(raw) ? raw : raw.cells;

const vox = new Voxels([W, H, D]);
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const B = Math.min(...cells.map((c) => c[2]));   // lowest ground under the footprint
const fl = B + 5;     // first/second storey line (floor slab)
const deck = B + 9;   // roof deck (top of second storey)
const par = B + 10;   // parapet course, ~11 blocks above lowest ground

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "east", dx: 1, dz: 0 },
  { n: "west", dx: -1, dz: 0 },
];
const sidesOf = (x, z) => DIRS.filter((d) => !ground.has(key(x + d.dx, z + d.dz)));

function set(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
}

// Entrance: a north-facing perimeter cell nearest the middle of the north edge.
const northOnly = cells.filter(([x, z]) => {
  const s = sidesOf(x, z);
  return s.length === 1 && s[0].n === "north";
});
const northAny = cells.filter(([x, z]) => sidesOf(x, z).some((s) => s.n === "north"));
const pool = (northOnly.length ? northOnly : northAny).slice();
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const cx = (minX + maxX) / 2;
pool.sort((a, b) => a[1] - b[1] || Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
const [ex, ez] = pool[0] ?? [cells[0][0], cells[0][1]];

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  const sides = sidesOf(x, z);
  const perim = sides.length > 0;

  // Roof deck and first-storey floor slab over every footprint cell that reaches them.
  if (gr <= deck) set(x, deck, z, "gray_concrete");
  if (gr <= fl && gr < deck) set(x, fl, z, "smooth_stone");

  if (!perim) {
    // Interior: air (no interiors), roof plant on the deck only.
    if (x % 5 === 2 && z % 5 === 2 && gr <= deck) set(x, par, z, "iron_block");
    continue;
  }

  // Parapet course on the roof edge.
  if (gr <= deck) set(x, par, z, "white_concrete");

  // Facade. Corners carry piers; otherwise piers every 3 blocks along the facade.
  const primary = sides[0];
  const horizontal = primary.dz !== 0;      // north/south facade: coordinate is x
  const coord = horizontal ? x : z;
  const corner = sides.length > 1;
  const pier = corner || coord % 3 === 0;

  for (let y = gr; y < deck; y++) {
    if (y === fl) continue;

    if (y < fl) {
      // Ground storey: granite plinth, shopfront glass, fascia.
      if (y === gr) {
        set(x, y, z, "stone_bricks");
        continue;
      }
      const shop = y >= gr + 1 && y <= gr + 2 && y <= fl - 2;
      const doorAdj = primary.n === "north" && z === ez && Math.abs(x - ex) <= 1;

      if (shop) {
        if (doorAdj && x === ex) {
          const half = y === gr + 1 ? "lower" : "upper";
          set(x, y, z, "oak_door", {
            facing: "north", half, hinge: "left", open: "false", powered: "false",
          });
        } else if (doorAdj && y === gr + 2 && Math.abs(x - ex) === 1) {
          // Hanging lantern under the canopy beside the door.
          set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        } else {
          set(x, y, z, pier ? "white_concrete" : "glass");
        }
      } else if (y === gr + 3 && doorAdj) {
        set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      } else {
        set(x, y, z, "white_concrete");
      }
    } else {
      // Upper storey: window bands between white piers.
      set(x, y, z, pier ? "white_concrete" : "glass");
      if (!pier && y === fl + 2 && coord % 6 === 1) {
        // Warm light in the air gap behind the glass, one room in a few.
        const ix = x - primary.dx, iz = z - primary.dz;
        if (ground.has(key(ix, iz))) set(ix, y, iz, "glowstone");
      }
    }
  }
}

// Upper door half is handled above; save the structure.
vox.save(`${DIR}/${ID}.nbt`);
