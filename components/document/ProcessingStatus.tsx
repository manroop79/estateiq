"use client";

import { CheckCircle, AlertTriangle, Clock, Loader2, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessingStatusProps {
  status: string;
  className?: string;
}

export function ProcessingStatus({ status, className }: ProcessingStatusProps) {
  const statusConfig: Record<string, {
    icon: React.ReactNode;
    label: string;
    bgClass: string;
    textClass: string;
    pulseClass?: string;
  }> = {
    uploaded: {
      icon: <Clock className="w-4 h-4" />,
      label: "Uploaded",
      bgClass: "bg-gray-500/20",
      textClass: "text-gray-300",
    },
    processing: {
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      label: "Processing",
      bgClass: "bg-blue-500/20",
      textClass: "text-blue-400",
      pulseClass: "animate-pulse",
    },
    extracted: {
      icon: <Info className="w-4 h-4" />,
      label: "Extracted",
      bgClass: "bg-cyan-500/20",
      textClass: "text-cyan-400",
    },
    checked: {
      icon: <CheckCircle className="w-4 h-4" />,
      label: "Verified",
      bgClass: "bg-green-500/20",
      textClass: "text-green-400",
    },
    ready: {
      icon: <CheckCircle className="w-4 h-4" />,
      label: "Ready",
      bgClass: "bg-green-500/20",
      textClass: "text-green-400",
    },
    needs_info: {
      icon: <AlertTriangle className="w-4 h-4" />,
      label: "Needs Info",
      bgClass: "bg-yellow-500/20",
      textClass: "text-yellow-400",
    },
    suspect: {
      icon: <AlertTriangle className="w-4 h-4" />,
      label: "Suspect",
      bgClass: "bg-orange-500/20",
      textClass: "text-orange-400",
    },
    failed: {
      icon: <XCircle className="w-4 h-4" />,
      label: "Failed",
      bgClass: "bg-red-500/20",
      textClass: "text-red-400",
    },
  };

  const config = statusConfig[status.toLowerCase()] || statusConfig.uploaded;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300",
        config.bgClass,
        config.textClass,
        config.pulseClass,
        "border-current/30",
        className
      )}
    >
      {config.icon}
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
}
