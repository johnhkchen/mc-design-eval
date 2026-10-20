import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833531";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 21;
const ROOF_Y = 11;      // roof surface / cornice course, about 11 blocks above lowest ground
const DECK_Y = 10;      // top floor slab, under the roof
const LINE_Y = 5;       // storey line between the two storeys
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground height
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const inside = (x, z) => gmap.has(`${x},${z}`);
const isRing = (x, z) =>
  inside(x, z) && (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1));

const doorProps = (half, hinge) => ({
  facing: "north", half, hinge, open: "false", powered: "false",
});

// Pass 1: foundations, floors, roof deck, structural columns
for (const [x, z, gr] of cells) {
  const ring = isRing(x, z);

  // Foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground-level floor slab (sits on the foundation)
  g.set(x, gr, z, ring ? "polished_granite" : "smooth_stone");

  if (gr >= DECK_Y) continue; // no room for a body under the roof

  // Storey line floor slab (interior only; ring gets the band in pass 2)
  if (!ring && gr < LINE_Y) g.set(x, LINE_Y, z, "smooth_stone");

  // Top floor deck and roof surface (interior)
  if (!ring) {
    g.set(x, DECK_Y, z, "smooth_stone");
    g.set(x, ROOF_Y, z, "gray_concrete");
  }

  // Structural columns on a 5-block grid, interior only, resting on the ground floor
  if (!ring && x % 5 === 0 && z % 5 === 0) {
    for (let y = gr + 1; y <= DECK_Y; y++) g.set(x, y, z, "stone_bricks");
  }
}

// Pass 2: facade on the perimeter ring
for (const [x, z, gr] of cells) {
  if (!isRing(x, z)) continue;
  if (gr >= DECK_Y) continue;

  const onNS = z === 0 || z === 20;
  const side = onNS ? x : z;
  const pillar = side % 3 === 0;
  const isSouthFront = z === 20;

  // Cornice and parapet
  g.set(x, ROOF_Y, z, "smooth_quartz");
  g.set(x, DECK_Y, z, "white_concrete");

  // Storey line band
  if (LINE_Y > gr) g.set(x, LINE_Y, z, "smooth_quartz");

  // Ground storey: shopfront glazing with pillars and a central entrance
  for (let y = gr + 1; y <= 4; y++) {
    if (y >= LINE_Y) break;
    let id = pillar ? "smooth_quartz" : "glass";
    g.set(x, y, z, id);
  }

  // Entrance on the south (Xinyi road) frontage
  if (isSouthFront && x === 10 && gr + 2 <= 4) {
    g.set(x, gr + 1, z, "oak_door", doorProps("lower", "left"));
    g.set(x, gr + 2, z, "oak_door", doorProps("upper", "left"));
  }

  // Upper storey: pillars, spandrels, glazed windows
  for (let y = LINE_Y + 1; y <= DECK_Y - 1; y++) {
    if (y >= ROOF_Y) break;
    if (pillar) {
      g.set(x, y, z, "smooth_quartz");
    } else if (y === LINE_Y + 1 || y === DECK_Y - 1) {
      g.set(x, y, z, "white_concrete");           // spandrel above and below each window
    } else {
      g.set(x, y, z, "light_blue_stained_glass_pane");
    }
  }

  // Warm glowstone lamps set two blocks behind some upper windows, sitting on the storey floor
  if (!pillar && (side % 6 === 1)) {
    let dx = 0, dz = 0;
    const edgeX = x === 0 ? 1 : x === 20 ? -1 : 0;
    const edgeZ = z === 0 ? 1 : z === 20 ? -1 : 0;
    if (edgeX !== 0 && edgeZ === 0) dx = edgeX * 2;
    if (edgeZ !== 0 && edgeX === 0) dz = edgeZ * 2;
    const bx = x + dx, bz = z + dz;
    if ((dx || dz) && inside(bx, bz) && !isRing(bx, bz) && bx % 5 !== 0 && bz % 5 !== 0) {
      g.set(bx, LINE_Y + 1, bz, "glowstone");
    }
  }
}

// Pass 3: rooftop plant room with a parapet-level slab
const cx0 = 8, cx1 = 12, cz0 = 8, cz1 = 12;
for (let x = cx0; x <= cx1; x++) {
  for (let z = cz0; z <= cz1; z++) {
    if (!inside(x, z)) continue;
    g.set(x, 12, z, "light_gray_concrete");
    g.set(x, 13, z, "light_gray_concrete");
    g.set(x, 14, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
