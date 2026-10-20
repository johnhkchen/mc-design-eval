import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 世貿新城: 1990s Taipei commercial office block. Light reinforced-concrete frame,
// white concrete piers, light-blue tinted glazing in a 3-cell bay grid, stone plinth,
// stone-slab cornice, and a central plant core on the roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245240";
const W = 19, H = 52, D = 26;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inF = (x, z) => ground.has(`${x},${z}`);
const B = Math.max(...ground.values());          // common floor line (plinth top)

// Storey count: 5-block storeys, up to 8, keeping roof and plant inside y<=50.
const N = Math.max(1, Math.min(8, Math.floor((46 - B) / 5)));
const TOP = B + 5 * N;                            // roof slab level

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const midX = Math.floor((minX + maxX) / 2);

const missing = (x, z) => ({
  w: !inF(x - 1, z), e: !inF(x + 1, z), n: !inF(x, z - 1), s: !inF(x, z + 1),
});
const isEdge = (x, z) => { const m = missing(x, z); return m.w || m.e || m.n || m.s; };

// 1. Foundation: solid from y 0 up to the floor line under every footprint cell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < B; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Storeys: slab at floor line, perimeter piers + glazing, air behind glass.
for (let k = 0; k < N; k++) {
  const y0 = B + 5 * k;
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    // floor slab for the storey
    g.set(x, y0, z, k === 0 ? "smooth_stone" : "light_gray_concrete");

    if (!isEdge(x, z)) {
      // interior: air gap, occasional warm light behind the glass line
      if (((x * 7 + z * 3 + k * 5) % 11) === 0) g.set(x, y0 + 2, z, "shroomlight");
      continue;
    }

    const m = missing(x, z);
    const horiz = m.w || m.e;   // exposed on an east/west face
    const vert = m.n || m.s;    // exposed on a north/south face
    const corner = horiz && vert;
    const idx = horiz ? z : x;  // position along the facade
    const mullion = corner || idx % 3 === 0;

    for (let dy = 1; dy <= 4; dy++) {
      let b;
      if (k === 0 && dy === 1) b = "gray_concrete";              // plinth course
      else if (corner || mullion) b = "white_concrete";          // piers
      else if (dy === 1) b = "light_gray_concrete";              // spandrel
      else b = "light_blue_stained_glass";                       // glazing
      g.set(x, y0 + dy, z, b);
    }
  }
}

// 3. Roof slab, parapet and cornice.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  g.set(x, TOP, z, "light_gray_concrete");
  if (isEdge(x, z)) {
    g.set(x, TOP + 1, z, "white_concrete");
    g.set(x, TOP + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

// 4. Central plant core and lightning rod on the roof.
const coreX0 = minX + 4, coreX1 = maxX - 4;
const coreZ0 = minZ + 5, coreZ1 = maxZ - 5;
for (let x = coreX0; x <= coreX1; x++) {
  for (let z = coreZ0; z <= coreZ1; z++) {
    if (!inF(x, z)) continue;
    const ring = x === coreX0 || x === coreX1 || z === coreZ0 || z === coreZ1;
    g.set(x, TOP + 1, z, ring ? "light_gray_concrete" : "gray_concrete");
    g.set(x, TOP + 2, z, ring ? "light_gray_concrete" : "iron_bars");
  }
}
const cx = Math.round((coreX0 + coreX1) / 2), cz = Math.round((coreZ0 + coreZ1) / 2);
if (inF(cx, cz)) {
  for (let dy = 3; dy <= 4; dy++) g.set(cx, TOP + dy, cz, "iron_bars");
  g.set(cx, TOP + 5, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// 5. Entrance on the north face: double dark-oak doors with a stone-stair canopy line inside.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (z === minZ && !inF(x, z - 1) && Math.abs(x - midX) <= 0) {
    g.set(x, B + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, B + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, B + 3, z, "white_concrete");
    g.set(x, B + 4, z, "white_concrete");
    // warm lantern light flanking the door inside the entrance bay
    if (inF(x - 1, z)) g.set(x - 1, B + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    if (inF(x + 1, z)) g.set(x + 1, B + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
