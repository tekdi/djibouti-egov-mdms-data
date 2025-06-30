import { useState, useRef } from 'react';
import type * as monaco from 'monaco-editor';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { saveFileContent } from '@/lib/api/data-explorer';
import { useToast } from '@/components/ui/use-toast';

interface SelectedFile {
    path: string;
    content: string;
}

interface EditorPanelProps {
    selectedFile: SelectedFile | null;
    isFetchingFile: boolean;
}

const EditorPanel = ({ selectedFile, isFetchingFile }: EditorPanelProps) => {
    const [isReadOnly, setIsReadOnly] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const { toast } = useToast();

    const handleSave = async () => {
        if (!editorRef.current || !selectedFile) return;

        setIsSaving(true);
        const content = editorRef.current.getValue();
        try {
            await saveFileContent(selectedFile.path, content);
            toast({
                title: "File saved!",
                description: `${selectedFile.path} has been updated.`,
            });
        } catch (err) {
            toast({
                title: "Error saving file",
                description: err instanceof Error ? err.message : 'An unknown error occurred.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const getEditorMode = (path: string | undefined): string => {
        if (!path) return 'plaintext';
        if (path.endsWith('.json')) return 'json';
        if (path.endsWith('.yml') || path.endsWith('.yaml')) return 'yaml';
        return 'plaintext';
    }

    if (isFetchingFile) {
        return <div className="p-4">Loading file...</div>;
    }

    if (!selectedFile) {
        return <div className="p-4 h-full flex items-center justify-center text-center text-muted-foreground">Select a file to view its content.</div>;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-2 border-b flex justify-between items-center">
                <div className="font-mono text-sm">{selectedFile.path}</div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Switch id="read-only-switch" checked={!isReadOnly} onCheckedChange={() => setIsReadOnly(!isReadOnly)} />
                        <label htmlFor="read-only-switch" className="text-sm">Edit</label>
                    </div>
                    <Button onClick={handleSave} disabled={isReadOnly || isSaving} size="sm">
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </div>
            <div className="flex-1 min-h-0">
                <Editor
                    height="100%"
                    language={getEditorMode(selectedFile.path)}
                    value={selectedFile.content}
                    onMount={(editor) => { editorRef.current = editor; }}
                    options={{
                        readOnly: isReadOnly,
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: 'on',
                    }}
                    theme="vs-dark"
                />
            </div>
        </div>
    );
};

export default EditorPanel; 