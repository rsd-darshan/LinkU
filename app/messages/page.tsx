import { MessagesClient } from "@/components/messages/messages-client";

export default function MessagesPage() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden" aria-label="Messages">
      <div className="route-hero mb-3">
        <span className="route-badge">Realtime conversations</span>
        <h1 className="page-title mt-2">Messages</h1>
        <p className="page-description">Chat with your accepted connections and keep mentoring discussions moving.</p>
      </div>
      <MessagesClient />
    </div>
  );
}
