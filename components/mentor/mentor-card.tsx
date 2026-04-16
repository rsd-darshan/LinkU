import Link from "next/link";
import { Button } from "@/components/ui/button";

type MentorCardProps = {
  id: string;
  name: string;
  university: string;
  major: string;
  rateCents: number;
  rating: number;
  score?: number;
  verified?: boolean;
};

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 ${filled ? "text-amber-400" : "text-slate-200"}`}
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export function MentorCard({ id, name, university, major, rateCents, rating, score, verified }: MentorCardProps) {
  const stars = Math.min(5, Math.max(0, Math.round(rating)));
  const rateDollars = (rateCents / 100).toFixed(0);

  return (
    <article className="card-app flex flex-col transition-shadow duration-normal hover:shadow-card-hover">
      <div className="flex gap-4">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xl font-bold text-white shadow-sm"
          aria-hidden
        >
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-title-sm text-slate-900">{name}</h3>
            {verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-caption font-medium text-brand-700">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-body-sm text-slate-600">
            {university} · {major}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-body-sm text-slate-700">
            <span className="font-medium text-slate-900">${rateDollars}/hr</span>
            <span className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <StarIcon key={i} filled={i < stars} />
              ))}
              <span className="ml-1 text-slate-600">{rating.toFixed(1)}</span>
            </span>
            {typeof score === "number" ? (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-caption font-medium text-brand-700">
                Match {score}%
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-4 border-t border-slate-100 pt-4">
        <Link href={`/booking?mentorId=${id}`}>
          <Button className="w-full sm:w-auto">Book session</Button>
        </Link>
      </div>
    </article>
  );
}
