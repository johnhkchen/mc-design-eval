// NYC1022679: the Cort Theatre, 138 West 48th Street (1913), a Beaux-Arts commercial block of brick on a dark granite base
// with limestone belts, quoins and cornice. Massing follows the lidar roof: each cell is rounded to whole 3-block storeys
// (at least four), so the wings step in and out in clean tiers; a 22 in the lidar is noise over a handful of cells and
// snaps to the 21 tier (a one-block lift there read as stray merlons).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022679.cells.json`, "utf8"));
const W = 25, D = 28, H = 34;

const BRICK = "bricks", STONE = "calcite", BASE = "polished_granite", DECK = "stone", SLAB = "stone";
const DOOR_X = 13;                                   // the entrance bay on the 48th Street (north, z 0) face

const col = new Map();
for (const [x, z, ground, roof] of cells) {
  const storeys = Math.max(4, Math.round(roof / 3));
  col.set(`${x},${z}`, { ground, top: 3 * storeys });
}
const inFoot = (x, z) => col.has(`${x},${z}`);
const top = (x, z) => (inFoot(x, z) ? col.get(`${x},${z}`).top : 0);
const solid = (x, y, z) => y >= 0 && y < top(x, z);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !(inFoot(x + dx, z + dz) && solid(x + dx, y, z + dz)));

// A window pane that joins its neighbours along the wall: connects to pane, pier or belt beside it, not to air.
function pane(x, y, z, dz) {
  const link = (ax, az) => String(inFoot(x + ax, z + az) && solid(x + ax, y, z + az));
  return dz !== 0
    ? ["glass_pane", { north: "false", south: "false", east: link(1, 0), west: link(-1, 0), waterlogged: "false" }]
    : ["glass_pane", { north: link(0, -1), south: link(0, 1), east: "false", west: "false", waterlogged: "false" }];
}

const lanterns = [];
function shell(x, y, z, faces, c) {
  const s = Math.floor(y / 3), r = y % 3;
  if (y < c.ground) return [BASE];                            // foundation under the north-east cells
  if (y === c.top - 1) return [STONE];                        // cornice and parapet
  if (faces.length > 1) return [y === 0 ? BASE : STONE];      // corner quoins
  const [dx, dz] = faces[0];
  const u = dz !== 0 ? x : z;                                 // position along the face
  if (s === 0) {                                              // the commercial base: granite piers, shopfronts, the door
    if (y === 0) return [BASE];
    if (dz === -1 && x === DOOR_X && r !== 0 && y <= 2) return ["__door", y === 1 ? "lower" : "upper"];
    if (u % 3 === 0) return [BASE];
    return pane(x, y, z, dz);
  }
  if (r === 0) return [STONE];                                // storey line
  if (u % 3 === 0) return [BRICK];                            // brick piers
  if (r === 1 && u % 3 === 1 && (u + s) % 4 === 0) lanterns.push([x - dx, y, z - dz]);   // a lit window
  return pane(x, y, z, dz);
}

const g = new Voxels([W, H, D]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFoot(x, z)) continue;
  const c = col.get(`${x},${z}`), T = c.top;
  for (let y = 0; y < T; y++) {
    const faces = exposed(x, y, z);
    if (!faces.length) {                                      // no interiors: a floor slab per storey and the roof deck
      if (y === T - 1) g.set(x, y, z, DECK);
      else if (y % 3 === 0) g.set(x, y, z, SLAB);
      continue;
    }
    const [name, state] = shell(x, y, z, faces, c);
    if (name === "__door") {
      const facing = "south";
      g.set(x, y, z, "dark_oak_door", { facing, half: state, hinge: "left", open: "false", powered: "false" });
    } else g.set(x, y, z, name, state);
  }
}

// Warm light behind some panes: a lantern on the floor slab just inside the window.
for (const [x, y, z] of lanterns) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });

// A roof house on the 15 deck, south-west of centre: brick walls and a stone cap.
for (let z = 7; z <= 8; z++) for (let x = 4; x <= 6; x++) {
  g.set(x, 15, z, BRICK); g.set(x, 16, z, BRICK); g.set(x, 17, z, STONE);
}

const r = g.save(`${DIR}/NYC1022679.nbt`);
console.log(JSON.stringify({ blocks: r.blocks, palette: r.palette, lanterns: lanterns.length }));
