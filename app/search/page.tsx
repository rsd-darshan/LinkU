import { requireUser } from "@/lib/auth";
import { GlobalSearchClient } from "@/components/search/global-search-client";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  await requireUser();
  const params = await searchParams;
  const query = (params.q || "").trim();

  return (
    <section className="page-content route-shell route-search" aria-labelledby="search-title">
      <div className="page-header route-hero">
        <span className="route-badge">Discovery lens</span>
        <h1 id="search-title" className="page-title text-title-sm">
          {query ? `Results for "${query}"` : "Search"}
        </h1>
        <p className="page-description">
          {query
            ? "People (mentors & students), posts, and channels matching your search."
            : "Use the search bar below or press / in the top nav to search."}
        </p>
      </div>
      <GlobalSearchClient query={query} />
    </section>
  );
}
