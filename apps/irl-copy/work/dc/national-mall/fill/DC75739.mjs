import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1401 11th St NW: a c.1905 Flemish-bond brick flats block (Logan Circle era), three-bay-deep, 2 storeys over a
// stone plinth, stone string course at the storey line, stone parapet, a dark flat roof, and a rear penthouse
// stair volume that the lidar rises to 6. Front (x=0) faces 11th St; x=1 is the stair/hall core with air behind glass.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75739.cells.json", "utf8"));
const g = new Voxels([3, 18, 10]);

const BASE = "stone_bricks", WALL = "bricks", TRIM = "smooth_stone", ROOF = "deepslate_tiles", GLASS = "glass_pane";
const PANE = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);
const onFoot = new Set(cells.map(([x, z]) => `${x},${z}`));
const roofAt = new Map(cells.map(([x, z, gr, r]) => [`${x},${z}`, r]));

// facade rhythm along z (1..9 on the outer faces)
const FRONT = { 1: "quoin", 2: "win", 3: "win", 4: "pier", 5: "door", 6: "win", 7: "pier", 8: "win", 9: "quoin" };
const REAR = { 1: "quoin", 2: "win", 3: "win", 4: "pier", 5: "win", 6: "win", 7: "pier", 8: "win", 9: "quoin" };

function face(x, z, kind, rear) {
  const y = (lo, hi, b, s) => { for (let yy = lo; yy <= hi; yy++) put(x, yy, z, b, s); };
  // plinth on every cell
  put(x, 0, z, BASE);
  if (kind === "quoin") { y(1, 4, TRIM); }
  else if (kind === "pier") { y(1, 2, WALL); put(x, 3, z, TRIM); put(x, 4, z, WALL); }
  else if (kind === "win") {
    y(1, 2, GLASS, PANE); y(3, 4, GLASS, PANE);
    if (rear && z >= 7) { put(x, 3, z, WALL); put(x, 4, z, WALL); }   // solid under the penthouse
  }
  else if (kind === "door") {
    put(x, 1, z, "oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, z, "oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, 3, z, TRIM);                                   // canopy over the door
    put(x, 4, z, GLASS, PANE);                            // transom
  }
  // parapet on the outer faces
  if (!(rear && z >= 7)) put(x, 5, z, TRIM);
}

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const key = `${x},${z}`;
  if (x === 0) face(0, z, FRONT[z], false);
  else if (x === 2) {
    if (z >= 7) { // penthouse: a stair volume rising to 6 on the rear
      put(2, 0, z, BASE);
      for (let yy = 1; yy <= 4; yy++) put(2, yy, z, WALL);
      put(2, 5, z, WALL);
      if (z === 8) put(2, 5, z, GLASS, PANE);
    } else face(2, z, REAR[z], true);
  } else {
    // x = 1: stair/hall core
    put(1, 0, z, BASE);
    if (z === 0 || z === 9) { for (let yy = 1; yy <= 3; yy++) put(1, yy, z, WALL); put(1, 5, z, TRIM); }
    else { put(1, 3, z, WALL); }                          // floor slab between the storeys
    put(1, 4, z, ROOF);                                   // flat roof deck
  }
}

// the storey air gap behind the front and rear glass is the x=1 core, lit by lanterns hung from the floor slab
put(1, 2, 2, "lantern", { hanging: "true", waterlogged: "false" });
put(1, 2, 6, "lantern", { hanging: "true", waterlogged: "false" });
put(1, 2, 8, "lantern", { hanging: "true", waterlogged: "false" });
put(1, 1, 5, "lantern", { hanging: "false", waterlogged: "false" });   // vestibule behind the door

// roof: a brick stack on the deck
put(1, 5, 6, WALL); put(1, 6, 6, TRIM);

const res = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75739.nbt");
console.log(res);
