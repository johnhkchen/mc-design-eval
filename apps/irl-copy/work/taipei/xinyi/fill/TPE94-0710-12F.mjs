import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0710-12F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 67, H = 71, D = 23;
const ROOF = 59;          // roof slab top, from lidar
const SETBACK = 40;       // upper tier starts here (inset footprint)
const key = (x, z) => `${x},${z}`;

const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const fullSet = new Set(ground.keys());
const inset = new Set(
  cells.filter(([x, z]) => x >= 2 && x <= 64 && z >= 2 && z <= 20).map(([x, z]) => key(x, z))
);

const FACES = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const missingFaces = (x, z, set) =>
  FACES.filter(([, dx, dz]) => !set.has(key(x + dx, z + dz))).map(f => f[0]);

// entrance on the north (z = 0) face, centred on x = 33
const DOOR_X0 = 31, DOOR_X1 = 35;
const inDoor = (x, face) => face === "north" && x >= DOOR_X0 && x <= DOOR_X1;

const g = new Voxels([W, H, D]);

const pane = (x, y, z, face) => {
  const alongX = face === "north" || face === "south";
  g.set(x, y, z, "light_blue_stained_glass_pane", {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  });
};

for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF + 1; y++) {
    // terrace coping on the ring cells that the upper tier steps back from
    if (y === SETBACK - 1 && !inset.has(key(x, z))) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y >= SETBACK && !inset.has(key(x, z))) continue;

    const tier = y >= SETBACK ? inset : fullSet;
    const faces = missingFaces(x, z, tier);

    // roof and parapet
    if (y === ROOF) {
      g.set(x, y, z, faces.length ? "smooth_stone" : "gray_concrete");
      continue;
    }
    if (y > ROOF) {
      if (faces.length) g.set(x, y, z, "stone_bricks");
      continue;
    }

    // interior: floor slabs only, air between
    if (faces.length === 0) {
      if (y % 5 === 0 && y > 0) g.set(x, y, z, "white_concrete");
      continue;
    }

    // facade
    const face = faces[0];
    const along = (face === "north" || face === "south") ? x : z;
    const door = inDoor(x, face);
    const pier = face === "north" && (x === DOOR_X0 - 1 || x === DOOR_X1 + 1);

    if (y === gr) {
      g.set(x, y, z, "polished_granite");                 // base course
    } else if (y < 5) {                                    // shopfront storey
      if (y === 4) {
        // lintel over the entrance, white spandrel elsewhere
        g.set(x, y, z, door ? "smooth_quartz" : "white_concrete");
      } else if (door) {
        if (y === 3 && x === 33) {
          g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        }
        // else open entrance, air
      } else if (pier || (face === "north" && x >= DOOR_X0 - 2 && x <= DOOR_X1 + 2 && y <= 3)) {
        g.set(x, y, z, "polished_granite");               // door surround piers
      } else {
        pane(x, y, z, face);
      }
    } else if (y % 5 === 0 || y % 5 === 4) {               // floor line and spandrel
      g.set(x, y, z, "white_concrete");
    } else if (along % 3 === 0) {                          // dark mullion
      g.set(x, y, z, "gray_concrete");
    } else if (((x * 7 + y * 3 + z * 5) % 23) === 0) {
      g.set(x, y, z, "glowstone");                         // warm light behind glass
    } else {
      pane(x, y, z, face);
    }
  }
}

// roof crown: core on the roof, slender spire to the top of the volume
for (let x = 32; x <= 34; x++) {
  for (let z = 10; z <= 12; z++) {
    if (!inset.has(key(x, z))) continue;
    for (let y = ROOF + 1; y <= 63; y++) g.set(x, y, z, "light_gray_concrete");
  }
}
if (inset.has(key(33, 11))) {
  for (let y = 64; y <= 68; y++) g.set(33, y, 11, "light_gray_concrete");
  g.set(33, 69, 11, "sea_lantern");
}

g.save(`${DIR}/${ID}.nbt`);
