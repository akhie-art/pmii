"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Minus,
  RotateCcw,
  RotateCw,
  RemoveFormatting,
  Type
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Tulis isi lengkap artikel di sini...",
  minHeight = "280px"
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const savedSelectionRef = useRef<Range | null>(null);

  // Sync external value changes into editor
  useEffect(() => {
    if (editorRef.current && !isEditingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
        updateStats();
      }
    }
  }, [value]);

  const updateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setCharCount(text.length);
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    isEditingRef.current = true;
    const html = editorRef.current.innerHTML;
    onChange(html);
    updateStats();
    setTimeout(() => {
      isEditingRef.current = false;
    }, 50);
  };

  const executeCommand = (command: string, arg?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand(command, false, arg);
    handleInput();
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedSelectionRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  const handleOpenLinkModal = () => {
    saveSelection();
    setLinkUrl("");
    setShowLinkInput(true);
  };

  const handleApplyLink = () => {
    if (!linkUrl.trim()) {
      setShowLinkInput(false);
      return;
    }
    restoreSelection();
    let finalUrl = linkUrl.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://") && !finalUrl.startsWith("#")) {
      finalUrl = `https://${finalUrl}`;
    }
    executeCommand("createLink", finalUrl);
    setShowLinkInput(false);
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 select-none">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1 mr-1 border-r border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => executeCommand("undo")}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Urungkan (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("redo")}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Ulangi (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 pr-1 mr-1 border-r border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => executeCommand("formatBlock", "<p>")}
            className="px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer flex items-center gap-1"
            title="Paragraf Normal"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="text-[11px]">P</span>
          </button>
          <button
            type="button"
            onClick={() => executeCommand("formatBlock", "<h2>")}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Heading 2 (Sub-judul)"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("formatBlock", "<h3>")}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Heading 3 (Poin Penting)"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Formatting: Bold, Italic, Underline, Strike */}
        <div className="flex items-center gap-0.5 pr-1 mr-1 border-r border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => executeCommand("bold")}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Tebal (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("italic")}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Miring (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("underline")}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Garis Bawah (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("strikeThrough")}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Coretan"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-0.5 pr-1 mr-1 border-r border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => executeCommand("insertUnorderedList")}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Daftar Poin (Bullet List)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("insertOrderedList")}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Daftar Nomor (Numbered List)"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("formatBlock", "<blockquote>")}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Kutipan (Blockquote)"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 pr-1 mr-1 border-r border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => executeCommand("justifyLeft")}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Rata Kiri"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("justifyCenter")}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Rata Tengah"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("justifyRight")}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Rata Kanan"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("justifyFull")}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Rata Kanan-Kiri"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Links, Divider & Clear Format */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleOpenLinkModal}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Sisipkan Tautan (Link)"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("insertHorizontalRule")}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Garis Pembatas Horizontal"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("removeFormat")}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Hapus Format"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* QUICK LINK INPUT BAR */}
      {showLinkInput && (
        <div className="flex items-center gap-2 p-2 bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900/50 text-xs">
          <LinkIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <input
            type="url"
            autoFocus
            placeholder="Masukkan URL tautan (contoh: https://pmii.id)..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApplyLink();
              } else if (e.key === "Escape") {
                setShowLinkInput(false);
              }
            }}
            className="flex-1 px-2.5 py-1 text-xs rounded border border-blue-300 dark:border-blue-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleApplyLink}
            className="px-2.5 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
          >
            Terapkan
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className="px-2 py-1 text-xs font-medium rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
          >
            Batal
          </button>
        </div>
      )}

      {/* EDITABLE CANVAS */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          data-placeholder={placeholder}
          style={{ minHeight }}
          className="p-4 text-sm text-zinc-900 dark:text-zinc-100 outline-none leading-relaxed overflow-y-auto max-h-[420px] prose dark:prose-invert prose-sm max-w-none focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-400 empty:before:pointer-events-none"
        />
      </div>

      {/* STATUS BAR: Word Count, Char Count, Read Time */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 select-none">
        <div className="flex items-center gap-3">
          <span>{wordCount} kata</span>
          <span>•</span>
          <span>{charCount} karakter</span>
        </div>
        <div>
          <span>Estimasi baca: ~{Math.max(1, Math.ceil(wordCount / 180))} mnt</span>
        </div>
      </div>
    </div>
  );
}
