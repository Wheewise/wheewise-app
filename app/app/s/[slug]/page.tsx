import { permanentRedirect } from "next/navigation";

type Params = Promise<{ slug: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

// The premium storefront lives at /s/[slug]/showcase, which is now the single
// canonical URL. This short route 308-redirects there, preserving any filter
// query params (?type, ?fuel, ?q, ?listing) so shared/bookmarked links survive.
export default async function StorefrontRedirect({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
    else if (value != null) qs.set(key, value);
  }
  const tail = qs.toString();

  permanentRedirect(`/s/${slug}/showcase${tail ? `?${tail}` : ""}`);
}
