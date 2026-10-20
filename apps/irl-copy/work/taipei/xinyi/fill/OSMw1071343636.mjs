import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343636";

const W = 14, H = 23, D = 18;
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);

// footprint: key "x,z" -> ground (lowest-ground y=0 reference applied via base)
const ground = new Map();
for (const c of list) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  ground.set(`${x},${z}`, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Lowest ground under the footprint; roof sits about 11 blocks above it.
const base = Math.min(...ground.values());
const ROOF_REL = 10;      // parapet/coping row, relative to base
const TOP_REL = 11;       // top surface of the parapet

// Materials: 1960s-80s Taipei mid-rise concrete with a red awning and a dark ground-floor shopfront.
const WALL = "light_gray_concrete";
const BAND = "white_concrete";
const PIER = "white_concrete";
const FOUND = "stone_bricks";
const BASE_COURSE = "stone_bricks";
const COPING = "smooth_stone";
const AWNING = "red_concrete";
const FLOOR = "smooth_stone";
const ROOF = "stone";
const SERVICE = "light_gray_concrete";
const GLASS = "glass_pane";
const LIGHT = "glowstone";

// Facing directions: dz negative is north.
const DIRS = [
  { name: "north", facing: "north", dx: 0, dz: -1, axis: "x" },
  { name: "south", facing: "south", dx: 0, dz: 1, axis: "x" },
  { name: "west", facing: "west", dx: -1, dz: 0, axis: "z" },
  { name: "east", facing: "east", dx: 1, dz: 0, axis: "z" },
];

const g = new Voxels([W, H, D]);

const setIf = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const glassProps = (axis) =>
  axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Find the front (south) door: the south-facing boundary cell nearest the mean x.
const southCells = [];
const allCells = [];
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  allCells.push([x, z]);
  if (!has(x, z + 1)) southCells.push(x);
}
let doorKey = null;
if (southCells.length) {
  const meanX = southCells.reduce((a, b) => a + b, 0) / southCells.length;
  const dx = southCells.reduce((best, x) => (Math.abs(x - meanX) < Math.abs(best - meanX) ? x : best));
  doorKey = `${dx},${Math.max(...allCells.filter(([x]) => x === dx).map(([, z]) => z))}`;
}

for (const [x, z] of allCells) {
  const gr = gAt(x, z);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr && y < H; y++) setIf(x, y, z, FOUND);

  const outs = DIRS.filter((d) => !has(x + d.dx, z + d.dz));
  const isBoundary = outs.length > 0;
  const isCorner = outs.length >= 2;

  if (!isBoundary) {
    // Interior: floor slab at each storey line, roof deck at the top, air between.
    setIf(x, gr, z, FLOOR);
    setIf(x, base + 5, z, FLOOR);
    setIf(x, base + ROOF_REL, z, ROOF);
    continue;
  }

  const primary = outs[0];
  const isDoorCell = `${x},${z}` === doorKey;

  for (let y = gr; y <= base + ROOF_REL && y < H; y++) {
    const r = y - base;

    if (r === 0) {
      setIf(x, y, z, BASE_COURSE);
      continue;
    }
    if (r === 5) {
      setIf(x, y, z, BAND);
      continue;
    }
    if (r === ROOF_REL) {
      setIf(x, y, z, COPING);
      continue;
    }

    // Corners are solid piers.
    if (isCorner) {
      setIf(x, y, z, PIER);
      continue;
    }

    const idx = primary.axis === "x" ? x : z;
    const isPier = idx % 3 === 0;

    // Ground storey (rel 1..4): shopfront with door and awning.
    if (r >= 1 && r <= 4) {
      if (r === 4) {
        setIf(x, y, z, isPier ? PIER : AWNING);
        continue;
      }
      if (isPier) {
        setIf(x, y, z, PIER);
        continue;
      }
      if (isDoorCell && r === 1) {
        setIf(x, y, z, "dark_oak_door", {
          facing: primary.facing, half: "lower", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (isDoorCell && r === 2) {
        setIf(x, y, z, "dark_oak_door", {
          facing: primary.facing, half: "upper", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      setIf(x, y, z, GLASS, glassProps(primary.axis));
      continue;
    }

    // Upper storey (rel 6..9): punched windows with a lit window now and then.
    if (r >= 6 && r <= 9) {
      if (r === 9 || isPier) {
        setIf(x, y, z, WALL);
        continue;
      }
      const lit = (x * 7 + z * 13 + idx) % 4 === 0;
      if (r === 7 && lit) {
        setIf(x, y, z, LIGHT);
      } else {
        setIf(x, y, z, GLASS, glassProps(primary.axis));
      }
      continue;
    }

    // Wall fill (rel 0..10 not otherwise covered).
    setIf(x, y, z, WALL);
  }
}

// Rooftop service box near the centre, on the interior roof deck.
for (const [x, z] of allCells) {
  const isBoundary = DIRS.some((d) => !has(x + d.dx, z + d.dz));
  if (isBoundary) continue;
  if (x < 5 || x > 8 || z < 6 || z > 11) continue;
  const gr = gAt(x, z);
  if (gr > base + ROOF_REL) continue;
  for (let r = 11; r <= 12; r++) setIf(x, base + r, z, SERVICE);
  setIf(x, base + 13, z, COPING);
}

g.save(`${DIR}/${ID}.nbt`);
