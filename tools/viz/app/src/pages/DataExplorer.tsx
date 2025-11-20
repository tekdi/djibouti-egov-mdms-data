import { useEffect, useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import type { TreeNode, RecentFile } from '@/lib/api/data-explorer';
import { fetchDataTree, fetchRecentConfigs, fetchFileContent } from '@/lib/api/data-explorer';
import FileTree from '@/components/data-explorer/FileTree';
import { Skeleton } from '@/components/ui/skeleton';
import EditorPanel from '@/components/data-explorer/EditorPanel';
import { useToast } from '@/components/ui/use-toast';

interface SelectedFile {
    path: string;
    content: string;
}

const DataExplorer = () => {
    const [treeData, setTreeData] = useState<TreeNode[]>([]);
    const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
    const [isFetchingFile, setIsFetchingFile] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [tree, recent] = await Promise.all([
                    fetchDataTree(),
                    fetchRecentConfigs(),
                ]);
                setTreeData(tree);
                setRecentFiles(recent);
                setError(null);
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
                setError(errorMsg);
                toast({
                    title: "Data Explorer API Error",
                    description: `Failed to load data tree or recent configs: ${errorMsg}`,
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleFileSelect = async (path: string) => {
        setIsFetchingFile(true);
        try {
            const content = await fetchFileContent(path);
            setSelectedFile({ path, content });
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to load file.';
            setError(errorMsg);
            toast({
                title: "File Load Error",
                description: `Failed to load file "${path}": ${errorMsg}`,
                variant: "destructive",
            });
        } finally {
            setIsFetchingFile(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4">
                <Skeleton className="h-8 w-1/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3 mb-2" />
            </div>
        )
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <ResizablePanelGroup direction="horizontal" className="h-full max-h-full">
            <ResizablePanel defaultSize={25} minSize={15}>
                <div className="p-4 h-full overflow-y-auto">
                    <h2 className="text-lg font-semibold mb-2">Recent</h2>
                    <ul>
                        {recentFiles.map(file => (
                            <li key={file.path} onClick={() => handleFileSelect(file.path)} className="cursor-pointer hover:underline text-sm p-1">
                                {file.name}
                            </li>
                        ))}
                    </ul>
                    <h2 className="text-lg font-semibold my-2">All</h2>
                    <FileTree nodes={treeData} onFileSelect={handleFileSelect} />
                </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={75}>
                <EditorPanel selectedFile={selectedFile} isFetchingFile={isFetchingFile} />
            </ResizablePanel>
        </ResizablePanelGroup>
    );
};

export default DataExplorer; 