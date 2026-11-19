import type { ProductEvent } from '@deepseek-ai/dsh-client-product-analytics/types'
/** Native welcome operations using the shared Web authentication and RPC APIs. */

import { randomUUID } from 'node:crypto'
import { desktopAccountBackend, type DesktopAccountBackend } from './account-backend.ts'

/** Metadata needed before the native entry or workspace becomes visible. */
export interface WelcomeState {
  readonly loggedIn: boolean
  readonly hasApiKey: boolean
  readonly writable: boolean
  readonly localePreference: string | null
  /** Effective Host theme preference; absent or invalid optional theme settings use system appearance. */
  readonly themePreference: 'light' | 'dark' | 'system'
}

/** Credentials the native welcome form writes before entering the workspace. */
export interface WelcomeConnection {
  /** LePal gateway API key. */
  readonly apiKey: string
  /** Model endpoint written to the built-in provider's settings. */
  readonly baseUrl: string
}

/** Narrow operations available to the native welcome flow. */
export interface DesktopWelcomeBackend {
  /** @returns the current Host policy; every read observes live configuration. */
  analyticsEnabled(): Promise<boolean>
  readonly account: DesktopAccountBackend
  /** @param event - desktop-owned fields. @returns after local Host intake. */
  report(event: ProductEvent): Promise<void>
  /** @returns Configured-key presence and the shared language and theme preferences, without credential values. */
  read(): Promise<WelcomeState>
  /** @returns The saved UI language without account or provider requests. */
  readLocalePreference(): Promise<string | null>
  /**
   * Store the LePal gateway credential and endpoint before entering the workspace.
   * @param connection - user-entered key and model address.
   * @returns A safe write outcome without provider diagnostics.
   */
  save(connection: WelcomeConnection): Promise<{ ok: boolean }>
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Connect the native HTTP client to the Desktop Host; every request sends `cookie` explicitly and uses no cookie jar.
 * @param hostUrl - URL of the running Desktop Host; only its origin is used.
 * @param cookie - Desktop-private authentication header for this owned Host.
 * @param send - HTTP client for Host requests.
 * @returns metadata reads and write-only credential operations over standard RPC.
 */
export function connectDesktopWelcome(
  hostUrl: string,
  cookie: string,
  send: (input: string, init?: RequestInit) => Promise<Response> = fetch,
): DesktopWelcomeBackend {
  const origin = new URL(hostUrl).origin
  const invoke = async (
    request: { namespace: string; method: string; args: Record<string, unknown> },
    signal?: AbortSignal,
  ): Promise<unknown> => {
    const rpcId = randomUUID()
    const method = `${request.namespace}/${request.method}`
    const response = await send(new URL(`/api/${method}`, origin).href, {
      method: 'POST', redirect: 'error', ...(signal === undefined ? {} : { signal }),
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ type: 'client-request', rpcId, method, payload: { args: request.args } }),
    })
    if (!response.ok) throw new Error('desktop welcome: Web request failed')
    const envelope: unknown = await response.json()
    if (!record(envelope) || envelope.type !== 'server-response' || envelope.rpcId !== rpcId
      || !record(envelope.result) || envelope.result.ok !== true) {
      throw new Error('desktop welcome: Web RPC failed')
    }
    return envelope.result.value
  }
  const account = desktopAccountBackend(origin, invoke, cookie)
  const lepalProvider = async () => {
    const settings = await invoke({ namespace: 'settings', method: 'describe', args: {} })
    if (!record(settings) || !Array.isArray(settings.namespaces)) throw new Error('desktop welcome: missing settings namespaces')
    const piAi: unknown = settings.namespaces.find((item: unknown) => record(item) && item.ns === 'llm-pi-ai')
    const namespaces = settings.namespaces
    if (!record(piAi) || !record(piAi.value)) return { namespaces, ref: undefined, revision: undefined }
    const providers = piAi.value.providers
    const lepal = record(providers) && record(providers.lepal) ? providers.lepal : undefined
    return {
      namespaces,
      ref: record(lepal) && typeof lepal.apiKeyEnv === 'string' ? lepal.apiKeyEnv : undefined,
      revision: typeof piAi.revision === 'number' ? piAi.revision : undefined,
    }
  }
  /** Write configuration paths and return the namespace view the Host answered with. */
  const mutateSettings = async (ns: string, ops: unknown[], expectedRevision?: number): Promise<Record<string, unknown> | undefined> => {
    const value = await invoke({
      namespace: 'settings', method: 'mutate',
      args: { ns, ops, ...(expectedRevision === undefined ? {} : { expectedRevision }) },
    })
    if (!record(value)) return undefined
    return typeof value.revision === 'number' ? value : undefined
  }
  /** Ask the gateway which models it serves; duplicates and malformed entries are dropped. */
  const discoverModels = async (baseUrl: string): Promise<{ id: string; name?: string }[]> => {
    const value = await invoke({
      namespace: 'llm', method: 'discoverModels',
      args: { settingsNs: 'llm-pi-ai', request: { provider: 'lepal', baseURL: baseUrl } },
    }, AbortSignal.timeout(20_000))
    if (!Array.isArray(value)) return []
    const seen = new Set<string>()
    const models: { id: string; name?: string }[] = []
    for (const item of value) {
      if (!record(item) || typeof item.id !== 'string' || item.id.length === 0 || seen.has(item.id)) continue
      seen.add(item.id)
      models.push(typeof item.name === 'string' && item.name.length > 0 ? { id: item.id, name: item.name } : { id: item.id })
    }
    return models
  }
  const localePreference = (namespaces: unknown[]): string | null => {
    const locale: unknown = namespaces.find((item: unknown) => record(item) && item.ns === 'locale')
    if (!record(locale) || !record(locale.value)
      || (locale.value.preference !== undefined && typeof locale.value.preference !== 'string')) {
      throw new Error('desktop welcome: invalid locale preference')
    }
    return locale.value.preference ?? null
  }
  const themePreference = (namespaces: unknown[]): WelcomeState['themePreference'] => {
    const theme = namespaces.find(item => record(item) && item.ns === 'ui-theme')
    if (theme === undefined) return 'system'
    const preference = record(theme) && record(theme.value) ? theme.value.preference : undefined
    if (preference === 'light' || preference === 'dark' || preference === 'system') return preference
    console.warn('desktop appearance: invalid Host theme preference; using system appearance')
    return 'system'
  }
  const read = async (): Promise<WelcomeState> => {
    const { namespaces, ref } = await lepalProvider()
    const providers = await invoke({ namespace: 'llm', method: 'listConfigurableProviders', args: {} })
    if (!Array.isArray(providers)) throw new Error('desktop welcome: invalid provider directory')
    const refs = providers.flatMap((provider: unknown) => {
      if (!record(provider) || typeof provider.settingsNs !== 'string' || !Array.isArray(provider.settingsPath)) {
        throw new Error('desktop welcome: invalid provider settings address')
      }
      const namespace: unknown = namespaces.find((item: unknown) => record(item) && item.ns === provider.settingsNs)
      let value: unknown = record(namespace) ? namespace.value : undefined
      for (const key of provider.settingsPath as unknown[]) {
        if (typeof key !== 'string') throw new Error('desktop welcome: invalid provider settings path')
        value = record(value) ? value[key] : undefined
      }
      return record(value) && typeof value.apiKeyEnv === 'string' ? [value.apiKeyEnv] : []
    })
    const unique = [...new Set([...(ref === undefined ? [] : [ref]), ...refs])]
    const states: Record<string, unknown> = {}
    // credentials.describe accepts at most 64 references per request.
    for (let offset = 0; offset < unique.length; offset += 64) {
      const batch = await invoke({ namespace: 'credentials', method: 'describe', args: { refs: unique.slice(offset, offset + 64) } })
      if (!record(batch)) throw new Error('desktop welcome: invalid credential metadata')
      Object.assign(states, batch)
    }
    if (ref !== undefined && !record(states[ref])) throw new Error('desktop welcome: missing credential metadata')
    return {
      loggedIn: (await account.state()).status === 'credential-stored',
      hasApiKey: Object.values(states).some(value => record(value) && value.configured === true),
      writable: ref !== undefined && record(states[ref]) && states[ref].writable === true,
      localePreference: localePreference(namespaces),
      themePreference: themePreference(namespaces),
    }
  }
  return {
    account,
    read,
    async analyticsEnabled() {
      const enabled = await invoke({ namespace: 'productAnalytics', method: 'enabled', args: {} }, AbortSignal.timeout(1000))
      if (typeof enabled !== 'boolean') throw new Error('desktop analytics: invalid collection policy')
      return enabled
    },
    async report(event) { await invoke({ namespace: 'productAnalytics', method: 'report', args: { event } }, AbortSignal.timeout(1000)) },
    async readLocalePreference() {
      const settings = await invoke({ namespace: 'settings', method: 'describe', args: {} })
      if (!record(settings) || !Array.isArray(settings.namespaces)) throw new Error('desktop welcome: missing settings namespaces')
      return localePreference(settings.namespaces)
    },
    async save(connection) {
      const apiKey = connection.apiKey
      const baseUrl = connection.baseUrl.trim()
      if (!/^[\x21-\x7e]+$/.test(apiKey)) return { ok: false }
      if (!/^https?:\/\/[^\s]+$/u.test(baseUrl)) return { ok: false }
      try {
        const { namespaces, ref, revision } = await lepalProvider()
        if (ref === undefined) return { ok: false }
        await invoke({ namespace: 'credentials', method: 'set', args: { ref, value: apiKey } })
        let current = await mutateSettings('llm-pi-ai',
          [{ op: 'set', path: ['providers', 'lepal', 'baseURL'], value: baseUrl }], revision)
        // Discovery is best effort: a gateway without a listing keeps the built-in catalog.
        let models: { id: string; name?: string }[] = []
        try { models = await discoverModels(baseUrl) } catch { models = [] }
        if (models.length > 0) {
          current = await mutateSettings('llm-pi-ai',
            [{ op: 'set', path: ['providers', 'lepal', 'models'], value: models }],
            typeof current?.revision === 'number' ? current.revision : undefined) ?? current
          const preferred = models.find(model => /chat/iu.test(model.id))?.id ?? models[0]?.id
          const defaults: unknown = namespaces.find((item: unknown) => record(item) && item.ns === 'agent-default-model')
          if (preferred !== undefined) {
            await mutateSettings('agent-default-model', [
              { op: 'set', path: ['provider'], value: 'lepal' },
              { op: 'set', path: ['model'], value: preferred },
            ], record(defaults) && typeof defaults.revision === 'number' ? defaults.revision : undefined)
          }
        }
        return { ok: true }
      } catch {
        // Provider diagnostics may contain credentials; the native form owns failure copy.
        return { ok: false }
      }
    },
  }
}
