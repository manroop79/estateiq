"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import { DocumentViewer } from "@/components/document/DocumentViewer";
import { ExtractedEntitiesPanel } from "@/components/document/ExtractedEntitiesPanel";
import { ProcessingStatus } from "@/components/document/ProcessingStatus";
import { AIInsightsPanel } from "@/components/document/AIInsightsPanel";
import { ArrowLeft, AlertTriangle, Clock, FileText, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackgroundGradient } from "@/components/ui/background-gradient";

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Fetch document
  useEffect(() => {
    if (!documentId) return;

    const fetchDocument = async () => {
      const { data, error } = await supabaseClient
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single();

      if (!error && data) {
        setDocument(data);
      }
      setLoading(false);
    };

    fetchDocument();

    // Set up real-time subscription
    const subscription = supabaseClient
      .channel(`document-${documentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
          filter: `id=eq.${documentId}`,
        },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newDoc = payload.new as any;
          setDocument(newDoc);
          if (newDoc.status !== "processing") {
            setProcessing(false);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [documentId]);

  // Start processing
  const handleProcess = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/process?docId=${documentId}`, {
        method: "POST",
      });
      
      let result;
      try {
        result = await response.json();
      } catch {
        // If JSON parsing fails, create a result object
        result = { 
          error: `Server error (${response.status}): ${response.statusText}`,
          details: 'Failed to parse server response'
        };
      }
      
      if (response.ok && result.ok) {
        // Document will be updated via real-time subscription
        console.log('✅ Processing started successfully');
      } else {
        console.error("Processing failed:", result);
        const errorMsg = result?.error || result?.message || `Server error (${response.status})`;
        const details = result?.details ? `\n\nDetails: ${result.details}` : "";
        alert("Processing failed: " + errorMsg + details);
        setProcessing(false);
      }
    } catch (error) {
      console.error("Processing error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert("Processing failed: " + errorMessage);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-gray-300 text-lg mb-2">Document not found</p>
          <p className="text-gray-400 text-sm mb-6">
            The document you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button 
            onClick={() => router.push("/insights")} 
            className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-2)] hover:from-[var(--primary-2)] hover:to-[var(--accent)] transition-transform duration-400 hover:translate-x-1 hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Insights
          </Button>
        </div>
      </div>
    );
  }

  // Check both 'extracted' (old) and 'entities' (new schema) for backwards compatibility
  const hasExtractedData = document.extracted && Object.keys(document.extracted).length > 0;
  const hasEntities = document.entities && Array.isArray(document.entities) && document.entities.length > 0;
  const isProcessed = hasExtractedData || hasEntities;
  const canProcess = ["uploaded", "failed", "suspect"].includes(document.status);
  const date = document.created_at ? new Date(document.created_at) : new Date();
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="relative min-h-screen">
      {/* Back to Insights - flex horizontally with nav icon */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/insights")}
        className="group fixed top-8 left-24 z-[60] text-gray-400 hover:text-white transition-transform duration-200 hover:-translate-x-1 hover:scale-105"
      >
        <ArrowLeft className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:-translate-x-0.5" />
        Back to Insights
      </Button>

      <div className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header Section */}
        <div className="mb-8 md:mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary-2)]/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-white truncate">
                    {document.filename}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                    <span>{document.kind || "Unknown"}</span>
                    <span>•</span>
                    <span>{(document.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ProcessingStatus status={document.status} />
              
              {canProcess && !processing && (
                <Button
                  onClick={handleProcess}
                  className="bg-black text-white hover:bg-[var(--primary)] hover:text-white border border-white/20 hover:border-[var(--primary)]/50 transition-all"
                >
                  Extract Data
                </Button>
              )}

              {processing && (
                <Button disabled className="bg-[var(--primary)]/50 cursor-not-allowed">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </Button>
              )}

              {isProcessed && !processing && (
                <Button
                  onClick={handleProcess}
                  className="bg-black text-white hover:bg-[var(--primary)] hover:text-black border border-white/20 hover:border-[var(--primary)]/50 transition-all"
                >
                  Re-process
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Document Viewer */}
          <DocumentViewer document={document} />

          {/* Extracted Data Panel */}
          {isProcessed ? (
            <ExtractedEntitiesPanel document={document} />
          ) : (
            <BackgroundGradient containerClassName="h-[calc(100vh-12rem)]" className="rounded-2xl p-8 flex items-center justify-center h-full bg-slate-900 border border-slate-800/50">
              <div className="relative text-center max-w-md z-10">
                <div className="w-20 h-20 rounded-full bg-slate-700/50 mx-auto mb-6 flex items-center justify-center">
                  <FileSearch className="w-10 h-10 text-[var(--primary)]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No extracted data yet
                </h3>
                <p className="text-gray-400 mb-6 text-sm">
                  Click &quot;Extract Data&quot; to analyze this document and extract key information using AI-powered OCR.
                </p>
                {canProcess && !processing && (
                  <Button
                    onClick={handleProcess}
                    size="lg"
                    className="bg-white text-black hover:bg-black hover:text-white border border-white/20 hover:border-[var(--primary)]/50 transition-all"
                  >
                    Extract Data Now
                  </Button>
                )}
                {processing && (
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--primary)]"></div>
                    <span>Processing document...</span>
                  </div>
                )}
              </div>
            </BackgroundGradient>
          )}
        </div>

        {/* AI Insights Panel - Show only if document is processed */}
        {isProcessed && (
          <div className="mb-6">
            <AIInsightsPanel 
              documentId={documentId} 
              existingAnalysis={document.ai_analysis}
            />
          </div>
        )}
      </div>
    </div>
  );
}