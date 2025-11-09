"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { useEffect, useState } from "react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set the correct worker src for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type PdfThumbProps = {
  file?: File | Blob; // Accept File or Blob (may be undefined due to hydration)
  className?: string;
  width?: number;
  height?: number;
};

export function PdfThumb({
  file,
  className = "",
  width = 260,
  height = 190,
}: PdfThumbProps) {
  // Error state for preview
  const [error, setError] = useState<string | null>(null);

  // Defensive: Only preview if file is present, and is a File or Blob
  const isSupportedFileType =
    typeof window !== "undefined" && // avoid SSR crash
    file &&
    (typeof File !== "undefined" ? file instanceof File : false ||
     typeof Blob !== "undefined" ? file instanceof Blob : false);

  if (!file) {
    return (
      <div className={`preview-box ${className}`} style={{ minHeight: height }}>
        <div className="preview-loading">Preparing preview…</div>
      </div>
    );
  }

  if (!isSupportedFileType) {
    return (
      <div className={`preview-box ${className}`} style={{ minHeight: height }}>
        <div className="preview-fallback text-neutral-400">
          Invalid PDF file
        </div>
      </div>
    );
  }

  return (
    <div
      className={`preview-box ${className} flex items-center justify-center`}
      style={{
        minHeight: height,
        minWidth: width,
        overflow: "hidden",
        borderRadius: "0.5rem",
      }}
    >
      <Document
        file={file}
        onLoadSuccess={() => setError(null)}
        onLoadError={() => setError("Preview failed")}
        loading={<div className="preview-loading">Loading PDF…</div>}
      >
        <Page
          pageNumber={1}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="object-contain mx-auto"
        />
      </Document>
      {error && (
        <div className="preview-fallback text-neutral-400 absolute inset-0 flex justify-center items-center bg-white/80">
          {error}
        </div>
      )}
    </div>
  );
}