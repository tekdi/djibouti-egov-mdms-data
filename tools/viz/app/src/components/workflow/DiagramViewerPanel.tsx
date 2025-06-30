import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Eye, Code, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface DiagramViewerPanelProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  zoom: number;
  handleZoom: (factor: number) => void;
  resetZoom: () => void;
  diagramRef: (node: HTMLDivElement | null) => void;
  jsonValue: string;
  mermaidCode: string;
  setMermaidCode: (value: string) => void;
  regenerateFromJSON: () => void;
  updateDiagramFromCode: (code: string) => void;
  isLoading: boolean;
  autoApplyCode: boolean;
  setAutoApplyCode: (value: boolean) => void;
}

export function DiagramViewerPanel({
  activeTab,
  setActiveTab,
  zoom,
  handleZoom,
  resetZoom,
  diagramRef,
  jsonValue,
  mermaidCode,
  setMermaidCode,
  regenerateFromJSON,
  updateDiagramFromCode,
  isLoading,
  autoApplyCode,
  setAutoApplyCode,
}: DiagramViewerPanelProps) {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
      {/* Tab Header */}
      <div className="border-b border-gray-200 bg-white px-4 pt-4 flex-shrink-0">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview" className="flex items-center">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center">
            <Code className="h-4 w-4 mr-2" />
            Code
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Preview Tab */}
      <TabsContent value="preview" className="flex-1 flex flex-col m-0 p-0 min-h-0">
        {/* Zoom Controls */}
        <div className="border-b border-gray-200 bg-white p-4 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleZoom(0.8)}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[50px] text-center">
              {zoom}%
            </span>
            <Button variant="outline" size="sm" onClick={() => handleZoom(1.25)}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetZoom}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Diagram Container */}
        <div className="flex-1 overflow-auto bg-white p-4 min-h-0">
          <div 
            ref={diagramRef}
            className="min-h-full"
            style={{ transformOrigin: 'top left' }}
          >
            {!jsonValue.trim() && (
              <div className="flex items-center justify-center h-64 text-gray-500">
                Enter workflow JSON to see the diagram...
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      {/* Code Tab */}
      <TabsContent value="code" className="flex-1 flex flex-col m-0 p-0 min-h-0">
        {/* Code Controls */}
        <div className="border-b border-gray-200 bg-white p-4 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={regenerateFromJSON}>
              Regenerate from JSON
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => updateDiagramFromCode(mermaidCode)}
              disabled={isLoading}
            >
              Apply Code
            </Button>
            
            <div className="flex items-center space-x-2 ml-auto">
              <Switch
                checked={autoApplyCode}
                onCheckedChange={setAutoApplyCode}
                id="auto-apply-code"
              />
              <label htmlFor="auto-apply-code" className="text-sm text-gray-600">
                Auto-apply
              </label>
            </div>
          </div>
        </div>

        {/* Mermaid Code Editor */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            defaultLanguage="text"
            value={mermaidCode}
            onChange={(value) => {
              const newCode = value || '';
              setMermaidCode(newCode);
              if (autoApplyCode && newCode) {
                setTimeout(() => updateDiagramFromCode(newCode), 500);
              }
            }}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              renderLineHighlight: 'none',
              selectionHighlight: false,
              lineNumbers: 'on',
              glyphMargin: false,
              folding: true,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 0,
              overviewRulerBorder: false,
            }}
            theme="vs"
          />
        </div>
      </TabsContent>
    </Tabs>
  );
} 