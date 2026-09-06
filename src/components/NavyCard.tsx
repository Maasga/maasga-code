import React, { ReactNode } from 'react';

/**
 * Reusable card component for the navy‑premium redesign.
 * Applies the common glass‑card, gradient‑hero and btn‑primary styles
 * and enables the global tilt and scroll‑reveal behaviours.
 *
 * Props:
 *   - title:   optional heading displayed at the top of the card
 *   - subtitle: optional sub‑heading displayed below the title
 *   - ctaLabel / ctaHref: optional call‑to‑action button rendered at the bottom
 *   - children: card body content
 */
export const NavyCard = ({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  children,
}: {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  children: ReactNode;
}) => (
  <div className="glass-card gradient-hero btn-primary" data-tilt data-reveal>
    <div className="p-6 space-y-4">
      {title && <h2 className="text-2xl font-bold text-white">{title}</h2>}
      {subtitle && <p className="text-white/80">{subtitle}</p>}
      <div>{children}</div>
      {ctaLabel && ctaHref && (
        <a href={ctaHref} className="inline-block mt-4 btn-primary text-white font-semibold py-2 px-4 rounded">
          {ctaLabel}
        </a>
      )}
    </div>
  </div>
);

export default NavyCard;
