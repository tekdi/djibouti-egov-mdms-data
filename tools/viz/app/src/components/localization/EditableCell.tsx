import { memo, useState, useEffect, useRef } from 'react';

const DEBOUNCE_DELAY = 600;

export const EditableCell = memo(({
  value,
  onSave,
}: {
  value: string;
  onSave: (newValue: string) => void;
}) => {
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const currentValueRef = useRef(value);

  // Only update the display when the value prop changes from the parent
  useEffect(() => {
    if (divRef.current && currentValueRef.current !== value) {
      divRef.current.textContent = value;
      currentValueRef.current = value;
    }
  }, [value]);

  const handleChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newValue = e.currentTarget.textContent || '';
    currentValueRef.current = newValue;

    if (timer) {
      clearTimeout(timer);
    }
    const newTimer = setTimeout(() => {
      onSave(newValue);
    }, DEBOUNCE_DELAY);
    setTimer(newTimer);
  };

  return (
    <div
      ref={divRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleChange}
      className="focus:outline-none focus:bg-blue-50 p-2 min-h-[40px] text-sm break-all whitespace-pre-wrap"
      style={{ 
        wordWrap: 'break-word', 
        overflowWrap: 'break-word',
        wordBreak: 'break-all',
        maxWidth: '100%',
        width: '100%'
      }}
    >
      {value}
    </div>
  );
}); 