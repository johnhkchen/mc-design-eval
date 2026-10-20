import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw764466769";
const W = 11, H = 38, D = 17;
const DECK = 25;      // roof deck (top of the fifth storey)
const PARAPET = 26;   // parapet top on the perimeter
const STOREY = 5;     // 5 blocks per storey, floor bands on y % 5 == 0

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);
const has = (x, z) => ground.has(`${x},${z}`);

// Outward faces: [dx, dz, facingName, axis-along-face]
const FACES = [
  [0, -1, "north"],
  [0, 1, "south"],
  [1, 0, "east"],
  [-1, 0, "west"],
];

function outwardFaces(x, z) {
  return FACES.filter(([dx, dz]) => !has(x + dx, z + dz));
}

// Along-face index: north/south faces run along x, east/west along z.
function alongIndex(face, x, z) {
  return face[0] === 0 ? x : z;
}

// Pane connection state for a window cell (glass runs along the faces it sits on).
function paneProps(faces) {
  const alongX = faces.some(f => f[0] === 0);
  const alongZ = faces.some(f => f[0] !== 0);
  return {
    north: alongX ? "true" : "false",
    south: alongX ? "true" : "false",
    east: alongZ ? "true" : "false",
    west: alongZ ? "true" : "false",
    waterlogged: "false",
  };
}

// Choose the entrance: a north-facing perimeter cell nearest the middle of the plan,
// falling back to any perimeter cell.
function pickEntrance() {
  let best = null;
  for (const [x, z, g] of cells) {
    const faces = outwardFaces(x, z);
    if (!faces.length || g + 1 > DECK) continue;
    const northFace = faces.find(f => f[0] === 0 && f[1] === -1);
    const face = northFace ?? faces[0];
    const score = Math.abs(x - (W - 1) / 2) + (northFace ? 0 : 100);
    if (!best || score < best.score) best = { x, z, g, face, score };
  }
  return best;
}

const g = new Voxels([W, H, D]);
const entrance = pickEntrance();

// 1. Foundations and building shell
for (const [x, z, gr] of cells) {
  // Solid fill from y 0 up to this cell's ground (foundation)
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const faces = outwardFaces(x, z);

  if (faces.length === 0) {
    // Interior: no walls, only floor slabs and the roof deck
    for (let y = gr; y <= DECK; y++) {
      if (y % STOREY === 0) g.set(x, y, z, "smooth_stone");
    }
    continue;
  }

  // Perimeter shell, storey by storey
  for (let y = gr; y <= DECK; y++) {
    const rel = y % STOREY;
    let block = "white_concrete";
    let props;

    if (rel === 0) {
      block = "light_gray_concrete"; // floor line / storey band
    } else if (rel === 4) {
      block = "white_concrete";     // spandrel
    } else {
      // window band (rel 1..3): glass on odd bays, white concrete mullions on even
      const bay = faces.some(f => alongIndex(f, x, z) % 2 === 1);
      if (bay) {
        if ((x * 3 + z * 5 + y) % 13 === 0) {
          block = "glowstone";          // warm lit window
        } else {
          block = "light_blue_stained_glass_pane";
          props = paneProps(faces.filter(f => alongIndex(f, x, z) % 2 === 1));
        }
      }
    }
    g.set(x, y, z, block, props);
  }

  // Parapet on the perimeter
  g.set(x, PARAPET, z, "light_gray_concrete");
}

// 2. Entrance door on the ground floor
if (entrance) {
  const [dx, dz] = entrance.face;
  const facing = entrance.face[2] ?? entrance.face;
  const dirName = FACES.find(f => f[0] === dx && f[1] === dz)[2];
  g.set(entrance.x, entrance.g, entrance.z, "dark_oak_door", {
    facing: dirName, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(entrance.x, entrance.g + 1, entrance.z, "dark_oak_door", {
    facing: dirName, half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// 3. Roof equipment: a plant block on the deck near the centre
for (const [x, z, gr] of cells) {
  if (outwardFaces(x, z).length) continue;
  if (x >= 4 && x <= 6 && z >= 6 && z <= 10 && gr <= DECK) {
    g.set(x, PARAPET, z, "light_gray_concrete");
    g.set(x, PARAPET + 1, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
