import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020171";
const W = 27, D = 10, H = 23;
const ROOF = 11; // lidar roof height above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Front (street) face is z = 0; entrance sits at the median x of that face.
const frontXs = cells.filter(([, z]) => z === 0).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : Math.floor(W / 2);

const glassPaneFor = (x, z) => {
  // Long faces (z = 0 or z = D-1) connect east/west; end faces connect north/south.
  const longFace = z === 0 || z === D - 1;
  return longFace
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};

// Pier columns every 3 blocks along each face, so the facade reads as bays.
const isPier = (x, z) => {
  const along = (z === 0 || z === D - 1) ? x : z;
  return along % 3 === 0;
};

for (const [x, z, gc] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);

  if (edge) {
    for (let y = gc; y <= ROOF; y++) {
      const fromTop = ROOF - y;
      const rel = y - gc;
      let id = null;
      let props;

      if (y === ROOF) {
        id = "smooth_stone"; // coping
      } else if (fromTop === 1) {
        id = "white_concrete"; // parapet
      } else if (fromTop === 2) {
        id = "smooth_stone"; // cornice band
      } else if (rel === 0) {
        id = "smooth_stone"; // base course
      } else if (rel >= 1 && rel <= 3) {
        // Ground floor shopfront: full glass bays, piers in white concrete.
        if (z === 0 && x === doorX && rel <= 2) {
          // Door handled after the loop.
          continue;
        }
        if (isPier(x, z)) id = "white_concrete";
        else id = "glass";
      } else if (rel === 4) {
        // Fascia; dark timber canopy above the entrance.
        id = (z === 0 && Math.abs(x - doorX) <= 2) ? "dark_oak_planks" : "gray_concrete";
      } else if (rel === 5) {
        id = "smooth_stone"; // storey line
      } else if (rel >= 6) {
        // Upper storey windows with white piers.
        if (isPier(x, z)) id = "white_concrete";
        else {
          id = "glass_pane";
          props = glassPaneFor(x, z);
        }
      }

      if (id) {
        if (props) g.set(x, y, z, id, props);
        else g.set(x, y, z, id);
      }
    }
  } else {
    // Interior: floor slabs only, air behind the glass.
    g.set(x, gc, z, "light_gray_concrete");
    if (gc + 5 <= ROOF) g.set(x, gc + 5, z, "light_gray_concrete");
    // Roof slab over the whole footprint.
    g.set(x, ROOF, z, "gray_concrete");
  }

  // Roof slab on edge cells too (coping is already set above, this keeps the deck solid).
  if (edge) g.set(x, ROOF, z, "smooth_stone");
}

// Entrance door on the street face.
if (has(doorX, 0) && ground.get(`${doorX},0`) !== undefined) {
  const gc = ground.get(`${doorX},0`);
  g.set(doorX, gc + 1, 0, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false"
  });
  g.set(doorX, gc + 2, 0, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false"
  });
  // Hanging lantern in the transom above the door.
  g.set(doorX, gc + 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
  // Warm shroomlight in the lobby air behind the door.
  if (has(doorX, 1)) g.set(doorX, gc + 2, 1, "shroomlight");
}

// Warm glowstone behind some upper windows (interior air just inside the glass).
for (const [x, z, gc] of cells) {
  if (z !== 1 || isEdge(x, z)) continue;
  if (x % 6 === 2 && gc + 7 < ROOF - 2) g.set(x, gc + 7, z, "glowstone");
}

// Two rooftop condenser units on the roof deck, on interior cells.
for (const [x, z, gc] of cells) {
  if (isEdge(x, z)) continue;
  if ((x === 8 || x === 9) && z === 3) g.set(x, ROOF + 1, z, "iron_block");
  if ((x === 17 || x === 18) && z === 6) g.set(x, ROOF + 1, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
