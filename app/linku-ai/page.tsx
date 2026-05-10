import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  GraduationCap,
  Gauge,
  GitCompare,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { requireUserRedirect } from "@/lib/auth";
import { LottieHero } from "@/components/linku-ai/lottie-hero";

export const dynamic = "force-dynamic";

const features: Array<{
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: LucideIcon;
}> = [
  {
    title: "Global profile",
    description: "GPA, SAT, ECAs, essay, LOR rating",
    href: "/linku-ai/profile",
    cta: "Edit profile",
    icon: ClipboardList,
  },
  {
    title: "Applications",
    description: "University-specific supplements and rounds",
    href: "/linku-ai/applications",
    cta: "Manage applications",
    icon: GraduationCap,
  },
  {
    title: "My fit",
    description: "See your fit score at a school",
    href: "/linku-ai/my-fit",
    cta: "See my fit",
    icon: Gauge,
  },
  {
    title: "Compare",
    description: "Compare two users at a university",
    href: "/linku-ai/compare",
    cta: "Go to compare",
    icon: GitCompare,
  },
  {
    title: "Advanced insights",
    description: "Supplement heatmap & major-switch simulator",
    href: "/linku-ai/insights",
    cta: "View insights",
    icon: Sparkles,
  },
];

export default async function LinkUAiDashboardPage() {
  await requireUserRedirect();

  return (
    <section
      className="page-content animate-fade-in-up motion-reduce:animate-none"
      aria-labelledby="linku-ai-title"
    >
      {/* Hero: text + Lottie animation side by side (stack on small screens) */}
      <header className="route-hero grid gap-8 pb-9 sm:pb-11 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
        <div>
          <span className="route-badge">Admissions intelligence suite</span>
          <p className="text-body-sm font-medium uppercase tracking-widest text-slate-400">
            Admissions intelligence
          </p>
          <h1 id="linku-ai-title" className="mt-2 text-display font-semibold tracking-tight text-slate-900 sm:text-[2.25rem] sm:leading-[2.75rem]">
            LinkU AI
          </h1>
          <p className="mt-3 max-w-xl text-body text-slate-600">
            Build your profile, add applications and supplements, compare with peers, and see
            university-relative fit.
          </p>
          <div
            className="mt-6 h-1 w-16 rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
            aria-hidden
          />
        </div>
        <LottieHero />
      </header>

      {/* Feature list: full-width rows, no cards — hover = left border + soft bg */}
      <nav aria-label="LinkU AI tools" className="-mx-1 sm:-mx-2">
        <ul className="divide-y divide-slate-200/80" role="list">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <li key={feature.href}>
                <Link
                  href={feature.href}
                  className="focus-ring group flex min-h-[72px] w-full items-center gap-4 border-l-4 border-l-transparent py-4 pl-3 pr-4 transition-[border-color,background-color,transform] duration-200 ease-out hover:-translate-y-px hover:border-l-brand-500 hover:bg-brand-50/50 motion-reduce:transition-none sm:pl-4 sm:pr-5"
                  aria-label={`${feature.cta}: ${feature.title}`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-slate-100 text-slate-500 transition-colors duration-200 group-hover:bg-brand-100 group-hover:text-brand-700"
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-slate-900 transition-colors duration-200 group-hover:text-brand-800">
                    {feature.title}
                  </span>
                  <span className="mt-0.5 block text-body-sm text-slate-500">
                    {feature.description}
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-colors duration-200 group-hover:text-brand-600" />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Quick actions: inline, no box */}
      <p className="mt-10 border-t border-slate-200/80 pt-8 text-body-sm text-slate-600">
        Get feedback from a mentor on your essays or profile:{" "}
        <Link
          href="/mentors"
          className="font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 focus-ring rounded hover:text-brand-700"
        >
          Find mentors
        </Link>
        {" · "}
        <Link
          href="/booking"
          className="font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 focus-ring rounded hover:text-brand-700"
        >
          Book a session
        </Link>
      </p>
    </section>
  );
}
