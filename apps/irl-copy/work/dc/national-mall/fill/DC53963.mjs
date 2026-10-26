import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1500 New Hampshire Ave NW (Dupont Circle): a 1920s masonry hotel, brick over a stone base with stone string courses,
// a cornice and parapet, a stone-framed window grid, a recessed entrance on the avenue face (z = 0) and a rooftop of
// plant boxes. The lidar roof heights are flattened into five tiers, each a whole number of 3-block storeys plus a cap.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC53963";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 27, D = 34;
const g = new Voxels([W, H, D]);

// lidar roof -> tier top (y of the roof surface): 3-4 one-storey wing, 5-6 two storeys, 11-12 lower wings,
// 13 the main block, 14-15 the two towers on their podiums
const tier = (r) => (r <= 4 ? 4 : r <= 6 ? 6 : r <= 12 ? 12 : r === 13 ? 13 : 15);

const cellMap = new Map();
for (const [x, z, gr, roof] of cells) cellMap.set(`${x},${z}`, { gr: Math.max(0, gr), T: tier(roof) });
const cell = (x, z) => cellMap.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const openSides = (x, z) => DIRS.filter(([dx, dz]) => !cell(x + dx, z + dz));
const exposed = (x, z) => openSides(x, z).length > 0;
const corner = (x, z) => openSides(x, z).length >= 2;

// a glass pane connects to a neighbour only where that neighbour is a solid wall at this height
const solidAt = (x, y, z) => { const c = cell(x, z); return !!c && y >= c.gr && y < c.T && exposed(x, z); };
const paneProps = (x, y, z) => ({
  north: String(solidAt(x, y, z - 1)), south: String(solidAt(x, y, z + 1)),
  east: String(solidAt(x + 1, y, z)), west: String(solidAt(x - 1, y, z)), waterlogged: "false",
});

const BRICK = "bricks";
const STONE = "stone_bricks";
const CORNICE = "smooth_stone";
const DECK = "stone";
const GLASS = "white_stained_glass_pane";
const SHOP = "light_blue_stained_glass_pane";
const DOOR_X = 7;          // the avenue entrance: a door at x = 7, lobby glass beside it, a lintel canopy over x 6..9
const STOREY = 3;

for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const { gr, T } = cell(x, z);
  const ex = exposed(x, z);
  const cor = corner(x, z);

  // foundation: solid from y 0 up to this cell's ground, so nothing floats on the slope
  for (let y = 0; y < gr; y++) g.set(x, y, z, STONE);

  // interior: roof deck and one floor slab per storey, air between (no interiors)
  if (!ex) {
    for (let y = gr; y < T; y++) {
      if (y === T - 1) g.set(x, y, z, DECK);
      else if (y % STOREY === 0 && y > gr) g.set(x, y, z, CORNICE);
    }
    continue;
  }

  // exposed shell
  for (let y = gr; y < T; y++) {
    // cornice course under the parapet
    if (y === T - 1) { g.set(x, y, z, CORNICE); continue; }

    // entrance: door lower and upper half on the avenue face, in the ground storey
    if (z === 0 && x === DOOR_X && y <= gr + 1) {
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    // canopy: a dark lintel band over the entrance, on the avenue face
    if (z === 0 && x >= 6 && x <= 9 && y === gr + 2 && y < T - 1) { g.set(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" }); continue; }

    // base course (the plinth), then the string course at every storey line
    if (y === gr) { g.set(x, y, z, STONE); continue; }
    if (y % STOREY === 0) { g.set(x, y, z, CORNICE); continue; }

    // corners and every third column are stone piers framing the windows
    if (cor || (x + z) % 3 === 0) { g.set(x, y, z, STONE); continue; }

    // ground storey: shopfront glass; above it, window glass, with a warm lit window now and then
    if (y < STOREY) { g.set(x, y, z, SHOP, paneProps(x, y, z)); continue; }
    if ((x * 7 + y * 5 + z * 3) % 12 === 0) { g.set(x, y, z, "glowstone"); continue; }
    g.set(x, y, z, GLASS, paneProps(x, y, z));
  }

  // parapet cap on the outer ring
  g.set(x, T, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// hotel roof plant: three boxes on the main roof, standing on the deck, all within footprint interior
for (const [bx, bz] of [[3, 10], [5, 15], [3, 20]]) {
  const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => { const c = cell(bx + dx, bz + dz); return c && !exposed(bx + dx, bz + dz) && c.T === 13; });
  if (!ok) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    g.set(bx + dx, 13, bz + dz, "light_gray_concrete");
    g.set(bx + dx, 14, bz + dz, "light_gray_concrete");
    g.set(bx + dx, 15, bz + dz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
