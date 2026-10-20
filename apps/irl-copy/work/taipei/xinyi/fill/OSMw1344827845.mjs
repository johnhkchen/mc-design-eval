import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1344827845";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 19, D = 7;
const g = new Voxels([W, H, D]);

// Heights: roof deck at y=7 (about 7 blocks above lowest ground), parapet 8-9.
const ROOF = 7;
const BAND = 4;      // storey line between ground floor and upper floor
const TOP_WALL = 6;  // last wall course below roof deck

const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const FACE_ORDER = ["south", "north", "east", "west"];

const fp = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, Math.round(gr)]));
const has = (x, z) => fp.has(`${x},${z}`);
const exposed = (x, z) =>
  FACE_ORDER.filter((f) => {
    const [dx, dz] = DIRS[f];
    return !has(x + dx, z + dz);
  });

// Door: south-exposed, single-face perimeter cell nearest the footprint centre.
const xs = cells.map((c) => c[0]);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
let doorCell = null;
for (const [x, z] of cells) {
  const ex = exposed(x, z);
  if (ex.length === 1 && ex[0] === "south") {
    if (!doorCell || Math.abs(x - cx) < Math.abs(doorCell[0] - cx)) doorCell = [x, z];
  }
}

const paneProps = (f) =>
  f === "north" || f === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, floors, roof deck, shell.
for (const [x, z, gr] of cells) {
  // Foundation below ground, plinth at ground level.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "smooth_stone");

  // Storey floor slab (interior) / storey line (perimeter) and roof deck.
  const ex = exposed(x, z);
  const perim = ex.length > 0;
  g.set(x, BAND, z, perim ? "light_gray_concrete" : "smooth_stone");
  g.set(x, ROOF, z, "light_gray_concrete");
  if (!perim) continue;

  const corner = ex.length >= 2;
  if (corner) {
    // Corner piers run full height of the shell.
    for (let y = gr + 1; y <= TOP_WALL; y++) {
      if (y === BAND) continue;
      g.set(x, y, z, "smooth_quartz");
    }
    g.set(x, 8, z, "smooth_quartz");
    g.set(x, 9, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    continue;
  }

  const f = ex[0];
  const u = f === "north" || f === "south" ? x : z;
  const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z;

  if (isDoor) {
    // Recessed entrance: glass-door pair with a dark oak canopy lintel.
    g.set(x, gr + 1, z, "dark_oak_door", { facing: f, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, z, "dark_oak_door", { facing: f, half: "upper", hinge: "left", open: "false", powered: "false" });
    if (gr + 3 <= 3) {
      g.set(x, gr + 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }
    for (let y = gr + 4; y <= TOP_WALL; y++) {
      if (y === BAND) continue;
      g.set(x, y, z, "white_concrete");
    }
  } else {
    // Ground floor: plinth course then shopfront glass on odd bays, piers on even.
    g.set(x, gr + 1, z, "smooth_stone");
    for (let y = gr + 2; y <= 3; y++) {
      if (u % 2 === 1) g.set(x, y, z, "glass_pane", paneProps(f));
      else g.set(x, y, z, "white_concrete");
    }
    // Upper floor: window bays on odd columns, concrete spandrels on even.
    for (let y = 5; y <= TOP_WALL; y++) {
      if (u % 2 === 1) g.set(x, y, z, "glass_pane", paneProps(f));
      else g.set(x, y, z, "white_concrete");
    }
  }

  // Parapet and cap.
  g.set(x, 8, z, "white_concrete");
  g.set(x, 9, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 2: warm light behind some upper-floor panes (glowstone in interior bay).
for (const [x, z] of cells) {
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const f = ex[0];
  const u = f === "north" || f === "south" ? x : z;
  if (u % 2 !== 1) continue;
  if ((x * 5 + z * 3) % 4 !== 0) continue;
  const [dx, dz] = DIRS[f];
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || exposed(ix, iz).length > 0) continue;
  g.set(ix, 5, iz, "glowstone");
}

// Pass 3: rooftop plant box with a few stacks.
for (let x = 2; x <= 6; x++) {
  for (let z = 2; z <= 4; z++) {
    if (!has(x, z) || exposed(x, z).length > 0) continue;
    g.set(x, 8, z, "stone_bricks");
  }
}
for (const x of [3, 5]) {
  if (has(x, 3) && exposed(x, 3).length === 0) g.set(x, 9, 3, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
