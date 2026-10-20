import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1159644393";
const W = 30, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(key(x, z), gr);
const L = Math.min(...cells.map((c) => c[2]));   // lowest ground under footprint
const ROOF = L + 11;                              // roof/parapet top, lidar height

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const has = (x, z) => cellMap.has(key(x, z));
const exposed = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});
const perim = (x, z) => { const f = exposed(x, z); return f.N || f.S || f.W || f.E; };
const corner = (x, z) => { const f = exposed(x, z); return (f.N || f.S) && (f.W || f.E); };
const along = (x, z) => { const f = exposed(x, z); return (f.N || f.S) ? x : z; };
const mullion = (x, z) => along(x, z) % 3 === 0;

// Entrance: middle of the south face (fallback north), non-corner cells only.
let faceForDoor = "S";
let doorList = cells
  .filter(([x, z]) => perim(x, z) && exposed(x, z).S && !corner(x, z))
  .sort((a, b) => a[0] - b[0]);
if (doorList.length === 0) {
  faceForDoor = "N";
  doorList = cells
    .filter(([x, z]) => perim(x, z) && exposed(x, z).N && !corner(x, z))
    .sort((a, b) => a[0] - b[0]);
}
let doorKey = null;
if (doorList.length > 0) {
  const d = doorList[Math.floor(doorList.length / 2)];
  doorKey = key(d[0], d[1]);
}

// Pass 1: foundations, floor slabs, walls, shopfronts, upper windows.
for (const [x, z, gr] of cells) {
  // Foundation: solid stone below the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perim(x, z)) {
    // Interior: floor slabs only, air otherwise (no interiors).
    const slabs = [
      [gr, "smooth_stone"],
      [L + 5, "light_gray_concrete"],
      [L + 10, "gray_concrete"],
    ];
    for (const [y, id] of slabs) {
      if (y >= gr && y <= L + 10) put(x, y, z, id);
    }
    continue;
  }

  const isCorner = corner(x, z);
  const isMull = !isCorner && mullion(x, z);
  const isDoor = key(x, z) === doorKey;

  for (let y = gr; y <= ROOF; y++) {
    let id = null;
    let props = null;

    if (y === L + 11) {
      id = "white_concrete";                     // parapet
    } else if (y === L + 10) {
      id = "stone_bricks";                       // cornice
    } else if (y === L + 5) {
      id = "light_gray_concrete";                // storey line
    } else if (y === L + 4) {
      id = "red_concrete";                       // signage band
    } else if (y >= L + 6 && y <= L + 9) {
      if (y === L + 6 || y === L + 9 || isCorner || isMull) {
        id = "light_gray_concrete";              // frames and mullions
      } else {
        id = "light_blue_stained_glass_pane";    // upper windows
      }
    } else if (y === gr) {
      id = "polished_andesite";                  // plinth
    } else if (y >= gr + 1 && y <= L + 3) {
      if (isDoor && y <= gr + 2) {
        id = "dark_oak_door";
        const half = y === gr + 1 ? "lower" : "upper";
        props = { facing: faceForDoor === "S" ? "south" : "north", half, hinge: "left", open: "false", powered: "false" };
      } else if (isDoor && y === gr + 3) {
        id = "lantern";
        props = { hanging: "true", waterlogged: "false" };
      } else if (isCorner || isMull) {
        id = "light_gray_concrete";
      } else {
        id = "glass_pane";                       // shopfront glazing
      }
    } else {
      id = "white_concrete";                     // wall body
    }

    if (id) put(x, y, z, id, props || undefined);
  }
}

// Pass 2: warm lights behind glass, on interior floors (standing on slabs).
for (const [x, z, gr] of cells) {
  if (!perim(x, z) || corner(x, z)) continue;
  const f = exposed(x, z);
  const face = f.N ? "N" : f.S ? "S" : f.W ? "W" : "E";
  const ix = face === "W" ? x + 1 : face === "E" ? x - 1 : x;
  const iz = face === "N" ? z + 1 : face === "S" ? z - 1 : z;
  if (!has(ix, iz) || perim(ix, iz)) continue;
  const a = along(x, z);
  // Upper storey: glowstone on floor behind some windows.
  if (a % 6 === 2 && !mullion(x, z)) {
    put(ix, L + 6, iz, "glowstone");
  }
  // Ground storey: standing lanterns in some shopfronts.
  if (a % 6 === 4 && !mullion(x, z) && key(x, z) !== doorKey && gr + 1 <= L + 3) {
    put(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 3: rooftop plant on interior roof (AC units / equipment).
for (const [x, z] of cells) {
  if (perim(x, z)) continue;
  if (x % 7 === 3 && z % 5 === 2) put(x, ROOF, z, "iron_block");
  else if (x % 7 === 5 && z % 5 === 3) put(x, ROOF, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
