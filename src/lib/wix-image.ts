import { media } from '@wix/sdk';

type WixImage = string | {
  url?: string;
  width?: number;
  height?: number;
};

type ResponsiveImageOptions = {
  widths: number[];
  aspectRatio?: number;
  quality?: number;
};

const sourceUrl = (image: WixImage | null | undefined) =>
  typeof image === 'string' ? image : image?.url || '';

const transform = (
  image: WixImage,
  width: number,
  height: number,
  encoding: 'auto' | 'avif',
  quality: number
) => {
  const source = sourceUrl(image);
  if (!source) return '';

  return media.getScaledToFillImageUrl(source, width, height, {
    quality,
    autoEncode: encoding === 'auto',
    encoding: encoding === 'avif' ? 'AVIF' : undefined,
    allowWebpAvifTransforms: true
  });
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
  const source = sourceUrl(image);
  const originalWidth = typeof image === 'string' ? 0 : Number(image?.width || 0);
  const originalHeight = typeof image === 'string' ? 0 : Number(image?.height || 0);
  const ratio = aspectRatio || (originalWidth && originalHeight ? originalWidth / originalHeight : 16 / 9);

  if (!source) {
    return { src: '', srcset: '', avifSrcset: '', width: originalWidth, height: originalHeight };
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
