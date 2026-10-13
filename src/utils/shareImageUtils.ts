import { toBlob } from 'html-to-image';

export interface ShareImageOptions {
  title?: string;
  text?: string;
  filename?: string;
  pixelRatio?: number;
}

export type ShareResult = 'shared' | 'downloaded' | 'failed';

/**
 * Captura un elemento del DOM como Blob PNG en alta resolución (2x por defecto).
 */
export async function captureElementToBlob(
  element: HTMLElement,
  options?: { pixelRatio?: number; backgroundColor?: string }
): Promise<Blob> {
  const pixelRatio = options?.pixelRatio ?? 2;

  const blob = await toBlob(element, {
    pixelRatio,
    cacheBust: true,
    backgroundColor: options?.backgroundColor,
  });

  if (!blob) {
    throw new Error('No se pudo generar la imagen del elemento.');
  }

  return blob;
}

/**
 * Descarga directamente un elemento del DOM como archivo PNG.
 */
export async function downloadElementAsImage(
  element: HTMLElement,
  filename = 'picksports-export.png',
  options?: { pixelRatio?: number; backgroundColor?: string }
): Promise<void> {
  const blob = await captureElementToBlob(element, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Comparte un elemento del DOM como archivo de imagen mediante Web Share API
 * con fallback automático a descarga PNG si el navegador no permite compartir archivos.
 */
export async function shareElementAsImage(
  element: HTMLElement,
  options: ShareImageOptions = {}
): Promise<ShareResult> {
  const {
    title = 'PickSports',
    text = '',
    filename = 'picksports.png',
    pixelRatio = 2,
  } = options;

  try {
    const blob = await captureElementToBlob(element, { pixelRatio });
    const cleanFilename = filename.endsWith('.png') ? filename : `${filename}.png`;
    const file = new File([blob], cleanFilename, { type: 'image/png' });

    // 1. Intentar compartir como archivo de imagen nativo (móviles: WhatsApp, Telegram, etc.)
    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return 'shared';
    }

    // 2. Fallback a descarga si el navegador no soporta compartir archivos (desktop / web común)
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return 'downloaded';
  } catch (error: any) {
    // Si el usuario cancela la ventana de compartir nativa (AbortError), no es un fallo fatal
    if (error?.name === 'AbortError') {
      return 'failed';
    }
    console.error('Error al compartir o generar imagen:', error);
    throw error;
  }
}
