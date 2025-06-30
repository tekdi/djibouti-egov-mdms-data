import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GitBranch, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface WorkflowHeaderProps {
  zoom: number;
  isLoading: boolean;
  error: string;
  message: string;
}

export function WorkflowHeader({ zoom, isLoading, error, message }: WorkflowHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <GitBranch className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Workflow Visualizer</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            {zoom}% zoom
          </Badge>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Alert className="mt-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert className="mt-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
} 