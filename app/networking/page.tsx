import { NetworkingClient } from "@/components/networking/networking-client";
import { requireUser } from "@/lib/auth";

export default async function NetworkingPage() {
  await requireUser();

  return (
    <section className="page-content route-shell route-networking" aria-labelledby="connections-title">
      <div className="page-header route-hero">
        <span className="route-badge">Relationship graph</span>
        <h1 id="connections-title" className="page-title">Connections</h1>
        <p className="page-description">
          Find peers by major, country, and target university. Send a request, then chat once accepted.
        </p>
      </div>
      <NetworkingClient />
    </section>
  );
}
