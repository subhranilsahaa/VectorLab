# calculus/ (reserved — not yet implemented)

This directory is the intended home for future calculus features, kept
separate from linear-algebra/ and algebra/ so index.html doesn't grow again.

Planned modules (per the VectorLab roadmap), one file per topic, mirroring
the pattern used in linear-algebra/ and visualization/:

- differentiation.js
- higher-derivatives.js
- leibniz.js
- limits.js
- lhopital.js
- integration.js
- series.js

Wire-up convention to follow when this phase starts: pure math (parsing,
symbolic/numeric algorithms, step generation) stays dependency-free like
js/algebra/stepmath-engine.js (window.StepMath); UI/rendering code that
touches the DOM stays in a separate *-ui.js file or alongside the relevant
visualization/ module, the same split already used for algebra.

No functionality lives here yet — this phase only reserved the location.
