import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414194";
const W = 32, D = 17, H = 23;

// Materials: a two-storey mid-century Taipei commercial block. White-tiled concrete
// walls, light-grey storey bands, stone-brick plinth, glass shopfront on the street
// side, and a flat parapet roof with rooftop plant.
const LG = "light_gray_concrete";
const WH = "white_concrete";
const SS = "smooth_stone";
const SB = "stone_bricks";
const ST = "stone";
const GL = "glass_pane";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gnd] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) G.set(key(x, z), Math.round(gnd));
}
const has = (x, z) => G.has(key(x, z));

const maxG = Math.max(...G.values());
const F = maxG + 1; // building floor level, standing on the highest ground under the footprint

const DIRS = {
  N: [0, -1, "north"],
  S: [0, 1, "south"],
  W: [-1, 0, "west"],
  E: [1, 0, "east"],
};

const missing = (x, z) =>
  Object.keys(DIRS).filter((d) => {
    const [dx, dz] = DIRS[d];
    return !has(x + dx, z + dz);
  });

// Front (street) facade: the side with the most single-sided edge cells.
const singles = { N: 0, S: 0, W: 0, E: 0 };
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  const m = missing(x, z);
  if (m.length === 1) singles[m[0]]++;
}
const front = Object.keys(singles).sort((a, b) => singles[b] - singles[a])[0];

const isSingle = (x, z, d) => {
  const m = missing(x, z);
  return m.length === 1 && m[0] === d;
};

// Position of each wall cell counted from the start of its straight run.
const runIdx = (x, z, d) => {
  const [dx, dz] = DIRS[d];
  const tx = dx === 0 ? 1 : 0;
  const tz = dz === 0 ? 1 : 0;
  let i = 0;
  let px = x - tx, pz = z - tz;
  while (has(px, pz) && isSingle(px, pz, d)) {
    i++;
    px -= tx;
    pz -= tz;
  }
  return i;
};

// Bays are the two middle cells of every four-cell module; the others are piers.
const bayOK = (i) => i % 4 === 1 || i % 4 === 2;

// Entrance: middle bay on the front facade.
const frontBays = [];
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  const m = missing(x, z);
  if (m.length === 1 && m[0] === front && bayOK(runIdx(x, z, front))) {
    frontBays.push([x, z]);
  }
}
const tangentOf = ([x, z]) => (front === "N" || front === "S" ? x : z);
frontBays.sort((a, b) => tangentOf(a) - tangentOf(b));
const doorCell = frontBays.length ? frontBays[Math.floor(frontBays.length / 2)] : null;
const doorKey = doorCell ? key(...doorCell) : null;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

if (F + 12 >= H) {
  console.error(`Height overflow risk: floor ${F}, need top ${F + 12}, H=${H}`);
}

for (const [k, gnd] of G) {
  const [x, z] = k.split(",").map(Number);
  const m = missing(x, z);
  const edge = m.length > 0;

  // Foundation: solid from y 0 up to the cell's ground, then fill up to the floor.
  for (let y = 0; y < F; y++) {
    put(x, y, z, y <= gnd ? ST : edge ? SB : ST);
  }
  // Floor slab of the ground storey.
  put(x, F, z, LG);

  if (m.length === 0) {
    // Interior: floor slab at the first-floor line and the roof deck.
    put(x, F + 5, z, LG);
    put(x, F + 10, z, SS);
  } else if (m.length >= 2) {
    // Corner pier, full height.
    for (let y = F + 1; y <= F + 11; y++) {
      let id = WH;
      if (y === F + 1) id = SB;
      else if (y === F + 5 || y === F + 10) id = LG;
      put(x, y, z, id);
    }
  } else {
    const d = m[0];
    const [dx, dz] = DIRS[d];
    const i = runIdx(x, z, d);
    const bay = bayOK(i);
    const isDoor = k === doorKey;
    const glassProps =
      dx !== 0
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

    // Storey band and cornice.
    put(x, F + 5, z, LG);
    put(x, F + 10, z, LG);

    // Plinth.
    put(x, F + 1, z, SB);

    // Ground storey.
    if (isDoor) {
      const base = { facing: DIRS[d][2], hinge: "left", open: "false", powered: "false" };
      put(x, F + 1, z, "iron_door", { ...base, half: "lower" });
      put(x, F + 2, z, "iron_door", { ...base, half: "upper" });
      put(x, F + 3, z, GL, glassProps);
      put(x, F + 4, z, WH);
    } else if (bay && front === d) {
      // Shopfront glazing on the street side.
      put(x, F + 2, z, GL, glassProps);
      put(x, F + 3, z, GL, glassProps);
      put(x, F + 4, z, WH);
    } else if (bay) {
      put(x, F + 2, z, GL, glassProps);
      put(x, F + 3, z, GL, glassProps);
      put(x, F + 4, z, WH);
    } else {
      put(x, F + 2, z, WH);
      put(x, F + 3, z, WH);
      put(x, F + 4, z, WH);
    }

    // Upper storey.
    put(x, F + 6, z, bay ? LG : WH);
    put(x, F + 7, z, bay ? GL : WH, bay ? glassProps : undefined);
    put(x, F + 8, z, bay ? GL : WH, bay ? glassProps : undefined);
    put(x, F + 9, z, bay ? LG : WH);

    // Parapet.
    put(x, F + 11, z, WH);

    // Warm lights hung in the air gap behind some windows.
    if (bay && !isDoor) {
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz)) {
        if ((x + z) % 3 === 0) put(ix, F + 4, iz, "lantern", { hanging: "true", waterlogged: "false" });
        if ((x + z) % 3 === 1) put(ix, F + 9, iz, "lantern", { hanging: "true", waterlogged: "false" });
      }
    }
  }
}

// Rooftop plant: small 2x2 air-handling units on the roof deck, clear of the parapet.
for (const [k] of G) {
  const [x, z] = k.split(",").map(Number);
  if (x % 9 !== 4 || z % 6 !== 3) continue;
  const block = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!block.every(([bx, bz]) => has(bx, bz) && missing(bx, bz).length === 0)) continue;
  for (const [bx, bz] of block) {
    put(bx, F + 11, bz, LG);
    put(bx, F + 12, bz, WH);
  }
}

g.save(`${DIR}/${ID}.nbt`);
