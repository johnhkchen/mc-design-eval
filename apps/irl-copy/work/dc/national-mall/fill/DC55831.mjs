// 1711 11th St NW: a three-storey brick rowhouse of about 1900 with a stone base and cornice, converted to flats.
// Front and back are the street-facing walls: bays of glass panes on the odd columns, a door with a canopy on the
// front, and the two end walls are party walls (plain brick). Interior rows are air between the two walls.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC55831.cells.json", "utf8"));

const FOUNDATION = "stone_bricks", BASE = "stone_bricks", WALL = "bricks", CORNICE = "stone_bricks";
const GLASS = { name: "glass_pane", state: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" } };
const LIT = "glowstone";

const g = new Voxels([8, 17, 3]);
const footprint = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => footprint.has(`${x},${z}`);

// Lidar noise: the notch at (7,1) sits between two bay cells, so it is flattened to the bay tier.
const tiers = cells.map(([x, z, ground, roof]) => ({ x, z, ground, roof: x === 7 && z === 1 ? 5 : roof }));

// 1. Solid massing: foundation below the ground, base course, brick walls, cornice on top of each tier.
for (const { x, z, ground, roof } of tiers) {
  for (let y = 0; y < roof; y++) {
    if (y < ground) g.set(x, y, z, FOUNDATION);
    else if (y === 0) g.set(x, y, z, BASE);
    else if (y === roof - 1) g.set(x, y, z, CORNICE);
    else g.set(x, y, z, WALL);
  }
}

// 2. Interior: the middle row between the front and back walls is air for the storeys (not the base or the cornice),
//    kept closed at the ends by the party walls at x 0 and 7.
for (const { x, z, roof } of tiers) {
  if (z !== 1 || x < 1 || x > 6) continue;
  for (let y = 1; y <= roof - 2; y++) g.set(x, y, z, "air");
}

// 3. Street and rear walls: glass panes in the odd columns for the storeys under the cornice, piers of brick between.
const windowStoreys = (roof) => { const out = []; for (let y = 1; y <= roof - 2; y++) out.push(y); return out; };
for (const { x, z, roof } of tiers) {
  if (z !== 0 && z !== 2) continue;
  if (x % 2 === 0) continue;
  for (const y of windowStoreys(roof)) g.set(x, y, z, GLASS.name, GLASS.state);
}

// 4. Street entrance at x 2 on the z 2 face (the render's front): a door (two halves) on the base, and a dark wooden
//    canopy over it.
g.set(2, 1, 2, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(2, 2, 2, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(2, 3, 2, "dark_oak_stairs", { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" });

// 5. Warm lights in some windows (glowstone behind the glass line)
g.set(5, 1, 2, LIT);
g.set(3, 2, 2, LIT);
g.set(7, 3, 2, LIT);
g.set(1, 1, 0, LIT);

// 6. Roof equipment: two brick chimneys on the middle tier, capped with a slab, and a small plant box on the bay.
for (const x of [2, 5]) {
  g.set(x, 4, 1, WALL); g.set(x, 5, 1, WALL);
  g.set(x, 6, 1, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
g.set(6, 5, 2, "light_gray_concrete");

const result = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC55831.nbt");
console.log(JSON.stringify(result));
