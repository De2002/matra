import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';

export interface MergeInput {
  name: string;
  data: ArrayBuffer;
}

export async function mergePDFs(files: MergeInput[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const pdf = await PDFDocument.load(file.data);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

export async function extractPagesPDF(
  pdfData: ArrayBuffer,
  pageIndicesToKeep: number[]
): Promise<Uint8Array> {
  const srcPdf = await PDFDocument.load(pdfData);
  const newPdf = await PDFDocument.create();

  const validIndices = pageIndicesToKeep.filter(idx => idx >= 0 && idx < srcPdf.getPageCount());
  if (validIndices.length === 0) {
    throw new Error('No valid pages selected for extraction');
  }

  const copiedPages = await newPdf.copyPages(srcPdf, validIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return await newPdf.save();
}

export async function rotatePDFPages(
  pdfData: ArrayBuffer,
  pageRotations: Record<number, number> // pageIndex -> additional degrees (e.g. 90, 180, 270)
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfData);
  const pages = pdfDoc.getPages();

  for (const [pageIdxStr, deg] of Object.entries(pageRotations)) {
    const pageIdx = parseInt(pageIdxStr, 10);
    if (pages[pageIdx]) {
      const currentRotation = pages[pageIdx].getRotation().angle;
      pages[pageIdx].setRotation(degrees((currentRotation + deg) % 360));
    }
  }

  return await pdfDoc.save();
}

export async function compressAndCleanPDF(pdfData: ArrayBuffer): Promise<Uint8Array> {
  // Reload and rewrite without unused objects / metadata streams
  const srcPdf = await PDFDocument.load(pdfData, { ignoreEncryption: true });
  
  // Clean metadata
  srcPdf.setTitle('');
  srcPdf.setAuthor('');
  srcPdf.setSubject('');
  srcPdf.setKeywords([]);
  srcPdf.setProducer('Scruttin Web Optimizer');
  srcPdf.setCreator('Scruttin Web');

  return await srcPdf.save({ useObjectStreams: true });
}

export async function convertImagesToPDF(
  images: { name: string; data: ArrayBuffer; mimeType: string }[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const img of images) {
    let embeddedImg;
    if (img.mimeType.includes('png')) {
      embeddedImg = await pdfDoc.embedPng(img.data);
    } else {
      embeddedImg = await pdfDoc.embedJpg(img.data);
    }

    const { width, height } = embeddedImg.scale(1.0);
    // Fit to page size (Standard Letter / A4 or image native dimensions)
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  return await pdfDoc.save();
}

export async function convertTextToPDF(title: string, text: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 11;
  const lineHeight = 16;
  const margin = 50;
  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const usableWidth = pageWidth - margin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Title
  currentPage.drawText(title, {
    x: margin,
    y: y,
    size: 18,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 35;

  const lines = text.split('\n');
  for (const rawLine of lines) {
    const words = rawLine.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > usableWidth && currentLine) {
        if (y < margin + lineHeight) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        currentPage.drawText(currentLine, {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      if (y < margin + lineHeight) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      currentPage.drawText(currentLine, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= lineHeight;
    }
  }

  return await pdfDoc.save();
}

export async function addWatermarkToPDF(
  pdfData: ArrayBuffer,
  watermarkText: string,
  opacity: number = 0.25
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfData);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textSize = 48;
    const textWidth = font.widthOfTextAtSize(watermarkText, textSize);
    
    page.drawText(watermarkText, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: textSize,
      font,
      color: rgb(0.8, 0.2, 0.2),
      opacity,
      rotate: degrees(45),
    });
  }

  return await pdfDoc.save();
}

export async function createZipWithImages(images: { name: string; dataUrl: string }[]): Promise<Blob> {
  const zip = new JSZip();
  for (const img of images) {
    const base64Data = img.dataUrl.split(',')[1];
    zip.file(img.name, base64Data, { base64: true });
  }
  return await zip.generateAsync({ type: 'blob' });
}
