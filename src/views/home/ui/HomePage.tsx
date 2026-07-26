"use client";

import Link from "next/link";
import { unlockAudio } from "@/shared/lib/audio";
import { ROUTES, SITE_NAME, SITE_TAGLINE } from "@/shared/config";

export function HomePage() {
  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-gradient-to-b from-sky-200 to-emerald-100 p-6 pb-safe text-center"
    >
      <span className="text-7xl" aria-hidden>
        🚸
      </span>
      <h1 className="font-[family-name:var(--font-baloo)] text-5xl font-extrabold text-slate-800">
        {SITE_NAME}
      </h1>
      <p className="max-w-sm text-lg font-bold text-slate-600">{SITE_TAGLINE}</p>

      <Link
        href={ROUTES.game}
        onClick={unlockAudio}
        className="min-h-14 rounded-3xl border-4 border-white/90 px-10 py-4 text-2xl font-extrabold text-white shadow-[0_8px_0_#3b7d21] transition duration-150 hover:-translate-y-1 hover:brightness-110 hover:shadow-[0_12px_0_#3b7d21] active:translate-y-1 active:shadow-[0_4px_0_#3b7d21]"
        style={{ background: "linear-gradient(#6fca4a,#4da12c)" }}
      >
        Start learning
      </Link>
    </main>
  );
}
