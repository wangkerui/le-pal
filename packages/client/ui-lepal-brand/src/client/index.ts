/**
 * LePal brand occupants, browser half. Occupies the three single brand slots at
 * priority -1 so a production build's official occupants (priority 0) are
 * shadowed. Product copy lives in the built-in locale dictionaries.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { LePalBrandMark, LePalBrandName, LePalHeroMark } from './Brand.tsx'

/** Required service: the slot registry. */
export const inject = ['slots']

/**
 * Fill the sidebar and hero brand slots.
 * @param ctx - Client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.slots.inject('sidebar.brand.mark', () =>
    ctx.slots.inject('sidebar.brand.name', () =>
      ctx.slots.inject('conversation.hero.brand.mark', function* () {
        yield ctx.slots.register({ name: 'sidebar.brand.mark', priority: -1 }, LePalBrandMark)
        yield ctx.slots.register({ name: 'sidebar.brand.name', priority: -1 }, LePalBrandName)
        yield ctx.slots.register({ name: 'conversation.hero.brand.mark', priority: -1 }, LePalHeroMark)
      })))
}
