---
description: "Show the LePal name and mark in the sidebar and the home hero of the Web and Desktop clients."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-lepal-brand

English | [中文](README.zh.md)

## Summary

Replace the upstream brand in the sidebar and on the home hero with the LePal name and mark. The Web bundle mounts this package by default, so the Web profile and the Desktop application show it without a Plugins switch. It occupies the same slots as the official brand at a lower priority, so a deploying composition can still override either surface. The package contributes no settings and no model-visible content.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount it beside the official brand rows the Web bundle already composes.

### When to choose it

Choose this package when a deployment must present the LePal product identity instead of the upstream one. Keep `ui-brand-official` installed: this package shadows its occupants rather than replacing the rows, so removing the official brand would leave the surfaces empty.

### Minimal configuration

The package has no configuration fields.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

`apply` registers three `sidebar.brand.mark`, `sidebar.brand.name`, and `conversation.hero.brand.mark` occupants at priority `-1`. Later registrations at the default priority win, which keeps a deployment's own brand override effective. The mark is one inline SVG component shared by both surfaces; the language pack lives in the built-in client dictionaries.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Web Client](../../../docs/subsystems/web-client.md) — plugin composition and brand slots.
- [Brand](../../../docs/subsystems/web-client.md) — how the official brand occupies the same slots.
- [Client UI kit](../ui-primitives/README.md) — the primitives the mark renders with.

-----

<a id="model-experience"></a>
## Model Experience

None, as this browser plugin contributes no model-visible content.

#### KV Cache effect

None; the brand renders only in client chrome.

## Known Limitations and Deferred Work

- The mark is a fixed inline SVG, so a deployment that needs a different glyph ships its own occupant.

<a id="dev-note"></a>
### Dev Note

None.
