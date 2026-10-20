import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw541376810: unrecorded low commercial block, Xinyi district.
// Reads as a two-storey cream-tiled commercial building with a shopfront
// ground floor, a belt course at y=5, a steel-framed glass band, a parapet
// with coping, and rooftop plant. Roof surface sits at y=11 (about 11 above
// the lowest ground).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541376810";
const W = 15, H = 23, D = 19;

const FLOOR = 5;    // belt course / first-floor ceiling
const ROOF = 10;    // roof slab block (top surface at y=11)
const PARAPET = 11; // parapet wall block
const CAP = 12;     // coping slab

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

// [name, dx, dz] of outward direction
const DIRS = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];
const OPP = { north: "south", south: "north", west: "east", east: "west" };

// Entrance: edge cell on the south face nearest the footprint's centre x.
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
let entrance = null;
{
  const south = cells
    .filter(([x, z]) => !has(x, z + 1))
    .sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
  if (south.length) {
    entrance = { x: south[0][0], z: south[0][1], face: "south" };
  } else {
    const any = cells.find(([x, z]) => DIRS.some(([, dx, dz]) => !has(x + dx, z + dz)));
    if (any) {
      const f = DIRS.find(([, dx, dz]) => !has(any[0] + dx, any[1] + dz));
      entrance = { x: any[0], z: any[1], face: f[0] };
    }
  }
}

// Glass pane connection state for a wall running along the given face.
function paneProps(face) {
  const alongX = face === "north" || face === "south";
  return alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

for (const [x, z, gr0] of cells) {
  const gr = Math.min(Math.max(0, gr0), 8);
  const faces = DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz));
  const edge = faces.length > 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Floor slab (belt course on edges) and roof slab.
  if (FLOOR >= gr) g.set(x, FLOOR, z, edge ? "smooth_quartz" : "light_gray_concrete");
  if (ROOF >= gr) g.set(x, ROOF, z, edge ? "smooth_quartz" : "gray_concrete");

  if (!edge) {
    // Rooftop plant on some interior cells.
    if ((x * 7 + z * 3) % 11 === 0) {
      g.set(x, PARAPET, z, "light_gray_concrete");
      g.set(x, CAP, z, "light_gray_concrete");
    }
    continue;
  }

  // Parapet and coping.
  g.set(x, PARAPET, z, "smooth_quartz");
  g.set(x, CAP, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

  // Primary facing face for this cell.
  const [face, dx, dz] = faces[0];
  const i = (face === "north" || face === "south") ? x : z;
  const pier = i % 3 === 0;
  const inX = x - dx, inZ = z - dz;
  const inward = has(inX, inZ);
  const isEntrance = entrance && entrance.x === x && entrance.z === z;

  // Shopfront ground floor.
  if (gr <= 4) {
    for (let y = gr; y <= 4; y++) {
      if (y === gr) {
        g.set(x, y, z, "stone_bricks"); // base course
      } else if (y === 4) {
        g.set(x, y, z, "polished_andesite"); // fascia
      } else {
        if (pier) g.set(x, y, z, "smooth_quartz");
        else g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
      }
    }
    if (isEntrance && gr <= 2) {
      // Door (two halves), lintel above.
      g.set(x, gr, z, "dark_oak_door", {
        facing: OPP[face], half: "lower", hinge: "left", open: "false", powered: "false",
      });
      g.set(x, gr + 1, z, "dark_oak_door", {
        facing: OPP[face], half: "upper", hinge: "left", open: "false", powered: "false",
      });
      g.set(x, gr + 2, z, "dark_oak_planks");
      if (inward) g.set(inX, gr + 1, inZ, "lantern", { hanging: "false", waterlogged: "false" });
    } else if (!pier && i % 6 === 4 && inward && gr + 1 <= 3) {
      // Warm light behind a shopfront window.
      g.set(inX, gr + 1, inZ, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }

  // Upper storey (windows in a grid of panes between sill and header).
  for (let y = Math.max(gr, 6); y <= 9; y++) {
    if (y === 6 || y === 9) {
      g.set(x, y, z, "smooth_quartz");
    } else {
      if (pier) g.set(x, y, z, "smooth_quartz");
      else g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
    }
  }
  // Warm glowstone behind some upper windows.
  if (!pier && i % 6 === 1 && inward && gr <= 7) {
    g.set(inX, 7, inZ, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
