// 201006.0002877: a one-storey mixed-use block of the 1920s on West Pacific Avenue. No record of its era, so it comes
// from the footprint and the roof: one storey of 2 blocks under a flat parapet 3 blocks above the lowest ground, cream
// stucco on a stone base, dark timber shopfronts on the street (NE) faces, and two doors (a shop-and-flat entrance on
// the N face, a residential one on the W face). The downhill side has one block more foundation, so its windows are
// one block tall under a transom line. Interior: an oak floor on each cell's foundation, air above, a stone roof deck.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0002877.cells.json`, "utf8"));   // [x, z, ground]

const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const inside = (x, z) => ground.has(`${x},${z}`);
// The exterior face of a footprint cell: the first side with no footprint cell beyond it. Null = interior.
const faceOf = (x, z) =>
  !inside(x, z - 1) ? "N" : !inside(x, z + 1) ? "S" : !inside(x - 1, z) ? "W" : !inside(x + 1, z) ? "E" : null;
const outward = { N: "north", S: "south", W: "west", E: "east" };
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const STREET = new Set(["N", "E"]);           // shopfronts on the NE faces; the rest is the flat/office side

const PIER = "smooth_quartz", BASE = "stone_bricks", TIMBER = "dark_oak_planks";   // PIER is the stucco pier between windows
const FLOOR = "oak_planks", ROOF = "stone";
const ROOF_Y = 3;                             // cornice and roof deck layer; the roof top is 3 blocks above the lowest ground

// Glass pane connects along its wall: east-west on N/S faces, north-south on E/W faces.
const pane = (f) => {
  const ew = f === "N" || f === "S";
  return { north: ew ? "false" : "true", south: ew ? "false" : "true", east: ew ? "true" : "false", west: ew ? "true" : "false", waterlogged: "false" };
};

// Two doors on ground-level cells (no step needed): the middle of the N face and the middle of the W face.
const pick = (face, along) => {
  const cand = cells.filter(([x, z, gr]) => gr === 0 && faceOf(x, z) === face);
  const mid = (Math.min(...cand.map(along)) + Math.max(...cand.map(along))) / 2;
  return cand.reduce((a, b) => (Math.abs(along(b) - mid) < Math.abs(along(a) - mid) ? b : a));
};
const doorCells = [pick("N", ([x]) => x), pick("W", ([, z]) => z)].map(([x, z]) => `${x},${z}`);
const doors = new Set(doorCells);

const g = new Voxels([25, 15, 30]);
let lights = 0;
for (const [x, z, gr] of cells) {
  const f = faceOf(x, z);
  // Foundation: solid from y 0 up to the cell's ground, a stone base course at the grade.
  for (let y = 0; y <= gr; y++) g.set(x, y, z, BASE);
  if (!f) {
    // Interior: the floor on the foundation, air above (the gap behind the glass), the roof deck on top.
    g.set(x, gr, z, FLOOR);
    if ((x * 5 + z * 3) % 17 === 0) g.set(x, ROOF_Y, z, "light_gray_stained_glass");   // skylight
    else g.set(x, ROOF_Y, z, ROOF);
    if ((x * 7 + z * 11) % 29 === 0) g.set(x, ROOF_Y + 1, z, "iron_block");           // rooftop HVAC unit
    continue;
  }
  const street = STREET.has(f);
  const door = doors.has(`${x},${z}`) && gr === 0;
  // Bays along the face: pier, glass, timber mullion, glass. Walls run from the grade (or the base course) to the cornice.
  const c = f === "N" || f === "S" ? x : z;
  const bay = c % 4;
  const glazed = bay === 1 || bay === 3;
  for (let y = gr + 1; y <= 2; y++) {
    if (door) g.set(x, y, z, "dark_oak_door", { facing: outward[f], half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    else if (glazed) g.set(x, y, z, "glass_pane", pane(f));
    else if (bay === 2) g.set(x, y, z, TIMBER);
    else g.set(x, y, z, PIER);
  }
  // Cornice: stone all round, timber only over the entrance.
  g.set(x, ROOF_Y, z, door ? TIMBER : BASE);
  // Warm light just inside some windows, on the interior cell behind the glass (air at y 2, under the roof deck).
  const [ix, iz] = [x + inward[f][0], z + inward[f][1]];
  if (glazed && !door && inside(ix, iz) && !faceOf(ix, iz) && (x * 3 + z * 5) % 3 === 0) {
    if (street) g.set(ix, 2, iz, "glowstone");
    else if ((x + z) % 3 === 0) g.set(ix, 2, iz, "shroomlight");
    else g.set(ix, 2, iz, "lantern", { hanging: "true", waterlogged: "false" });
    lights++;
  }
}

const out = `${DIR}/201006.0002877.nbt`;
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries, ${lights} lights, doors at ${doorCells.join(" and ")}`);
