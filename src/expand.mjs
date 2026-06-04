// Placement-primitive expansion (T-001-02).
//
// Expands a design artifact's placements (voxel / line / box / fill) into a
// normalized, deduplicated set of explicit voxels. Pure integer geometry — no
// I/O, no dependencies. Downstream consumers (voxel-world construction T-003-02,
// the schematic exporter, the E-04 validators) read explicit voxels, not
// primitives.
//
// Contract: the input artifact is assumed to be SCHEMA-VALID (T-001-01 /
// T-001-03 validate upstream). Expansion adds exactly one guard the JSON Schema
// cannot express — the `line` straight-lattice rule — and throws a located
// Error when it is violated. See src/README.md for the full semantics.

/** @typedef {[number, number, number]} Coordinate integer voxel-lattice cell */
/** @typedef {{ pos: Coordinate, block: string, state?: Record<string, string> }} Voxel */
/**
 * @typedef {Object} Placement A schema-valid placement; exactly one op shape.
 * @property {"voxel"|"line"|"box"|"fill"} op
 * @property {Coordinate} [pos]   present for op "voxel"
 * @property {Coordinate} [from]  present for op "line"|"box"|"fill"
 * @property {Coordinate} [to]    present for op "line"|"box"|"fill"
 * @property {string} block
 * @property {Record<string, string>} [state]
 */

/**
 * Canonical identity/dedup key for a coordinate.
 * @param {Coordinate} pos
 * @returns {string} `"x,y,z"`
 */
export function voxelKey(pos) {
  return `${pos[0]},${pos[1]},${pos[2]}`;
}

/**
 * Per-axis min/max corners of from..to. The schema does not require from <= to,
 * so box/fill (and line direction handling) normalize the corners first.
 * @param {Coordinate} from
 * @param {Coordinate} to
 * @returns {{ lo: Coordinate, hi: Coordinate }}
 */
function bounds(from, to) {
  return {
    lo: [Math.min(from[0], to[0]), Math.min(from[1], to[1]), Math.min(from[2], to[2])],
    hi: [Math.max(from[0], to[0]), Math.max(from[1], to[1]), Math.max(from[2], to[2])],
  };
}

/**
 * Iterate the inclusive bounding box [lo..hi] in canonical order: ascending y,
 * then z, then x. One ordering primitive shared by box and fill so the emission
 * order is defined in exactly one place.
 * @param {Coordinate} lo
 * @param {Coordinate} hi
 * @param {(x: number, y: number, z: number) => void} fn
 */
function eachCell(lo, hi, fn) {
  for (let y = lo[1]; y <= hi[1]; y++) {
    for (let z = lo[2]; z <= hi[2]; z++) {
      for (let x = lo[0]; x <= hi[0]; x++) {
        fn(x, y, z);
      }
    }
  }
}

/**
 * Build a Voxel, attaching state only when the placement carries it (so a
 * stateless voxel has no `state` key rather than `undefined`).
 * @param {Coordinate} pos
 * @param {Placement} placement
 * @returns {Voxel}
 */
function voxelAt(pos, placement) {
  return placement.state === undefined
    ? { pos, block: placement.block }
    : { pos, block: placement.block, state: placement.state };
}

/**
 * Expand a single placement into its explicit voxels, in canonical order.
 * Within one placement the coordinates are unique by construction, so no dedup
 * is needed here. Throws on a non-straight-lattice `line` or an unknown op.
 * @param {Placement} placement
 * @returns {Voxel[]}
 */
export function expandPlacement(placement) {
  switch (placement.op) {
    case "voxel":
      return [voxelAt([placement.pos[0], placement.pos[1], placement.pos[2]], placement)];

    case "fill": {
      const { lo, hi } = bounds(placement.from, placement.to);
      /** @type {Voxel[]} */
      const out = [];
      eachCell(lo, hi, (x, y, z) => out.push(voxelAt([x, y, z], placement)));
      return out;
    }

    case "box": {
      const { lo, hi } = bounds(placement.from, placement.to);
      /** @type {Voxel[]} */
      const out = [];
      eachCell(lo, hi, (x, y, z) => {
        const onShell =
          x === lo[0] || x === hi[0] ||
          y === lo[1] || y === hi[1] ||
          z === lo[2] || z === hi[2];
        if (onShell) out.push(voxelAt([x, y, z], placement));
      });
      return out;
    }

    case "line":
      return expandLine(placement);

    default:
      throw new Error(`unknown placement op "${placement.op}"`);
  }
}

/**
 * Expand a `line` placement. A "straight lattice line" steps by a constant unit
 * vector: letting d = to - from and n = max(|dx|,|dy|,|dz|), every nonzero axis
 * delta must equal ±n (axis-aligned, or a uniform 2-D/3-D diagonal). Lines whose
 * axis deltas are unequal and nonzero (e.g. dx=4, dz=2) have no unambiguous
 * lattice voxelization and are rejected — honest failure over arbitrary
 * rasterization in a measurement instrument.
 * @param {Placement} placement
 * @returns {Voxel[]}
 */
function expandLine(placement) {
  const { from, to } = placement;
  const d = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  const abs = d.map(Math.abs);
  const n = Math.max(abs[0], abs[1], abs[2]);

  for (let axis = 0; axis < 3; axis++) {
    if (abs[axis] !== 0 && abs[axis] !== n) {
      throw new Error(
        `op "line" from [${from}] to [${to}] is not a straight lattice line: ` +
          `axis deltas must each be 0 or ±${n} (got dx=${d[0]}, dy=${d[1]}, dz=${d[2]})`
      );
    }
  }

  const step = [Math.sign(d[0]), Math.sign(d[1]), Math.sign(d[2])];
  /** @type {Voxel[]} */
  const out = [];
  for (let i = 0; i <= n; i++) {
    out.push(voxelAt([from[0] + step[0] * i, from[1] + step[1] * i, from[2] + step[2] * i], placement));
  }
  return out;
}

/**
 * Expand a whole artifact into a normalized voxel set.
 *
 * Placements are applied in ARRAY ORDER (the artifact's defined application
 * order). When two placements write the same coordinate, the later one wins —
 * its block AND state replace the earlier voxel whole (no state merge). The
 * result is emitted in a CANONICAL order (ascending y, then z, then x) so the
 * output is a deterministic function of the artifact and independent of internal
 * iteration order: the same artifact always expands to byte-identical output,
 * and reordering non-overlapping placements yields the same set.
 *
 * @param {{ placements: Placement[] }} artifact a schema-valid design artifact
 * @returns {Voxel[]} deduplicated voxels in canonical (y, z, x) order
 */
export function expandArtifact(artifact) {
  /** @type {Map<string, Voxel>} */
  const map = new Map();
  for (const placement of artifact.placements) {
    for (const voxel of expandPlacement(placement)) {
      map.set(voxelKey(voxel.pos), voxel); // last write wins, full replace
    }
  }
  return [...map.values()].sort((a, b) => {
    return (
      a.pos[1] - b.pos[1] || // y (ground up)
      a.pos[2] - b.pos[2] || // z
      a.pos[0] - b.pos[0]    // x
    );
  });
}
