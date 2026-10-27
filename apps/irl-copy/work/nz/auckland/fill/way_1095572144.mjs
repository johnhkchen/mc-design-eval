// Way 1095572144: a two-storey Edwardian brick shop-and-flat block on a basalt plinth, flat gravel roof,
// stone cornice. The lidar roof is 7 blocks over most of the footprint and 9 along the west edge, so the
// west edge is a raised corner bay with a third window row; its inner side is a step wall above the main roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_1095572144.cells.json`, "utf8"));
const X = 8, Y = 22, Z = 12;

const roof = new Map();
for (const [x, z, , top] of cells) roof.set(`${x},${z}`, top);
const inFp = (x, z) => roof.has(`${x},${z}`);
const rf = (x, z) => roof.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR_NAME = new Map([["1,0", "east"], ["-1,0", "west"], ["0,1", "south"], ["0,-1", "north"]]);

// exterior faces: sides whose neighbour lies outside the footprint
const exteriorDirs = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));
// step wall: a cell taller than a neighbour stands as a wall above the lower roof
const stepWall = (x, z) => DIRS.some(([dx, dz]) => inFp(x + dx, z + dz) && rf(x + dx, z + dz) < rf(x, z));
const isWall = (x, z) => exteriorDirs(x, z).length > 0 || stepWall(x, z);

// street front: the +z side; the entrance sits on the one front cell that has that face
const DOOR = [3, 11];

const g = new Voxels([X, Y, Z]);

for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  const R = rf(x, z);
  const ext = exteriorDirs(x, z);
  const wall = isWall(x, z);
  if (!wall) {
    // interior: floor slab on the ground, a first-floor slab, and the roof covering; air between
    g.set(x, 0, z, "stone_bricks");
    g.set(x, 4, z, "smooth_stone");
    g.set(x, R - 1, z, "gravel");
    continue;
  }
  // no stone quoins: on this diagonal footprint most edge cells are "corners" and the walls read as grey stone
  const corner = false;
  const facesZ = ext.some(([, dz]) => dz !== 0);           // a face looking along z: bays run along x
  const q = facesZ ? x : z;
  const pier = q % 3 === 0;
  const front = x === DOOR[0] && z === DOOR[1];

  g.set(x, 0, z, "polished_blackstone_bricks");            // basalt plinth
  for (let y = 1; y <= 3; y++) {
    if (front && y <= 2) {
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    } else if (corner) {
      g.set(x, y, z, "stone_bricks");
    } else if (y === 3) {
      g.set(x, y, z, facesZ && ext.some(([, dz]) => dz > 0) ? "dark_oak_planks" : "bricks");   // shopfront fascia / lintel
    } else if (pier || !ext.length) {
      g.set(x, y, z, "bricks");
    } else {
      g.set(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    }
  }
  g.set(x, 4, z, "smooth_stone");                           // storey line
  for (let y = 5; y <= R - 2; y++) {
    if (corner) g.set(x, y, z, "stone_bricks");
    else if (pier || !ext.length) g.set(x, y, z, "bricks");
    else g.set(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  }
  g.set(x, R - 1, z, "smooth_stone");                       // cornice
}

// warm light: a glowstone just inside some windows (ground and first floor)
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  if (!isWall(x, z)) continue;
  const ext = exteriorDirs(x, z);
  if (!ext.length || (x + z) % 2 !== 0) continue;
  for (const [y] of [[1], [5]]) {
    if (y >= rf(x, z) - 1) continue;
    const [dx, dz] = ext[0];
    const ix = x - dx, iz = z - dz;
    if (inFp(ix, iz) && !isWall(ix, iz) && rf(ix, iz) > y) g.set(ix, y, iz, "glowstone");
  }
}

// roof plant on the flat roof of the main body
for (const [x, z] of [[3, 5], [5, 8]]) {
  if (inFp(x, z) && !isWall(x, z) && rf(x, z) === 7) g.set(x, 7, z, "iron_block");
}

// glass panes connect to in-plane neighbours only
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  for (let y = 0; y < Y; y++) {
    const c = g.get(x, y, z);
    if (!c || c.block !== "minecraft:glass_pane") continue;
    const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
    for (const [dx, dz] of DIRS) {
      const n = g.get(x + dx, y, z + dz);
      if (n && n.block !== "minecraft:glowstone") {
        // connect only along the wall plane (the wall's own face axis)
        const along = (dx !== 0 && !exteriorDirs(x, z).some(([ex]) => ex !== 0)) || (dz !== 0 && !exteriorDirs(x, z).some(([, ez]) => ez !== 0));
        if (along) st[DIR_NAME.get(`${dx},${dz}`)] = "true";
      }
    }
    g.set(x, y, z, "glass_pane", st);
  }
}

const out = g.save(`${HERE}/way_1095572144.nbt`);
console.log(JSON.stringify(out));
