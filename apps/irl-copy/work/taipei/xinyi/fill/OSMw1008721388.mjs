import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-century (c. 1960s-70s) two-storey civic/commercial block: smooth quartz
// walls, stone base course and parapet, a shopfront ground storey with a
// central door, a window grid above, a grey roof with rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1008721388";
const W = 35, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  G.set(`${x},${z}`, gr);
}
const base = Math.min(...G.values());   // lowest ground under the footprint
const T = base + 11;                     // roof is ~11 blocks above lowest ground

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};
const has = (x, z) => G.has(`${x},${z}`);

const FACES = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];
const outward = (x, z) => FACES.filter(f => !has(x + f.dx, z + f.dz));
const isEdge = (x, z) => outward(x, z).length > 0;

// Main entrance: the south-facing cell nearest the mean x of that facade.
let doorKey = null;
{
  const south = [...G.keys()]
    .map(k => k.split(",").map(Number))
    .filter(([x, z]) => outward(x, z).some(f => f.n === "south"));
  if (south.length) {
    const mx = south.reduce((s, [x]) => s + x, 0) / south.length;
    south.sort((a, b) => Math.abs(a[0] - mx) - Math.abs(b[0] - mx));
    doorKey = `${south[0][0]},${south[0][1]}`;
  }
}

// Build each footprint column.
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (!isEdge(x, z)) {
    // Interior: floor slab at the storey line, roof slab on top, no interior fit-out.
    put(x, base + 5, z, "smooth_quartz");
    put(x, base + 10, z, "gray_concrete");
    continue;
  }

  const faces = outward(x, z);
  const face = faces[0];
  const along = face.dx !== 0 ? z : x; // coordinate running along the facade
  const col = ((along % 4) + 4) % 4;
  const isWin = col === 1 || col === 2;
  const isDoor = key === doorKey;

  for (let y = gr; y <= T - 1; y++) {
    let id = "smooth_quartz";
    let props;
    if (y === gr) {
      id = "polished_andesite";                       // base course
    } else if (y === T - 1) {
      id = "stone_bricks";                            // parapet / cornice
    } else if (y === base + 9 || y === base + 5) {
      id = "smooth_stone";                            // storey lines
    } else if (y >= base + 6 && y <= base + 8) {
      id = isWin ? "light_blue_stained_glass" : "white_concrete"; // upper windows
    } else if (y === base + 4) {
      id = "smooth_quartz";                           // ground-floor lintel
    } else if (y >= gr + 1 && y <= base + 3) {
      if (isDoor && (y === gr + 1 || y === gr + 2)) {
        id = "dark_oak_door";
        props = {
          facing: "south",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
      } else {
        id = isWin && !isDoor ? "light_blue_stained_glass" : "stone"; // shopfront
      }
    }
    if (isDoor && (y === gr + 1 || y === gr + 2) && y <= base + 3) {
      // door already set above
    }
    put(x, y, z, id, props);
  }
}

// Warm lights just inside some windows (behind the glass).
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  for (const f of outward(x, z)) {
    const ix = x - f.dx, iz = z - f.dz;
    if (!has(ix, iz) || isEdge(ix, iz)) continue;
    const c = f.dx !== 0 ? z : x;
    const m = ((c % 8) + 8) % 8;
    if (m === 1) put(ix, base + 7, iz, "glowstone");
    if (m === 5) {
      const ig = G.get(`${ix},${iz}`);
      if (ig + 2 <= base + 3) put(ix, ig + 2, iz, "glowstone");
    }
  }
}

// Rooftop plant: small grey boxes on some interior roof cells.
for (const [key] of G) {
  const [x, z] = key.split(",").map(Number);
  if (isEdge(x, z)) continue;
  if (x % 9 === 4 && z % 6 === 3 && T + 1 < H) {
    put(x, T, z, "light_gray_concrete");
    put(x, T + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
