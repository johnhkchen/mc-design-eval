import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1038711394";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Footprint 10 x 16, roof ~11 blocks above lowest ground.
// Two storeys of 5 blocks, a storey-line band, cornice and a stone parapet.
// Commercial ground floor with a shopfront; white-tiled concrete upper floors
// typical of 1970s-80s Taipei mid-rise blocks.
const W = 10, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const G0 = Math.min(...cells.map((c) => c[2]));
const TOP = G0 + 11;

const NORM = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];
const extFaces = (x, z) => NORM.filter((n) => !has(x + n.dx, z + n.dz));
const alongK = (x, z, n) => (n.dz !== 0 ? x : z);

// Entrance: prefer the south (street-facing +z) face, otherwise the first exterior face.
const exteriorList = cells.map(([x, z]) => [x, z, extFaces(x, z)]).filter((c) => c[2].length);
const entranceName = exteriorList.some((c) => c[2].some((n) => n.name === "south")) ? "south" : exteriorList[0][2][0].name;
const entranceKs = [];
for (const [x, z, faces] of exteriorList) {
  const f = faces.find((n) => n.name === entranceName);
  if (f) entranceKs.push(alongK(x, z, f));
}
const doorK = Math.floor((Math.min(...entranceKs) + Math.max(...entranceKs)) / 2);

const glassProps = (n) => ({
  north: n.dz !== 0 ? "false" : "true",
  south: n.dz !== 0 ? "false" : "true",
  east: n.dx !== 0 ? "false" : "true",
  west: n.dx !== 0 ? "false" : "true",
  waterlogged: "false",
});

// 1. Foundations and shell.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");
}

for (const [x, z, gr] of cells) {
  const faces = extFaces(x, z);
  const isExt = faces.length > 0;

  if (isExt) {
    const face = faces[0];
    const k = alongK(x, z, face);
    const corner = faces.length > 1;
    const pier = corner || k % 3 === 0;

    for (let y = gr; y <= TOP; y++) {
      const rel = y - G0;
      let block = null;
      let props = null;

      if (y === gr) {
        block = "stone_bricks"; // base course
      } else if (rel === 1 || rel === 2) {
        if (entranceName === face.name && k === doorK && rel === 1) {
          block = "oak_door";
          props = { facing: face.name, half: "lower", hinge: "left", open: "false", powered: "false" };
        } else if (entranceName === face.name && k === doorK && rel === 2) {
          block = "oak_door";
          props = { facing: face.name, half: "upper", hinge: "left", open: "false", powered: "false" };
        } else if (pier) {
          block = "white_concrete";
        } else {
          block = "glass_pane";
          props = glassProps(face);
        }
      } else if (rel === 3) {
        block = "light_gray_concrete"; // storey line / lintel band
      } else if (rel === 4) {
        block = "white_concrete";
      } else if (rel === 5) {
        block = "light_gray_concrete"; // floor line
      } else if (rel >= 6 && rel <= 8) {
        if (pier) block = "white_concrete";
        else {
          block = "glass_pane";
          props = glassProps(face);
        }
      } else if (rel === 9) {
        block = "white_concrete";
      } else if (rel === 10) {
        block = "light_gray_concrete"; // cornice
      } else if (rel === 11) {
        block = "stone_bricks"; // parapet
      }

      if (block) {
        if (props) g.set(x, y, z, block, props);
        else g.set(x, y, z, block);
      }
    }

    // Lantern hanging above the entrance door.
    if (entranceName === face.name && k === doorK) {
      g.set(x, G0 + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  } else {
    // Interior: floor slabs and roof, air elsewhere (air gap behind glass).
    for (let y = gr; y <= TOP; y++) {
      const rel = y - G0;
      if (rel === 0 || rel === 5 || rel === 10) {
        g.set(x, y, z, "smooth_stone");
      } else if (rel === 11 && x >= 3 && x <= 6 && z >= 5 && z <= 10) {
        g.set(x, y, z, "light_gray_concrete"); // roof plant
      } else if (rel === 7 && (x + z) % 3 === 0) {
        // Warm light behind a window, only where the cell borders the shell.
        const nearShell = NORM.some((n) => !has(x + n.dx, z + n.dz));
        if (nearShell) g.set(x, y, z, "glowstone");
      }
    }
  }
}

g.save(`${dir}/${id}.nbt`);
