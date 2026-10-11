import { media } from '@wix/sdk';

type WixImage = string | {
  url?: unknown;
  width?: unknown;
  height?: unknown;
};

type ResponsiveImageOptions = {
  widths: number[];
  aspectRatio?: number;
  quality?: number;
};

type ResolvedWixImage = {
  url: string;
  width: number;
  height: number;
};

const rawSourceUrl = (image: WixImage | null | undefined) =>
  typeof image === 'string'
    ? image
    : typeof image?.url === 'string'
      ? image.url
      : '';

const isWixCdnImage = (source: string) =>
  source.includes('static.wixstatic.com/') || source.startsWith('wix:image://') || source.startsWith('wix:');

const asPositiveNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;

const resolveWixImage = (image: WixImage | null | undefined): ResolvedWixImage => {
  const source = rawSourceUrl(image);
  const objectWidth = typeof image === 'object' && image ? asPositiveNumber(image.width) : 0;
  const objectHeight = typeof image === 'object' && image ? asPositiveNumber(image.height) : 0;

  if (!source) return { url: '', width: objectWidth, height: objectHeight };

  if (source.startsWith('wix:image://') || source.startsWith('wix:')) {
    try {
      const resolved = media.getImageUrl(source);
      const url = typeof resolved === 'string'
        ? resolved
        : resolved && typeof resolved.url === 'string'
          ? resolved.url
          : '';
      return {
        url,
        width: objectWidth || asPositiveNumber(resolved && typeof resolved === 'object' ? resolved.width : 0),
        height: objectHeight || asPositiveNumber(resolved && typeof resolved === 'object' ? resolved.height : 0)
      };
    } catch {
      return { url: '', width: objectWidth, height: objectHeight };
    }
  }

  return { url: source, width: objectWidth, height: objectHeight };
};

/**
 * Wix CMS IMAGE fields may return an opaque wix:image:// URI. Those values
 * are useful CMS references, but are not browser image URLs. Resolve them at
 * the server boundary so templates never emit a raw Wix media URI in src.
 */
export function normalizeWixImage(image: WixImage | null | undefined) {
  return resolveWixImage(image).url;
}

const transform = (
  image: WixImage,
  width: number,
  height: number,
  encoding: 'auto' | 'avif',
  quality: number
) => {
  const source = normalizeWixImage(image);
  if (!source) return '';
  if (!isWixCdnImage(source)) return source;

  try {
    return media.getScaledToFillImageUrl(source, width, height, {
      quality,
      autoEncode: encoding === 'auto',
      encoding: encoding === 'avif' ? 'AVIF' : undefined,
      allowWebpAvifTransforms: true
    });
  } catch {
    // Image variants are an enhancement. A malformed or temporarily
    // unsupported Wix media record must not abort the surrounding SSR page.
    return source;
  }
};

/**
 * Builds Wix CDN image variants from the original media record. The normal
 * source uses Wix's enc_auto negotiation (WebP where supported); AVIF is
 * provided explicitly through a picture source.
 */
export function wixResponsiveImage(
  image: WixImage | null | undefined,
  { widths, aspectRatio, quality = 78 }: ResponsiveImageOptions
) {
  const resolved = resolveWixImage(image);
  const source = resolved.url;
  const originalWidth = resolved.width;
  const originalHeight = resolved.height;
  const ratio = aspectRatio || (originalWidth && originalHeight ? originalWidth / originalHeight : 16 / 9);

  if (!source) {
    return { src: '', srcset: '', avifSrcset: '', width: originalWidth, height: originalHeight };
  }

  if (!isWixCdnImage(source)) {
    return {
      src: source,
      srcset: '',
      avifSrcset: '',
      width: originalWidth,
      height: originalHeight
    };
  }

  const variants = widths.map((width) => {
    const height = Math.max(1, Math.round(width / ratio));
    return {
      width,
      auto: transform(image, width, height, 'auto', quality),
      avif: transform(image, width, height, 'avif', quality)
    };
  });
  const largest = variants[variants.length - 1];

  return {
    src: largest.auto,
    srcset: variants.map(({ auto, width }) => `${auto} ${width}w`).join(', '),
    avifSrcset: variants.map(({ avif, width }) => `${avif} ${width}w`).join(', '),
    width: originalWidth || largest.width,
    height: originalHeight || Math.round(largest.width / ratio)
  };
}
