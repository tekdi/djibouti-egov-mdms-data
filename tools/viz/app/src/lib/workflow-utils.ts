export const SAMPLE_WORKFLOW = {
  tenantId: "dj",
  businessService: "BPA_SIMPLE",
  business: "BPA",
  businessServiceSla: 30 * 24 * 60 * 60 * 1000,
  states: [
    {
      tenantId: "dj",
      sla: null,
      state: "AWAITING_CITIZEN_PAYMENT",
      applicationStatus: "AWAITING_CITIZEN_PAYMENT",
      docUploadRequired: false,
      isStartState: false,
      isTerminateState: false,
      isStateUpdatable: false,
      triggerParallelWorkflows: [],
      actions: [
        {
          tenantId: "dj",
          currentState: "AWAITING_CITIZEN_PAYMENT",
          action: "ADD_QUERY",
          nextState: "AWAITING_CITIZEN_PAYMENT",
          roles: ["CITIZEN", "STUDIO_ADMIN"],
          active: true,
        },
        {
          tenantId: "dj",
          currentState: "AWAITING_CITIZEN_PAYMENT",
          action: "MAKE_PAYMENT",
          nextState: "CITIZEN_PAYMENT_DONE",
          roles: ["CITIZEN", "STUDIO_ADMIN"],
          active: true,
        },
      ],
    },
    {
      tenantId: "dj",
      sla: null,
      state: "CITIZEN_PAYMENT_DONE",
      applicationStatus: "CITIZEN_PAYMENT_DONE",
      docUploadRequired: false,
      isStartState: false,
      isTerminateState: false,
      isStateUpdatable: false,
      triggerParallelWorkflows: [],
      actions: [
        {
          tenantId: "dj",
          currentState: "CITIZEN_PAYMENT_DONE",
          action: "APPROVE",
          nextState: "PERMIT_GRANTED",
          roles: ["BPA_DIRECTOR", "STUDIO_ADMIN"],
          active: true,
        },
      ],
    },
    {
      tenantId: "dj",
      sla: null,
      state: "PERMIT_GRANTED",
      applicationStatus: "PERMIT_GRANTED",
      docUploadRequired: false,
      isStartState: false,
      isTerminateState: true,
      isStateUpdatable: false,
      triggerParallelWorkflows: [],
    },
    {
      tenantId: "dj",
      sla: null,
      state: "PERMIT_REJECTED",
      applicationStatus: "PERMIT_REJECTED",
      docUploadRequired: false,
      isStartState: false,
      isTerminateState: true,
      isStateUpdatable: false,
      triggerParallelWorkflows: [],
    },
  ],
};

export interface WorkflowState {
  tenantId: string;
  state: string;
  applicationStatus: string;
  isStartState: boolean;
  isTerminateState: boolean;
  actions?: WorkflowAction[];
  triggerParallelWorkflows?: string[];
}

export interface WorkflowAction {
  currentState: string;
  action: string;
  nextState: string;
  roles: string[];
  active: boolean;
}

export interface Workflow {
  tenantId: string;
  businessService: string;
  states: WorkflowState[];
}

export const cleanNodeId = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9_]/g, "_").replace(/^_+|_+$/g, "") || "NODE";
};

export const workflowToMermaid = (workflow: Workflow): string => {
  let mermaid = "flowchart LR\n";
  const states = workflow.states || [];
  const stateMap: Record<string, string> = {};

  // Extract all unique roles
  const allRoles = new Set<string>();
  states.forEach((state) => {
    if (state.actions) {
      state.actions.forEach((action) => {
        if (action.roles) {
          action.roles.forEach((role) => allRoles.add(role));
        }
      });
    }
  });

  const rolesList = Array.from(allRoles).sort();

  // Map states to their primary role
  const stateToRole: Record<string, string> = {};
  states.forEach((state) => {
    const stateName = state.state || "START";

    if (state.actions && state.actions.length > 0) {
      const primaryRole = state.actions[0].roles
        ? state.actions[0].roles[0]
        : "SYSTEM";
      stateToRole[stateName] = primaryRole;
    } else {
      stateToRole[stateName] = "SYSTEM";
    }
  });

  // Create subgraphs for each role (swimlanes)
  rolesList.forEach((role) => {
    mermaid += `    subgraph ${cleanNodeId(role)}["${role}"]\n`;

    states.forEach((state) => {
      const stateName = state.state || "START";
      const cleanId = cleanNodeId(stateName);
      stateMap[stateName] = cleanId;

      if (stateToRole[stateName] === role) {
        const label = stateName || "START";
        mermaid += `        ${cleanId}["${label}"]\n`;
      }
    });

    mermaid += `    end\n\n`;
  });

  // Add system/terminal states
  const systemStates = states.filter((state) => {
    const stateName = state.state || "START";
    return stateToRole[stateName] === "SYSTEM";
  });

  if (systemStates.length > 0) {
    mermaid += `    subgraph SYSTEM["SYSTEM"]\n`;
    systemStates.forEach((state) => {
      const stateName = state.state || "START";
      const cleanId = cleanNodeId(stateName);
      stateMap[stateName] = cleanId;
      const label = stateName || "START";
      mermaid += `        ${cleanId}["${label}"]\n`;
    });
    mermaid += `    end\n\n`;
  }

  // Create connections
  states.forEach((state) => {
    if (state.actions) {
      state.actions.forEach((action) => {
        const fromState = state.state || "START";
        const toState = action.nextState;
        const fromId = stateMap[fromState];
        let toId = stateMap[toState];

        if (!toId) {
          toId = cleanNodeId(toState);
          stateMap[toState] = toId;
        }

        const actionLabel = (action.action || "").replace(/"/g, "'");
        if (actionLabel) {
          mermaid += `    ${fromId} -->|"${actionLabel}"| ${toId}\n`;
        } else {
          mermaid += `    ${fromId} --> ${toId}\n`;
        }
      });
    }
  });

  // Add parallel workflows
  states.forEach((state) => {
    if (
      state.triggerParallelWorkflows &&
      state.triggerParallelWorkflows.length > 0
    ) {
      const stateId = stateMap[state.state];
      state.triggerParallelWorkflows.forEach((workflow) => {
        const workflowId = cleanNodeId(workflow);
        mermaid += `    ${workflowId}["${workflow}"]\n`;
        mermaid += `    ${stateId} -.->|"Triggers"| ${workflowId}\n`;
      });
    }
  });

  return mermaid;
};
