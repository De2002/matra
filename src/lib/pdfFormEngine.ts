import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument as PDFLibDoc } from 'pdf-lib';
import { PDFFormField } from '../types';

export async function extractPDFFormFields(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number
): Promise<PDFFormField[]> {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const annotations = await page.getAnnotations({ intent: 'display' });
    const fields: PDFFormField[] = [];

    for (const ann of annotations) {
      if (ann.subtype !== 'Widget' && !ann.fieldName) continue;

      let type: PDFFormField['type'] = 'text';
      let value: string | boolean = ann.fieldValue ?? ann.buttonValue ?? '';

      if (ann.fieldType === 'Tx') {
        type = 'text';
        value = typeof ann.fieldValue === 'string' ? ann.fieldValue : '';
      } else if (ann.fieldType === 'Btn') {
        if (ann.checkBox) {
          type = 'checkbox';
          value = Boolean(ann.fieldValue && ann.fieldValue !== 'Off');
        } else if (ann.radioButton) {
          type = 'radio';
          value = String(ann.buttonValue || ann.fieldValue || '');
        } else {
          type = 'button';
        }
      } else if (ann.fieldType === 'Ch') {
        type = 'select';
        value = Array.isArray(ann.fieldValue) ? ann.fieldValue[0] : (ann.fieldValue || '');
      }

      // Convert PDF rect [x1, y1, x2, y2] to top-left percentage / normalized coordinates
      const [x1, y1, x2, y2] = ann.rect || [0, 0, 0, 0];
      const pageView = page.view; // [0, 0, width, height]
      const pageWidth = pageView[2] - pageView[0];
      const pageHeight = pageView[3] - pageView[1];

      // In PDF coordinates, (0,0) is bottom-left
      const rect = {
        x: ((x1 - pageView[0]) / pageWidth) * 100,
        y: ((pageHeight - (y2 - pageView[1])) / pageHeight) * 100,
        width: ((x2 - x1) / pageWidth) * 100,
        height: ((y2 - y1) / pageHeight) * 100,
      };

      fields.push({
        id: ann.id || `field-${pageNumber}-${fields.length}`,
        name: ann.fieldName || `Field_${pageNumber}_${fields.length}`,
        type,
        value,
        pageIndex: pageNumber - 1,
        rect,
        options: ann.options ? ann.options.map((opt: any) => (typeof opt === 'string' ? opt : opt.displayValue || opt.exportValue)) : undefined,
        readOnly: Boolean(ann.readOnly),
        multiline: Boolean(ann.multiline),
        required: Boolean(ann.required),
      });
    }

    return fields;
  } catch (err) {
    console.warn(`Error extracting form fields for page ${pageNumber}:`, err);
    return [];
  }
}

export async function saveFilledPDF(
  originalData: ArrayBuffer | Uint8Array,
  formFields: PDFFormField[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFLibDoc.load(originalData, { ignoreEncryption: true });
  const form = pdfDoc.getForm();

  for (const field of formFields) {
    if (!field.name) continue;
    try {
      if (field.type === 'text') {
        const tf = form.getTextField(field.name);
        if (tf) tf.setText(String(field.value || ''));
      } else if (field.type === 'checkbox') {
        const cb = form.getCheckBox(field.name);
        if (cb) {
          if (field.value) cb.check();
          else cb.uncheck();
        }
      } else if (field.type === 'select') {
        const dd = form.getDropdown(field.name);
        if (dd && field.value) {
          dd.select(String(field.value));
        }
      }
    } catch (e) {
      // Ignore individual missing field errors
    }
  }

  return await pdfDoc.save();
}
