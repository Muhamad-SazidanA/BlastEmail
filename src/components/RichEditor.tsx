"use client";

import { useRef, useCallback, useEffect } from "react";

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

type FormatCommand =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "justifyLeft"
  | "justifyCenter"
  | "justifyRight"
  | "indent"
  | "outdent"
  | "createLink"
  | "formatBlock"
  | "insertHorizontalRule"
  | "removeFormat";

const BLOCK_OPTIONS = [
  { label: "Paragraph", value: "p" },
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
  { label: "Quote", value: "blockquote" },
];

export default function RichEditor({
  value,
  onChange,
  placeholder = "Write email content here…",
}: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  // Sync value → DOM only when external update (not from user typing)
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    if (el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  const exec = useCallback((cmd: FormatCommand, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  }, []);

  const handleInput = useCallback(() => {
    isInternalUpdate.current = true;
    onChange(editorRef.current?.innerHTML ?? "");
  }, [onChange]);

  const handleBlockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    exec("formatBlock", e.target.value);
  };

  const handleLink = () => {
    const url = window.prompt("Enter URL:", "https://");
    if (url) exec("createLink", url);
  };

  // Toolbar button definitions
  const tools: Array<
    | { type: "btn"; title: string; cmd: FormatCommand; label: string; val?: string }
    | { type: "sep" }
    | { type: "select" }
    | { type: "btn-fn"; title: string; label: string; onClick: () => void }
  > = [
    { type: "select" },
    { type: "sep" },
    { type: "btn", title: "Bold (Ctrl+B)", cmd: "bold", label: "B" },
    { type: "btn", title: "Italic (Ctrl+I)", cmd: "italic", label: "I" },
    { type: "btn", title: "Underline (Ctrl+U)", cmd: "underline", label: "U" },
    { type: "btn", title: "Strikethrough", cmd: "strikeThrough", label: "S̶" },
    { type: "sep" },
    { type: "btn", title: "Align Left", cmd: "justifyLeft", label: "◀" },
    { type: "btn", title: "Align Center", cmd: "justifyCenter", label: "≡" },
    { type: "btn", title: "Align Right", cmd: "justifyRight", label: "▶" },
    { type: "sep" },
    { type: "btn", title: "Bullet List", cmd: "insertUnorderedList", label: "• —" },
    { type: "btn", title: "Numbered List", cmd: "insertOrderedList", label: "1." },
    { type: "sep" },
    { type: "btn", title: "Indent", cmd: "indent", label: "→" },
    { type: "btn", title: "Outdent", cmd: "outdent", label: "←" },
    { type: "sep" },
    { type: "btn-fn", title: "Insert Link", label: "🔗", onClick: handleLink },
    { type: "btn", title: "Horizontal Rule", cmd: "insertHorizontalRule", label: "—" },
    { type: "sep" },
    { type: "btn", title: "Clear Formatting", cmd: "removeFormat", label: "✕" },
  ];

  return (
    <div className="rich-editor-wrapper">
      {/* Toolbar */}
      <div className="rich-editor-toolbar">
        {tools.map((tool, i) => {
          if (tool.type === "sep") {
            return <div key={`sep-${i}`} className="toolbar-sep" />;
          }
          if (tool.type === "select") {
            return (
              <select
                key="block-select"
                className="toolbar-select"
                defaultValue="p"
                onChange={handleBlockChange}
                title="Block format"
              >
                {BLOCK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            );
          }
          if (tool.type === "btn-fn") {
            return (
              <button
                key={tool.title}
                type="button"
                title={tool.title}
                className="toolbar-btn"
                onMouseDown={(e) => {
                  e.preventDefault();
                  tool.onClick();
                }}
              >
                {tool.label}
              </button>
            );
          }
          return (
            <button
              key={tool.cmd}
              type="button"
              title={tool.title}
              className="toolbar-btn"
              onMouseDown={(e) => {
                e.preventDefault();
                exec(tool.cmd, tool.val);
              }}
            >
              {tool.label}
            </button>
          );
        })}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="rich-editor-content"
        data-placeholder={placeholder}
        onInput={handleInput}
        onBlur={handleInput}
      />
    </div>
  );
}
