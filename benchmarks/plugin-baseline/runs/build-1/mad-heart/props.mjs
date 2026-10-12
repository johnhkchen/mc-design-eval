// Mad-scientist props, in screen coordinates. Every prop checks that its cells are free and returns true if placed.
import { wf } from "./kit.mjs";

const all = (K, cells) => cells.every(([u, y, z]) => K.free(u, y, z));
const box = (u0, y0, z0, u1, y1, z1) => { const c = []; for (let u = u0; u <= u1; u++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) c.push([u, y, z]); return c; };

// glowing vat: 3x3 footprint, glass sleeve around a glowing core, copper base and lid
export function vat(K, u0, y0, z0, h, { glass = "lime_stained_glass", core = "verdant_froglight", trim = "waxed_oxidized_cut_copper" } = {}) {
  const cells = box(u0, y0, z0, u0 + 2, y0 + h - 1, z0 + 2);
  if (!all(K, cells)) return false;
  for (let u = u0; u <= u0 + 2; u++) for (let z = z0; z <= z0 + 2; z++) {
    const centre = u === u0 + 1 && z === z0 + 1, corner = (u !== u0 + 1) && (z !== z0 + 1);
    K.put(u, y0, z, centre ? "copper_grate" : trim);
    K.put(u, y0 + h - 1, z, centre ? "copper_bulb" : trim, centre ? { lit: "true", powered: "false" } : undefined);
    for (let y = y0 + 1; y <= y0 + h - 2; y++) {
      if (centre) K.put(u, y, z, y % 3 === 0 ? "slime_block" : core);
      else if (corner) K.put(u, y, z, (y - y0) % 3 === 0 ? trim : glass);
      else K.put(u, y, z, glass);
    }
  }
  return true;
}

// tesla coil: base plate, copper windings, a toroid and a lightning-rod finial
export function tesla(K, cu, y0, cz, h = 9) {
  const cells = [...box(cu - 1, y0, cz - 1, cu + 1, y0, cz + 1), ...box(cu, y0 + 1, cz, cu, y0 + h - 1, cz)];
  if (!all(K, cells)) return false;
  for (let u = cu - 1; u <= cu + 1; u++) for (let z = cz - 1; z <= cz + 1; z++) K.put(u, y0, z, "polished_blackstone");
  for (const [du, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.put(cu + du, y0 + 1, cz + dz, "chiseled_polished_blackstone");
  // windings: a copper spool, bulbs lit between plates
  const wy0 = y0 + 1, wy1 = y0 + Math.floor(h * 0.55);
  for (let y = wy0; y <= wy1; y++) {
    K.put(cu, y, cz, "waxed_copper_block");
    if (y > wy0) for (const [du, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (K.free(cu + du, y, cz + dz)) K.put(cu + du, y, cz + dz, (y - wy0) % 2 ? "copper_bulb" : "waxed_oxidized_copper", (y - wy0) % 2 ? { lit: "true", powered: "false" } : undefined);
    }
  }
  // mast above the windings, toroid, finial
  for (let y = wy1 + 1; y <= y0 + h - 1; y++) K.put(cu, y, cz, y === y0 + h - 1 ? "lightning_rod" : "waxed_copper_block", y === y0 + h - 1 ? { facing: "up", powered: "false", waterlogged: "false" } : undefined);
  const ty = wy1 + 2;
  for (const [du, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) if (K.free(cu + du, ty, cz + dz)) K.put(cu + du, ty, cz + dz, "waxed_exposed_copper");
  for (const [du, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (K.free(cu + du, ty + 1, cz + dz)) K.put(cu + du, ty + 1, cz + dz, "end_rod", { facing: "up" });
  return true;
}

// glass jar with an organ in it: 3x3x4, a specimen on a shelf of its own
export function jar(K, u0, y0, z0, content = "nether_wart_block", glass = "light_blue_stained_glass") {
  const cells = box(u0, y0, z0, u0 + 2, y0 + 3, z0 + 2);
  if (!all(K, cells)) return false;
  for (let u = u0; u <= u0 + 2; u++) for (let z = z0; z <= z0 + 2; z++) {
    K.put(u, y0, z, "polished_deepslate"); K.put(u, y0 + 3, z, "polished_deepslate");
    const centre = u === u0 + 1 && z === z0 + 1;
    for (let y = y0 + 1; y <= y0 + 2; y++) K.put(u, y, z, centre ? content : glass);
  }
  K.put(u0 + 1, y0 + 3, z0 + 1, "copper_block");
  return true;
}

// the cluttered desk: a 4x2 top of dark oak with drawers, a chair, and a lot on it
export function desk(K, u0, y0, z0, along = "u") {
  // desk occupies 4 cells along `along`, 2 across; y0 is the standing level
  const cell = (i, j) => (along === "u" ? [u0 + i, z0 + j] : [u0 + j, z0 + i]);
  const cells = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const [u, z] = cell(i, j); cells.push([u, y0, z], [u, y0 + 1, z]); }
  if (!all(K, cells)) return false;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    const [u, z] = cell(i, j);
    if (i === 0 || i === 3) K.put(u, y0, z, j === 0 ? "chiseled_bookshelf" : "dark_oak_planks", j === 0 ? { facing: wf(along === "u" ? "s" : "r"), slot_0_occupied: "true", slot_1_occupied: "true", slot_2_occupied: "false", slot_3_occupied: "true", slot_4_occupied: "true", slot_5_occupied: "true" } : undefined);
    else K.put(u, y0, z, "dark_oak_trapdoor", { facing: wf(along === "u" ? "s" : "r"), half: "bottom", open: "true", powered: "false", waterlogged: "false" });
    K.put(u, y0 + 1, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
  return true;
}

// a console: a sloped bank of stairs with levers, buttons and lamps; faces `toward` ("s": operator stands south of it, etc.)
export function console_(K, u0, y0, z0, len, toward = "n") {
  const cells = box(u0, y0, z0, u0 + len - 1, y0, z0);
  if (!all(K, cells)) return false;
  for (let i = 0; i < len; i++) {
    K.stairs(u0 + i, y0, z0, "polished_blackstone_brick", toward);
    if (i % 3 === 0 && K.free(u0 + i, y0 + 1, z0)) K.put(u0 + i, y0 + 1, z0, "lever", { face: "floor", facing: "north", powered: "false" });
    else if (i % 3 === 1 && K.free(u0 + i, y0 + 1, z0)) K.put(u0 + i, y0 + 1, z0, "redstone_lamp", { lit: "true" });
    else if (K.free(u0 + i, y0 + 1, z0)) K.put(u0 + i, y0 + 1, z0, "polished_blackstone_button", { face: "floor", facing: "north", powered: "false" });
  }
  return true;
}
