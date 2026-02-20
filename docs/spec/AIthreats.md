You are modifying the loaded Threat Dragon project.
Implement a new feature called “AI Threat Importer” with the following specifications.

⭐ 1. Feature Summary
Add a new UI and backend capability inside Threat Dragon to allow users to paste structured JSON threats, and the system will automatically attach the threats to the correct nodes/flows in the diagram, using deterministic matching logic.
This feature DOES NOT generate threats.
It ONLY parses user-supplied structured JSON and merges threats into the model.

⭐ 2. UI Requirements
2.1 Add a new menu item
Add to the Diagram menu:
Menu → Tools → Import Threats (JSON)

2.2 Modal Dialog
When clicked, open a modal with:

Title: “Import AI Threats”
A large textbox to paste JSON
“Validate”
“Import”
“Cancel”

Validation must:

Check JSON syntax
Check schema compliance
Show errors inline

If validation passes, enable the “Import” button.

⭐ 3. Threat Import JSON Schema
Antigravity must create this JSON schema inside the project:
/schemas/threat-import.schema.json
Content:
JSON{  "type": "object",  "required": ["version", "threats"],  "properties": {    "version": { "type": "string" },    "threats": {      "type": "array",      "items": {        "type": "object",        "required": ["target", "data"],        "properties": {          "target": {            "type": "object",            "required": ["by"],            "properties": {              "by": { "type": "string", "enum": ["flow", "node"] },              "method": { "type": "string" },              "path": { "type": "string" },              "nodeName": { "type": "string" }            }          },          "data": {            "type": "object",            "required": ["title", "severity", "category", "description"],            "properties": {              "title": { "type": "string" },              "severity": { "type": "string" },              "category": { "type": "string" },              "description": { "type": "string" }            }          }        }      }    }  }}Show more lines

⭐ 4. Mapping Logic (Critical)
4.1 For threats targeting flows
Match each threat to the correct flow using:
flow.method      == target.method
flow.attributes.url == normalize(target.path)

Normalization must follow the same logic as the DFD engine:

Replace numeric segments with {id}
Collapse duplicate slashes
Strip trailing slash except root

4.2 For threats targeting nodes
Match using:
canonicalize(node.labels[0].text) == canonicalize(target.nodeName)

The canonicalization function:

lowercase
replace spaces with hyphens
remove punctuation

4.3 Deterministic Threat ID
Every imported threat must generate an ID:
"threat|" + method + "|" + path + "|" + title
sha256(seed).substring(0, 8)

4.4 Attach threats
Depending on target type:
flow.threats.push(threatObject)
node.threats.push(threatObject)

Threat objects must respect the current Threat Dragon schema:

If a field does not exist in schema, DO NOT add it.
Severity/categories must map to accepted enum values.


⭐ 5. File Modifications Required
Antigravity must edit/add code in these modules:
5.1 UI Layer
Modify the existing menu and add:

/src/components/ThreatImportModal.vue (new component)

5.2 Controller
Modify diagram/action controller to handle:

validateThreatJson()
importThreatJson()

File:
/src/store/actions/threatActions.js

5.3 Schema Validator
Add JSON schema validator integration:
Use existing AJV setup:
/src/services/validationService.js

Register:
schemas/threat-import.schema.json

5.4 Model Merger
Create a new file:
/src/services/threatImportService.js

Implement mapping logic + merging.

⭐ 6. Acceptance Criteria (Antigravity must satisfy)
AC1 — UI

A new menu: Tools → Import Threats (JSON)
Modal appears with JSON textarea and validation button

AC2 — JSON validation

Invalid JSON → error message
Unknown fields → error
Missing required fields → error

AC3 — Flow matching
When user inputs:
JSON{  "version": "1.0",  "threats": [    {      "target": {"by": "flow", "method": "GET", "path": "/api/projects/123"},      "data": {        "title": "Unauthorized access",        "severity": "high",        "category": "Elevation of Privilege",        "description": "Potential bypass of auth."      }    }  ]}Show more lines
Threat must attach to the flow representing:
GET /api/projects/{id}
AC4 — Node matching
When user inputs:
JSON{  "target": {"by": "node", "nodeName": "api-service"},  ...}Show more lines
It must attach to that node.
AC5 — Deterministic threat IDs
Two imports with identical threat content must produce the same ID.
AC6 — Model must remain valid TD JSON
No extra fields, no schema breaking.
AC7 — Undo/Redo integration works

⭐ 7. Do NOT Modify

DFD layout
Node/flow IDs
Port structures
Threat Dragon’s core schema
Threat generation (this feature only imports, not creates)


⭐ 8. After Completion
you should:

Generate the UI component
Update controllers
Create threat-import schema
Implement mapping logic
Pass acceptance tests