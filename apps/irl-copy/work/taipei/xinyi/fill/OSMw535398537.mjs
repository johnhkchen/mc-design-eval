import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded commercial/office block, Xinyi district: five storeys of
// white-quartz and light-grey concrete with tinted glass bays, a stone plinth,
// a shopfront ground floor with a central entrance, and a rooftop plant box.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535398537";
const W = 32, H = 38, D = 17;
const ROOF = 25;          // roof deck row; cornice sits here on the edge
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(`${x},${z}`, gr);
const has = (x, z) => groundOf.has(`${x},${z}`);
const clampGround = (v) => Math.max(0, Math.min(ROOF - 1, Math.round(v)));

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

const outwardOf = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
const isEdge = (x, z) => outwardOf(x, z).length > 0;

// Bounds of footprint for entrance placement (street side = minimum z).
const minZ = Math.min(...cells.map(([, z]) => z));

// Penthouse / plant box in the middle of the roof.
const inPent = (x, z) => x >= 11 && x <= 20 && z >= 5 && z <= 11 && has(x, z);
const pentEdge = (x, z) => DIRS.some(([dx, dz]) => !inPent(x + dx, z + dz));

// Entrance columns on the street face.
const isDoorCell = (x, z) => z === minZ && (x === 15 || x === 16) && isEdge(x, z)
  && outwardOf(x, z).some(([dx, dz]) => dx === 0 && dz === -1);

const glassFor = (x, z, k) => ((x * 3 + z * 5 + k) % 4 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");

// ---- Main shell ----
for (const [x, z, grRaw] of cells) {
  const gr = clampGround(grRaw);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const outs = outwardOf(x, z);
  const edge = outs.length > 0;

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {
      g.set(x, y, z, edge ? "smooth_quartz" : "light_gray_concrete"); // roof deck / cornice
      continue;
    }
    if (!edge) {
      // Interior: only a floor slab per storey, the rest is air.
      if (y % STOREY === 0 && y > 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Edge: the facade.
    const k = Math.floor(y / STOREY);
    const r = y % STOREY;

    if (isDoorCell(x, z) && (y === gr || y === gr + 1) && k === 0) {
      const facing = "north";
      const hinge = x === 15 ? "left" : "right";
      const half = y === gr ? "lower" : "upper";
      g.set(x, y, z, "oak_door", { facing, half, hinge, open: "false", powered: "false" });
      continue;
    }

    if (k === 0) {
      // Ground storey: stone plinth, shopfront glass, quartz lintel.
      if (r <= 1) g.set(x, y, z, "polished_andesite");
      else if (r <= 3) {
        const mullion = (x + z) % 3 === 0;
        g.set(x, y, z, mullion ? "white_concrete" : glassFor(x, z, 0));
      } else g.set(x, y, z, "smooth_quartz");
    } else {
      // Office storeys: quartz floor line, glass bays, spandrel band.
      if (r === 0) g.set(x, y, z, "smooth_quartz");
      else if (r <= 3) {
        const mullion = (x + z) % 3 === 0;
        g.set(x, y, z, mullion ? "white_concrete" : glassFor(x, z, k));
      } else g.set(x, y, z, "light_gray_concrete");
    }
  }

  // Parapet above the cornice on the edge.
  if (edge) g.set(x, ROOF + 1, z, "smooth_quartz");
}

// Warm glowstone behind some ground/office glass (interior, dusk light).
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const outs = outwardOf(x, z);
  const [dx, dz] = outs[0];
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  const gr = clampGround(groundOf.get(`${x},${z}`));
  for (let k = 1; k < 5; k++) {
    const y = k * STOREY + 2;
    if (y <= gr || y >= ROOF) continue;
    if ((x + z + k) % 3 !== 0) continue;
    if ((x + z) % 3 === 0) continue; // not behind a mullion
    g.set(ix, y, iz, "glowstone");
  }
}

// ---- Rooftop plant box ----
for (const [x, z] of cells) {
  if (!inPent(x, z)) continue;
  const edge = pentEdge(x, z);
  for (let y = ROOF + 1; y <= ROOF + 3; y++) {
    if (edge) g.set(x, y, z, y === ROOF + 2 ? "smooth_quartz" : "light_gray_concrete");
  }
  g.set(x, ROOF + 4, z, "smooth_quartz"); // cap slab
}

// Lightning rod on the plant box cap.
if (inPent(15, 8)) {
  g.set(15, ROOF + 5, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  g.set(15, ROOF + 6, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
