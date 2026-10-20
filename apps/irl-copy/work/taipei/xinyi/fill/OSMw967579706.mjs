import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Taiwanese commercial block, c. 1980s: two storeys over a shopfront
// ground floor, smooth quartz-tile walls, light-grey concrete mullions, tinted
// glass bays, a red awning over the entrance, and a flat roof with plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw967579706";
const W = 36, H = 23, D = 20;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

const ground = new Map();
for (const [x, z, gy] of list) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.round(gy));
}
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const DIRV = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

const ringFaces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
};

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const MID = Math.floor(W / 2); // entrance bay on the north facade

for (const [key, gy] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const faces = ringFaces(x, z);
  const ring = faces.length > 0;

  // Floor / base course at ground level.
  put(x, gy, z, ring ? "stone_bricks" : "smooth_stone");

  if (!ring) {
    // Interior: floor slab at storey 2, roof deck at the top, plant on the roof.
    put(x, gy + 5, z, "smooth_stone");
    put(x, gy + 10, z, "light_gray_concrete");
    if (x % 9 === 4 && z % 7 === 3) put(x, gy + 11, z, "light_gray_concrete");
    continue;
  }

  const corner =
    (faces.includes("north") || faces.includes("south")) &&
    (faces.includes("west") || faces.includes("east"));
  const face = corner
    ? (faces.includes("north") ? "north" : "south")
    : faces[0];
  const along = (face === "north" || face === "south") ? x : z;
  const pilaster = corner || along % 4 === 0;
  const isEntrance = !corner && faces.includes("north") && x === MID;
  const canopy = faces.includes("north") && x >= MID - 2 && x <= MID + 2;
  const paneProps = (face === "north" || face === "south") ? PANE_EW : PANE_NS;

  for (let r = 1; r <= 10; r++) {
    const y = gy + r;
    let id = null, props = undefined;

    if (r === 5 || r === 10) {
      id = pilaster ? "light_gray_concrete" : "smooth_quartz";
    } else if (pilaster) {
      id = "light_gray_concrete";
    } else if (isEntrance && (r === 1 || r === 2)) {
      id = "dark_oak_door";
      props = {
        facing: "north",
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
    } else if (r === 4 || r === 9) {
      id = (canopy && r === 4 && face === "north") ? "red_terracotta" : "smooth_quartz";
    } else if ((r >= 1 && r <= 3) || (r >= 6 && r <= 8)) {
      id = "glass_pane";
      props = paneProps;
    } else {
      id = "smooth_quartz";
    }

    put(x, y, z, id, props);
  }

  // Warm lamps on the floor just behind some window bays.
  const inX = x - DIRV[face][0];
  const inZ = z - DIRV[face][1];
  if (!pilaster && !isEntrance && has(inX, inZ) && ringFaces(inX, inZ).length === 0) {
    if (along % 8 === 2) put(inX, gy + 1, inZ, "glowstone");
    if (along % 6 === 3) put(inX, gy + 6, inZ, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
