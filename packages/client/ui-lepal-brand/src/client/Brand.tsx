/** LePal brand artwork: the sidebar mark, the sidebar wordmark, and the home-hero mark. */

/** Product name shown beside the sidebar mark. */
export const BRAND_NAME = 'LePal'

/** Geometry the brand-mark owners supply. */
interface MarkProps {
  /** Requested square edge in pixels. */
  size: number
  /** Host class that keeps the slot's geometry. */
  className?: string | undefined
}

/**
 * LePal mark: a blue rounded tile with a white rhombus.
 * @param props - host-supplied size and class.
 * @returns The inline SVG mark.
 */
export function LePalBrandMark({ size, className }: MarkProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" role="img" aria-label={BRAND_NAME}>
      <rect x="1" y="1" width="30" height="30" rx="7" fill="#1D4ED8" />
      <path d="M16 7 L24 16 L16 25 L8 16 Z" fill="#FFFFFF" opacity="0.95" />
      <path d="M16 11.5 L20.5 16 L16 20.5 L11.5 16 Z" fill="#1D4ED8" />
    </svg>
  )
}

/**
 * Sidebar wordmark.
 * @returns The product name without the host's local-build badge.
 */
export function LePalBrandName() {
  return (
    <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
      {BRAND_NAME}
    </span>
  )
}

/**
 * Home-hero mark.
 * @param props - host-supplied size and class.
 * @returns The same mark at the hero's geometry.
 */
export function LePalHeroMark({ size, className }: MarkProps) {
  return <LePalBrandMark size={size} className={className} />
}
