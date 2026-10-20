import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-area commercial block, c. 1980s: two-and-a-half storeys of
// white-tiled concrete over a stone plinth, ground-floor shopfront glazing, a
// stone cornice, a central street entrance and a rooftop water tank.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772098872";
const W = 14, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const inb = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, b, p) => {
  if (!inb(x, y, z)) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const base = Math.min(...cells.map(c => c[2]));   // lowest ground
const TOP = base + 10;                            // top course of parapet / roof slab (11 blocks above base)

const GLASS = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };

// entrance: a north-facing (street) exposed cell nearest the middle of the front
const front = cells
  .filter(([x, z]) => !has(x, z - 1))
  .sort((a, b) => Math.abs(a[0] - 6.5) - Math.abs(b[0] - 6.5));
const ent = front.length ? front[0] : null;

for (const [x, z, gy] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const per = edge(x, z);

  for (let y = gy; y <= TOP; y++) {
    const r = y - base;

    if (per) {
      // exterior shell
      if (y === gy) {
        put(x, y, z, "stone_bricks");                              // plinth course
      } else if (r === 4 || r === 5) {
        put(x, y, z, "smooth_stone");                              // storey lines
      } else if (r === 10) {
        put(x, y, z, "stone_bricks");                              // cornice / parapet cap
      } else if (r >= 1 && r <= 3) {
        // ground storey: shopfront glazing with piers
        if ((x + z) % 4 === 0) put(x, y, z, "white_concrete");
        else put(x, y, z, "glass_pane", GLASS);
      } else if (r >= 6 && r <= 8) {
        // upper storey: window grid with mullions
        if ((x + z) % 3 === 0) put(x, y, z, "white_concrete");
        else put(x, y, z, "glass_pane", GLASS);
      } else {
        // parapet body, sills
        put(x, y, z, "white_concrete");
      }
    } else {
      // interior: floor slabs and roof only, air between
      if (y === gy) {
        put(x, y, z, "light_gray_concrete");                       // ground floor slab
      } else if (r === 5) {
        put(x, y, z, "light_gray_concrete");                       // upper floor slab
      } else if (r === 10) {
        put(x, y, z, "gray_concrete");                             // roof slab
      } else if (r === 2 && (x * 3 + z * 5) % 5 === 0) {
        // warm light inside the ground-floor shopfront bay
        const nearShell = edge(x - 1, z) || edge(x + 1, z) || edge(x, z - 1) || edge(x, z + 1);
        if (nearShell) put(x, y, z, "lantern", LANTERN);
      } else if (r === 7 && (x * 5 + z * 3) % 5 === 0) {
        // warm light in the upper storey
        const nearShell = edge(x - 1, z) || edge(x + 1, z) || edge(x, z - 1) || edge(x, z + 1);
        if (nearShell) put(x, y, z, "lantern", LANTERN);
      }
    }
  }
}

// street entrance: two-block door and a glazed transom above
if (ent) {
  const [ex, ez, eg] = ent;
  put(ex, eg + 1, ez, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, eg + 2, ez, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(ex, eg + 3, ez, "glass_pane", GLASS);
  // lit entrance lantern beside the door on the plinth-level air
  if (has(ex - 1, ez) && eg + 1 < H) put(ex - 1, eg + 1, ez, "lantern", { hanging: "false", waterlogged: "false" });
}

// rooftop water tank (typical of Taipei roofs), on an interior roof cell near the middle
const roofCells = cells
  .filter(([x, z, gy]) => !edge(x, z) && gy <= TOP)
  .sort((a, b) => (Math.abs(a[0] - 6.5) + Math.abs(a[1] - 7.5)) - (Math.abs(b[0] - 6.5) + Math.abs(b[1] - 7.5)));
if (roofCells.length) {
  const [tx, tz] = roofCells[0];
  put(tx, TOP + 1, tz, "smooth_stone");
  put(tx, TOP + 2, tz, "smooth_stone");
  put(tx, TOP + 3, tz, "smooth_stone_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
