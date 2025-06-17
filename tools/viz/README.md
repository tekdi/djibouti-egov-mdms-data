# Development Proxy Server

Due to CORS restrictions on the eGov APIs, you must run a local Node/Express proxy server during development. This proxy will forward API requests to the real backend and also serve the frontend files. See `server.js` for setup and usage instructions.

---

# Workflow Visualizer

A single-page HTML application that converts workflow JSON configurations into interactive Mermaid diagrams for visual verification and analysis.

## Features

- **Live Editor**: JSON editor with syntax highlighting and validation
- **Real-time Visualization**: Automatically converts workflow JSON to Mermaid diagrams
- **Multiple Loading Options**: Load sample data, service configurations, or upload files
- **Auto-update**: Diagrams update automatically as you edit the JSON
- **Error Handling**: Clear error messages for invalid JSON or workflow structures

## Files

- `workflow-visualizer.html` - Main application (open in browser)
- `load-service-config.js` - Node.js script to extract workflows from service configurations
- `workflow.json` - Extracted workflow from serviceConfiguration.json (generated)

## Usage

### 1. Extract Workflow from Service Configuration

First, extract the workflow from your service configuration:

```bash
cd chakshu/viz
node load-service-config.js
```

This will create a `workflow.json` file with the extracted workflow.

### 2. Open the Visualizer

Open `workflow-visualizer.html` in your web browser:

```bash
# From the viz directory
open workflow-visualizer.html
# or
python -m http.server 8000  # Then visit http://localhost:8000
```

### 3. Load Workflow Data

You have several options to load workflow data:

- **Load Sample**: Loads a basic workflow example
- **Load Service Config**: Loads the extracted `workflow.json` file
- **Load from File**: Upload any JSON file (service config or direct workflow)
- **Manual Entry**: Type or paste JSON directly in the editor

### 4. Visual Elements

The diagram uses different shapes and colors to represent:

- **🟢 Start States**: Green circles for workflow entry points
- **🔷 Decision Points**: Yellow diamonds for states with multiple actions
- **🔵 Process States**: Blue rectangles for single-action states
- **🔴 End States**: Red double rectangles for terminal states
- **Dotted Lines**: Parallel workflow triggers

## Workflow JSON Structure

The visualizer expects workflow JSON in this format:

```json
{
  "businessService": "BPA_PCO",
  "states": [
    {
      "state": "STATE_NAME",
      "isStartState": true/false,
      "isTerminateState": true/false,
      "actions": [
        {
          "action": "ACTION_NAME",
          "nextState": "NEXT_STATE",
          "roles": ["ROLE1", "ROLE2"]
        }
      ],
      "triggerParallelWorkflows": ["WORKFLOW1", "WORKFLOW2"]
    }
  ]
}
```

## Service Configuration Support

The visualizer can automatically extract workflows from service configuration files with this structure:

```json
{
  "ServiceConfiguration": [
    {
      "service": "SERVICE_NAME",
      "workflow": {
        // workflow structure here
      }
    }
  ]
}
```

## Tips

1. **Auto-update**: Keep the auto-update checkbox enabled for real-time visualization
2. **Format JSON**: Use the "Format JSON" button to clean up indentation
3. **Error Messages**: Check the error panel if diagrams don't render
4. **File Loading**: The visualizer works best when served from a web server (due to CORS restrictions for file loading)

## Troubleshooting

- **"workflow.json not found"**: Run the extraction script first
- **Diagram not rendering**: Check JSON syntax and workflow structure
- **CORS errors**: Serve the HTML file from a web server instead of opening directly

## Development

To modify the workflow-to-mermaid conversion logic, edit the `workflowToMermaid()` function in the HTML file. The function maps:

- States to Mermaid nodes with appropriate shapes
- Actions to labeled connections
- Roles to connection labels
- Parallel workflows to dotted connections
