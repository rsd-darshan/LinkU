"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StateMessage } from "@/components/ui/state-message";

type EligibleBooking = {
  id: string;
  startTime: string;
  mentor: {
    mentorProfile: {
      fullName: string;
      university: string;
    } | null;
  };
};

type SubmittedReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  booking: {
    startTime: string;
    mentor: {
      mentorProfile: {
        fullName: string;
      } | null;
    };
  };
};

export function ReviewsClient() {
  const [eligibleBookings, setEligibleBookings] = useState<EligibleBooking[]>([]);
  const [submittedReviews, setSubmittedReviews] = useState<SubmittedReview[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/reviews");
      const data = (await response.json()) as {
        eligibleBookings: EligibleBooking[];
        submittedReviews: SubmittedReview[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Failed to load reviews");
      setEligibleBookings(data.eligibleBookings || []);
      setSubmittedReviews(data.submittedReviews || []);
      setSelectedBookingId((prev) => prev || data.eligibleBookings?.[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load review data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function submitReview() {
    if (!selectedBookingId) {
      setError("Choose a booking first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBookingId,
          rating,
          comment: comment || undefined
        })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Failed to submit review");
      setComment("");
      setRating(5);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-content space-y-5">
      {loading ? (
        <div className="card-app flex min-h-[200px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" aria-hidden="true" />
          <span className="sr-only">Loading review data…</span>
        </div>
      ) : null}
      {error && !loading ? (
        <StateMessage variant="error" title="Couldn't load reviews" description={error} />
      ) : null}

      {!loading ? (
      <>
      <section className="card-app">
        <h2 className="text-title-sm text-slate-900">Leave a review</h2>
        {eligibleBookings.length === 0 ? (
          <StateMessage variant="empty" title="No sessions to review" description="Complete a mentor session to leave feedback." className="mt-3 border-0 bg-transparent p-0 text-left" />
        ) : (
          <div className="mt-3 space-y-3">
            <label htmlFor="review-booking" className="block text-body-sm text-slate-700">Booking</label>
            <select
              id="review-booking"
              className="input-app"
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              aria-label="Select booking to review"
            >
              {eligibleBookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {typeof window !== 'undefined' ? (booking.mentor.mentorProfile?.fullName || "Mentor") + " - " + new Date(booking.startTime).toLocaleDateString() : 'Loading...'}
                </option>
              ))}
            </select>
            <label htmlFor="review-rating" className="block space-y-1">
              <span className="text-body-sm text-slate-700">Rating</span>
              <select
                id="review-rating"
                className="input-app"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                aria-label="Rating"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="review-comment" className="sr-only">Optional feedback</label>
            <textarea
              id="review-comment"
              className="input-app resize-y"
              rows={3}
              placeholder="Write optional feedback"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button type="button" onClick={() => void submitReview()} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        )}
      </section>

      <section className="card-app">
        <h2 className="text-title-sm text-slate-900">Your submitted reviews</h2>
        <div className="mt-3 space-y-3">
          {submittedReviews.map((review) => (
            <article key={review.id} className="rounded-input bg-slate-50 p-3">
              <p className="text-body-sm font-medium text-slate-900">
                {review.booking.mentor.mentorProfile?.fullName || "Mentor"} — {review.rating}/5
              </p>
              <p className="text-caption text-slate-500">{typeof window !== 'undefined' ? new Date(review.createdAt).toLocaleString() : ''}</p>
              {review.comment ? <p className="mt-1 text-body-sm text-slate-700">{review.comment}</p> : null}
            </article>
          ))}
          {submittedReviews.length === 0 ? <p className="text-body-sm text-slate-600">No reviews submitted yet.</p> : null}
        </div>
      </section>
      </>
      ) : null}
    </div>
  );
}
