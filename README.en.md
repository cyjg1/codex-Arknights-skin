# Codex Arknights Skin

<p align="center">
  <a href="./README.md">中文</a> · <strong>English</strong>
</p>

<p align="center">
  An Arknights-inspired Codex desktop theme that changes with the selected operator, time of day, and task context.<br>
  Six operators · Manual selection · Auto rotation · Day/night modes · Windows / macOS
</p>

## Built on Codex Dream Skin

This project is developed from [Fei-Away/Codex-Dream-Skin](https://github.com/Fei-Away/Codex-Dream-Skin). It retains the upstream project's reversible local CDP injection, safe launch, verification, and restore mechanisms, then adds a new multi-operator Arknights visual system, operator controls, automatic rotation, and distinct day/night presentation.

Thank you to the original author and contributors. The upstream project is MIT-licensed, and this repository preserves its license and attribution. This unofficial Arknights theme is maintained independently and is not the responsibility of the upstream authors.

## Included operators

- Amiya — Rhodes Island Leader · Caster
- Kal'tsit — Rhodes Island Medic · Command
- Ch'en — Lungmen Guard · Swordmaster
- Texas — Penguin Logistics · Vanguard
- Exusiai — Penguin Logistics · Marksman
- W — Sarkaz Mercenary · Artillery

## Controls

- Use the compact `OPERATOR` button in the upper-right corner to open the selector. It stays collapsed by default and never occupies the composer area.
- Select an operator to switch the artwork, accent palette, code, role, and copy. Manual selection pauses rotation.
- `ROTATE ON / OFF` controls the 12-second automatic carousel.
- `AUTO / DAY / NIGHT MODE` uses the light shell from 07:00 to 18:00 local time and the dark shell outside that window, or forces either shell manually.
- Preferences are stored locally and restored on the next themed launch.
- Reduced-motion preferences disable scan and entrance animations.

Day mode uses a cool paper-white shell with dark, light-haloed text. Night mode uses a black-blue tactical terminal with light, dark-haloed text. Conversation cards are removed so the operator artwork passes directly behind the copy; only the interactive composer keeps a solid surface. On wide task windows, the conversation and composer align left together to reserve space for the operator; below 1120px they return to the native centered full-width layout.

## Install

### Windows

Requires Node.js 22 or newer and the official Microsoft Store Codex desktop app.

```powershell
cd windows
powershell -ExecutionPolicy Bypass -File scripts\install-dream-skin.ps1
powershell -ExecutionPolicy Bypass -File scripts\start-dream-skin.ps1
```

Verify with `scripts\verify-dream-skin.ps1`. Restore with `scripts\restore-dream-skin.ps1 -Uninstall`.

### macOS

Open [`macos/`](./macos/) and run `Install Codex Dream Skin.command`, then `Start Codex Dream Skin.command`. Use `Restore Codex Dream Skin.command` to return to the official appearance.

The macOS flow validates and reuses the signed Node.js runtime bundled with Codex. It does not modify the official app bundle, `app.asar`, or code signature.

## Security boundaries

- CDP is bound to loopback only (`127.0.0.1`).
- The theme does not modify Codex binaries, signatures, API keys, or base URLs.
- It does not place a fake full-window screenshot over Codex; native controls stay native and clickable.
- Local CDP has no extra same-user authentication. Do not run untrusted local software while the theme is active, and use Restore when finished.

## Attribution and disclaimer

This is an unofficial, non-commercial fan theme. It is not affiliated with or endorsed by Hypergryph, Yostar, OpenAI, or the upstream project authors.

Arknights, its character names and designs, and related trademarks belong to their respective rights holders. The six bundled backgrounds are generated fan-theme artwork created for this repository; they are not official game illustrations and do not copy a specific official composition. See [`docs/ASSET_PROVENANCE.md`](./docs/ASSET_PROVENANCE.md).

The software code is available under the MIT License in [`LICENSE`](./LICENSE). That license grants no rights to third-party characters, trademarks, artwork, or applications.
