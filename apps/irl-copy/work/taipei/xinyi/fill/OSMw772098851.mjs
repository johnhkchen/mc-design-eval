import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block: two storeys over a stone base, tiled
// quartz-clad facades, shopfront ground floor, punched upper windows,
// quartz parapet, roof plant. Roof sits ~11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772098851";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const footprint = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const base = Math.min(...cells.map((c) => c[2]));
const T = base + 10; // roof slab level; parapet sits here on facade cells

const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "east", dx: 1, dz: 0 },
  { name: "west", dx: -1, dz: 0 },
];

const outwardFaces = (x, z) =>
  DIRS.filter((d) => !footprint.has(key(x + d.dx, z + d.dz)));

const hasFacadeNeighbour = (x, z) =>
  DIRS.some((d) => {
    const k = key(x + d.dx, z + d.dz);
    return footprint.has(k) && outwardFaces(...k.split(",").map(Number)).length > 0;
  });

// Entrance: south-facing (or any outward) facade cell nearest the centroid in x.
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
let entranceKey = null;
let entranceFace = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    for (const f of outwardFaces(x, z)) {
      const score = (f.name === "south" ? 0 : 100) + Math.abs(x - cx);
      if (score < best) {
        best = score;
        entranceKey = key(x, z);
        entranceFace = f.name;
      }
    }
  }
}

const oppositeFacing = { north: "south", south: "north", east: "west", west: "east" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const faces = outwardFaces(x, z);
  const k = key(x, z);

  if (faces.length === 0) {
    // Interior cell: air with floor and ceiling slabs only.
    g.set(x, gr, z, "smooth_stone");
    if (gr < base + 5) g.set(x, base + 5, z, "smooth_stone");
    g.set(x, T, z, "smooth_stone");

    // Roof plant on a grid of interior cells.
    if (x % 4 === 2 && z % 4 === 2) g.set(x, T + 1, z, "light_gray_concrete");

    // Warm light just behind the upper windows.
    if (hasFacadeNeighbour(x, z) && (x + z) % 4 === 0 && base + 7 > gr) {
      g.set(x, base + 7, z, "glowstone");
    }
    continue;
  }

  // Facade cell. Orientation of the exposed face decides pane connections.
  const f = faces[0];
  const alongX = f.dz !== 0; // north/south faces run along x
  const pane = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const idx = alongX ? x : z;
  const isEntrance = k === entranceKey && f.name === entranceFace;

  for (let y = gr; y <= T; y++) {
    // Entrance: double door, hanging lantern, lintel.
    if (isEntrance && y >= gr && y <= gr + 3) {
      if (y === gr) {
        g.set(x, y, z, "dark_oak_door", {
          facing: oppositeFacing[f.name], half: "lower", hinge: "left",
          open: "false", powered: "false",
        });
      } else if (y === gr + 1) {
        g.set(x, y, z, "dark_oak_door", {
          facing: oppositeFacing[f.name], half: "upper", hinge: "left",
          open: "false", powered: "false",
        });
      } else if (y === gr + 2) {
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else {
        g.set(x, y, z, "smooth_quartz");
      }
      continue;
    }

    if (y === T) {
      g.set(x, y, z, "smooth_quartz"); // parapet
    } else if (y === base + 4 || y === base + 5 || y === base + 9) {
      g.set(x, y, z, "smooth_quartz"); // storey lines and cornice band
    } else if (y >= base + 1 && y <= base + 3) {
      // Shopfront: glass bays between quartz mullions.
      if (idx % 3 === 0) g.set(x, y, z, "smooth_quartz");
      else g.set(x, y, z, "glass_pane", pane);
    } else if (y >= base + 6 && y <= base + 8) {
      // Upper-floor window grid.
      if (idx % 3 === 0) g.set(x, y, z, "smooth_quartz");
      else g.set(x, y, z, "glass_pane", pane);
    } else {
      // Base course.
      g.set(x, y, z, "stone_bricks");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
