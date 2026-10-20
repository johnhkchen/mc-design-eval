import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535173681";
const W = 21, H = 23, D = 19;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of raw) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Floor level of the whole block: highest ground under the footprint.
let G = 0;
for (const v of ground.values()) G = Math.max(G, v);

// Storeys: ground storey G+1..G+4 (5 blocks incl. slab), upper G+6..G+9, parapet G+10..G+11.
const ROOF = G + 10;
const TOP = G + 11;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!has(x, z)) return; // build only on footprint cells
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const DIRS = [
  { dx: 1, dz: 0, name: "east", facing: "west" },
  { dx: -1, dz: 0, name: "west", facing: "east" },
  { dx: 0, dz: 1, name: "south", facing: "north" },
  { dx: 0, dz: -1, name: "north", facing: "south" },
];
const missing = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

// Facade cells and their outward directions.
const facade = new Map();
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const m = missing(x, z);
  if (m.length) facade.set(`${x},${z}`, m);
}

// Entrance: on the north (min z) face, middle of that run along x.
let doorKey = null;
{
  const north = [...facade.entries()]
    .filter(([k, m]) => m.some((d) => d.dz === -1))
    .map(([k]) => k.split(",").map(Number))
    .sort((a, b) => a[0] - b[0]);
  if (north.length) {
    const mid = north[Math.floor(north.length / 2)];
    doorKey = `${mid[0]},${mid[1]}`;
  } else if (facade.size) {
    const [k] = [...facade.keys()][0] ? [[...facade.keys()][0]] : [null];
    doorKey = k;
  }
}
const doorDir = doorKey ? facade.get(doorKey)[0] : null;

for (const [x, z, gr] of raw) {
  // Foundation: solid from y 0 up to the floor level (covers each cell's own ground).
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  const key = `${x},${z}`;
  const m = facade.get(key);
  const isFacade = !!m;

  // Floor slab / base course at the floor level.
  put(x, G, z, isFacade ? "gray_concrete" : "smooth_stone");

  if (isFacade) {
    const onZFace = m.some((d) => d.dz !== 0);
    const t = onZFace ? x : z; // position along the wall
    const out = m[0];
    const isDoor = key === doorKey;

    // Ground storey: shopfront glass, quartz pillars, door.
    for (let y = G + 1; y <= G + 4; y++) {
      if (isDoor) {
        if (y <= G + 2) {
          const half = y === G + 1 ? "lower" : "upper";
          put(x, y, z, "iron_door", {
            facing: doorDir.facing,
            half,
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (y === G + 3) {
          put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        } else {
          put(x, y, z, "smooth_quartz");
        }
      } else if (t % 3 === 0) {
        put(x, y, z, "smooth_quartz");
      } else {
        put(x, y, z, "glass");
      }
    }

    // Storey line / spandrel.
    put(x, G + 5, z, "smooth_quartz");

    // Upper storey: window grid with mullions, warm light behind some panes.
    for (let y = G + 6; y <= G + 9; y++) {
      if (t % 3 === 0) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "light_blue_stained_glass");
    }
    if (t % 6 === 1) {
      const ix = x - out.dx, iz = z - out.dz;
      if (has(ix, iz)) put(ix, G + 7, iz, "glowstone");
    }

    // Parapet and cornice cap.
    put(x, G + 10, z, "white_concrete");
    put(x, G + 11, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // Interior: storey floor slab and roof slab; air between.
    put(x, G + 5, z, "smooth_stone");
    put(x, ROOF, z, "light_gray_concrete");
  }
}

// Roof equipment: a plant block and a small stair-stacked mechanical unit on interior roof.
for (let x = 7; x <= 10; x++) {
  for (let z = 6; z <= 9; z++) {
    if (!has(x, z) || facade.has(`${x},${z}`)) continue;
    put(x, TOP, z, "light_gray_concrete");
    if (x >= 8 && x <= 9 && z >= 7 && z <= 8) {
      put(x, TOP + 1, z, "iron_block");
    }
  }
}
for (let x = 13; x <= 15; x++) {
  for (let z = 5; z <= 7; z++) {
    if (!has(x, z) || facade.has(`${x},${z}`)) continue;
    put(x, TOP, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
