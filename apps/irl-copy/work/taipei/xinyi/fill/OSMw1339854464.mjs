import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 11 x 12 footprint, roof ~7 blocks above lowest ground, low-rise Xinyi-style
// one-storey commercial block: stone plinth, white concrete walls, glazed shopfront
// on the street face, red sign band, stone cornice, parapet, rooftop units.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339854464";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8")); // [x, z, ground]

const W = 11, H = 19, D = 12;
const g = new Voxels([W, H, D]);

const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(`${x},${z}`, gr);
const has = (x, z) => cellMap.has(`${x},${z}`);
const gnd = (x, z) => cellMap.get(`${x},${z}`);

const grounds = cells.map((c) => c[2]);
const maxG = Math.max(0, ...grounds);
// Roof: about 7 blocks above lowest ground; lifted if the downhill side is much higher.
const roof = Math.min(H - 4, Math.max(7, maxG + 4));

const FACES = [
  { name: "north", dx: 0, dz: -1, along: "x" },
  { name: "south", dx: 0, dz: 1, along: "x" },
  { name: "west", dx: -1, dz: 0, along: "z" },
  { name: "east", dx: 1, dz: 0, along: "z" },
];

// Exterior faces: for each face, list perimeter cells sorted along the face.
const faceInfo = new Map();
const faceLen = {};
for (const f of FACES) {
  const list = cells
    .filter(([x, z]) => !has(x + f.dx, z + f.dz))
    .map(([x, z]) => ({ x, z }));
  list.sort((a, b) => (f.along === "x" ? a.x - b.x || a.z - b.z : a.z - b.z || a.x - b.x));
  faceLen[f.name] = list.length;
  list.forEach((c, i) => {
    const k = `${c.x},${c.z}`;
    if (!faceInfo.has(k)) faceInfo.set(k, []);
    faceInfo.get(k).push({ name: f.name, i, n: list.length });
  });
}

// Street face = the longest exposed face.
let street = FACES[0];
for (const f of FACES) if (faceLen[f.name] > faceLen[street.name]) street = f;
const streetN = faceLen[street.name];
const entranceI = Math.floor(streetN / 2);

const WHITE = "white_concrete";
const GLASS = "glass_pane";

for (const [x, z, gr] of cells) {
  const ground = Math.max(0, gr);
  const faces = faceInfo.get(`${x},${z}`) || [];
  const exterior = faces.length > 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  // Floor / plinth at ground level.
  g.set(x, ground, z, exterior ? "polished_andesite" : "smooth_stone");

  if (exterior) {
    const sf = faces.find((e) => e.name === street.name);
    const winFace = faces.find(
      (e) => e.name !== street.name && e.i % 2 === 1 && e.i > 0 && e.i < e.n - 1
    );

    // Walls from ground+1 up to roof-1.
    for (let y = ground + 1; y <= roof - 1; y++) {
      let id = WHITE;

      // Upper band just below cornice.
      if (y === roof - 1) id = "light_gray_concrete";

      // Other faces: punched window grid.
      if (winFace && y >= ground + 1 && y <= Math.min(ground + 3, roof - 2)) {
        id = GLASS;
      }

      // Street face: shopfront glazing with frames, entrance door, sign band.
      if (sf) {
        if (y >= ground + 1 && y <= ground + 2) {
          if (sf.i === 0 || sf.i === sf.n - 1) id = WHITE;
          else if (sf.i === entranceI) {
            const half = y === ground + 1 ? "lower" : "upper";
            g.set(x, y, z, "dark_oak_door", {
              facing: street.name,
              half,
              hinge: "left",
              open: "false",
              powered: "false",
            });
            continue;
          } else id = GLASS;
        }
        if (y === ground + 3 && y < roof - 1) {
          if (sf.i === entranceI) {
            g.set(x, y, z, "lantern", { hanging: "false" });
            continue;
          }
          id = "red_concrete";
        }
      }

      g.set(x, y, z, id);
    }

    // Cornice course at roof level.
    g.set(x, roof, z, "smooth_stone");
    // Parapet on the perimeter.
    if (roof + 1 < H) g.set(x, roof + 1, z, WHITE);
  } else {
    // Interior: floor slab, air above, roof slab at roof level.
    g.set(x, roof, z, "gray_concrete");
  }
}

// Warm light behind some street-face windows (inside the shell, glowstone behind glass).
for (const [x, z, gr] of cells) {
  const faces = faceInfo.get(`${x},${z}`) || [];
  const sf = faces.find((e) => e.name === street.name);
  if (!sf || sf.i === 0 || sf.i === sf.n - 1 || sf.i === entranceI) continue;
  if (sf.i % 2 !== 1) continue;
  const f = FACES.find((q) => q.name === street.name);
  const ix = x - f.dx, iz = z - f.dz; // one step inward
  if (!has(ix, iz)) continue;
  const yL = Math.max(0, gr) + 2;
  if (yL < roof - 1) g.set(ix, yL, iz, sf.i % 4 === 1 ? "glowstone" : "shroomlight");
}

// Rooftop equipment: AC units on the roof slab, interior cells only.
for (const [x, z] of cells) {
  if (has(x, z) && !(faceInfo.get(`${x},${z}`) || []).length) {
    if (x % 4 === 1 && z % 4 === 1 && roof + 1 < H) {
      g.set(x, roof + 1, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
