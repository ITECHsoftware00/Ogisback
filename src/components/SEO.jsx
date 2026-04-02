import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'OgisBack';
const SITE_URL = 'https://ogisback.com';
const DEFAULT_TITLE = 'OgisBack — Where Creators Meet Brands';
const DEFAULT_DESC =
  'OgisBack is the content-first influencer marketplace. Creators post content. Brands discover them. They connect, agree on deals, and pay securely through escrow.';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const TWITTER_HANDLE = '@ogisback';

export default function SEO({
  title,
  description = DEFAULT_DESC,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noindex = false,
  structuredData,
  children,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const canonical = url ? `${SITE_URL}${url}` : SITE_URL;

  return (
    <Helmet>
      {/* ── Primary ── */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* ── Open Graph ── */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* ── Structured Data ── */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

      {children}
    </Helmet>
  );
}

/* ── Prebuilt structured data helpers ── */

export const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'OgisBack',
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.svg`,
  sameAs: [],
  description: DEFAULT_DESC,
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/explore?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export function creatorProfileSchema({ name, username, bio, avatar, followers, rating }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url: `${SITE_URL}/creator/${username}`,
    image: avatar,
    description: bio,
    identifier: username,
    aggregateRating: rating
      ? { '@type': 'AggregateRating', ratingValue: rating, bestRating: 5 }
      : undefined,
  };
}

export function campaignSchema({ title, description, brand, image, url: path }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    hiringOrganization: { '@type': 'Organization', name: brand },
    image,
    url: `${SITE_URL}${path}`,
    datePosted: new Date().toISOString().split('T')[0],
  };
}
