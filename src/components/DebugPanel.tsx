import { useState } from 'react';

interface DebugPanelProps {
  data: any;
  title: string;
}

export function DebugPanel({ data, title }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-white hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <span className="font-semibold">{title}</span>
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="p-4 bg-slate-900 border-t border-slate-700">
          <div className="mb-3 p-3 bg-blue-900/50 border border-blue-700 rounded text-xs text-blue-200">
            💡 <strong>Tip:</strong> If you see data here but fields above show "N/A", check the browser console (F12) for extraction logs. 
            The field names might be different than expected.
          </div>
          <pre className="text-xs text-green-400 overflow-x-auto font-mono whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
