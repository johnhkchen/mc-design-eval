import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540298922";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 23, D = 26;
const g = new Voxels([W, H, D]);

// Two storeys of 5 blocks on a 1-block-thick parapet roof (about 11 above lowest ground).
// Ground floor: shopfront with glass and a central entrance.
// Upper floor: framed window grid with warm lights behind glass.
// Floor lines at y=5, cornice/parapet at y=10-11.

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gr = (x, z) => ground.get(`${x},${z}`);

const DIRN = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const exposure = (x, z) =>
  Object.keys(DIRN).filter(d => !has(x + DIRN[d][0], z + DIRN[d][1]));

// Find the longest exposed facade: that is the street front.
const count = { N: 0, S: 0, E: 0, W: 0 };
for (const [x, z] of cells) for (const d of exposure(x, z)) count[d]++;
const front = Object.keys(count).reduce((a, b) => (count[b] > count[a] ? b : a));

// Entrance: front-face cell with the lowest ground, nearest the middle of the face.
const frontCells = cells.filter(([x, z]) => exposure(x, z).includes(front));
const alongOf = (x, z) => (front === "N" || front === "S" ? x : z);
const alongs = frontCells.map(([x, z]) => alongOf(x, z));
const mid = (Math.min(...alongs) + Math.max(...alongs)) / 2;
let doorCell = null;
for (const [x, z, gc] of frontCells) {
  if (gc > 2) continue;
  const score = gc * 100 + Math.abs(alongOf(x, z) - mid);
  if (!doorCell || score < doorCell.score) doorCell = { x, z, gc, score };
}

for (const [x, z, gc] of cells) {
  const ex = exposure(x, z);
  const boundary = ex.length > 0;
  const roofY = Math.max(10, gc);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  // Floor slab for the first storey line, across the whole footprint.
  if (gc <= 5) put(x, 5, z, "smooth_stone");

  if (!boundary) {
    // Interior: air behind glass, roof deck, sparse rooftop AC units.
    put(x, roofY, z, "gray_concrete");
    if (((x * 3 + z) % 7) === 0 && x >= 2 && x <= 8) {
      put(x, roofY + 1, z, "light_gray_concrete");
    }
    continue;
  }

  // Facade cell: choose the face that counts (front first).
  const d = ex.includes(front) ? front : ex[0];
  const [dx, dz] = DIRN[d];
  const along = d === "N" || d === "S" ? x : z;
  const pillar = along % 3 === 0;
  const isDoor = doorCell && doorCell.x === x && doorCell.z === z;
  const doorY = gc + 1;

  for (let y = gc; y < roofY; y++) {
    if (y === gc) {
      put(x, y, z, "stone_bricks"); // base course
    } else if (y === 5) {
      put(x, y, z, "smooth_stone"); // storey line
    } else if (y === 4) {
      put(x, y, z, "smooth_stone"); // shopfront lintel
    } else if (y >= 1 && y <= 3) {
      // Ground-floor shopfront.
      if (isDoor && (y === doorY || y === doorY + 1)) {
        const half = y === doorY ? "lower" : "upper";
        put(x, y, z, "oak_door", {
          facing: FACING[front],
          half,
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (isDoor && y === doorY + 2) {
        put(x, y, z, "glass_pane"); // transom above door
      } else if (pillar) {
        put(x, y, z, "polished_andesite");
      } else {
        put(x, y, z, "glass_pane");
        // Warm light behind some shopfront glass.
        if (along % 6 === 2) {
          const ix = x - dx, iz = z - dz;
          if (has(ix, iz) && exposure(ix, iz).length === 0 && gc <= 2) {
            put(ix, 2, iz, "glowstone");
          }
        }
      }
    } else if (y >= 6 && y <= 8) {
      // Upper storey: framed window grid.
      if (pillar) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane");
        if (y === 7 && along % 6 === 1) {
          const ix = x - dx, iz = z - dz;
          if (has(ix, iz) && exposure(ix, iz).length === 0) {
            put(ix, 7, iz, "glowstone");
          }
        }
      }
    } else if (y === 9) {
      put(x, y, z, "smooth_stone"); // upper lintel
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // Parapet and cap.
  put(x, roofY, z, "white_concrete");
  put(x, roofY + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
