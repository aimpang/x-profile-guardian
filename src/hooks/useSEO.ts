import { useEffect } from 'react';

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

/**
 * Hook to manage page-level SEO meta tags
 * Updates document title, meta description, OG tags, Twitter cards, and canonical URLs
 */
export const useSEO = (config: SEOConfig) => {
  useEffect(() => {
    // Update title
    document.title = config.title;
    updateMetaTag('description', config.description);

    if (config.keywords) {
      updateMetaTag('keywords', config.keywords);
    }

    if (config.noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    }

    // Update canonical URL
    const canonical = config.canonical || window.location.href;
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;

    // Update OG tags
    updateOGTag('og:title', config.ogTitle || config.title);
    updateOGTag('og:description', config.ogDescription || config.description);
    updateOGTag('og:type', config.ogType || 'website');
    updateOGTag('og:url', canonical);
    if (config.ogImage) {
      updateOGTag('og:image', config.ogImage);
    }

    // Update Twitter tags
    updateMetaTag('twitter:title', config.twitterTitle || config.ogTitle || config.title);
    updateMetaTag('twitter:description', config.twitterDescription || config.ogDescription || config.description);
    if (config.twitterImage) {
      updateMetaTag('twitter:image', config.twitterImage);
    }
  }, [config]);
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
