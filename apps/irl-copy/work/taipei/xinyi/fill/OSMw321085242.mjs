import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw321085242";
const W = 98, H = 23, D = 78;
const TOP = 10;            // roof surface layer; roof about 11 blocks above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Palette: pale 1990s Xinyi commercial block, blue glass, granite base and entrance.
const FOUND = "stone_bricks";
const BASE = "polished_andesite";
const PIER = "smooth_quartz";
const SPAN = "light_gray_concrete";
const FLOOR = "smooth_quartz";
const ROOF = "light_gray_concrete";
const CAP = "smooth_quartz";
const GLASS = "light_blue_stained_glass_pane";
const GRANITE = "polished_granite";
const UNIT = "white_concrete";

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Outward faces of a footprint cell (neighbour outside the footprint).
const DIRS = [
  { dx: -1, dz: 0, name: "west" },
  { dx: 1, dz: 0, name: "east" },
  { dx: 0, dz: -1, name: "north" },
  { dx: 0, dz: 1, name: "south" },
];
const faces = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

// Entrance: the longest face, at its median cell.
const faceGroups = {};
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  for (const f of faces(x, z)) {
    const u = f.dz !== 0 ? x : z;
    (faceGroups[f.name] ??= { f, us: [] }).us.push(u);
  }
}
let ENTR = null;
for (const k of Object.keys(faceGroups)) {
  const grp = faceGroups[k];
  if (!ENTR || grp.us.length > ENTR.count) {
    const sorted = [...grp.us].sort((a, b) => a - b);
    ENTR = { name: k, dx: grp.f.dx, dz: grp.f.dz, count: grp.us.length, u: sorted[Math.floor(sorted.length / 2)] };
  }
}

const glassProps = (f) =>
  f.dz !== 0
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Facade block for an edge cell at height y.
function facade(f, u, y, gr) {
  const onEntr = ENTR && f.name === ENTR.name;
  const du = onEntr ? u - ENTR.u : 99;

  // Recessed entrance: granite surround, door, lintel canopy, lanterns.
  if (onEntr && Math.abs(du) <= 2) {
    if (y === gr + 3) return { b: GRANITE };                              // canopy lintel
    if (du === 0) {
      if (y === gr + 1) return { b: "dark_oak_door", p: { facing: f.name, half: "lower", hinge: "left", open: "false", powered: "false" } };
      if (y === gr + 2) return { b: "dark_oak_door", p: { facing: f.name, half: "upper", hinge: "left", open: "false", powered: "false" } };
      return { b: GRANITE };
    }
    if (Math.abs(du) === 1) return { b: GRANITE };                        // door jambs
    if (Math.abs(du) === 2) {                                             // pier flanks with lanterns
      if (y === gr + 2) return { b: "lantern", p: { hanging: "false", waterlogged: "false" } };
      return { b: PIER };
    }
  }

  if (y === 5) return { b: SPAN };                                        // second-floor band
  if (y === 9) return { b: SPAN };                                        // cornice band
  if (y === 4) return { b: SPAN };                                        // ground-storey sign band
  if (u % 4 === 0) return { b: PIER };                                    // bay piers
  return { b: GLASS, p: glassProps(f) };
}

for (const [x, z, gr0] of cells) {
  const gr = Math.min(Math.max(gr0, 0), TOP + 1);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < Math.min(gr, TOP); y++) put(x, y, z, FOUND);
  if (gr > TOP) continue;

  const fs = faces(x, z);
  const edge = fs.length > 0;

  // Base course, second-floor slab, roof surface.
  put(x, gr, z, BASE);
  if (5 > gr) put(x, 5, z, FLOOR);
  put(x, TOP, z, edge ? CAP : ROOF);

  if (edge) {
    const f = fs[0];
    const u = f.dz !== 0 ? x : z;
    for (let y = gr + 1; y < TOP; y++) {
      if (y === 5) { put(x, y, z, SPAN); continue; }
      const { b, p } = facade(f, u, y, gr);
      put(x, y, z, b, p);
    }

    // Warm light: glowstone behind selected windows, both storeys.
    const onEntr = ENTR && f.name === ENTR.name && Math.abs(u - ENTR.u) <= 2;
    if (!onEntr && u % 6 === 3 && u % 4 !== 0) {
      const ix = x - f.dx, iz = z - f.dz;
      if (has(ix, iz)) {
        if (gr + 2 <= 4) put(ix, gr + 2, iz, "glowstone");
        put(ix, 7, iz, "glowstone");
      }
    }
  } else {
    // Rooftop plant: light blocks, two layers, on interior roof cells.
    if (((x - 12) % 14 + 14) % 14 < 5 && ((z - 9) % 11 + 11) % 11 < 4) {
      put(x, TOP + 1, z, UNIT);
      put(x, TOP + 2, z, UNIT);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
