"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StateMessage } from "@/components/ui/state-message";

type MentorListItem = {
  userId: string;
  fullName: string;
  university: string;
  major: string;
  hourlyRateCents: number;
  averageRating: string;
  verificationBadge: boolean;
};

type MentorDetail = {
  userId: string;
  fullName: string;
  university: string;
  major: string;
  hourlyRateCents: number;
  averageRating: string;
  acceptedUniversities: string[];
  scholarships: string[];
  availableTimeSlots: string[];
  verificationBadge: boolean;
};

export function BookingFlowClient() {
  const searchParams = useSearchParams();
  const preselectedMentor = searchParams?.get("mentorId") || "";
  const bookingStatus = searchParams?.get("status");

  const [loadingMentors, setLoadingMentors] = useState(true);
  const [mentors, setMentors] = useState<MentorListItem[]>([]);
  const [selectedMentorId, setSelectedMentorId] = useState(preselectedMentor);
  const [mentorDetail, setMentorDetail] = useState<MentorDetail | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<30 | 60>(30);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMentors = async () => {
      setLoadingMentors(true);
      setError(null);
      try {
        const response = await fetch("/api/mentors");
        const data = (await response.json()) as { mentors: MentorListItem[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Failed to load mentors");
        setMentors(data.mentors);

        if (!preselectedMentor && data.mentors.length > 0) {
          setSelectedMentorId(data.mentors[0].userId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load mentors");
      } finally {
        setLoadingMentors(false);
      }
    };
    void loadMentors();
  }, [preselectedMentor]);

  useEffect(() => {
    const loadMentorDetail = async () => {
      if (!selectedMentorId) return;
      setMentorDetail(null);
      setSelectedSlot("");
      setError(null);
      try {
        const response = await fetch(`/api/mentors/${selectedMentorId}`);
        const data = (await response.json()) as { mentor?: MentorDetail; error?: string };
        if (!response.ok || !data.mentor) throw new Error(data.error || "Failed to load mentor details");
        setMentorDetail(data.mentor);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load mentor details");
      }
    };
    void loadMentorDetail();
  }, [selectedMentorId]);

  const totalAmountCents = useMemo(() => {
    if (!mentorDetail) return 0;
    return durationMinutes === 30 ? Math.round(mentorDetail.hourlyRateCents / 2) : mentorDetail.hourlyRateCents;
  }, [durationMinutes, mentorDetail]);

  async function startCheckout() {
    if (!selectedMentorId || !selectedSlot) {
      setError("Select mentor and time slot first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorId: selectedMentorId,
          startTime: selectedSlot,
          durationMinutes
        })
      });
      const data = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Failed to create booking");
      }
      if (typeof window !== 'undefined') {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
      setSubmitting(false);
    }
  }

  return (
    <div className="page-content space-y-4">
      {bookingStatus === "success" ? (
        <p className="card-app-section border-emerald-200 bg-emerald-50/80 px-4 py-3 text-body-sm text-emerald-700" role="status">
          Payment successful. Your booking is now scheduled.
        </p>
      ) : null}
      {bookingStatus === "canceled" ? (
        <p className="card-app-section border-amber-200 bg-amber-50/80 px-4 py-3 text-body-sm text-amber-800" role="status">
          Checkout was canceled. You can choose another slot anytime.
        </p>
      ) : null}
      {loadingMentors ? (
        <div className="card-app flex min-h-[120px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" aria-hidden="true" />
          <span className="sr-only">Loading mentors…</span>
        </div>
      ) : null}
      {error && !loadingMentors ? (
        <StateMessage variant="error" title="Something went wrong" description={error} />
      ) : null}
      {!loadingMentors ? (
      <>
      <section className="card-app">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="booking-mentor" className="block text-body-sm text-slate-700">Mentor</label>
            <select
              id="booking-mentor"
              className="input-app"
              value={selectedMentorId}
              onChange={(e) => setSelectedMentorId(e.target.value)}
              disabled={loadingMentors}
              aria-label="Select mentor"
            >
              {mentors.map((mentor) => (
                <option key={mentor.userId} value={mentor.userId}>
                  {mentor.fullName} - {mentor.university} (${(mentor.hourlyRateCents / 100).toFixed(2)}/hr)
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="booking-duration" className="block text-body-sm text-slate-700">Duration</label>
            <select
              id="booking-duration"
              className="input-app"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value) as 30 | 60)}
              aria-label="Session duration"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>
        </div>

        {mentorDetail ? (
          <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">
              {mentorDetail.fullName} {mentorDetail.verificationBadge ? "- Verified Mentor" : ""}
            </p>
            <p>
              {mentorDetail.university} - {mentorDetail.major} - Rating {Number(mentorDetail.averageRating).toFixed(1)}
            </p>
          </div>
        ) : null}
      </section>

      <section className="card-app">
        <h2 className="text-title-sm text-slate-900">Available slots</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(mentorDetail?.availableTimeSlots || []).slice(0, 30).map((slot) => {
            const selected = selectedSlot === slot;
            return (
              <button
                type="button"
                key={slot}
                className={`focus-ring min-h-[44px] rounded-input border px-3 py-2 text-left text-body-sm transition ${
                  selected
                    ? "border-brand-600 bg-brand-50 text-brand-800"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
                onClick={() => setSelectedSlot(slot)}
                aria-pressed={selected}
              >
                {typeof window !== 'undefined' ? new Date(slot).toLocaleString() : ''}
              </button>
            );
          })}
        </div>
        {mentorDetail && mentorDetail.availableTimeSlots.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No open slots available for this mentor.</p>
        ) : null}
      </section>

      <section className="card-app">
        <h2 className="text-title-sm text-slate-900">Checkout summary</h2>
        <p className="mt-2 text-body-sm text-slate-700">Session total: ${(totalAmountCents / 100).toFixed(2)}</p>
        <p className="text-caption text-slate-500">Platform fee (15%) is included in this total.</p>
        <div className="mt-4">
          <Button type="button" onClick={() => void startCheckout()} disabled={submitting || !selectedSlot}>
            {submitting ? "Redirecting…" : "Proceed to Checkout"}
          </Button>
        </div>
      </section>
      </>
      ) : null}
    </div>
  );
}
