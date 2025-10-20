// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import {
  AuditableItemGraphContexts,
  AuditableItemGraphTypes,
  type IAuditableItemGraphComponent,
  type IAuditableItemGraphVertex,
} from '@twin.org/auditable-item-graph-models';
import type { IAuditableItemStreamComponent } from '@twin.org/auditable-item-stream-models';
import { ComponentFactory, type IError, Guards } from '@twin.org/core';
import { DataTypeHandlerFactory } from '@twin.org/data-core';
import type { IJsonLdNodeObject } from '@twin.org/data-json-ld';
import type {
  IActivityQuery,
  IDataSpaceConnectorApp,
  IDataSpaceConnector,
} from '@twin.org/data-space-connector-models';
import type { IFederatedCatalogueComponent } from '@twin.org/federated-catalogue-models';
import type { ILoggingComponent } from '@twin.org/logging-models';
import type { IActivity } from '@twin.org/standards-w3c-activity-streams';
import type { IWebinarAppConstructorOptions } from './IWebinarAppConstructorOptions';
import { handleConsignmentCreate } from './handlers/consignmentHandler';
import { handleDocumentAddActivity } from './handlers/documentHandler';
import { handleEventAddActivity } from './handlers/eventHandler';

/**
 * Test App Activity Handler.
 */
export class WebinarDataSpaceConnectorApp implements IDataSpaceConnectorApp {
  /**
   * Runtime name for the class.
   */
  public readonly CLASS_NAME = 'WebinarDataSpaceConnectorApp';

  /**
   * Logging service.
   * @internal
   */
  private readonly _loggingService?: ILoggingComponent;

  /**
   * The AIG
   * @internal
   */
  private readonly _aigComponent: IAuditableItemGraphComponent;

  /**
   * The Federated Catalogue
   */
  private readonly _fedCatalogue: IFederatedCatalogueComponent;

  /**
   * The AIS (Auditable Item Stream) component for storing time-series event data
   * @internal
   */
  private readonly _aisComponent: IAuditableItemStreamComponent;

  /**
   * The DS Connector Component
   * @internal
   */
  private readonly _dataSpaceConnectorComponent: IDataSpaceConnector;

  /**
   * The identity of the Node.
   * @internal
   */
  private _nodeIdentity: string;

  /**
   * App Name.
   */
  public static readonly APP_ID = 'https://twin.example.org/app1';

  private static readonly CONSIGNMENT_TYPE =
    'https://vocabulary.uncefact.org/Consignment';

  private static readonly DOCUMENT_TYPE =
    'https://vocabulary.uncefact.org/Document';

  private static readonly EVENT_TYPE = 'https://vocabulary.uncefact.org/Event';

  private static readonly ACTIVITY_TYPE_CREATE = 'Create';

  private static readonly ACTIVITY_TYPE_ADD = 'Add';

  private static readonly ACTIVITY_IRI_CREATE =
    'https://www.w3.org/ns/activitystreams#Create';

  private static readonly ACTIVITY_IRI_ADD =
    'https://www.w3.org/ns/activitystreams#Add';

  private static readonly AUDITABLE_ITEM_STREAM_TYPE = 'AuditableItemStream';

  private static readonly DOCUMENT_EDGE_RELATIONSHIP =
    'https://vocabulary.uncefact.org/associatedDocument';

  private static readonly UK_FSA_DID =
    'did:iota:testnet:0x83e99fd9b8804966fd474da212aa93a5769f39f2150714a3c6701d20b5353975';

  /**
   * Constructor options.
   * @param options The constructor options.
   */
  constructor(options: IWebinarAppConstructorOptions) {
    this.registerDataTypes();

    this._dataSpaceConnectorComponent =
      ComponentFactory.get<IDataSpaceConnector>(
        options?.dataSpaceConnectorComponentType ?? 'data-space-connector',
      );
    this._loggingService = ComponentFactory.getIfExists<ILoggingComponent>(
      options?.loggingComponentType ?? 'logging',
    );

    this._aigComponent = ComponentFactory.get<IAuditableItemGraphComponent>(
      options.auditableItemGraphComponentType ?? 'auditable-item-graph-service',
    );

    this._fedCatalogue = ComponentFactory.get<IFederatedCatalogueComponent>(
      options.federatedCatalogueComponentType ?? 'federated-catalogue-client',
    );

    // Initialize AIS component for event stream management
    this._aisComponent = ComponentFactory.get<IAuditableItemStreamComponent>(
      options.auditableItemStreamComponentType ??
        'auditable-item-stream-service',
    );

    this._nodeIdentity = process.env
      .DATA_SPACE_CONNECTOR_NODE_IDENTITY as string;
  }

  /**
   * The activities handled
   * @returns The activity query that describes the handled activities.
   */
  public activitiesHandled(): IActivityQuery[] {
    return [
      {
        objectType: 'https://vocabulary.uncefact.org/Consignment',
        activityType: 'https://www.w3.org/ns/activitystreams#Create',
      },
      {
        objectType: 'https://vocabulary.uncefact.org/Document',
        targetType: 'https://vocabulary.uncefact.org/Consignment',
        activityType: 'https://www.w3.org/ns/activitystreams#Add',
      },
      // NEW: Support for Event activities targeting Consignments
      // Events are stored in Auditable Item Streams associated with consignments
      {
        objectType: 'https://vocabulary.uncefact.org/Event',
        targetType: 'https://vocabulary.uncefact.org/Consignment',
        activityType: 'https://www.w3.org/ns/activitystreams#Add',
      },
    ];
  }

  /**
   * Start method of the component.
   * @param nodeIdentity Node identity.
   * @param nodeLoggingComponentType Node Logging Type.
   */
  public async start(
    nodeIdentity: string,
    nodeLoggingComponentType: string | undefined,
  ): Promise<void> {
    this._nodeIdentity = nodeIdentity;
    await this._dataSpaceConnectorComponent.registerApp(
      WebinarDataSpaceConnectorApp.APP_ID,
      this,
    );
  }

  /**
   * Handle Activity.
   * @param activity Activity
   * @returns Activity processing result
   */
  public async handleActivity<T>(activity: IActivity): Promise<T> {
    const activityType = activity.type;
    await this._loggingService?.log({
      level: 'info',
      source: this.CLASS_NAME,
      message: `Webinar App Called: ${WebinarDataSpaceConnectorApp.APP_ID}. Activity Type: ${activityType}`,
    });

    const userIdentity = (activity.actor as { id: string }).id;

    try {
      await this._loggingService?.log({
        level: 'info',
        source: this.CLASS_NAME,
        message: `Activity's object of type: ${activity.object.type} is valid`,
      });

      switch (activityType) {
        case WebinarDataSpaceConnectorApp.ACTIVITY_TYPE_CREATE:
        case WebinarDataSpaceConnectorApp.ACTIVITY_IRI_CREATE:
          await handleConsignmentCreate(activity, userIdentity, {
            loggingService: this._loggingService,
            createItem: this.createItem.bind(this),
            nodeIdentity: this._nodeIdentity,
            className: this.CLASS_NAME,
            consignmentType: WebinarDataSpaceConnectorApp.CONSIGNMENT_TYPE,
            isTypeMatch: this.isTypeMatch.bind(this),
          });
          break;
        case WebinarDataSpaceConnectorApp.ACTIVITY_TYPE_ADD:
        case WebinarDataSpaceConnectorApp.ACTIVITY_IRI_ADD:
          await this.routeAddActivity(activity, userIdentity);
          break;
      }
    } catch (error) {
      const theErr = error as IError;
      await this._loggingService?.log({
        level: 'error',
        source: this.CLASS_NAME,
        message: 'Error DS Connector App',
        error: theErr,
      });
      throw error;
    }
    return 0 as T;
  }

  /**
   * Creates an item using the object passed as parameter.
   * @param object The object as JSON-LD
   * @param userIdentity the user identity.
   * @param nodeIdentity the node Identity.
   * @returns the VertexId
   */
  private async createItem(
    object: IJsonLdNodeObject,
    userIdentity: string,
    nodeIdentity: string,
  ): Promise<string> {
    const aig: Omit<IAuditableItemGraphVertex, 'id'> = {
      '@context': [
        AuditableItemGraphContexts.ContextRoot,
        AuditableItemGraphContexts.ContextRootCommon,
      ],
      type: AuditableItemGraphTypes.Vertex,
      annotationObject: object,
    };

    const vertexIdObject = await this._aigComponent.create(
      aig,
      userIdentity,
      nodeIdentity,
    );

    return vertexIdObject;
  }

  private registerDataTypes(): void {
    DataTypeHandlerFactory.register(
      WebinarDataSpaceConnectorApp.CONSIGNMENT_TYPE,
      () => ({
        context: 'https://vocabulary.uncefact.org/',
        type: 'Consignment',
        defaultValue: {},
        jsonSchema: async () => ({
          type: 'object',
        }),
      }),
    );

    DataTypeHandlerFactory.register(
      WebinarDataSpaceConnectorApp.DOCUMENT_TYPE,
      () => ({
        context: 'https://vocabulary.uncefact.org/',
        type: 'Document',
        defaultValue: {},
        jsonSchema: async () => ({
          type: 'object',
        }),
      }),
    );

    DataTypeHandlerFactory.register(
      WebinarDataSpaceConnectorApp.EVENT_TYPE,
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
  }

  private async routeAddActivity(
    activity: IActivity,
    userIdentity: string,
  ): Promise<void> {
    Guards.object<IJsonLdNodeObject>(
      this.CLASS_NAME,
      'activity.object',
      activity.object,
    );
    Guards.object<IJsonLdNodeObject>(
      this.CLASS_NAME,
      'activity.target',
      activity.target,
    );

    await this._loggingService?.log({
      level: 'info',
      source: this.CLASS_NAME,
      message: `Activity's target of type: ${activity.target?.type} is valid`,
    });

    if (
      this.isTypeMatch(
        activity.object.type as string | string[] | undefined,
        WebinarDataSpaceConnectorApp.EVENT_TYPE,
      )
    ) {
      await handleEventAddActivity(activity, userIdentity, {
        loggingService: this._loggingService,
        nodeIdentity: this._nodeIdentity,
        className: this.CLASS_NAME,
        aigComponent: this._aigComponent,
        aisComponent: this._aisComponent,
        auditableItemStreamType:
          WebinarDataSpaceConnectorApp.AUDITABLE_ITEM_STREAM_TYPE,
      });
      return;
    }

    if (
      this.isTypeMatch(
        activity.object.type as string | string[] | undefined,
        WebinarDataSpaceConnectorApp.DOCUMENT_TYPE,
      )
    ) {
      await handleDocumentAddActivity(activity, userIdentity, {
        loggingService: this._loggingService,
        nodeIdentity: this._nodeIdentity,
        className: this.CLASS_NAME,
        aigComponent: this._aigComponent,
        fedCatalogue: this._fedCatalogue,
        createItem: this.createItem.bind(this),
        documentEdgeRelationship:
          WebinarDataSpaceConnectorApp.DOCUMENT_EDGE_RELATIONSHIP,
        targetParticipantDid: WebinarDataSpaceConnectorApp.UK_FSA_DID,
      });
      return;
    }

    throw new Error(
      `Unsupported Add activity for type ${activity.object.type}`,
    );
  }

  private isTypeMatch(
    actualType: string | string[] | undefined,
    expectedType: string,
  ): boolean {
    if (Array.isArray(actualType)) {
      return actualType.includes(expectedType);
    }
    return actualType === expectedType;
  }
}
