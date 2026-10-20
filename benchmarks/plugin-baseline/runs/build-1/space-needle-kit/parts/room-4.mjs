// room: Observation deck inner, interior designer's room (plan ROOMS 4). Inner air box [12,219,12,52,222,52], inside the
// glass ring r=21. Layout: a cartography table "sky map" at the north-west (the focal piece, two telescopes and two
// benches, lit by a lantern hung over it); five telescope-and-bench groups round the ring, each facing the glass; hanging
// lanterns on two rings (r 16 and r 9). Lanes: 3-wide spokes from the core doorway's room out to the north exit and the
// NE and SW exits stay clear, and nothing stands within r 12 of the axis, so the ring walk reaches every group.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const C = 32;                        // axis cell
const X0 = 12, Z0 = 12, N = 41;      // the box's corner; the box is 41 x 41
const Y = 219;                       // walk surface (deck floor y218)
const R_MAX = 19;                    // inside the glass ring (r 21), one cell kept back

const pos = (R, deg) => {            // ring cell at radius R, azimuth deg (clockwise from north)
  const t = (deg * Math.PI) / 180;
  return [Math.round(C + R * Math.sin(t)), Math.round(C - R * Math.cos(t))];
};
const r = (x, z) => Math.hypot(x - C, z - C);

// the three exit spokes (north, NE, SW): a 3-wide lane from the ring out to the glass
function isSpoke(x, z) {
  for (const deg of [0, 120, 240]) {
    const t = (deg * Math.PI) / 180;
    const ux = Math.sin(t), uz = -Math.cos(t);
    const along = (x - C) * ux + (z - C) * uz;
    const across = Math.abs((x - C) * uz - (z - C) * ux);
    if (along >= 6 && along <= 22 && across <= 1.5) return true;
  }
  return false;
}

// the cardinal a seat or lectern faces toward the centre (inward) or away from it (outward)
function cardinalTo(x, z, toward) {
  const dx = (toward ? C - x : x - C), dz = (toward ? C - z : z - C);
  if (Math.abs(dx) >= Math.abs(dz)) return dx > 0 ? "east" : "west";
  return dz > 0 ? "south" : "north";
}

const STAIR = { north: "a", east: "b", south: "c", west: "d" };
const LECTERN = { north: "L", east: "M", south: "N", west: "O" };

// the layers: [y219 furniture, y220 on the table, y221 (clear), y222 hanging lanterns]
const rows = () => Array.from({ length: N }, () => Array(N).fill("."));
const layer = { 219: rows(), 220: rows(), 222: rows() };
const taken = new Set();
const refused = [];

// a hung lantern (y222) may sit over a spoke: it hangs above the lane and blocks nothing
function put(y, x, z, ch) {
  const key = `${x},${y},${z}`;
  const lane = isSpoke(x, z) && y !== 222;
  if (r(x, z) > R_MAX || lane || taken.has(key)) { refused.push(`${x},${y},${z} ${ch}`); return; }
  taken.add(key);
  layer[y][z - Z0][x - X0] = ch;
}

// focal piece: the sky map (cartography table) at the north-west, two telescopes and two benches round it
const [mx, mz] = pos(12, 330);
put(219, mx, mz, "T");
put(220, mx, mz, "k");                            // a candle on the map's top
put(222, mx, mz, "H");                            // hung over it: the brightest spot
put(219, mx, mz - 2, "L");                        // telescope, north of the map, facing the map
put(219, mx, mz + 2, STAIR.south);                // bench south of the map, back to the glass
put(219, mx + 2, mz, STAIR.east);                 // bench east of the map, back to the core

// telescope groups: a telescope (lectern) at r 15, a two-stair bench at r 13 behind it, facing the glass
for (const deg of [30, 90, 150, 210, 270]) {
  const [tx, tz] = pos(15, deg);
  const [bx, bz] = pos(13, deg);
  const [cx, cz] = pos(13, deg + 7);
  put(219, tx, tz, LECTERN[cardinalTo(tx, tz, true)]);
  put(219, bx, bz, STAIR[cardinalTo(bx, bz, true)]);
  if (cx !== bx || cz !== bz) put(219, cx, cz, STAIR[cardinalTo(cx, cz, true)]);
}

// hanging lanterns: six over the outer ring (r 16) and six over the inner ring (r 9), off the spokes
for (const deg of [0, 60, 120, 180, 240, 300]) { const [x, z] = pos(16, deg); put(222, x, z, "H"); }
for (const deg of [30, 90, 150, 210, 270, 330]) { const [x, z] = pos(9, deg); put(222, x, z, "H"); }

// palette.json substitutes: stairs stay stairs (smooth_quartz_stairs); a lectern is a sloped desk, so it becomes a stair
// whose back faces away from its reader (the slope falls toward the reader); the cartography table is a cube of
// white_concrete; the lit candle and the hanging lanterns are sea_lantern (hidden in the ceiling at y222, under the roof)
const legend = {
  a: ["smooth_quartz_stairs", { facing: "north", half: "bottom" }],
  b: ["smooth_quartz_stairs", { facing: "east", half: "bottom" }],
  c: ["smooth_quartz_stairs", { facing: "south", half: "bottom" }],
  d: ["smooth_quartz_stairs", { facing: "west", half: "bottom" }],
  L: ["smooth_quartz_stairs", { facing: "south", half: "bottom" }],
  M: ["smooth_quartz_stairs", { facing: "west", half: "bottom" }],
  N: ["smooth_quartz_stairs", { facing: "north", half: "bottom" }],
  O: ["smooth_quartz_stairs", { facing: "east", half: "bottom" }],
  T: "white_concrete",
  k: "sea_lantern",
  H: "sea_lantern",
};

export function build(g) {
  layers(g, [X0, Y, Z0], legend, [layer[219], layer[220], rows(), layer[222]]);
  console.log(`room-4: ${taken.size} blocks placed${refused.length ? `, refused ${refused.join(" ")}` : ""}`);
}
