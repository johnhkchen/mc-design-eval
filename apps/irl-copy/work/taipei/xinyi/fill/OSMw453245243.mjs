import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245243";
const W = 18, H = 28, D = 17;
const ROOF = 16;

// Mid-rise 1980s-90s Taipei commercial block: 3 storeys of ~5 blocks, white
// tiled-look concrete body, light-grey storey bands, stone plinth, shopfront
// glazing on the ground floor, a stone cornice and a parapet, and a small
// penthouse with an antenna on the roof.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => Math.max(0, Math.min(4, ground.get(`${x},${z}`) ?? 0));
const isRing = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

function exteriorFaces(x, z) {
  const f = [];
  if (!inFp(x, z - 1)) f.push("N");
  if (!inFp(x, z + 1)) f.push("S");
  if (!inFp(x - 1, z)) f.push("W");
  if (!inFp(x + 1, z)) f.push("E");
  return f;
}

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Entrance: ring cell on the south face nearest the centre line.
let door = null;
for (const [x, z] of cells) {
  if (inFp(x, z + 1)) continue;
  if (!door || Math.abs(x - 9) < Math.abs(door.x - 9)) door = { x, z, gd: gnd(x, z) };
}

// Storeys: window rows and the lintel row above each.
const storeyRows = (gr) => [
  { from: gr + 1, to: gr + 3, lintel: gr + 4 },
  { from: 6, to: 8, lintel: 9 },
  { from: 11, to: 13, lintel: 14 },
];

for (const [x, z] of cells) {
  const gr = gnd(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!isRing(x, z)) {
    // Interior: floor slabs only, air in between (no interiors).
    put(x, gr, z, "smooth_stone");
    for (const fy of [5, 10, 15]) if (fy >= gr) put(x, fy, z, "smooth_stone");
    continue;
  }

  // Exterior shell.
  const lintels = new Set(storeyRows(gr).map((s) => s.lintel));
  for (let y = gr; y <= ROOF; y++) {
    if (y === gr) put(x, y, z, "stone_bricks");
    else if (y === ROOF) put(x, y, z, "light_gray_concrete");
    else if (y === ROOF - 1) put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    else if (lintels.has(y)) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "white_concrete");
  }
}

// Windows, entrance, and warm lights on the exterior faces.
for (const [x, z] of cells) {
  if (!isRing(x, z)) continue;
  const gr = gnd(x, z);
  const faces = exteriorFaces(x, z);
  const isDoorCell = door && door.x === x && door.z === z;

  if (isDoorCell) {
    put(x, door.gd + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, door.gd + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, door.gd + 3, z, "light_gray_concrete");
  }

  storeyRows(gr).forEach((s, si) => {
    for (let y = s.from; y <= s.to; y++) {
      if (isDoorCell && y <= door.gd + 2) continue;
      for (const f of faces) {
        const along = f === "N" || f === "S" ? x : z;
        if (along % 3 === 0) continue; // mullion stays as wall
        const ns = f === "N" || f === "S";
        const pane = si === 0 ? "light_blue_stained_glass_pane" : "cyan_stained_glass_pane";
        const props = ns
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        put(x, y, z, pane, props);

        // Warm light just inside some windows.
        if ((x * 3 + z + y) % 7 === 0) {
          const ix = f === "W" ? x + 1 : f === "E" ? x - 1 : x;
          const iz = f === "N" ? z + 1 : f === "S" ? z - 1 : z;
          if (inFp(ix, iz) && !isRing(ix, iz)) put(ix, y, iz, "glowstone");
        }
      }
    }
  });
}

// Penthouse on the roof slab (y 15), centred, with cap and antenna.
for (let x = 6; x <= 11; x++) {
  for (let z = 5; z <= 11; z++) {
    if (!inFp(x, z)) continue;
    const perimeter = x === 6 || x === 11 || z === 5 || z === 11;
    for (let y = ROOF; y <= 18; y++) {
      if (perimeter) put(x, y, z, "white_concrete");
    }
    put(x, 19, z, "light_gray_concrete");
  }
}
for (let y = 20; y <= 23; y++) {
  put(9, y, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
