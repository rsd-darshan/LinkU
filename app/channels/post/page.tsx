import { requireUser } from "@/lib/auth";
import { NewChannelPostForm } from "@/components/feed/new-channel-post-form";

export default async function NewChannelPostPage() {
  await requireUser();

  return (
    <section className="page-content" aria-labelledby="new-post-title">
      <div className="page-header card-app">
        <h1 id="new-post-title" className="page-title">New Post</h1>
        <p className="page-description">Create a post in one of your joined communities.</p>
      </div>
      <NewChannelPostForm />
    </section>
  );
}
