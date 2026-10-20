import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw385812666";
const W = 18, H = 23, D = 62;

// Lidar record: roof about 11 blocks above lowest ground. Mid-century (1960s-70s)
// Taipei low-rise: exposed concrete frame, pale tiled spandrels, ground-floor shopfronts
// with a red sign fascia, flat roof with a parapet, railing and steel water tanks.
const ROOF = 11;        // roof deck top surface sits at y = 11
const FLOOR_1 = 5;      // ground-floor slab / second-floor line
const ROOF_SLAB = 10;   // roof slab / cornice course
const FASCIA = 4;       // red sign band at top of shopfront

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(Math.floor(gr), 12)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };

// Faces on which the neighbour lies outside the footprint (exterior walls).
function faces(x, z) {
  const out = [];
  for (const [k, [dx, dz]] of Object.entries(DIRS)) {
    if (!has(x + dx, z + dz)) out.push(k);
  }
  return out;
}

const g = new Voxels([W, H, D]);

const paneX = { north: "true", south: "true", east: "false", west: "false" };  // pane running along z (on W/E faces)
const paneZ = { north: "false", south: "false", east: "true", west: "true" };  // pane running along x (on N/S faces)

// Pass 1: foundations, floors, walls, windows with sills and lintels, entrance, parapet, railing.
for (const [x, z] of cells) {
  const gr = gAt(x, z);

  // Foundation / base course: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Raised ground above the roof line: plinth only.
  if (gr >= ROOF) continue;

  const f = faces(x, z);
  const ring = f.length > 0;
  const face = f.find((d) => d === "W" || d === "E") ?? f[0];
  const xFace = face === "W" || face === "E";
  const idx = xFace ? z : x;                 // bay index along the facade
  const pane = xFace ? paneX : paneZ;
  const windowBay = idx % 3 === 1;

  // Door on the west or east facade at z = 30 (ground floor, needs gr <= 3).
  const isDoorCol = ring && xFace && z === 30 && gr <= 3;

  for (let y = gr; y <= ROOF; y++) {
    // Storey slabs and roof deck run across the whole footprint.
    if (y === FLOOR_1 || y === ROOF_SLAB) {
      g.set(x, y, z, ring ? "white_concrete" : "smooth_stone");
      continue;
    }

    // Parapet course at roof level.
    if (y === ROOF) {
      if (ring) g.set(x, y, z, "white_concrete");
      continue;
    }

    // Interior cells: air above the slabs.
    if (!ring) continue;

    // Red sign fascia at the top of the shopfront.
    if (y === FASCIA && gr <= FASCIA) {
      g.set(x, y, z, "red_terracotta");
      continue;
    }

    if (y < FLOOR_1) {
      // Ground floor shopfront: glass bays between white concrete pillars.
      if (isDoorCol && y <= gr + 1) {
        const facing = face === "W" ? "east" : "west";
        g.set(x, y, z, "dark_oak_door", {
          facing,
          half: y === gr ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (isDoorCol && y === gr + 2) {
        // Door lintel: stone surround with a red fascia above it.
        g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
      if (isDoorCol && y === 3 && gr <= 2) {
        // Keep a lintel course above the door opening.
        g.set(x, y, z, "stone_bricks");
        continue;
      }
      if (idx % 3 === 0) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "light_blue_stained_glass_pane", pane);
      continue;
    }

    if (y < ROOF_SLAB) {
      // Second storey: spandrels top and bottom, window band in the middle,
      // stone sills and lintels on the window bays for depth.
      if (y === 6) {
        if (windowBay) g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
        else g.set(x, y, z, "light_gray_concrete");
      } else if (y === 9) {
        if (windowBay) g.set(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
        else g.set(x, y, z, "light_gray_concrete");
      } else if (windowBay) {
        g.set(x, y, z, "light_blue_stained_glass_pane", pane);
      } else {
        // Pilasters project visually: stone bricks read darker than the spandrels.
        g.set(x, y, z, "stone_bricks");
      }
      continue;
    }
  }

  // Continuous railing on the parapet, connected to neighbouring railing cells.
  if (ring && gr < ROOF) {
    const conn = {
      north: ring_(x, z - 1) ? "true" : "false",
      south: ring_(x, z + 1) ? "true" : "false",
      east: ring_(x + 1, z) ? "true" : "false",
      west: ring_(x - 1, z) ? "true" : "false",
    };
    g.set(x, ROOF + 1, z, "iron_bars", conn);
  }
}

function ring_(x, z) {
  return has(x, z) && faces(x, z).length > 0;
}

// Pass 2: warm lights behind selected window bays (in the air gap inside the glass).
for (const [x, z] of cells) {
  const gr = gAt(x, z);
  if (gr >= ROOF) continue;
  const f = faces(x, z);
  if (!f.length) continue;
  const face = f.find((d) => d === "W" || d === "E") ?? f[0];
  const xFace = face === "W" || face === "E";
  const idx = xFace ? z : x;
  if (idx % 9 !== 4 || idx % 3 !== 1) continue;

  const inward = face === "W" ? [1, 0] : face === "E" ? [-1, 0]
    : face === "N" ? [0, 1] : [0, -1];
  const nx = x + inward[0], nz = z + inward[1];
  if (!has(nx, nz)) continue;
  if (faces(nx, nz).length) continue; // keep the cell behind the glass open
  if (gAt(nx, nz) > 7) continue;
  g.set(nx, 7, nz, "shroomlight");
}

// Pass 3: roof equipment, two steel water tanks on the roof deck.
const tanks = [[4, 18], [11, 40]];
for (const [tx, tz] of tanks) {
  const block = [[tx, tz], [tx + 1, tz], [tx, tz + 1], [tx + 1, tz + 1]];
  if (!block.every(([x, z]) => has(x, z) && faces(x, z).length === 0)) continue;
  for (const [x, z] of block) {
    const gr = gAt(x, z);
    if (gr >= ROOF) continue;
    for (let y = ROOF; y <= ROOF + 2; y++) g.set(x, y, z, "iron_block");
    g.set(x, ROOF + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
