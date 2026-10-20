import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075578";
const OUT = `${DIR}/${ID}.nbt`;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 7 x 17, roof about 13 blocks above lowest ground.
// Read as a 1960s to 1980s Taipei mid-rise commercial/residential block:
// three storeys of about 4 blocks each, white tiled concrete frame with
// light grey bands at each floor slab, glazed ribbon windows with mullions,
// a shopfront with a central entrance on the street face, flat roof with
// parapet, water tank and stair penthouse.
const W = 7, H = 25, D = 17;
const ROOF = 13;            // roof slab layer (top of body)
const SLAB_LEVELS = [4, 8]; // floor slabs between storeys (absolute)

const MAT = {
  wall: "white_concrete",
  band: "light_gray_concrete",
  found: "stone_bricks",
  glass: "glass_pane",
  mullion: "white_concrete",
  lintel: "dark_oak_planks",
  light: "glowstone",
  tank: "smooth_stone",
  penthouse: "light_gray_concrete",
  door: "dark_oak_door",
};

const g = new Voxels([W, H, D]);

const cellMap = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  cellMap.set(`${x},${z}`, Math.round(gr));
}
const inside = (x, z) => cellMap.has(`${x},${z}`);

// Missing-neighbour test: which sides of this cell face outside the footprint.
function openSides(x, z) {
  return {
    N: !inside(x, z - 1), // street face (negative z)
    S: !inside(x, z + 1),
    W: !inside(x - 1, z),
    E: !inside(x + 1, z),
  };
}

function setBlock(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pass 1: foundations, floors, walls, windows, roof.
for (const [x, z, rawGround] of cells) {
  const gr = Math.max(0, Math.min(H - 6, Math.round(rawGround)));
  const sides = openSides(x, z);
  const missing = Object.values(sides).filter(Boolean).length;
  const perim = missing > 0;
  const corner = missing >= 2;

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) setBlock(x, y, z, MAT.found);

  // Floor levels that sit on this cell: its ground, the storey slabs, the roof.
  const slabs = new Set(
    [gr, ...SLAB_LEVELS, ROOF].filter((v) => v >= gr && v <= ROOF)
  );

  for (let y = gr; y <= ROOF; y++) {
    if (slabs.has(y)) {
      // Floor slabs run through the whole footprint; the roof is a light band.
      const id = y === ROOF && perim ? MAT.band : (perim ? MAT.band : MAT.wall);
      setBlock(x, y, z, id);
      continue;
    }
    if (!perim) continue; // interior air (no interiors)

    const rel = y - gr;

    // Corner pilasters run full height.
    if (corner) {
      setBlock(x, y, z, MAT.band);
      continue;
    }

    // Street (north) face: shopfront at rel 1..2, lintel at rel 3.
    if (sides.N && rel >= 1 && rel <= 2) {
      if (x === 3) {
        // Central entrance door (lower rel 1, upper rel 2).
        const half = rel === 1 ? "lower" : "upper";
        setBlock(x, y, z, MAT.door, {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
      } else {
        setBlock(x, y, z, MAT.glass);
      }
      continue;
    }
    if (sides.N && rel === 3) {
      if (x >= 2 && x <= 4) setBlock(x, y, z, MAT.lintel); // entrance accent
      else setBlock(x, y, z, MAT.band);
      continue;
    }

    // Ribbon windows along every other wall row, mullions between bays.
    const along = (sides.N || sides.S) ? x : z;
    if (along % 2 === 0) {
      setBlock(x, y, z, MAT.mullion);
    } else {
      setBlock(x, y, z, MAT.glass);
      // Warm light behind some glass, in the interior air cell.
      if ((along + y) % 4 === 0 && rel > 3) {
        let ix = x, iz = z;
        if (sides.N) iz = z + 1;
        else if (sides.S) iz = z - 1;
        else if (sides.W) ix = x + 1;
        else if (sides.E) ix = x - 1;
        if (inside(ix, iz)) setBlock(ix, y, iz, MAT.light);
      }
    }
  }

  // Parapet on the roof perimeter.
  if (perim) setBlock(x, ROOF + 1, z, MAT.band);
}

// Pass 2: roof equipment on the flat roof (stands on the ROOF slab layer).
const tankCells = [[1, 4], [2, 4], [1, 5], [2, 5]];
const penthouse = [];
for (let x = 4; x <= 5; x++) for (let z = 12; z <= 14; z++) penthouse.push([x, z]);

const roofTop = ROOF + 1;
const roofBase = cellMap.size ? Math.max(...[...cellMap.values()]) : 0;
for (const [x, z] of tankCells) {
  if (!inside(x, z)) continue;
  for (let y = roofTop; y <= roofTop + 2; y++) setBlock(x, y, z, MAT.tank);
}
for (const [x, z] of penthouse) {
  if (!inside(x, z)) continue;
  for (let y = roofTop; y <= roofTop + 2; y++) {
    const edge = x === 4 || x === 5 || z === 12 || z === 14;
    if (!edge) continue;
    setBlock(x, y, z, MAT.penthouse);
  }
}

g.save(OUT);
