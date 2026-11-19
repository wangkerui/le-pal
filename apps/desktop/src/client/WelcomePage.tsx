/** Desktop welcome presentation; credential operations stay in the preload. */
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Toast } from '@deepseek-ai/dsh-client-ui-primitives/src/Toast.tsx'
import type { WelcomeApi } from '../welcome-api.ts'

/** Endpoint the built-in LePal provider ships with. */
const DEFAULT_BASE_URL = 'http://vibegw.platform.cmbchina.cn/v1'

/** Whether an entered key is the key itself rather than a shell assignment or quoted value. */
function validKey(value: string): boolean {
  return /^[\x21-\x7e]+$/.test(value) && !/^[A-Z][A-Z0-9_]*=[^=]/.test(value)
    && !((value.startsWith('"') || value.startsWith("'") || value.charCodeAt(0) === 96) && value.at(-1) === value[0])
}

/**
 * Render the first-run LePal credential form using shell-owned operations.
 * @param props.api - isolated preload API; no credentials reach the renderer.
 * @returns the setup form with fixed bottom actions.
 */
export function Welcome({ api }: { api: WelcomeApi }) {
  const { messages: m } = api
  const [expiryNotice, setExpiryNotice] = useState(false)
  const [draft, setDraft] = useState('')
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL)
  const [error, setError] = useState('')
  const [urlError, setUrlError] = useState('')
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const mounted = useRef(true)
  const input = useRef<HTMLInputElement>(null)
  const urlInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    mounted.current = true
    document.documentElement.lang = api.id
    document.title = m.welcomeTitle
    void api.takeNotice().then((notice) => {
      if (mounted.current && notice === 'session-expired') setExpiryNotice(true)
    }).catch((_closedChannel: unknown) => {
      // A closed Welcome IPC channel must not interrupt the setup form.
    })
    return () => { mounted.current = false }
  }, [api, m.welcomeTitle])

  useEffect(() => { input.current?.focus() }, [])

  async function save(event: FormEvent) {
    event.preventDefault()
    if (busyRef.current) return
    void api.analytics?.('api_key_save_click', {})
    const value = draft.trim()
    if (!validKey(value)) {
      setError(value === '' ? m.welcomeKeyBlank : m.welcomeKeyInvalid)
      input.current?.focus()
      return
    }
    const endpoint = baseUrl.trim()
    if (!/^https?:\/\/[^\s]+$/u.test(endpoint)) {
      setUrlError(m.welcomeBaseUrlInvalid)
      urlInput.current?.focus()
      return
    }
    busyRef.current = true
    setBusy(true)
    setError('')
    setUrlError('')
    try {
      const result = await api.saveConnection({ apiKey: value, baseUrl: endpoint })
      if (!mounted.current) return
      if (result.ok) setDraft('')
      else setError(m.welcomeKeyFailed)
    } catch {
      if (mounted.current) setError(m.welcomeKeyFailed)
    } finally {
      busyRef.current = false
      if (mounted.current) setBusy(false)
    }
  }

  async function skip() {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    try {
      await api.skip()
      if (mounted.current) setDraft('')
    } catch {
      if (mounted.current) setError(m.welcomeContinueFailed)
    } finally {
      busyRef.current = false
      if (mounted.current) setBusy(false)
    }
  }

  return <>
    {expiryNotice && <Toast text={m.welcomeSessionExpired} onDone={() => { setExpiryNotice(false) }} />}
    <div className="titlebar" aria-hidden="true" />
    <main className="welcome">
      <div className="brand" role="img" aria-label={m.welcomeBrand}>
        <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
          <rect x="1" y="1" width="30" height="30" rx="7" fill="#1D4ED8" />
          <path d="M16 7 L24 16 L16 25 L8 16 Z" fill="#FFFFFF" opacity="0.95" />
          <path d="M16 11.5 L20.5 16 L16 20.5 L11.5 16 Z" fill="#1D4ED8" />
        </svg>
        <span className="brand-name">{m.welcomeBrand}</span>
      </div>
      <form id="key-form" className="key-form" noValidate onSubmit={(event) => { void save(event) }} aria-busy={busy}>
        <header className="key-heading"><h1 id="key-title">{m.welcomeKeyTitle}</h1><p id="key-description">{m.welcomeKeyDescription}</p></header>
        <div className="key-field">
          <label className="visually-hidden" htmlFor="key-input">{m.welcomeKeyPlaceholder}</label>
          <input ref={input} id="key-input" type="password" autoComplete="new-password" autoCapitalize="off" spellCheck={false} required
            aria-describedby="key-description key-error" aria-invalid={error !== ''} placeholder={m.welcomeKeyPlaceholder}
            value={draft} disabled={busy} onChange={(event) => { setDraft(event.target.value); setError('') }} />
          <p id="key-error" className="key-error" role="alert" hidden={error === ''}>{error}</p>
        </div>
        <div className="key-field">
          <label className="key-label" htmlFor="base-url-input">{m.welcomeBaseUrlLabel}</label>
          <input ref={urlInput} id="base-url-input" type="url" autoComplete="url" autoCapitalize="off" spellCheck={false} required
            aria-describedby="base-url-error" aria-invalid={urlError !== ''} placeholder={DEFAULT_BASE_URL}
            value={baseUrl} disabled={busy} onChange={(event) => { setBaseUrl(event.target.value); setUrlError('') }} />
          <p id="base-url-error" className="key-error" role="alert" hidden={urlError === ''}>{urlError}</p>
        </div>
      </form>
      <div id="key-actions" className="actions">
        <button id="save-key" className="primary" type="submit" form="key-form" disabled={busy || draft.trim() === ''}>{m.welcomeKeySave}</button>
        <button id="skip-key" className="secondary" type="button" disabled={busy} onClick={() => { void skip() }}>{m.welcomeKeyLater}</button>
      </div>
    </main>
  </>
}
