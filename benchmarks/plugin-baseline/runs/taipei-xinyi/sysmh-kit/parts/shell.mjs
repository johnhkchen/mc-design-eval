// P1 podium, steps, colonnade, walls, granite band, eave beam ring.
import { podium, step_ramp, cheek_wall, column, red_wall_run, eave_bracket, COLUMN_CENTRES, POLISHED_GRANITE, SMOOTH_STONE } from "../vocab.mjs";

export function build(g) {
  podium(g, 8, 8, 143, 143, { groundOver: true });
  step_ramp(g, { x0: 56, x1: 95, y0: 1, y1: 2, z0: 144, z1: 157 });
  cheek_wall(g, 52, 55, 144, 155);
  cheek_wall(g, 96, 99, 144, 155);

  const C = COLUMN_CENTRES;
  const inPortal = (cx, cz) => cz === 134 && cx >= 53 && cx <= 98; // tall columns belong to P3
  for (const a of C) for (const b of C) {
    const edge = a === 17 || a === 134 || b === 17 || b === 134;
    if (edge && !inPortal(a, b)) {
      column(g, a, b);
      g.fill([a - 1, 20, b - 1], [a + 1, 20, b + 1], SMOOTH_STONE); // capital block carrying the beam
      g.fill([a, 21, b - 1], [a, 21, b + 1], SMOOTH_STONE);
    }
  }

  const cols = C.filter((c) => c > 21 && c < 130);
  red_wall_run(g, { x0: 21, x1: 130, y0: 3, y1: 19, z0: 20, z1: 21 }, "north", { columns: cols, gaps: [[73, 78]] });
  red_wall_run(g, { x0: 21, x1: 130, y0: 3, y1: 19, z0: 130, z1: 131 }, "south", { columns: cols, gaps: [[49, 102]] });
  red_wall_run(g, { x0: 20, x1: 21, y0: 3, y1: 19, z0: 22, z1: 129 }, "west", { columns: cols, gaps: [[73, 78]] });
  red_wall_run(g, { x0: 130, x1: 131, y0: 3, y1: 19, z0: 22, z1: 129 }, "east", { columns: cols, gaps: [[73, 78]] });

  // granite band y 20..21 on the wall plane, full ring
  g.fill([21, 20, 21], [130, 21, 21], POLISHED_GRANITE);
  g.fill([21, 20, 130], [130, 21, 130], POLISHED_GRANITE);
  g.fill([21, 20, 22], [21, 21, 129], POLISHED_GRANITE);
  g.fill([130, 20, 22], [130, 21, 129], POLISHED_GRANITE);

  // eave beam ring y 22..23, 3 deep
  g.fill([16, 22, 16], [135, 23, 18], SMOOTH_STONE);
  g.fill([16, 22, 133], [135, 23, 135], SMOOTH_STONE);
  g.fill([16, 22, 19], [18, 23, 132], SMOOTH_STONE);
  g.fill([133, 22, 19], [135, 23, 132], SMOOTH_STONE);

  for (const c of C) {
    eave_bracket(g, c, 17, "north");
    eave_bracket(g, c, 134, "south");
    if (c !== 17 && c !== 134) { eave_bracket(g, 17, c, "west"); eave_bracket(g, 134, c, "east"); }
  }
}
