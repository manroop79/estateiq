declare module 'pdf-poppler' {
  interface ConvertOptions {
    format: 'png' | 'jpg' | 'jpeg';
    out_dir: string;
    out_prefix: string;
    page?: number;
  }
  
  export function convert(pdfPath: string, options: ConvertOptions): Promise<void>;
}

