# How to Define a New Service (Business Service) in MDMS

## Where Are These Configurations?

- **Service configuration:** [`data/dj/Studio/serviceConfiguration.json`](../data/dj/Studio/serviceConfiguration.json)
- **Master data (e.g., WorkType, etc.):** [`data/dj/BPA/`](../data/dj/BPA/) (and other module folders)
- **Workflow, roles, actions:** [`data/dj/ACCESSCONTROL-ROLES/roles.json`](../data/dj/ACCESSCONTROL-ROLES/roles.json), [`data/dj/ACCESSCONTROL-ROLEACTIONS/roleactions.json`](../data/dj/ACCESSCONTROL-ROLEACTIONS/roleactions.json)
- **Other master data:** [`data/dj/common-masters/`](../data/dj/common-masters/)

This guide explains how to define a new service (business service) in the MDMS configuration, using `BPA_PCO` in `serviceConfiguration.json` as an example. Follow these steps to add a new service:

---

## 1. Identify the Module

- Decide which module (e.g., BPA, TradeLicense, FSM) your new service belongs to.
- Navigate to the corresponding module section in [`serviceConfiguration.json`](../data/dj/Studio/serviceConfiguration.json) (e.g., `"module": "BPA"`).

## 2. Add a New Service Entry

- Under the `ServiceConfiguration` array in [`serviceConfiguration.json`](../data/dj/Studio/serviceConfiguration.json), add a new object for your service.
- Set the `service` field to a unique identifier (e.g., `BPA_NEW_SERVICE`).

```
{
  "module": "BPA",
  "service": "BPA_NEW_SERVICE",
  ...
}
```

## 3. Define Fields and Master Data References

- List all fields required for the service under the `fields` array in [`serviceConfiguration.json`](../data/dj/Studio/serviceConfiguration.json).
- Reference master data (from MDMS) where needed using the `reference: "mdms"` and `schema` fields.
- Master data is typically found in [`data/dj/BPA/`](../data/dj/BPA/) or [`data/dj/common-masters/`](../data/dj/common-masters/).
- Example:

```
{
  "name": "workType",
  "label": "Type of Work",
  "type": "string",
  "reference": "mdms",
  "schema": "BPA.WorkType",
  ...
}
```

## 4. Configure Workflow

- Define the workflow for your service under the `workflow` key in [`serviceConfiguration.json`](../data/dj/Studio/serviceConfiguration.json).
- Specify states, actions, roles, and transitions.
- Roles and actions are defined in [`roles.json`](../data/dj/ACCESSCONTROL-ROLES/roles.json) and [`roleactions.json`](../data/dj/ACCESSCONTROL-ROLEACTIONS/roleactions.json).
- Example:

```
"workflow": {
  "businessService": "BPA_NEW_SERVICE",
  ...
  "states": [ ... ],
}
```

## 5. Document Requirements

- List required documents under the `documents` array in [`serviceConfiguration.json`](../data/dj/Studio/serviceConfiguration.json).
- Specify categories, types, allowed file formats, and whether each is mandatory.

## 6. ID Generation (idgen)

- Define ID generation formats for applications, receipts, etc., under the `idgen` array in [`serviceConfiguration.json`](../data/dj/Studio/serviceConfiguration.json).
- Example:

```
{
  "format": "DJ-NEW-[cy:yyyy-MM-dd]-[SEQ_DJ_NEW]",
  "name": "egov.idgen.bpa.newserviceNum",
  "type": "application"
}
```

## 7. Billing and Calculator

- Configure billing heads, tax periods, and calculation logic under `bill`, `calculator`, and/or `calculator2` in [`serviceConfiguration.json`](../data/dj/Studio/serviceConfiguration.json).
- Example:

```
"bill": {
  "taxHead": [ ... ],
  ...
}
```

## 8. Notifications

- Set up SMS and email templates for key workflow states under `notification` in [`serviceConfiguration.json`](../data/dj/Studio/serviceConfiguration.json).

## 9. Access Control

- Define which roles can access or perform actions in the service under `access` in [`serviceConfiguration.json`](../data/dj/Studio/serviceConfiguration.json).
- Roles are defined in [`roles.json`](../data/dj/ACCESSCONTROL-ROLES/roles.json).

## 10. Localization

- Add localization module names if needed for translations in [`serviceConfiguration.json`](../data/dj/Studio/serviceConfiguration.json).

## 11. Enable the Service

- Add the new service to the `enabled` array (e.g., `["citizen", "employee"]`) in [`serviceConfiguration.json`](../data/dj/Studio/serviceConfiguration.json).

---

## Example: Minimal New Service Entry

```json
{
  "module": "BPA",
  "service": "BPA_NEW_SERVICE",
  "fields": [ ... ],
  "workflow": { ... },
  "documents": [ ... ],
  "idgen": [ ... ],
  "bill": { ... },
  "calculator": { ... },
  "notification": { ... },
  "access": { ... },
  "localization": { ... },
  "enabled": ["citizen", "employee"]
}
```

---

## 12. Update Master Data (if needed)

- If your service references new master data (e.g., new work types), add them to the appropriate MDMS files, such as [`BPA/WorkType.json`](../data/dj/BPA/WorkType.json) or other relevant files in [`data/dj/BPA/`](../data/dj/BPA/).

## 13. Test the Service

- Deploy your changes to a test environment.
- Verify the new service appears in the UI and works as expected.

---

**Tip:** Always keep your configuration consistent and validate JSON syntax before deploying.
