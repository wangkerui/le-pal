# AGENTS.md — GitHub Actions

LePal's required checks are `CI / all checks passed`, `CI Windows / windows checks passed`, and `CI Python / python checks passed`. `ci.yml`, `ci-windows.yml`, and `ci-python.yml` run on pull requests and on direct pushes to `le-pal-dev` or `master`; `all-checks-passed`, `windows-checks-passed`, and `python-checks-passed` aggregate their blocking jobs. Repository Rulesets must require exactly these three checks and no longer require the retired `Policy`, `Issue policy`, `weighted approval`, or stale-PR checks. Keep those workflow and job names synchronized with Rulesets before renaming or removing one.

Python's real-API tests are opt-in. Set the `LEPAL_LIVE_API` repository variable to `true` and configure `DEEPSEEK_API_KEY_EXTERNAL` only when those tests should run; otherwise CI remains keyless. The nightly/manual-only real-API suite lives in `e2e.yml` and is never a required check.

The former DeepSeek governance chain is disabled: `issue-lifecycle.yml`, `issue-policy.yml`, `stale-pull-requests.yml`, `weighted-approval.yml`, `weighted-approval-review-event.yml`, `pr-check-on-head-branch.yml`, `pr-check-after-approve.yml`, and `pr-check-on-base-branch.yml` expose only `workflow_call` with no active caller. Do not restore their automatic triggers or DeepSeek App credentials without replacing the repository rules and ownership policy.

Official DSH publication is disabled in the same way: `release-publish.yml`, `release-vendor-publish.yml`, `python-release.yml`, `node-addon-system-release.yml`, `publish-ssh-helper.yml`, `desktop-publish.yml`, `desktop-rollout.yml`, `windows-package.yml`, `macos-package.yml`, `macos-intel-package.yml`, and `cua-helper-package-macos.yml` have no manual entry point. Their build and validation code remains as an upstream reference only. Do not point these workflows at LePal credentials, update feeds, or GitHub Releases.

The current LePal Windows product workflow is `lepal-windows-package.yml`: an unsigned, GitHub-hosted installer build published as an Actions artifact. WebDAV mirroring is temporarily removed until the storage endpoint is configured. It is not a signed release or auto-update pipeline. A future signed LePal pipeline must define its own certificate handling, update origin, and distribution backend rather than restoring the retired DeepSeek packaging runner.

`ci-master.yml` is manual-only because its self-hosted standbys, Wine matrix, and runner benchmarks are expensive upstream operations. `sandbox.yml` remains path-relevant security coverage but should be run selectively when sandbox code changes. `build-preview-cloudflare.yml` and `docs-pages.yml` still use DSH-specific Cloudflare and documentation identities; rewrite those before enabling publication.

The retired [Windows packaging workflow](workflows/windows-package.yml) is retained only as a disabled upstream reference. Use `lepal-windows-package.yml` for the current product path.
