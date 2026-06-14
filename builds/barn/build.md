# build chain — barn (build-chain/v1, T-154-01)

The ONE entry point (E-37): recognize → **generate-first seed** → workshop → final. The gate is a
separate billed step; this chain never spawns the judge. Replay: `npm run build:barn:repro`.

| stage | receipt |
| --- | --- |
| recognition | `eb94efa934d59d1d…` (committed input) |
| generate-seed | generated final `9d068374f2ccd8e7…` → seed `builds/barn/seed-artifact.json` |
| workshop | **budget-exhausted** after 6/6 rounds — final `2234f40333e890ae…` |

Final beside concept (judge-free glance, E-36): `pr/assets/frames/beside-concept-barn-build.png`.
