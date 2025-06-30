import React, { useState, useEffect, useCallback, useRef } from 'react'
import type * as monaco from 'monaco-editor'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import mermaid from 'mermaid'
import {
  SAMPLE_WORKFLOW,
  type Workflow,
  workflowToMermaid
} from '@/lib/workflow-utils'
import { WorkflowHeader } from '@/components/workflow/WorkflowHeader'
import { JsonEditorPanel } from '@/components/workflow/JsonEditorPanel'
import { DiagramViewerPanel } from '@/components/workflow/DiagramViewerPanel'

export function WorkflowVisualizer() {
  const [jsonValue, setJsonValue] = useState(JSON.stringify(SAMPLE_WORKFLOW, null, 2));
  const [mermaidCode, setMermaidCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [autoApplyCode, setAutoApplyCode] = useState(true);
  const [activeTab, setActiveTab] = useState('preview');
  const [zoom, setZoom] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [diagramNode, setDiagramNode] = useState<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  const diagramRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setDiagramNode(node);
    }
  }, []);

  const updateDiagramFromCode = useCallback(async (code: string) => {
    if (!diagramNode) return;

    try {
      setError('');
      setIsLoading(true);

      if (!code.trim()) {
        setError('No Mermaid code to render');
        diagramNode.innerHTML = ''; // Clear the diagram
        return;
      }

      if (diagramNode) {
        diagramNode.innerHTML = ''; // Clear previous diagram
        
        const uniqueId = `workflow-diagram-code-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, code);
        diagramNode.innerHTML = svg;
        
        // Apply zoom
        const svgElement = diagramNode.querySelector('svg');
        if (svgElement) {
          svgElement.style.transform = `scale(${zoom / 100})`;
          svgElement.style.transformOrigin = 'top left';
        }
      }

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(`Mermaid error: ${errorMessage}`);
      if (diagramNode) diagramNode.innerHTML = ''; // Clear on error
    } finally {
      setIsLoading(false);
    }
  }, [zoom, diagramNode]);

  const updateDiagram = useCallback(async () => {
    if (!diagramNode) return;

    try {
      setError('');
      setIsLoading(true);

      if (!jsonValue.trim()) {
        setError('No JSON content to visualize');
        if (diagramNode) diagramNode.innerHTML = ''; // Clear diagram
        return;
      }

      const workflow: Workflow = JSON.parse(jsonValue);
      const mermaidCodeGenerated = workflowToMermaid(workflow);
      setMermaidCode(mermaidCodeGenerated);

      if (diagramNode) {
        diagramNode.innerHTML = ''; // Clear previous diagram
        
        const uniqueId = `workflow-diagram-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, mermaidCodeGenerated);
        diagramNode.innerHTML = svg;
        
        // Apply zoom
        const svgElement = diagramNode.querySelector('svg');
        if (svgElement) {
          svgElement.style.transform = `scale(${zoom / 100})`;
          svgElement.style.transformOrigin = 'top left';
        }
      }

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(`Error: ${errorMessage}`);
      if (diagramNode) diagramNode.innerHTML = ''; // Clear on error
    } finally {
      setIsLoading(false);
    }
  }, [jsonValue, zoom, diagramNode]);

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: true, 
      theme: 'default',
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true
      }
    });
    
    updateDiagram();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (autoUpdate && jsonValue) {
      const timeoutId = setTimeout(() => {
        updateDiagram();
      }, 500); // Debounce updates
      
      return () => clearTimeout(timeoutId);
    }
  }, [jsonValue, autoUpdate, updateDiagram]);

  useEffect(() => {
    if (activeTab === 'preview' && mermaidCode && diagramNode) {
      updateDiagramFromCode(mermaidCode);
    }
  }, [activeTab, mermaidCode, diagramNode, updateDiagramFromCode]);

  const loadSampleWorkflow = () => {
    setJsonValue(JSON.stringify(SAMPLE_WORKFLOW, null, 2));
    setMessage('Sample workflow loaded!');
    setTimeout(() => setMessage(''), 3000);
  };

  const loadServiceConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('./workflow.json');
      if (!response.ok) {
        throw new Error('workflow.json not found. Run the extraction script first.');
      }
      const workflow = await response.json();
      setJsonValue(JSON.stringify(workflow, null, 2));
      setMessage('Service configuration loaded!');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(`Error loading service config: ${errorMessage}`);
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

  const regenerateFromJSON = () => {
    try {
      if (!jsonValue.trim()) {
        setError('No JSON content to regenerate from');
        return;
      }

      const workflow: Workflow = JSON.parse(jsonValue);
      const mermaidCodeGenerated = workflowToMermaid(workflow);
      setMermaidCode(mermaidCodeGenerated);

      if (autoApplyCode) {
        updateDiagramFromCode(mermaidCodeGenerated);
      }

      setMessage('Mermaid code regenerated from JSON!');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(`JSON parsing error: ${errorMessage}`);
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

  const handleZoom = (factor: number) => {
    const newZoom = Math.max(25, Math.min(300, zoom * factor));
    setZoom(newZoom);
    
    if (diagramNode) {
      const svgElement = diagramNode.querySelector('svg');
      if (svgElement) {
        svgElement.style.transform = `scale(${newZoom / 100})`;
        svgElement.style.transformOrigin = 'top left';
      }
    }
  };

  const resetZoom = () => {
    setZoom(100);
    if (diagramNode) {
      const svgElement = diagramNode.querySelector('svg');
      if (svgElement) {
        svgElement.style.transform = 'scale(1)';
      }
    }
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
    <div className="h-full flex flex-col bg-gray-50">
      <WorkflowHeader
        zoom={zoom}
        isLoading={isLoading}
        error={error}
        message={message}
      />

      <div className="flex-1 min-h-0">
        <ResizablePanelGroup 
          direction="horizontal" 
          className="h-full"
          autoSaveId="workflow-visualizer-panels"
        >
          <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col bg-white">
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
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={50} minSize={30} className="flex flex-col bg-gray-50">
            <DiagramViewerPanel
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              zoom={zoom}
              handleZoom={handleZoom}
              resetZoom={resetZoom}
              diagramRef={diagramRefCallback}
              jsonValue={jsonValue}
              mermaidCode={mermaidCode}
              setMermaidCode={setMermaidCode}
              regenerateFromJSON={regenerateFromJSON}
              updateDiagramFromCode={updateDiagramFromCode}
              isLoading={isLoading}
              autoApplyCode={autoApplyCode}
              setAutoApplyCode={setAutoApplyCode}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <input
        type="file"
        ref={fileInputRef as React.RefObject<HTMLInputElement>}
        onChange={handleFileUpload}
        className="hidden"
        accept=".json"
      />
    </div>
  );
} 