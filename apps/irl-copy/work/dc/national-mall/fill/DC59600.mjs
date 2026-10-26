// DC59600: 1611 4th St NW (Shaw), a religious building on a 7 x 10 footprint, flat lidar roof 4 blocks above y 0.
// A two-tier brick box on a stone plinth: stone quoins and piers, glass-pane window bays with warm glowstone behind some,
// a dark-oak door in a stone surround on the street (z 0) face, a stone cornice band at the roof line, and a stone cross
// on the street parapet. Interior is an air gap (no furniture) with a floor slab at y 0 and the roof slab at y 3.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59600.cells.json", "utf8"));

const X = 7, Z = 10, ROOF = Math.max(...cells.map((c) => c[3]));      // ROOF = 4: the parapet top is at y 4 (roof surface)
const g = new Voxels([X, 16, Z]);
const foot = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFoot = (x, z) => foot.has(`${x},${z}`);
const ground = Object.fromEntries(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));

// Each footprint cell: solid from its ground up to the roof (here ground 0, roof 4), so nothing floats.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const top = cells.find((c) => c[0] === x && c[1] === z)[3];
  for (let y = ground[`${x},${z}`]; y < top; y++) {
    // the plinth course (y 0) is stone and every ring cell from y 0 up is wall; interior cells are air above the floor
    const ring = x === 0 || x === X - 1 || z === 0 || z === Z - 1;
    if (y === 0) { g.set(x, y, z, ring ? "stone_bricks" : "smooth_stone"); continue; }
    if (y === top - 1) { g.set(x, y, z, ring ? "stone_bricks" : "smooth_stone"); continue; }   // cornice band and roof slab
    if (!ring) continue;                                                                       // air gap: no interior
    const corner = (x === 0 || x === X - 1) && (z === 0 || z === Z - 1);
    if (corner) { g.set(x, y, z, "stone_bricks"); continue; }
    if (z === 0) {                                                                             // street face
      if (x === 3) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (x === 2 || x === 4) { g.set(x, y, z, "stone_bricks"); continue; }                    // stone surround for the door
      g.set(x, y, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }); continue;
    }
    if (z === Z - 1) {                                                                         // back face
      if (x === 2 || x === 4) { g.set(x, y, z, "bricks"); continue; }
      g.set(x, y, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }); continue;
    }
    // side faces (x 0 and x 6): brick, two window bays, a stone pier pair in the middle
    if (z === 1 || z === Z - 2) { g.set(x, y, z, "bricks"); continue; }
    if (z === 4 || z === 5) { g.set(x, y, z, "stone_bricks"); continue; }
    g.set(x, y, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
  }
}

// Warm light behind some glass (interior air cells next to the window, top row), and a hanging lantern in the nave.
for (const [x, y, z] of [[1, 2, 1], [5, 2, 1], [1, 2, 3], [5, 2, 6], [3, 2, 8]]) g.set(x, y, z, "glowstone");
g.set(3, 2, 4, "lantern", { hanging: "true", waterlogged: "false" });

// Cornice band at the roof line on the street face gets a stone cross over the door: pier, bar, stem.
for (const [x, y] of [[2, 4], [3, 4], [4, 4], [2, 5], [3, 5], [4, 5], [3, 6]]) g.set(x, y, 0, "chiseled_stone_bricks");

// Roof: two rooftop vents on the back of the flat roof, and a lantern on the street parapet beside the cross.
g.set(1, ROOF, 7, "iron_block");
g.set(5, ROOF, 7, "iron_block");
g.set(1, ROOF + 1, 7, "lightning_rod");
g.set(5, ROOF + 1, 7, "lightning_rod");

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59600.nbt");
console.log(JSON.stringify(stats));
