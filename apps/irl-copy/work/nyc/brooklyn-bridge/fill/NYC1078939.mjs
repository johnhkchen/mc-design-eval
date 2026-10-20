import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1078939.cells.json`, "utf8"));

const W = 160, H = 22, D = 36;
const g = new Voxels([W, H, D]);

// Marginal Street Wharf, 1963: a long pier shed on stone-faced piles.
// Light concrete wall panels with a white cornice band, steel columns on an
// 8-block grid, roll-up loading doors, industrial glazing, a recessed glass
// entrance with stone surround, a raised clerestory monitor and a light roof.

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
const rfs = [];
for (const [x, z, gr, rf] of cells) {
  const ground = Math.round(gr);
  const roof = Math.round(rf);
  cellMap.set(key(x, z), { gr: ground, rf: roof });
  if (Number.isFinite(roof)) rfs.push(roof);
}

rfs.sort((a, b) => a - b);
const median = rfs.length ? rfs[Math.floor(rfs.length / 2)] : 10;
const roofTop = Math.min(H - 4, Math.max(median, 8));

const has = (x, z) => cellMap.has(key(x, z));
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Entrance: on the z=0 long side, centred on x=80, 10 blocks wide.
const entryX0 = 75, entryX1 = 84;
const inEntry = (x, z) => z <= 1 && x >= entryX0 && x <= entryX1;

// Clerestory monitor on the roof, central, 2 blocks above the roof tier.
const monX0 = 36, monX1 = 123, monZ0 = 13, monZ1 = 22;
const inMonitor = (x, z) => x >= monX0 && x <= monX1 && z >= monZ0 && z <= monZ1;
const monitorEdge = (x, z) => inMonitor(x, z) && (x === monX0 || x === monX1 || z === monZ0 || z === monZ1);

for (const [x, z] of cells) {
  const { gr: rawGround } = cellMap.get(key(x, z));
  const gr = Math.max(0, Math.min(rawGround, roofTop - 4));
  const perim = isPerim(x, z);

  // Foundation piles from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Wharf deck.
  g.set(x, gr, z, "smooth_stone");

  if (perim) {
    for (let y = gr + 1; y <= roofTop - 2; y++) {
      let mat = "light_gray_concrete";
      if (y === gr + 1) mat = "stone_bricks";                 // base course
      else if (y === roofTop - 2) mat = "white_concrete";     // cornice band
      else if ((x + z) % 8 === 0) mat = "stone";              // pilasters

      // Entrance: stone surround, glass doors, lintel and glow above.
      if (inEntry(x, z)) {
        const isFrame = x === entryX0 || x === entryX1;
        if (y <= gr + 3) {
          mat = isFrame ? "stone_bricks" : "glass";
        } else if (y === gr + 4) {
          mat = "stone_bricks";
        } else if (y === gr + 5) {
          mat = (x === 79 || x === 80) ? "glowstone" : "white_concrete";
        }
      } else {
        // Roll-up loading doors, three high, four wide.
        const doorPos = (x + z) % 16;
        const inDoor = doorPos >= 8 && doorPos <= 11 && y >= gr + 1 && y <= gr + 3;
        if (inDoor) {
          mat = "gray_concrete";
        } else {
          // Industrial glazing band in two rows, some lit from behind.
          const band = y === gr + 3 || y === gr + 4;
          const m6 = (x + z) % 6;
          if (band && (x + z) % 8 !== 0 && (m6 === 1 || m6 === 2 || m6 === 4 || m6 === 5)) {
            mat = ((x * 7 + z) % 23 === 0) ? "glowstone" : "gray_stained_glass_pane";
          }
        }
      }

      g.set(x, y, z, mat);
    }
    // Parapet cap.
    g.set(x, roofTop - 1, z, "stone_bricks");
  } else {
    // Interior roof: light concrete with a skylight strip.
    let roofMat = "smooth_stone";
    if (z >= 16 && z <= 18 && x > 4 && x < W - 5) roofMat = "glass";
    g.set(x, roofTop - 1, z, roofMat);

    // Clerestory monitor: glass sides, stone cap, stands on the roof tier.
    if (inMonitor(x, z)) {
      if (monitorEdge(x, z)) {
        const onLong = z === monZ0 || z === monZ1;
        const lit = onLong && (x % 6 === 0 || x % 6 === 3) ? "glowstone" : "gray_stained_glass_pane";
        g.set(x, roofTop, z, "stone_bricks");
        g.set(x, roofTop + 1, z, lit);
        g.set(x, roofTop + 2, z, "stone_bricks");
      } else {
        g.set(x, roofTop, z, "light_gray_concrete");
        g.set(x, roofTop + 1, z, "light_gray_concrete");
        g.set(x, roofTop + 2, z, "stone_bricks");
      }
    } else if (x % 24 === 12 && z % 12 === 6) {
      // Roof vents.
      g.set(x, roofTop, z, "iron_block");
      g.set(x, roofTop + 1, z, "iron_block");
    }

    // Steel columns on an 8-block grid carrying the roof.
    if (x % 8 === 0 && z % 8 === 0) {
      for (let y = gr + 1; y <= roofTop - 2; y++) g.set(x, y, z, "iron_block");
    }
  }
}

g.save(`${DIR}/NYC1078939.nbt`);
