import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { useMatches } from 'react-router-dom';

type RouteMeta = {
  title?: string;
  description?: string;
  ogImage?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogImageAlt?: string;
  ogUrl?: string;
  jsonLd?: string;
};

type MetaContext = {
  data: unknown;
  params: Record<string, string | undefined>;
};

type MetaHandle = {
  meta?: RouteMeta | ((ctx: MetaContext) => RouteMeta);
};

function resolveMeta(
  handle: unknown,
  data: unknown,
  params: Record<string, string | undefined>,
): RouteMeta {
  if (!handle || typeof handle !== 'object') return {};
  const meta = (handle as MetaHandle).meta;
  if (!meta) return {};
  return typeof meta === 'function' ? meta({ data, params }) : meta;
}

type MatchLike = {
  handle?: unknown;
  data?: unknown;
  params?: Record<string, string | undefined>;
};

const DEFAULT_META: RouteMeta = {
  title: 'Nokia 3310 Snake 2',
  description: 'Змейка с лабиринтами, яблоками, багами и уровнями скорости — ода Nokia 3310.',
  ogUrl: 'https://snake3310.io/',
};

function mergeMeta(matches: ReadonlyArray<MatchLike>): RouteMeta {
  const merged: RouteMeta = { ...DEFAULT_META };
  for (const match of matches) {
    Object.assign(merged, resolveMeta(match.handle, match.data, match.params ?? {}));
  }
  return merged;
}

function useRouteMeta(): RouteMeta {
  const matches = useMatches();
  return useMemo(
    () =>
      mergeMeta(
        matches.map((match) => ({
          handle: match.handle,
          data: match.data,
          params: match.params,
        })),
      ),
    [matches],
  );
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string | undefined) {
  if (!content) return;
  const selector = `meta[${attr}="${key}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Client-only head sync. SSR meta comes from renderHeadTags in entry.server. */
const DocumentMeta = ({ children }: { children?: ReactNode }) => {
  const meta = useRouteMeta();
  const title = meta.title ?? DEFAULT_META.title!;

  useEffect(() => {
    document.title = title;
    upsertMeta('name', 'description', meta.description);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', meta.description);
    upsertMeta('property', 'og:image', meta.ogImage);
    upsertMeta('property', 'og:url', meta.ogUrl);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
  }, [title, meta.description, meta.ogImage, meta.ogImageWidth, meta.ogImageHeight, meta.ogImageAlt, meta.ogUrl]);

  return children ?? null;
};

function metaFromMatches(matches: ReadonlyArray<MatchLike>): RouteMeta {
  return mergeMeta(matches);
}

function renderHeadTags(meta: RouteMeta): string {
  const title = escapeHtml(meta.title ?? DEFAULT_META.title!);
  const parts = [
    `<title>${title}</title>`,
    meta.description ? `<meta name="description" content="${escapeHtml(meta.description)}" />` : '',
    `<meta property="og:title" content="${title}" />`,
    meta.description ? `<meta property="og:description" content="${escapeHtml(meta.description)}" />` : '',
    meta.ogImage ? `<meta property="og:image" content="${escapeHtml(meta.ogImage)}" />` : '',
    meta.ogImageWidth ? `<meta property="og:image:width" content="${meta.ogImageWidth}" />` : '',
    meta.ogImageHeight ? `<meta property="og:image:height" content="${meta.ogImageHeight}" />` : '',
    meta.ogImageAlt ? `<meta property="og:image:alt" content="${escapeHtml(meta.ogImageAlt)}" />` : '',
    meta.ogUrl ? `<meta property="og:url" content="${escapeHtml(meta.ogUrl)}" />` : '',
    `<meta property="og:type" content="website" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    meta.ogImage ? `<meta name="twitter:image" content="${escapeHtml(meta.ogImage)}" />` : '',
    meta.jsonLd
      ? `<script type="application/ld+json">${escapeHtml(meta.jsonLd)}</script>`
      : '',
  ];
  return parts.filter(Boolean).join('\n    ');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export {
  DocumentMeta,
  metaFromMatches,
  renderHeadTags,
  useRouteMeta,
  type RouteMeta,
  type MetaContext,
};
