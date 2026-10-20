import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538459502";
const W = 10, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint bookkeeping ----
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const gMin = Math.min(...cells.map((c) => c[2]));

// Levels (absolute y). Roof about 11 blocks above lowest ground.
const ROOF = gMin + 11;   // parapet cap level
const F1 = gMin + 5;      // second-floor line (storey ~5 blocks)

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward face of a perimeter cell: N = z-1 side, S = z+1, W = x-1, E = x+1
const isPerim = (x, z) =>
  !inFp(x, z - 1) || !inFp(x, z + 1) || !inFp(x - 1, z) || !inFp(x + 1, z);
const face = (x, z) => {
  if (!inFp(x, z - 1)) return "N";
  if (!inFp(x, z + 1)) return "S";
  if (!inFp(x - 1, z)) return "W";
  return "E";
};

// Entrance: the street-facing (N) cell nearest the middle of the frontage
const midX = (minX + maxX) / 2;
const frontCells = cells.filter(([x, z]) => isPerim(x, z) && face(x, z) === "N");
const doorCell = frontCells.reduce((a, b) =>
  Math.abs(b[0] - midX) < Math.abs(a[0] - midX) ? b : a);
const door = { x: doorCell[0], z: doorCell[1] };

// Warm light placement in some upper windows
const lit = (x, y, z, i) => ((i * 5 + y * 7 + x * 3 + z * 11) % 9 === 0);

// ---- 1. foundations and envelope ----
for (const [x, z, gr] of cells) {
  // solid fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!isPerim(x, z)) {
    // interior: floor slab at ground, storey slab, roof membrane. Air otherwise.
    put(x, gr, z, "smooth_stone");
    if (F1 > gr && F1 < ROOF) put(x, F1, z, "smooth_stone");
    put(x, ROOF, z, "stone");
    continue;
  }

  const fc = face(x, z);
  const alongX = fc === "N" || fc === "S";
  const i = alongX ? x : z;           // index along the facade
  const rel = i - (alongX ? minX : minZ);
  const paneProps = alongX
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let y = gr; y <= ROOF; y++) {
    let id = "white_concrete";
    let props;

    if (y === gr) {
      id = "stone_bricks";                       // base course / plinth
    } else if (y === ROOF) {
      id = "smooth_quartz_slab";                 // parapet cap
      props = { type: "top", waterlogged: "false" };
    } else if (y === ROOF - 1) {
      id = "smooth_quartz";                      // top spandrel
    } else if (F1 > gr && y === F1) {
      id = "smooth_quartz";                      // storey line
    } else if (F1 > gr && y === F1 - 1) {
      id = fc === "N" ? "orange_concrete" : "smooth_quartz"; // ground fascia / sign band
    } else if (y < F1 && y > gr) {
      // ground storey
      if (fc === "N") {
        const isDoor = x === door.x && z === door.z;
        if (isDoor && (y === gr + 1 || y === gr + 2)) {
          id = "oak_door";
          props = {
            facing: "south",
            half: y === gr + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          };
        } else if (y === gr + 3 && Math.abs(x - door.x) <= 1) {
          id = "black_concrete";                 // entrance canopy
        } else if (rel % 3 === 0) {
          id = "gray_concrete";                  // shopfront piers
        } else {
          id = "light_blue_stained_glass";       // shop glazing
        }
      } else {
        if (rel % 3 === 0) {
          id = "gray_concrete";
        } else {
          id = "light_blue_stained_glass_pane";
          props = paneProps;
        }
      }
    } else {
      // upper storey window band
      if (rel % 3 === 0) {
        id = "gray_concrete";
      } else if (lit(x, y, z, i)) {
        id = "glowstone";
      } else {
        id = "light_blue_stained_glass_pane";
        props = paneProps;
      }
    }

    put(x, y, z, id, props);
  }
}

// ---- 2. rooftop penthouse and mechanical units (sit on the roof membrane) ----
for (let x = 2; x <= 7; x++) {
  for (let z = 6; z <= 14; z++) {
    if (!inFp(x, z) || isPerim(x, z)) continue;
    const edgeX = x === 2 || x === 7;
    const edgeZ = z === 6 || z === 14;
    const edge = edgeX || edgeZ;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      if (!edge) continue; // air inside
      let id = "white_concrete";
      let props;
      if (y === ROOF + 2 && !(edgeX && edgeZ)) {
        if (lit(x, y, z, x + z)) {
          id = "glowstone";
        } else {
          id = "light_blue_stained_glass_pane";
          props = edgeX
            ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
            : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
        }
      }
      put(x, y, z, id, props);
    }
    put(x, ROOF + 4, z, "smooth_quartz");
  }
}

// Rooftop mechanical units
for (let x = 4; x <= 5; x++) {
  for (let z = 16; z <= 18; z++) {
    if (!inFp(x, z) || isPerim(x, z)) continue;
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
