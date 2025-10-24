# Class: WebinarDataSpaceConnectorApp

Test App Activity Handler.

## Implements

- `IDataSpaceConnectorApp`

## Constructors

### Constructor

> **new WebinarDataSpaceConnectorApp**(`options`): `WebinarDataSpaceConnectorApp`

Constructor options.

#### Parameters

##### options

[`IWebinarAppConstructorOptions`](../interfaces/IWebinarAppConstructorOptions.md)

The constructor options.

#### Returns

`WebinarDataSpaceConnectorApp`

## Properties

### CLASS\_NAME

> `readonly` **CLASS\_NAME**: `string`

Runtime name for the class.

#### Implementation of

`IDataSpaceConnectorApp.CLASS_NAME`

***

### APP\_ID

> `readonly` `static` **APP\_ID**: `"https://twin.example.org/app1"` = `'https://twin.example.org/app1'`

App Name.

## Methods

### activitiesHandled()

> **activitiesHandled**(): `IActivityQuery`[]

The activities handled

#### Returns

`IActivityQuery`[]

The activity query that describes the handled activities.

#### Implementation of

`IDataSpaceConnectorApp.activitiesHandled`

***

### start()

> **start**(`nodeIdentity`, `nodeLoggingComponentType`): `Promise`\<`void`\>

Start method of the component.

#### Parameters

##### nodeIdentity

`string`

Node identity.

##### nodeLoggingComponentType

Node Logging Type.

`undefined` | `string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

`IDataSpaceConnectorApp.start`

***

### handleActivity()

> **handleActivity**\<`T`\>(`activity`): `Promise`\<`T`\>

Handle Activity.

#### Type Parameters

##### T

`T`

#### Parameters

##### activity

`IActivity`

Activity

#### Returns

`Promise`\<`T`\>

Activity processing result

#### Implementation of

`IDataSpaceConnectorApp.handleActivity`
