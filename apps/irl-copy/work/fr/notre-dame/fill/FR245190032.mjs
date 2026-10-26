// FR245190032: an Indifférencié building on the Île de la Cité's lidar footprint (4 x 6, two corner notches).
// Stone shell in Haussmann-style calcite on a stone-brick base, three storeys on the tall east corner and two or one
// on the lower wings, zinc-grey (deepslate tile) mansard roofs with a stair course at each eave. Each storey is a
// floor course, two rows of glass in a calcite frame, a lintel course and a smooth-stone band; the cells inside the
// perimeter are air (behind the glass) with a floor per storey. Warm glowstone sits behind some ground-floor panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245190032.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

// the lidar roof height snapped to a storey tier: the top block of the wall's cap course (5, 10 or 15)
const tierTop = (roof) => (roof <= 6 ? 5 : roof <= 11 ? 10 : 15);
const cellAt = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, top: tierTop(roof) }]));
const inFoot = (x, z) => cellAt.has(`${x},${z}`);
const hasStorey = (x, z, k) => inFoot(x, z) && cellAt.get(`${x},${z}`).top >= 5 + 5 * k;
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
// the outward faces of a cell at storey k: a neighbour outside the footprint, or one without that storey, makes a face
const facesOf = (x, z, k) => DIRS.filter(([, dx, dz]) => !hasStorey(x + dx, z + dz, k));

const g = new Voxels([4, 32, 6]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

const LIGHTS = new Set(["1,2", "2,2", "2,4"]);   // interior cells behind a ground-floor pane: glowstone on the floor course
const DOOR = "2,5";                               // the south entrance

for (const [key, c] of cellAt) {
  const [x, z] = key.split(",").map(Number);
  // foundation up to the lowest-ground cell's ground (at least one course, so the floor never hangs)
  for (let y = 0; y < Math.max(1, c.ground); y++) put(x, y, z, "stone_bricks");
  // base course on the street faces, plain floor inside
  put(x, 1, z, facesOf(x, z, 0).length ? "stone_bricks" : "stone");

  for (let k = 0; k < 3 && c.top >= 5 + 5 * k; k++) {
    const fy = 1 + 5 * k;                       // this storey's floor course
    const faces = facesOf(x, z, k);
    if (k > 0) put(x, fy, z, faces.length ? "calcite" : "stone");
    if (faces.length) {
      const onTwoAxes = faces.some(([n]) => n === "north" || n === "south") && faces.some(([n]) => n === "east" || n === "west");
      if (onTwoAxes) {                          // a corner: a calcite pier (two parallel faces are one thin wall, glazed)
        put(x, fy + 1, z, "calcite"); put(x, fy + 2, z, "calcite");
      } else if (k === 0 && `${x},${z}` === DOOR) {
        const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
        put(x, fy + 1, z, "dark_oak_door", door("lower"));
        put(x, fy + 2, z, "dark_oak_door", door("upper"));
      } else {                                  // a glass bay in a calcite frame, panes running along the face
        const [face] = faces[0];
        const pane = face === "north" || face === "south"
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        put(x, fy + 1, z, "glass_pane", pane); put(x, fy + 2, z, "glass_pane", pane);
      }
      put(x, fy + 3, z, "calcite");             // lintel course
    } else if (k === 0 && LIGHTS.has(`${x},${z}`)) {
      put(x, fy + 1, z, "glowstone");           // warm light behind a pane
    }
    // the storey's top: a smooth-stone band that is the next floor's ceiling, or the zinc roof cap on the top storey
    put(x, fy + 4, z, fy + 4 < c.top ? "smooth_stone" : "deepslate_tiles");
  }

  // mansard eave: a stair course on the outward edge of the roof cap, sloping up inward
  const kTop = c.top / 5 - 1;
  const eave = facesOf(x, z, kTop);
  if (eave.length) put(x, c.top + 1, z, "deepslate_tile_stairs", { facing: eave[0][0], half: "bottom", shape: "straight", waterlogged: "false" });
}

// two brick chimney stacks over the low wing's interior
put(1, 6, 2, "bricks"); put(1, 7, 2, "bricks");
put(2, 6, 3, "bricks"); put(2, 7, 3, "bricks");

const out = `${DIR}/FR245190032.nbt`;
const stats = g.save(out);
console.log(JSON.stringify({ out, ...stats }));
