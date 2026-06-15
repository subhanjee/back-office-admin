import React from 'react';
import { RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  containerHeight?: string;
  spinnerColor?: string;
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  containerHeight = 'min-h-[60vh]',
  spinnerColor = 'text-orange-500'
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${containerHeight}`}>
      <div className="flex flex-col items-center gap-4 text-white">
        <RefreshCw className={`w-8 h-8 animate-spin ${spinnerColor}`} />
        <p>{message}</p>
      </div>
    </div>
  );
}
