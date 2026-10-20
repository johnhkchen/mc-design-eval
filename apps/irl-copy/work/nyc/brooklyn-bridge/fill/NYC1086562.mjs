import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1086562.cells.json`, "utf8"));

const W = 17, H = 28, D = 12;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const SET = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => SET.has(key(x, z));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Facade description for a perimeter cell: outward facing, inner neighbour, index along the face.
function faceOf(x, z) {
  if (!has(x - 1, z)) return { facing: "west", idx: z, ix: x + 1, iz: z };
  if (!has(x + 1, z)) return { facing: "east", idx: z, ix: x - 1, iz: z };
  if (!has(x, z - 1)) return { facing: "north", idx: x, ix: x, iz: z + 1 };
  if (!has(x, z + 1)) return { facing: "south", idx: x, ix: x, iz: z - 1 };
  return null;
}

// Clean per-cell massing: granite foundation to ground, storey-stepped roof.
const info = cells.map(([x, z, gr, rf]) => {
  const gy = clamp(Math.round(gr), 0, 12);
  const top = clamp(Math.round(rf / 2) * 2, gy + 4, 24);
  const perim = !!faceOf(x, z);
  return { x, z, gy, top, perim };
});

// Pass 1: solid massing, foundation, brick walls, cornice and parapet.
for (const c of info) {
  const { x, z, gy, top, perim } = c;
  for (let y = 0; y <= gy; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gy + 1; y < top; y++) g.set(x, y, z, "bricks");
  g.set(x, top, z, "stone_bricks");
  if (perim) g.set(x, top + 1, z, "stone_brick_wall");
}

// Pass 2: facade articulation - shopfront, window grid with white frames, door.
const southNorth = info
  .filter((c) => {
    const f = faceOf(c.x, c.z);
    return f && (f.facing === "south" || f.facing === "north");
  })
  .sort((a, b) => Math.abs(a.x - 8) - Math.abs(b.x - 8));
const doorCell = southNorth.length ? southNorth[0] : null;

for (const c of info) {
  const f = faceOf(c.x, c.z);
  if (!f) continue;
  const { x, z, gy, top } = c;
  const isWin = f.idx % 3 === 1;
  const isDoor = doorCell && doorCell.x === x && doorCell.z === z;

  // Ground floor: shopfront glass in window bays, dark oak piers, transom band.
  if (isDoor) {
    g.set(x, gy + 1, z, "oak_door", {
      facing: f.facing, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gy + 2, z, "oak_door", {
      facing: f.facing, half: "upper", hinge: "left", open: "false", powered: "false",
    });
    g.set(f.ix, gy + 1, f.iz, "air");
    g.set(f.ix, gy + 2, f.iz, "air");
  } else if (isWin) {
    g.set(x, gy + 1, z, "glass_pane");
    g.set(x, gy + 2, z, "glass_pane");
    const lit = (x + z) % 3 === 0;
    g.set(f.ix, gy + 1, f.iz, lit ? "glowstone" : "air");
    g.set(f.ix, gy + 2, f.iz, "air");
  } else {
    g.set(x, gy + 1, z, "dark_oak_planks");
    g.set(x, gy + 2, z, "dark_oak_planks");
  }

  // Upper storeys: window rows at odd rel heights; white frame only around windows.
  for (let y = gy + 3; y < top; y += 2) {
    if (isWin) {
      g.set(x, y, z, "glass_pane");
      const lit = (x + z + y) % 4 === 0;
      g.set(f.ix, y, f.iz, lit ? "glowstone" : "air");
      // white sill below the window (only on window bays, spandrel row)
      g.set(x, y - 1, z, "white_concrete");
    }
  }
  // Lintel above top window row on window bays.
  if (isWin) {
    const lastWin = gy + 3 + Math.floor((top - gy - 4) / 2) * 2;
    if (lastWin + 1 < top) g.set(x, lastWin + 1, z, "white_concrete");
  }
}

// Pass 3: a few brick chimneys on interior cells (sparse, not a field of stacks).
for (const c of info) {
  const { x, z, top } = c;
  if (has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1)) {
    if ((x * 5 + z * 7) % 23 === 0 && top <= 20) {
      for (let y = top + 1; y <= top + 2; y++) g.set(x, y, z, "bricks");
      g.set(x, top + 3, z, "stone_bricks");
    }
  }
}

g.save(`${DIR}/NYC1086562.nbt`);
