# Production Package

RC2 standardizes the SVG+WAAPI output as one self-contained integration candidate.

## Directory

```text
production-package/
├── source.svg
├── motion-icon.svg
├── controller.js
├── contract.json
├── platform-profile.json
├── manifest.json
├── preflight-report.json
├── normalize-report.json
├── compile-report.json
├── fixture.html
├── verify-report.json
├── verify-report.html
├── screenshots/
└── README.md
```

## File roles

`source.svg`
: Original semantic-annotated build input preserved for traceability.

`motion-icon.svg`
: Normalized production SVG with deterministic ID prefixing and `[data-motion-icon]` root metadata.

`controller.js`
: Product-state-driven SVG/WAAPI runtime controller.

`contract.json`
: Canonical machine-readable product/motion contract.

`platform-profile.json`
: Capability envelope used for compilation.

`manifest.json`
: Package identity, runtime, integrity hashes, file map, and verification status.

`preflight-report.json`
: Source asset safety/buildability result.

`normalize-report.json`
: Normalization trace including ID rewrites and hashes.

`compile-report.json`
: Contract/asset mapping and compiler result.

`fixture.html`
: Executable deterministic verification fixture.

`verify-report.json` / `verify-report.html`
: Machine- and human-readable QA evidence.

`screenshots/`
: Actual-size and intermediate-frame captures.

## Release rule

Do not ship from a package with `verification.status` equal to `NOT_RUN` or `FAIL`.

A PASS means the package passed the configured automated gates. It does not replace target-device qualification when the final embedded/browser runtime differs from the qualified profile.

## Integrity

The manifest records SHA-256 hashes for core generated files. Regenerate and reverify after any manual change. Do not edit generated production files without invalidating the previous verification result.
