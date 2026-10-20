// Saucer and halo (P4): throat, underside cone and ribs, floors, glass rings, halo and the observation exits.
// The core shaft (x30..34, z30..34) stays open through every floor: the ladder climbs it. Writes are air-only.
import { circleCells } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { coneShell, radialRib, hoop, haloFin, glassRing, mullion, ringWall } from "../vocab.mjs";

const AXIS = [32, 32];
const inShaft = (x, z) => x >= 30 && x <= 34 && z >= 30 && z <= 34;

// plan.md: the throat flares r 4 -> 13 over y196..204; the underside cone r 14 -> 27.7 over y205..211.
const throatR = (y) => 4 + ((y - 196) * 9) / 8;
const coneR = (y) => 14 + ((y - 205) * 16) / 7;

// The annulus of ring cells at radius r (N-0.5 < d <= N+0.5 style, as the vocabulary's ring convention).
function annulus(r) {
  const inner = new Set(circleCells(r - 1, { center: AXIS }).map(([x, z]) => `${x},${z}`));
  return circleCells(r, { center: AXIS }).filter(([x, z]) => !inner.has(`${x},${z}`));
}

// Floor disc of radius r at y, minus the open core shaft; air only.
function floorDisc(g, r, y, block) {
  for (const [x, z] of circleCells(r, { center: AXIS }))
    if (!inShaft(x, z) && g.isAir(x, y, z)) g.set(x, y, z, block, {});
}

// The shaft's floor at y (x30..34, z30..34) except the ladder hole at (32, 34): the ladder lands on it, so the climb
// reaches the floor. Air only.
function shaftFloor(g, y) {
  for (let x = 30; x <= 34; x++) for (let z = 30; z <= 34; z++) {
    if (x === 32 && z === 34) continue;
    if (g.isAir(x, y, z)) g.set(x, y, z, "smooth_quartz", {});
  }
}

// Cells on a ring of radius r at azimuth theta (degrees, clockwise from north).
const azimuthCell = (r, theta) => {
  const t = (theta * Math.PI) / 180;
  return [AXIS[0] + r * Math.sin(t), AXIS[1] - r * Math.cos(t)];
};

// Hidden sea lanterns in a floor, on the ring of radius r every stepDeg: only over this part's own floor cells.
function floorLamps(g, r, y, stepDeg) {
  for (let theta = 0; theta < 360; theta += stepDeg) {
    const [fx, fz] = azimuthCell(r, theta);
    const x = Math.round(fx), z = Math.round(fz);
    if (g.blockAt(x, y, z) === "smooth_quartz") g.set(x, y, z, "sea_lantern", {});
  }
}

export function build(g) {
  // Throat: gray concrete, a solid tube from the core outward (y196..204). The first layer starts outside the shaft.
  for (let y = 196; y <= 204; y++) coneShell(g, y, throatR(y), y === 196 ? 3 : throatR(y - 1), { block: "gray_concrete" });

  // Underside cone: light gray concrete annuli (y205..211); the first layer's inner disc is the throat's top (r 13).
  for (let y = 205; y <= 211; y++)
    coneShell(g, y, coneR(y), y === 205 ? throatR(204) : coneR(y - 1), { block: "light_gray_concrete" });

  // 24 radiating ribs, smooth quartz, one block below the soffit (the helper places them at layer - 1).
  for (let theta = 0; theta < 360; theta += 15) radialRib(g, theta, { axis: AXIS, rMin: 4, rMax: 30 });

  // Restaurant floor y212: disc r<=30 (the halo's rim rests on it), with hidden lanterns at r 10 and r 18.
  // The floor stops at r 27 (the deck's edge): the halo band r 28..30 is left open underneath, so from below the fins
  // read against the sky instead of a solid rim.
  floorDisc(g, 27, 212, "smooth_quartz");
  shaftFloor(g, 212);
  floorLamps(g, 10, 212, 30);
  floorLamps(g, 18, 212, 30);

  // Lights under the saucer: a sea lantern in each rib at r 16, 22 and 28 (the glow along the radiating ribs), and in
  // the floor's open rim (r 27, the shadow band under the deck and the halo) every 15 deg.
  for (let y = 204; y <= 211; y++) for (let x = 0; x < 64; x++) for (let z = 0; z < 64; z++) {
    const r = Math.round(Math.hypot(x - AXIS[0], z - AXIS[1]));
    if ((r === 16 || r === 22 || r === 28) && g.blockAt(x, y, z) === "minecraft:smooth_quartz" && g.isAir(x, y - 1, z)) g.set(x, y, z, "sea_lantern", {});
  }
  floorLamps(g, 27, 212, 15);

  // Restaurant glass ring r24 y213..217, white mullions at each rib azimuth.
  glassRing(g, 24, 213, 217, "gray_stained_glass");
  mullion(g, 24, 213, 217, 15, 0);

  // Deck floor y218: disc r<=27 (the restaurant ceiling and the observation floor), lanterns at r 26.
  floorDisc(g, 27, 218, "smooth_quartz");
  shaftFloor(g, 218);
  floorLamps(g, 26, 218, 15);
  floorLamps(g, 23, 218, 30);

  // Observation glass ring r21 y219..222, black stained glass, with white mullions every 15°. The three exits to the
  // outdoor deck (nearest θ0, θ120, θ240) stay open at y219..221.
  const exitTargets = [azimuthCell(21, 0), azimuthCell(21, 120), azimuthCell(21, 240)];
  const isExit = (x, z) => exitTargets.some(([tx, tz]) => Math.hypot(x - tx, z - tz) <= 1.6);
  for (let y = 219; y <= 222; y++)
    for (const [x, z] of annulus(21)) {
      if (y <= 221 && isExit(x, z)) continue;
      if (g.isAir(x, y, z)) g.set(x, y, z, "black_stained_glass", {});
    }
  mullion(g, 21, 219, 222, 15, 0, { block: "white_concrete" });

  // Outdoor deck rail: glass panes on the ring r27, y219..220 (continuous).
  glassRing(g, 27, 219, 220, "glass_pane");

  // Halo: 45 white fins (every 8°) over r28..30, y212..221, a top hoop at y222, and a thin iron-bar mid rail at r30.
  // No hoop at y212: the band under the fins stays open to the sky.
  // Fins every 8 deg (45): sky reads between them from below; the top hoop and the outer iron-bar rail are kept.
  // The fins run down to y212 (no floor rim under them now); each fin's foot at r 29 is a sea lantern, a ring of lights
  // under the halo that also lights the deck edge.
  for (let theta = 0; theta < 360; theta += 8) {
    haloFin(g, theta, 212, 221);
    const [fx, fz] = azimuthCell(29, theta), x = Math.round(fx), z = Math.round(fz);
    if (g.blockAt(x, 212, z) === "minecraft:white_concrete") g.set(x, 212, z, "sea_lantern", {});
  }
  hoop(g, 222, { axis: AXIS, r0: 28, r1: 30 });
  ringWall(g, 30, 217, 217, "iron_bars", { centre: AXIS });
}
