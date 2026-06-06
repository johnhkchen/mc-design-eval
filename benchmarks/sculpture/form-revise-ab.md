# Form-revise A/B — the LLM form-edit route (T-046-01)

The deterministic revision loop with the **LLM block-editor** behind the accept-gate, over a curated
form region of each subject. `region IoU` is the loop's per-region accept signal (the R-framed render
vs the concept); `whole IoU` is the full-build 3/4 render vs the concept (comparable to
`form-baseline.json`). An edit is **kept** only if the region IoU strictly improved, else rolled back.

| subject | route | region IoU before | region IoU after | whole IoU before | whole IoU after | kept? |
|---------|-------|------------------:|-----------------:|-----------------:|----------------:|:-----:|
| koi | llm-edit | 0.455 | 0.455 | 0.481 | 0.481 | ✗ |
| heart | llm-edit | 0.384 | 0.379 | 0.347 | 0.347 | ✗ |

## koi — 009-vConcept-a-koi-fish
- region: `{"min":[-9,1,-5],"max":[2,6,5]}`  defect: **ringing** in the swimming body (the S-curve that flattens to a straight body)
- route: `llm-edit`  kept: **false** (rolled-back)  proposed edits stashed: 1
- proposed-edit whole IoU: 0.481 (the LLM edit applied, shown even if rolled back)
- renders: `form-revise-ab/koi/{before,proposed,after}.png` + `crop.png` (the region the model saw)
- proposals: `[{"region":"-9,1,-5|2,6,5","proposed":4,"applied":4,"rejected":[],"stashed":true}]`

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
    "scoreBefore": 0.455,
    "scoreAfter": 0.455,
    "accepted": false,
    "reason": "rolled-back"
  }
]
```

## heart — 006-vConcept-an-anatomically-correct-human-heart
- region: `{"min":[-8,20,-6],"max":[8,31,6]}`  defect: **ringing** in the aortic arch (which never builds as a closed loop)
- route: `llm-edit`  kept: **false** (rolled-back)  proposed edits stashed: 1
- proposed-edit whole IoU: 0.345 (the LLM edit applied, shown even if rolled back)
- renders: `form-revise-ab/heart/{before,proposed,after}.png` + `crop.png` (the region the model saw)
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
    "scoreBefore": 0.384,
    "scoreAfter": 0.379,
    "accepted": false,
    "reason": "rolled-back"
  }
]
```
