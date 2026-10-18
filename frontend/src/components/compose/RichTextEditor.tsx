'use client';

import React, { useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import UnderlineExtension from '@tiptap/extension-underline';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    ListOrdered,
    Link as LinkIcon,
    Quote,
    Code,
    Paperclip,
    Undo,
    Redo,
    X,
    FileText,
    FileImage,
    FileArchive,
    File,
    AlignLeft,
    AlignCenter,
    AlignRight,
} from 'lucide-react';

interface AttachedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    dataUrl: string;
}

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
}

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachments, setAttachments] = useState<AttachedFile[]>([]);

    const editor = useEditor({
        extensions: [
            StarterKit,
            UnderlineExtension,
            LinkExtension.configure({
                openOnClick: false,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) return null;

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                const newFile: AttachedFile = {
                    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    dataUrl,
                };

                setAttachments((prev) => [...prev, newFile]);

                if (file.type.startsWith('image/')) {
                    const imgHtml = `<p><img src="${dataUrl}" alt="${file.name}" style="max-width: 100%; max-height: 400px; border-radius: 12px; margin: 8px 0; border: 1px solid #e5e7eb;" /></p>`;
                    editor.chain().focus().insertContent(imgHtml).run();
                } else {
                    const linkHtml = `<p><a href="${dataUrl}" download="${file.name}" style="color: #00a854; text-decoration: underline; font-weight: 500;">📎 ${file.name} (${formatFileSize(file.size)})</a></p>`;
                    editor.chain().focus().insertContent(linkHtml).run();
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removeAttachment = (id: string) => {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <FileImage className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
        if (type.includes('pdf') || type.includes('word') || type.includes('text'))
            return <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />;
        if (type.includes('zip') || type.includes('rar') || type.includes('tar'))
            return <FileArchive className="w-4 h-4 text-amber-600 flex-shrink-0" />;
        return <File className="w-4 h-4 text-gray-500 flex-shrink-0" />;
    };

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs font-sans transition-all focus-within:border-[#00a854]">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt,.csv,.zip"
            />

            {/* Top Formatting Toolbar matching Figma */}
            <div className="px-3 py-2 border-b border-gray-100 bg-[#f8f9fa] flex items-center space-x-1 text-gray-600 flex-wrap gap-y-1">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="p-1.5 rounded hover:bg-gray-200/70 hover:text-gray-900 disabled:opacity-30 transition-colors"
                    title="Undo"
                >
                    <Undo className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="p-1.5 rounded hover:bg-gray-200/70 hover:text-gray-900 disabled:opacity-30 transition-colors"
                    title="Redo"
                >
                    <Redo className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-3.5 bg-gray-200 mx-1" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`px-1.5 py-1 rounded text-xs font-bold transition-colors ${
                        editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200/70'
                    }`}
                    title="Heading"
                >
                    TT
                </button>

                <div className="w-px h-3.5 bg-gray-200 mx-1" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded transition-colors ${
                        editor.isActive('bold') ? 'bg-gray-200 text-gray-900 font-bold' : 'hover:bg-gray-200/70'
                    }`}
                    title="Bold"
                >
                    <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded transition-colors ${
                        editor.isActive('italic') ? 'bg-gray-200 text-gray-900 italic' : 'hover:bg-gray-200/70'
                    }`}
                    title="Italic"
                >
                    <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-1.5 rounded transition-colors ${
                        editor.isActive('underline') ? 'bg-gray-200 text-gray-900 underline' : 'hover:bg-gray-200/70'
                    }`}
                    title="Underline"
                >
                    <UnderlineIcon className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`p-1.5 rounded transition-colors ${
                        editor.isActive('strike') ? 'bg-gray-200 text-gray-900 line-through' : 'hover:bg-gray-200/70'
                    }`}
                    title="Strikethrough"
                >
                    <Strikethrough className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-3.5 bg-gray-200 mx-1" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1.5 rounded transition-colors ${
                        editor.isActive('bulletList') ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200/70'
                    }`}
                    title="Bullet List"
                >
                    <List className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-1.5 rounded transition-colors ${
                        editor.isActive('orderedList') ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200/70'
                    }`}
                    title="Ordered List"
                >
                    <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-1.5 rounded transition-colors ${
                        editor.isActive('blockquote') ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200/70'
                    }`}
                    title="Quote"
                >
                    <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={`p-1.5 rounded transition-colors ${
                        editor.isActive('codeBlock') ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200/70'
                    }`}
                    title="Code"
                >
                    <Code className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={setLink}
                    className={`p-1.5 rounded transition-colors ${
                        editor.isActive('link') ? 'bg-gray-200 text-gray-900' : 'hover:bg-gray-200/70'
                    }`}
                    title="Link"
                >
                    <LinkIcon className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded hover:bg-gray-200/70 hover:text-gray-900 transition-colors"
                    title="Attach File"
                >
                    <Paperclip className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Editable Content Area */}
            <div
                className="p-4 min-h-[220px] bg-white text-gray-900 cursor-text"
                onClick={() => {
                    if (editor && !editor.isFocused) {
                        editor.commands.focus('end');
                    }
                }}
            >
                <EditorContent
                    editor={editor}
                    className="prose max-w-none text-xs text-gray-900 focus:outline-none flex-1 min-h-[200px] leading-relaxed [&_*]:outline-none"
                />

                {/* Attachments Preview */}
                {attachments.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Attachments ({attachments.length})
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {attachments.map((att) => (
                                <div
                                    key={att.id}
                                    className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700 font-medium"
                                >
                                    {getFileIcon(att.type)}
                                    <span className="max-w-[140px] truncate">{att.name}</span>
                                    <span className="text-[10px] text-gray-400">
                                        ({formatFileSize(att.size)})
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeAttachment(att.id);
                                        }}
                                        className="p-0.5 rounded-full hover:text-red-500 text-gray-400 transition-colors ml-1"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
