---
description: "LePal brand occupants for the sidebar and home hero, plus the LePal language pack."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-lepal-brand

Mounts the LePal brand in the Web client.

The `@deepseek-ai/dsh-web-app` bundle mounts this package by default, so both the Web profile and the Desktop application show it without a Plugins switch. A production build's official occupants keep their priority 0 registrations; this package shadows them at priority -1.

Product copy, including the sidebar local-build label and the home-hero headline, lives in the built-in locale dictionaries. The document title comes from the client build's `DSH_CLIENT_TITLE`.
