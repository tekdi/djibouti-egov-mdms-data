// Utility script to extract workflow from serviceConfiguration.json
// and prepare it for the workflow visualizer

const fs = require('fs');
const path = require('path');

function extractWorkflowFromServiceConfig(configPath) {
    try {
        // Read the service configuration file
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);

        // Extract workflow from the first service configuration
        if (config.ServiceConfiguration && config.ServiceConfiguration.length > 0) {
            const serviceConfig = config.ServiceConfiguration[0];
            if (serviceConfig.workflow) {
                return serviceConfig.workflow;
            }
        }

        throw new Error('No workflow found in service configuration');
    } catch (error) {
        console.error('Error extracting workflow:', error.message);
        return null;
    }
}

function saveWorkflowForVisualizer(workflow, outputPath) {
    try {
        const formattedWorkflow = JSON.stringify(workflow, null, 2);
        fs.writeFileSync(outputPath, formattedWorkflow);
        console.log(`Workflow saved to: ${outputPath}`);
        return true;
    } catch (error) {
        console.error('Error saving workflow:', error.message);
        return false;
    }
}

// Main execution
function main() {
    const serviceConfigPath = path.join(__dirname, '../../data/dj/Studio/serviceConfiguration.json');
    const outputPath = path.join(__dirname, 'workflow.json');

    console.log('Extracting workflow from service configuration...');
    const workflow = extractWorkflowFromServiceConfig(serviceConfigPath);

    if (workflow) {
        console.log('Workflow extracted successfully!');
        console.log(`Found ${workflow.states.length} states in the workflow`);

        if (saveWorkflowForVisualizer(workflow, outputPath)) {
            console.log('\n✅ Workflow ready for visualizer!');
            console.log(`📁 Open: chakshu/viz/workflow-visualizer.html`);
            console.log(`📄 Load: chakshu/viz/workflow.json`);
        }
    } else {
        console.log('❌ Failed to extract workflow');
    }
}

// Export functions for use in other scripts
module.exports = {
    extractWorkflowFromServiceConfig,
    saveWorkflowForVisualizer
};

// Run if called directly
if (require.main === module) {
    main();
} 