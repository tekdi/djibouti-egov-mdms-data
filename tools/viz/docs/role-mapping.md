Roles - roles are defined in the traditional way with a mapping to the user type. It has a code that is generally the same as the name. You can look for more examples in the data/dj/ACCESSCONTROL-ROLES/roles.json file. The JSON looks something like this:

```json
{
  "code": "CITIZEN",
  "name": "Citizen",
  "description": "Default role for citizen"
}
```

Actions - things that a roles can do. In this context, it is generally being able to call an API. It has a unique id. You can look for more examples in the data/dj/ACCESSCONTROL-ACTIONS-TEST/actions-test.json file. The JSON looks something like this:

```json
 {
      "id": 1635,
      "url": "/egov-workflow-v2/egov-wf/businessservice/_create",
      "code": "null",
      "name": "BusinessService Create",
      "path": "",
      "enabled": false,
      "displayName": "BusinessService Create",
      "orderNumber": 0,
      "serviceCode": "egov-workflow-v2",
      "parentModule": ""
    },
```

Currently the action rolemapping is

1. not coming from the API (only from the local files)
2. cannot be changed and not being persisted either locally or on the DB

We would want to make it very similar to how the localization is

- ability to pull / add new data from APIs
- optionally show the data from /data folder (which acts as a playground before committing the data to the database through APIs)

About MDMS:

- https://core.digit.org/platform/core-services/mdms-v2-master-data-management-service/mdms-master-data-management-service
- https://core.digit.org/platform/core-services/mdms-v2-master-data-management-service/mdms-master-data-management-service/setting-up-master-data/configuring-master-data
- https://core.digit.org/platform/core-services/mdms-v2-master-data-management-service/mdms-master-data-management-service/setting-up-master-data/adding-new-master

# API to search existing roles

```bash
curl --location '<base-url>/egov-mdms-service/v2/_search' \
--header 'accept: application/json, text/plain, */*' \
--header 'content-type: application/json;charset=UTF-8' \
--data-raw '{
    "MdmsCriteria": {
        "tenantId": "dj",
        "schemaCode": "ACCESSCONTROL-ROLES.roles",
        "filters": {
            "code": "BPA_SDECC_HOD"
        },
        "limit": 10,
        "offset": 0
    },
    "RequestInfo": {
        "apiId": "Rainmaker",
        "authToken": "d99267e5-187a-4795-82f8-fe55da0c1ae0",
        "userInfo": {"id":1856,"uuid":"15cf935d-2b70-42e5-b23c-e69ff7d5d83f","userName":"akshay.gandhi@tekditechnologies.com","name":"Akshay","mobileNumber":"77545454","emailId":"akshay.gandhi@tekditechnologies.com","locale":null,"type":"EMPLOYEE","roles":[{"name":"Studio Admin","code":"STUDIO_ADMIN","tenantId":"dj"}],"active":true,"tenantId":"dj","permanentCity":null}
    }
}'
```

the response looks like this:

```json
{
  "ResponseInfo": {
    "apiId": null,
    "ver": null,
    "ts": null,
    "resMsgId": "uief87324",
    "msgId": null,
    "status": "successful"
  },
  "mdms": [
    {
      "id": "254b0d2c-88a6-469e-a5ec-e468a9931532",
      "tenantId": "dj",
      "schemaCode": "ACCESSCONTROL-ROLES.roles",
      "uniqueIdentifier": "BPA_SDECC_HOD",
      "data": {
        "code": "BPA_SDECC_HOD",
        "name": "BPA SDECC HOD",
        "description": "HOD of Sub-Directorate For Expertise And Control Of Constructions"
      },
      "isActive": true,
      "auditDetails": {
        "createdBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "lastModifiedBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "createdTime": 1749800610629,
        "lastModifiedTime": 1749800610629
      }
    }
  ]
}
```

# API to search existing actions

```bash
curl --location '<base-url>/egov-mdms-service/v2/_search' \
--header 'accept: application/json, text/plain, */*' \
--header 'content-type: application/json;charset=UTF-8' \
--data-raw '{
    "MdmsCriteria": {
        "tenantId": "dj",
        "schemaCode": "ACCESSCONTROL-ACTIONS-TEST.actions-test",
        "filters": {
            "url": "/egov-mdms-service/schema/v1/_create"
        },
        "limit": 10,
        "offset": 0
    },
    "RequestInfo": {
        "apiId": "Rainmaker",
        "authToken": "{{auth-token}}",
        "userInfo": {{user-info}}
    }
}'
```

response looks like this (all the data fields can be filtered in the request):

```json
{
  "ResponseInfo": {
    "apiId": null,
    "ver": null,
    "ts": null,
    "resMsgId": "uief87324",
    "msgId": null,
    "status": "successful"
  },
  "mdms": [
    {
      "id": "9df46576-999b-4a60-b03d-cb5855d95d2e",
      "tenantId": "dj",
      "schemaCode": "ACCESSCONTROL-ACTIONS-TEST.actions-test",
      "uniqueIdentifier": "1858",
      "data": {
        "id": 1858,
        "url": "/egov-mdms-service/schema/v1/_create",
        "name": "MDMS Schema Create",
        "path": "",
        "enabled": true,
        "leftIcon": "",
        "tenantId": "dj",
        "createdBy": null,
        "rightIcon": "",
        "createdDate": null,
        "displayName": "MDMS v2 create",
        "orderNumber": 1,
        "queryParams": "",
        "serviceCode": "MDMS v2 create",
        "parentModule": "",
        "navigationURL": "",
        "lastModifiedBy": null,
        "lastModifiedDate": null
      },
      "isActive": true,
      "auditDetails": {
        "createdBy": "15cf935d-2b70-42e5-b23c-e69ff7d5d83f",
        "lastModifiedBy": "15cf935d-2b70-42e5-b23c-e69ff7d5d83f",
        "createdTime": 1750337995656,
        "lastModifiedTime": 1750337995656
      }
    }
  ]
}
```

# API to search existing role-action mappings

```bash
curl --location '<base-url>/egov-mdms-service/v2/_search' \
--header 'accept: application/json, text/plain, */*' \
--header 'content-type: application/json;charset=UTF-8' \
--data-raw '{
    "MdmsCriteria": {
        "tenantId": "dj",
        "schemaCode": "ACCESSCONTROL-ROLEACTIONS.roleactions",
        "filters": {
            "rolecode": "BPA_ARCHITECT"
        },
        "limit": 10,
        "offset": 0
    },
    "RequestInfo": {
        "apiId": "Rainmaker",
        "authToken": "d99267e5-187a-4795-82f8-fe55da0c1ae0",
        "userInfo": {"id":1856,"uuid":"15cf935d-2b70-42e5-b23c-e69ff7d5d83f","userName":"akshay.gandhi@tekditechnologies.com","name":"Akshay","mobileNumber":"77545454","emailId":"akshay.gandhi@tekditechnologies.com","locale":null,"type":"EMPLOYEE","roles":[{"name":"Studio Admin","code":"STUDIO_ADMIN","tenantId":"dj"}],"active":true,"tenantId":"dj","permanentCity":null}
    }
}'
```

the response looks like this:

```json
{
  "ResponseInfo": {
    "apiId": null,
    "ver": null,
    "ts": null,
    "resMsgId": "uief87324",
    "msgId": null,
    "status": "successful"
  },
  "mdms": [
    {
      "id": "95864213-4c31-4fc3-80e8-858b0439e91d",
      "tenantId": "dj",
      "schemaCode": "ACCESSCONTROL-ROLEACTIONS.roleactions",
      "uniqueIdentifier": "5586.BPA_ARCHITECT",
      "data": {
        "actionid": 5586,
        "rolecode": "BPA_ARCHITECT",
        "tenantId": "dj",
        "actioncode": ""
      },
      "isActive": true,
      "auditDetails": {
        "createdBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "lastModifiedBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "createdTime": 1750931215960,
        "lastModifiedTime": 1750931215960
      }
    },
    {
      "id": "bd251840-7601-4da6-9b2e-97379addd25c",
      "tenantId": "dj",
      "schemaCode": "ACCESSCONTROL-ROLEACTIONS.roleactions",
      "uniqueIdentifier": "10024.BPA_ARCHITECT",
      "data": {
        "actionid": 10024,
        "rolecode": "BPA_ARCHITECT",
        "tenantId": "dj",
        "actioncode": ""
      },
      "isActive": true,
      "auditDetails": {
        "createdBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "lastModifiedBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "createdTime": 1750424645419,
        "lastModifiedTime": 1750424645419
      }
    },
    {
      "id": "e84735dc-5a39-429e-985f-1ac8bfbc53bc",
      "tenantId": "dj",
      "schemaCode": "ACCESSCONTROL-ROLEACTIONS.roleactions",
      "uniqueIdentifier": "4.BPA_ARCHITECT",
      "data": {
        "actionid": 4,
        "rolecode": "BPA_ARCHITECT",
        "tenantId": "dj",
        "actioncode": ""
      },
      "isActive": true,
      "auditDetails": {
        "createdBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "lastModifiedBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "createdTime": 1750403430952,
        "lastModifiedTime": 1750403430952
      }
    },
    {
      "id": "3bb65c4c-1ba0-42f3-8916-d9f572a5599a",
      "tenantId": "dj",
      "schemaCode": "ACCESSCONTROL-ROLEACTIONS.roleactions",
      "uniqueIdentifier": "5585.BPA_ARCHITECT",
      "data": {
        "actionid": 5585,
        "rolecode": "BPA_ARCHITECT",
        "tenantId": "dj",
        "actioncode": ""
      },
      "isActive": true,
      "auditDetails": {
        "createdBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "lastModifiedBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "createdTime": 1749123177666,
        "lastModifiedTime": 1749123177666
      }
    },
    {
      "id": "cd973e58-80a1-49c1-bfb5-f2daf393c77d",
      "tenantId": "dj",
      "schemaCode": "ACCESSCONTROL-ROLEACTIONS.roleactions",
      "uniqueIdentifier": "4873.BPA_ARCHITECT",
      "data": {
        "actionid": 4873,
        "rolecode": "BPA_ARCHITECT",
        "tenantId": "dj",
        "actioncode": ""
      },
      "isActive": true,
      "auditDetails": {
        "createdBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "lastModifiedBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "createdTime": 1748462636941,
        "lastModifiedTime": 1748462636941
      }
    },
    {
      "id": "e9b44fae-a577-47c9-b96a-59cf7b34127f",
      "tenantId": "dj",
      "schemaCode": "ACCESSCONTROL-ROLEACTIONS.roleactions",
      "uniqueIdentifier": "4874.BPA_ARCHITECT",
      "data": {
        "actionid": 4874,
        "rolecode": "BPA_ARCHITECT",
        "tenantId": "dj",
        "actioncode": ""
      },
      "isActive": true,
      "auditDetails": {
        "createdBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "lastModifiedBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "createdTime": 1748462636630,
        "lastModifiedTime": 1748462636630
      }
    },
    {
      "id": "fa78c783-1ab8-4f0e-9ee9-b430715857f5",
      "tenantId": "dj",
      "schemaCode": "ACCESSCONTROL-ROLEACTIONS.roleactions",
      "uniqueIdentifier": "2203.BPA_ARCHITECT",
      "data": {
        "actionid": 2203,
        "rolecode": "BPA_ARCHITECT",
        "tenantId": "dj",
        "actioncode": ""
      },
      "isActive": true,
      "auditDetails": {
        "createdBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "lastModifiedBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "createdTime": 1748462636322,
        "lastModifiedTime": 1748462636322
      }
    },
    {
      "id": "4225f292-0570-43f3-bc66-4059c8665951",
      "tenantId": "dj",
      "schemaCode": "ACCESSCONTROL-ROLEACTIONS.roleactions",
      "uniqueIdentifier": "2201.BPA_ARCHITECT",
      "data": {
        "actionid": 2201,
        "rolecode": "BPA_ARCHITECT",
        "tenantId": "dj",
        "actioncode": ""
      },
      "isActive": true,
      "auditDetails": {
        "createdBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "lastModifiedBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "createdTime": 1748462636017,
        "lastModifiedTime": 1748462636017
      }
    },
    {
      "id": "b6c6df32-c616-41fb-a87a-0d3d22b79a26",
      "tenantId": "dj",
      "schemaCode": "ACCESSCONTROL-ROLEACTIONS.roleactions",
      "uniqueIdentifier": "2202.BPA_ARCHITECT",
      "data": {
        "actionid": 2202,
        "rolecode": "BPA_ARCHITECT",
        "tenantId": "dj",
        "actioncode": ""
      },
      "isActive": true,
      "auditDetails": {
        "createdBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "lastModifiedBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "createdTime": 1748462635709,
        "lastModifiedTime": 1748462635709
      }
    },
    {
      "id": "08b8bb50-b661-4406-8553-7c42618ba3dd",
      "tenantId": "dj",
      "schemaCode": "ACCESSCONTROL-ROLEACTIONS.roleactions",
      "uniqueIdentifier": "1638.BPA_ARCHITECT",
      "data": {
        "actionid": 1638,
        "rolecode": "BPA_ARCHITECT",
        "tenantId": "dj",
        "actioncode": ""
      },
      "isActive": true,
      "auditDetails": {
        "createdBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "lastModifiedBy": "8a32a4ea-dc0b-465d-b45a-95577475b45d",
        "createdTime": 1748462635397,
        "lastModifiedTime": 1748462635397
      }
    }
  ]
}
```

# API to add a new role

```bash
curl --location '<base-url>/egov-mdms-service/v2/_create/ACCESSCONTROL-ROLES.roles' \
--header 'Content-Type: application/json' \
--data-raw '{
    "RequestInfo": {
        "apiId": "Rainmaker",
        "authToken": "{{auth-token}}",
        "userInfo": {{user-info}}
    },
    "Mdms": {
        "tenantId": "dj",
        "schemaCode": "ACCESSCONTROL-ROLES.roles",
        "data":  {
            "code": "CHAKSHU",
            "name": "Chakshu",
            "description": "Internal Team Member - Chakshu"
        }
    }
}'
```

# API to add a new action

```bash
curl --location '<base-url>/egov-mdms-service/v2/_create/ACCESSCONTROL-ACTIONS-TEST.actions-test' \
--header 'Content-Type: application/json' \
--data-raw '{
    "RequestInfo": {
        "apiId": "Rainmaker",
        "authToken": "{{auth-token}}",
        "userInfo": {{user-info}}
    },
    "Mdms": {
        "tenantId": "dj",
        "schemaCode": "ACCESSCONTROL-ACTIONS-TEST.actions-test",
        "data": {
            "id": 2949,
            "url": "/egov-mdms-service/v2/_create/DigitStudio.DocumentConfig",
            "name": "MDMS",
            "path": "",
            "enabled": true,
            "leftIcon": "",
            "tenantId": "dj",
            "createdBy": null,
            "rightIcon": "",
            "createdDate": null,
            "displayName": "Create DocumentConfig",
            "orderNumber": 1,
            "queryParams": "",
            "serviceCode": "MDMS",
            "parentModule": "",
            "navigationURL": "",
            "lastModifiedBy": null,
            "lastModifiedDate": null
        }
    }
}'
```

# API to add a new role-action mapping

```bash
curl --location '<base-url>/egov-mdms-service/v2/_create/ACCESSCONTROL-ROLEACTIONS.roleactions' \
--header 'Content-Type: application/json' \
--data '{
    "RequestInfo": {
        "apiId": "Rainmaker",
        "authToken": "{{auth-token}}",
        "userInfo": {{user-info}}
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

# API to search the mdms data (need to change this to ensure search is for role actions)

```bash
curl --location 'https://djibouti.tekdinext.com/egov-mdms-service/v1/_search?tenantId=dj' \
--header 'Content-Type: application/json' \
--data-raw '{
    "RequestInfo": {
        "apiId": "Rainmaker",
        "authToken": "{{auth-token}}",
        "userInfo": {{user-info}}
    },
    "MdmsCriteria": {
        "tenantId": "dj",
        "moduleDetails": [
            {
                "moduleName": "Studio",
                "masterDetails": [
                    {
                        "name": "ServiceConfiguration",
                        "filter": "$[?(@.service == '\''BPA_PCO'\'')]"
                    }
                ]
            }
        ]
    }
}'
```

```

```
