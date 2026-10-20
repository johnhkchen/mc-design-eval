import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540891064";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const minG = Math.min(...cells.map((c) => c[2]));
// Roof surface about 11 blocks above lowest ground: parapet/roof deck index = minG+10
const TOP = Math.min(minG + 10, H - 3);
// Two storeys of 5 blocks: ground floor minG..minG+4, upper minG+5..minG+9
const F1 = minG + 5;

// Entrance: south-facing perimeter cell nearest the footprint's mean x
const southCells = cells.filter(([x, z]) => !has(x, z + 1));
const meanX = southCells.reduce((s, c) => s + c[0], 0) / Math.max(1, southCells.length);
let entrance = null;
for (const [x, z] of southCells) {
  if (entrance === null || Math.abs(x - meanX) < Math.abs(entrance[0] - meanX)) entrance = [x, z];
}

const paneProps = (ns) =>
  ns
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const faces = {
    n: !has(x, z - 1),
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
  const perim = faces.n || faces.s || faces.w || faces.e;
  const corner = (faces.n || faces.s) && (faces.w || faces.e);

  // Foundation from y=0 up to terrain under this cell
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs only, air between (no rooms)
    g.set(x, gr, z, "light_gray_concrete");
    if (F1 > gr && F1 < TOP) g.set(x, F1, z, "light_gray_concrete");
    if (TOP > gr) g.set(x, TOP, z, "light_gray_concrete");
    // Roof plant on the deck
    if (x % 5 === 2 && z % 5 === 2 && TOP + 1 < H) {
      g.set(x, TOP + 1, z, "smooth_stone");
      g.set(x, TOP + 2 < H ? TOP + 2 : TOP + 1, z, "smooth_stone");
    }
    continue;
  }

  // Which way the window run along this cell runs
  const nsRun = faces.n || faces.s;
  const pos = nsRun ? x : z;
  const isEntrance = entrance && entrance[0] === x && entrance[1] === z && faces.s && !corner;

  // Inward neighbour for warm lights (interior cell next to the glass)
  let inward = null;
  if (faces.n) inward = [x, z + 1];
  else if (faces.s) inward = [x, z - 1];
  else if (faces.w) inward = [x + 1, z];
  else if (faces.e) inward = [x - 1, z];

  for (let y = gr; y <= TOP; y++) {
    if (y === TOP) {
      // Parapet / cornice
      g.set(x, y, z, "white_concrete");
      continue;
    }

    if (y < F1) {
      // Ground floor shopfront
      const dy = y - gr;
      if (isEntrance) {
        if (dy === 0) g.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (dy === 1) g.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        else if (dy === 2) g.set(x, y, z, "glass_pane", paneProps(false));
        else g.set(x, y, z, "smooth_stone");
        continue;
      }
      if (dy === 0) g.set(x, y, z, "stone_bricks");
      else if (dy <= 3) {
        if (corner || pos % 3 === 0) g.set(x, y, z, "white_concrete");
        else g.set(x, y, z, "glass_pane", paneProps(nsRun));
      } else {
        g.set(x, y, z, "smooth_stone");
      }
      continue;
    }

    // Upper storey: spandrel bands at storey lines, windows between
    const r = (y - F1) % 5;
    if (r === 0 || r === 4) {
      g.set(x, y, z, "white_concrete");
      continue;
    }
    if (corner || pos % 3 === 0) {
      g.set(x, y, z, "white_concrete");
      continue;
    }
    g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(nsRun));

    // Warm light behind some glass
    if (r === 2 && inward && ((x * 7 + z * 13 + y) % 5 === 0)) {
      const [ix, iz] = inward;
      if (has(ix, iz) && !(!has(ix, iz - 1) || !has(ix, iz + 1) || !has(ix - 1, iz) || !has(ix + 1, iz))) {
        g.set(ix, y, iz, "glowstone");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
