# Syamantaka Maṇi — locale review package

English canonical, Hindi and Tamil short/full tellings have been reviewed for content and are presented together in this PR.

The Hindi and Tamil files remain outside `content/locales/` until native read-aloud timing is measured and the repository's human language/source review gates are recorded. This avoids inventing `measuredSeconds` merely to satisfy publication parity.

After those timings are recorded, promote `hi-IN.json` and `ta-IN.json` into the runtime locale directories, lock them, add them to the public locale shelf, and publish the canonical story in the same release.
