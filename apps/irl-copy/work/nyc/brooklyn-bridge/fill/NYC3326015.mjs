import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3326015";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 5, HT = 16, D = 5;
const g = new Voxels([W, HT, D]);

const key = (x, z) => `${x},${z}`;
const has = new Set(cells.map(([x, z]) => key(x, z)));
const minX = Math.min(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Outward faces of a cell = neighbours outside the footprint.
const faceList = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !has.has(key(x + dx, z + dz)));

// Street face is the -z side; its centre cell carries the entrance.
const doorX = minX + 2, doorZ = minZ;
const isDoor = (x, z) => x === doorX && z === doorZ && has.has(key(x, z)) &&
  faceList(x, z).some(([dx, dz]) => dz === -1);

// Window on any outward face whose index along that face is odd (piers at even indices).
const windowFaces = (x, z) =>
  faceList(x, z).filter(([dx, dz]) => {
    const idx = dz !== 0 ? x - minX : z - minZ;
    return idx % 2 === 1;
  });
const windowHere = (x, z) => windowFaces(x, z).length > 0;

// Pane connections follow the wall plane the pane sits in.
const paneProps = (x, z) => {
  const along = windowFaces(x, z).some(([, dz]) => dz !== 0);
  return along
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};

// Warm lights just inside the street-facing windows, both storeys.
const lightHere = (x, z, r) =>
  (r === 1 || r === 3) && z === minZ + 1 && (x === minX + 1 || x === minX + 3) &&
  has.has(key(x, minZ)) && windowHere(x, minZ);

for (const [x, z, gr, rf] of cells) {
  const gc = clamp(Math.round(gr), 0, 10);

  // Two 2-block storeys (rows 0..4): base course, window row, sill line, window row, cornice.
  // The parapet sits one course above the lidar roof height.
  let top = Math.max(gc + 5, 2 * Math.round(rf / 2) + 1);
  top = Math.min(top, HT - 1);
  const H = top - gc;

  // Foundation from y 0 to this cell's ground.
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  const faces = faceList(x, z);
  const wall = faces.length > 0;

  for (let r = 0; r < H; r++) {
    const y = gc + r;

    if (!wall) {
      // Interior: floor slabs at r=0 and r=2, roof slab at the top, air between.
      if (r === 0 || r === 2) {
        g.set(x, y, z, "oak_planks");
      } else if (r === H - 1) {
        g.set(x, y, z, "smooth_stone");
      } else if (lightHere(x, z, r)) {
        g.set(x, y, z, "shroomlight");
      }
      continue;
    }

    if (r === 0) {
      g.set(x, y, z, "stone_bricks");                 // base course
    } else if (r === H - 1) {
      g.set(x, y, z, "stone_bricks");                 // cornice / parapet
    } else if (isDoor(x, z) && (r === 1 || r === 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "south",
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
    } else if (isDoor(x, z) && r === 3) {
      g.set(x, y, z, "stone_bricks");                 // lintel over entrance
    } else if (r === 2) {
      g.set(x, y, z, "smooth_stone");                 // storey line
    } else if (r % 2 === 1) {
      // Window rows of each storey.
      if (windowHere(x, z)) {
        g.set(x, y, z, "glass_pane", paneProps(x, z));
      } else {
        g.set(x, y, z, "brown_terracotta");
      }
    } else {
      g.set(x, y, z, "brown_terracotta");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
