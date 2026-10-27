// Way 361657905: a mid-century (1960s-70s) reinforced-concrete commercial block on a sloping Mt Eden / Eden Terrace site.
// Ground storey (shopfront on the downhill street face, door + hanging lanterns), five upper storeys of 4 blocks each
// (blue-tinted glazing in light concrete piers, dark slab lines, light spandrels), a flat roof with a parapet line and
// two plant boxes. Lidar roof is 23 on 690 of 705 cells; the 21/22 eave cells are noise and are smoothed to 23.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_361657905.cells.json`, "utf8"));

const ROOF = 23;                                    // flat top: roof surface at y 23 (top block y 22)
const g = new Voxels([27, 35, 46]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const inside = (x, z) => ground.has(key(x, z));
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const OPP = { north: "south", south: "north", east: "west", west: "east" };
const faces = (x, z) => DIRS.filter(([, dx, dz]) => !inside(x + dx, z + dz)).map(([n]) => n);

// perimeter cells (an outside neighbour) and the faces they show
const perim = new Map();
for (const [x, z] of cells) { const f = faces(x, z); if (f.length) perim.set(key(x, z), f); }

// street = the face with the lowest mean ground: the downhill side, where the extra storeys show
const meanG = {};
for (const [n] of DIRS) {
  const cs = [...perim].filter(([, f]) => f.includes(n));
  meanG[n] = cs.reduce((s, [k]) => s + ground.get(k), 0) / Math.max(1, cs.length);
}
const street = Object.keys(meanG).sort((a, b) => meanG[a] - meanG[b])[0];
const tan = (n, x, z) => (n === "north" || n === "south" ? x : z);   // coordinate running along a face

// the door: the middle low single-face cell on the street face
const onStreet = [...perim].filter(([k, f]) => f.length === 1 && f[0] === street && ground.get(k) <= 1)
  .map(([k]) => k.split(",").map(Number));
const ts = onStreet.map(([x, z]) => tan(street, x, z)).sort((a, b) => a - b);
const doorT = ts[Math.floor(ts.length / 2)];
const doorCell = onStreet.find(([x, z]) => tan(street, x, z) === doorT);

// special cells: door (rows 1-2) and hanging lanterns either side of it under the slab (row 2)
const special = new Map();
const facing = OPP[street];
if (doorCell) {
  const [dx, dz] = doorCell;
  special.set(`${dx},1,${dz}`, ["iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" }]);
  special.set(`${dx},2,${dz}`, ["iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" }]);
  for (const [x, z] of [...perim.keys()].map((k) => k.split(",").map(Number))) {
    if (perim.get(key(x, z)).length !== 1 || perim.get(key(x, z))[0] !== street) continue;
    if (Math.abs(tan(street, x, z) - doorT) === 1) special.set(`${x},2,${z}`, ["lantern", { hanging: "true", waterlogged: "false" }]);
  }
}

const PANE = "light_blue_stained_glass_pane";
const FULL = new Set(["light_gray_concrete", "gray_concrete", "stone_bricks", "stone", PANE]);
const blk = new Map();                             // "x,y,z" -> block name, for pane connections and lamp placement
const put = (x, y, z, name, state) => { g.set(x, y, z, name, state); blk.set(`${x},${y},${z}`, name); };
const panes = [];                                  // [x, y, z, face] glazing, its connections are set after the walls

for (const [x, z, gr] of cells) {
  const fs = perim.get(key(x, z));
  for (let y = 0; y < ROOF; y++) {
    const sp = special.get(`${x},${y},${z}`);
    if (sp) { put(x, y, z, sp[0], sp[1]); continue; }
    if (y < gr) { put(x, y, z, fs ? "stone_bricks" : "stone"); continue; }           // foundation / retaining, solid to the ground
    if (!fs) {                                                                         // interior: floor slabs and roof deck, air between
      if (y === 0) put(x, y, z, "gray_concrete");
      else if (y % 4 === 3) put(x, y, z, "gray_concrete");
      else if (y === 22) put(x, y, z, "stone");
      continue;
    }
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }                           // base course
    if (y % 4 === 3) { put(x, y, z, "gray_concrete"); continue; }                     // floor slab line
    if (y % 4 === 2 && y > 2) { put(x, y, z, "light_gray_concrete"); continue; }     // spandrel / parapet
    // glazing rows (ground storey rows 1-2, then rows 4-5, 8-9, ...): piers every third column, panes between
    const pier = fs.length > 1 || tan(fs[0], x, z) % 3 === 0;
    if (pier) put(x, y, z, "light_gray_concrete");
    else { blk.set(`${x},${y},${z}`, PANE); panes.push([x, y, z, fs[0]]); }
  }
}

// warm lights behind about one pane in six (glowstone on the inside, air gap between), and the pane connections
const CONN = { north: [["east", 1, 0], ["west", -1, 0]], south: [["east", 1, 0], ["west", -1, 0]],
               east: [["north", 0, -1], ["south", 0, 1]], west: [["north", 0, -1], ["south", 0, 1]] };
const IN = Object.fromEntries(DIRS.map(([n, dx, dz]) => [n, [-dx, -dz]]));   // step from the face into the building
for (const [x, y, z, face] of panes) {
  const [ix, iz] = [x + IN[face][0], z + IN[face][1]];
  if (((x * 3 + z * 5 + y) % 6 === 0) && inside(ix, iz) && !perim.has(key(ix, iz)) && ground.get(key(ix, iz)) <= y)
    put(ix, y, iz, "glowstone");
}
for (const [x, y, z, face] of panes) {
  const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const [n, dx, dz] of CONN[face]) if (FULL.has(blk.get(`${x + dx},${y},${z + dz}`))) st[n] = "true";
  g.set(x, y, z, PANE, st);
}

// roof plant: two low plant boxes on the roof deck, inside the parapet
for (const [x0, x1, z0, z1] of [[9, 12, 17, 20], [15, 18, 26, 29]])
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++)
    if (inside(x, z) && !perim.has(key(x, z))) put(x, ROOF, z, "light_gray_concrete");

const { blocks, palette } = g.save(`${DIR}/way_361657905.nbt`);
console.log(JSON.stringify({ street, doorCell, doorT, panes: panes.length, blocks, palette }));
