import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538617875";
const W = 5, D = 12, H = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, Math.max(0, Math.round(g))]));
const inside = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const S = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward normals, named to match Minecraft facing values
const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// Shared two-storey shophouse-style commercial block, mid-1980s Taipei:
// smooth quartz walls, terracotta spandrel bands, glass-pane windows
// with quartz piers, stone-brick base and parapet.
for (const [x, z, b0] of cells) {
  const b = Math.max(0, Math.round(b0));
  const T = Math.max(11, b + 9);             // roof slab level (about 11 above lowest ground)

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < b; y++) S(x, y, z, "stone_bricks");

  const outs = Object.entries(OUT).filter(([, [dx, dz]]) => !inside(x + dx, z + dz));

  // Interior cell: floor slabs only (no interior), roof slab
  if (outs.length === 0) {
    S(x, b, z, "light_gray_concrete");
    S(x, b + 5, z, "light_gray_concrete");
    S(x, T, z, "light_gray_concrete");
    if (x === 1 && z % 4 === 3) S(x, T + 1, z, "light_gray_concrete");   // rooftop AC units
    if (x === 3 && z === 8) S(x, T + 1, z, "lantern", { hanging: "false" }); // roof lantern
    continue;
  }

  const corner = outs.length >= 2;
  const face = corner ? null : outs[0][0];
  const [fdx, fdz] = face ? OUT[face] : [0, 0];
  const long = face === "east" || face === "west";
  const u = face === "north" || face === "south" ? x : z;
  const pier = corner || (long && u % 3 === 0);
  const isFront = face === "north";

  // Base course
  S(x, b, z, "stone_bricks");

  // Ground storey: shopfront on the north (street) face, windows elsewhere
  for (let y = b + 1; y <= b + 4; y++) {
    if (y === b + 4) { S(x, y, z, "terracotta"); continue; }      // lintel band
    if (pier) { S(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
    if (isFront && x === 2 && y <= b + 2) {
      // Entrance door, lower and upper halves
      S(x, y, z, "oak_door", {
        facing: "north",
        half: y === b + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    S(x, y, z, "glass_pane");
  }

  // Slab / storey line between floors
  S(x, b + 5, z, "terracotta");

  // Upper storey
  S(x, b + 6, z, "terracotta");                                  // spandrel
  for (let y = b + 7; y <= T - 2; y++) {
    if (pier) S(x, y, z, "quartz_pillar", { axis: "y" });
    else S(x, y, z, "glass_pane");
  }
  S(x, T - 1, z, "terracotta");                                  // spandrel under cornice

  // Cornice and parapet
  S(x, T, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  S(x, T + 1, z, "stone_brick_wall", { up: "true" });

  // Warm light behind some windows, placed in the air gap one cell inboard
  if (!pier && !(isFront && x === 2)) {
    const ix = x - fdx, iz = z - fdz;
    if (inside(ix, iz) && (u + 1) % 2 === 0) {
      S(ix, b + 2, iz, "shroomlight");
    }
    if (inside(ix, iz) && (u + 2) % 3 === 0) {
      S(ix, b + 8, iz, "shroomlight");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
