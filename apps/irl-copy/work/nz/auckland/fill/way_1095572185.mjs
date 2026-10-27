// Way 1095572185: a two-storey Edwardian commercial block on Auckland's Karangahape-style street edge
// (brick upper storey, cream plaster quoins and string courses, dark-timber shopfront on the street side).
// The lidar roof is flat at 9 blocks (about 7.5 m): a ground storey of 4 blocks, an upper storey, a stone parapet.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572185.cells.json", "utf8"));
const g = new Voxels([7, 22, 8]);

const key = (x, z) => `${x},${z}`;
const foot = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => foot.has(key(x, z));

// Facade faces that are open to the outside: N = -z, S = +z (the street side, with the shopfront), W = -x, E = +x
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// Pane connections: a pane on a z-facing wall joins east and west; on an x-facing wall, north and south
const pane = (face) => {
  const ew = face === "N" || face === "S";
  return { north: String(!ew), south: String(!ew), east: String(ew), west: String(ew), waterlogged: "false" };
};

for (const [x, z, ground, roof] of cells) {
  const top = roof - 1;   // roof 9 -> the top course is y 8
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");   // foundation under a sloped cell

  const open = Object.keys(DIRS).filter(f => !has(x + DIRS[f][0], z + DIRS[f][1]));

  // floor slab at y 0 (ground), storey floor at y 4, and the flat roof cover at the top course
  g.set(x, ground, z, "stone_bricks");
  g.set(x, 4, z, "smooth_stone");
  g.set(x, top, z, "smooth_stone");

  if (open.length === 0) continue;   // interior: air behind the walls, slabs above

  const corner = open.length >= 2;
  const face = open[0];
  const t = face === "N" || face === "S" ? x : z;   // position along the facade
  const street = face === "S" && !corner;           // the shopfront is the south (street) facade

  for (let y = ground; y <= top; y++) {
    let b = null, st;
    if (y === 0) b = "polished_andesite";              // base course
    else if (y === top) b = "stone_bricks";             // parapet
    else if (y === 4 || y === 7) b = "smooth_quartz";   // string course and lintel band
    else if (corner) b = y <= 3 ? "smooth_quartz" : "bricks";   // ground-storey quoins; brick corners above keep the upper storey red
    else if (y <= 3) {                                  // ground storey
      if (street) {
        if (y === 1) b = "dark_oak_planks";              // bulkhead
        else if (x === 4 && z === 7 && y <= 2) { b = "dark_oak_door"; st = { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }; }
        else if (x === 4 && z === 7 && y === 3) b = "lantern";   // hanging lantern over the door
        else b = t % 2 === 1 ? "glass" : "dark_oak_planks";
      } else {
        b = y === 1 ? "bricks" : t % 2 === 1 ? "glass_pane" : "bricks";
        if (b === "glass_pane") st = pane(face);
      }
    } else {                                            // upper storey, y 5 and 6 are glass; the sill and lintel are the bands
      if (t % 2 === 1) {
        // a few lit windows: glowstone shows through the pane at dusk
        if ((t + y) % 6 === 0) b = "glowstone";
        else { b = "glass_pane"; st = pane(face); }
      } else b = "bricks";
    }
    if (b === "lantern") st = { hanging: "true", waterlogged: "false" };
    if (b) g.set(x, y, z, b, st);
  }
}

const res = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572185.nbt");
console.log(JSON.stringify(res));
