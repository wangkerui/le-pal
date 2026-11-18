/**
 * LePal brand occupants and language pack, browser half. Occupies the three
 * single brand slots at priority -1 so a production build's official occupants
 * (priority 0) are shadowed, and registers the LePal language pack, which
 * reaches every uncovered key through the built-in zh pack.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { BRAND_NAME, LePalBrandMark, LePalBrandName, LePalHeroMark } from './Brand.tsx'

/** Required services: the slot registry and the locale catalog. */
export const inject = ['slots', 'locale']

/** Language-pack id; its fallback reaches the built-in zh pack for uncovered keys. */
const BRAND_LOCALE = 'zh-lepal'

/** First-launch marker: the pack is selected once per browser and never over a later user choice. */
const LOCALE_INITIALIZED = 'lepal-brand.locale-initialized'

/** Product-name copy the pack replaces in the shared vocabulary. */
const COMMON_COPY = { 'brand.localBuild': BRAND_NAME } as const

/**
 * Fill the brand slots and register the language pack.
 * @param ctx - Client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => {
    const disposeLanguage = ctx.locale.addLanguage({ id: BRAND_LOCALE, label: '中文（LePal）', fallback: 'zh' })
    const disposeCopy = ctx.locale.register('common', BRAND_LOCALE, { ...COMMON_COPY })
    return () => { disposeCopy(); disposeLanguage() }
  }, 'lepal-brand: language pack')

  if (typeof localStorage !== 'undefined' && localStorage.getItem(LOCALE_INITIALIZED) === null) {
    localStorage.setItem(LOCALE_INITIALIZED, '1')
    ctx.locale.setLocale(BRAND_LOCALE)
  }

  ctx.slots.inject('sidebar.brand.mark', () =>
    ctx.slots.inject('sidebar.brand.name', () =>
      ctx.slots.inject('conversation.hero.brand.mark', function* () {
        yield ctx.slots.register({ name: 'sidebar.brand.mark', priority: -1 }, LePalBrandMark)
        yield ctx.slots.register({ name: 'sidebar.brand.name', priority: -1 }, LePalBrandName)
        yield ctx.slots.register({ name: 'conversation.hero.brand.mark', priority: -1 }, LePalHeroMark)
      })))
}
