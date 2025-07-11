import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  SAMPLE_WORKFLOW,
  type Workflow,
  workflowToMermaid
} from '@/lib/workflow-utils'
import { WorkflowHeader } from '@/components/workflow/WorkflowHeader'
import { JsonEditorPanel } from '@/components/workflow/JsonEditorPanel'
import { DiagramViewerPanel } from '@/components/workflow/DiagramViewerPanel'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth'
import { useApiClient } from '@/lib/api/useApiClient';
import { ApiDebugPanel } from '@/components/debug/ApiDebugPanel';
import { useToast } from '@/components/ui/use-toast';

// Type definitions for MDMS API response
interface WorkflowState {
  state: string;
  actions?: Array<{
    action: string;
    nextState: string;
    currentState: string;
    roles: string[];
    active: boolean;
    tenantId: string;
  }>;
  isStartState?: boolean;
  isTerminateState?: boolean;
  applicationStatus: string;
  tenantId: string;
}

interface ServiceConfiguration {
  id: string;
  tenantId: string;
  schemaCode: string;
  uniqueIdentifier: string;
  data: {
    workflow?: {
      states: WorkflowState[];
      businessService: string;
      business: string;
    };
    service?: string;
  };
}

export function WorkflowVisualizer() {
  const [jsonValue, setJsonValue] = useState('');
  const [mermaidCode, setMermaidCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [autoApplyCode, setAutoApplyCode] = useState(true);
  const [activeTab, setActiveTab] = useState('preview');
  const [searchTerm, setSearchTerm] = useState('');
  const [availableWorkflows, setAvailableWorkflows] = useState<ServiceConfiguration[]>([]);
  const [_selectedWorkflowId, _setSelectedWorkflowId] = useState('');
  const [_isLoadingWorkflows, _setIsLoadingWorkflows] = useState(false);
  const editorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token, user } = useAuth();
  const apiClient = useApiClient();
  const { toast } = useToast();

  // Function to fetch workflows from MDMS service
  const fetchWorkflowsFromMDMS = async () => {
    if (!token || !user) {
      const errorMsg = 'Authentication required';
      setError(errorMsg);
      toast({
        title: "Authentication Error",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const endpoint = '/egov-mdms-service/v2/_search';
      const data = await apiClient.callApi<{
        ResponseInfo: any;
        mdms: ServiceConfiguration[];
      }>(endpoint, {
        MdmsCriteria: {
          tenantId: "dj",
          schemaCode: "Studio.ServiceConfiguration"
        }
      });
      
      if (data.mdms && data.mdms.length > 0) {
        setAvailableWorkflows(data.mdms);
        setMessage(`Found ${data.mdms.length} workflow configurations`);
      } else {
        setMessage('No workflow configurations found');
      }
    } catch (err) {
      const endpoint = '/egov-mdms-service/v2/_search';
      const errorMsg = `Failed to fetch workflows from ${endpoint}: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMsg);
      toast({
        title: "API Error",
        description: `MDMS Service API (${endpoint}) failed: ${err instanceof Error ? err.message : String(err)}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to load a specific workflow configuration
  const loadWorkflowConfig = (config: ServiceConfiguration) => {
    try {
      if (!config.data.workflow) {
        setError('Selected configuration does not contain workflow data');
        return;
      }

      // Transform the MDMS workflow format to our expected format
      const transformedWorkflow: Workflow = {
        tenantId: config.tenantId,
        businessService: config.data.workflow.businessService || config.uniqueIdentifier,
        states: config.data.workflow.states.map(state => ({
          tenantId: state.tenantId || config.tenantId,
          state: state.state,
          applicationStatus: state.applicationStatus,
          isStartState: state.isStartState || false,
          isTerminateState: state.isTerminateState || false,
          actions: state.actions || []
        }))
      };

      setJsonValue(JSON.stringify(transformedWorkflow, null, 2));
      setMessage(`Loaded workflow: ${config.uniqueIdentifier}`);
      setError('');
    } catch (err) {
      setError(`Failed to load workflow configuration: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Update diagram when JSON changes
  const updateDiagram = useCallback(() => {
    try {
      const parsedData = JSON.parse(jsonValue);
      const code = workflowToMermaid(parsedData);
      setMermaidCode(code);
      setError('');
    } catch (err) {
      setError(`Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [jsonValue]);

  // Update diagram from mermaid code
  const updateDiagramFromCode = useCallback((code: string) => {
    setMermaidCode(code);
  }, []);

  // Auto-update diagram when JSON changes
  useEffect(() => {
    if (autoUpdate && jsonValue.trim()) {
      console.log('🔄 Auto-updating diagram from JSON change...');
      try {
        const parsedData = JSON.parse(jsonValue);
        const code = workflowToMermaid(parsedData);
        setMermaidCode(code);
        setError('');
        console.log('✅ Diagram updated successfully');
      } catch (err) {
        const errorMsg = `Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`;
        setError(errorMsg);
        console.error('❌ Diagram update error:', err);
      }
    }
  }, [jsonValue, autoUpdate]); // ✅ Removed updateDiagram from dependencies to prevent loops

  const loadSampleWorkflow = () => {
    setJsonValue(JSON.stringify(SAMPLE_WORKFLOW, null, 2));
    setMessage('Sample workflow loaded!');
    setTimeout(() => setMessage(''), 3000);
  };

  const loadServiceConfig = async () => {
    try {
      setIsLoading(true);
      const endpoint = './workflow.json';
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('workflow.json not found. Run the extraction script first.');
      }
      const workflow = await response.json();
      setJsonValue(JSON.stringify(workflow, null, 2));
      setMessage('Service configuration loaded!');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      const endpoint = './workflow.json';
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      const fullError = `Error loading service config from ${endpoint}: ${errorMessage}`;
      setError(fullError);
      toast({
        title: "File Load Error",
        description: `Static file (${endpoint}) failed to load: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      setJsonValue(JSON.stringify(parsed, null, 2));
      setMessage('JSON formatted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(`Invalid JSON: ${errorMessage}`);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        JSON.parse(content);
        setJsonValue(content);
        setMessage('File loaded successfully!');
        setTimeout(() => setMessage(''), 3000);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        setError(`Invalid JSON file: ${errorMessage}`);
      }
    };
    reader.readAsText(file);
  };

  const handleSearch = () => {
    if(editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const matches = model.findMatches(searchTerm, true, false, true, null, true);
        if (matches.length > 0) {
          editorRef.current.revealRange(matches[0].range);
        }
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <WorkflowHeader 
        isLoading={isLoading}
        error={error}
        message={message}
      />
      
      {/* Debug Panel - Development Only */}
      {import.meta.env.DEV && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <ApiDebugPanel />
        </div>
      )}

      <div className="flex-1 min-h-0">
        <div className="h-full flex" style={{ maxWidth: '100vw', overflow: 'hidden' }}>
          {/* Left Panel - JSON Editor with MDMS Integration - Fixed 50% width */}
          <div className="w-1/2 flex flex-col bg-white border-r border-gray-200" style={{ maxWidth: '50%', overflow: 'hidden' }}>
            {/* MDMS Integration Section */}
            <div className="border-b border-gray-200 p-4 flex-shrink-0 bg-gray-50">
              <h3 className="font-medium text-gray-900 mb-3">MDMS Integration</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchWorkflowsFromMDMS}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    'Fetch Workflows from MDMS'
                  )}
                </Button>
                
                {availableWorkflows.length > 0 && (
                  <select 
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedWorkflow = availableWorkflows.find(w => w.id === selectedId);
                      if (selectedWorkflow) {
                        loadWorkflowConfig(selectedWorkflow);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">Select workflow...</option>
                    {availableWorkflows.map((workflow) => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.data.service || workflow.uniqueIdentifier}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex-1" style={{ overflow: 'hidden' }}>
              <JsonEditorPanel
                jsonValue={jsonValue}
                setJsonValue={setJsonValue}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleSearch={handleSearch}
                loadSampleWorkflow={loadSampleWorkflow}
                loadServiceConfig={loadServiceConfig}
                formatJSON={formatJSON}
                updateDiagram={updateDiagram}
                isLoading={isLoading}
                fileInputRef={fileInputRef}
                autoUpdate={autoUpdate}
                setAutoUpdate={setAutoUpdate}
                editorRef={editorRef}
              />
            </div>
          </div>
          
          {/* Right Panel - Diagram Viewer - Fixed 50% width */}
          <div className="w-1/2 flex flex-col bg-white" style={{ maxWidth: '50%', overflow: 'hidden', minHeight: '600px' }}>
            <DiagramViewerPanel
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              jsonValue={jsonValue}
              mermaidCode={mermaidCode}
              setMermaidCode={setMermaidCode}
              updateDiagramFromCode={updateDiagramFromCode}
              autoApplyCode={autoApplyCode}
              setAutoApplyCode={setAutoApplyCode}
            />
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".json"
      />
    </div>
  );
} 