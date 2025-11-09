"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Users,
  Home,
  DollarSign,
  Calendar,
  Scale,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ExtractedEntitiesPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  document: any;
}

const categoryIcons: Record<string, React.ReactNode> = {
  party: <Users className="w-5 h-5" />,
  property: <Home className="w-5 h-5" />,
  financial: <DollarSign className="w-5 h-5" />,
  date: <Calendar className="w-5 h-5" />,
  legal: <Scale className="w-5 h-5" />,
};

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  party: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
  },
  property: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  financial: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-500/30",
  },
  date: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/30",
  },
  legal: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
  },
};

export function ExtractedEntitiesPanel({ document }: ExtractedEntitiesPanelProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>("party");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Support both old 'extracted' field and new 'entities' field
  const extracted = document.extracted || document.metadata || {};
  const entities = document.entities || extracted.entities || [];
  const documentType = extracted.documentType;
  const completeness = extracted.completeness || 0;
  const riskScore = extracted.riskScore || 0;
  const flags = extracted.flags || [];

  // Group entities by category
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entitiesByCategory = entities.reduce((acc: any, entity: any) => {
    if (!acc[entity.category]) {
      acc[entity.category] = [];
    }
    acc[entity.category].push(entity);
    return acc;
  }, {});

  const categories = Object.keys(entitiesByCategory).sort();

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden flex flex-col h-[calc(100vh-12rem)] shadow-2xl">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--primary-2)]/5 animate-gradient-shift opacity-50"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--primary)]/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--primary-2)]/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-[var(--accent)]/8 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '0.75s' }}></div>
      </div>
      
      {/* Header with Metrics */}
      <div className="relative px-6 py-4 border-b border-white/10 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary-2)]/10 z-10">
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-white whitespace-nowrap">Extracted Data</h2>
            {documentType && (
              <div className="inline-flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 flex-shrink-0">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-blue-300 whitespace-nowrap truncate">{documentType}</span>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* Completeness */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]",
              completeness >= 80
                ? "bg-green-500/10 border-green-500/30"
                : completeness >= 50
                ? "bg-yellow-500/10 border-yellow-500/30"
                : "bg-red-500/10 border-red-500/30"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Completeness</span>
              {completeness >= 80 ? (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-400" />
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className={cn(
                "text-2xl font-bold",
                completeness >= 80 ? "text-green-400" : completeness >= 50 ? "text-yellow-400" : "text-red-400"
              )}>
                {completeness}%
              </span>
            </div>
            {/* Progress Bar */}
            <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completeness}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  completeness >= 80
                    ? "bg-green-500"
                    : completeness >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
                )}
              />
            </div>
          </motion.div>

          {/* Risk Score */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]",
              riskScore >= 70
                ? "bg-red-500/10 border-red-500/30"
                : riskScore >= 40
                ? "bg-yellow-500/10 border-yellow-500/30"
                : "bg-green-500/10 border-green-500/30"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Risk Score</span>
              {riskScore >= 70 ? (
                <TrendingUp className="w-4 h-4 text-red-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-400" />
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className={cn(
                "text-2xl font-bold",
                riskScore >= 70 ? "text-red-400" : riskScore >= 40 ? "text-yellow-400" : "text-green-400"
              )}>
                {riskScore}
              </span>
              <span className="text-gray-500 text-sm">/100</span>
            </div>
            {/* Progress Bar */}
            <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${riskScore}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  riskScore >= 70
                    ? "bg-red-500"
                    : riskScore >= 40
                    ? "bg-yellow-500"
                    : "bg-green-500"
                )}
              />
            </div>
          </motion.div>
        </div>

        {/* Flags */}
        {flags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-3 space-y-2"
          >
            {flags.map((flag: string, index: number) => (
              <div
                key={index}
                className="flex items-start gap-2 text-sm text-yellow-400 bg-yellow-500/10 px-3 py-2 rounded-lg border border-yellow-500/30"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{flag}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Entities List */}
      <div className="relative flex-1 overflow-y-auto p-6 space-y-3 hide-scrollbar z-10">
        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No entities extracted</p>
          </div>
        )}

        {categories.map((category, index) => {
          const categoryEntities = entitiesByCategory[category];
          const isExpanded = expandedCategory === category;
          const colors = categoryColors[category] || categoryColors.legal;

          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "rounded-xl border backdrop-blur-sm overflow-hidden transition-all duration-300",
                colors.bg,
                colors.border
              )}
            >
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", colors.bg, colors.text)}>
                    {categoryIcons[category]}
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-white capitalize">{category}</h3>
                    <p className="text-xs text-gray-400">{categoryEntities.length} field(s)</p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </motion.div>
              </button>

              {/* Entities */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-4 space-y-3">
                      {categoryEntities.map((entity: { key: string; label: string; value?: string; confidence?: number }, entityIndex: number) => (
                        <motion.div
                          key={entity.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: entityIndex * 0.05 }}
                          className="bg-slate-900/50 rounded-lg p-3 hover:bg-slate-900/70 transition-all duration-200 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-gray-400 mb-1">{entity.label}</div>
                              {entity.value ? (
                                <div className="text-sm text-white font-medium break-words">
                                  {entity.value}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 italic">Not found</div>
                              )}
                              {/* Confidence Badge */}
                              {entity.confidence !== undefined && (
                                <div className="mt-2 flex items-center gap-2">
                                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                      className={cn(
                                        "h-full rounded-full transition-all duration-500",
                                        entity.confidence >= 0.7
                                          ? "bg-green-500"
                                          : entity.confidence >= 0.5
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                      )}
                                      style={{ width: `${entity.confidence * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {Math.round(entity.confidence * 100)}%
                                  </span>
                                </div>
                              )}
                            </div>
                            {entity.value && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => entity.value && copyToClipboard(entity.value, entity.key)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                              >
                                {copiedField === entity.key ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
