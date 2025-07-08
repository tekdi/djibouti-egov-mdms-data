# Steps to create a new permit

### Building and testing things out

0. Create a mock `service` through the service api (found in this swagger.yaml)
1. Get the new permit flow form Canva. Identify and document the details of the new permit.
   - Name of the permit
   - permit
   - module name
   - service name
   - workflow name
   - documents needed and formats
   - idgen details
2. Update the new roles, actions and role actions mapping in (Mostly these should be already there if the pilot is already done)
   - [Actions](../data/dj/ACCESSCONTROL-ACTIONS-TEST/actions-test.json)
   - [Roles](../data/dj/ACCESSCONTROL-ROLES/roles.json)
   - [Role Actions Mapping](../data/dj/ACCESSCONTROL-ROLEACTIONS/roleactions.json)
3. Update the [serviceConfiguration.json](../data/dj/Studio/serviceConfiguration.json) file with the new permit.
4. Commit the workflow through the API an cycle through it using the workflow runner tool. All the new IDs should have a `_test` suffix so that those can be deleted later.
5. For testing the workflow read [workflow.md](workflow.md). Visulaize the workflow through the workflow visualizer and see for any logical fallacies. Run through the workflow state machine using the workflow runner and see if it works. Different states / accesss should be available to different roles when the workflow is run. Test the workflows state in the system through the APIs available. Iterate on the workflows and actions states until the workflow is working as expected.
6. Once done, delete the test IDs and commit the changes without the `_test` suffix.
7. Add documents <based on conversation with Akshay>
8. Add how inbox works <based on conversation with Akshay>
9. Add application flow <based on conversation with Akshay>

# Validation of Configuration

1.

### APIs

1. Start by create a new MDMS entry for the `Studio.serviceConfiguration`. `idgen` is the only relevant field for now. `idgen` needs to be avialable in the common-masters - data/dj/common-masters/IdFormat.json.

```bash
curl --location 'https://djibouti.tekdinext.com/egov-mdms-service/v2/_create/Studio.serviceConfiguration' \
--header 'Content-Type: application/json' \
--data '{
    "RequestInfo": {
        "apiId": "Rainmaker",
        "authToken": "9c257cb7-ec45-40b3-8448-6bc405e50a2a",
        "userInfo": {
            "id": 10543,
            "uuid": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
            "userName": "MICROPLAN_ADMIN_DEV",
            "name": "User Dev",
            "mobileNumber": "7222611899",
            "type": "EMPLOYEE",
            "tenantId": "dj"
        }
    },
    "Mdms": {
        "tenantId": "dj",
        "schemaCode": "Studio.serviceConfiguration",
        "data": {
            "module": "BPA",
            "service": "BPA_PCO_SIMPLE",
            "idgen": [
                {
                    "format": "SVC-[cy:yyyy-MM-dd]-[SEQ_PUBLIC_SERVICE]",
                    "idname": "public-service.service.id",
                    "type": "service"
                },
                {
                    "format": "PCO-[SEQ_DJ_PCO]/[cy:yyyy]",
                    "name": "egov.idgen.bpa.applicationNum",
                    "type": "application"
                },
                {
                    "format": "PCO-RPT-[SEQ_DJ_PCO_RPT]/[cy:yyyy]",
                    "name": "bpa.pco.receipt.id",
                    "type": "receipt"
                }
            ]
        }
    }
}'
```

2. If there is an issue, role actions may not be created. In that case, create the role actions manually through the API.

```bash
curl --location 'https://djibouti.tekdinext.com/egov-mdms-service/v2/_create/ACCESSCONTROL-ROLEACTIONS.roleactions' \
--header 'Content-Type: application/json' \
--data '{
    "RequestInfo": {
        "apiId": "Rainmaker",
        "authToken": "some-token",
        "userInfo": {
            "id": 10543,
            "uuid": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
            "userName": "MICROPLAN_ADMIN_DEV",
            "name": "User Dev",
            "mobileNumber": "7222611899",
            "type": "EMPLOYEE",
            "tenantId": "dj"
        }
    },
    "Mdms": {
        "tenantId": "dj",
        "schemaCode": "ACCESSCONTROL-ROLEACTIONS.roleactions",
        "data": {
            "actionid": 1650,
            "rolecode": "BPA_SDECC_AGENT",
            "tenantid": "dj",
            "actioncode": ""
        }
    }
}'
```

3. Create a public service through the API. The only relevant fields are
   `"businessService": "BPA_PCO_SIMPLE"`
   `"tenantId": "dj"`
   `"module": "BPA"` - data/dj/BPA

```bash
curl --location 'https://djibouti.tekdinext.com/public-service/v1/service' \
--header 'Content-Type: application/json' \
--header 'X-Tenant-Id: dj' \
--header 'auth-token: 9c257cb7-ec45-40b3-8448-6bc405e50a2a' \
--data '{
    "RequestInfo": {
        "apiId": "public-service",
        "ver": "1.0",
        "ts": 123456789,
        "action": "create",
        "did": "device-001",
        "key": "xyz",
        "msgId": "msg-001",
        "requesterId": "req-001",
        "authToken": "9c257cb7-ec45-40b3-8448-6bc405e50a2a",
        "userInfo": {
            "uuid": "cf0b9ce6-9654-4e5e-bdbe-3e293a08786e",
            "userName": "77745454",
            "name": "Admin",
            "mobileNumber": "77745454",
            "emailId": null,
            "locale": null,
            "type": "EMPLOYEE",
            "roles": [
                {
                    "name": "STUDIO ADMIN",
                    "code": "Studio Admin",
                    "tenantId": "dj"
                }
            ],
            "active": true,
            "tenantId": "dj",
            "permanentCity": null
        },
        "correlationId": "cor-001"
    },
    "service": {
        "tenantId": "dj",
        "businessService": "BPA_PCO_SIMPLE",
        "module": "BPA",
        "status": "ACTIVE",
        "additionalDetails": {
            "note": "initial creation"
        }
    }
}'
```

4.  Access Control Service to be refereshed through k9s every time role, actions or roleactions are updated.

5.  Add a new Worflow since only the MDMS is updated. The workflow is direclty taken from ServiceConfiguration.json with a couple of fields removed from the top object. UUIDs are auto generated.

```bash
curl --location 'https://djibouti.tekdinext.com/egov-workflow-v2/egov-wf/businessservice/_create' \
--header 'Content-Type: application/json' \
--data-raw '{
    "RequestInfo": {
        "apiId": "Rainmaker",
        "action": "",
        "did": 1,
        "key": "",
        "msgId": "20170310130900|en_IN",
        "requesterId": "",
        "ts": 1513579888683,
        "ver": ".01",
        "authToken": "47617ccc-97a8-46a3-b162-995ab6513bd8",
        "userInfo": {"id":1856,"uuid":"15cf935d-2b70-42e5-b23c-e69ff7d5d83f","userName":"akshay.gandhi@tekditechnologies.com","name":"Akshay","mobileNumber":"77545454","emailId":"akshay.gandhi@tekditechnologies.com","locale":null,"type":"EMPLOYEE","roles":[{"name":"Studio Admin","code":"STUDIO_ADMIN","tenantId":"dj"}],"active":true,"tenantId":"dj","permanentCity":null}
    },
    "BusinessServices": [
        {
            "businessService": "BPA_PCO_SIMPLE",
            "tenantId": "dj",
            "business": "public-services",
            "businessSericeSla": null,
            "states": [
                {
                    "tenantId": "dj",
                    "sla": null,
                    "state": "",
                    "applicationStatus": "",
                    "docUploadRequired": false,
                    "isStartState": true,
                    "isTerminateState": false,
                    "isStateUpdatable": true,
                    "triggerParallelWorkflows": [],
                    "actions": [
                        {
                            "tenantId": "dj",
                            "currentState": "",
                            "action": "DRAFT",
                            "nextState": "INITIATED",
                            "roles": [
                                "BPA_ARCHITECT",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        }
                    ]
                },
                {
                    "tenantId": "dj",
                    "sla": null,
                    "state": "INITIATED",
                    "applicationStatus": "INPROGRESS",
                    "docUploadRequired": false,
                    "isStartState": false,
                    "isTerminateState": false,
                    "isStateUpdatable": false,
                    "triggerParallelWorkflows": [],
                    "actions": [
                        {
                            "tenantId": "dj",
                            "currentState": "INITIATED",
                            "action": "CREATE",
                            "nextState": "AGENT_NOT_ASSIGNED",
                            "roles": [
                                "BPA_ARCHITECT",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        }
                    ]
                },
                {
                    "tenantId": "dj",
                    "sla": null,
                    "state": "AGENT_NOT_ASSIGNED",
                    "applicationStatus": "AGENT_NOT_ASSIGNED",
                    "docUploadRequired": false,
                    "isStartState": false,
                    "isTerminateState": false,
                    "isStateUpdatable": false,
                    "triggerParallelWorkflows": [],
                    "actions": [
                        {
                            "tenantId": "dj",
                            "currentState": "AGENT_NOT_ASSIGNED",
                            "action": "ADD_QUERY",
                            "nextState": "AGENT_NOT_ASSIGNED",
                            "roles": [
                                "BPA_HOD",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        },
                        {
                            "tenantId": "dj",
                            "currentState": "AGENT_NOT_ASSIGNED",
                            "action": "ASSIGN_TO_AGENT",
                            "nextState": "PENDING_ACTION_BY_AGENT",
                            "roles": [
                                "BPA_HOD",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        }
                    ]
                },
                {
                    "tenantId": "dj",
                    "sla": null,
                    "state": "PENDING_ACTION_BY_AGENT",
                    "applicationStatus": "PENDING_ACTION",
                    "docUploadRequired": false,
                    "isStartState": false,
                    "isTerminateState": false,
                    "isStateUpdatable": false,
                    "triggerParallelWorkflows": [],
                    "actions": [
                        {
                            "tenantId": "dj",
                            "currentState": "PENDING_ACTION_BY_AGENT",
                            "action": "SEND_TO_HOD",
                            "nextState": "AGENT_REPORT_READY",
                            "roles": [
                                "BPA_AGENTS",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        },
                        {
                            "tenantId": "dj",
                            "currentState": "PENDING_ACTION_BY_AGENT",
                            "action": "ADD_QUERY",
                            "nextState": "PENDING_ACTION_BY_AGENT",
                            "roles": [
                                "BPA_AGENTS",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        }
                    ]
                },
                {
                    "tenantId": "dj",
                    "sla": null,
                    "state": "AGENT_REPORT_READY",
                    "applicationStatus": "AGENT_REPORT_READY",
                    "docUploadRequired": false,
                    "isStartState": false,
                    "isTerminateState": false,
                    "isStateUpdatable": false,
                    "triggerParallelWorkflows": [],
                    "actions": [
                        {
                            "tenantId": "dj",
                            "currentState": "AGENT_REPORT_READY",
                            "action": "ADD_QUERY",
                            "nextState": "AGENT_REPORT_READY",
                            "roles": [
                                "BPA_HOD",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        },
                        {
                            "tenantId": "dj",
                            "currentState": "AGENT_REPORT_READY",
                            "action": "SEND_TO_SDECC_HOD",
                            "nextState": "SDECC_AGENT_NOT_ASSSIGNED",
                            "roles": [
                                "BPA_HOD",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        }
                    ]
                },
                {
                    "tenantId": "dj",
                    "sla": null,
                    "state": "DECLARED_NON_CONFORM",
                    "applicationStatus": "DECLARED_NON_CONFORM",
                    "docUploadRequired": false,
                    "isStartState": false,
                    "isTerminateState": false,
                    "isStateUpdatable": false,
                    "triggerParallelWorkflows": [],
                    "actions": [
                        {
                            "tenantId": "dj",
                            "currentState": "DECLARED_NON_CONFORM",
                            "action": "REJECT",
                            "nextState": "PERMIT_REJECTED",
                            "roles": [
                                "BPA_DIRECTOR",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        },
                        {
                            "tenantId": "dj",
                            "currentState": "DECLARED_NON_CONFORM",
                            "action": "ADD_QUERY",
                            "nextState": "DECLARED_NON_CONFORM",
                            "roles": [
                                "BPA_DIRECTOR",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        },
                        {
                            "tenantId": "dj",
                            "currentState": "DECLARED_NON_CONFORM",
                            "action": "SEND_TO_COMMISSIONER",
                            "nextState": "AWAITING_ON_COMMISSIONER",
                            "roles": [
                                "BPA_DIRECTOR",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        }
                    ]
                },
                {
                    "tenantId": "dj",
                    "sla": null,
                    "state": "SDECC_AGENT_NOT_ASSSIGNED",
                    "applicationStatus": "SDECC_AGENT_NOT_ASSSIGNED",
                    "docUploadRequired": false,
                    "isStartState": false,
                    "isTerminateState": false,
                    "isStateUpdatable": false,
                    "triggerParallelWorkflows": [],
                    "actions": [
                        {
                            "tenantId": "dj",
                            "currentState": "SDECC_AGENT_NOT_ASSSIGNED",
                            "action": "ADD_QUERY",
                            "nextState": "SDECC_AGENT_NOT_ASSSIGNED",
                            "roles": [
                                "BPA_SDECC_HOD",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        },
                        {
                            "tenantId": "dj",
                            "currentState": "SDECC_AGENT_NOT_ASSSIGNED",
                            "action": "ASSIGN_TO_SDECC_AGENT",
                            "nextState": "PENDING_ACTION_BY_SDECC_AGENT",
                            "roles": [
                                "BPA_SDECC_HOD",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        }
                    ]
                },
                {
                    "tenantId": "dj",
                    "sla": null,
                    "state": "PENDING_ACTION_BY_SDECC_AGENT",
                    "applicationStatus": "PENDING_ACTION_BY_SDECC_AGENT",
                    "docUploadRequired": false,
                    "isStartState": false,
                    "isTerminateState": false,
                    "isStateUpdatable": false,
                    "triggerParallelWorkflows": [],
                    "actions": [
                        {
                            "tenantId": "dj",
                            "currentState": "PENDING_ACTION_BY_SDECC_AGENT",
                            "action": "SEND_TO_SDECC_HOD",
                            "nextState": "SDECC_AGENT_REPORT_READY",
                            "roles": [
                                "BPA_SDECC_AGENT",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        },
                        {
                            "tenantId": "dj",
                            "currentState": "PENDING_ACTION_BY_SDECC_AGENT",
                            "action": "ADD_QUERY",
                            "nextState": "PENDING_ACTION_BY_SDECC_AGENT",
                            "roles": [
                                "BPA_SDECC_AGENT",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        }
                    ]
                },
                {
                    "tenantId": "dj",
                    "sla": null,
                    "state": "SDECC_AGENT_REPORT_READY",
                    "applicationStatus": "SDECC_AGENT_REPORT_READY",
                    "docUploadRequired": false,
                    "isStartState": false,
                    "isTerminateState": false,
                    "isStateUpdatable": false,
                    "triggerParallelWorkflows": [],
                    "actions": [
                        {
                            "tenantId": "dj",
                            "currentState": "SDECC_AGENT_REPORT_READY",
                            "action": "NON_CONFORM",
                            "nextState": "DECLARED_NON_CONFORM",
                            "roles": [
                                "BPA_SDECC_HOD",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        },
                        {
                            "tenantId": "dj",
                            "currentState": "SDECC_AGENT_REPORT_READY",
                            "action": "SEND_TO_DIRECTOR",
                            "nextState": "NOT_FORWARDED_TO_COMMISSIONER",
                            "roles": [
                                "BPA_SDECC_HOD",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        },
                        {
                            "tenantId": "dj",
                            "currentState": "SDECC_AGENT_REPORT_READY",
                            "action": "ADD_QUERY",
                            "nextState": "SDECC_AGENT_REPORT_READY",
                            "roles": [
                                "BPA_SDECC_HOD",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        }
                    ]
                },
                {
                    "tenantId": "dj",
                    "sla": null,
                    "state": "SDECC_AGENT_NOT_ASSSIGNED",
                    "applicationStatus": "SDECC_AGENT_NOT_ASSSIGNED",
                    "docUploadRequired": false,
                    "isStartState": false,
                    "isTerminateState": false,
                    "isStateUpdatable": false,
                    "triggerParallelWorkflows": [],
                    "actions": [
                        {
                            "tenantId": "dj",
                            "currentState": "SDECC_AGENT_NOT_ASSSIGNED",
                            "action": "ADD_QUERY",
                            "nextState": "SDECC_AGENT_NOT_ASSSIGNED",
                            "roles": [
                                "BPA_SDECC_HOD",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        },
                        {
                            "tenantId": "dj",
                            "currentState": "SDECC_AGENT_NOT_ASSSIGNED",
                            "action": "ASSIGN_TO_SDECC_AGENT",
                            "nextState": "PENDING_ACTION_BY_SDECC_AGENT",
                            "roles": [
                                "BPA_SDECC_HOD",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        }
                    ]
                },
                {
                    "tenantId": "dj",
                    "sla": null,
                    "state": "PENDING_ACTION_BY_SDECC_AGENT",
                    "applicationStatus": "PENDING_ACTION_BY_SDECC_AGENT",
                    "docUploadRequired": false,
                    "isStartState": false,
                    "isTerminateState": false,
                    "isStateUpdatable": false,
                    "triggerParallelWorkflows": [],
                    "actions": [
                        {
                            "tenantId": "dj",
                            "currentState": "PENDING_ACTION_BY_SDECC_AGENT",
                            "action": "SEND_TO_SDECC_HOD",
                            "nextState": "SDECC_AGENT_REPORT_READY",
                            "roles": [
                                "BPA_SDECC_AGENT",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        },
                        {
                            "tenantId": "dj",
                            "currentState": "PENDING_ACTION_BY_SDECC_AGENT",
                            "action": "ADD_QUERY",
                            "nextState": "PENDING_ACTION_BY_SDECC_AGENT",
                            "roles": [
                                "BPA_SDECC_AGENT",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        }
                    ]
                },
                {
                    "tenantId": "dj",
                    "sla": null,
                    "state": "SDECC_AGENT_REPORT_READY",
                    "applicationStatus": "SDECC_AGENT_REPORT_READY",
                    "docUploadRequired": false,
                    "isStartState": false,
                    "isTerminateState": false,
                    "isStateUpdatable": false,
                    "triggerParallelWorkflows": [],
                    "actions": [
                        {
                            "tenantId": "dj",
                            "currentState": "SDECC_AGENT_REPORT_READY",
                            "action": "NON_CONFORM",
                            "nextState": "DECLARED_NON_CONFORM",
                            "roles": [
                                "BPA_SDECC_HOD",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        },
                        {
                            "tenantId": "dj",
                            "currentState": "SDECC_AGENT_REPORT_READY",
                            "action": "SEND_TO_DIRECTOR",
                            "nextState": "NOT_FORWARDED_TO_COMMISSIONER",
                            "roles": [
                                "BPA_SDECC_HOD",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        },
                        {
                            "tenantId": "dj",
                            "currentState": "SDECC_AGENT_REPORT_READY",
                            "action": "ADD_QUERY",
                            "nextState": "SDECC_AGENT_REPORT_READY",
                            "roles": [
                                "BPA_SDECC_HOD",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        }
                    ]
                },
                {
                    "tenantId": "dj",
                    "sla": null,
                    "state": "NOT_FORWARDED_TO_COMMISSIONER",
                    "applicationStatus": "NOT_FORWARDED_TO_COMMISSIONER",
                    "docUploadRequired": false,
                    "isStartState": false,
                    "isTerminateState": false,
                    "isStateUpdatable": false,
                    "triggerParallelWorkflows": [],
                    "actions": [
                        {
                            "tenantId": "dj",
                            "currentState": "NOT_FORWARDED_TO_COMMISSIONER",
                            "action": "REJECT",
                            "nextState": "PERMIT_REJECTED",
                            "roles": [
                                "BPA_DIRECTOR",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        },
                        {
                            "tenantId": "dj",
                            "currentState": "NOT_FORWARDED_TO_COMMISSIONER",
                            "action": "ADD_QUERY",
                            "nextState": "NOT_FORWARDED_TO_COMMISSIONER",
                            "roles": [
                                "BPA_DIRECTOR",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        },
                        {
                            "tenantId": "dj",
                            "currentState": "NOT_FORWARDED_TO_COMMISSIONER",
                            "action": "SEND_TO_COMMISSIONER",
                            "nextState": "AWAITING_ON_COMMISSIONER",
                            "roles": [
                                "BPA_DIRECTOR",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        }
                    ]
                },
                {
                    "tenantId": "dj",
                    "sla": null,
                    "state": "AWAITING_ON_COMMISSIONER",
                    "applicationStatus": "AWAITING_ON_COMMISSIONER",
                    "docUploadRequired": false,
                    "isStartState": false,
                    "isTerminateState": false,
                    "isStateUpdatable": false,
                    "triggerParallelWorkflows": [
                        "BPA_PCO_SDECC",
                        "BPA_PCO_DGDCF",
                        "BPA_PCO_ONEAD",
                        "BPA_PCO_DNPC",
                        "BPA_PCO_EDD",
                        "BPA_PCO_INSPD"
                    ],
                    "actions": [
                        {
                            "tenantId": "dj",
                            "currentState": "AWAITING_ON_COMMISSIONER",
                            "action": "REJECT",
                            "nextState": "PERMIT_REJECTED",
                            "roles": [
                                "BPA_DIRECTOR",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        },
                        {
                            "tenantId": "dj",
                            "currentState": "AWAITING_ON_COMMISSIONER",
                            "action": "ADD_QUERY",
                            "nextState": "AWAITING_ON_COMMISSIONER",
                            "roles": [
                                "BPA_DIRECTOR",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        },
                        {
                            "tenantId": "dj",
                            "currentState": "AWAITING_ON_COMMISSIONER",
                            "action": "SEND_TO_CITIZEN_PAYMENT",
                            "nextState": "AWAITING_CITIZEN_PAYMENT",
                            "roles": [
                                "BPA_DIRECTOR",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        }
                    ]
                },
                {
                    "tenantId": "dj",
                    "sla": null,
                    "state": "AWAITING_CITIZEN_PAYMENT",
                    "applicationStatus": "AWAITING_CITIZEN_PAYMENT",
                    "docUploadRequired": false,
                    "isStartState": false,
                    "isTerminateState": false,
                    "isStateUpdatable": false,
                    "triggerParallelWorkflows": [],
                    "actions": [
                        {
                            "tenantId": "dj",
                            "currentState": "AWAITING_CITIZEN_PAYMENT",
                            "action": "ADD_QUERY",
                            "nextState": "AWAITING_CITIZEN_PAYMENT",
                            "roles": [
                                "CITIZEN",
                                "COUNTER_EMPLOYEE",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        },
                        {
                            "tenantId": "dj",
                            "currentState": "AWAITING_CITIZEN_PAYMENT",
                            "action": "MAKE_PAYMENT",
                            "nextState": "CITIZEN_PAYMENT_DONE",
                            "roles": [
                                "CITIZEN",
                                "COUNTER_EMPLOYEE",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        }
                    ]
                },
                {
                    "tenantId": "dj",
                    "sla": null,
                    "state": "CITIZEN_PAYMENT_DONE",
                    "applicationStatus": "CITIZEN_PAYMENT_DONE",
                    "docUploadRequired": false,
                    "isStartState": false,
                    "isTerminateState": false,
                    "isStateUpdatable": false,
                    "triggerParallelWorkflows": [],
                    "actions": [
                        {
                            "tenantId": "dj",
                            "currentState": "CITIZEN_PAYMENT_DONE",
                            "action": "APPROVE",
                            "nextState": "PERMIT_GRANTED",
                            "roles": [
                                "BPA_DIRECTOR",
                                "STUDIO_ADMIN"
                            ],
                            "active": true
                        }
                    ]
                },
                {
                    "tenantId": "dj",
                    "sla": null,
                    "state": "PERMIT_GRANTED",
                    "applicationStatus": "PERMIT_GRANTED",
                    "docUploadRequired": false,
                    "isStartState": false,
                    "isTerminateState": true,
                    "isStateUpdatable": false,
                    "triggerParallelWorkflows": []
                },
                {
                    "tenantId": "dj",
                    "sla": null,
                    "state": "PERMIT_REJECTED",
                    "applicationStatus": "PERMIT_REJECTED",
                    "docUploadRequired": false,
                    "isStartState": false,
                    "isTerminateState": true,
                    "isStateUpdatable": false,
                    "triggerParallelWorkflows": []
                }
            ]
        }
    ]
}'
```
