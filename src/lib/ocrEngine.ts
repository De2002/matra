import { createWorker } from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  lines: { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }[];
}

export async function runOCR(
  imageSource: HTMLCanvasElement | HTMLImageElement | string,
  language: string = 'eng',
  onProgress?: (progress: number, status: string) => void
): Promise<OCRResult> {
  let imagePayload: any = imageSource;
  if (imageSource instanceof HTMLCanvasElement) {
    imagePayload = imageSource.toDataURL('image/png');
  }

  let worker: any = null;
  try {
    worker = await createWorker(language, 1, {
      logger: (m) => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress(Math.round((m.progress || 0) * 100), m.status);
        } else if (onProgress) {
          onProgress(50, m.status || 'Processing image...');
        }
      },
    });

    const ret = await worker.recognize(imagePayload);
    const data = ret.data;

    const lines = (data.lines || []).map((l: any) => ({
      text: l.text,
      confidence: l.confidence,
      bbox: l.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 },
    }));

    await worker.terminate();

    return {
      text: data.text || '',
      confidence: Math.round(data.confidence || 0),
      lines,
    };
  } catch (err: any) {
    if (worker) {
      try {
        await worker.terminate();
      } catch (_) {}
    }
    console.warn('OCR processing error:', err);
    throw new Error(err.message || 'OCR engine could not initialize in current browser environment.');
  }
}
