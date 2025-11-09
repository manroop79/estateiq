"use client";

import React, { useState, useEffect, ErrorInfo, ReactNode } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

// Initialize PDF.js worker at module level - must be done before any imports
if (typeof window !== "undefined") {
  import("react-pdf").then((pdfjs) => {
    if (pdfjs.pdfjs?.GlobalWorkerOptions) {
      pdfjs.pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    }
  }).catch((err) => {
    console.error("Failed to initialize PDF worker:", err);
  });
}

// Dynamically import react-pdf to avoid SSR issues
const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false }
);

const Page = dynamic(
  () => import("react-pdf").then((mod) => mod.Page),
  { ssr: false }
);

// Error Boundary component to catch PDF rendering errors
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("PDF Page render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface DocumentViewerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  document: any;
}

export function DocumentViewer({ document }: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [workerReady, setWorkerReady] = useState(false);

  // Initialize PDF.js worker - must be done before any PDF operations
  useEffect(() => {
    const initWorker = async () => {
      if (typeof window === "undefined") return;
      
      try {
        const pdfjs = await import("react-pdf");
        const pdfjsLib = pdfjs.pdfjs;
        
        if (!pdfjsLib?.GlobalWorkerOptions) {
          throw new Error("PDF.js GlobalWorkerOptions not available");
        }

        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        
        // Wait for worker file to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify worker source is set
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc || !pdfjsLib.GlobalWorkerOptions.workerSrc.includes("pdf.worker")) {
          throw new Error("Worker source not properly set");
        }

        // Additional wait to ensure worker is fully initialized and message handler is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Set worker ready - worker should be fully initialized by now
        setWorkerReady(true);
      } catch (err) {
        console.error("Failed to initialize PDF worker:", err);
        setPdfError("Failed to initialize PDF viewer. Please refresh the page.");
        setWorkerReady(false);
      }
    };

    initWorker();
  }, []);

  // Ensure component is mounted before rendering PDF
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Get signed URL for the PDF
    const getSignedUrl = async () => {
      if (!document?.storage_path || !mounted) return;

      try {
        setLoading(true);
        setDocumentLoaded(false);
        const response = await fetch(`/api/storage/signed-url?path=${encodeURIComponent(document.storage_path)}`);
        const result = await response.json();
        if (result.url) {
          setPdfUrl(result.url);
        }
      } catch (error) {
        console.error("Failed to get signed URL:", error);
      } finally {
        setLoading(false);
      }
    };

    getSignedUrl();
  }, [document, mounted]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    // Add delay to ensure document is fully ready and worker is initialized before rendering pages
    setTimeout(() => {
      setDocumentLoaded(true);
      setPdfError(null);
    }, 200);
  }

  function onDocumentLoadError(error: Error) {
    console.error("PDF load error:", error);
    setPdfError("Failed to load PDF. Please try refreshing the page.");
    setDocumentLoaded(false);
  }

  const goToPrevPage = () => setPageNumber((prev) => Math.max(1, prev - 1));
  const goToNextPage = () => setPageNumber((prev) => Math.min(numPages, prev + 1));
  const zoomIn = () => setScale((prev) => Math.min(2.5, prev + 0.2));
  const zoomOut = () => setScale((prev) => Math.max(0.5, prev - 0.2));

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="text-gray-400 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="text-sm text-gray-300 min-w-[80px] text-center">
            {numPages > 0 ? (
              <>
                <span className="text-white font-medium">{pageNumber}</span>
                <span className="text-gray-500"> / {numPages}</span>
              </>
            ) : (
              "..."
            )}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="text-gray-400 hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="text-gray-400 hover:text-white disabled:opacity-30"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          
          <span className="text-sm text-gray-400 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 2.5}
            className="text-gray-400 hover:text-white disabled:opacity-30"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-slate-900/50 flex items-start justify-center p-4 smooth-scroll">
        {!mounted && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Initializing...</p>
            </div>
          </div>
        )}

        {mounted && loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading PDF...</p>
            </div>
          </div>
        )}

        {mounted && workerReady && !loading && pdfUrl && !pdfError && (
          <div className="pdf-container transition-transform duration-300 ease-out">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              }
              error={
                <div className="text-center py-20 text-red-400">
                  <p>Failed to load PDF</p>
                  <p className="text-sm mt-2">Try refreshing the page</p>
                </div>
              }
            >
              {documentLoaded && numPages > 0 && workerReady && numPages >= pageNumber && pageNumber >= 1 && pdfUrl && (
                <ErrorBoundary fallback={
                  <div className="text-center py-10 text-red-400">
                    <p>Failed to render page</p>
                    <p className="text-xs mt-2">Try reloading</p>
                  </div>
                }>
                  <Page
                    key={`page_${pageNumber}_${workerReady}_${pdfUrl}`}
                    pageNumber={pageNumber}
                    scale={scale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-2xl rounded-lg overflow-hidden"
                    loading={
                      <div className="bg-slate-700 w-[600px] h-[800px] rounded-lg animate-pulse"></div>
                    }
                    error={
                      <div className="text-center py-10 text-red-400">
                        <p>Failed to render page</p>
                        <p className="text-xs mt-2">Try reloading</p>
                      </div>
                    }
                    onRenderError={(error) => {
                      console.error("Page render error:", error);
                      // Only set error if it's not a worker-related error (which might be transient)
                      if (!error?.message?.includes("sendWithPromise") && !error?.message?.includes("worker")) {
                        setPdfError("Failed to render PDF page. Please refresh the page.");
                      }
                    }}
                    onRenderSuccess={() => {
                      // Clear any previous errors when page renders successfully
                      if (pdfError) {
                        setPdfError(null);
                      }
                    }}
                  />
                </ErrorBoundary>
              )}
            </Document>
          </div>
        )}

        {mounted && !workerReady && !pdfError && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Initializing PDF viewer...</p>
            </div>
          </div>
        )}

        {pdfError && (
          <div className="text-center py-20">
            <div className="text-red-400 mb-4">
              <p className="font-semibold">PDF Error</p>
              <p className="text-sm mt-2">{pdfError}</p>
            </div>
            <Button 
              onClick={() => {
                setPdfError(null);
                setLoading(true);
                window.location.reload();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Refresh Page
            </Button>
          </div>
        )}

        {mounted && !loading && !pdfUrl && (
          <div className="text-center py-20 text-gray-400">
            <p>No PDF available</p>
          </div>
        )}
      </div>
    </div>
  );
}
