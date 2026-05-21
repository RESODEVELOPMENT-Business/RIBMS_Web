"use client";
import React, { useState, useRef, useEffect } from "react";

export default function PosPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Track true fullscreen changes (handles Esc key automatically)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;

        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.error("Error attempting to toggle fullscreen:", error);
        }
    };

    return (
        <div 
            ref={containerRef}
            className="relative w-full h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 fullscreen:h-screen"
        >
            {/* Hiệu ứng Loading mượt mà trong lúc Flutter khởi tạo engine */}
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 z-10">
                    <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Đang tải hệ thống POS...
                    </p>
                </div>
            )}

            {/* Nút Fullscreen cao cấp với Glassmorphism */}
            <button
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 z-50 flex items-center justify-center w-10 h-10 rounded-xl bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200/50 dark:border-gray-700/50 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                aria-label="Toggle Fullscreen"
            >
                {isFullscreen ? (
                    // Thu nhỏ (Exit Fullscreen)
                    <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth="2"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            d="M8 4v4H4M16 4v4h4M8 20v-4H4M16 20v-4h4" 
                        />
                    </svg>
                ) : (
                    // Phóng to (Go Fullscreen)
                    <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth="2"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" 
                        />
                    </svg>
                )}
            </button>

            <iframe
                src="/pos-app/index.html"
                className="w-full h-full border-0"
                title="Flutter POS App"
                onLoad={() => setIsLoading(false)}
                allow="camera; microphone; clipboard-write; geolocation" // Cho phép POS truy cập các quyền cơ bản nếu cần
            />
        </div>
    );
}
