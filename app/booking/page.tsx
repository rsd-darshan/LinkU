import Link from "next/link";
import { Suspense } from "react";
import { BookingFlowClient } from "@/components/booking/booking-flow-client";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function BookingPage() {
  return (
    <section className="page-content route-shell route-booking" aria-labelledby="booking-title">
      <Breadcrumbs items={[{ label: "Mentors", href: "/mentors" }, { label: "Book a session" }]} />
      <div className="page-header route-hero">
        <span className="route-badge">Session planner</span>
        <h1 id="booking-title" className="page-title">Book a session</h1>
        <p className="page-description">
          Choose a mentor, pick a time slot, and complete checkout. You can also <Link href="/mentors" className="text-brand-600 hover:underline">browse mentors</Link> first. LinkU applies a 15% platform fee.
        </p>
      </div>
      <Suspense fallback={
        <div className="card-app flex min-h-[200px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" aria-hidden="true" />
          <span className="sr-only">Loading booking flow...</span>
        </div>
      }>
        <BookingFlowClient />
      </Suspense>
    </section>
  );
}
