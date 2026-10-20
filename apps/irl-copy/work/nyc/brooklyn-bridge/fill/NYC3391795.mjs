import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3391795";
const W = 6, H = 25, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const at = new Map();
for (const c of cells) at.set(`${c[0]},${c[1]}`, c);
const has = (x, z) => at.has(`${x},${z}`);
const exterior = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Per-cell massing: ground from lidar, roof in whole 2-block storeys, parapet on top.
const level = new Map();
for (const c of cells) {
  const [x, z] = c;
  const gr = Math.max(0, Math.round(c[2]));
  const rr = Math.round(c[3]);
  let stories = Math.round((rr - gr) / 2);
  stories = Math.max(3, Math.min(6, stories));
  stories = Math.min(stories, Math.max(3, Math.floor((H - 9 - gr) / 2)));
  level.set(`${x},${z}`, { gr, top: gr + 2 * stories });
}

// Street frontage is the west (x = 0) face; the entrance sits mid-frontage.
const zsStreet = cells.filter(c => c[0] === 0).map(c => c[1]).sort((a, b) => a - b);
const doorZ = zsStreet.length ? zsStreet[Math.floor(zsStreet.length / 2)] : -1;

function face(x, z) {
  if (!has(x - 1, z)) return { street: x === 0, u: z };
  if (!has(x + 1, z)) return { street: false, u: z };
  return { street: false, u: x };
}

function put(x, y, z, id, props) {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

for (const c of cells) {
  const [x, z] = c;
  const { gr, top } = level.get(`${x},${z}`);
  const ext = exterior(x, z);
  const f = face(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= top + 1; y++) {
    const k = y - gr;

    if (!ext) {
      // Interior: floor slabs and roof slab only; everything else is air.
      if (y === top - 1 || y === gr) put(x, y, z, "smooth_stone");
      else if (k > 0 && k % 2 === 0 && y < top - 1) put(x, y, z, "smooth_stone");
      continue;
    }

    // Exterior shell.
    if (y === top + 1) {
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y === top) { put(x, y, z, "bricks"); continue; }
    if (y === top - 1) {
      // Cornice: stone band with a half-slab drip course above the window row.
      put(x, y, z, "stone_bricks");
      continue;
    }

    // Entrance: dark oak door on the street face, flanked by brick piers.
    const doorCell = x === 0 && z === doorZ;
    if (doorCell && (k === 0 || k === 1)) {
      put(x, y, z, "dark_oak_door", {
        facing: "west",
        half: k === 0 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (k === 0) { put(x, y, z, "stone_bricks"); continue; }  // granite-like base course

    // Floor line: half-height stone slab band, leaving brick above and below.
    if (k % 2 === 0) {
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    // Window rows (odd k).
    const u = f.u;
    const nearDoor = f.street && Math.abs(z - doorZ) === 1;
    if (k === 1 && f.street) {
      // Shopfront: glass between brick piers; piers beside the door are solid.
      const pier = u % 3 === 0 || nearDoor;
      put(x, y, z, pier ? "bricks" : "glass_pane");
      continue;
    }
    if (u % 3 === 1) {
      const lit = k > 1 && (u + k) % 5 === 0;
      put(x, y, z, lit ? "glowstone" : "glass_pane");
    } else {
      put(x, y, z, "bricks");
    }
  }

  // Water tower on one interior cell: legs, a tank with a hooped band, and a cap.
  if (x === 2 && z === 6 && !ext) {
    for (let y = top; y <= top + 2; y++) put(x, y, z, "oak_fence");
    for (let y = top + 3; y <= top + 5; y++) put(x, y, z, "spruce_planks");
    put(x, top + 4, z, "iron_bars");
    put(x, top + 6, z, "spruce_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
