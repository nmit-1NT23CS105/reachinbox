'use client';

import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Upload, CheckCircle2, AlertTriangle, Trash2, X } from 'lucide-react';

interface CsvUploaderProps {
    onRecipientsUploaded: (validEmails: string[]) => void;
    onClearList?: () => void;
    currentCount?: number;
}

export default function CsvUploader({
    onRecipientsUploaded,
    onClearList,
    currentCount = 0,
}: CsvUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [validCount, setValidCount] = useState<number>(0);
    const [invalidList, setInvalidList] = useState<string[]>([]);
    const [showInvalidModal, setShowInvalidModal] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setFileName(file.name);

        Papa.parse(file, {
            complete: (results) => {
                const rawStrings: string[] = [];

                results.data.forEach((row: any) => {
                    if (typeof row === 'string') {
                        rawStrings.push(row);
                    } else if (Array.isArray(row)) {
                        row.forEach((cell) => typeof cell === 'string' && rawStrings.push(cell));
                    } else if (typeof row === 'object' && row !== null) {
                        Object.values(row).forEach((val) => typeof val === 'string' && rawStrings.push(val));
                    }
                });

                const extracted = rawStrings
                    .flatMap((str) => str.split(/[\s,;]+/))
                    .map((s) => s.trim())
                    .filter(Boolean);

                const valid: string[] = [];
                const invalid: string[] = [];

                extracted.forEach((item) => {
                    if (emailRegex.test(item)) {
                        valid.push(item);
                    } else if (item.length > 3 && item.includes('@')) {
                        invalid.push(item);
                    }
                });

                const uniqueValid = Array.from(new Set(valid));
                setValidCount(uniqueValid.length);
                setInvalidList(invalid);
                setIsProcessing(false);

                if (uniqueValid.length > 0) {
                    onRecipientsUploaded(uniqueValid);
                }
            },
            error: (err) => {
                console.error('CSV Parsing Error:', err);
                setIsProcessing(false);
            },
        });
    };

    return (
        <div className="inline-block">
            <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.txt"
                onChange={handleFileSelect}
                className="hidden"
            />

            {fileName ? (
                <div className="flex items-center space-x-2 bg-[#e6f4ea] border border-[#a8dab5] text-[#00a854] px-3 py-1 rounded-full text-xs font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00a854] flex-shrink-0" />
                    <span className="truncate max-w-[140px]">
                        {fileName} ({validCount} leads)
                    </span>
                    {invalidList.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowInvalidModal(true)}
                            className="text-amber-600 hover:underline text-[10px]"
                        >
                            ({invalidList.length} invalid)
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            setFileName(null);
                            setValidCount(0);
                            setInvalidList([]);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                            onClearList?.();
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                        title="Remove uploaded leads"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="inline-flex items-center space-x-1.5 text-[#00a854] hover:text-[#00875a] font-medium text-xs transition-colors py-1 px-2 rounded-lg hover:bg-[#e6f4ea]"
                    title="Upload CSV or TXT lead list"
                >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isProcessing ? 'Parsing...' : 'Upload List'}</span>
                </button>
            )}

            {/* Invalid leads summary modal */}
            {showInvalidModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 text-gray-900">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                            <div className="flex items-center space-x-2 text-amber-600 font-bold text-xs">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Invalid Formats Skipped</span>
                            </div>
                            <button
                                onClick={() => setShowInvalidModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                            The following entries were skipped because they did not match standard email formats:
                        </p>
                        <div className="bg-gray-50 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1 text-[11px] text-gray-600 font-mono">
                            {invalidList.map((inv, idx) => (
                                <div key={idx}>{inv}</div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowInvalidModal(false)}
                            className="mt-4 w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold"
                        >
                            Understood
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
