"use client";

import { useState } from "react";
import { Sparkles, Lightbulb, AlertTriangle, CheckCircle, TrendingUp, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface LegalIssue {
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
}

interface ValidationIssue {
  field: string;
  issue: string;
  suggestion: string;
}

interface Insight {
  title: string;
  description: string;
  priority?: 'high' | 'medium' | 'low';
}

interface AnalysisResult {
  summarize?: {
    summary: string;
    keyPoints?: string[];
  };
  legal_issues?: {
    issues?: LegalIssue[];
    overallRisk?: 'high' | 'medium' | 'low';
  };
  validate_fields?: {
    completenessScore: number;
    qualityScore: number;
    validationIssues?: ValidationIssue[];
  };
  extract_insights?: {
    insights?: Insight[];
    nextSteps?: string[];
  };
}

interface AIInsightsPanelProps {
  documentId: string;
  existingAnalysis?: AnalysisResult;
}

export function AIInsightsPanel({ documentId, existingAnalysis }: AIInsightsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(existingAnalysis || null);
  const [error, setError] = useState<string>("");

  const analyzeDocument = async (type: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          analysisType: type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult({ ...result, [type]: data.result });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[var(--primary)]/10 via-[var(--primary-2)]/5 to-transparent backdrop-blur-xl rounded-2xl border border-[var(--primary)]/30 p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--primary)]/30 to-[var(--accent)]/30 flex items-center justify-center border border-[var(--primary)]/50 flex-shrink-0">
          <Lightbulb className="w-6 h-6 text-[var(--primary)]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold text-white whitespace-nowrap truncate">AI Insights</h3>
          <p className="text-sm text-gray-400 truncate">Powered by advanced AI analysis</p>
        </div>
      </div>

      {/* Analysis Options */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          onClick={() => analyzeDocument("summarize")}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 h-auto py-4 flex flex-col items-start"
        >
          <FileText className="w-5 h-5 mb-2" />
          <span className="font-medium">Summarize</span>
          <span className="text-xs opacity-75">Quick overview</span>
        </Button>

        <Button
          onClick={() => analyzeDocument("legal_issues")}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 h-auto py-4 flex flex-col items-start"
        >
          <AlertTriangle className="w-5 h-5 mb-2" />
          <span className="font-medium">Legal Issues</span>
          <span className="text-xs opacity-75">Find problems</span>
        </Button>

        <Button
          onClick={() => analyzeDocument("validate_fields")}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 h-auto py-4 flex flex-col items-start"
        >
          <CheckCircle className="w-5 h-5 mb-2" />
          <span className="font-medium">Validate Fields</span>
          <span className="text-xs opacity-75">Check quality</span>
        </Button>

        <Button
          onClick={() => analyzeDocument("extract_insights")}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 h-auto py-4 flex flex-col items-start"
        >
          <TrendingUp className="w-5 h-5 mb-2" />
          <span className="font-medium">Extract Insights</span>
          <span className="text-xs opacity-75">Deep analysis</span>
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            <div>
              <p className="text-white font-medium">Analyzing with AI...</p>
              <p className="text-sm text-gray-400">This may take 10-30 seconds</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-white font-medium">Analysis Failed</p>
              <p className="text-sm text-gray-400">{error}</p>
              <p className="text-xs text-gray-500 mt-2">
                Make sure you&apos;ve set OPENAI_API_KEY or ANTHROPIC_API_KEY in your environment variables
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && Object.keys(result).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Summarize Results */}
          {result.summarize && (
            <div className="bg-white/10 border border-white/20 rounded-xl p-5 backdrop-blur-sm">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                <FileText className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
                <span className="truncate">Summary</span>
              </h4>
              <p className="text-gray-200 text-sm mb-4 leading-relaxed">{result.summarize.summary}</p>
              {result.summarize.keyPoints && (
                <div>
                  <p className="text-sm font-medium text-[var(--primary)] mb-2">Key Points:</p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    {result.summarize.keyPoints.map((point: string, i: number) => (
                      <li key={i} className="text-sm text-gray-300">{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Legal Issues Results */}
          {result.legal_issues && (
            <div className="bg-white/10 border border-white/20 rounded-xl p-5 backdrop-blur-sm">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Legal Issues Detected</span>
              </h4>
              <div className="space-y-3">
                {result.legal_issues.issues?.map((issue: LegalIssue, i: number) => (
                  <div key={i} className="bg-white/5 rounded-lg p-3">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium w-fit ${
                        issue.severity === 'high' ? 'bg-red-500/20 text-red-300' :
                        issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {issue.severity}
                      </span>
                      <h5 className="text-white font-medium flex-1 whitespace-nowrap truncate">{issue.title}</h5>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{issue.description}</p>
                    <p className="text-sm text-green-400">💡 {issue.recommendation}</p>
                  </div>
                ))}
              </div>
              {result.legal_issues.overallRisk && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-sm text-gray-400">
                    Overall Risk: <span className={`font-semibold ${
                      result.legal_issues.overallRisk === 'high' ? 'text-red-400' :
                      result.legal_issues.overallRisk === 'medium' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>{result.legal_issues.overallRisk.toUpperCase()}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Field Validation Results */}
          {result.validate_fields && (
            <div className="bg-white/10 border border-white/20 rounded-xl p-5 backdrop-blur-sm">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Field Validation</span>
              </h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Completeness</p>
                  <p className="text-2xl font-bold text-white">{result.validate_fields.completenessScore}%</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Quality</p>
                  <p className="text-2xl font-bold text-white">{result.validate_fields.qualityScore}%</p>
                </div>
              </div>
              {result.validate_fields.validationIssues && result.validate_fields.validationIssues.length > 0 && (
                <div className="space-y-2">
                  {result.validate_fields.validationIssues.map((issue: ValidationIssue, i: number) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3">
                      <p className="text-white text-sm font-medium">{issue.field}</p>
                      <p className="text-gray-400 text-sm">{issue.issue}</p>
                      <p className="text-green-400 text-sm mt-1">→ {issue.suggestion}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Insights Results */}
          {result.extract_insights && (
            <div className="bg-white/10 border border-white/20 rounded-xl p-5 backdrop-blur-sm">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2 whitespace-nowrap">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Key Insights</span>
              </h4>
              <div className="space-y-3">
                {result.extract_insights.insights?.map((insight: Insight, i: number) => (
                  <div key={i} className="bg-white/5 rounded-lg p-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <h5 className="text-white font-medium whitespace-nowrap truncate flex-1">{insight.title}</h5>
                      {insight.priority && (
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium w-fit ${
                          insight.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                          insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {insight.priority}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{insight.description}</p>
                  </div>
                ))}
              </div>
              {result.extract_insights.nextSteps && result.extract_insights.nextSteps.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-sm font-medium text-gray-400 mb-2">Next Steps:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {result.extract_insights.nextSteps.map((step: string, i: number) => (
                      <li key={i} className="text-sm text-gray-300">{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* No Results Yet */}
      {!result && !loading && !error && (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
          <p className="text-gray-400">
            Choose an analysis type above to get AI-powered insights
          </p>
        </div>
      )}
    </div>
  );
}

