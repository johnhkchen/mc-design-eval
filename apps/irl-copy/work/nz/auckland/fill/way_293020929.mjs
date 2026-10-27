// Way 293020929: a two-storey red-brick commercial block, 1920s-30s Auckland (brick and stone-trim shops of the inter-war
// main streets). The lidar roof runs 7-9 blocks; it is cleaned to one flat body 8 high (two storeys of 4), a cornice at
// 8 and a parapet to 9, so the roof reads 10 blocks above the ground. A plant box sits on the roof core where the lidar
// is 9. Shopfront glass on the ground floor, paired upper windows, string courses at each floor line, corner quoins.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_293020929.cells.json`, "utf8"));   // [x, z, ground, roof]

const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { ground, roof });
const has = (x, z) => cell.has(`${x},${z}`);
const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };          // outward normals (N = -z)
const FACING = { N: "south", S: "north", E: "west", W: "east" };         // a door's facing: the way its player stands
const faces = (x, z) => Object.keys(OUT).filter((f) => !has(x + OUT[f][0], z + OUT[f][1]));

// distance in cells from the outer wall: 0 = the perimeter wall, 1 = behind it, 2+ = the core
const dist = new Map(), queue = [];
for (const k of cell.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (faces(x, z).length) { dist.set(k, 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(`${x},${z}`);
  for (const [dx, dz] of Object.values(OUT)) {
    const k = `${x + dx},${z + dz}`;
    if (cell.has(k) && !dist.has(k)) { dist.set(k, d + 1); queue.push(k.split(",").map(Number)); }
  }
}

const g = new Voxels([12, 22, 16]);
const glass = new Set();
const put = (x, y, z, block, state) => {
  g.set(x, y, z, block, state);
  if (block === "glass_pane") glass.add(`${x},${y},${z}`); else glass.delete(`${x},${y},${z}`);
};

// the door goes on the south-facing wall cell that lies furthest south with no other outer face (a plain wall, not a corner)
const doorKey = [...cell.keys()]
  .filter((k) => faces(...k.split(",").map(Number)).join("") === "S")
  .sort((a, b) => Number(b.split(",")[1]) - Number(a.split(",")[1]))[0];
const [doorX, doorZ] = doorKey.split(",").map(Number);
const lights = [];   // [x, y, z, block, state] placed behind the glass once the shell is up

for (const [k, { ground, roof }] of cell) {
  const [x, z] = k.split(",").map(Number);
  const d = dist.get(k), fs = faces(x, z);

  // foundation: solid from y 0 up to the lowest ground (flat here, so the base course on y 0)
  for (let y = 0; y < Math.max(ground, 1); y++) put(x, y, z, "stone_bricks");

  if (d > 0) {
    // interior: a floor slab on the first floor line and the roof deck; air between, behind the glass
    put(x, 4, z, "smooth_stone");
    put(x, 8, z, "smooth_stone");
    if (d >= 2 && roof >= 9) {   // roof plant box on the core where the lidar stands at 9
      put(x, 9, z, "bricks");
      put(x, 10, z, "smooth_stone");
    }
    continue;
  }

  // perimeter wall: red brick all the way, with the stone bands; glass bays alternate with brick piers on each face
  // (the corners are brick too: a stepped footprint makes too many corners for quoins to read as anything but grey)
  const face = fs[0];
  const along = face === "N" || face === "S" ? x : z;
  const bay = along % 2 === 1;
  const isDoor = k === doorKey;

  put(x, 1, z, bay ? "glass_pane" : "bricks");
  put(x, 2, z, bay ? "glass_pane" : "bricks");
  put(x, 3, z, "smooth_stone");                                          // ground-floor lintel
  put(x, 4, z, "smooth_stone");                                          // first floor string course
  put(x, 5, z, bay ? "glass_pane" : "bricks");
  put(x, 6, z, bay ? "glass_pane" : "bricks");
  put(x, 7, z, "smooth_stone");                                          // upper lintel
  put(x, 8, z, "stone_brick_slab", { type: "bottom" });                  // cornice
  put(x, 9, z, "bricks");                                                // parapet

  if (isDoor) {
    const facing = FACING[face];
    put(x, 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, 3, z, "smooth_stone");
  } else if (bay) {
    // warm light behind every other upper window and in the shop behind the ground-floor glass, if there is room inside
    const ix = x - OUT[face][0], iz = z - OUT[face][1], ik = `${ix},${iz}`;
    if (cell.has(ik) && dist.get(ik) > 0 && along % 4 === 1) {
      lights.push([ix, 5, iz, "glowstone"]);
    } else if (cell.has(ik) && dist.get(ik) > 0) {
      lights.push([ix, 3, iz, "lantern", { hanging: "true", waterlogged: "false" }]);
    }
  }
}

for (const [x, y, z, block, state] of lights) put(x, y, z, block, state);

// panes join their neighbours: a pane's arm points to each side with something solid in it
for (const k of glass) {
  const [x, y, z] = k.split(",").map(Number);
  const arm = (dx, dz) => (g.val(x + dx, y, z + dz) > 0 ? "true" : "false");
  g.set(x, y, z, "glass_pane", { north: arm(0, -1), south: arm(0, 1), east: arm(1, 0), west: arm(-1, 0) });
}

const out = `${DIR}/way_293020929.nbt`;
const { blocks, palette } = g.save(out);
console.log(`saved ${out}: ${blocks} blocks, ${palette} palette entries, footprint ${cell.size} cells, door at ${doorX},${doorZ}`);
