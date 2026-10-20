import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s Xinyi-style commercial block: stone plinth, two storeys of
// white tiled concrete piers with tinted glass, a shopfront at street level,
// a quartz cornice, a parapet, and rooftop AC plant. Roof sits about 11 blocks
// above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538401872";
const W = 30, D = 12, H = 23;

const LOWER_TOP = 4;   // last block of the shopfront storey
const LINE = 5;        // storey line (floor slab band)
const UP_TOP = 9;      // last block of the upper storey (spandrel)
const DECK = 10;       // cornice / roof deck
const PARAPET = 11;    // parapet cap course

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gnd] of cells) ground.set(`${x},${z}`, Math.round(gnd));

const inFp = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Which exterior face a footprint cell sits on, and its position along that face.
function faceOf(x, z) {
  const missing = [!inFp(x, z - 1), !inFp(x, z + 1), !inFp(x - 1, z), !inFp(x + 1, z)];
  const n = missing.filter(Boolean).length;
  if (n === 0) return null;
  let f;
  if (missing[0]) f = { dir: "n", a: x };
  else if (missing[1]) f = { dir: "s", a: x };
  else if (missing[2]) f = { dir: "w", a: z };
  else f = { dir: "e", a: z };
  f.corner = n > 1;
  return f;
}

const isDoor = (f) => f && f.dir === "n" && (f.a === 14 || f.a === 15);

// Pass 1: foundations, walls, floors, cornice, parapet, shopfront, windows.
for (const [x, z, _] of cells) {
  const gr = groundAt(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const f = faceOf(x, z);

  for (let y = gr; y <= PARAPET; y++) {
    if (!f) {
      // Interior: storey floor and roof deck only; the rest is air.
      if (y === LINE || y === DECK) put(x, y, z, "smooth_stone");
      continue;
    }

    if (y === PARAPET) {
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y === DECK || y === LINE) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    if (f.corner) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
      continue;
    }

    if (y <= LOWER_TOP) {
      // Shopfront storey.
      if (isDoor(f) && y <= LOWER_TOP && y - gr <= 1 && gr + 1 <= LOWER_TOP) {
        const hinge = f.a === 14 ? "left" : "right";
        put(x, y, z, "dark_oak_door", {
          facing: "north",
          half: y === gr ? "lower" : "upper",
          hinge,
          open: "false",
          powered: "false",
        });
      } else if (y === gr) {
        put(x, y, z, "stone_bricks");            // base course
      } else if (f.a % 4 === 0) {
        put(x, y, z, "white_concrete");          // shopfront piers
      } else {
        put(x, y, z, "light_blue_stained_glass_pane"); // shop glass
      }
    } else if (y <= UP_TOP) {
      // Upper office storey: pier every 3 blocks, glazing between.
      if (f.a % 3 === 0) put(x, y, z, "white_concrete");
      else if (y === UP_TOP) put(x, y, z, "white_concrete");   // spandrel
      else put(x, y, z, "light_blue_stained_glass_pane");
    }
  }
}

// Pass 2: warm lights just inside the glass, so the facade glows at dusk.
for (let x = 1; x < W - 1; x++) {
  for (let z = 1; z < D - 1; z++) {
    if (!inFp(x, z)) continue;
    if (faceOf(x, z)) continue; // only interior cells
    const gr = groundAt(x, z);
    const neighbours = [[x, z - 1], [x, z + 1], [x - 1, z], [x + 1, z]];
    for (let y = gr; y <= UP_TOP; y++) {
      let lit = false;
      for (const [nx, nz] of neighbours) {
        const nf = faceOf(nx, nz);
        if (!nf || nf.corner) continue;
        if (y > LOWER_TOP && y < UP_TOP && nf.a % 3 !== 0 && (nf.a * 2 + y) % 7 === 0) lit = true;
        if (y > gr && y <= LOWER_TOP && !isDoor(nf) && nf.a % 4 !== 0 && (nf.a + y) % 5 === 0) lit = true;
      }
      if (lit) put(x, y, z, "glowstone");
    }
  }
}

// Pass 3: rooftop plant, small AC boxes and a vent on the deck.
for (let x = 1; x < W - 1; x++) {
  for (let z = 1; z < D - 1; z++) {
    if (!inFp(x, z) || faceOf(x, z)) continue;
    if (groundAt(x, z) > DECK) continue;
    if (x % 9 === 4 && z === 4) {
      put(x, PARAPET, z, "light_gray_concrete");
      put(x, PARAPET + 1, z, "light_gray_concrete");
    }
    if (x % 9 === 7 && z === 7) {
      put(x, PARAPET, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
