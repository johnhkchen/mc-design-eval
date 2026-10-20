import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw597617487";
const W = 39, H = 33, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint map: "x,z" -> ground
const S = new Map();
for (const [x, z, gr] of cells) S.set(`${x},${z}`, gr);
const inS = (x, z) => S.has(`${x},${z}`);
const perimeter = (x, z) => !inS(x, z - 1) || !inS(x, z + 1) || !inS(x - 1, z) || !inS(x + 1, z);

const minG = Math.min(...cells.map((c) => c[2]));
// roof is ~21 blocks above the lowest ground: 4 storeys of 5 blocks plus a parapet
const R = minG + 21;

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Which face a perimeter cell sits on, its index along that face, and the inward offset
function faceOf(x, z) {
  if (!inS(x, z - 1)) return { face: "north", idx: x, inx: 0, inz: 1 };
  if (!inS(x, z + 1)) return { face: "south", idx: x, inx: 0, inz: -1 };
  if (!inS(x - 1, z)) return { face: "west", idx: z, inx: 1, inz: 0 };
  return { face: "east", idx: z, inx: -1, inz: 0 };
}

const glassProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

function facade(x, z, y, rel, f, storey) {
  const { face, idx, inx, inz } = f;
  const mull = idx % 3 === 0;
  const isDoor = face === "north" && idx === 19;
  const ground = y >= R - 19 && y <= R - 16;

  if (ground) {
    if (rel === 4) {
      if (isDoor) put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "white_concrete");
      return;
    }
    if (rel === 3 && isDoor) {
      put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      return;
    }
    if (rel === 1) {
      // canopy band across the shopfront
      put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      return;
    }
    // rel 2 and 3: shopfront glass with white frames
    if (isDoor && rel === 2) {
      put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      return;
    }
    if (mull) {
      put(x, y, z, "white_concrete");
      return;
    }
    put(x, y, z, "light_blue_stained_glass_pane", glassProps(face));
    // warm glow inside the shop
    if (rel === 3 && (idx + storey) % 4 === 1 && inS(x + inx, z + inz) && !perimeter(x + inx, z + inz)) {
      put(x + inx, y, z + inz, "glowstone");
    }
    return;
  }

  // upper storeys: spandrels at top and bottom of each body, glass between
  if (rel === 4 || rel === 1) {
    put(x, y, z, "light_gray_concrete");
    return;
  }
  if (mull) {
    put(x, y, z, "white_concrete");
    return;
  }
  put(x, y, z, "light_blue_stained_glass_pane", glassProps(face));
  // shroomlight behind selected windows
  if (rel === 2 && (idx + storey) % 4 === 0 && inS(x + inx, z + inz) && !perimeter(x + inx, z + inz)) {
    put(x + inx, y, z + inz, "shroomlight");
  }
}

for (const [x, z, gr] of cells) {
  const perim = perimeter(x, z);
  const f = perim ? faceOf(x, z) : null;

  for (let y = 0; y <= R; y++) {
    // foundation below the ground
    if (y < gr) {
      put(x, y, z, "stone");
      continue;
    }
    // roof deck
    if (y === R) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    // plinth below the ground-floor slab (downhill side)
    if (y < R - 20) {
      const rel = (((R - y) % 5) + 5) % 5;
      if (rel === 0) put(x, y, z, perim ? "white_concrete" : "smooth_stone");
      else put(x, y, z, "stone_bricks");
      continue;
    }
    const rel = (((R - y) % 5) + 5) % 5;
    // floor slabs
    if (rel === 0) {
      put(x, y, z, perim ? "white_concrete" : "smooth_stone");
      continue;
    }
    // storey bodies: facade on the perimeter, air inside
    if (perim) {
      const storey = Math.floor((y - (R - 20)) / 5);
      facade(x, z, y, rel, f, storey);
    }
  }

  // parapet on the perimeter
  if (perim) put(x, R + 1, z, "white_concrete");
}

// roof plant: a mechanical penthouse with a smaller screen and a lightning rod
for (let x = 15; x <= 23; x++) {
  for (let z = 7; z <= 12; z++) {
    if (inS(x, z)) put(x, R + 1, z, "light_gray_concrete");
  }
}
for (let x = 17; x <= 21; x++) {
  for (let z = 8; z <= 11; z++) {
    if (inS(x, z)) put(x, R + 2, z, "white_concrete");
  }
}
if (inS(19, 9)) put(19, R + 3, 9, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
