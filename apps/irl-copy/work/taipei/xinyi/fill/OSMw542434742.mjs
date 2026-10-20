import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw542434742";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 7, H = 23, D = 15;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "east", dx: 1, dz: 0 },
  { n: "west", dx: -1, dz: 0 },
];
const exposed = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

// Glass pane connections: panes on north/south faces run east-west, others north-south
const paneProps = (f) =>
  f.n === "north" || f.n === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const doorProps = (f, half) => ({ facing: f.n, half, hinge: "left", open: "false", powered: "false" });

const put = (x, y, z, block, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const DOOR_X = 3;

for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  const per = ex.length > 0;
  const face = ex.find((f) => f.n === "north") ?? ex[0];

  // Foundation up to the lowest-own ground, then base course
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "polished_andesite");

  // Storey slab at ~5 blocks above this cell's ground, and the top-storey ceiling at 9
  const sL = Math.min(gr + 5, 8);
  put(x, sL, z, "smooth_quartz");
  put(x, 9, z, "smooth_quartz");

  if (per) {
    const isFront = face && face.n === "north";

    // Ground storey (commercial shopfront on the street face)
    for (let y = gr + 1; y <= sL - 1; y++) {
      if (isFront && x > 0 && x < W - 1) {
        if (y === sL - 1) {
          put(x, y, z, "red_terracotta"); // fascia sign band
        } else if (x === DOOR_X && y === gr + 1) {
          put(x, y, z, "dark_oak_door", doorProps(face, "lower"));
        } else if (x === DOOR_X && y === gr + 2) {
          put(x, y, z, "dark_oak_door", doorProps(face, "upper"));
        } else if (x === DOOR_X) {
          put(x, y, z, "white_terracotta");
        } else if (y === gr + 1) {
          put(x, y, z, "polished_andesite"); // plinth
        } else {
          put(x, y, z, "glass_pane", paneProps(face)); // shop glazing
        }
      } else {
        put(x, y, z, "white_terracotta");
      }
    }

    // Upper storey: sill, window rows with piers, lintel is the slab at 9
    for (let y = sL + 1; y <= 8; y++) {
      if (y === sL + 1) {
        put(x, y, z, "smooth_quartz"); // sill course
        continue;
      }
      const f = face ?? ex[0];
      const idx = f.n === "north" || f.n === "south" ? x : z;
      const isWindow = idx % 2 === 1;
      if (isWindow) {
        const lit = (x + z + idx + y) % 4 === 1 && y === sL + 2;
        if (lit) put(x, y, z, "glowstone");
        else put(x, y, z, "glass_pane", paneProps(f));
      } else {
        put(x, y, z, "white_terracotta");
      }
    }

    // Cornice and parapet
    put(x, 10, z, "smooth_quartz");
    put(x, 11, z, "white_terracotta");
  } else {
    // Interior: roof deck
    put(x, 10, z, "smooth_stone");
  }
}

// Rooftop water tank on the interior of the roof
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const ex = exposed(x, z);
  if (ex.length > 0) continue;
  if (x >= 2 && x <= 3 && z >= 5 && z <= 6) {
    for (let y = 11; y <= 13; y++) put(x, y, z, "iron_block");
  }
}

g.save(`${dir}/${id}.nbt`);
