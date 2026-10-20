import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542407474";
const W = 20, H = 23, D = 15;

// Footprint cells: [x, z, ground]. Ground is clamped so the roof (ground + 11) stays inside the volume.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map(([x, z, g]) => ({ x, z, g: Math.max(0, Math.min(11, Math.round(g))) }));
const has = new Set(cells.map(c => `${c.x},${c.z}`));
const present = (x, z) => has.has(`${x},${z}`);

const g = new Voxels([W, H, D]);

const S = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const glassProps = axis => axis === "x"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance: on the street-facing (north, z-min) edge, nearest the middle of the frontage.
const mid = Math.floor(W / 2);
let entrance = null;
for (const c of cells) {
  if (!present(c.x, c.z - 1)) {
    if (!entrance || Math.abs(c.x - mid) < Math.abs(entrance.x - mid)) entrance = c;
  }
}

// Pass 1: foundations, floor slabs, roof slab, base edges.
for (const c of cells) {
  const { x, z, g: G } = c;
  for (let y = 0; y < G; y++) S(x, y, z, "stone_bricks");
  S(x, G, z, "light_gray_concrete");          // ground floor slab
  S(x, G + 5, z, "light_gray_concrete");      // second floor slab
  S(x, G + 10, z, "light_gray_concrete");     // roof slab
}

// Pass 2: facades, shopfronts, window grids, parapets.
for (const c of cells) {
  const { x, z, g: G } = c;
  const mN = !present(x, z - 1), mS = !present(x, z + 1);
  const mW = !present(x - 1, z), mE = !present(x + 1, z);
  const edge = mN || mS || mW || mE;
  if (!edge) continue;

  const axis = (mN || mS) ? "x" : "z";
  const u = axis === "x" ? x : z;
  const corner = (mN || mS) && (mW || mE);
  const pillar = corner || u % 4 === 0;
  const isEntrance = entrance && c === entrance;

  // Ground floor (commercial shopfront), y = G+1 .. G+4
  if (pillar) {
    for (let y = G + 1; y <= G + 4; y++) S(x, y, z, "white_concrete");
  } else if (isEntrance) {
    S(x, G + 1, z, "glass");
    S(x, G + 2, z, "glass");
    S(x, G + 3, z, "glass");
    S(x, G + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
  } else {
    S(x, G + 1, z, "polished_andesite");
    S(x, G + 2, z, "glass_pane", glassProps(axis));
    S(x, G + 3, z, "glass_pane", glassProps(axis));
    S(x, G + 4, z, "white_concrete");
  }

  // Upper storey, y = G+6 .. G+9
  if (pillar) {
    for (let y = G + 6; y <= G + 9; y++) S(x, y, z, "white_concrete");
  } else {
    S(x, G + 6, z, "smooth_stone");
    const mullion = u % 3 === 0;
    if (mullion) {
      S(x, G + 7, z, "white_concrete");
      S(x, G + 8, z, "white_concrete");
    } else {
      S(x, G + 7, z, "glass_pane", glassProps(axis));
      S(x, G + 8, z, "glass_pane", glassProps(axis));
      // Warm light behind some windows, inside the room.
      if ((u + G) % 5 === 0) {
        let ix = x, iz = z;
        if (mN) iz = z + 1; else if (mS) iz = z - 1;
        else if (mW) ix = x + 1; else if (mE) ix = x - 1;
        if (present(ix, iz) && !(!present(ix, iz - 1) || !present(ix, iz + 1) || !present(ix - 1, iz) || !present(ix + 1, iz))) {
          S(ix, G + 7, iz, "glowstone");
        } else if (present(ix, iz)) {
          S(ix, G + 6, iz, "lantern", { hanging: "false", waterlogged: "false" });
        }
      }
    }
    S(x, G + 9, z, "white_concrete");
  }

  // Parapet on the roof edge
  S(x, G + 11, z, "white_concrete");
}

// Pass 3: roof plant, a cyan water tank on the centre of the roof.
const tankCells = [];
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
  const x = cx - 1 + dx, z = cz - 1 + dz;
  if (present(x, z)) tankCells.push({ x, z, G: cells.find(c => c.x === x && c.z === z).g });
}
for (const { x, z, G } of tankCells) {
  for (let y = G + 11; y <= G + 13; y++) S(x, y, z, "cyan_terracotta");
  S(x, G + 14, z, "stone_bricks");
}

// Small AC units along the roof, on a non-parapet cell.
for (const c of cells) {
  if ((c.x + c.z) % 7 === 3 && present(c.x - 1, c.z) && present(c.x + 1, c.z) &&
      present(c.x, c.z - 1) && present(c.x, c.z + 1)) {
    S(c.x, c.g + 11, c.z, "light_gray_concrete");
    S(c.x, c.g + 12, c.z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
