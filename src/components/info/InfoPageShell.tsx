import type { ReactNode } from "react";
import { KazakhPattern } from "../KazakhPattern";

interface InfoPageShellProps {
  title: string;
  subtitle?: string;
  /** Короткая подпись над заголовком (например «Центр поддержки») */
  eyebrow?: string;
  children: ReactNode;
  heroImageUrl?: string;
  /** Шире основной контент (документы, FAQ) */
  wide?: boolean;
}

export function InfoPageShell({
  title,
  subtitle,
  eyebrow,
  children,
  heroImageUrl,
  wide = false,
}: InfoPageShellProps) {
  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <section className="relative bg-gradient-to-br from-[#0c4a6e] via-[#165383] to-[#0f766e] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,215,0,0.12),transparent)]" />
        <KazakhPattern className="absolute inset-0 w-full h-full text-white opacity-[0.18]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className={`${wide ? "max-w-4xl" : "max-w-3xl"}`}>
            {eyebrow && (
              <p className="text-[#FFD700] font-semibold text-xs uppercase tracking-[0.2em] mb-3">
                {eyebrow}
              </p>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-[2.5rem] font-semibold tracking-tight text-white mb-4 leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg md:text-xl text-white/85 leading-relaxed font-light">{subtitle}</p>
            )}
            <div className="mt-8 h-1 w-16 rounded-full bg-gradient-to-r from-[#00AFAE] to-[#FFD700]" />
          </div>
        </div>
      </section>

      {heroImageUrl && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 md:-mt-14 mb-14 md:mb-16">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-[#165383]/20 ring-1 ring-white/30">
            <img
              src={heroImageUrl}
              alt=""
              className="w-full h-[200px] sm:h-[260px] md:h-[340px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c4a6e]/50 to-transparent pointer-events-none" />
          </div>
        </div>
      )}

      <div
        className={`mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28 ${wide ? "max-w-6xl" : "max-w-3xl"}`}
      >
        {children}
      </div>
    </div>
  );
}
