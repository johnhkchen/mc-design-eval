import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise commercial shophouse, two storeys over a shopfront, flat roof with
// red-tile parapet cap and a rooftop water tank. Era: 1980s-90s Taipei,
// white wall tiles, aluminium-style window bands, red terracotta trim.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540891062";
const W = 12, H = 23, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const ext = (x, z, d) => !has(x + DIRS[d][0], z + DIRS[d][1]);
const exteriorFaces = (x, z) => Object.keys(DIRS).filter((d) => ext(x, z, d));
const single = (x, z) => {
  const f = exteriorFaces(x, z);
  return f.length === 1 ? f[0] : null;
};

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneFor = (d) =>
  d === "N" || d === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Door goes on the middle single-face cell of the north street face (south if none).
const faceForDoor = cells.some(([x, z]) => single(x, z) === "N") ? "N" : "S";
const doorCandidates = cells
  .filter(([x, z]) => single(x, z) === faceForDoor)
  .map(([x, z]) => [x, z])
  .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const doorCell = doorCandidates.length
  ? doorCandidates[Math.floor(doorCandidates.length / 2)]
  : null;

for (const [cx, cz, cg] of cells) {
  const x = cx, z = cz, b = Math.round(cg);
  const faces = exteriorFaces(x, z);
  const count = faces.length;
  const d = single(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Floor decks: ground floor, first floor, roof deck.
  // Exterior ring at ground uses a stone base course.
  const baseBlock = count > 0 ? "stone_bricks" : "light_gray_concrete";
  put(x, b, z, baseBlock);
  put(x, b + 5, z, "light_gray_concrete");
  put(x, b + 10, z, "light_gray_concrete");

  if (count === 0) {
    // Interior: air above the decks, nothing else.
    continue;
  }

  // Parapet with red tile cap on the roof edge.
  put(x, b + 11, z, "red_terracotta");

  if (count >= 2) {
    // Corner piers run the full height.
    for (const y of [b + 1, b + 2, b + 3, b + 4, b + 6, b + 7, b + 8, b + 9]) {
      put(x, y, z, "white_concrete");
    }
    continue;
  }

  // Single exterior face: window grid.
  const c = d === "N" || d === "S" ? x : z;
  const mull = c % 3 === 0;
  const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z && d === faceForDoor;
  const [ix, iz] = INWARD[d];
  const inwardFree = has(x + ix, z + iz) && exteriorFaces(x + ix, z + iz).length === 0;

  // Ground floor shopfront: glass band, dark wood mullions, lintel course.
  put(x, b + 4, z, "white_concrete");
  if (isDoor) {
    put(x, b + 1, z, "oak_door", {
      facing: d === "N" ? "north" : "south",
      half: "lower",
      hinge: "left",
      open: "false",
      powered: "false",
    });
    put(x, b + 2, z, "oak_door", {
      facing: d === "N" ? "north" : "south",
      half: "upper",
      hinge: "left",
      open: "false",
      powered: "false",
    });
    put(x, b + 3, z, "light_blue_stained_glass_pane", paneFor(d));
  } else {
    for (const y of [b + 1, b + 2, b + 3]) {
      if (mull) put(x, y, z, "dark_oak_planks");
      else put(x, y, z, "light_blue_stained_glass_pane", paneFor(d));
    }
  }
  if (!isDoor && !mull && c % 6 === 2 && inwardFree) {
    put(x + ix, b + 2, z + iz, "glowstone");
  }

  // Upper storey: spandrels top and bottom, two rows of glass.
  for (const y of [b + 6, b + 9]) put(x, y, z, "white_concrete");
  for (const y of [b + 7, b + 8]) {
    if (mull) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane", paneFor(d));
  }
  if (!mull && c % 6 === 2 && inwardFree) {
    put(x + ix, b + 7, z + iz, "glowstone");
  }
}

// Rooftop water tank on the roof deck, away from the parapet.
for (let x = 3; x <= 4; x++) {
  for (let z = 8; z <= 9; z++) {
    if (!has(x, z)) continue;
    const gr = groundAt(x, z);
    if (exteriorFaces(x, z).length > 0) continue;
    put(x, gr + 11, z, "barrel", { facing: "up", open: "false" });
  }
}

// Small AC plant on the roof, second bay.
for (let x = 8; x <= 9; x++) {
  const z = 14;
  if (!has(x, z) || exteriorFaces(x, z).length > 0) continue;
  put(x, groundAt(x, z) + 11, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
