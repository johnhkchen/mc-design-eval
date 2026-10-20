import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw967579697.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw967579697.nbt";

// Record: 32 x 24 footprint, roof ~11 blocks above its own ground, two storeys
// of ~5 blocks with a ground-floor shopfront band, concrete frame with tinted
// glass (Taipei 1980s-90s commercial block), stone plinth, coping and parapet.
const W = 32, H = 23, D = 24;
const STOREY = 5;
const ROOF_RISE = 11;

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const G = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const ground = Math.max(0, Math.min(H - 1 - ROOF_RISE, Math.round(gr)));
  G.set(`${x},${z}`, ground);
}

const g = new Voxels([W, H, D]);
const key = (x, z) => `${x},${z}`;
const has = (x, z) => G.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "west", "-1,0": "east", "0,1": "north", "0,-1": "south" };

// Boundary faces and the dominant (street) face for the entrance.
const faceOf = new Map();
const faceCount = {};
for (const [k] of G) {
  const [x, z] = k.split(",").map(Number);
  const miss = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  if (miss.length) {
    const [dx, dz] = miss[0];
    faceOf.set(k, [dx, dz]);
    const fk = `${dx},${dz}`;
    faceCount[fk] = (faceCount[fk] || 0) + 1;
  }
}
const mainKey = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];
const [mdx, mdz] = mainKey ? mainKey.split(",").map(Number) : [0, 0];
const mainU = [];
for (const [k, [dx, dz]] of faceOf) {
  if (dx === mdx && dz === mdz) {
    const [x, z] = k.split(",").map(Number);
    mainU.push(dx !== 0 ? z : x);
  }
}
mainU.sort((a, b) => a - b);
const doorU = mainU.length ? mainU[Math.floor(mainU.length / 2)] : -1;

for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const top = gr + STOREY * 2;             // roof deck level (y = gr+10)
  const face = faceOf.get(k);
  const boundary = !!face;

  // 1. Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // 2. Storey floor slab (first floor) and roof deck. Each stands on the
  //    perimeter walls or the foundation below it.
  g.set(x, gr + STOREY, z, "smooth_quartz");
  g.set(x, top, z, "smooth_stone");

  if (!boundary) {
    // Interior: warm lamp sitting on the floor slab/ground behind the glass
    // of the cell it would be seen through is handled from the boundary pass.
    // Roof plant: small air-conditioning boxes on the deck.
    if (x % 7 === 3 && z % 7 === 3 && top + 1 <= H - 1) {
      g.set(x, top + 1, z, "light_gray_concrete");
    }
    continue;
  }

  const [dx, dz] = face;
  const u = dx !== 0 ? z : x;
  const pier = u % 3 === 0;
  const paneProps = dx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  const isDoor = dx === mdx && dz === mdz && u === doorU;

  // Walls, ground storey shopfront, upper storey windows.
  for (let y = gr; y < top; y++) {
    const rel = y - gr;
    let id;
    let props;
    if (rel === 0) {
      id = "stone_bricks"; // plinth course
    } else if (rel < STOREY) {
      // Ground storey (shopfront)
      if (isDoor && rel <= 2) {
        const hinge = "left";
        const facing = FACING[`${dx},${dz}`];
        g.set(x, y, z, "dark_oak_door", {
          facing, half: rel === 1 ? "lower" : "upper", hinge, open: "false", powered: "false"
        });
        continue;
      } else if (rel === 4) {
        id = "stone_bricks"; // lintel / canopy band
      } else if (pier || isDoor) {
        id = "white_concrete";
      } else {
        id = "light_blue_stained_glass_pane"; props = paneProps;
      }
    } else if (rel === STOREY) {
      id = "white_concrete"; // spandrel at floor line
    } else if (rel < STOREY * 2 - 1) {
      // Upper storey windows
      if (pier) id = "white_concrete";
      else { id = "light_blue_stained_glass_pane"; props = paneProps; }
    } else {
      id = "white_concrete"; // upper spandrel under coping
    }
    if (props) g.set(x, y, z, id, props);
    else g.set(x, y, z, id);
  }

  // Coping and parapet above the wall.
  g.set(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  if (top + 1 <= H - 1) g.set(x, top + 1, z, "stone_bricks");

  // Warm light behind glass: glowstone on the inner floor, just inside a window.
  const inX = x - dx, inZ = z - dz;
  if (has(inX, inZ) && G.get(key(inX, inZ)) === gr && u % 9 === 4 && !isDoor) {
    g.set(inX, gr + 6, inZ, "glowstone");   // upper storey, on the slab
  } else if (has(inX, inZ) && G.get(key(inX, inZ)) === gr && u % 9 === 1 && !isDoor) {
    g.set(inX, gr, inZ, "glowstone");       // shopfront, on the ground floor
  }
}

g.save(OUT);
