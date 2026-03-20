/**
 * Voxy Global SEO Configuration
 * This file contains the default metadata shared across all pages.
 */

export const siteConfig = {
  name: "Voxy",
  shortName: "Voxy",
  description: "Advanced AI-powered business chat platform for seamless customer engagement and conversion.",
  url: "https://voxy.samkiel.dev",
  ogImage: "https://voxy.samkiel.dev/favicon.jpg", // Ensure this exists in /public
  links: {
    twitter: "@voxy_ai",
    github: "https://github.com/voxy-ai",
  },
  keywords: [
    "AI Business Chat",
    "Customer Engagement",
    "VOXY AI",
    "Automated Customer Service",
    "Interactive Storefront",
    "Voice AI Support",
  ],
};

/**
 * Generate shared metadata for pages
 */
export function constructMetadata({
  title = siteConfig.name,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  icons = "/favicon.jpg",
  noIndex = false,
} = {}) {
  return {
    title: {
      default: title,
      template: `%s | ${siteConfig.shortName}`,
    },
    description,
    keywords: siteConfig.keywords,
    authors: [
      {
        name: "SAMKIEL",
        url: "https://voxy.samkiel.dev",
      },
    ],
    creator: "SAMKIEL",
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteConfig.url,
      title,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: siteConfig.links.twitter,
    },
    icons,
    manifest: `${siteConfig.url}/site.webmanifest`,
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
    alternates: {
      canonical: siteConfig.url,
    },
  };
}
