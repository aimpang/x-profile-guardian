import { useEffect, useRef } from 'react';

interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  keywords?: string;
  noindex?: boolean;
}

const DEFAULT_OG_IMAGE = 'https://xsentinel.dev/og-image.png';

/**
 * Hook to manage page-level SEO meta tags.
 * Updates document title, meta description, OG tags, Twitter cards, and canonical URLs.
 */
export const useSEO = (config: SEOConfig) => {
  // Stable ref so the effect doesn't re-fire on every render from inline object literals
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const c = configRef.current;

    document.title = c.title;
    updateMetaTag('description', c.description);

    if (c.keywords) updateMetaTag('keywords', c.keywords);

    // Always write robots tag — explicit intent per page
    updateMetaTag('robots', c.noindex ? 'noindex, nofollow' : 'index, follow');

    // Canonical — never use window.location.href (includes query strings)
    const canonical = c.canonical || window.location.origin + window.location.pathname;
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    // OG tags
    const ogImage = c.ogImage || DEFAULT_OG_IMAGE;
    updateOGTag('og:title', c.ogTitle || c.title);
    updateOGTag('og:description', c.ogDescription || c.description);
    updateOGTag('og:type', c.ogType || 'website');
    updateOGTag('og:url', canonical);
    updateOGTag('og:image', ogImage);

    // Twitter card tags — always set twitter:card
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', c.twitterTitle || c.ogTitle || c.title);
    updateMetaTag('twitter:description', c.twitterDescription || c.ogDescription || c.description);
    updateMetaTag('twitter:image', c.twitterImage || ogImage);
  }, []);
};

function updateMetaTag(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function updateOGTag(property: string, content: string) {
  let og = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
  if (!og) {
    og = document.createElement('meta');
    og.setAttribute('property', property);
    document.head.appendChild(og);
  }
  og.content = content;
}
