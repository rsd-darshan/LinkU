import Link from "next/link";
import { FeedClient } from "@/components/feed/feed-client";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default async function PostPage({
  params
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;

  return (
    <section className="page-content" aria-labelledby="post-title">
      <Breadcrumbs items={[{ label: "Feed", href: "/" }, { label: "Post" }]} />
      <div className="page-header card-app">
        <h1 id="post-title" className="page-title">Post</h1>
        <p className="page-description">Viewing a post. <Link href="/" className="text-brand-600 hover:underline">Back to feed</Link>.</p>
      </div>
      <FeedClient initialPostId={postId} />
    </section>
  );
}
