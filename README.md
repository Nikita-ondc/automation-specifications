# ONDC:RET16 — version 1.2.5

**Branch:** `draft-RET16-1.2.5`  
**Use Cases:** HOME&KITCHEN

---

## Directory Structure 

```
1.2.5/
├── README.md                   ← This file
└── config/
    ├── index.yaml              ← Top-level manifest; mirrors build.yaml structure with $ref links
    ├── specs/
    │   └── openapi.yaml        ← Full OpenAPI spec: openapi, info, security, paths, components
    ├── flows/
    │   ├── index.yaml              ← Flat playground manifest: all flows across all use cases
    │   └── <UseCase>/
    │       └── <FlowId>.yaml       ← Individual transaction flow definition
    ├── attributes/
    │   ├── index.yaml          ← List of $ref entries pointing to each attribute file
    │   └── <UseCaseId>.yaml    ← Attribute set for a specific use case
    ├── validations/
    │   └── index.yaml          ← All validation rules (x-validations from build.yaml)
    ├── errors/
    │   └── index.yaml          ← Error codes (x-errorcodes from build.yaml)
    └── actions/
        └── index.yaml          ← Supported actions & API properties (x-supported-actions)
```

---

## File Schemas

### `config/index.yaml`
Top-level manifest that mimics the build.yaml structure but replaces inline content with `$ref` links.

| Field | Type | Description |
|-------|------|-------------|
| `openapi` | string | OpenAPI version — matches `/^3\.\d+\.\d+$/` |
| `info.title` | string? | Human-readable title |
| `info.domain` | string | ONDC domain identifier (e.g. `ONDC:RET16`) |
| `info.description` | string? | Domain description |
| `info.version` | string | Spec version (e.g. `1.2.5`) |
| `info.x-usecases` | string[] | List of supported use case IDs |
| `info.x-branch-name` | string? | Source git branch name |
| `info.x-reporting` | boolean | Whether this domain/version is enabled for reporting |
| `security` | Record<string, string[]>[]? | Security scheme references |
| `paths` | `{$ref: ./specs/openapi.yaml#/paths}` | Reference to paths section in OpenAPI spec |
| `components` | `{$ref: ./specs/openapi.yaml#/components}` | Reference to components in OpenAPI spec |
| `x-attributes` | `{$ref: ./attributes/index.yaml}` | Reference to attribute definitions |
| `x-validations` | `{$ref: ./validations/index.yaml}` | Reference to validation rules |
| `x-errors-codes` | `{$ref: ./errors/index.yaml}` | Reference to error codes |
| `x-supported-actions` | `{$ref: ./actions/index.yaml}` | Reference to supported actions |
| `x-flows` | `{$ref: ./flows/index.yaml#/flows}` | Reference to flat flow list |
| `x-docs` | `{$ref: ./docs}` | Reference to extra documentation |

---

### `config/specs/openapi.yaml`
Complete OpenAPI 3.0 specification containing all API paths and component schemas. Referenced by `index.yaml` via JSON Pointer syntax: `$ref: ./specs/openapi.yaml#/paths` and `$ref: ./specs/openapi.yaml#/components`.

---

### `config/flows/index.yaml`
Flat playground manifest listing **all flows across all use cases**:
```yaml
flows:
  - type: playground
    id: <FlowId>
    usecase: <UseCaseId>
    tags: ["WORKBENCH", "PRAMAAN", "MANDATORY", "REPORTABLE"]
    description: <description from outputs flow.json>
    config:
      $ref: ./<UseCase>/<FlowId>.yaml
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"playground"` | Literal — always `playground` |
| `id` | string | Flow identifier |
| `usecase` | string | Use case this flow belongs to (matches subfolder name) |
| `tags` | string[] | Labels sourced from `outputs/<domain>/<version>/<usecase>/<flowId>/flow.json` |
| `description` | string | Description sourced from `flow.json` |
| `config` | object | Flow config — see [automation-mock-runner](https://github.com/ONDC-Official/automation-mock-runner-lib) for schema |

### `config/flows/<UseCase>/<FlowId>.yaml`
Individual flow config file. Schema defined by `MockPlaygroundConfigSchema` from [@ondc/automation-mock-runner](https://github.com/ONDC-Official/automation-mock-runner-lib).

---

### `config/attributes/index.yaml`
An ordered list of `$ref` entries pointing to per-use-case attribute files:
```yaml
- $ref: ./UseCaseId1.yaml
- $ref: ./UseCaseId2.yaml
```

### `config/attributes/<UseCaseId>.yaml`
Attribute definitions for a specific use case:

| Field | Type | Description |
|-------|------|-------------|
| `meta.use_case_id` | string? | Use case identifier |
| `attribute_set` | object? | Keyed by action name (e.g. `search`, `on_search`) |
| `attribute_set.<action>.<path>._description` | object | Leaf attribute descriptor |
| `._description.required` | boolean | Whether the attribute is required |
| `._description.usage` | string | Example value |
| `._description.info` | string | Description of the attribute |
| `._description.owner` | string | Who sets this field (`BAP`/`BPP`) |
| `._description.type` | string | Data type |
| `._description.enums` | `{code, description, reference}[]`? | Allowed enum values |
| `._description.enumrefs` | `{label, href}[]`? | External references for enum values |
| `._description.tags` | `AttributeTagEntry[]`? | Nested tag group descriptors |

**`AttributeTagEntry`**

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Tag group code (e.g. `BAP_TERMS`) |
| `_description` | AttributeLeaf | Descriptor for the tag group itself |
| `list` | `{code: string, _description: AttributeLeaf}[]`? | Individual tag items within the group |

---

### `config/validations/index.yaml`
See schema documentation: [automation-validation-compiler README](https://github.com/ONDC-Official/automation-validation-compiler/blob/package/README.md)

---

### `config/errors/index.yaml`
Error codes for this domain:

| Field | Type | Description |
|-------|------|-------------|
| `code` | array | List of error code objects |
| `code[].code` | string \| number | Numeric error code |
| `code[].Event` | string | Human-readable event description |
| `code[].From` | string | Who raises this error (`BAP`/`BPP`) |
| `code[].Description` | string | Where/how the error is used |

---

### `config/actions/index.yaml`
Supported actions and API orchestration properties:

| Field | Type | Description |
|-------|------|-------------|
| `supportedActions` | object | Maps each action to allowed next actions |
| `apiProperties` | object | Per-action async and transaction-partner metadata |
| `apiProperties.<action>.async_predecessor` | string\|null | The action this is a response to |
| `apiProperties.<action>.transaction_partner` | string[] | Actions sharing the same transaction |

---

## Use Cases in this version

  - HOME&KITCHEN
