# roof-diff — barn (generated)

Band floor 13; regions {"ridge":48,"slopes":256,"eaves":4,"ends":12}

| view | IoU | mismatch px | top region (px) |
|---|---|---|---|
| +x+z (45°) | 0.88 | 936 (extra 241 / missing 695) | wall 574 |
| +x-z (135°) | 0.914 | 666 (extra 241 / missing 425) | wall 447 |
| -x-z (225°) | 0.903 | 760 (extra 317 / missing 443) | wall 556 |
| -x+z (315°) | 0.903 | 762 (extra 328 / missing 434) | wall 487 |

Cross-azimuth: 3124 px, roof share 33.931%, worst view +x+z.

- **gable-roof-1-roof-8** ridge Δ(eave-rel) rmse 0.111 max -0.111; rakes: lo@-24 (unfitted) rmse 0.693, hi@23 (unfitted) rmse null

Reproducible: byte-identical ×2 (sha256 dbaa7aed6449…).
