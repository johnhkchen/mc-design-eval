// 1255 New Hampshire Ave NW: a 1920s-style red-brick apartment block with limestone trim, four storeys on a
// footprint that rises to a five-storey core (the lidar's 14-15 block roof) set back from the podium's edge.
// Storeys are 3 blocks: a limestone string course (y%3==0), a window row (y%3==1), a lintel row (y%3==2).
// Floor slabs sit on every string course, the top layer is the roof deck, and the cells between are air
// (no interiors). Heights come from the lidar's roof numbers: <=4 is a one-storey shop wing, >=14 is the tower
// core (cells with all four neighbours also tall), everything else is the 12-block main body.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC77652.cells.json`, "utf8"));
const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => cell.has(`${x},${z}`);
const roofAt = (x, z) => cell.get(`${x},${z}`).roof;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const isTall = (x, z) => inF(x, z) && roofAt(x, z) >= 14;
const isCore = (x, z) => isTall(x, z) && DIRS.every(([dx, dz]) => isTall(x + dx, z + dz));
const H = (x, z) => (roofAt(x, z) <= 4 ? 3 : isCore(x, z) ? 15 : 12);
const isWing = (x, z) => H(x, z) === 3;

// the sides of a cell that face outside at height y: off the footprint, or past a shorter neighbour
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  return !inF(nx, nz) || H(nx, nz) <= y;
});

// window bays along a face: two panes, then two of brick, repeated (u = x on north/south faces, z on east/west)
const windowOn = (x, z, [dx, dz]) => [1, 2].includes((((dx === 0 ? x : z) % 4) + 4) % 4);

const g = new Voxels([32, 27, 33]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const PANE = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
const panes = new Set(); // glass panes by x,y,z, joined to their neighbours below
const shopFront = new Set();

// pass 1: the massing, with its slabs, deck and exterior skin
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number);
  const h = H(x, z);
  for (let y = 0; y < h; y++) {
    const out = exposed(x, z, y);
    const ring = out.length > 0;
    const deck = y === h - 1;
    const slab = y % 3 === 0;
    if (!ring) {
      if (deck) put(x, y, z, "gray_concrete");
      else if (slab) put(x, y, z, y === 0 ? "stone_bricks" : "smooth_stone");
      continue; // interior air between the slabs
    }
    if (deck) { put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; }
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }
    if (y % 3 === 0) { put(x, y, z, "calcite"); continue; } // string course
    if (isWing(x, z)) {
      // the one-storey shop wing: a glass shopfront under a plain fascia
      if (y === 1) { put(x, y, z, "glass"); shopFront.add(`${x},${y},${z}`); } else put(x, y, z, "stone_bricks");
      continue;
    }
    // a cell on a stair-step or corner has several exposed sides: it takes a window if any of them is in a bay
    const win = out.some((d) => windowOn(x, z, d));
    if (y % 3 === 1) {
      if (win) { put(x, y, z, "glass_pane", PANE); panes.add(`${x},${y},${z}`); }
      else put(x, y, z, "bricks");
      continue;
    }
    // lintel row (y%3==2): limestone over each window, brick over the piers
    put(x, y, z, win ? "calcite" : "bricks");
  }
}

// panes join their neighbours along the wall: east/west across north-south faces, north/south across east-west faces
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const st = {
    north: String(panes.has(`${x},${y},${z - 1}`)), south: String(panes.has(`${x},${y},${z + 1}`)),
    east: String(panes.has(`${x + 1},${y},${z}`)), west: String(panes.has(`${x - 1},${y},${z}`)), waterlogged: "false",
  };
  put(x, y, z, "glass_pane", st);
}

// pass 2: warm light behind some panes (air behind the rest), and lanterns on the shop floor
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const out = exposed(x, z, y)[0];
  if (!out) continue;
  const ix = x - out[0], iz = z - out[1];
  if (!inF(ix, iz) || exposed(ix, iz, y).length) continue; // no room behind the glass
  if ((x * 31 + y * 17 + z * 13) % 3 === 0) put(ix, y, iz, (x + z) % 2 ? "glowstone" : "shroomlight");
}
for (const k of shopFront) {
  const [x, , z] = k.split(",").map(Number);
  if ((x + z) % 2 === 0) put(x, 1, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// the entrance: a dark-oak door on the north front (21,0), limestone piers either side, a lantern by the door
const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };
put(21, 1, 0, "dark_oak_door", { ...DOOR, half: "lower" });
put(21, 2, 0, "dark_oak_door", { ...DOOR, half: "upper" });
put(20, 1, 1, "calcite"); put(20, 2, 1, "calcite");
put(22, 1, 1, "calcite"); put(22, 2, 1, "calcite");
put(21, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });

// roof plant: a stacked box on the podium, and the tower core's lightning rod
for (const [x, z] of [[16, 10], [17, 10], [16, 11], [17, 11]]) {
  put(x, 12, z, "smooth_stone"); put(x, 13, z, "smooth_stone");
}
put(23, 15, 11, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const info = g.save(`${DIR}/DC77652.nbt`);
const core = [...cell.keys()].filter((k) => isCore(...k.split(",").map(Number))).length;
console.log(`wrote DC77652.nbt: ${info.blocks} blocks, ${info.palette} palette entries, ${core} core cells, ${panes.size} panes`);
