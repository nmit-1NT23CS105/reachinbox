'use client';

import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface RecipientInputProps {
    recipients: string[];
    onRecipientsChange: (newList: string[]) => void;
}

export default function RecipientInput({ recipients, onRecipientsChange }: RecipientInputProps) {
    const [inputValue, setInputValue] = useState('');

    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    };

    const addRecipient = (emailStr: string) => {
        const email = emailStr.trim();
        if (email && isValidEmail(email) && !recipients.includes(email)) {
            onRecipientsChange([...recipients, email]);
            setInputValue('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addRecipient(inputValue);
        } else if (e.key === 'Backspace' && !inputValue && recipients.length > 0) {
            onRecipientsChange(recipients.slice(0, -1));
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        const emails = pastedData.split(/[\s,;]+/).filter(isValidEmail);
        if (emails.length > 0) {
            const combined = Array.from(new Set([...recipients, ...emails]));
            onRecipientsChange(combined);
            setInputValue('');
        }
    };

    const removeRecipient = (indexToRemove: number) => {
        onRecipientsChange(recipients.filter((_, idx) => idx !== indexToRemove));
    };

    // Show 3 chips + counter badge matching Figma "lamis@gmail.com lamis@gmail.com dlane@gmail.com +4"
    const displayLimit = 3;
    const visibleRecipients = recipients.slice(0, displayLimit);
    const remainingCount = recipients.length - displayLimit;

    return (
        <div className="flex flex-wrap items-center gap-1.5 min-h-[32px] w-full">
            {visibleRecipients.map((email, idx) => (
                <span
                    key={idx}
                    className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#e6f4ea] text-[#00a854] border border-[#a8dab5] text-xs font-medium"
                >
                    <span>{email}</span>
                    <button
                        type="button"
                        onClick={() => removeRecipient(idx)}
                        className="hover:text-green-800 focus:outline-none ml-0.5"
                    >
                        <X className="w-3 h-3 text-[#00a854]" />
                    </button>
                </span>
            ))}

            {remainingCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#00a854] border border-[#a8dab5] text-xs font-semibold">
                    +{remainingCount}
                </span>
            )}

            <input
                type="email"
                placeholder={recipients.length === 0 ? 'recipient@example.com' : 'Add another recipient...'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onBlur={() => inputValue && addRecipient(inputValue)}
                className="flex-1 min-w-[150px] border-none outline-none text-xs text-gray-900 placeholder-gray-400 bg-transparent py-1"
            />
        </div>
    );
}
