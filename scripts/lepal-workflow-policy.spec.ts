import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')

interface Workflow {
  on: Record<string, unknown>
  jobs: Record<string, {
    if?: string
    'runs-on'?: string | string[]
    steps?: Array<Record<string, unknown>>
  }>
}

function workflow(file: string): Workflow {
  const parsed: unknown = yaml.load(readFileSync(resolve(root, '.github/workflows', file), 'utf8'))
  if (parsed === null || typeof parsed !== 'object') throw new TypeError(`${file} must define a workflow`)
  return parsed as Workflow
}

describe('LePal workflow policy', () => {
  it('runs the core Linux, Windows, and Python gates on pull requests and default-branch pushes', () => {
    for (const file of ['ci.yml', 'ci-windows.yml', 'ci-python.yml']) {
      const events = workflow(file).on
      expect(Object.keys(events)).toEqual(['pull_request', 'push'])
      expect(events.push).toEqual({ branches: ['le-pal-dev', 'master'] })
    }
  })

  it('keeps the real-API end-to-end suite manual-only', () => {
    expect(Object.keys(workflow('e2e.yml').on)).toEqual(['workflow_dispatch'])
  })

  it('keeps the heavy upstream post-merge CI manual-only', () => {
    expect(Object.keys(workflow('ci-master.yml').on)).toEqual(['workflow_dispatch'])
  })

  it.each([
    'issue-lifecycle.yml',
    'issue-policy.yml',
    'stale-pull-requests.yml',
    'weighted-approval.yml',
    'weighted-approval-review-event.yml',
    'pr-check-on-head-branch.yml',
    'pr-check-after-approve.yml',
    'pr-check-on-base-branch.yml',
  ])('keeps the upstream governance workflow %s disabled', (file) => {
    expect(Object.keys(workflow(file).on)).toEqual(['workflow_call'])
  })

  it.each([
    'release-publish.yml',
    'release-vendor-publish.yml',
    'python-release.yml',
    'node-addon-system-release.yml',
    'publish-ssh-helper.yml',
    'desktop-publish.yml',
    'desktop-rollout.yml',
    'windows-package.yml',
    'macos-package.yml',
    'macos-intel-package.yml',
    'cua-helper-package-macos.yml',
  ])('keeps the official publication workflow %s disabled', (file) => {
    expect(Object.keys(workflow(file).on)).toEqual(['workflow_call'])
  })

  it('packages the current LePal commit on a public Windows runner without DeepSeek defaults', () => {
    const lepal = workflow('lepal-windows-package.yml')
    const dispatch = lepal.on.workflow_dispatch as { inputs: Record<string, Record<string, unknown>> }
    expect(dispatch.inputs.source_ref).toMatchObject({ default: '', required: false })
    expect(dispatch.inputs).not.toHaveProperty('runner')
    expect(dispatch.inputs.policy_origin).toMatchObject({ default: '', required: false })
    expect(dispatch.inputs.policy_auth_origin).toMatchObject({ default: '', required: false })
    expect(dispatch.inputs.auto_update).toMatchObject({ type: 'boolean', default: false })
    const job = lepal.jobs.package
    if (job === undefined) throw new TypeError('LePal workflow must define the package job')
    expect(job['runs-on']).toBe('windows-latest')
    const checkout = job.steps?.find(step => step.uses === 'actions/checkout@v7.0.1')
    expect(checkout?.with).toMatchObject({ ref: '${{ inputs.source_ref || github.sha }}' })
    const prepare = job.steps?.find(step => step.id === 'prepare')
    expect(prepare?.env).toMatchObject({
      INPUT_POLICY_ORIGIN: '${{ inputs.policy_origin }}',
      INPUT_POLICY_AUTH_ORIGIN: '${{ inputs.policy_auth_origin }}',
    })
    const script = String(prepare?.run)
    expect(script).toContain('Set both policy origins before enabling auto_update')
    expect(script).not.toContain('download.deepseek.com')
  })
})
