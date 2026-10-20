import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540883623.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540883623.nbt";

// Low-rise two-storey Taipei commercial block, c. 1970s-80s: white rendered
// concrete, light grey string courses, stone-brick base, glazed shopfront,
// upper-floor punched windows, cornice and parapet, a few lit windows.
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 10, H = 23, D = 4;
const v = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));
const exposed = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});

// Pick the street-facing door: lowest-x cell on the north-exposed face,
// falling back to any exposed cell.
let doorKey = null;
{
  const cand = cells
    .filter(([x, z]) => {
      const e = exposed(x, z);
      return e.N || e.S || e.W || e.E;
    })
    .sort((a, b) => {
      const ea = exposed(a[0], a[1]), eb = exposed(b[0], b[1]);
      const na = ea.N ? 0 : 1, nb = eb.N ? 0 : 1;
      if (na !== nb) return na - nb;
      return a[0] - b[0] || a[1] - b[1];
    });
  if (cand.length) doorKey = key(cand[0][0], cand[0][1]);
}

for (const [x, z, gr] of cells) {
  const e = exposed(x, z);
  const zWall = e.N || e.S;          // wall runs along x
  const xWall = e.W || e.E;          // wall runs along z
  const exp = zWall || xWall;
  const corner = zWall && xWall;
  const idx = zWall ? x : z;
  const pier = corner || idx % 2 === 0;
  const isDoor = key(x, z) === doorKey;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) v.set(x, y, z, "stone_bricks");

  // Base course / ground floor slab.
  v.set(x, gr, z, exp ? "stone_bricks" : "smooth_stone");

  // Interior cells: solid core so no slab hangs in air (no interiors modelled).
  if (!exp) {
    for (let y = gr + 1; y <= gr + 10; y++) v.set(x, y, z, "smooth_stone");
    continue;
  }

  const paneProps = zWall
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Ground storey: glazed shopfront, corner piers, door, lintel over door.
  if (isDoor) {
    const facing = e.N ? "north" : e.S ? "south" : e.W ? "west" : "east";
    v.set(x, gr + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    v.set(x, gr + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    v.set(x, gr + 3, z, "white_concrete");
  } else {
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (corner) v.set(x, y, z, "white_concrete");
      else v.set(x, y, z, "glass_pane", paneProps);
    }
  }
  v.set(x, gr + 4, z, "stone_bricks");          // shopfront lintel band

  // Floor line between storeys.
  v.set(x, gr + 5, z, "light_gray_concrete");

  // Upper storey: piers and punched windows with sill and head frames.
  if (pier) {
    for (let y = gr + 6; y <= gr + 8; y++) v.set(x, y, z, "white_concrete");
  } else {
    v.set(x, gr + 6, z, "light_gray_concrete");          // sill
    const lit = ((idx + (zWall ? z : x)) % 4) === 1;     // some windows lit warm
    if (lit) v.set(x, gr + 7, z, "glowstone");
    else v.set(x, gr + 7, z, "glass_pane", paneProps);
    v.set(x, gr + 8, z, "light_gray_concrete");          // head
  }

  // Cornice and parapet.
  v.set(x, gr + 9, z, "light_gray_concrete");
  v.set(x, gr + 10, z, "white_concrete");

  // Corner lanterns on the parapet for dusk read.
  if (corner) v.set(x, gr + 11, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Small roof plant unit on the interior, nearest the centre.
{
  const interior = cells.filter(([x, z]) => {
    const e = exposed(x, z);
    return !(e.N || e.S || e.W || e.E);
  });
  if (interior.length) {
    const [x, z, gr] = interior.sort(
      (a, b) => Math.abs(a[0] - W / 2) + Math.abs(a[1] - D / 2) - (Math.abs(b[0] - W / 2) + Math.abs(b[1] - D / 2))
    )[0];
    v.set(x, gr + 11, z, "iron_block");
  }
}

v.save(OUT);
