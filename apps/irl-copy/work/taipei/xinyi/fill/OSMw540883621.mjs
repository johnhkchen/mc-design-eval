import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883621";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 23, D = 5;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const inFoot = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inFoot.has(key(x, z));

// Facade datum: every floor sits above the highest ground under the footprint,
// with a solid plinth from y 0 so nothing floats on the slope.
const Lb = Math.max(...cells.map((c) => c[2]));

// Exposed faces: [dx, dz, facing] where the neighbour is outside the footprint.
const dirs = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];

const doorCell = (x, z) => x === 3 && z === D - 1; // street-side entrance

for (const [x, z] of cells) {
  const faces = dirs.filter(([dx, dz]) => !has(x + dx, z + dz));
  const perim = faces.length > 0;
  const corner = faces.length > 1;
  const face = faces.length === 1 ? faces[0] : null;
  const along = face && (face[2] === "north" || face[2] === "south") ? x : z;

  // Plinth / foundation from y 0 up to the floor datum
  for (let y = 0; y < Lb; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab (base course)
  put(x, Lb, z, perim ? "stone_bricks" : "smooth_stone");

  // Storey slabs at Lb+5 (ground/upper line) and Lb+10 (roof deck)
  put(x, Lb + 5, z, "smooth_stone");
  put(x, Lb + 10, z, "smooth_stone");

  if (!perim) {
    // Rooftop water tank on one interior cell
    if (x === 4 && z === 2) {
      put(x, Lb + 11, z, "stone_bricks");
      put(x, Lb + 12, z, "stone_bricks");
    }
    continue;
  }

  // Ground storey: shopfront with bulkhead, glass and transom
  const entrance = face && face[2] === "south" && doorCell(x, z);
  for (let y = Lb + 1; y <= Lb + 4; y++) {
    if (corner) {
      put(x, y, z, "smooth_quartz");
    } else if (y === Lb + 1) {
      put(x, y, z, "stone_bricks");
    } else if (y === Lb + 4) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass");
    }
  }
  if (entrance) {
    const doorProps = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
    put(x, Lb + 1, z, "dark_oak_door", doorProps("lower"));
    put(x, Lb + 2, z, "dark_oak_door", doorProps("upper"));
    // Hanging warm lantern under the transom, above the door
    put(x, Lb + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Upper storey: white tiled bays with blue glass windows
  for (let y = Lb + 6; y <= Lb + 9; y++) {
    if (corner) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    const isWindowBay = face && along % 2 === 1;
    if (!isWindowBay) {
      put(x, y, z, "white_concrete");
    } else if (y === Lb + 6 || y === Lb + 9) {
      put(x, y, z, "white_concrete");
    } else if (y === Lb + 7 && (x + z) % 3 === 0) {
      put(x, y, z, "glowstone"); // warm light behind the glass
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }
  }

  // Roof parapet with cornice
  put(x, Lb + 11, z, corner ? "smooth_quartz" : "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
