# GLB-voxel surgical loop — the E-16 synthesis (T-052-01)

The E-15 surgical `reviseLoop` run on the **T-051-01 GLB-voxel builds** with `glbFormTarget({glbPath})`
pointed at the **same GLB each build was voxelized from**. The loop body / observe / diagnose router /
accept-gate are unchanged — only the input (a voxelized GLB) and the target (its own source) are new.
Each subject runs two regions: an **LLM block-edit** (`curve`) on the headline voxelization artifact and
a deterministic **procedural** pass (`relief`) on a body surface.

**Headline:** Surgical edits cleared the per-region accept-gate (cleaned the targeted artifact) on: koi:curve. But the per-region clean did NOT transfer to the whole object on: koi (whole-object IoU flat/down) — the honest synthesis finding: a single-view per-region accept-gate can keep a local edit that the whole-object silhouette does not reward.
**P14-safety:** holds for all subjects ✓ (accepted regions lock; non-improving tweaks roll back).

| subject | GLB whole before→after | regions kept/rolled | build-IoU ref | P14 | verdict |
|---------|:----------------------:|:-------------------:|:-------------:|:---:|---------|
| koi | 0.622→0.614 | 1/1 | 0.622 | ✓ | **regressed** |
| heart | 0.877→0.877 | 0/2 | 0.877 | ✓ | **held** |

- **improved** — a region cleared the per-region accept-gate AND the whole-object GLB IoU rose — the local clean transferred to the whole
- **held** — no region beat its per-region target — the cage kept the build unchanged (no regression)
- **regressed** — a region cleared the per-region accept-gate but the whole-object GLB IoU FELL — a real divergence: the local per-region clean did not transfer (and slightly hurt) the global single-view silhouette. NOT a gate bug (P14 still holds); a limit of per-region single-view IoU as a hill-climb signal
- **unknown** — missing a before or after score

## koi — `glb/koi.glb`
- GLB whole-object IoU: **0.622 → 0.614**  verdict: **regressed**  (T-051-01 build-vs-own-GLB baseline: 0.622)
- regions kept/rolled-back: **1/1**  P14: **ok** (locked: 1; violations: [])

| # | region | route | defect | region IoU before→after | kept? | reason | proposed whole IoU |
|---|--------|-------|--------|:-----------------------:|:-----:|--------|:------------------:|
| 0 | `{"min":[9,0,-2],"max":[15,16,9]}` | curve→llm-edit | thick-fin / stair-stepping | 0.513→0.528 | ✓ | accepted | 0.614 |
| 1 | `{"min":[-6,3,-4],"max":[2,12,4]}` | relief→relief | flat-skin | 0.716→0.716 | ✗ | rolled-back | — |

- renders: `glb-voxel-surgical/koi/{before,after,proposed-*,crop-*}.png`
- LLM proposals: `[{"region":"9,0,-2|15,16,9","proposed":3,"applied":3,"rejected":[],"stashed":true}]`

```json
[
  {
    "iteration": 1,
    "region": {
      "bbox": {
        "min": [
          9,
          0,
          -2
        ],
        "max": [
          15,
          16,
          9
        ]
      }
    },
    "subBounds": {
      "min": [
        9,
        0,
        -2
      ],
      "max": [
        15,
        16,
        9
      ]
    },
    "defect": "thick-fin / stair-stepping",
    "where": "the caudal fin (a thin sheet voxelization thickened into a chunky stack)",
    "route": "llm-edit",
    "tweak": "noop",
    "scoreBefore": 0.5128038194444444,
    "scoreAfter": 0.528370354079613,
    "accepted": true,
    "reason": "accepted"
  },
  {
    "iteration": 2,
    "region": {
      "bbox": {
        "min": [
          -6,
          3,
          -4
        ],
        "max": [
          2,
          12,
          4
        ]
      }
    },
    "subBounds": {
      "min": [
        -6,
        3,
        -4
      ],
      "max": [
        2,
        12,
        4
      ]
    },
    "defect": "flat-skin",
    "where": "the dense mid-body flank",
    "route": "relief",
    "tweak": "relief+1",
    "scoreBefore": 0.7163290446208596,
    "scoreAfter": 0.7163290446208596,
    "accepted": false,
    "reason": "rolled-back"
  }
]
```

## heart — `glb/heart.glb`
- GLB whole-object IoU: **0.877 → 0.877**  verdict: **held**  (T-051-01 build-vs-own-GLB baseline: 0.877)
- regions kept/rolled-back: **0/2**  P14: **ok** (locked: 0; violations: [])

| # | region | route | defect | region IoU before→after | kept? | reason | proposed whole IoU |
|---|--------|-------|--------|:-----------------------:|:-----:|--------|:------------------:|
| 0 | `{"min":[-8,18,-10],"max":[8,26,10]}` | curve→llm-edit | almost-closed-arch | 0.566→0.566 | ✗ | rolled-back | 0.877 |
| 1 | `{"min":[-8,4,-8],"max":[8,14,8]}` | relief→relief | flat-skin | 0.730→0.728 | ✗ | rolled-back | — |

- renders: `glb-voxel-surgical/heart/{before,after,proposed-*,crop-*}.png`
- LLM proposals: `[{"region":"-8,18,-10|8,26,10","proposed":8,"applied":8,"rejected":[],"stashed":true}]`

```json
[
  {
    "iteration": 1,
    "region": {
      "bbox": {
        "min": [
          -8,
          18,
          -10
        ],
        "max": [
          8,
          26,
          10
        ]
      }
    },
    "subBounds": {
      "min": [
        -8,
        18,
        -10
      ],
      "max": [
        8,
        26,
        10
      ]
    },
    "defect": "almost-closed-arch",
    "where": "the great vessels / aortic arch (a near-solid taper, not an open loop)",
    "route": "llm-edit",
    "tweak": "noop",
    "scoreBefore": 0.5662919170381857,
    "scoreAfter": 0.5662919170381857,
    "accepted": false,
    "reason": "rolled-back"
  },
  {
    "iteration": 2,
    "region": {
      "bbox": {
        "min": [
          -8,
          4,
          -8
        ],
        "max": [
          8,
          14,
          8
        ]
      }
    },
    "subBounds": {
      "min": [
        -8,
        4,
        -8
      ],
      "max": [
        8,
        14,
        8
      ]
    },
    "defect": "flat-skin",
    "where": "the ventricular wall",
    "route": "relief",
    "tweak": "relief+1",
    "scoreBefore": 0.7301147928030611,
    "scoreAfter": 0.7283236994219653,
    "accepted": false,
    "reason": "rolled-back"
  }
]
```
