import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86656";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 23, D = 2;
const g = new Voxels([W, H, D]);

const clampY = (v) => Math.max(0, Math.min(H - 1, Math.round(v)));
const MAX_X = W - 1;
const MAX_Z = D - 1;

// Brick commercial block, c.1900-1920 DC: stone ground course, red brick shaft,
// stone storey bands, quartz-capped cornice. Each storey is a 4-row module:
// row 0 stone sill/base, rows 1-2 glazed bays, row 3 stone band.
for (const c of cells) {
  const [x, z, gr0, roof0] = c;
  const ground = clampY(gr0);
  const roof = Math.max(ground + 3, clampY(roof0));
  const top = Math.min(H, roof);
  const facade = z === 0 || z === MAX_Z;
  const endCell = x === 0 || x === MAX_X;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y < top; y++) {
    const rel = y - ground;
    const isCornice = y === top - 1;
    const m = rel % 4;

    if (isCornice) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (rel === 0) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    if (m === 0 || m === 3) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Default shaft material.
    g.set(x, y, z, "bricks");

    // Glazed bays on odd columns of the street and rear faces (rows 1-2 of each module).
    const bay = facade && !endCell && x % 2 === 1;
    if (bay) {
      const warm = (x === 5 || x === 9) && m === 1 && rel > 3;
      g.set(x, y, z, warm ? "shroomlight" : "light_blue_stained_glass");
    }
  }

  // Ground-floor entrance at the centre bay of the street face.
  if (z === 0 && x === 6 && ground + 2 < top) {
    g.set(x, ground, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, ground + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, ground + 2, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
