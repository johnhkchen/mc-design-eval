import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075545";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Mid-rise 1990s-2000s Taipei office block: white tiled concrete frame, tinted glass
// window bands, shopfront podium, parapet roof with a central plant penthouse and mast.
const W = 17, H = 46, D = 14;
const ROOF = 33;          // roof deck / parapet top sits at y = 34
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(key(x, z), Math.round(gr));
const has = (x, z) => cellMap.has(key(x, z));
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const paneProps = (alongX) => alongX
  ? { north: "false", south: "false", east: "true", west: "true" }
  : { north: "true", south: "true", east: "false", west: "false" };

for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const gr = cellMap.get(key(x, z));
  const miss = dirs.filter(([dx, dz]) => !has(x + dx, z + dz));
  const edge = miss.length > 0;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF; y++) {
    const rel = y - gr;

    // Roof coping / deck
    if (y === ROOF) {
      put(x, y, z, edge ? "white_concrete" : "light_gray_concrete");
      continue;
    }

    // Floor slabs and storey lines
    if (rel % 5 === 0) {
      put(x, y, z, edge ? "white_concrete" : "light_gray_concrete");
      continue;
    }

    // Interior: air gap, no interiors
    if (!edge) continue;

    const [dx, dz] = miss[0];
    const alongX = dz !== 0;            // face runs along x (north or south face)
    const idx = alongX ? x : z;         // position along the face
    const ground = rel < 5;
    const rr = rel % 5;                 // 1..4
    const storey = Math.floor(rel / 5);

    // Spandrel band under each storey slab
    if (rr === 4) { put(x, y, z, "white_concrete"); continue; }

    // Piers every 4 blocks
    if (idx % 4 === 0) { put(x, y, z, "white_concrete"); continue; }

    // Entrance on south face (dz === 1), centred
    if (ground && dz === 1 && x >= 7 && x <= 9 && rr <= 2) continue;
    if (ground && dz === 1 && x === 8 && rr === 3) {
      put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }

    // Glazing: tinted blue shopfront at ground, grey office glass above
    const pane = ground ? "light_blue_stained_glass_pane" : "gray_stained_glass_pane";
    put(x, y, z, pane, paneProps(alongX));

    // Warm light behind some upper windows
    if (!ground && idx % 4 === 2 && storey % 2 === 0) {
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }
}

// Central plant penthouse on the roof, y 34..37, capped at 38
for (let x = 4; x <= 12; x++) {
  for (let z = 4; z <= 9; z++) {
    if (!has(x, z)) continue;
    const boundary = x === 4 || x === 12 || z === 4 || z === 9;
    for (let y = ROOF + 1; y <= 37; y++) {
      if (!boundary) continue; // hollow plant room, air inside
      if (z === 4 || z === 9) {
        if (y >= 35 && y <= 36 && x >= 5 && x <= 11) {
          put(x, y, z, "gray_stained_glass_pane", paneProps(true));
        } else {
          put(x, y, z, "light_gray_concrete");
        }
      } else {
        put(x, y, z, "light_gray_concrete");
      }
    }
    put(x, 38, z, "smooth_stone");
  }
}

// Mast on the penthouse
if (has(8, 6)) {
  for (let y = 39; y <= 42; y++) put(8, y, 6, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
