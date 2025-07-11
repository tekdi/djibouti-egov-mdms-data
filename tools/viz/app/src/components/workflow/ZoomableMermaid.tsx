import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import svgPanZoom from 'svg-pan-zoom';

interface ZoomableMermaidProps {
  diagram: string;
  options?: any;
}

const ZoomableMermaid: React.FC<ZoomableMermaidProps> = ({ diagram, options = {} }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgPanZoomInstance = useRef<any>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      // Early return if container is not available or diagram is empty
      if (!containerRef.current || !diagram.trim()) {
        return;
      }

      try {
        // Clear previous content
        containerRef.current.innerHTML = '';
        
        // Initialize mermaid
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          // Production-safe configuration
          securityLevel: 'loose',
          logLevel: 'error',
          flowchart: { 
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis'
          },
          themeVariables: {
            primaryColor: '#fff',
            primaryTextColor: '#000',
            primaryBorderColor: '#000',
            lineColor: '#000'
          },
          maxWidth: '100%',
          // Help with dynamic imports in production
          externDiagramDefinition: true,
          ...options
        });

        // Generate unique ID to avoid conflicts
        const diagramId = `mermaid-diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Render the diagram
        const { svg } = await mermaid.render(diagramId, diagram);
        
        // Check if container is still available after async operation
        if (!containerRef.current) {
          return;
        }
        
        containerRef.current.innerHTML = svg;

        // Initialize svg-pan-zoom only if SVG element exists and has valid dimensions
        const svgElement = containerRef.current.querySelector('svg');
        if (svgElement) {
          // Force SVG to respect container boundaries
          svgElement.style.width = '100%';
          svgElement.style.height = '100%';
          svgElement.style.maxWidth = '100%';
          svgElement.style.minHeight = '400px';
          svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          
          // Remove any fixed width/height attributes that might constrain the SVG
          svgElement.removeAttribute('width');
          svgElement.removeAttribute('height');
          
          // Get container dimensions for proper scaling
          const containerRect = containerRef.current.getBoundingClientRect();
          
          // Check if SVG has valid dimensions before initializing svg-pan-zoom
          const svgRect = svgElement.getBoundingClientRect();
          if (svgRect.width > 0 && svgRect.height > 0 && containerRect.width > 0 && containerRect.height > 0) {
            // Clean up any existing instance first
            if (svgPanZoomInstance.current) {
              try {
                svgPanZoomInstance.current.destroy();
              } catch (e) {
                console.warn('Error destroying previous svg-pan-zoom instance:', e);
              }
              svgPanZoomInstance.current = null;
            }

            // Initialize new svg-pan-zoom instance
            try {
              svgPanZoomInstance.current = svgPanZoom(svgElement, {
                zoomEnabled: true,
                panEnabled: true,
                controlIconsEnabled: true,
                fit: true,
                center: true,
                minZoom: 0.1,
                maxZoom: 10,
                beforePan: () => true,
                beforeZoom: () => true,
                zoomScaleSensitivity: 0.1,
                dblClickZoomEnabled: false
              });
            } catch (e) {
              console.warn('Error initializing svg-pan-zoom:', e);
            }
          }
        }
      } catch (error) {
        console.error('Failed to render diagram:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="flex items-center justify-center h-64 text-red-500 bg-red-50 border border-red-200 rounded p-4">
              <div class="text-center">
                <p class="font-medium">Failed to render diagram</p>
                <p class="text-sm text-red-400 mt-1">${error instanceof Error ? error.message : 'Unknown error'}</p>
              </div>
            </div>
          `;
        }
      }
    };

    renderDiagram();

    // Cleanup function
    return () => {
      if (svgPanZoomInstance.current) {
        try {
          // Check if the instance is still valid before destroying
          if (typeof svgPanZoomInstance.current.destroy === 'function') {
            svgPanZoomInstance.current.destroy();
          }
        } catch (e) {
          // Silently handle cleanup errors as they're not critical
          console.warn('Error during svg-pan-zoom cleanup:', e);
        } finally {
          svgPanZoomInstance.current = null;
        }
      }
    };
  }, [diagram, options]);

  return (
    <div 
      ref={containerRef} 
      className="zoomable-mermaid-container w-full h-full" 
      style={{ 
        minHeight: '400px', 
        width: '100%', 
        height: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        position: 'relative',
        flex: '1 1 auto'
      }}
    />
  );
};

export default ZoomableMermaid; 