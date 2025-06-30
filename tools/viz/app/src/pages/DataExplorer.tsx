
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, ArrowRight } from 'lucide-react';

export function DataExplorer() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-3">
        <Database className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-slate-900">Data Explorer</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Migration in Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">🚧</div>
            <h3 className="text-xl font-semibold">Coming Soon</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              The Data Explorer is being migrated to the new React architecture. 
              This will include enhanced data browsing, advanced search, and schema analysis.
            </p>
            <Button variant="outline" className="mt-4">
              <ArrowRight className="mr-2 h-4 w-4" />
              View Migration Progress
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 