import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121242";
const W = 22, H = 23, D = 20;

// Two storeys of 5 blocks, cornice at 10, parapet to 11 (roof about 11 above lowest ground).
const FLOOR_LINE = 5;
const CORNICE = 10;
const ROOF_TOP = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const inFp = (x, z) => G.has(`${x},${z}`);
const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "east", dx: 1, dz: 0 },
  { name: "west", dx: -1, dz: 0 },
];
const facesOf = (x, z) => DIRS.filter((d) => !inFp(x + d.dx, z + d.dz));

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Entrance: the south-facing perimeter cell closest to the middle of the frontage.
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (facesOf(x, z).some((f) => f.name === "south")) {
      const d = Math.abs(x - Math.floor(W / 2));
      if (d < best) { best = d; doorKey = `${x},${z}`; }
    }
  }
}

function buildFoundation(x, z, gr) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

function buildInterior(x, z, gr) {
  // Floor slabs at storey line and roof deck; interior air is left open behind the glass.
  if (FLOOR_LINE >= gr) put(x, FLOOR_LINE, z, "smooth_quartz");
  if (CORNICE >= gr) put(x, CORNICE, z, "smooth_quartz");
}

function buildWall(x, z, gr, fc) {
  const corner = fc.length >= 2;
  const f = fc[0];
  const alongX = f.dz !== 0; // north/south faces run along x
  const pos = alongX ? x : z;
  const pier = corner || pos % 4 === 0;
  const pane = alongX
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  const isDoor = doorKey === `${x},${z}`;

  for (let y = gr; y <= ROOF_TOP; y++) {
    if (y === gr) { put(x, y, z, "polished_granite"); continue; }
    if (y === ROOF_TOP) { put(x, y, z, corner ? "quartz_pillar" : "white_terracotta"); continue; }
    if (y === CORNICE) { put(x, y, z, "stone_bricks"); continue; }
    if (y === FLOOR_LINE) { put(x, y, z, "smooth_quartz"); continue; }

    if (y < FLOOR_LINE) {
      // Shopfront: tinted glass between smooth quartz piers, entrance door in the centre.
      if (isDoor && (y === gr + 1 || y === gr + 2) && gr + 2 < FLOOR_LINE) {
        put(x, y, z, "iron_door", {
          facing: "south",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (isDoor && y === gr + 3) { put(x, y, z, "smooth_quartz"); continue; }
      if (pier) { put(x, y, z, corner ? "quartz_pillar" : "smooth_quartz"); continue; }
      put(x, y, z, "cyan_stained_glass_pane", pane);
      continue;
    }

    // Upper storey: window bands with white terracotta piers.
    if (pier) { put(x, y, z, corner ? "quartz_pillar" : "white_terracotta"); continue; }
    put(x, y, z, "light_blue_stained_glass_pane", pane);

    // Warm light behind some upper windows.
    if (y === 7 && (x + z) % 3 === 0) {
      const ix = x - f.dx, iz = z - f.dz;
      if (inFp(ix, iz) && facesOf(ix, iz).length === 0) put(ix, y, iz, "shroomlight");
    }
  }
}

// Main pass: foundations, interior slabs, walls.
for (const [x, z, gr] of cells) {
  buildFoundation(x, z, gr);
  const fc = facesOf(x, z);
  if (fc.length === 0) buildInterior(x, z, gr);
  else buildWall(x, z, gr, fc);
}

// Roof equipment: AC plant blocks and a water tank on the roof deck, inside the parapet.
for (const [x, z, gr] of cells) {
  if (facesOf(x, z).length !== 0) continue;
  if (gr > CORNICE) continue;
  if (x % 5 === 2 && z % 5 === 2) put(x, ROOF_TOP, z, "light_gray_concrete");
}
{
  const tank = [[14, 13], [15, 13], [14, 14], [15, 14]];
  const ok = tank.every(([x, z]) => inFp(x, z) && facesOf(x, z).length === 0 && G.get(`${x},${z}`) <= CORNICE);
  if (ok) {
    for (const [x, z] of tank) {
      put(x, ROOF_TOP, z, "white_concrete");
      put(x, ROOF_TOP + 1, z, "white_concrete");
      put(x, ROOF_TOP + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
