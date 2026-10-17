// accessible approach (ADA-minded, in Minecraft units): half-block steps only (slabs), never a stair or a full block;
// flights of at most 3 half-steps (1.5 blocks) then a level landing at least 2 long; level at both ends.
export const FLIGHT = 3, LANDING = 2;
/** cells of run a rise of `dy` blocks needs */
export function rampLength(dy) { const n = Math.round(Math.abs(dy) * 2); return n === 0 ? 0 : n + LANDING * (Math.ceil(n / FLIGHT) - 1); }
/** heights along a ramp of `len` cells from y0 (street side) to y1 (pad side): flights near the street end, the rest level */
export function rampProfile(y0, y1, len) { const n = Math.round(Math.abs(y1 - y0) * 2), s = Math.sign(y1 - y0), out = []; let y = y0, steps = 0, inFlight = 0, land = 0;
  for (let i = 0; i < len; i++) { if (steps < n && land === 0) { y += 0.5 * s; steps++; inFlight++; if (inFlight === FLIGHT && steps < n) { inFlight = 0; land = LANDING; } } else if (land > 0) land--; out.push(y); }
  return out; }
