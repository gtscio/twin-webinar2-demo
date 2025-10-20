// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import {
  AuditableItemGraphContexts,
  AuditableItemGraphTypes,
  type IAuditableItemGraphComponent,
  type IAuditableItemGraphEdge,
  type IAuditableItemGraphVertex,
} from '@twin.org/auditable-item-graph-models';
import {
  type IAuditableItemStreamComponent,
  type IAuditableItemStreamEntry,
} from '@twin.org/auditable-item-stream-models';
import { ComponentFactory, type IError, Guards, Is } from '@twin.org/core';
import { DataTypeHandlerFactory } from '@twin.org/data-core';
import { type IJsonLdNodeObject } from '@twin.org/data-json-ld';
import type {
  IActivityQuery,
  IDataSpaceConnectorApp,
  IDataSpaceConnector,
} from '@twin.org/data-space-connector-models';
import { ComparisonOperator } from '@twin.org/entity';
import type {
  IDataSpaceConnector as IDataSpaceConnectorEntry,
  IFederatedCatalogueComponent,
} from '@twin.org/federated-catalogue-models';
import type { ILoggingComponent } from '@twin.org/logging-models';
import { nameof } from '@twin.org/nameof';
import type { IActivity } from '@twin.org/standards-w3c-activity-streams';
import type { IEventAppConstructorOptions } from './IEventAppConstructorOptions';

/**
 * Event-focused Data Space Connector App.
 */
export class EventDataSpaceConnectorApp implements IDataSpaceConnectorApp {
  /**
   * Runtime name for the class.
   */
  public readonly CLASS_NAME: string = nameof<EventDataSpaceConnectorApp>();

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
   * The AIS
   * @internal
   */
  private readonly _aisComponent: IAuditableItemStreamComponent;

  /**
   * The Federated Catalogue
   */
  private readonly _fedCatalogue: IFederatedCatalogueComponent;

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
  public static readonly APP_ID = 'https://twin.example.org/app/event-handler';

  /**
   * Constructor options.
   * @param options The constructor options.
   */
  constructor(options: IEventAppConstructorOptions) {
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

    this._aisComponent = ComponentFactory.get<IAuditableItemStreamComponent>(
      options.auditableItemStreamComponentType ??
        'auditable-item-stream-service',
    );

    this._fedCatalogue = ComponentFactory.get<IFederatedCatalogueComponent>(
      options.federatedCatalogueComponentType ?? 'federated-catalogue-client',
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
      EventDataSpaceConnectorApp.APP_ID,
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
      message: `Event App Called: ${EventDataSpaceConnectorApp.APP_ID}. Activity Type: ${activityType}`,
    });

    const userIdentity = (activity.actor as { id: string }).id;

    try {
      await this._loggingService?.log({
        level: 'info',
        source: this.CLASS_NAME,
        message: `Activity's object of type: ${activity.object.type} is valid`,
      });

      // Only handle Add activities for Events targeting Consignments
      if (activityType === 'Add') {
        Guards.object<IJsonLdNodeObject>(
          this.CLASS_NAME,
          nameof(activity.target),
          activity.target,
        );
        await this._loggingService?.log({
          level: 'info',
          source: this.CLASS_NAME,
          message: `Activity's target of type: ${activity.target?.type} is valid`,
        });

        // Extract consignment ID from target
        const consignmentId = activity.target.globalId as string;
        await this._loggingService?.log({
          level: 'info',
          source: this.CLASS_NAME,
          message: `Processing event for consignment: ${consignmentId}`,
        });

        // Find consignment vertex
        const results = await this._aigComponent.query(undefined, [
          {
            property: 'annotationObject.globalId',
            value: consignmentId,
            comparison: ComparisonOperator.Equals,
          },
        ]);

        if (results.itemListElement.length === 0) {
          throw new Error(
            `Consignment with globalId ${consignmentId} not found`,
          );
        }

        const consignmentVertex = results.itemListElement[0];
        await this._loggingService?.log({
          level: 'info',
          source: this.CLASS_NAME,
          message: `Found consignment vertex: ${consignmentVertex.id}`,
        });

        // Query for existing event stream linked to consignment
        const streamQueryResults = await this._aigComponent.query(undefined, [
          {
            property: 'annotationObject.type',
            value: 'AuditableItemStream',
            comparison: ComparisonOperator.Equals,
          },
          {
            property: 'annotationObject.consignmentId',
            value: consignmentId,
            comparison: ComparisonOperator.Equals,
          },
        ]);

        let streamId: string;
        if (streamQueryResults.itemListElement.length > 0) {
          // Use existing stream
          const streamVertex = streamQueryResults.itemListElement[0];
          streamId = streamVertex.annotationObject?.streamId as string;
          await this._loggingService?.log({
            level: 'info',
            source: this.CLASS_NAME,
            message: `Using existing AIS stream for consignment: ${streamId}`,
          });
        } else {
          // Create new AIS stream and AIG resource vertex
          streamId = await this._aisComponent.create(
            {
              annotationObject: {
                '@context': [
                  'https://www.w3.org/ns/activitystreams',
                  'https://schema.org/',
                ],
                type: 'AuditableItemStream',
                name: `Event Stream for Consignment ${consignmentId}`,
              },
            },
            undefined,
            userIdentity,
            this._nodeIdentity,
          );
          await this._loggingService?.log({
            level: 'info',
            source: this.CLASS_NAME,
            message: `Created new AIS stream for consignment: ${streamId}`,
          });

          // Create AIG resource vertex for the stream
          const streamResourceVertex: Omit<IAuditableItemGraphVertex, 'id'> = {
            '@context': [
              AuditableItemGraphContexts.ContextRoot,
              AuditableItemGraphContexts.ContextRootCommon,
            ],
            type: AuditableItemGraphTypes.Vertex,
            annotationObject: {
              type: 'AuditableItemStream',
              streamId,
              consignmentId,
            },
          };
          const streamResourceVertexId = await this._aigComponent.create(
            streamResourceVertex,
            userIdentity,
            this._nodeIdentity,
          );
          await this._loggingService?.log({
            level: 'info',
            source: this.CLASS_NAME,
            message: `Created AIG resource vertex for stream: ${streamResourceVertexId}`,
          });

          // Link the stream resource to consignment via AIG edge
          const edge: IAuditableItemGraphEdge = {
            '@context': [
              AuditableItemGraphContexts.ContextRoot,
              AuditableItemGraphContexts.ContextRootCommon,
            ],
            targetId: streamResourceVertexId,
            type: AuditableItemGraphTypes.Edge,
            edgeRelationships: ['https://vocabulary.uncefact.org/eventStream'],
          };
          const updateObject = {
            id: consignmentVertex.id,
            annotationObject: consignmentVertex.annotationObject,
            edges: [edge],
          };
          await this._aigComponent.update(
            updateObject,
            userIdentity,
            this._nodeIdentity,
          );
          await this._loggingService?.log({
            level: 'info',
            source: this.CLASS_NAME,
            message: `Linked stream resource to consignment via AIG edge`,
          });
        }

        // Store event in the appropriate stream
        const entryId = await this._aisComponent.createEntry(
          streamId,
          activity.object,
          userIdentity,
          this._nodeIdentity,
        );

        await this._loggingService?.log({
          level: 'info',
          source: this.CLASS_NAME,
          message: `Stored event in AIS stream. Entry ID: ${entryId}`,
        });
      }
    } catch (error) {
      const theErr = error as IError;
      await this._loggingService?.log({
        level: 'error',
        source: this.CLASS_NAME,
        message: 'Error in Event DS Connector App',
        error: theErr,
      });
      throw error;
    }
    return 0 as T;
  }
}
