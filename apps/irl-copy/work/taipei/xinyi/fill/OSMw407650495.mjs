import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey commercial block with a parapet. Stone plinth, white concrete
// bays with light-grey piers and spandrels, a smooth quartz belt and cornice,
// glass window bands, a dark-oak entrance with a stone surround and lintel
// on the south face, glowstone behind some windows, and rooftop AC plant.
// Roof line at y = 10 (about 11 blocks above the lowest ground), crenellated
// parapet on alternate bays up to y = 11.

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw407650495";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 35, H = 23, D = 49;
const g = new Voxels([W, H, D]);

const ROOF_Y = 10;
const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(key(x, z), gr);
const inF = (x, z) => fp.has(key(x, z));
const isEdge = (x, z) =>
  !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);

const FACES = [
  ["N", 0, -1],
  ["S", 0, 1],
  ["W", -1, 0],
  ["E", 1, 0],
];

// Entrance on the south-facing edge, nearest the footprint's mid x.
const southX = cells.filter(([x, z]) => !inF(x, z + 1)).map(([x]) => x);
let doorX = null;
if (southX.length) {
  const mid = (Math.min(...southX) + Math.max(...southX)) / 2;
  doorX = southX.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
}

// Pass 1: foundations, floors, interior roof deck, rooftop plant.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!isEdge(x, z)) {
    if (gr < ROOF_Y) {
      g.set(x, gr, z, "smooth_stone");
      if (gr + 5 < ROOF_Y) g.set(x, gr + 5, z, "smooth_stone");
      g.set(x, ROOF_Y, z, "light_gray_concrete");
    }
    // Sparse AC units, standing on the roof deck at y = 11.
    if (((x * 3 + z * 5) % 11) === 0 && x % 2 === 1 && z % 2 === 0) {
      g.set(x, ROOF_Y + 1, z, "iron_block");
    }
  }
}

// Pass 2: exterior walls, cornice, windows, entrance, warm lights.
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;

  const exposed = FACES.filter(([, dx, dz]) => !inF(x + dx, z + dz));
  const face = exposed.find((f) => f[0] === "S") || exposed[0];
  const [fname, dx, dz] = face;
  const along = dx === 0 ? x : z;
  const southExposed = exposed.some((f) => f[0] === "S");

  const isDoor = fname === "S" && southExposed && x === doorX;
  const inEntrance = fname === "S" && southExposed && doorX !== null && Math.abs(x - doorX) <= 1;

  const paneProps = dx === 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  const winBand = (y) =>
    (y >= gr + 1 && y <= gr + 3) || (y >= gr + 6 && y <= gr + 8);
  const isPier = along % 3 === 0;

  for (let y = gr; y <= ROOF_Y; y++) {
    // Cornice and crenellated parapet (alternate bays stand up to y = 11).
    if (y === ROOF_Y) {
      g.set(x, y, z, "smooth_quartz");
      if (!isPier && along % 2 === 0 && ROOF_Y + 1 < H) {
        g.set(x, ROOF_Y + 1, z, "smooth_quartz");
      }
      continue;
    }

    // Plinth.
    if (y === gr) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Belt course between storeys.
    if (y === gr + 5) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }

    // Entrance: door, stone surround, dark-oak lintel.
    if (inEntrance) {
      if (isDoor && (y === gr + 1 || y === gr + 2)) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "south",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (y === gr + 4) {
        g.set(x, y, z, "dark_oak_planks");
        continue;
      }
      if (y >= gr + 1 && y <= gr + 3) {
        if (isDoor) {
          // Lamp over the door, inside the lobby.
          g.set(x, y, z, "dark_oak_planks");
        } else {
          g.set(x, y, z, "stone_bricks");
        }
        continue;
      }
    }

    // Spandrels above each window band.
    if (y === gr + 4 || y === gr + 9) {
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Window bands: glass between light-grey piers.
    if (winBand(y)) {
      if (isPier) {
        g.set(x, y, z, "light_gray_concrete");
      } else {
        g.set(x, y, z, "glass_pane", paneProps);
        // Warm glow behind the glass on alternate bays.
        if ((y === gr + 2 || y === gr + 7) && along % 6 === 1) {
          const ix = x - dx;
          const iz = z - dz;
          if (inF(ix, iz) && !isEdge(ix, iz)) {
            g.set(ix, y, iz, "glowstone");
          }
        }
      }
      continue;
    }

    // Wall body.
    g.set(x, y, z, "white_concrete");
  }

  // Lamp inside the lobby behind the entrance.
  if (isDoor) {
    const ix = x - dx;
    const iz = z - dz;
    if (inF(ix, iz) && !isEdge(ix, iz)) {
      g.set(ix, gr + 3, iz, "glowstone");
    }
  }
}

g.save(`${dir}/${id}.nbt`);
