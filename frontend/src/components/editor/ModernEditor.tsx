"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table";
import { TableHeader } from "@tiptap/extension-table";
import Typography from "@tiptap/extension-typography";
import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link as LinkIcon,
  Link2Off,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Image as ImageIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Undo,
  Redo,
  Type,
  Highlighter,
  Plus,
  Trash2,
  MoreHorizontal,
  FileText,
  Sparkles,
  Columns,
  RowsIcon,
  X,
  Upload,
  FileUp,
  Loader2,
} from "lucide-react";
import mammoth from "mammoth";
import { cn } from "@/lib/utils";

interface ModernEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

// Link input popup component
function LinkPopup({
  editor,
  onClose,
}: {
  editor: any;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(editor.getAttributes("link").href || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url.startsWith("http") ? url : `https://${url}` })
        .run();
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 bg-terminal-bg-secondary rounded-lg border border-terminal-border shadow-xl">
      <input
        ref={inputRef}
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL..."
        className="w-64 px-3 py-1.5 text-sm bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-primary"
      />
      <button
        type="submit"
        className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
      >
        Apply
      </button>
      {editor.isActive("link") && (
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().unsetLink().run();
            onClose();
          }}
          className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md"
          title="Remove link"
        >
          <Link2Off className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}

// Toolbar button component
function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
  className,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-2 rounded-md transition-all duration-150",
        isActive
          ? "bg-primary/20 text-primary"
          : "hover:bg-terminal-bg-elevated text-muted-foreground hover:text-foreground",
        disabled && "opacity-30 cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

// Divider component
function ToolbarDivider() {
  return <div className="w-px h-6 bg-terminal-border mx-1" />;
}

export function ModernEditor({
  content,
  onChange,
  placeholder = "Start writing your masterpiece...",
  className,
  onImageUpload,
}: ModernEditorProps) {
  const [showLinkPopup, setShowLinkPopup] = useState(false);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [showDocumentPopup, setShowDocumentPopup] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImportingDocument, setIsImportingDocument] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline decoration-primary/50 hover:decoration-primary cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full mx-auto my-4",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse border border-terminal-border my-4",
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-terminal-border p-2",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-terminal-border p-2 bg-terminal-bg-elevated font-semibold",
        },
      }),
      Typography,
      CharacterCount,
      Highlight.configure({
        HTMLAttributes: {
          class: "bg-yellow-500/30 rounded px-0.5",
        },
      }),
      TextStyle,
      Color,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-invert max-w-none focus:outline-none min-h-[400px] px-8 py-6",
          "prose-headings:font-bold prose-headings:text-foreground",
          "prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4",
          "prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3",
          "prose-h3:text-xl prose-h3:mt-4 prose-h3:mb-2",
          "prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4",
          "prose-strong:text-foreground prose-strong:font-bold",
          "prose-em:text-foreground prose-em:italic",
          "prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4",
          "prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4",
          "prose-li:text-foreground prose-li:mb-1",
          "prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground",
          "prose-code:bg-terminal-bg-elevated prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono",
          "prose-pre:bg-terminal-bg-elevated prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto",
          "prose-a:text-primary prose-a:underline prose-a:decoration-primary/50 hover:prose-a:decoration-primary",
          "prose-img:rounded-lg prose-img:mx-auto"
        ),
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            handleImageUpload(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
              const file = item.getAsFile();
              if (file) {
                event.preventDefault();
                handleImageUpload(file);
                return true;
              }
            }
          }
        }
        return false;
      },
    },
  });

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!onImageUpload) {
      // Fallback to base64 for demo
      const reader = new FileReader();
      reader.onload = () => {
        editor?.chain().focus().setImage({ src: reader.result as string }).run();
      };
      reader.readAsDataURL(file);
      return;
    }

    setIsUploading(true);
    try {
      const url = await onImageUpload(file);
      editor?.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      console.error("Failed to upload image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Insert image from URL
  const insertImageFromUrl = () => {
    if (imageUrl) {
      editor?.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
      setShowImagePopup(false);
    }
  };

  // Handle document import (Word/DOCX)
  const handleDocumentImport = async (file: File) => {
    setIsImportingDocument(true);
    try {
      const arrayBuffer = await file.arrayBuffer();

      if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Parse Word document using mammoth
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (result.value) {
          // Insert the HTML content at the current cursor position
          editor?.chain().focus().insertContent(result.value).run();
        }
        if (result.messages.length > 0) {
          console.log('Mammoth conversion messages:', result.messages);
        }
      } else if (file.name.endsWith('.txt') || file.type === 'text/plain') {
        // Handle plain text files
        const text = await file.text();
        const paragraphs = text.split('\n\n').filter(p => p.trim());
        const html = paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
        editor?.chain().focus().insertContent(html).run();
      } else if (file.name.endsWith('.html') || file.name.endsWith('.htm') || file.type === 'text/html') {
        // Handle HTML files
        const html = await file.text();
        // Extract body content if full HTML document
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const content = bodyMatch ? bodyMatch[1] : html;
        editor?.chain().focus().insertContent(content).run();
      } else if (file.name.endsWith('.md') || file.type === 'text/markdown') {
        // Handle Markdown files - basic conversion
        const text = await file.text();
        // Convert basic markdown to HTML
        let html = text
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^# (.*$)/gim, '<h1>$1</h1>')
          .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/gim, '<em>$1</em>')
          .replace(/\n\n/gim, '</p><p>')
          .replace(/\n/gim, '<br>');
        html = '<p>' + html + '</p>';
        editor?.chain().focus().insertContent(html).run();
      } else {
        alert('Unsupported file type. Please use .docx, .txt, .html, or .md files.');
        return;
      }

      setShowDocumentPopup(false);
    } catch (error) {
      console.error('Failed to import document:', error);
      alert('Failed to import document. Please try again.');
    } finally {
      setIsImportingDocument(false);
      if (documentInputRef.current) {
        documentInputRef.current.value = '';
      }
    }
  };

  if (!editor) {
    return (
      <div className={cn("animate-pulse bg-terminal-bg-secondary rounded-lg h-96", className)} />
    );
  }

  return (
    <div className={cn("rounded-lg border border-terminal-border overflow-hidden bg-terminal-bg-secondary", className)}>
      {/* Main Toolbar */}
      <div className="flex items-center gap-0.5 p-2 border-b border-terminal-border bg-terminal-bg flex-wrap">
        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Text Style */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive("highlight")}
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Block Elements */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Link */}
        <div className="relative">
          <ToolbarButton
            onClick={() => setShowLinkPopup(!showLinkPopup)}
            isActive={editor.isActive("link") || showLinkPopup}
            title="Insert Link (Ctrl+K)"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          {showLinkPopup && (
            <div className="absolute top-full left-0 mt-2 z-50">
              <LinkPopup editor={editor} onClose={() => setShowLinkPopup(false)} />
            </div>
          )}
        </div>

        {/* Image */}
        <div className="relative">
          <ToolbarButton
            onClick={() => setShowImagePopup(!showImagePopup)}
            isActive={showImagePopup}
            title="Insert Image"
          >
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
          {showImagePopup && (
            <div className="absolute top-full left-0 mt-2 z-50 p-3 bg-terminal-bg-secondary rounded-lg border border-terminal-border shadow-xl w-72">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3 py-1.5 text-sm bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={insertImageFromUrl}
                      disabled={!imageUrl}
                      className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-terminal-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-terminal-bg-secondary px-2 text-muted-foreground">or</span>
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full py-2 border-2 border-dashed border-terminal-border rounded-md text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {isUploading ? "Uploading..." : "Upload from computer"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                      setShowImagePopup(false);
                    }
                  }}
                />
              </div>
              <button
                onClick={() => setShowImagePopup(false)}
                className="absolute top-2 right-2 p-1 hover:bg-terminal-bg-elevated rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Insert Table"
        >
          <TableIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Document Import */}
        <div className="relative">
          <ToolbarButton
            onClick={() => setShowDocumentPopup(!showDocumentPopup)}
            isActive={showDocumentPopup}
            title="Import Document"
          >
            <FileUp className="h-4 w-4" />
          </ToolbarButton>
          {showDocumentPopup && (
            <div className="absolute top-full left-0 mt-2 z-50 p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border shadow-xl w-80">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm mb-1">Import Document</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Import content from Word documents, text files, HTML, or Markdown files.
                  </p>
                </div>
                <button
                  onClick={() => documentInputRef.current?.click()}
                  disabled={isImportingDocument}
                  className="w-full py-3 border-2 border-dashed border-terminal-border rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex flex-col items-center gap-2"
                >
                  {isImportingDocument ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6" />
                      <span>Choose file to import</span>
                    </>
                  )}
                </button>
                <input
                  ref={documentInputRef}
                  type="file"
                  accept=".docx,.doc,.txt,.html,.htm,.md,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/html,text/markdown"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleDocumentImport(file);
                    }
                  }}
                />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Supported formats:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>.docx - Microsoft Word</li>
                    <li>.txt - Plain text</li>
                    <li>.html - Web pages</li>
                    <li>.md - Markdown</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setShowDocumentPopup(false)}
                className="absolute top-2 right-2 p-1 hover:bg-terminal-bg-elevated rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Word count */}
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground px-2">
          <span>{editor.storage.characterCount.words()} words</span>
          <span>•</span>
          <span>{editor.storage.characterCount.characters()} chars</span>
        </div>
      </div>

      {/* Bubble Menu - appears on text selection */}
      {editor && (
        <BubbleMenu
          editor={editor}
          className="flex items-center gap-0.5 p-1 bg-terminal-bg-secondary rounded-lg border border-terminal-border shadow-xl"
        >
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold"
            className="p-1.5"
          >
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic"
            className="p-1.5"
          >
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline"
            className="p-1.5"
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
            className="p-1.5"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolbarButton>
          <div className="w-px h-4 bg-terminal-border mx-0.5" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive("highlight")}
            title="Highlight"
            className="p-1.5"
          >
            <Highlighter className="h-3.5 w-3.5" />
          </ToolbarButton>
          <div className="w-px h-4 bg-terminal-border mx-0.5" />
          <ToolbarButton
            onClick={() => {
              const previousUrl = editor.getAttributes("link").href;
              const url = window.prompt("Enter URL:", previousUrl);
              if (url === null) return;
              if (url === "") {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                return;
              }
              editor.chain().focus().extendMarkRange("link").setLink({ href: url.startsWith("http") ? url : `https://${url}` }).run();
            }}
            isActive={editor.isActive("link")}
            title="Link"
            className="p-1.5"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
        </BubbleMenu>
      )}

      {/* Floating Menu - appears on empty lines */}
      {editor && (
        <FloatingMenu
          editor={editor}
          className="flex items-center gap-0.5 p-1 bg-terminal-bg-secondary rounded-lg border border-terminal-border shadow-xl"
        >
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Heading 1"
            className="p-1.5"
          >
            <Heading1 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
            className="p-1.5"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <div className="w-px h-4 bg-terminal-border mx-0.5" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
            className="p-1.5"
          >
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
            className="p-1.5"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>
          <div className="w-px h-4 bg-terminal-border mx-0.5" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Quote"
            className="p-1.5"
          >
            <Quote className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setShowImagePopup(true)}
            title="Image"
            className="p-1.5"
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
        </FloatingMenu>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Editor Styles */}
      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }

        .ProseMirror img {
          max-width: 100%;
          height: auto;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ProseMirror img:hover {
          box-shadow: 0 0 0 3px hsl(var(--primary) / 0.3);
        }

        .ProseMirror img.ProseMirror-selectednode {
          box-shadow: 0 0 0 3px hsl(var(--primary));
        }

        .ProseMirror table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }

        .ProseMirror th,
        .ProseMirror td {
          border: 1px solid hsl(var(--border));
          padding: 0.5rem;
          vertical-align: top;
          position: relative;
        }

        .ProseMirror th {
          background: hsl(var(--muted));
          font-weight: 600;
        }

        .ProseMirror .selectedCell {
          background: hsl(var(--primary) / 0.1);
        }

        .ProseMirror hr {
          border: none;
          border-top: 2px solid hsl(var(--border));
          margin: 2rem 0;
        }

        .ProseMirror blockquote {
          border-left: 4px solid hsl(var(--primary));
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }

        .ProseMirror pre {
          background: hsl(var(--muted));
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          font-family: monospace;
        }

        .ProseMirror code {
          background: hsl(var(--muted));
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.9em;
        }

        .ProseMirror pre code {
          background: none;
          padding: 0;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        .ProseMirror li {
          margin: 0.25rem 0;
        }

        .ProseMirror li p {
          margin: 0;
        }

        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }

        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .ProseMirror a {
          color: hsl(var(--primary));
          text-decoration: underline;
          cursor: pointer;
        }

        .ProseMirror a:hover {
          text-decoration-thickness: 2px;
        }

        .ProseMirror mark {
          background-color: hsl(48 96% 53% / 0.3);
          border-radius: 0.125rem;
          padding: 0 0.125rem;
        }
      `}</style>
    </div>
  );
}

export default ModernEditor;
