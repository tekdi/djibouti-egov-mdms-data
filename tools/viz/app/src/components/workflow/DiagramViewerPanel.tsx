import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Eye, Code } from 'lucide-react';
import Editor from '@monaco-editor/react';
import ZoomableMermaid from './ZoomableMermaid';

interface DiagramViewerPanelProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  jsonValue: string;
  mermaidCode: string;
  setMermaidCode: (value: string) => void;
  updateDiagramFromCode: (code: string) => void;
  autoApplyCode: boolean;
  setAutoApplyCode: (value: boolean) => void;
}

export function DiagramViewerPanel({
  activeTab,
  setActiveTab,
  jsonValue,
  mermaidCode,
  setMermaidCode,
  updateDiagramFromCode,
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
      <TabsContent value="preview" className="flex-1 flex flex-col m-0 p-0 h-full">
        {/* Diagram Container with ZoomableMermaid */}
        <div 
          className="flex-1 bg-white" 
          style={{ 
            width: '100%', 
            height: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
            position: 'relative',
            minHeight: '500px'
          }}
        >
          {!jsonValue.trim() ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Enter workflow JSON to see the diagram...
            </div>
          ) : (
            <ZoomableMermaid 
              diagram={mermaidCode} 
              options={{
                theme: 'default',
                flowchart: { useMaxWidth: true }
              }}
            />
          )}
        </div>
      </TabsContent>

      {/* Code Tab */}
      <TabsContent value="code" className="flex-1 flex flex-col m-0 p-0 h-full">
        {/* Code Controls */}
        <div className="border-b border-gray-200 bg-white p-4 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => updateDiagramFromCode(mermaidCode)}>
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