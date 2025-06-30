
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight } from 'lucide-react';

export function RoleActionVisualizer() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-3">
        <Users className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-slate-900">Role Action Visualizer</h1>
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
              The Role Action Visualizer is being migrated to the new React architecture. 
              This will include enhanced role mapping, permission analysis, and conflict detection.
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