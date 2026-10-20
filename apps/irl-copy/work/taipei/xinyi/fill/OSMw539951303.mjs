import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951303";
const W = 28, H = 23, D = 22;

// Two-storey low-rise commercial block, late-20th-century Xinyi: white tiled
// facade, granite base, dark glass shopfront, one central entrance, rooftop plant.
const ROOF = 11;  // top of parapet (absolute)
const F1 = 5;     // ground/upper floor slab
const F2 = 10;    // upper floor / roof slab (cornice line)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(`${x},${z}`, gr);
const has = (x, z) => groundOf.has(`${x},${z}`);
const exposed = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});

// Front (south, z max) face: pick the centre cell for the entrance.
const frontCells = cells
  .filter(([x, z]) => !has(x, z + 1))
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
const doorX = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : -1;
const doorZ = cells.reduce((m, [, z]) => Math.max(m, z), -Infinity);

const paneProps = (horizontalRun) =>
  horizontalRun
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: structure, walls, floors, windows
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  const nFace = ex.n || ex.s;
  const wFace = ex.w || ex.e;
  const corner = nFace && wFace;
  const edge = nFace || wFace;
  const isFront = ex.s && z === doorZ;
  const isDoor = isFront && x === doorX;
  const t = nFace ? x : z; // position along the exposed face
  const mullion = edge && !corner && t % 3 === 0;

  for (let y = 0; y <= ROOF; y++) {
    // Foundation below the cell's own ground
    if (y < gr) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Full floor / roof slabs across the footprint
    if (y === F1 || y === F2) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    if (corner) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    if (!edge) continue; // interior: air gap, no interiors

    // Base course
    if (y === gr) {
      g.set(x, y, z, "polished_granite");
      continue;
    }

    // Parapet
    if (y === ROOF) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    // Ground storey (shopfront)
    if (y > gr && y < F1) {
      if (isDoor) {
        if (y === gr + 1) {
          g.set(x, y, z, "oak_door", {
            facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
          });
        } else if (y === gr + 2) {
          g.set(x, y, z, "oak_door", {
            facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
          });
        } else if (y === gr + 3) {
          g.set(x, y, z, "light_gray_concrete"); // entrance canopy lintel
        } else {
          g.set(x, y, z, "glass");
        }
        continue;
      }
      if (y === 4) {
        g.set(x, y, z, "light_gray_concrete"); // lintel over shopfront
      } else if (mullion) {
        g.set(x, y, z, "light_gray_concrete");
      } else {
        g.set(x, y, z, "glass");
      }
      continue;
    }

    // Upper storey (window grid)
    if (y >= F1 + 1 && y < F2) {
      if (y === F1 + 1 || y === F2 - 1) {
        g.set(x, y, z, "white_concrete"); // sill / head
        continue;
      }
      if (mullion) {
        g.set(x, y, z, "light_gray_concrete");
      } else {
        g.set(x, y, z, "glass_pane", paneProps(nFace));
      }
      continue;
    }

    // Cornice line at F2 is already a slab; keep the wall solid there
    if (y === F2) g.set(x, y, z, "smooth_quartz");
  }
}

// Pass 2: warm lights behind some upper-storey windows (interior air side)
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  if (!(ex.n || ex.s || ex.w || ex.e)) continue;
  if (gr >= F1) continue;
  const nFace = ex.n || ex.s;
  const t = nFace ? x : z;
  if (t % 3 !== 1) continue;
  if ((x * 5 + z * 3) % 4 !== 0) continue;

  let ix = x, iz = z;
  if (ex.n) iz = z + 1;
  else if (ex.s) iz = z - 1;
  else if (ex.w) ix = x + 1;
  else if (ex.e) ix = x - 1;

  if (!has(ix, iz) || Object.values(exposed(ix, iz)).some(Boolean)) continue;
  g.set(ix, 7, iz, (x + z) % 2 ? "shroomlight" : "glowstone");
}

// Pass 3: rooftop plant enclosure (screened, on the F2 slab)
for (const [x, z] of cells) {
  if (x < 9 || x > 18 || z < 7 || z > 14) continue;
  const ex = exposed(x, z);
  if (ex.n || ex.s || ex.w || ex.e) continue;
  g.set(x, ROOF, z, "light_gray_concrete");
  if (x >= 10 && x <= 17 && z >= 8 && z <= 13) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
  }
  if (x >= 11 && x <= 16 && z >= 9 && z <= 12 && (x + z) % 3 === 0) {
    g.set(x, ROOF + 2, z, "chain");
  }
}

g.save(`${DIR}/${ID}.nbt`);
