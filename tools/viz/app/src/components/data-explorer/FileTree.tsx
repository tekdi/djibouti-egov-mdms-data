import { useState } from 'react';
import type { TreeNode } from '@/lib/api/data-explorer';
import { File, Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';

interface FileTreeProps {
  nodes: TreeNode[];
  onFileSelect: (path: string) => void;
  level?: number;
}

const FileTree = ({ nodes, onFileSelect, level = 0 }: FileTreeProps) => {
  return (
    <ul style={{ paddingLeft: `${level > 0 ? 20 : 0}px` }}>
      {nodes.map(node => (
        <Node key={node.path} node={node} onFileSelect={onFileSelect} level={level} />
      ))}
    </ul>
  );
};

interface NodeProps {
    node: TreeNode;
    onFileSelect: (path: string) => void;
    level: number;
}

const Node = ({ node, onFileSelect, level }: NodeProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const isFolder = node.type === 'folder';

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleFileClick = () => {
        if (!isFolder) {
            onFileSelect(node.path);
        }
    };

    return (
        <li>
            <div
                className="flex items-center cursor-pointer hover:bg-muted p-1 rounded"
                onClick={isFolder ? handleToggle : handleFileClick}
            >
                {isFolder ? (
                    <>
                        {isOpen ? <ChevronDown size={16} className="mr-1" /> : <ChevronRight size={16} className="mr-1" />}
                        {isOpen ? <FolderOpen size={16} className="mr-2" /> : <Folder size={16} className="mr-2" />}
                    </>
                ) : (
                    <File size={16} className="mr-2" style={{ marginLeft: '20px' }} />
                )}
                <span>{node.name}</span>
            </div>
            {isFolder && isOpen && node.children && (
                <FileTree nodes={node.children} onFileSelect={onFileSelect} level={level + 1} />
            )}
        </li>
    );
}


export default FileTree; 