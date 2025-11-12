import React, { useEffect, useState, useCallback, memo } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
// CollaborationCursor disabled - causes issues with Firebase provider
// import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
// import { useAwarenessProvider } from '@/hooks/useAwarenessProvider';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo,
  Redo,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DocumentEditorProps {
  documentId: string;
  initialContent?: string;
  ydoc: Y.Doc | null;
  onContentChange?: (content: string) => void;
  readOnly?: boolean;
  userName?: string;
  userColor?: string;
}

/**
 * Rich text editor component using TipTap with real-time collaboration
 * Features: Formatting toolbar, auto-save, character/word count
 */
const DocumentEditorComponent: React.FC<DocumentEditorProps> = ({
  documentId,
  initialContent,
  ydoc,
  onContentChange,
  readOnly = false,
  userName = 'Anonymous',
  userColor = '#1E2A78',
}) => {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Track if we've already initialized content to avoid re-initializing on focus loss
  const isInitializedRef = React.useRef(false);

  // NOTE: CollaborationCursor is disabled for now
  // It requires a complex provider setup that conflicts with our Firebase implementation
  // Content sync works without it - users just won't see each other's cursors

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        // Enable Y.js Collaboration only if ydoc exists
        ...(ydoc
          ? [
              Collaboration.configure({
                document: ydoc,
              }),
            ]
          : []),
      ],
      content: '<p></p>', // Start empty, will set content via useEffect
      editable: !readOnly,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        const text = editor.getText();

        // Update counts
        const words = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
        setWordCount(words);
        setCharCount(text.length);

        // Call parent callback
        if (onContentChange) {
          onContentChange(html);
        }

        // Auto-save (debounced in parent)
        setIsSaving(false);
      },
    },
    [ydoc, readOnly]
  );

  // Update editor content when initialContent changes (only for non-collaborative mode)
  // When using Y.js Collaboration, the Y.doc manages content automatically
  useEffect(() => {
    if (!editor || !initialContent || isInitializedRef.current) return;

    // Only set content if NOT using collaboration
    // Y.js Collaboration extension manages content automatically
    if (!ydoc) {
      const currentContent = editor.getHTML();
      if (currentContent !== initialContent) {
        editor.commands.setContent(initialContent);
      }
      isInitializedRef.current = true;
    } else {
      // For collaborative mode, check if Y.doc fragment is empty
      const fragment = ydoc.getXmlFragment('default');
      if (fragment.length === 0 && initialContent && initialContent !== '<p></p>') {
        // Initialize Y.doc with content only if it's truly empty
        editor.commands.setContent(initialContent);
      }
      isInitializedRef.current = true;
    }
  }, [editor, initialContent, ydoc]);

  // Debounced auto-save handler
  const handleAutoSave = useCallback(async () => {
    if (!editor) return;

    setIsSaving(true);
    try {
      const content = editor.getHTML();
      // Save will be handled by parent component via API
      // This just signals to parent that save is needed
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  }, [editor]);

  // Use Cmd/Ctrl + S for save
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleAutoSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, handleAutoSave]);

  if (!editor) {
    return <div className="flex items-center justify-center h-full">Loading editor...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap gap-2">
          {/* Text formatting buttons */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 transition ${
              editor.isActive('bold') ? 'bg-gray-300' : ''
            }`}
            title="Bold (Cmd/Ctrl + B)"
          >
            <Bold size={18} />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 transition ${
              editor.isActive('italic') ? 'bg-gray-300' : ''
            }`}
            title="Italic (Cmd/Ctrl + I)"
          >
            <Italic size={18} />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-200 transition ${
              editor.isActive('strike') ? 'bg-gray-300' : ''
            }`}
            title="Strikethrough"
          >
            <Strikethrough size={18} />
          </button>

          {/* Divider */}
          <div className="w-px bg-gray-300" />

          {/* Heading buttons */}
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-200 transition ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
            }`}
            title="Heading 2"
          >
            <Heading2 size={18} />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-gray-200 transition ${
              editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
            }`}
            title="Heading 3"
          >
            <Heading3 size={18} />
          </button>

          {/* Divider */}
          <div className="w-px bg-gray-300" />

          {/* List buttons */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition ${
              editor.isActive('bulletList') ? 'bg-gray-300' : ''
            }`}
            title="Bullet List"
          >
            <List size={18} />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition ${
              editor.isActive('orderedList') ? 'bg-gray-300' : ''
            }`}
            title="Ordered List"
          >
            <ListOrdered size={18} />
          </button>

          {/* Divider */}
          <div className="w-px bg-gray-300" />

          {/* Undo/Redo buttons */}
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-2 rounded hover:bg-gray-200 transition disabled:opacity-50"
            title="Undo (Cmd/Ctrl + Z)"
          >
            <Undo size={18} />
          </button>

          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-2 rounded hover:bg-gray-200 transition disabled:opacity-50"
            title="Redo (Cmd/Ctrl + Shift + Z)"
          >
            <Redo size={18} />
          </button>

          {/* Save status */}
          <div className="ml-auto flex items-center gap-2">
            {isSaving && (
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Saving...
              </span>
            )}
            <span className="text-sm text-gray-600">
              {wordCount} words · {charCount} chars
            </span>
          </div>
        </div>

        {readOnly && (
          <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded px-3 py-2 text-sm text-yellow-800">
            📖 This document is read-only. You don't have permission to edit it.
          </div>
        )}
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-auto p-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <EditorContent
            editor={editor}
            className="prose prose-base max-w-none
              font-body text-gray-900
              [&_.ProseMirror]:focus:outline-none
              [&_.ProseMirror]:text-base
              [&_.ProseMirror]:leading-relaxed
              
              [&_.ProseMirror_p]:mb-5
              [&_.ProseMirror_p]:leading-relaxed
              
              [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-6 [&_.ProseMirror_h1]:mt-8 [&_.ProseMirror_h1]:leading-tight
              [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mb-4 [&_.ProseMirror_h2]:mt-6 [&_.ProseMirror_h2]:leading-tight
              [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mb-3 [&_.ProseMirror_h3]:mt-4 [&_.ProseMirror_h3]:leading-tight
              
              [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-8 [&_.ProseMirror_ul]:my-4 [&_.ProseMirror_ul]:space-y-2
              [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-8 [&_.ProseMirror_ol]:my-4 [&_.ProseMirror_ol]:space-y-2
              [&_.ProseMirror_li]:my-2 [&_.ProseMirror_li]:leading-relaxed
              [&_.ProseMirror_li>p]:mb-2
              
              [&_.ProseMirror_strong]:font-bold
              [&_.ProseMirror_em]:italic
              [&_.ProseMirror_s]:line-through
              
              [&_.ProseMirror_code]:bg-gray-100 [&_.ProseMirror_code]:px-2 [&_.ProseMirror_code]:py-1 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:font-mono [&_.ProseMirror_code]:text-sm
              
              [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-gray-400 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:my-4 [&_.ProseMirror_blockquote]:italic
              
              [&_.ProseMirror_hr]:my-8 [&_.ProseMirror_hr]:border-t-2 [&_.ProseMirror_hr]:border-gray-300
              
              [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:my-4
              [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-gray-300 [&_.ProseMirror_td]:px-3 [&_.ProseMirror_td]:py-2
              [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-gray-300 [&_.ProseMirror_th]:px-3 [&_.ProseMirror_th]:py-2 [&_.ProseMirror_th]:bg-gray-100 [&_.ProseMirror_th]:font-bold
            "
          />
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
// Only re-render if props actually change
export const DocumentEditor = memo(DocumentEditorComponent, (prevProps, nextProps) => {
  // Return true if props are equal (don't re-render)
  // Return false if props changed (do re-render)
  return (
    prevProps.documentId === nextProps.documentId &&
    prevProps.initialContent === nextProps.initialContent &&
    prevProps.readOnly === nextProps.readOnly &&
    prevProps.userColor === nextProps.userColor &&
    prevProps.onContentChange === nextProps.onContentChange
  );
});

export default DocumentEditor;

