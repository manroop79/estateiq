"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Sparkles, FileText, Clock, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Document {
  id: string;
  filename: string;
  size: number;
  kind: string;
  status: string;
  created_at: string;
  entities?: unknown[];
  extracted?: Record<string, unknown>;
}

export default function InsightsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const { data, error } = await supabaseClient
          .from("documents")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (!error && data) {
          setDocuments(data);
        }
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleViewDocument = (docId: string) => {
    router.push(`/document/${docId}`);
  };

  const processedDocs = documents.filter(doc => {
    const hasExtracted = doc.extracted && Object.keys(doc.extracted).length > 0;
    const hasEntities = doc.entities && Array.isArray(doc.entities) && doc.entities.length > 0;
    return hasExtracted || hasEntities;
  });

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="pt-10 md:pt-2 max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-white">
                Insights
              </h1>
            </div>
            <p className="mt-2 text-xs text-gray-300">
              AI-powered document analysis and extracted entity insights
            </p>
          </div>

          {/* Image and Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Left: Image */}
            <div className="flex flex-col justify-center items-center order-2 md:order-1">
              <div className="relative w-full max-w-md aspect-square mx-auto flex items-center justify-center">
                <Image 
                  src="/c.png" 
                  alt="AI Insights illustration" 
                  fill 
                  className="object-contain" 
                />
              </div>
              <p className="text-xs italic text-gray-300 text-center -mt-10 md:-mt-20">
                Powered by AI • Real-time Analysis
              </p>
            </div>

            {/* Right: Stats Cards */}
            <div className="order-1 md:order-2 space-y-4">
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary-2)]/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{documents.length}</div>
                    <div className="text-xs text-gray-400">Total Documents</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{processedDocs.length}</div>
                    <div className="text-xs text-gray-400">Processed Documents</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documents List */}
          {documents.length === 0 ? (
            <div className="relative flex flex-col items-center justify-center py-16 mt-0">
              {/* Decorative floating elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-blue-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>

              {/* Main Icon */}
              <div className="relative mb-4 z-10">
                <div className="relative">
                  <Sparkles className="w-20 h-20 text-[var(--primary)]/30 animate-float" />
                </div>
              </div>

              {/* Text Content */}
              <div className="relative text-center space-y-2 z-10 px-4">
                <h3 className="text-xl font-semibold text-white">
                  No documents yet
                </h3>
                <p className="text-sm text-gray-300 max-w-md mx-auto">
                  Upload documents in the Vault to start generating AI insights
                </p>
                <Button 
                  onClick={() => router.push("/vault")}
                  className="mt-4 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-2)] hover:from-[var(--primary-2)] hover:to-[var(--accent)]"
                >
                  Go to Vault
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Documents with Insights</h2>
                <span className="text-sm text-gray-400">
                  {processedDocs.length} of {documents.length} processed
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => {
                  const hasExtracted = doc.extracted && Object.keys(doc.extracted).length > 0;
                  const hasEntities = doc.entities && Array.isArray(doc.entities) && doc.entities.length > 0;
                  const isProcessed = hasExtracted || hasEntities;
                  const date = new Date(doc.created_at);
                  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                  return (
                    <div
                      key={doc.id}
                      className="group bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:border-[var(--primary)]/50 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                      onClick={() => handleViewDocument(doc.id)}
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
                              <h3 className="text-sm font-semibold text-white truncate">
                                {doc.filename}
                              </h3>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span>{doc.kind || "Unknown"}</span>
                              <span>•</span>
                              <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                          </div>
                          {isProcessed && (
                            <div className="flex-shrink-0 ml-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formattedDate}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="group text-[var(--primary)] hover:text-[var(--primary-2)] hover:bg-[var(--primary)]/10 transition-transform duration-200 hover:translate-x-1 hover:scale-105"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDocument(doc.id);
                            }}
                          >
                            View
                            <ChevronRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-0.5" />
                          </Button>
                        </div>

                        {!isProcessed && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 px-3 py-2 rounded-lg border border-amber-400/20">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Needs processing</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
