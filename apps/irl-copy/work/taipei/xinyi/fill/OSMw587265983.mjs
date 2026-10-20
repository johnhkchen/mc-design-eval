import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265983";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 4, H = 37, D = 11;
const g = new Voxels([W, H, D]);

// Footprint lookup and ground heights
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inside = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...cells.map(c => c[2]));

// Outward face of a perimeter cell: W (x-), E (x+), N (z-), S (z+)
function faceOf(x, z) {
  if (!inside(x - 1, z)) return "W";
  if (!inside(x + 1, z)) return "E";
  if (!inside(x, z - 1)) return "N";
  return "S";
}

// Inward offset from a face
const inward = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };

// Facade block for a perimeter cell at relative row r.
// Returns [id, props] | "air" (entrance opening) | null (nothing)
function facade(face, t, max, r, lit) {
  // Cornice, parapet, cap (rows 25..28)
  if (r === 25) return ["stone_bricks"];
  if (r === 26 || r === 27) return ["white_concrete"];
  if (r === 28) return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }];

  // Corner piers on every storey
  if (t === 0 || t === max) return ["white_concrete"];

  const k = Math.floor(r / 5);
  const sub = r % 5;

  if (k === 0) {
    // Ground storey: base course, shopfront glass, entrance on the west street face
    if (sub === 0) return ["stone_bricks"];
    if (sub === 3) return ["stone_bricks"];
    if (face === "W" && t === 5 && sub <= 2) return "air";
    if (t % 3 === 0) return ["white_concrete"];
    return ["cyan_stained_glass_pane"];
  }

  // Upper storeys: spandrel bands, tinted window grid with white piers
  if (sub === 0) return ["light_gray_concrete"];
  if (sub === 4) return ["white_concrete"];
  if (t % 3 === 0) return ["white_concrete"];
  if (lit && sub === 2) return ["light_blue_stained_glass_pane"];
  return ["light_blue_stained_glass_pane"];
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone");

  const perim = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  const face = perim ? faceOf(x, z) : null;
  const t = face === "W" || face === "E" ? z : x;
  const max = face === "W" || face === "E" ? 10 : 3;

  for (let r = 0; r <= 28; r++) {
    const y = minG + r;
    if (y < gr) continue;
    if (y >= H) break;

    if (perim) {
      const k = Math.floor(r / 5);
      const sub = r % 5;
      // Lit window: upper storeys, odd storey, every other bay, glow behind the glass
      const litBay = k >= 1 && k % 2 === 1 && sub === 2 && t % 3 === 2;
      const f = facade(face, t, max, r, litBay);
      if (f === null || f === "air") continue;
      g.set(x, y, z, f[0], f[1]);

      if (litBay && r < 25) {
        const [dx, dz] = inward[face];
        const ix = x + dx, iz = z + dz;
        if (inside(ix, iz) && y >= ground.get(`${ix},${iz}`)) {
          g.set(ix, y, iz, "glowstone");
        }
      }
    } else {
      // Interior: floor slabs and roof deck only, air otherwise
      if (r % 5 === 0 && r <= 25) {
        g.set(x, y, z, "smooth_stone");
      } else if (r >= 26 && r <= 27 && x >= 1 && x <= 2 && z >= 3 && z <= 6) {
        // Roof mechanical plant
        g.set(x, y, z, "light_gray_concrete");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
