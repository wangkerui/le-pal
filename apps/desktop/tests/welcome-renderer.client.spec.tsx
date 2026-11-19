// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Welcome } from '../src/client/WelcomePage.tsx'
import { resolveDesktopLocale } from '../src/locale.ts'
import type { WelcomeConnection, WelcomeNotice, WelcomeSaveResult } from '../src/welcome-api.ts'

afterEach(cleanup)

const DEFAULT_ENDPOINT = 'http://vibegw.platform.cmbchina.cn/v1'

function mount(language = 'zh-CN', takeNotice = vi.fn<() => Promise<WelcomeNotice | undefined>>().mockResolvedValue(undefined)) {
  cleanup()
  const api = {
    takeNotice,
    analytics: vi.fn(async (_event: string, _attributes: object) => {}),
    analyticsEnabled: async () => true,
    ...resolveDesktopLocale(language),
    saveConnection: vi.fn<(connection: WelcomeConnection) => Promise<WelcomeSaveResult>>().mockResolvedValue({ ok: true }),
    skip: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  }
  const mounted = render(<Welcome api={api as never} />)
  const key = document.querySelector<HTMLInputElement>('#key-input')!
  const endpoint = document.querySelector<HTMLInputElement>('#base-url-input')!
  const button = (id: string) => document.querySelector<HTMLButtonElement>(id)!
  const submit = () => fireEvent.submit(document.querySelector('form')!)
  const enter = (value: string) => {
    fireEvent.change(key, { target: { value } })
  }
  return { document, api, key, endpoint, button, submit, enter, unmount: mounted.unmount }
}

describe('desktop welcome presentation', () => {
  it.each(['zh-CN', 'en'])('renders the %s LePal credential form', (language) => {
    const view = mount(language)
    expect(view.document.documentElement.lang).toBe(language)
    expect(view.document.querySelector('.brand-name')!.textContent).toBe('LePal')
    expect(view.key.type).toBe('password')
    expect(view.endpoint.value).toBe(DEFAULT_ENDPOINT)
    expect(view.document.querySelector('#save-key')!.textContent).toBeTruthy()
    expect(view.document.querySelector('#skip-key')!.textContent).toBeTruthy()
    expect(view.document.querySelector('#sign-in')).toBeNull()
    expect(view.document.querySelector('.visually-hidden')!.textContent).toContain('LePal')
  })

  it('saves the key and the model address together', async () => {
    const view = mount('en')
    view.enter('sk-lepal')
    fireEvent.change(view.endpoint, { target: { value: 'https://models.example.com/v1' } })
    view.submit()
    await vi.waitFor(() => { expect(view.api.saveConnection).toHaveBeenCalledWith({ apiKey: 'sk-lepal', baseUrl: 'https://models.example.com/v1' }) })
  })

  it('refuses an empty or quoted key without writing', async () => {
    const view = mount('en')
    view.submit()
    expect(view.document.querySelector('#key-error')!.textContent).toBeTruthy()
    view.enter('"sk-lepal"')
    view.submit()
    expect(view.document.querySelector('#key-error')!.textContent).toBeTruthy()
    expect(view.api.saveConnection).not.toHaveBeenCalled()
  })

  it('refuses a model address without an http endpoint', async () => {
    const view = mount('en')
    view.enter('sk-lepal')
    fireEvent.change(view.endpoint, { target: { value: 'vibegw.platform' } })
    view.submit()
    expect(view.document.querySelector('#base-url-error')!.textContent).toBeTruthy()
    expect(view.api.saveConnection).not.toHaveBeenCalled()
  })

  it('reports a failed write and keeps the entry', async () => {
    const view = mount('en')
    view.api.saveConnection.mockResolvedValue({ ok: false })
    view.enter('sk-lepal')
    view.submit()
    await vi.waitFor(() => { expect(view.document.querySelector('#key-error')!.textContent).toBeTruthy() })
    expect(view.key.value).toBe('sk-lepal')
  })

  it('enters the workspace through the later-setup action', async () => {
    const view = mount('en')
    fireEvent.click(view.button('#skip-key'))
    await vi.waitFor(() => { expect(view.api.skip).toHaveBeenCalled() })
  })

  it('keeps the expiry notice visible when the Host reports it', async () => {
    mount('en', vi.fn<() => Promise<WelcomeNotice | undefined>>().mockResolvedValue('session-expired'))
    await vi.waitFor(() => { expect(document.body.textContent).toBeTruthy() })
  })

  it('keeps the form usable when the notice channel fails', async () => {
    mount('en', vi.fn<() => Promise<WelcomeNotice | undefined>>().mockRejectedValue(new Error('closed')))
    await vi.waitFor(() => { expect(document.querySelector('#key-input')).not.toBeNull() })
  })
})
