import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { KazakhPattern } from "../KazakhPattern";
import { Calendar } from "lucide-react";

export interface LegalSection {
  id: string;
  title: string;
  icon: LucideIcon;
  content: ReactNode;
}

interface LegalDocLayoutProps {
  title: string;
  subtitle: string;
  eyebrow: string;
  heroImageUrl: string;
  updatedLabel: string;
  sections: LegalSection[];
}

export function LegalDocLayout({
  title,
  subtitle,
  eyebrow,
  heroImageUrl,
  updatedLabel,
  sections,
}: LegalDocLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <section className="relative bg-gradient-to-br from-[#1e3a5f] via-[#165383] to-[#115e59] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_100%_0%,rgba(0,175,174,0.2),transparent)]" />
        <KazakhPattern className="absolute inset-0 w-full h-full text-white opacity-[0.15]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-24">
          <p className="text-[#FFD700] font-semibold text-xs uppercase tracking-[0.2em] mb-3">{eyebrow}</p>
          <h1 className="text-3xl md:text-4xl lg:text-[2.5rem] font-semibold tracking-tight mb-4 max-w-3xl leading-tight">
            {title}
          </h1>
          <p className="text-lg text-white/85 max-w-2xl leading-relaxed">{subtitle}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="h-1 w-14 rounded-full bg-gradient-to-r from-[#00AFAE] to-[#FFD700]" />
            <span className="inline-flex items-center gap-2 text-sm text-white/80 bg-white/10 rounded-full px-4 py-1.5 border border-white/10">
              <Calendar className="w-4 h-4 text-[#FFD700]" />
              {updatedLabel}
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 md:-mt-16 mb-14">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-[#1e3a5f]/25 ring-1 ring-white/20">
          <img
            src={heroImageUrl}
            alt=""
            className="w-full h-[180px] md:h-[280px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#165383]/60 to-transparent" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-28">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          <aside className="lg:col-span-4 xl:col-span-3">
            <nav
              aria-label="Содержание"
              className="lg:sticky lg:top-24 rounded-2xl bg-white p-5 shadow-lg shadow-gray-200/50 border border-gray-100"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-[#00AFAE] mb-4">
                Содержание
              </p>
              <ol className="space-y-1 text-sm">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="flex gap-2 py-2 px-2 rounded-lg text-gray-600 hover:bg-[#00AFAE]/8 hover:text-[#0f766e] transition-colors group"
                    >
                      <span className="text-[#00AFAE]/70 font-mono text-xs w-5 shrink-0 pt-0.5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="group-hover:font-medium">{s.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <section
                  key={s.id}
                  id={s.id}
                  className="scroll-mt-28 rounded-3xl bg-white p-6 md:p-8 lg:p-10 shadow-lg shadow-gray-200/40 border border-gray-100/80 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#00AFAE]/6 to-transparent rounded-bl-full pointer-events-none" />
                  <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">
                    <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00AFAE] to-[#0d9488] flex items-center justify-center text-white shadow-lg shadow-[#00AFAE]/25">
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-3 text-gray-700 text-sm md:text-base leading-relaxed">
                      <h2 className="text-xl md:text-2xl font-semibold text-[#222222]">{s.title}</h2>
                      <div className="text-gray-600 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_p+p]:mt-3">
                        {s.content}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
