# Function: webinarAppInitialiser()

> **webinarAppInitialiser**(`engineCore`, `context`, `instanceConfig`): `Promise`\<\{ `instanceType?`: `string`; `factory?`: `Factory`\<`IDataSpaceConnectorApp`\>; `component?`: `IComponent`; \}\>

Test Data Space Connector App initializer.

## Parameters

### engineCore

`IEngineCore`

The engine core.

### context

`IEngineCoreContext`

The context for the engine.

### instanceConfig

The instance config.

#### type

`"service"`

The instance type.

#### options

[`IWebinarAppConstructorOptions`](../interfaces/IWebinarAppConstructorOptions.md)

The instance config options.

## Returns

`Promise`\<\{ `instanceType?`: `string`; `factory?`: `Factory`\<`IDataSpaceConnectorApp`\>; `component?`: `IComponent`; \}\>

The instance created and the factory for it.
