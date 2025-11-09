import path from "path";
import fs from "fs";

/** Extract entities from raw OCR text */
export function extractEntities(text: string) {
const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
const join = lines.join(" ");

const buyer = /name[:\-]?\s*([A-Z][A-Za-z\s]{2,})/.exec(join)?.[1];
const seller = /seller[:\-]?\s*([A-Z][A-Za-z\s]{2,})/.exec(join)?.[1];
const plot = /(plot|flat|unit)\s*(no|number)?[:\-]?\s*([A-Z0-9\-\/]+)/i.exec(join)?.[3];
const date = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/.exec(join)?.[1];

return [
{ key: "buyer_name", value: buyer, confidence: buyer ? 0.7 : 0.0 },
{ key: "seller_name", value: seller, confidence: seller ? 0.7 : 0.0 },
{ key: "plot_no", value: plot, confidence: plot ? 0.7 : 0.0 },
{ key: "date", value: date, confidence: date ? 0.6 : 0.0 },
];
}

/** Simple rule engine: decide doc status */
export function statusFromEntities(list: {key:string; value?:string|null; confidence:number}[]) {
const required = ["buyer_name", "plot_no", "date"];
const missing = required.filter(k => !list.find(e => e.key === k && e.value));
if (missing.length > 0) return { status: "Suspect", detail: `Missing: ${missing.join(", ")}` };

const low = list.find(e => (e.value ?? "") && e.confidence < 0.5);
if (low) return { status: "Suspect", detail: `Low confidence: ${low.key}` };

return { status: "OK", detail: "All required fields present" };
}

/** OCR pipeline with optimizations for SPEED */
export async function runOCR(url: string) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Starting OCR processing...');
    }
    
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided to OCR: ' + String(url));
    }
    
    // Dynamically import Tesseract.js to prevent webpack from bundling it
    // This is necessary because Tesseract.js is browser-focused and causes build issues
    const Tesseract = (await import('tesseract.js')).default;
    
    // For server-side use, we need to resolve worker paths from node_modules
    // Tesseract.js v6 requires local file paths, not CDN URLs
    // Resolve worker path from tesseract.js package
    const tesseractPath = require.resolve('tesseract.js');
    const tesseractDir = path.dirname(tesseractPath);
    const workerDistPath = path.join(tesseractDir, '..', 'dist');
    
    // Resolve core path from tesseract.js-core package
    let corePath: string | undefined;
    try {
      const tesseractCorePath = require.resolve('tesseract.js-core');
      corePath = path.dirname(tesseractCorePath);
    } catch {
      console.warn('Could not resolve tesseract.js-core path');
    }
    
    interface WorkerConfig {
      logger?: (m: { status: string; progress: number }) => void;
      workerPath?: string;
      corePath?: string;
    }
    
    const workerConfig: WorkerConfig = {
      logger: process.env.NODE_ENV === 'development' ? (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      } : undefined,
    };
    
    // Set worker path if found
    if (fs.existsSync(workerDistPath)) {
      const workerPath = path.join(workerDistPath, 'worker.min.js');
      if (fs.existsSync(workerPath)) {
        workerConfig.workerPath = workerPath;
      }
    }
    
    // Set core path if found
    if (corePath && fs.existsSync(corePath)) {
      workerConfig.corePath = corePath;
    }
    
    const worker = await Tesseract.createWorker('eng', 1, workerConfig);

    // Optimize for MAXIMUM SPEED
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK, // Faster than AUTO
      tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY, // Faster engine
      // Remove character whitelist - it can slow things down
    });


    // Fetch the document from the signed URL
    let documentBuffer: Buffer;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        documentBuffer = Buffer.from(arrayBuffer);
      } catch (fetchError) {
        console.error('Error fetching document:', fetchError);
        throw new Error(`Failed to fetch document from URL: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
      }
    } else {
      documentBuffer = Buffer.from(url, 'base64');
    }

    // Check if it's a PDF by checking the file signature (first 4 bytes should be %PDF)
    const fileSignature = documentBuffer.slice(0, 4).toString('ascii');
    const isPDF = fileSignature === '%PDF';
    
    let imageData: Buffer;
    
    if (isPDF) {
      try {
        // Use pdf-poppler for server-side PDF to image conversion
        // This avoids browser API dependencies like DOM Matrix
        const pdfPoppler = await import('pdf-poppler');
        
        // Save PDF to temp file
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        const tempPdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
        fs.writeFileSync(tempPdfPath, documentBuffer);
        const options = {
          format: 'png' as const,
          out_dir: tempDir,
          out_prefix: `page_${Date.now()}`,
          page: 1, // Only first page for speed
        };
        
        // Convert first page to PNG
        await pdfPoppler.convert(tempPdfPath, options);
        
        // Find the generated image file
        const imageFiles = fs.readdirSync(tempDir).filter(f => f.startsWith(`page_${options.out_prefix}`) && f.endsWith('.png'));
        if (imageFiles.length === 0) {
          throw new Error('No image file generated from PDF');
        }
        
        const imagePath = path.join(tempDir, imageFiles[0]);
        imageData = fs.readFileSync(imagePath);
        
        // Clean up temp files
        try {
          fs.unlinkSync(tempPdfPath);
          fs.unlinkSync(imagePath);
        } catch (cleanupError) {
          console.warn('Failed to clean up temp files:', cleanupError);
        }
      } catch (pdfError) {
        console.error('Error converting PDF to image:', pdfError);
        // Fallback: throw a more helpful error
        if (pdfError instanceof Error && pdfError.message.includes('DOM')) {
          throw new Error('PDF conversion failed: Browser APIs not available. Please use mock OCR mode (NEXT_PUBLIC_USE_MOCK_OCR=true) or install poppler-utils for server-side PDF conversion.');
        }
        throw new Error(`Failed to convert PDF to image: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`);
      }
    } else {
      // It's already an image
      imageData = documentBuffer;
    }

    // Recognize text with rectangle to process (optional optimization)
    const result = await worker.recognize(imageData, {
      rotateAuto: false, // Disable auto-rotation for speed
    });
    
    // Clean up
    await worker.terminate();
    
    return result.data.text || "";
  } catch (error) {
    console.error('OCR Error:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
      ? error 
      : JSON.stringify(error);
    throw new Error(`OCR processing failed: ${errorMessage || 'Unknown error occurred'}`);
  }
}