import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey concrete commercial block: stone plinth, cream-tiled
// walls, grey-framed glass on a shopfront ground floor, a belt course at the
// first floor line, a cornice and parapet, and a flat roof with plant boxes.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833537";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 25;
const g = new Voxels([W, H, D]);

const ROOF = 11;      // parapet top, about 11 blocks above lowest ground
const BELT = 5;       // first floor line (absolute)
const CORNICE = 10;   // roof deck / cornice line (absolute)

const key = (x, z) => `${x},${z}`;
const inSet = new Set(cells.map(([x, z]) => key(x, z)));
const FACES = {
  N: { dx: 0, dz: -1, facing: "north" },
  S: { dx: 0, dz: 1, facing: "south" },
  W: { dx: -1, dz: 0, facing: "west" },
  E: { dx: 1, dz: 0, facing: "east" },
};

function exteriorFaces(x, z) {
  const out = [];
  for (const [name, f] of Object.entries(FACES)) {
    if (!inSet.has(key(x + f.dx, z + f.dz))) out.push(name);
  }
  return out;
}

// Front faces toward the street: prefer south, else the face with most exposed cells.
const counts = { N: 0, S: 0, W: 0, E: 0 };
for (const [x, z] of cells) for (const f of exteriorFaces(x, z)) counts[f]++;
const front = counts.S > 0 ? "S" : Object.keys(counts).reduce((a, b) => (counts[b] > counts[a] ? b : a));

// Entrance: the front-face cell nearest the middle of that face.
const frontCells = cells.filter(([x, z]) => exteriorFaces(x, z).includes(front));
const alongOf = (x, z, face) => (face === "N" || face === "S" ? x : z);
const alongs = frontCells.map(([x, z]) => alongOf(x, z, front)).sort((a, b) => a - b);
const mid = alongs.length ? alongs[Math.floor(alongs.length / 2)] : -1;
let entrance = null;
{
  let best = Infinity;
  for (const [x, z] of frontCells) {
    const d = Math.abs(alongOf(x, z, front) - mid);
    if (d < best) { best = d; entrance = key(x, z); }
  }
}

// Pass 1: foundations, interior floor slabs, and exterior walls.
for (const [x, z, gr] of cells) {
  // Foundation: solid from 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");

  const faces = exteriorFaces(x, z);

  // Interior: air gap behind the glass, floor slabs only.
  if (faces.length === 0) {
    if (BELT > gr) g.set(x, BELT, z, "smooth_stone");
    if (CORNICE > gr) g.set(x, CORNICE, z, "gray_concrete");
    continue;
  }

  const face = faces.includes(front) ? front : faces[0];
  const along = alongOf(x, z, face);
  const isFront = faces.includes(front);
  const isEntrance = isFront && key(x, z) === entrance;
  const ground = gr + 1;

  for (let y = gr + 1; y <= ROOF; y++) {
    if (y === ROOF) {
      g.set(x, y, z, "white_concrete");                // parapet
    } else if (y === CORNICE) {
      g.set(x, y, z, "light_gray_concrete");           // cornice
    } else if (y === BELT) {
      g.set(x, y, z, "light_gray_concrete");           // first-floor belt course
    } else if (y <= gr + 4) {
      // Ground floor: shopfront.
      if (y === ground) {
        if (isEntrance) {
          g.set(x, y, z, "dark_oak_door", {
            facing: FACES[face].facing, half: "lower", hinge: "left", open: "false", powered: "false",
          });
        } else {
          g.set(x, y, z, "polished_andesite");          // plinth
        }
      } else if (y === gr + 2 && isEntrance) {
        g.set(x, y, z, "dark_oak_door", {
          facing: FACES[face].facing, half: "upper", hinge: "left", open: "false", powered: "false",
        });
      } else if (y === gr + 4) {
        g.set(x, y, z, "light_gray_concrete");          // shopfront fascia / lintel
      } else if (isEntrance) {
        g.set(x, y, z, "light_gray_concrete");          // frame around entrance
      } else if (along % 3 === 0) {
        g.set(x, y, z, "light_gray_concrete");          // mullion
      } else {
        g.set(x, y, z, "glass_pane");
      }
    } else {
      // Upper storey: window grid.
      if (y === 9 || along % 3 === 0) {
        g.set(x, y, z, "light_gray_concrete");          // transom / mullion
      } else if (y === 7 && along % 5 === 1) {
        g.set(x, y, z, "glowstone");                    // lit window
      } else {
        g.set(x, y, z, "glass_pane");
      }
    }
  }
}

// Pass 2: roof equipment on the interior roof deck (sits on the deck at y 10).
for (const [x, z] of cells) {
  if (exteriorFaces(x, z).length > 0) continue;
  if (x % 5 === 2 && z % 5 === 2) {
    g.set(x, ROOF, z, "gray_concrete");
    g.set(x, ROOF + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
