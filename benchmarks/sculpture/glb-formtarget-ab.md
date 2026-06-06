# GLB-form-target A/B — the 3-D target on the E-15 koi/heart loop (T-049-01, epic E-16)

The SAME surgical loop as `form-revise-ab.md`, re-run with the only change being the **form target**:
`glbFormTarget` (a real TRELLIS 3-D mesh) instead of the flat `conceptFormTarget`. The loop body,
observe, diagnose, and the accept gate are byte-identical — the seam invariant (AC #3).

**Headline:** The 3-D GLB target moved the loop on: heart.

| subject | route | GLB whole before→after | region IoU before→after | E-13 concept ref | kept? | verdict |
|---------|-------|:----------------------:|:-----------------------:|-----------------:|:-----:|---------|
| koi | llm-edit | 0.472→0.472 | 0.593→0.593 | 0.481 | ✗ | **held** |
| heart | llm-edit | 0.456→0.462 | 0.449→0.456 | 0.347 | ✓ | **improved** |

- **improved** — a surgical edit cleared the GLB accept-gate AND lifted the whole-object GLB IoU above its before-value
- **held** — no local edit beat the GLB target — the cage kept the build unchanged (no regression)
- **regressed** — whole-object GLB IoU fell below its before-value — impossible under the rollback gate (alarm)
- **unknown** — missing a before or after score

## koi — 009-vConcept-a-koi-fish
- region: `{"min":[-9,1,-5],"max":[2,6,5]}`  defect: **ringing** in the swimming body (the S-curve that flattens to a straight body)
- GLB: `glb/koi.glb`  route: `llm-edit`  kept: **false** (rolled-back)  proposed edits stashed: 1
- GLB whole-object IoU: 0.472 → 0.472  verdict: **held**  (E-13 concept-target IoU for reference: 0.481)
- GLB per-region IoU (the accept signal): 0.593 → 0.593
- proposed-edit whole IoU: 0.472 (the LLM edit applied, shown even if rolled back)
- did the 3-D target move the loop here? **no**
- renders: `glb-formtarget-ab/koi/{before,proposed,after}.png` + `crop.png`
- proposals: `[{"region":"-9,1,-5|2,6,5","proposed":10,"applied":10,"rejected":[],"stashed":true}]`

```json
[
  {
    "iteration": 1,
    "region": {
      "bbox": {
        "min": [
          -9,
          1,
          -5
        ],
        "max": [
          2,
          6,
          5
        ]
      }
    },
    "subBounds": {
      "min": [
        -9,
        1,
        -5
      ],
      "max": [
        2,
        6,
        5
      ]
    },
    "defect": "ringing",
    "where": "the swimming body (the S-curve that flattens to a straight body)",
    "route": "llm-edit",
    "tweak": "noop",
    "scoreBefore": 0.5933979358701647,
    "scoreAfter": 0.5933979358701647,
    "accepted": false,
    "reason": "rolled-back"
  }
]
```

## heart — 006-vConcept-an-anatomically-correct-human-heart
- region: `{"min":[-8,20,-6],"max":[8,31,6]}`  defect: **ringing** in the aortic arch (which never builds as a closed loop)
- GLB: `glb/heart.glb`  route: `llm-edit`  kept: **true** (accepted)  proposed edits stashed: 1
- GLB whole-object IoU: 0.456 → 0.462  verdict: **improved**  (E-13 concept-target IoU for reference: 0.347)
- GLB per-region IoU (the accept signal): 0.449 → 0.456
- proposed-edit whole IoU: 0.462 (the LLM edit applied, shown even if rolled back)
- did the 3-D target move the loop here? **yes**
- renders: `glb-formtarget-ab/heart/{before,proposed,after}.png` + `crop.png`
- proposals: `[{"region":"-8,20,-6|8,31,6","proposed":3,"applied":3,"rejected":[],"stashed":true}]`

```json
[
  {
    "iteration": 1,
    "region": {
      "bbox": {
        "min": [
          -8,
          20,
          -6
        ],
        "max": [
          8,
          31,
          6
        ]
      }
    },
    "subBounds": {
      "min": [
        -8,
        20,
        -6
      ],
      "max": [
        8,
        31,
        6
      ]
    },
    "defect": "ringing",
    "where": "the aortic arch (which never builds as a closed loop)",
    "route": "llm-edit",
    "tweak": "noop",
    "scoreBefore": 0.4487072560467056,
    "scoreAfter": 0.45560619872379216,
    "accepted": true,
    "reason": "accepted"
  }
]
```
