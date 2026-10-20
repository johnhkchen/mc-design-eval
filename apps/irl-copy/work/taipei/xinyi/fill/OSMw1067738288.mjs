import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: footprint 21 x 19, roof ~21 blocks above lowest ground (~15 m).
// Read as a 1990s-2000s Xinyi mid-rise: 4 storeys of 5 blocks (3.5 m each),
// white-tiled concrete facade, light-grey storey bands, glass-and-concrete
// window grid, shopfront ground floor with a stone base and a door on the south side,
// smooth-stone cornice, parapet, and a rooftop mechanical penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738288";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 33, D = 19;
const g = new Voxels([W, H, D]);

const ROOF_Y = 20;     // roof slab / cornice row (top surface at 21)
const PARAPET_Y = 21;  // one-block parapet on the facade
const FLOORS = [5, 10, 15]; // storey lines (floor slabs and bands)

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const OUT = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];

const facesOf = (x, z) => OUT.filter((f) => !ground.has(key(x + f.dx, z + f.dz)));

const paneProps = (f) =>
  f.n === "north" || f.n === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const isLit = (x, y, z) => ((x * 31 + y * 17 + z * 7) % 9) === 0;

// Pass 1: foundations, floor slabs, roof deck
for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  // floor slabs at each storey line (interior, no air gap through the slab)
  for (const s of FLOORS) {
    if (s >= gr) g.set(x, s, z, "light_gray_concrete");
  }
}

// Pass 2: facade shell, cornice, parapet, roof deck
for (const [x, z, gr] of cells) {
  const fs = facesOf(x, z);
  const isFacade = fs.length > 0;
  const isCorner = fs.length >= 2;

  if (!isFacade) {
    // interior roof deck
    if (gr <= ROOF_Y) g.set(x, ROOF_Y, z, "gray_concrete");
    continue;
  }

  // cornice row and parapet
  if (gr <= ROOF_Y) g.set(x, ROOF_Y, z, "smooth_stone");
  g.set(x, PARAPET_Y, z, "smooth_stone");

  if (isCorner) {
    // corner columns: concrete piers, full height
    for (let y = gr; y < ROOF_Y; y++) g.set(x, y, z, "light_gray_concrete");
    continue;
  }

  const f = fs[0];
  const pos = (f.n === "north" || f.n === "south") ? x : z;
  const m = pos % 3;
  const isSouthDoorCell = f.n === "south" && x === 10;

  for (let y = gr; y < ROOF_Y; y++) {
    if (y < 5) {
      // ground floor: stone base, shopfront glazing, fascia
      if (y === gr) {
        g.set(x, y, z, "stone_bricks");
      } else if (y === 4) {
        g.set(x, y, z, isSouthDoorCell ? "dark_oak_slab" : "light_gray_concrete", isSouthDoorCell ? { type: "bottom", waterlogged: "false" } : undefined);
      } else if (m === 0) {
        g.set(x, y, z, "stone_bricks");
      } else {
        g.set(x, y, z, "glass_pane", paneProps(f));
      }
    } else {
      const rel = (y - 5) % 5;
      if (rel === 0) {
        // storey band
        g.set(x, y, z, "light_gray_concrete");
      } else if (rel === 4) {
        // spandrel wall
        g.set(x, y, z, "white_concrete");
      } else {
        // window row: glass panes with concrete mullions
        if (m === 0) {
          g.set(x, y, z, "light_gray_concrete");
        } else {
          g.set(x, y, z, "glass_pane", paneProps(f));
        }
      }
    }
  }
  // base wall above the storey-line bands where no window row is defined
  // (already covered by the loop above; ROOF_Y row set as cornice)

  // door and entrance on the south facade, centred
  if (isSouthDoorCell && gr <= 1) {
    const dy = gr + 1;
    g.set(x, dy, z, "dark_oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, dy + 1, z, "dark_oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }

  // warm light behind some windows: glowstone on the inside of a pane
  for (const y of [6, 7, 8, 11, 12, 13, 16, 17, 18]) {
    if (y < gr || y > 19) continue;
    if (((y - 5) % 5) === 4 || ((y - 5) % 5) === 0) continue;
    if (m === 0) continue;
    if (!isLit(x, y, z)) continue;
    const ix = x - f.dx, iz = z - f.dz;
    if (ground.has(key(ix, iz)) && facesOf(ix, iz).length === 0 && ground.get(key(ix, iz)) <= y) {
      g.set(ix, y, iz, "glowstone");
    }
  }
}

// Pass 3: rooftop mechanical penthouse on the interior roof
for (let x = 7; x <= 13; x++) {
  for (let z = 6; z <= 12; z++) {
    if (!ground.has(key(x, z))) continue;
    const gr = ground.get(key(x, z));
    if (gr > ROOF_Y) continue;
    const edge = x === 7 || x === 13 || z === 6 || z === 12;
    if (edge) {
      g.set(x, 21, z, "white_concrete");
      g.set(x, 22, z, (x === 10 || z === 9) ? "light_gray_concrete" : "glass_pane",
        (x === 10 || z === 9) ? undefined : { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    } else {
      g.set(x, 21, z, "gray_concrete");
    }
    g.set(x, 23, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Small antenna mast on the penthouse, centred
g.set(10, 24, 9, "iron_bars");
g.set(10, 25, 9, "iron_bars");
g.set(10, 26, 9, "lightning_rod", { facing: "up", powered: "false" });

g.save(`${DIR}/${ID}.nbt`);
