import { MentorDiscoveryClient } from "@/components/mentor/mentor-discovery-client";

export default function MentorsPage() {
  return (
    <section className="page-content route-shell route-mentors" aria-labelledby="mentors-title">
      <div className="page-header route-hero">
        <span className="route-badge">Guided sessions</span>
        <h1 id="mentors-title" className="page-title">Mentors</h1>
        <p className="page-description">
          Filter by major, country, university, and hourly budget. Results are ranked by the LinkU matching engine.
        </p>
      </div>
      <MentorDiscoveryClient />
    </section>
  );
}
