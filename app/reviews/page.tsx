import { ReviewsClient } from "@/components/reviews/reviews-client";
import { requireRole } from "@/lib/auth";

export default async function ReviewsPage() {
  await requireRole(["STUDENT"]);

  return (
    <section className="page-content route-shell route-reviews" aria-labelledby="reviews-title">
      <div className="page-header route-hero">
        <span className="route-badge">Quality signals</span>
        <h1 id="reviews-title" className="page-title">Reviews</h1>
        <p className="page-description">
          Leave feedback after completed mentor sessions to help maintain trust and mentor quality.
        </p>
      </div>
      <ReviewsClient />
    </section>
  );
}
