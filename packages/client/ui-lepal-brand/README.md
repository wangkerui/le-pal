---
description: "LePal brand occupants for the sidebar and home hero, plus the LePal language pack."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-lepal-brand

Mounts the LePal brand in the Web client and registers the LePal language pack.

The `@deepseek-ai/dsh-web-app` bundle mounts this package by default, so both the Web profile and the Desktop application show it without a Plugins switch. A production build's official occupants keep their priority 0 registrations; this package shadows them at priority -1.

The language pack id is `zh-lepal` with the built-in `zh` pack as its fallback. It replaces the shared `brand.localBuild` copy with the product name and is selected once per browser, so a later language choice in Settings is never overwritten. The document title comes from the client build's `DSH_CLIENT_TITLE`.
