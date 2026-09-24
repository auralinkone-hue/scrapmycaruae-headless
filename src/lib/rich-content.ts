type RicosNode = {
  id?: string;
  type?: string;
  nodes?: RicosNode[];
  textData?: {
    text?: string;
    decorations?: any[];
  };
  imageData?: any;
  headingData?: {
    level?: number;
  };
};

export type TableOfContentsItem = {
  id: string;
  text: string;
  level: 2 | 3;
  children: TableOfContentsItem[];
};

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const safeUrl = (value: unknown) => {
  const url = String(value ?? '').trim();
  if (!url) return '';
  if (url.startsWith('/') || url.startsWith('#')) return url;
  try {
    const parsed = new URL(url);
    if (['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
      return url;
    }
  } catch {}
  return '';
};

const imageUrl = (node: any) => {
  const image = node?.imageData?.image;
  const direct = image?.src?.url || image?.url;
  if (direct) return direct;

  const id = image?.src?.id || image?.id;
  if (!id) return '';

  return `https://static.wixstatic.com/media/${encodeURIComponent(id)}`;
};

const renderText = (node: RicosNode) => {
  let html = escapeHtml(node.textData?.text ?? '');

  for (const decoration of node.textData?.decorations ?? []) {
    switch (decoration?.type) {
      case 'BOLD':
        html = `<strong>${html}</strong>`;
        break;
      case 'ITALIC':
        html = `<em>${html}</em>`;
        break;
      case 'UNDERLINE':
        html = `<u>${html}</u>`;
        break;
      case 'LINK': {
        const link = decoration?.linkData?.link ?? decoration?.linkData;
        const href = safeUrl(link?.url);
        if (href) {
          const target = link?.target === 'BLANK' ? ' target="_blank"' : '';
          const relParts = [];
          if (link?.rel?.nofollow) relParts.push('nofollow');
          if (link?.rel?.noreferrer) relParts.push('noreferrer');
          if (target) relParts.push('noopener');
          const rel = relParts.length
            ? ` rel="${escapeHtml(relParts.join(' '))}"`
            : '';
          html = `<a href="${escapeHtml(href)}"${target}${rel}>${html}</a>`;
        }
        break;
      }
      default:
        break;
    }
  }

  return html;
};

const renderChildren = (node: RicosNode) =>
  (node.nodes ?? []).map(renderRicosNode).join('');

export function renderRicosNode(node: RicosNode): string {
  if (!node?.type) return '';

  switch (node.type) {
    case 'TEXT':
      return renderText(node);

    case 'PARAGRAPH':
      return `<p>${renderChildren(node)}</p>`;

    case 'HEADING': {
      const level = Math.min(6, Math.max(2, Number(node.headingData?.level || 2)));
      const suppliedId = node.id || (node.headingData as any)?.id || (node.headingData as any)?.anchor;
      const id = validHeadingId(suppliedId) ? ` id="${escapeHtml(suppliedId)}"` : '';
      return `<h${level}${id}>${renderChildren(node)}</h${level}>`;
    }

    case 'BULLETED_LIST':
      return `<ul>${renderChildren(node)}</ul>`;

    case 'ORDERED_LIST':
      return `<ol>${renderChildren(node)}</ol>`;

    case 'LIST_ITEM':
      return `<li>${renderChildren(node)}</li>`;

    case 'BLOCKQUOTE':
      return `<blockquote>${renderChildren(node)}</blockquote>`;

    case 'DIVIDER':
      return '<hr />';

    case 'CAPTION':
      return `<figcaption>${renderChildren(node)}</figcaption>`;

    case 'IMAGE': {
      const src = imageUrl(node);
      if (!src) return '';
      const alt = escapeHtml(
        node?.imageData?.altText ||
        node?.imageData?.image?.altText ||
        ''
      );
      const width = Number(node?.imageData?.image?.width || 0);
      const height = Number(node?.imageData?.image?.height || 0);
      const dimensions =
        width > 0 && height > 0
          ? ` width="${width}" height="${height}"`
          : '';
      return `<figure><img src="${escapeHtml(src)}" alt="${alt}"${dimensions} loading="lazy" decoding="async" /></figure>`;
    }

    case 'TABLE':
      return `<div class="table-scroll"><table><tbody>${renderChildren(node)}</tbody></table></div>`;

    case 'TABLE_ROW':
      return `<tr>${renderChildren(node)}</tr>`;

    case 'TABLE_CELL':
      return `<td>${renderChildren(node)}</td>`;

    default:
      return renderChildren(node);
  }
}

export function renderRicosDocument(richContent: any): string {
  return (richContent?.nodes ?? []).map(renderRicosNode).join('');
}

const validHeadingId = (value: unknown): value is string =>
  typeof value === 'string' && /^[\p{L}][\p{L}\p{N}_-]*$/u.test(value);

const textFromHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const headingSlug = (text: string, position: number) => {
  const latinSlug = text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return latinSlug || `section-${position}`;
};

/** Renders Wix rich content and derives a deterministic H2/H3 outline from it. */
export function renderRicosDocumentWithTableOfContents(richContent: any): {
  html: string;
  items: TableOfContentsItem[];
  headingCount: number;
} {
  const usedIds = new Set<string>();
  const items: TableOfContentsItem[] = [];
  let currentH2: TableOfContentsItem | null = null;
  let headingPosition = 0;
  let headingCount = 0;

  const html = renderRicosDocument(richContent).replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g,
    (_match, levelString: string, attributes: string, contents: string) => {
      const text = textFromHtml(contents);
      if (!text) return _match;

      headingPosition += 1;
      headingCount += 1;
      const suppliedId = attributes.match(/\bid\s*=\s*["']([^"']+)["']/i)?.[1];
      const baseId = validHeadingId(suppliedId)
        ? suppliedId
        : headingSlug(text, headingPosition);
      let id = baseId;
      let suffix = 2;
      while (usedIds.has(id)) id = `${baseId}-${suffix++}`;
      usedIds.add(id);

      const level = Number(levelString) as 2 | 3;
      const item: TableOfContentsItem = { id, text, level, children: [] };
      if (level === 2) {
        items.push(item);
        currentH2 = item;
      } else if (currentH2) {
        currentH2.children.push(item);
      } else {
        items.push(item);
      }

      const withoutId = attributes.replace(/\s+id\s*=\s*["'][^"']+["']/i, '');
      return `<h${level}${withoutId} id="${escapeHtml(id)}">${contents}</h${level}>`;
    },
  );

  return { html, items, headingCount };
}
