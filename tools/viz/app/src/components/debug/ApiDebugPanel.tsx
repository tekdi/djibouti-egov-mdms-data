/**
 * Debug panel for testing API wrapper functionality
 * This component will help verify that 401 handling is working correctly
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApiClient } from '@/lib/api/useApiClient';
import { apiClient } from '@/lib/api/apiClient';

export function ApiDebugPanel() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const api = useApiClient();

  const addResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const testAuthenticatedCall = async () => {
    setLoading(true);
    try {
      addResult('🔄 Testing authenticated API call...');
      const result = await api.callApi('/egov-mdms-service/v2/_search', {
        tenantId: 'dj',
        schemaCode: 'Studio.ServiceConfiguration'
      });
      addResult(`✅ Authenticated call successful: ${JSON.stringify(result).substring(0, 100)}...`);
    } catch (error) {
      addResult(`❌ Authenticated call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testGenericCall = async () => {
    setLoading(true);
    try {
      addResult('🔄 Testing generic API call...');
      const result = await apiClient.get('/api-local/data-tree');
      addResult(`✅ Generic call successful: ${result.data.length} items`);
    } catch (error) {
      addResult(`❌ Generic call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testForced401 = async () => {
    setLoading(true);
    try {
      addResult('🔄 Testing forced 401 response...');
      // Try to call an authenticated endpoint with invalid token to trigger 401
      const result = await apiClient.post('/api/egov-mdms-service/v2/_search', 
        { tenantId: 'dj' },
        { headers: { 'Authorization': 'Bearer invalid-token' } }
      );
      addResult(`⚠️ Unexpected success: ${JSON.stringify(result.data).substring(0, 100)}...`);
    } catch (error) {
      addResult(`✅ 401 handling triggered: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🐛 API Debug Panel
          <Badge variant="outline">Development Only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={testGenericCall} disabled={loading} variant="outline">
            Test Generic API
          </Button>
          <Button onClick={testAuthenticatedCall} disabled={loading} variant="outline">
            Test Authenticated API
          </Button>
          <Button onClick={testForced401} disabled={loading} variant="destructive">
            Force 401 Test
          </Button>
          <Button onClick={clearResults} variant="ghost" size="sm">
            Clear
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">API Call Results:</h4>
          <div className="bg-gray-50 rounded-md p-3 max-h-60 overflow-y-auto font-mono text-sm">
            {results.length === 0 ? (
              <p className="text-gray-500">No results yet. Click a button to test API calls.</p>
            ) : (
              results.map((result, index) => (
                <div 
                  key={index} 
                  className={`mb-1 ${
                    result.includes('✅') ? 'text-green-600' : 
                    result.includes('❌') ? 'text-red-600' : 
                    result.includes('🔄') ? 'text-blue-600' : 
                    'text-gray-700'
                  }`}
                >
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <p><strong>Generic API:</strong> Tests local endpoints without authentication</p>
          <p><strong>Authenticated API:</strong> Tests DIGIT endpoints with proper auth headers</p>
          <p><strong>Force 401:</strong> Triggers 401 response to test logout behavior</p>
        </div>
      </CardContent>
    </Card>
  );
} 