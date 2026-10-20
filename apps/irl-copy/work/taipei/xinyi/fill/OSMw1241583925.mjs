import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1241583925";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record-less building: read as a low two-storey Taipei commercial block
// (1980s shophouse/office style): quartz-tiled walls, stone base, glass shopfront,
// dark-frame upper windows, parapet, rooftop plant boxes. Roof ~11 blocks above lowest ground.
const W = 23, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, Math.round(gr));
const minG = Math.min(...gmap.values());
const has = (x, z) => gmap.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Perimeter sides: which neighbours are outside the footprint
const sidesOf = (x, z) => ({
  w: !has(x - 1, z),
  e: !has(x + 1, z),
  n: !has(x, z - 1),
  s: !has(x, z + 1),
});

// Entrance: street side (min z, north face) cell nearest the middle of the frontage
let ent = null;
{
  const cand = cells
    .map(([x, z]) => [x, z, sidesOf(x, z)])
    .filter(([, , s]) => s.n);
  const pool = cand.length ? cand : cells.map(([x, z]) => [x, z, sidesOf(x, z)]).filter(([, , s]) => s.w || s.e || s.n || s.s);
  if (pool.length) {
    const mid = (W - 1) / 2;
    pool.sort((a, b) => Math.abs(a[0] - mid) - Math.abs(b[0] - mid));
    ent = `${pool[0][0]},${pool[0][1]}`;
  }
}

for (const [x, z, grRaw] of cells) {
  const b = Math.round(grRaw) - minG;
  const s = sidesOf(x, z);
  const nSides = (s.w ? 1 : 0) + (s.e ? 1 : 0) + (s.n ? 1 : 0) + (s.s ? 1 : 0);
  const perim = nSides > 0;
  const key = `${x},${z}`;

  // Foundation from y=0 up to this cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Base course, storey floor slabs, roof deck (full footprint, no empty course)
  put(x, b + 0, z, "stone_bricks");
  put(x, b + 5, z, "smooth_stone");
  put(x, b + 10, z, perim ? "polished_andesite" : "light_gray_concrete");

  if (!perim) {
    // Interior: air above floor slabs, occasional roof plant boxes
    if (b + 11 <= H - 1 && (x * 7 + z * 3) % 11 === 0 && x % 3 !== 0) {
      put(x, b + 11, z, "iron_block");
    }
    continue;
  }

  // Facade: quartz tile walls, polished andesite bands and parapet
  for (let k = 1; k <= 9; k++) {
    put(x, b + k, z, "smooth_quartz");
  }
  put(x, b + 4, z, "polished_andesite"); // ground-floor lintel band
  put(x, b + 5, z, "polished_andesite"); // storey line
  put(x, b + 10, z, "polished_andesite"); // cornice / parapet cap

  // Corners and piers stay solid; openings only on single-faced cells in alternate bays
  const single = nSides === 1;
  const along = (s.n || s.s) ? x : z;
  const isOpening = single && along % 2 === 1;
  const isDoor = key === ent;

  // Pick the face this cell presents (for inward lighting)
  let face = null;
  if (s.n) face = "n";
  else if (s.s) face = "s";
  else if (s.w) face = "w";
  else if (s.e) face = "e";

  if (isDoor) {
    // Entrance: dark wood door with glass transom above
    put(x, b + 1, z, "dark_oak_door", { facing: face === "n" ? "north" : face === "s" ? "south" : face === "w" ? "west" : "east", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, b + 2, z, "dark_oak_door", { facing: face === "n" ? "north" : face === "s" ? "south" : face === "w" ? "west" : "east", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, b + 3, z, "light_blue_stained_glass");
    put(x, b + 4, z, "polished_andesite");
    continue;
  }

  if (isOpening) {
    // Ground-floor shopfront glass (k 1-3)
    for (let k = 1; k <= 3; k++) put(x, b + k, z, "light_blue_stained_glass");
    // Upper window: frame / glass / glass / frame
    put(x, b + 6, z, "polished_andesite");
    put(x, b + 7, z, "light_blue_stained_glass");
    put(x, b + 8, z, "light_blue_stained_glass");
    put(x, b + 9, z, "polished_andesite");

    // Warm light behind some upper glass, in the interior air cell
    const inward = {
      n: [x, z + 1],
      s: [x, z - 1],
      w: [x + 1, z],
      e: [x - 1, z],
    }[face];
    if (inward && has(inward[0], inward[1]) && (along + z) % 4 === 0) {
      put(inward[0], b + 7, inward[1], "shroomlight");
    }
    if (inward && has(inward[0], inward[1]) && (along + z) % 4 === 2) {
      put(inward[0], b + 2, inward[1], "shroomlight");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
