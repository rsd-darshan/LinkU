import { requireUser } from "@/lib/auth";
import { NewChannelForm } from "@/components/feed/new-channel-form";

export default async function NewChannelPage() {
  await requireUser();

  return (
    <section className="page-content" aria-labelledby="new-channel-title">
      <div className="page-header card-app">
        <h1 id="new-channel-title" className="page-title">New Channel</h1>
        <p className="page-description">Set up a dedicated channel and start building your community.</p>
      </div>
      <NewChannelForm />
    </section>
  );
}
