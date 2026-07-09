"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { MantineProvider } from "@mantine/core";
import "@blocknote/mantine/style.css";
import "@mantine/core/styles.css";
import { useEffect, useState } from "react";

import {
  FormattingToolbar,
  BlockTypeSelect,
  BasicTextStyleButton,
  TextAlignButton,
  ColorStyleButton,
  CreateLinkButton,
  NestBlockButton,
  UnnestBlockButton,
} from "@blocknote/react";

interface BlockNoteEditorProps {
  initialHTML?: string;
  onChange: (html: string) => void;
}

/**
 * Custom static toolbar that is always visible at the top of the editor.
 * Must be rendered inside BlockNoteView's children to have access to the context.
 */
function StaticFormattingToolbar() {
  return (
    <div className="bn-static-toolbar">
      <FormattingToolbar>
        {/* Block Type Select (Heading, Paragraph, etc) */}
        <BlockTypeSelect key="blockTypeSelect" />

        {/* Divider */}
        <div className="bn-toolbar-divider" />

        {/* Text Style Buttons */}
        <BasicTextStyleButton basicTextStyle="bold" key="boldStyleButton" />
        <BasicTextStyleButton basicTextStyle="italic" key="italicStyleButton" />
        <BasicTextStyleButton basicTextStyle="underline" key="underlineStyleButton" />
        <BasicTextStyleButton basicTextStyle="strike" key="strikeStyleButton" />
        <BasicTextStyleButton basicTextStyle="code" key="codeStyleButton" />

        {/* Divider */}
        <div className="bn-toolbar-divider" />

        {/* Color & Link */}
        <ColorStyleButton key="colorStyleButton" />
        <CreateLinkButton key="createLinkButton" />

        {/* Divider */}
        <div className="bn-toolbar-divider" />

        {/* Text Alignment */}
        <TextAlignButton textAlignment="left" key="textAlignLeftButton" />
        <TextAlignButton textAlignment="center" key="textAlignCenterButton" />
        <TextAlignButton textAlignment="right" key="textAlignRightButton" />

        {/* Divider */}
        <div className="bn-toolbar-divider" />

        {/* Indentation / Nesting */}
        <NestBlockButton key="nestBlockButton" />
        <UnnestBlockButton key="unnestBlockButton" />
      </FormattingToolbar>
    </div>
  );
}

export default function BlockNoteEditor({ initialHTML, onChange }: BlockNoteEditorProps) {
  const [isReady, setIsReady] = useState(false);

  const editor = useCreateBlockNote();

  useEffect(() => {
    async function init() {
      if (initialHTML) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fn = (editor as any).tryParseHTMLToBlocks;
          if (typeof fn === "function") {
            const result = fn.call(editor, initialHTML);
            const blocks = result instanceof Promise ? await result : result;
            editor.replaceBlocks(editor.document, blocks);
          }
        } catch (e) {
          console.error("Error parsing HTML to blocks:", e);
        }
      }
      setIsReady(true);
    }
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  const handleEditorChange = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = (editor as any).blocksToHTML ?? (editor as any).blocksToFullHTML ?? (editor as any).blocksToHTMLLossy;
    if (typeof fn === "function") {
      try {
        const result = fn.call(editor, editor.document);
        if (result instanceof Promise) {
          result.then((html: string) => {
            onChange(html);
          }).catch((err: unknown) => {
            console.error("Error converting blocks to HTML:", err);
          });
        } else if (typeof result === "string") {
          onChange(result);
        }
      } catch (err) {
        console.error("Error converting blocks to HTML:", err);
      }
    }
  };

  if (!isReady) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: 350, border: "1px solid #e2e8f0", borderRadius: 10,
        background: "#f8fafc", color: "#94a3b8", fontSize: "0.875rem"
      }}>
        Memuat editor...
      </div>
    );
  }

  return (
    <MantineProvider defaultColorScheme="light">
      <div className="bn-editor-wrapper">
        <BlockNoteView
          editor={editor}
          onChange={handleEditorChange}
          theme="light"
          formattingToolbar={false}
          sideMenu={false}
        >
          {/* Static toolbar rendered as child of BlockNoteView so it has access to editor context */}
          <StaticFormattingToolbar />
        </BlockNoteView>
      </div>
    </MantineProvider>
  );
}
