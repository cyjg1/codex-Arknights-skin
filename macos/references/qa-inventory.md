# QA inventory

## Required user-visible behavior

1. Home route shows the selected Arknights operator banner, live native heading, native suggestion cards, the real project selector, and native composer.
2. Normal tasks show the selected operator behind restrained day/night gradients and live content surfaces.
3. Sidebar, navigation, messages, approvals, project selector, attachments, composer, menus, hover, focus, and keyboard input remain native and interactive.
4. Decorative layers have `pointer-events: none`; only the semantic operator/mode control rail accepts pointer input, and no screenshot or raster UI is used as an overlay.
5. Route changes, renderer reloads, and ordinary refreshes reapply the current theme while the verified injector runs.
6. Official application signature and `app.asar` remain unchanged.
7. Restore removes live DOM/CSS, restores the two saved base-theme values, closes the CDP session after restart, and supports later reinstallation.

## Automated checks

- Shell and JavaScript syntax checks.
- Payload construction with bundled demo and an isolated custom theme.
- Reject unsupported theme config, unsafe image paths, invalid colors, oversized images, non-loopback WebSocket URLs, and unrecognized renderer targets.
- Exact install/restore round trip for the two TOML settings while preserving unrelated values.
- Empty `HOME` recovery.
- Official app and internal Node signature, Team ID, architecture, and version validation.
- Port collision selection and saved-port reuse.
- PID reuse protection through PID, start time, executable, script path, and command-line matching.
- Live verification after `Page.reload` returns version `1.0.0` and `pass: true`.
- Strict home verification requires a visible banner of at least 320×160, two to four visible native cards, visible project button, composer, sidebar, non-interactive decoration, and no horizontal overflow.

## Visual checks

- Home at normal desktop size: banner crop is readable, text remains live, cards are not clipped, and composer does not overlap content.
- Select each of the six bundled operators and verify artwork, palette, code, role, tagline, and quote update together.
- Enable auto rotation and verify the operator advances; manually select an operator and verify rotation pauses.
- Cycle Auto/Day/Night and verify light and dark contrast, native controls, and stored preference.
- Narrower window: telemetry hides and the operator rail scrolls before covering essential controls.
- Task route: background remains atmospheric, messages and output panels keep high contrast, and the composer remains reachable.
- Selected image contains no fake interface controls or raster text intended to impersonate Codex.
- Inspect sidebar selection, header, banner edges, cards, project label, composer buttons, scrollbars, focus outlines, dialogs, and menus.

## Release signoff

- Run `tests/run-tests.sh` successfully.
- Install from a clean extracted copy with no global Node.js.
- Complete install → live verify → reload verify → restore → reinstall.
- Capture a real CDP screenshot and retain the verifier JSON.
- Confirm `codesign --verify --deep --strict` still succeeds for the official Codex app.
- Build ZIP and record SHA-256.
