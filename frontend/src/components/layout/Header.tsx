'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, RefreshCw, Menu, X, Plus } from 'lucide-react';
import { User } from '@/types';

interface HeaderProps {
    user?: User | null;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
}

export default function Header({ searchQuery = '', onSearchChange }: HeaderProps) {
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    return (
        <header className="h-14 border-b border-gray-100 bg-white px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 font-sans">
            {/* Mobile Menu Toggle & Brand */}
            <div className="flex items-center space-x-3 md:hidden">
                <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="text-gray-600 hover:text-gray-900 p-1.5 rounded-lg bg-gray-50 border border-gray-200"
                    aria-label="Toggle Navigation Menu"
                >
                    {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
                <span className="text-lg font-black text-gray-900">ONE</span>
            </div>

            {/* Figma-Style Pill Search Bar */}
            <div className="flex-1 max-w-xl mx-2 md:mx-0">
                <div className="relative w-full">
                    <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        className="w-full bg-[#f1f3f4] border border-transparent focus:border-[#00a854] focus:bg-white text-gray-900 text-xs pl-9 pr-16 py-2 rounded-full placeholder-gray-400 transition-colors focus:outline-none"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 text-gray-400">
                        <SlidersHorizontal className="w-3.5 h-3.5 hover:text-gray-600 cursor-pointer" />
                        <RefreshCw className="w-3.5 h-3.5 hover:text-gray-600 cursor-pointer" />
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {showMobileMenu && (
                <div className="md:hidden fixed inset-x-0 top-14 bg-white border-b border-gray-200 shadow-xl p-4 space-y-2 z-50">
                    <Link
                        href="/dashboard/compose"
                        onClick={() => setShowMobileMenu(false)}
                        className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-full border-2 border-[#00a854] bg-[#e6f4ea] text-[#00a854] font-semibold text-xs"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Compose</span>
                    </Link>

                    <div className="space-y-1 pt-2">
                        <Link
                            href="/dashboard/scheduled"
                            onClick={() => setShowMobileMenu(false)}
                            className="flex items-center space-x-2.5 p-2 rounded-xl bg-[#e6f4ea] text-[#00a854] font-semibold text-xs"
                        >
                            <span>Scheduled</span>
                        </Link>

                        <Link
                            href="/dashboard/sent"
                            onClick={() => setShowMobileMenu(false)}
                            className="flex items-center space-x-2.5 p-2 rounded-xl text-gray-700 hover:bg-gray-50 font-medium text-xs"
                        >
                            <span>Sent</span>
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
