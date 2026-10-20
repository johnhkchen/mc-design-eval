import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: low-rise 1970s-80s Taipei commercial block, two storeys over a
// shopfront ground floor. Whitewashed concrete with light-grey piers and
// bands, glass-pane window bays, stone-brick plinth and parapet, a central
// entrance on the north (street) face, and a small rooftop mechanical box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414361";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));
const groundAt = (x, z) => ground.get(key(x, z));

const L = Math.min(...cells.map((c) => c[2]));   // lowest ground under footprint
const ROOF = L + 11;                              // roof deck layer

function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Exterior faces: outward neighbour direction, facing name, and pane connections.
const faces = [
  { name: "north", dx: 0, dz: -1, alongX: true,  pane: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" } },
  { name: "south", dx: 0, dz: 1,  alongX: true,  pane: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" } },
  { name: "west",  dx: -1, dz: 0, alongX: false, pane: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" } },
  { name: "east",  dx: 1, dz: 0,  alongX: false, pane: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" } },
];

const exposures = (x, z) => faces.filter((f) => !inside(x + f.dx, z + f.dz));

// Entrance: north (street) face, cell nearest the middle of the width.
let doorX = null, doorY = null;
{
  let best = Infinity;
  for (const [x, z, gr] of cells) {
    if (!inside(x, z - 1) && Math.abs(x - W / 2) < best) {
      best = Math.abs(x - W / 2);
      doorX = x;
      doorY = gr;
    }
  }
}

// Pass 1: foundations, walls, bands, windows, piers, door.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ex = exposures(x, z);
  const corner = ex.length > 1;
  const f = ex[0];

  if (ex.length) {
    const t = f ? (f.alongX ? x : z) : 0;
    const pier = corner || t % 4 === 0;
    const isDoorCell = f && f.name === "north" && x === doorX;

    for (let y = gr; y < ROOF; y++) {
      let block = "white_concrete";
      let props;

      const band = y === L + 4 || y === L + 5 || y === L + 10;
      const w1 = y >= L + 1 && y <= L + 3;
      const w2 = y >= L + 7 && y <= L + 9;

      if (band) {
        block = "light_gray_concrete";
      } else if (y === L && gr === L) {
        block = "smooth_stone"; // base course at grade
      }

      if (isDoorCell && !band) {
        if (y === doorY || y === doorY + 1) {
          block = "oak_door";
          props = {
            facing: "north",
            half: y === doorY ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          };
        } else if (y >= doorY + 2 && y <= L + 3) {
          block = "light_gray_concrete";
        } else if (w2) {
          block = "glass_pane";
          props = f.pane;
        }
        if (block === "white_concrete" && w1 && y > doorY + 1) {
          block = "light_gray_concrete";
        }
      } else if (pier) {
        block = "light_gray_concrete";
      } else if (w1 || w2) {
        block = "glass_pane";
        props = f.pane;
      }

      // Plinth band on the lowest course of exposed walls above grade.
      if (y === gr && gr === L && !(isDoorCell && (y === doorY))) {
        if (!pier && !w1) block = "smooth_stone";
      }

      put(x, y, z, block, props);
    }

    // Parapet course on top of the deck.
    put(x, ROOF + 1, z, "stone_bricks");
  }
}

// Pass 2: interior air is left empty; floor slab at storey line; roof deck.
for (const [x, z, gr] of cells) {
  if (L + 5 >= gr) put(x, L + 5, z, "light_gray_concrete");
  put(x, ROOF, z, "smooth_stone");
}

// Pass 3: warm lights set just inside some window bays.
for (const [x, z, gr] of cells) {
  const ex = exposures(x, z);
  if (ex.length !== 1) continue;
  const f = ex[0];
  const t = f.alongX ? x : z;
  if (t % 4 === 0) continue;
  const ix = x - f.dx, iz = z - f.dz;
  if (!inside(ix, iz)) continue;
  const igr = groundAt(ix, iz);
  const pick = (x + z) % 3 === 0;
  if (!pick) continue;

  const y1 = L + 2, y2 = L + 8;
  if (y1 >= igr && y1 !== L + 5) {
    put(ix, y1, iz, (x + z) % 2 === 0 ? "shroomlight" : "lantern", (x + z) % 2 === 0 ? undefined : { hanging: "false", waterlogged: "false" });
  }
  if (y2 >= igr && y2 !== L + 5) {
    put(ix, y2, iz, "shroomlight");
  }
}

// Pass 4: rooftop mechanical box, centred on the footprint.
const boxCells = [];
for (let x = 4; x <= 7; x++) for (let z = 6; z <= 11; z++) {
  if (inside(x, z)) boxCells.push([x, z]);
}
for (const [x, z] of boxCells) {
  put(x, ROOF + 1, z, "light_gray_concrete");
  put(x, ROOF + 2, z, "light_gray_concrete");
  put(x, ROOF + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
