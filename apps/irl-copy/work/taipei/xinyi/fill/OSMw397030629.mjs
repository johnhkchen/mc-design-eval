import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw397030629";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 17, H = 19, D = 13;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const maxG = Math.max(0, ...cells.map((c) => c[2]));

// Lidar record: roof about 7 blocks above lowest ground.
const roofY = Math.min(17, Math.max(7, maxG + 4));

const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const faces = (x, z) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !map.has(key(x + dx, z + dz)))
    .map(([n]) => n);

// Entrance on the street side: prefer north, then south, west, east.
const FACE_ORDER = ["north", "south", "west", "east"];
const frontFace =
  FACE_ORDER.find((f) => cells.some(([x, z]) => faces(x, z).includes(f))) ?? "north";
const uOf = (face, x, z) => (face === "north" || face === "south" ? x : z);

// Door at the middle of the front face.
const frontCells = cells
  .filter(([x, z]) => faces(x, z).includes(frontFace))
  .sort((a, b) => uOf(frontFace, a[0], a[1]) - uOf(frontFace, b[0], b[1]));
const midCell = frontCells[Math.floor(frontCells.length / 2)] ?? [-1, -1, 0];
const doorCell = [midCell[0], midCell[1]];

const paneProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const ex = faces(x, z);

  if (ex.length === 0) {
    // Interior: floor slabs and roof deck; no walls modelled.
    for (let y = gr; y <= roofY; y++) {
      const rel = y - gr;
      if (y === roofY) g.set(x, y, z, "gray_concrete");
      else if (rel === 0 || rel === 5) g.set(x, y, z, "smooth_stone");
    }
    // Sparse rooftop plant: a few small units, not a checkerboard.
    if (x % 5 === 2 && z % 4 === 1 && roofY + 1 <= H - 1) {
      g.set(x, roofY + 1, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter cell.
  const face = ex.includes(frontFace) ? frontFace : ex[0];
  const u = uOf(face, x, z);
  const top = roofY - gr;
  const isFrontDoor = face === frontFace && x === doorCell[0] && z === doorCell[1];
  const onFront = face === frontFace;

  for (let y = gr; y <= roofY; y++) {
    const rel = y - gr;

    if (rel === top) {
      // Cornice cap.
      g.set(x, y, z, "smooth_quartz");
    } else if (rel === 0) {
      // Dark base course.
      g.set(x, y, z, "stone_bricks");
    } else if (rel <= 3) {
      // Ground-floor shopfront.
      if (isFrontDoor) {
        if (rel === 1) {
          g.set(x, y, z, "dark_oak_door", {
            facing: face, half: "lower", hinge: "left", open: "false", powered: "false",
          });
        } else if (rel === 2) {
          g.set(x, y, z, "dark_oak_door", {
            facing: face, half: "upper", hinge: "left", open: "false", powered: "false",
          });
        } else {
          g.set(x, y, z, "smooth_stone"); // entrance lintel
        }
      } else if (u % 4 === 0) {
        g.set(x, y, z, "polished_andesite"); // shopfront pilaster
      } else {
        g.set(x, y, z, "glass_pane", paneProps(face));
      }
    } else if (rel === 4) {
      // Storey line, projecting band.
      g.set(x, y, z, "smooth_stone");
    } else {
      // Upper storey: white pilasters every 4 blocks give the wall depth.
      if (u % 4 === 0) {
        g.set(x, y, z, "white_concrete");
      } else if (rel === top - 1 && u % 2 === 1) {
        g.set(x, y, z, "white_terracotta"); // spandrel below cornice
      } else if (rel === 5 && onFront && u % 8 === 2) {
        g.set(x, y, z, "glowstone"); // warm lit window, front only
      } else {
        g.set(x, y, z, "glass_pane", paneProps(face));
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
