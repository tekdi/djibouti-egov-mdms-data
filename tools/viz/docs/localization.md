# Product Requirements Document: Localization Management Interface

Version: 1.0
Date: June 17, 2025
Author: Gemini
Status: Draft

## 1. Introduction & Problem Statement

Developers and localization managers often struggle to manage application text strings (localization keys) across multiple languages and application modules. The process can be fragmented, relying on spreadsheets, code files, or disparate tools, which leads to inconsistencies, missing translations, and a lack of a centralized overview.

This document describes a web-based Localization Management Interface designed to solve this problem. It will provide a centralized, intuitive, and efficient way for teams to view, add, edit, and manage all localization content. The interface is designed to be a "single source of truth" for all user-facing text in the application.

## 2. Goals & Objectives

The primary goal of this project is to streamline the localization workflow, reduce errors, and improve team productivity.

### Objective

### Key Result (Success Metric)

| Objective               | Key Result (Success Metric)                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| Increase Efficiency     | Reduce the time required to add and translate a new key by 50%                                      |
| Improve Quality         | Decrease the number of reported bugs related to missing or incorrect translations by 30%            |
| Centralize Management   | Achieve 100% adoption of the tool by developers and the localization team for managing translations |
| Enhance User Experience | Achieve a Net Promoter Score (NPS) of 40+ from the tool's users                                     |

3. User Personas
   Persona

Needs & Goals

| Persona | Role                      | Needs & Goals                                                                                                                                                                                          |
| ------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Priya   | Localization Manager      | • Needs a high-level overview of translation status across all languages<br>• Wants to easily identify missing translations<br>• Manage the overall quality and consistency of content                 |
| David   | Software Developer        | • Needs to quickly add new keys for features they are building<br>• Wants an easy way to find and implement the correct translation keys in the codebase<br>• Avoid dealing with complex files         |
| Carlos  | Translator/Content Editor | • Needs a simple interface to view source text (e.g., in English)<br>• Provide accurate translations for their assigned language(s)<br>• Needs clarity on which application module a string belongs to |

## 4. Functional Requirements & User Stories

This feature is a CRUD (Create, Read, Update, Delete) interface for localization strings.

### 4.1. Core View (Read)

**User Story:** As a user, I want to view all localization strings in a clear, tabular format so that I can quickly assess the status of all translations.

**UI:** A data grid with resizable columns.

**Columns:**

- **Locale Code:** The unique identifier for the string (e.g., `user.profile.saveButton`)
- **Module:** The application area the string belongs to (e.g., "Checkout," "User-Settings"). This will be a filterable dropdown
- **Language Columns (en, fr, etc.):** A dedicated column for each supported language, displaying the translated text
- **Status Columns (isFr in DB, etc.):** A column for each non-primary language indicating its status. This should be a visual indicator (e.g., a green checkmark if present, a red 'x' if missing)

### 4.2. Add New String (Create)

**User Story:** As a developer, I want to add a new string with its base translation so that I can support new user-facing text in the application.

**Trigger:** User clicks the + Add New button.

**Action:** A new, editable row appears at the top of the table or a modal dialog opens.

**Fields to complete:**

- Locale Code (required, must be unique)
- Module (required, selected from a predefined list)
- Base language text (e.g., en)

**Outcome:** A new string is created in the database. Fields for other languages are initially empty, and their status is marked as "missing."

### 4.3. Edit String (Update)

**User Story:** As a translator or manager, I want to edit existing translations directly in the table so that I can quickly correct errors or add missing text.

**Trigger:** User clicks on an editable cell (any language cell).

**Action:** The cell becomes an editable text input.

**Outcome:** The change is saved to the database upon confirmation (e.g., clicking outside the cell or pressing Enter). The corresponding status indicator (isFr in DB) is updated.

### 4.4. Filtering & Sorting

**User Story:** As a user, I need to filter and sort the list of strings to find what I'm looking for in a large dataset.

**Filtering:**

- **Trigger:** User clicks the filters button
- **Options:**
  - Filter by Module
  - Filter by translation status (e.g., "Show only strings missing French translation")
  - Text search across Locale Code and translations

**Sorting:**

- **Trigger:** User clicks a column header
- **Action:** The table sorts by the selected column (e.g., alphabetically by Locale Code, by Module)

## 5. Non-Functional Requirements

| Category       | Requirement                                                                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Performance    | The interface must load and render under 2 seconds with up to 5,000 translation strings. Filtering and sorting actions must complete in under 500ms. |
| Security       | Only authenticated and authorized users can access the interface. Permissions for editing vs. viewing may be applied in a future version.            |
| Data Integrity | The system must prevent the creation of duplicate Locale Codes.                                                                                      |
| Accessibility  | The interface must be compliant with WCAG 2.1 AA standards, including keyboard navigation and screen reader support.                                 |
| Usability      | The interface should be intuitive, requiring minimal to no training for new users.                                                                   |

## 6. Out of Scope (for V1)

6. Out of Scope (for V1)
   The initial release will not include:

- Importing or exporting strings (e.g., via CSV, JSON, XLIFF)
- Detailed version history or audit trail for changes
- Pluralization support
- Role-based access controls (all authenticated users will have edit access)

# API Details

1. Login using the following CURL

```bash
curl --location 'https://djibouti.tekdinext.com/user/oauth/token?_=1750136506874' \
--header 'accept: application/json, text/plain, */*' \
--header 'accept-language: en-GB,en-US;q=0.9,en;q=0.8' \
--header 'authorization: Basic ZWdvdi11c2VyLWNsaWVudDo=' \
--header 'cache-control: no-cache' \
--header 'content-type: application/x-www-form-urlencoded' \
--header 'origin: https://djibouti.tekdinext.com' \
--header 'pragma: no-cache' \
--header 'priority: u=1, i' \
--header 'referer: https://djibouti.tekdinext.com/digit-studio/employee/user/login/otp' \
--header 'sec-ch-ua: "Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"' \
--header 'sec-ch-ua-mobile: ?0' \
--header 'sec-ch-ua-platform: "macOS"' \
--header 'sec-fetch-dest: empty' \
--header 'sec-fetch-mode: cors' \
--header 'sec-fetch-site: same-origin' \
--header 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36' \
--header 'Cookie: _ga=GA1.1.1798451893.1749808460; _ga_3LN58ZJ5KN=GS2.1.s1750136457$o3$g1$t1750136487$j30$l0$h0; _ga_4FTREDCS0G=GS2.1.s1750136457$o3$g1$t1750136487$j30$l0$h0; _ga_FS7DJ7SGKL=GS2.1.s1750136457$o3$g1$t1750136487$j30$l0$h0; _ga_EHCDQF6VQ5=GS2.1.s1750136457$o3$g1$t1750136487$j30$l0$h0' \
--data-urlencode 'username=bla' \
--data-urlencode 'password=123456' \
--data-urlencode 'tenantId=dj' \
--data-urlencode 'userType=EMPLOYEE' \
--data-urlencode 'scope=read' \
--data-urlencode 'grant_type=password'
```

You will get the following response:

```json
{
  "access_token": "9c257cb7-ec45-40b3-8448-6bc405e50a2a",
  "token_type": "bearer",
  "refresh_token": "8447a014-4f45-479a-8f81-03bfc4ad8763",
  "expires_in": 110324,
  "scope": "read",
  "ResponseInfo": {
    "api_id": "",
    "ver": "",
    "ts": "",
    "res_msg_id": "",
    "msg_id": "",
    "status": "Access Token generated successfully"
  },
  "UserRequest": {
    "id": 1856,
    "uuid": "15cf935d-2b70-42e5-b23c-e69ff7d5d83f",
    "userName": "akshay.gandhi@tekditechnologies.com",
    "name": "Akshay",
    "mobileNumber": "77545454",
    "emailId": "akshay.gandhi@tekditechnologies.com",
    "locale": null,
    "type": "EMPLOYEE",
    "roles": [
      {
        "name": "Studio Admin",
        "code": "STUDIO_ADMIN",
        "tenantId": "dj"
      }
    ],
    "active": true,
    "tenantId": "dj",
    "permanentCity": null
  }
}
```

2. Use the UserRequest info from the above response and use it like the following as part of the RequestInfo:

```bash
curl --location 'https://djibouti.tekdinext.com/localization/messages/v1/_upsert' \
--header 'Content-Type: application/json' \
--data-raw '{
    "RequestInfo": {
        "apiId": null,
        "ver": null,
        "ts": null,
        "action": "POST",
        "did": null,
        "key": null,
        "msgId": "5bfa85e7-dfa1-47c8-98b2-747bf552be86",
        "authToken": "00000000-0000-0000-0000-000000000000",
        "userInfo": {
            "id": 1856,
            "uuid": "15cf935d-2b70-42e5-b23c-e69ff7d5d83f",
            "userName": "akshay.gandhi@tekditechnologies.com",
            "name": "Akshay",
            "mobileNumber": "77545454",
            "emailId": "akshay.gandhi@tekditechnologies.com",
            "locale": null,
            "type": "EMPLOYEE",
            "roles": [
                {
                    "name": "Studio Admin",
                    "code": "STUDIO_ADMIN",
                    "tenantId": "dj"
                }
            ],
            "active": true,
            "tenantId": "dj",
            "permanentCity": null
        }
    },
    "tenantId": "dj",
    "messages": [
        {
            "code": "TEST_LOCAL",
            "message": "REJETER",
            "module": "rainmaker-common-noc",
            "locale": "fr_FR_IN"
        }
    ]
}''
```

3. Search Localization:

```bash
curl --location 'https://djibouti.tekdinext.com/localization/messages/v1/_search?module=rainmaker-sample%2Crainmaker-workflow%2Crainmaker-studio-bpa%2Crainmaker-studio-newtl-checklist&locale=en_IN&tenantId=dj&_=1750136507561' \
--header 'accept: application/json, text/plain, */*' \
--header 'accept-language: en-GB,en-US;q=0.9,en;q=0.8' \
--header 'cache-control: no-cache' \
--header 'content-type: application/json;charset=UTF-8' \
--header 'origin: https://djibouti.tekdinext.com' \
--header 'pragma: no-cache' \
--header 'priority: u=1, i' \
--header 'referer: https://djibouti.tekdinext.com/digit-studio/employee/publicservices/modules?selectedPath=Apply' \
--header 'sec-ch-ua: "Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"' \
--header 'sec-ch-ua-mobile: ?0' \
--header 'sec-ch-ua-platform: "macOS"' \
--header 'sec-fetch-dest: empty' \
--header 'sec-fetch-mode: cors' \
--header 'sec-fetch-site: same-origin' \
--header 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36' \
--header 'Cookie: _ga=GA1.1.1798451893.1749808460; _ga_3LN58ZJ5KN=GS2.1.s1750136457$o3$g1$t1750136487$j30$l0$h0; _ga_4FTREDCS0G=GS2.1.s1750136457$o3$g1$t1750136487$j30$l0$h0; _ga_FS7DJ7SGKL=GS2.1.s1750136457$o3$g1$t1750136487$j30$l0$h0; _ga_EHCDQF6VQ5=GS2.1.s1750136457$o3$g1$t1750136487$j30$l0$h0' \
--data '{"RequestInfo":{"apiId":"Rainmaker","authToken":"00000000-0000-0000-0000-000000000000","msgId":"1750136507561|en_IN","plainAccessRequest":{}}}'
```

RequestInfo:

```json
{
    "messages": [
        {
            "code": "AGENT_NOT_ASSIGNED",
            "message": "Agent not assigned",
            "module": "rainmaker-studio-bpa",
            "locale": "en_IN"
        },     ...more messages
    ]
}
```

# Development Proxy & API Flow

## Why a Proxy Server?

The eGov backend APIs do not allow cross-origin (CORS) requests from localhost. To enable local development and API access, a Node/Express proxy server is used. This server:

- Serves the frontend static files (HTML, JS, CSS)
- Proxies all `/api/*` requests to the real backend, bypassing CORS
- Forwards all headers and request bodies
- Returns backend responses to the frontend as if they were local

## How the Flow Works

1. **Frontend (Browser)** makes requests to `/api/...` endpoints (e.g., `/api/user/oauth/token`)
2. **Proxy Server (Node/Express)** receives these requests, strips the `/api` prefix, and forwards them to the real backend (`https://djibouti.tekdinext.com/...`)
3. **Backend (eGov API)** processes the request and returns a response
4. **Proxy Server** relays the response back to the frontend

This allows the frontend to interact with the backend as if CORS was not an issue.

## Pseudocode: End-to-End Flow

```pseudo
# 1. User opens http://localhost:8001/localization-visualizer.html
# 2. Frontend JS attempts to login and fetch localization data

function loginAndLoad() {
    if (no valid token in sessionStorage) {
        POST /api/user/oauth/token (with credentials)
        -> Proxy forwards to https://djibouti.tekdinext.com/user/oauth/token
        <- Proxy returns access_token and user info
        Store token and user info in sessionStorage
    }
    fetchLocalizationData()
}

function fetchLocalizationData() {
    for each language in SUPPORTED_LANGUAGES:
        POST /api/localization/messages/v1/_search?module=...&locale=...&tenantId=...
        (with RequestInfo including token and user info)
        -> Proxy forwards to real backend
        <- Proxy returns messages for that language
    Merge all language results by key
    Render table in UI
}

function addNewString(code, module, enText) {
    POST /api/localization/messages/v1/_upsert
    (with RequestInfo, code, module, message, locale='en_IN')
    -> Proxy forwards to backend
    <- Proxy returns success/failure
    If success, update UI
}

function editTranslation(code, lang, value) {
    POST /api/localization/messages/v1/_upsert
    (with RequestInfo, code, module, message, locale=lang)
    -> Proxy forwards to backend
    <- Proxy returns success/failure
    If success, update UI
}

# Proxy server (Node/Express):
app.use('/api', proxyMiddleware({
    target: 'https://djibouti.tekdinext.com',
    pathRewrite: { '^/api': '' },
    ...
}))

# All /api/* requests are transparently forwarded, and responses relayed back to the browser.
```

---

This setup allows seamless local development and testing of the Localization Visualizer with real backend data, without CORS issues.
