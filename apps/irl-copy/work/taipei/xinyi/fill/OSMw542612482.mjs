import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612482";
const W = 17, H = 23, D = 19;

// Footprint cells: [x, z, ground]. Ground is clamped so the roof (ground + 11) stays inside H.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map(([x, z, g]) => [x, z, Math.max(0, Math.min(11, Math.round(g)))]);

const key = (x, z) => x + "," + z;
const fp = new Set(cells.map(([x, z]) => key(x, z)));
const gMap = new Map(cells.map(([x, z, g]) => [key(x, z), g]));

// Outward directions: n = -z, s = +z, e = +x, w = -x
const DIRS = {
  n: [0, -1],
  s: [0, 1],
  e: [1, 0],
  w: [-1, 0],
};
const outwardOf = (x, z) =>
  Object.keys(DIRS).filter(d => !fp.has(key(x + DIRS[d][0], z + DIRS[d][1])));
const along = (x, z, d) => (d === "n" || d === "s" ? x : z);

// Front (street) face: the outward direction carrying the most edge cells.
const counts = { n: 0, s: 0, e: 0, w: 0 };
for (const [x, z] of cells) for (const d of outwardOf(x, z)) counts[d]++;
const front = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];

// Door: middle cell of the front face.
const frontCells = cells
  .filter(([x, z]) => outwardOf(x, z).includes(front))
  .sort((a, b) => along(a[0], a[1], front) - along(b[0], b[1], front));
const doorCell = frontCells[Math.floor(frontCells.length / 2)];
const doorAlong = doorCell ? along(doorCell[0], doorCell[1], front) : -99;

const g = new Voxels([W, H, D]);
const lights = [];

for (const [x, z, B] of cells) {
  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < B; y++) g.set(x, y, z, "stone");

  const out = outwardOf(x, z);

  // Interior cell: floor slabs per storey and a flat roof, no walls.
  if (out.length === 0) {
    g.set(x, B, z, "smooth_stone");
    g.set(x, B + 5, z, "smooth_stone");
    g.set(x, B + 10, z, "smooth_quartz");
    if (x % 5 === 2 && z % 5 === 2) g.set(x, B + 11, z, "light_gray_concrete");
    continue;
  }

  // Edge cell: facade.
  const face = out.includes(front) ? front : out[0];
  const a = along(x, z, face);
  const corner = out.length >= 2;
  const pier = corner || a % 3 === 0;
  const isDoor = face === front && doorCell && x === doorCell[0] && z === doorCell[1] && !corner;
  const canopy = face === front && !corner && Math.abs(a - doorAlong) <= 1;

  // Base course.
  g.set(x, B, z, "stone_bricks");

  // Ground floor shopfront (B+1..B+3).
  if (isDoor) {
    const doorProps = { facing: face === "n" ? "north" : face === "s" ? "south" : face === "e" ? "east" : "west", hinge: "left", open: "false", powered: "false" };
    g.set(x, B + 1, z, "oak_door", { ...doorProps, half: "lower" });
    g.set(x, B + 2, z, "oak_door", { ...doorProps, half: "upper" });
  } else {
    for (let dy = 1; dy <= 2; dy++) {
      g.set(x, B + dy, z, pier ? "smooth_quartz" : "light_blue_stained_glass");
    }
  }
  // Canopy strip above the entrance, on the storefront header row.
  if (canopy) {
    g.set(x, B + 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  } else {
    g.set(x, B + 3, z, pier ? "smooth_quartz" : "light_blue_stained_glass");
  }

  // Storey line between floors.
  g.set(x, B + 4, z, "smooth_quartz");
  g.set(x, B + 5, z, "smooth_quartz");

  // Upper floor windows (B+6..B+8) with framed panes.
  const inPlaneNS = face === "e" || face === "w";
  const paneProps = {
    north: inPlaneNS ? "true" : "false",
    south: inPlaneNS ? "true" : "false",
    east: inPlaneNS ? "false" : "true",
    west: inPlaneNS ? "false" : "true",
    waterlogged: "false",
  };
  for (let dy = 6; dy <= 8; dy++) {
    g.set(x, B + dy, z, pier ? "smooth_quartz" : "glass_pane", pier ? undefined : paneProps);
  }

  // Warm light behind some front windows, inside an interior cell at the same level.
  if (face === front && !pier && a % 6 === 1) {
    const [dx, dz] = DIRS[face];
    const ix = x - dx, iz = z - dz;
    const ik = key(ix, iz);
    if (fp.has(ik) && outwardOf(ix, iz).length === 0 && gMap.get(ik) === B) {
      lights.push([ix, B + 7, iz]);
    }
  }

  // Cornice and parapet.
  g.set(x, B + 9, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  g.set(x, B + 10, z, "smooth_quartz");
}

for (const [lx, ly, lz] of lights) g.set(lx, ly, lz, "glowstone");

g.save(`${DIR}/${ID}.nbt`);
