# roof-diff — barn (generated)

Band floor 13; regions {"ridge":48,"slopes":256,"eaves":4,"ends":12}

| view | IoU | mismatch px | top region (px) |
|---|---|---|---|
| +x+z (45°) | 0.879 | 941 (extra 241 / missing 700) | wall 574 |
| +x-z (135°) | 0.913 | 677 (extra 241 / missing 436) | wall 447 |
| -x-z (225°) | 0.902 | 767 (extra 315 / missing 452) | wall 556 |
| -x+z (315°) | 0.902 | 768 (extra 328 / missing 440) | wall 487 |

Cross-azimuth: 3153 px, roof share 34.539%, worst view +x+z.

- **gable-roof-1-roof-8** ridge Δ(eave-rel) rmse 0.111 max -0.111; rakes: lo@-24 (unfitted) rmse 1.239, hi@23 (unfitted) rmse null

Reproducible: byte-identical ×2 (sha256 80fd0d5f5700…).
