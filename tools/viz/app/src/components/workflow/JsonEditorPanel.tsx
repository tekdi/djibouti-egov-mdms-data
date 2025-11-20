import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Search, FileText, Settings, Upload } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface JsonEditorPanelProps {
  jsonValue: string;
  setJsonValue: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  handleSearch: () => void;
  loadSampleWorkflow: () => void;
  loadServiceConfig: () => void;
  formatJSON: () => void;
  updateDiagram: () => void;
  isLoading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  autoUpdate: boolean;
  setAutoUpdate: (value: boolean) => void;
  editorRef: React.RefObject<any>;
}

export function JsonEditorPanel({
  jsonValue,
  setJsonValue,
  searchTerm,
  setSearchTerm,
  handleSearch,
  loadSampleWorkflow,
  loadServiceConfig,
  formatJSON,
  updateDiagram,
  isLoading,
  fileInputRef,
  autoUpdate,
  setAutoUpdate,
  editorRef,
}: JsonEditorPanelProps) {
  return (
    <>
      {/* Editor Header */}
      <div className="border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Workflow JSON Editor</h2>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-32"
            />
            <Button variant="outline" size="sm" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadSampleWorkflow}>
            <FileText className="h-4 w-4 mr-1" />
            Load Sample
          </Button>
          <Button variant="outline" size="sm" onClick={loadServiceConfig}>
            <Settings className="h-4 w-4 mr-1" />
            Load Service Config
          </Button>
          <Button variant="outline" size="sm" onClick={formatJSON}>
            Format JSON
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={updateDiagram}
            disabled={isLoading}
          >
            Update Diagram
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-1" />
            Load File
          </Button>
          
          <div className="flex items-center space-x-2 ml-auto">
            <Switch
              checked={autoUpdate}
              onCheckedChange={setAutoUpdate}
              id="auto-update"
            />
            <label htmlFor="auto-update" className="text-sm text-gray-600">
              Auto-update
            </label>
          </div>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1" style={{ width: '100%', height: '100%' }}>
        <Editor
          height="100%"
          defaultLanguage="json"
          value={jsonValue}
          onChange={(value) => setJsonValue(value || '')}
          onMount={(editor) => {
            if (editorRef) {
              editorRef.current = editor;
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
    </>
  );
} 