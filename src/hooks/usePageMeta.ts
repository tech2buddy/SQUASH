import { useEffect } from 'react';

const SITE_NAME = 'SQUASH';
const SITE_URL = 'https://www.squashqa.co.za';
const DEFAULT_IMAGE = `${SITE_URL}/squash-logo.png`;

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let tag = document.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setLinkTag(rel: string, href: string) {
  let tag = document.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

export function usePageMeta(input: { title: string; description: string; path: string; noindex?: boolean }) {
  useEffect(() => {
    const fullTitle = input.title === SITE_NAME ? SITE_NAME : `${input.title} | ${SITE_NAME}`;
    const url = `${SITE_URL}${input.path}`;

    document.title = fullTitle;
    setMetaTag('name', 'description', input.description);
    setMetaTag('name', 'robots', input.noindex ? 'noindex, follow' : 'index, follow');
    setLinkTag('canonical', url);

    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', input.description);
    setMetaTag('property', 'og:url', url);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:site_name', SITE_NAME);
    setMetaTag('property', 'og:image', DEFAULT_IMAGE);

    setMetaTag('name', 'twitter:card', 'summary');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', input.description);
    setMetaTag('name', 'twitter:image', DEFAULT_IMAGE);
  }, [input.title, input.description, input.path, input.noindex]);
}
