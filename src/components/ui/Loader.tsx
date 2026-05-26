"use client";

import React, { useEffect, useState } from "react";
import { useLoadingStore } from "@/store/loadingStore";

export const ApiLoadingIndicator: React.FC = () => {
  const isLoading = useLoadingStore((state) => state.isLoading);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isLoading) return null;

  return (
    <div className="fixed inset-0 z-999999 flex items-center justify-center bg-gray-400/30 dark:bg-black/50 backdrop-blur-[8px] transition-all duration-300">
      {/* Inline styles for custom animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes custom-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scale-up {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: custom-fade-in 0.2s ease-out forwards;
        }
        .animate-scale-up {
          animation: scale-up 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}} />
      
      <div className="relative flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-theme-xl border border-gray-100 dark:border-gray-800 max-w-xs w-full text-center animate-scale-up mx-4">
        {/* Sleek Gradient Spinner */}
        <div className="relative w-16 h-16 mb-5 flex items-center justify-center">
          {/* Inner pulsating glow */}
          <div className="absolute inset-0 rounded-full bg-brand-500/10 dark:bg-brand-500/5 animate-ping" />
          
          {/* Main spinning ring */}
          <div className="w-14 h-14 rounded-full border-[3px] border-gray-150 dark:border-gray-800" />
          
          {/* Glowing brand primary gradient spinner (Blue brand-500 to green #00a651) */}
          <div className="absolute w-14 h-14 rounded-full border-[3px] border-transparent border-t-brand-500 border-r-[#00a651] animate-spin" />
          
          {/* Center glowing brand dot */}
          <div className="absolute w-3 h-3 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(70,95,255,0.4)] dark:shadow-[0_0_12px_rgba(70,95,255,0.5)]" />
        </div>
        
        <h3 className="text-base font-bold text-gray-800 dark:text-white/90 tracking-wide">
          Đang xử lý
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 px-1 leading-relaxed">
          Hệ thống đang tải dữ liệu, vui lòng đợi trong giây lát...
        </p>
      </div>
    </div>
  );
};
