import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86627.cells.json`, "utf8"));

const W = 13, H = 29, D = 8;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const inFp = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inFp.has(key(x, z));
const isPer = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

// Smooth the lidar roof into one tier: median roof height, lower wings only where clearly lower
const roofs = cells.map(([, , , r]) => Math.round(r)).sort((a, b) => a - b);
const R = Math.min(H - 6, roofs[Math.floor(roofs.length / 2)]);

// Street face (-z) and door at its middle
const frontXs = cells.filter(([x, z]) => !has(x, z - 1)).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;

const paneNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, gyRaw, roofRaw] of cells) {
  const gy = Math.max(0, Math.min(H - 10, Math.round(gyRaw)));
  const rr = Math.round(roofRaw);
  // Flat tier at R; a lower wing only where lidar is clearly lower
  let top = rr < R - 3 ? Math.max(gy + 8, rr) : R;
  top = Math.max(gy + 8, Math.min(H - 4, top));

  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  const fN = !has(x, z - 1), fS = !has(x, z + 1), fW = !has(x - 1, z), fE = !has(x + 1, z);
  const per = fN || fS || fW || fE;
  const corner = (fN || fS) && (fW || fE);
  const frontBack = fN || fS;
  const idx = frontBack ? x : z;

  let dx = 0, dz = 0;
  if (fN) dz = 1; else if (fS) dz = -1; else if (fW) dx = 1; else if (fE) dx = -1;

  for (let y = gy; y < top; y++) {
    const rel = y - gy;
    const ry = rel % 4;
    const ground = rel < 4;

    if (y === top - 1) {
      g.set(x, y, z, per ? "white_concrete" : "smooth_stone");
      continue;
    }

    if (!per) {
      if (ry === 0 && rel > 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (ry === 3) { g.set(x, y, z, "white_concrete"); continue; }
    if (ry === 0) { g.set(x, y, z, ground ? "stone_bricks" : "bricks"); continue; }
    if (corner) { g.set(x, y, z, "bricks"); continue; }

    // Entrance: door on the street face, framed by stone pilasters on either side
    if (ground && fN && x === doorX) {
      const half = ry === 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (ground && fN && (x === doorX - 1 || x === doorX + 1)) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    const glazed = ground || idx % 2 === 1;
    if (glazed) {
      g.set(x, y, z, "glass_pane", frontBack ? paneEW : paneNS);
      if (!ground && ry === 2 && (x + z) % 4 === 1) {
        const nx = x + dx, nz = z + dz;
        if (has(nx, nz) && !isPer(nx, nz)) g.set(nx, y, nz, "glowstone");
      }
    } else {
      g.set(x, y, z, "bricks");
    }
  }
}

// Setback penthouse on the flat roof, centred, standing on the R tier
const pX0 = 3, pX1 = 9, pZ0 = 2, pZ1 = 5, pH = 3;
for (let x = pX0; x <= pX1; x++) {
  for (let z = pZ0; z <= pZ1; z++) {
    if (!has(x, z) || R + pH > H - 1) continue;
    const edge = x === pX0 || x === pX1 || z === pZ0 || z === pZ1;
    for (let k = 0; k < pH; k++) {
      const y = R + k;
      if (k === pH - 1) { g.set(x, y, z, "white_concrete"); continue; }
      if (!edge) continue;
      if (k === 1 && (x + z) % 2 === 0) {
        g.set(x, y, z, "glass_pane", (x === pX0 || x === pX1) ? paneNS : paneEW);
      } else {
        g.set(x, y, z, "bricks");
      }
    }
  }
}

g.save(`${DIR}/DC86627.nbt`);
