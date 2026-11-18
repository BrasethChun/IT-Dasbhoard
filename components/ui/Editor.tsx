import React, { useEffect, useRef } from 'react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onReady?: (quill: any) => void;
}

// Access the global Quill object from CDN
declare const Quill: any;

export const Editor: React.FC<EditorProps> = ({ value, onChange, placeholder, className = '', onReady }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<any>(null);
  const lastHtmlRef = useRef<string>(value || '');
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (editorRef.current && !quillInstance.current) {
      quillInstance.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: placeholder || 'Start typing...',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'blockquote', 'code-block'],
            ['clean']
          ]
        }
      });

      if (value) {
        quillInstance.current.root.innerHTML = value;
        lastHtmlRef.current = value;
      }

      quillInstance.current.on('text-change', () => {
        const html = quillInstance.current.root.innerHTML;
        const normalized = html === '<p><br></p>' ? '' : html;
        lastHtmlRef.current = normalized;
        onChangeRef.current(normalized);
      });

      if (onReady) {
        onReady(quillInstance.current);
      }
    }
  }, []);

  useEffect(() => {
    if (!quillInstance.current) return;
    const nextVal = value || '';
    if (nextVal !== lastHtmlRef.current) {
      lastHtmlRef.current = nextVal;
      quillInstance.current.root.innerHTML = nextVal;
    }
  }, [value]);

  return <div className={`prose prose-zinc max-w-none ${className}`}><div ref={editorRef} /></div>;
};