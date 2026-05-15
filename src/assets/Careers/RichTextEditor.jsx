import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

export default function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const MAX_LENGTH = 300;

  useEffect(() => {
    if (!quillRef.current) {
      const quill = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ align: [] }]
          ],
          keyboard: {
            bindings: {
              limit: {
                key: /.*/,
                handler: function () {
                  const length = this.quill.getLength() - 1;
                  if (length >= MAX_LENGTH) {
                    return false; // 🔥 typing block
                  }
                  return true;
                }
              }
            }
          }
        }
      });

      quillRef.current = quill;

      // 🔥 paste control
      quill.clipboard.addMatcher(Node.TEXT_NODE, (node) => {
        const length = quill.getLength() - 1;
        const remaining = MAX_LENGTH - length;

        if (remaining <= 0) return { ops: [] };

        return {
          ops: [{ insert: node.data.slice(0, remaining) }]
        };
      });

      // 🔥 safety fallback (force trim)
      quill.on("text-change", () => {
        const text = quill.getText().slice(0, -1);

        if (text.length > MAX_LENGTH) {
          quill.setText(text.substring(0, MAX_LENGTH));
          quill.setSelection(MAX_LENGTH);
        }

        onChange(quill.root.innerHTML);
      });
    }
  }, []);

  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = value || "";
    }
  }, [value]);

  return <div ref={editorRef} style={{ height: "150px" }} />;
}