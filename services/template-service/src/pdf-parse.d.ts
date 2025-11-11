/**
 * Type definitions for pdf-parse
 * Since @types/pdf-parse may not exist, we declare it here
 */

declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
    producer: string;
    creator: string;
    creationDate: Date;
  }

  function pdfParse(dataBuffer: Buffer, options?: any): Promise<PDFData>;

  export = pdfParse;
}

