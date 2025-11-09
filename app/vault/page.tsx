"use client";

import Image from "next/image";
import { UploadDropzone } from "@/components/UploadDropzone";
import VaultGrid from "@/components/vault/VaultGrid";
import { useVaultStore } from "@/store/useVaultStore";
import { FolderOpen, Sparkles } from "lucide-react";

export default function AppVaultPage() {
  const docs = useVaultStore((s) => s.docs);

  return (
    <div className="relative min-h-screen">
      <div className="pt-10 md:pt-2 max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold leading-tight text-white">
            Vault
          </h1>
          <p className="mt-2 text-xs text-gray-300">
            Manage and organize your real estate documents
          </p>
        </div>

        {/* Image and Upload Section - Side by side on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
          {/* Left: Image */}
          <div className="flex flex-col justify-center items-center order-2 md:order-1">
            <div className="relative w-full max-w-md aspect-square mx-auto flex items-center justify-center">
              <Image 
                src="/a.png" 
                alt="Vault illustration" 
                fill 
                className="object-contain" 
              />
            </div>
            <p className="text-xs italic text-gray-300 text-center -mt-10 md:-mt-20">
              Secure Document Management
            </p>
          </div>

          {/* Right: Upload Dropzone */}
          <div className="order-1 md:order-2">
            <UploadDropzone />
          </div>
        </div>

        {/* Documents Grid or Empty State */}
        {docs.length === 0 ? (
          <div className="relative flex flex-col items-center justify-center py-8 mt-0">
            {/* Decorative floating elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-blue-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Main Icon */}
            <div className="relative mb-4 z-10">
              <div className="relative">
                <FolderOpen className="w-20 h-20 text-[var(--primary)]/30 animate-float" />
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-7 h-7 text-[var(--primary)] animate-sparkle" />
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="relative text-center space-y-2 z-10 px-4">
              <h3 className="text-xl font-semibold text-white">
                Your vault is empty
              </h3>
              <p className="text-sm text-gray-300 max-w-md mx-auto">
                Upload your first document above to start organizing your real estate files
              </p>
            </div>

            {/* Decorative dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              <div className="w-2 h-2 rounded-full bg-[var(--primary)]/30 animate-bounce-dot"></div>
              <div className="w-2 h-2 rounded-full bg-[var(--primary)]/30 animate-bounce-dot" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-[var(--primary)]/30 animate-bounce-dot" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        ) : (
          <VaultGrid docs={docs} />
        )}
      </div>
    </div>
    </div>
  );
}