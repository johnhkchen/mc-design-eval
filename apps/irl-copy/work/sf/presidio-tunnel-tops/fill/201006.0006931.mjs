// 201006.0006931: a two-storey mixed-use block of the 1930s, Spanish Colonial Revival: cream stucco over a stone base
// course, a quartz string course between the storeys, and a flat roof of red clay tile behind a stucco coping. No
// record of style, so the era comes from the height (two storeys, roof about 4 blocks) and the city's Revival stock.
// The long north-east face is the street frontage: two shopfronts with wood frames and a timber-hooded entrance each.
// Walls are one block thick, so the rooms behind the glass are air, with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0006931.cells.json`, "utf8"));   // [x, z, ground]

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inside = (x, z) => ground.has(`${x},${z}`);

// The exterior face of a footprint cell: the first side with no footprint cell beyond it. Null = interior.
const faceOf = (x, z) =>
  !inside(x, z - 1) ? "N" : !inside(x, z + 1) ? "S" : !inside(x - 1, z) ? "W" : !inside(x + 1, z) ? "E" : null;
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const outward = { N: "north", S: "south", W: "west", E: "east" };

const g = new Voxels([22, 16, 17]);
const BASE = "stone_bricks", WALL = "smooth_quartz", BAND = "quartz_bricks", COPING = "smooth_quartz_slab";
const ROOF = "red_terracotta", FLOOR = "spruce_planks", FRAME = "dark_oak_planks";
const GLASS = { N: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" },
                S: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" },
                E: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },
                W: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" } };

// Frontage: the north-east run of north-facing cells. Two entrances sit at about a third and two thirds along it.
const frontage = cells.filter(([x, z]) => faceOf(x, z) === "N" && x >= 8).sort((a, b) => a[0] - b[0]);
const doors = new Set([frontage[Math.floor(frontage.length * 0.3)], frontage[Math.floor(frontage.length * 0.7)]]
  .map(([x, z]) => `${x},${z}`));

let lights = 0;
for (const [x, z, gr] of cells) {
  const f = faceOf(x, z);
  // Foundation: solid from y 0 up to the cell's ground, then the stone base course.
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);
  g.set(x, gr, z, BASE);
  if (!f) {
    // Interior: storey floors at y 2 (spruce) and the roof deck at y 4; air at y 1 and y 3.
    g.set(x, gr + 2, z, FLOOR); g.set(x, gr + 4, z, ROOF);
    continue;
  }
  // A corner stands on two exterior faces, one of each axis: its pier is a quoin.
  const corner = (!inside(x, z - 1) || !inside(x, z + 1)) && (!inside(x - 1, z) || !inside(x + 1, z));
  const c = f === "N" || f === "S" ? x : z;     // along-face index: a 4-block module, piers at 0 and 3
  const bay = ((c % 4) + 4) % 4;
  const pier = bay === 0 || bay === 3;
  const entrance = f === "N" && doors.has(`${x},${z}`);
  const shop = f === "N" && x >= 8;             // the ground floor of the frontage is commercial
  for (let k = 1; k <= 3; k++) {
    const y = gr + k;
    if (entrance) {               // a two-block door, a timber hood over it, the string course broken by the door
      const hinge = bay === 1 ? "left" : "right";
      if (k === 1) g.set(x, y, z, "dark_oak_door", { facing: outward[f], half: "lower", hinge, open: "false", powered: "false" });
      if (k === 2) g.set(x, y, z, "dark_oak_door", { facing: outward[f], half: "upper", hinge, open: "false", powered: "false" });
      if (k === 3) g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (k === 2) { g.set(x, y, z, BAND); continue; }   // string course between the storeys
    if (k === 1 && shop) {          // shopfront: wood frame at the piers, glass between
      if (pier) g.set(x, y, z, FRAME); else g.set(x, y, z, "glass_pane", GLASS[f]);
      continue;
    }
    if (k === 3 && !pier) {        // upper storey: windows in the bays, quartz piers between
      g.set(x, y, z, "glass_pane", GLASS[f]);
      if (((x * 5 + z * 3 + k) % 7 === 0)) {
        const [dx, dz] = inward[f], ix = x + dx, iz = z + dz;
        if (inside(ix, iz) && !faceOf(ix, iz)) { g.set(ix, y, iz, "glowstone"); lights++; }
      }
      continue;
    }
    if (k === 1 && !pier) {       // ground floor on the back faces: windows too
      g.set(x, y, z, "glass_pane", GLASS[f]);
      if (((x * 3 + z * 5 + k) % 6 === 0)) {
        const [dx, dz] = inward[f], ix = x + dx, iz = z + dz;
        if (inside(ix, iz) && !faceOf(ix, iz)) { g.set(ix, y, iz, "shroomlight"); lights++; }
      }
      continue;
    }
    g.set(x, y, z, corner ? "quartz_pillar" : WALL);
  }
  // Coping on the wall top: a stucco slab that caps the roof deck's edge.
  g.set(x, gr + 4, z, COPING, { type: "bottom", waterlogged: "false" });
}

// Entrance lanterns hung under the storey floor, inside each lobby (the spruce floor at y 2 is their ceiling).
for (const key of doors) {
  const [x, z] = key.split(",").map(Number), f = "N", [dx, dz] = inward[f];
  if (inside(x + dx, z + dz) && !faceOf(x + dx, z + dz)) g.set(x + dx, 1, z + dz, "lantern", { hanging: "true", waterlogged: "false" });
}

// Roof: a 2x2 stair housing near the middle, a brick flue and two condenser units on the red tile.
const interiorCell = (x, z) => inside(x, z) && !faceOf(x, z);
let best = null;
const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length, cz = cells.reduce((s, [, z]) => s + z, 0) / cells.length;
for (const [x, z] of cells) {
  if (![[1, 0], [0, 1], [1, 1]].every(([dx, dz]) => inside(x + dx, z + dz))) continue;
  const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
  if (!best || d < best.d) best = { x, z, d };
}
for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) g.set(best.x + dx, 5, best.z + dz, WALL);
for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) g.set(best.x + dx, 6, best.z + dz, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
const flue = cells.filter(([x, z]) => interiorCell(x, z) && Math.abs(x - best.x) >= 4).sort((a, b) => b[1] - a[1])[0];
if (flue) { g.set(flue[0], 5, flue[1], "bricks"); g.set(flue[0], 6, flue[1], "brick_wall"); }
const units = cells.filter(([x, z]) => interiorCell(x, z) && Math.abs(x - best.x) >= 3 && Math.abs(z - best.z) >= 2).slice(0, 2);
for (const [x, z] of units) g.set(x, 5, z, "light_gray_concrete");

const res = g.save(`${DIR}/201006.0006931.nbt`);
console.log(`built: ${res.blocks} blocks, ${res.palette} palette entries, ${lights} lights, ${doors.size} entrances`);
