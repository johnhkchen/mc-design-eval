import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075539";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 33 x 20 footprint, roof ~8 blocks above lowest ground.
// Reads as a two-storey mid-century/1980s Xinyi commercial block:
// stone-faced shopfront below, white concrete upper floor with a
// ribbon of glass panes, a cornice band and a parapet cap.
const W = 33, H = 20, D = 20;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));
const roofY = minG + 8;

function put(x, y, z, id, p) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

// Outward facing for edge cells (first missing neighbour wins at corners).
function faceOf(x, z) {
  const miss = [];
  if (!has(x, z - 1)) miss.push("north");
  if (!has(x, z + 1)) miss.push("south");
  if (!has(x - 1, z)) miss.push("west");
  if (!has(x + 1, z)) miss.push("east");
  return miss.length ? miss[0] : null;
}

// Entrance position per long facade: middle of that facade's run.
const range = { north: [Infinity, -Infinity], south: [Infinity, -Infinity] };
for (const [x, z] of cells) {
  const f = faceOf(x, z);
  if (f === "north" || f === "south") {
    range[f][0] = Math.min(range[f][0], x);
    range[f][1] = Math.max(range[f][1], x);
  }
}
const doorIdx = {
  north: Math.floor((range.north[0] + range.north[1]) / 2),
  south: Math.floor((range.south[0] + range.south[1]) / 2),
};

for (const [x, z, gr] of cells) {
  const top = Math.max(roofY, gr + 8);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const face = faceOf(x, z);

  if (face) {
    const idx = face === "north" || face === "south" ? x : z;
    const isDoor =
      (face === "north" || face === "south") && idx === doorIdx[face];
    const h2 = top - gr - 4; // rows in upper storey

    // Ground storey: base course, shopfront, fascia.
    put(x, gr, z, "polished_granite");
    for (let r = 1; r <= 2; r++) {
      const y = gr + r;
      if (isDoor) {
        // handled below
      } else if (idx % 4 === 0) {
        put(x, y, z, "stone_bricks");
      } else {
        put(x, y, z, "glass_pane");
      }
    }
    put(x, gr + 3, z, "smooth_quartz");

    if (isDoor) {
      const hinge = "left";
      put(x, gr + 1, z, "iron_door", {
        facing: face, half: "lower", hinge, open: "false", powered: "false",
      });
      put(x, gr + 2, z, "iron_door", {
        facing: face, half: "upper", hinge, open: "false", powered: "false",
      });
    }

    // Upper storey: string band, window ribbon, cornice, parapet cap.
    for (let u = 0; u < h2; u++) {
      const y = gr + 4 + u;
      if (u === 0) {
        put(x, y, z, "white_concrete");
      } else if (u === h2 - 1) {
        put(x, y, z, "smooth_stone");
      } else if (u >= h2 - 2) {
        put(x, y, z, "white_concrete");
      } else if (idx % 3 === 0) {
        put(x, y, z, "light_gray_concrete");
      } else if ((idx + u) % 7 === 3) {
        put(x, y, z, "glowstone");
      } else {
        put(x, y, z, "glass_pane");
      }
    }
  } else {
    // Interior: floor slabs and roof deck only, air between.
    put(x, gr, z, "smooth_stone");
    if (gr + 4 < top) put(x, gr + 4, z, "smooth_stone");
    put(x, top - 1, z, "light_gray_concrete");

    // Roof equipment block in the middle of the roof.
    const cx = W / 2, cz = D / 2;
    if (Math.abs(x - cx) < W * 0.2 && Math.abs(z - cz) < D * 0.2) {
      put(x, top, z, "stone_bricks");
      put(x, top + 1, z, "stone_bricks");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
