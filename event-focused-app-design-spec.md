# Event-Focused Data Space Connector App Design Specification

## Overview

This document outlines the design for a separate Event-focused Data Space Connector App that handles only Event activities targeting Consignments. The app will be independent from the existing Document/Consignment app while following the same architectural blueprint.

## App Structure and Naming

### Package Name
`@twindev.org/data-space-connector-event-app`

### Directory Structure
```
data-space-connector/
├── data-space-connector-event-app/
│   ├── package.json
│   ├── tsconfig.json
│   ├── rollup.config.mjs
│   ├── vitest.config.ts
│   ├── src/
│   │   ├── index.ts
│   │   ├── eventDataSpaceConnectorApp.ts
│   │   ├── IEventAppConstructorOptions.ts
│   │   └── extension.ts
│   ├── tests/
│   │   ├── index.spec.ts
│   │   └── tsconfig.json
│   ├── docs/
│   │   ├── changelog.md
│   │   └── reference/
│   └── locales/ (if needed)
```

### App ID
`https://twin.example.org/app/event-handler`

## Dependencies

The app will use the same core dependencies as the blueprint:

### Core Dependencies
- `@twin.org/api-models`: next
- `@twin.org/auditable-item-graph-models`: next
- `@twin.org/core`: next
- `@twin.org/data-core`: next
- `@twin.org/data-json-ld`: next
- `@twin.org/data-space-connector-models`: next
- `@twin.org/data-space-connector-rest-client`: next
- `@twin.org/engine-models`: next
- `@twin.org/entity`: next
- `@twin.org/federated-catalogue-models`: next
- `@twin.org/logging-models`: next
- `@twin.org/nameof`: next
- `@twin.org/standards-w3c-activity-streams`: next
- `@twin.org/auditable-item-stream-models`: next
- `@twin.org/auditable-item-stream-service`: next

### Dev Dependencies
Same as blueprint: TypeScript, Vitest, Rollup, Typedoc, etc.

## Activity Handling Scope

### Supported Activities
The app will handle **only** the following activity type:
- **Add** activities where:
  - `object.type` = `"https://vocabulary.uncefact.org/Event"`
  - `target.type` = `"https://vocabulary.uncefact.org/Consignment"`
  - `activityType` = `"https://www.w3.org/ns/activitystreams#Add"`

### Excluded Activities
The app will **NOT** handle:
- Create activities for Consignments
- Add activities for Documents
- Any other activity types or object/target combinations

## Data Type Registration

### Event Data Type
```typescript
DataTypeHandlerFactory.register(
  'https://vocabulary.uncefact.org/Event',
  () => ({
    context: 'https://vocabulary.uncefact.org/',
    type: 'Event',
    defaultValue: {},
    jsonSchema: async () => ({
      type: 'object',
      properties: {
        type: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        location: { type: 'string' },
        status: { type: 'string' },
      },
      required: ['type', 'timestamp', 'location', 'status'],
    }),
  }),
);
```

## Component Dependencies

The app will require the same components as the blueprint:

### Required Components
- `IAuditableItemGraphComponent` - For querying consignment vertices
- `IAuditableItemStreamComponent` - For storing events in streams
- `IFederatedCatalogueComponent` - For potential future extensions
- `IDataSpaceConnector` - For app registration
- `ILoggingComponent` (optional) - For logging

## Event Processing Logic

### Activity Handling Flow

1. **Validate Activity Structure**
   - Ensure activity has valid target (Consignment)
   - Verify object type is Event

2. **Extract Consignment ID**
   - Get `consignmentId` from `activity.target.globalId`

3. **Find Consignment Vertex**
   - Query AIG for vertex with matching `globalId`
   - Throw error if consignment not found

4. **Manage Auditable Item Stream**
   - Check if consignment vertex has existing AIS resource
   - Create new AIS if none exists
   - Link AIS to consignment vertex as resource

5. **Store Event in Stream**
   - Create AIS entry with the Event object
   - Log successful storage

### Error Handling
- Consignment not found: Throw descriptive error
- AIS creation failure: Log and throw error
- Entry creation failure: Log and throw error

## Integration with Existing Test Server

### Server Configuration
The test server (`data-space-connector-test-server`) will be extended to support both apps:

#### Updated `extendConfig` function:
```typescript
export async function extendConfig(
  envVars: INodeEnvironmentVariables,
  engineConfig: IEngineConfig,
): Promise<void> {
  initSchema();

  // Existing components...
  engineConfig.types.auditableItemGraphComponent = [
    {
      type: AuditableItemGraphComponentType.Service,
      options: {},
      restPath: 'auditable-item-graph',
    },
  ];
  engineConfig.types.auditableItemStreamComponent = [
    {
      type: AuditableItemStreamComponentType.Service,
      options: {},
      restPath: 'auditable-item-stream',
    },
  ];
  engineConfig.types.federatedCatalogueComponent = [
    {
      type: FederatedCatalogueComponentType.RestClient,
      options: {
        endpoint: 'http://localhost:3020',
      },
    },
  ];

  // Add data space connector components for both apps
  engineConfig.types.dataSpaceConnectorComponent = [
    {
      type: 'data-space-connector',
      options: {
        apps: [
          {
            appId: 'https://twin.example.org/app1', // Original app
            appType: '@twindev.org/data-space-connector-webinar-app',
          },
          {
            appId: 'https://twin.example.org/app/event-handler', // New event app
            appType: '@twindev.org/data-space-connector-event-app',
          },
        ],
      },
      restPath: 'data-space-connector',
    },
  ];
}
```

### Environment Variables
- `DATA_SPACE_CONNECTOR_NODE_IDENTITY`: Same as existing setup
- No additional environment variables required

## Coexistence Strategy

### Independent Operation
- Both apps register separately with the data space connector
- Each app handles different activity types
- No shared state or interference between apps

### Activity Routing
The data space connector will route activities based on `activitiesHandled()`:
- Original app: Create (Consignment), Add (Document → Consignment), Add (Event → Consignment)
- Event app: Add (Event → Consignment) only

### Data Separation
- Events stored in AIS linked to consignments
- Documents stored as AIG vertices with edges to consignments
- Consignments remain the central linking entity

## Testing Strategy

### Unit Tests
- Test Event activity handling logic
- Test AIS creation and linking
- Test error scenarios (missing consignment, etc.)

### Integration Tests
- Test script similar to `test-event-activities.js`
- Verify events are stored in correct streams
- Verify stream linkage to consignments

### Test Server Usage
- Run test server with both apps registered
- Send mixed activities (documents + events)
- Verify correct routing and processing

## Deployment Considerations

### Build Process
- Same build pipeline as blueprint
- Generate ESM and CJS bundles
- Include TypeScript declarations

### Package Publishing
- Publish to npm registry
- Follow same versioning scheme

### Documentation
- Generate API docs with Typedoc
- Include usage examples
- Document activity structures

## Migration Path

### From Current Blueprint
- Extract Event handling logic from existing app
- Create new focused app class
- Update test server configuration
- Maintain backward compatibility

### Future Extensions
- App could be extended to handle other event types
- Could support querying events from streams
- Could integrate with notification systems

## Security Considerations

### Access Control
- Same user identity validation as existing app
- Node identity for internal operations

### Data Validation
- JSON Schema validation for Event objects
- Required fields enforcement

### Logging
- Comprehensive logging of operations
- Error logging with context

## Performance Considerations

### Stream Management
- AIS creation only when needed
- Efficient querying of consignment vertices
- Minimal overhead for event storage

### Scalability
- AIS supports high-volume event storage
- AIG queries optimized for globalId lookups
- Independent of document processing load