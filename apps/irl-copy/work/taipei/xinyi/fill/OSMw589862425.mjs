import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Taipei commercial/office block, c. 1985-1995: white-tile concrete
// frame, tinted curtain glazing between white mullions, a glazed ground-floor
// shopfront with a stone base and cornice, four storeys of about 5 blocks,
// a white parapet and rooftop plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw589862425";
const W = 22, H = 34, D = 40;
const TOP = 22;          // roof surface, about 22 blocks above lowest ground
const MAX_GROUND = TOP - 5; // keep at least one full storey above any foundation

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.min(Math.max(Math.round(gr), 0), MAX_GROUND));
}
const has = (x, z) => ground.has(`${x},${z}`);

const NB = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const INW = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

const missing = (x, z) =>
  Object.keys(NB).filter((f) => !has(x + NB[f][0], z + NB[f][1]));

// Classify footprint cells
const info = new Map();
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const m = missing(x, z);
  const kind = m.length === 0 ? "interior" : m.length === 1 ? "edge" : "corner";
  info.set(key, { x, z, gr, m, kind });
}

// Street (front) face: the face carrying the most single-sided cells
const faceCount = { north: 0, south: 0, east: 0, west: 0 };
for (const c of info.values()) {
  if (c.kind === "edge") faceCount[c.m[0]]++;
}
const front = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];

// Entrance: middle of the front face along its length
const frontCells = [...info.values()].filter((c) => c.kind === "edge" && c.m[0] === front);
const along = (c) => (front === "north" || front === "south" ? c.x : c.z);
frontCells.sort((a, b) => along(a) - along(b));
const doorCell = frontCells[Math.floor(frontCells.length / 2)];
const doorKey = doorCell ? `${doorCell.x},${doorCell.z}` : null;

const g = new Voxels([W, H, D]);

// Pass 1: structure, envelope, floors, roof
for (const c of info.values()) {
  const { x, z, gr, m, kind } = c;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (kind === "interior") {
    // Floor slabs: at the cell's ground, every storey line above, and the roof
    for (let y = gr; y <= TOP; y++) {
      if (y === gr || (y % 5 === 0 && y > gr && y < TOP) || y === TOP) {
        g.set(x, y, z, y === TOP ? "light_gray_concrete" : "light_gray_concrete");
      }
    }
    // Rooftop plant on a sparse grid
    if (x % 5 === 2 && z % 5 === 2) {
      g.set(x, TOP + 1, z, "iron_block");
      if ((x + z) % 10 === 4) g.set(x, TOP + 2, z, "iron_block");
    }
    if (x === 11 && z === 20) {
      g.set(x, TOP + 1, z, "lightning_rod", { facing: "up", powered: "false" });
      g.set(x, TOP + 2, z, "lightning_rod", { facing: "up", powered: "false" });
      g.set(x, TOP + 3, z, "lightning_rod", { facing: "up", powered: "false" });
    }
    continue;
  }

  if (kind === "corner") {
    // Solid white corner piers the full height of the cell
    for (let y = gr; y <= TOP; y++) g.set(x, y, z, "white_concrete");
    continue;
  }

  // Edge cell: facade on the single open side
  const face = m[0];
  const ax = face === "north" || face === "south" ? x : z;
  const isPaneNS = face === "north" || face === "south"; // panes run along x here

  for (let y = gr; y < TOP; y++) {
    const key = `${x},${z}`;

    // Entrance door
    if (key === doorKey && (y === gr || y === gr + 1)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: face,
        half: y === gr ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (y === 0) {
      g.set(x, y, z, "polished_andesite");
    } else if (y < 5) {
      // Ground storey shopfront
      if (y === 4) g.set(x, y, z, "stone_bricks");
      else if (ax % 3 === 0) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "glass");
    } else if (y % 5 === 0) {
      // Floor spandrel band
      g.set(x, y, z, "white_concrete");
    } else if (y % 5 === 4) {
      // Head course under each storey line
      g.set(x, y, z, "white_concrete");
    } else {
      // Window rows: tinted glazing between white mullions
      if (ax % 3 === 0) {
        g.set(x, y, z, "white_concrete");
      } else if (isPaneNS) {
        g.set(x, y, z, "cyan_stained_glass_pane", {
          north: "false", south: "false", east: "true", west: "true", waterlogged: "false",
        });
      } else {
        g.set(x, y, z, "cyan_stained_glass_pane", {
          north: "true", south: "true", east: "false", west: "false", waterlogged: "false",
        });
      }
    }
  }

  // Parapet cap on the perimeter
  g.set(x, TOP, z, "white_concrete");
}

// Pass 2: warm light behind some upper windows (inside the air gap)
for (const c of info.values()) {
  if (c.kind !== "edge") continue;
  const { x, z, gr, m } = c;
  const face = m[0];
  const ax = face === "north" || face === "south" ? x : z;
  const [ix, iz] = INW[face];
  const inward = info.get(`${x + ix},${z + iz}`);
  if (!inward || inward.kind !== "interior") continue;
  for (let y = 6; y < TOP - 1; y++) {
    if (y % 5 !== 2) continue;
    if (y < gr) continue;
    if ((ax + y) % 4 !== 0) continue;
    g.set(x + ix, y, z + iz, "glowstone");
  }
}

// Lit shopfront: a few lanterns behind the ground-floor glass
for (const c of info.values()) {
  if (c.kind !== "edge" || c.m[0] !== front) continue;
  const { x, z, gr } = c;
  const ax = front === "north" || front === "south" ? x : z;
  if (ax % 6 !== 1) continue;
  const [ix, iz] = INW[front];
  const inward = info.get(`${x + ix},${z + iz}`);
  if (!inward || inward.kind !== "interior") continue;
  const y = gr + 2;
  if (y > 3 || y < 1) continue;
  g.set(x + ix, y, z + iz, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
