import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Footprint 27 x 12, roof about 11 blocks above lowest ground.
// Read as a two-storey, early-1990s Taipei commercial block: white tiled concrete
// walls, pale quartz cornice, blue-tint glazing, a shopfront on the street (z = 0) face
// and a red awning. Storeys are 5 blocks; parapet tops out at F+11, F = lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020174";
const W = 27, H = 23, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));
const F = Math.min(...cells.map((c) => c[2]));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Glass pane whose connections run along the wall it sits in.
const pane = (alongX) =>
  alongX
    ? ["light_blue_stained_glass_pane", { north: "false", south: "false", east: "true", west: "true" }]
    : ["light_blue_stained_glass_pane", { north: "true", south: "true", east: "false", west: "false" }];

// Street face is z = 0 (front). Pick the door column nearest x = 13 on that face.
let doorX = null, doorGround = null;
for (const [x, z, gr] of cells) {
  if (z !== 0) continue;
  if (doorX === null || Math.abs(x - 13) < Math.abs(doorX - 13)) {
    doorX = x;
    doorGround = gr;
  }
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");

  const exp = {
    front: !has(x, z - 1),
    back: !has(x, z + 1),
    left: !has(x - 1, z),
    right: !has(x + 1, z),
  };
  const perim = exp.front || exp.back || exp.left || exp.right;

  // Ground-level surface under the cell.
  put(x, gr, z, perim ? "polished_granite" : "light_gray_concrete");

  if (!perim) {
    // Interior: air between floors, with a floor slab per storey.
    for (let y = gr + 1; y <= F + 11; y++) {
      if (y === F + 5 || y === F + 10) put(x, y, z, "light_gray_concrete");
    }
    // Rooftop air-conditioning plant on the roof deck.
    if ((x >= 5 && x <= 7 && z >= 4 && z <= 6) || (x >= 19 && x <= 21 && z >= 4 && z <= 6)) {
      if (gr <= F + 10) {
        put(x, F + 11, z, "smooth_stone");
        put(x, F + 12, z, "smooth_stone_slab", { type: "bottom" });
      }
    }
    continue;
  }

  // Facade face used for the bay pattern. Street face wins on corners.
  const face = exp.front ? "front" : exp.back ? "back" : exp.left ? "left" : "right";
  const alongX = face === "front" || face === "back";
  const idx = alongX ? x : z;
  const pier = idx % 3 === 0;
  const isFront = face === "front";

  for (let y = gr + 1; y <= F + 11; y++) {
    let id = "white_concrete";
    let props = null;

    if (y <= F + 3) {
      // Ground storey: shopfront glazing between white piers.
      if (pier) id = "white_concrete";
      else if (isFront) id = "glass";
      else [id, props] = pane(alongX);
    } else if (y === F + 4) {
      // Shop lintel; red awning on the street face.
      id = isFront ? "red_concrete" : "smooth_quartz";
    } else if (y === F + 5) {
      // Storey line.
      id = "light_gray_concrete";
    } else if (y === F + 6) {
      // Upper sill course.
      id = pier ? "white_concrete" : "smooth_quartz";
    } else if (y <= F + 9) {
      // Upper storey window grid.
      if (pier) id = "white_concrete";
      else [id, props] = pane(alongX);
    } else if (y === F + 10) {
      // Cornice.
      id = "smooth_quartz";
    } else {
      // Parapet.
      id = "white_concrete";
    }

    put(x, y, z, id, props ?? undefined);
  }

  // Floor slabs at storey lines are already in the wall column above.
  // Roof deck at F+10 stays solid across the whole footprint through the cornice course.
}

// Front door on the street face, on the nearest cell to centre.
if (doorX !== null && doorGround + 2 <= F + 3) {
  put(doorX, doorGround + 1, 0, "oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(doorX, doorGround + 2, 0, "oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// Warm light: shopfront interior glowstone behind glazing on the street face,
// and upper-floor glowstone behind selected windows.
for (const [x, z, gr] of cells) {
  if (z !== 0) continue;
  if (!has(x, 1)) continue;
  if (x % 3 === 1 && x !== doorX && gr + 2 <= F + 3) put(x, F + 2, 1, "glowstone");
}
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (z !== 0) continue;
  if (!has(x, 1)) continue;
  if (x % 6 === 2) put(x, F + 8, 1, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
