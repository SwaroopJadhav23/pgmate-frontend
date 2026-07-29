import { useEffect, useRef } from "react";

const AdminEditableText = ({ tag: Tag, value, editable, onSave }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value ?? "";
    }
  }, [value]);

  return (
    <Tag
      ref={ref}
      className="editable-text"
      contentEditable={editable}
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={() => {
        if (!editable || !onSave || !ref.current) return;
        const newText = ref.current.textContent;
        if (newText !== value) onSave(newText);
      }}
    />
  );
};

export default AdminEditableText;
