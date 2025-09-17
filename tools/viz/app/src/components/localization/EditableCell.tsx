import { memo, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth';

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
  const { user } = useAuth();
  
  // Check if user is Studio Admin
  const isStudioAdmin = Boolean(
    user?.roles?.some(
      (role) => role?.name === "Studio Admin" || role?.code === "STUDIO_ADMIN"
    )
  );

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

  // If not Studio Admin, show read-only view
  if (!isStudioAdmin) {
    return (
      <div
        className="p-2 min-h-[40px] text-sm break-all whitespace-pre-wrap text-muted-foreground bg-muted/20 cursor-not-allowed"
        style={{ 
          wordWrap: 'break-word', 
          overflowWrap: 'break-word',
          wordBreak: 'break-all',
          maxWidth: '100%',
          width: '100%'
        }}
        title="Edit access requires Studio Admin role"
      >
        {value}
      </div>
    );
  }

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