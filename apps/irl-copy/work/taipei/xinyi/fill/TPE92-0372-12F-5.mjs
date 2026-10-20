import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE92-0372-12F-5: 2003 Xinyi mid-rise, 12 storeys of ~5 blocks, roof at y 69.
// Two tiers: the full 8x6 footprint to a setback at y 45, then a 6x4 inner tier
// to the roof. White tiled facade with mullioned cyan glass bands, granite base,
// a shopfront ground storey with a framed central door, a parapet on each tier,
// and a roof plant room.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/TPE92-0372-12F-5.cells.json`, "utf8"));

const W = 8, D = 6, H = 81;
const ROOF = 69;      // roof deck of the upper tier
const SETBACK = 45;   // roof deck of the lower ring
const STOREY = 5;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const inner = (x, z) => has(x, z) && x >= 1 && x <= W - 2 && z >= 1 && z <= D - 2;

// Entrance on the z=0 face, centred on x=3.
const ENT_X = 3, ENT_Z = 0;
const entranceOk = has(ENT_X, ENT_Z);
const plantCells = [];
for (let x = 2; x <= 5; x++) for (let z = 2; z <= 3; z++) if (inner(x, z)) plantCells.push([x, z]);

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "smooth_stone");

  const isInner = inner(x, z);
  const top = isInner ? ROOF : SETBACK;
  // Neighbour test within this cell's tier: the ring uses the full footprint,
  // the upper tier uses the inner set only.
  const member = (dx, dz) => (isInner ? inner(x + dx, z + dz) : has(x + dx, z + dz));
  const isEdge = !member(-1, 0) || !member(1, 0) || !member(0, -1) || !member(0, 1);
  const isCorner = (!member(-1, 0) || !member(1, 0)) && (!member(0, -1) || !member(0, 1));
  const onXFace = !member(0, -1) || !member(0, 1); // runs along x (front/back)
  const mullion = onXFace ? x % 2 === 1 : z % 2 === 1;
  const interiorLit = !isEdge && (x === 1 || x === W - 2 || z === 1 || z === D - 2);

  for (let y = gr; y <= top; y++) {
    const inGround = y < gr + STOREY;

    // Roof deck of this tier, with parapet on its edge.
    if (y === top) {
      g.set(x, y, z, "gray_concrete");
      if (isEdge) g.set(x, y + 1, z, "white_concrete");
      continue;
    }

    // Floor slab on storey lines, so every storey stands on the one below.
    if (y % STOREY === 0 && y > gr) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    if (isEdge) {
      if (inGround && y === gr) {
        g.set(x, y, z, "polished_granite"); // base course
        continue;
      }
      if (inGround) {
        // Ground storey: shopfront with a framed entrance on the z=0 face.
        if (entranceOk && z === ENT_Z && x >= ENT_X - 1 && x <= ENT_X + 1 && y <= gr + 2) {
          if (x === ENT_X && y === gr + 1) {
            g.set(x, y, z, "birch_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
            continue;
          }
          if (x === ENT_X && y === gr + 2) {
            g.set(x, y, z, "birch_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
            continue;
          }
          if (x !== ENT_X) {
            g.set(x, y, z, "stone_bricks"); // door frame jambs
            continue;
          }
        }
        if (entranceOk && z === ENT_Z && x === ENT_X && y === gr + 3) {
          g.set(x, y, z, "lantern", { hanging: "false" });
          continue;
        }
        if (isCorner || (mullion && y % STOREY !== 0)) {
          g.set(x, y, z, "white_concrete");
        } else {
          g.set(x, y, z, "cyan_stained_glass_pane");
        }
        continue;
      }

      // Typical storeys: window band (rails top and bottom), spandrel, piers.
      const r = y % STOREY;
      if (isCorner) {
        g.set(x, y, z, "white_concrete");
      } else if (r === 1 || r === 3) {
        g.set(x, y, z, "white_concrete"); // frame rails
      } else if (r === 2) {
        g.set(x, y, z, mullion ? "white_concrete" : "cyan_stained_glass_pane");
      } else if (r === 4) {
        g.set(x, y, z, "light_gray_concrete"); // spandrel
      }
      continue;
    }

    // Interior: air, except warm lights behind some windows.
    if (interiorLit && y % STOREY === 2 && ((x + z + Math.floor(y / STOREY)) % 3 === 0)) {
      g.set(x, y, z, "glowstone");
    }
  }
}

// Roof plant room on the upper tier, standing on its roof deck.
if (plantCells.length === 8) {
  for (const [x, z] of plantCells) {
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      const perimeter = x === 2 || x === 5 || z === 2 || z === 3;
      if (perimeter && y === ROOF + 2 && (x === 2 || x === 5)) {
        g.set(x, y, z, "cyan_stained_glass_pane");
      } else {
        g.set(x, y, z, "light_gray_concrete");
      }
    }
    g.set(x, ROOF + 4, z, "light_gray_concrete");
  }
  g.set(3, ROOF + 5, 2, "sea_lantern");
  g.set(4, ROOF + 5, 3, "sea_lantern");
}

g.save(`${DIR}/TPE92-0372-12F-5.nbt`);
