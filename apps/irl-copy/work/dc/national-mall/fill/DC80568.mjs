// DC80568: a narrow 2 x 11 Washington commercial block on the Mall: red brick walls with calcite (Potomac-limestone
// look) belt course and cornice, a stone-brick foundation where the north end sits 1 block up, a shopfront-style ground
// storey with a door on the east face, and a taller north tower (x 1, z 0..2) stepping up a storey above the belt.
// No interiors: a 2-wide footprint is all wall, so windows are glass panes set flush in the wall; two are lanterns
// and one a glowstone block, standing behind the glass as the warm lights.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC80568.cells.json`, "utf8"));   // [x, z, ground, roof]

const g = new Voxels([2, 17, 11]);

const WALL = "bricks", FOUND = "stone_bricks", TRIM = "calcite", LIGHT = "glowstone";
// a pane in a wall running north-south (x fixed): it joins its neighbours along z
const pane = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const door = (half) => ({ facing: "east", half, hinge: "left", open: "false", powered: "false" });

// Ground storey (y 0..1) and upper storey (y 3 on the tower): windows on odd z, brick piers on even z,
// a door on the east face at z 6, a belt course at y 2 and a cornice on each column's top layer.
for (const [x, z, gr, roof] of cells) {
  const top = roof - 1;                       // highest block in this column
  for (let y = 0; y <= top; y++) {
    if (y < gr) { g.set(x, y, z, FOUND); continue; }     // foundation under the raised north end
    if (y === top || y === 2) { g.set(x, y, z, TRIM); continue; }   // cornice and belt course
    if (y < 2) {                                          // ground storey
      if (z % 2 === 1) {                                  // a window bay
        if (x === 1) g.set(x, y, z, "glass_pane", pane);
        else if (z === 3 && y === 0) g.set(x, y, z, "lantern", { hanging: "false" });   // warm light behind the glass
        else if (z === 7 && y === 1) g.set(x, y, z, LIGHT);
        else g.set(x, y, z, "glass_pane", pane);
      } else if (x === 1 && z === 6) {                    // the entrance
        g.set(x, y, z, "dark_oak_door", door(y === 0 ? "lower" : "upper"));
      } else g.set(x, y, z, WALL);
      continue;
    }
    // upper storey (only the north tower has one): windows on odd z, piers on even z
    if (z % 2 === 1) g.set(x, y, z, "glass_pane", pane);
    else g.set(x, y, z, WALL);
  }
}

g.save(`${dir}/DC80568.nbt`);
console.log("DC80568 built");
