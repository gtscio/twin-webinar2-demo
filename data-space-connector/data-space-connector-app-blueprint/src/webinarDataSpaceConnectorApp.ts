// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import {
  AuditableItemGraphContexts,
  AuditableItemGraphTypes,
  type IAuditableItemGraphEdge,
  type IAuditableItemGraphComponent,
  type IAuditableItemGraphVertex,
} from '@twin.org/auditable-item-graph-models';
import type { IAuditableItemStreamComponent } from '@twin.org/auditable-item-stream-models';
import {
  ComponentFactory,
  type IError,
  Guards,
  Is,
  ObjectHelper,
} from '@twin.org/core';
import { DataTypeHandlerFactory } from '@twin.org/data-core';
import { type IJsonLdNodeObject } from '@twin.org/data-json-ld';
import type {
  IActivityQuery,
  IDataSpaceConnectorApp,
  IDataSpaceConnector,
} from '@twin.org/data-space-connector-models';
import { DataSpaceConnectorClient } from '@twin.org/data-space-connector-rest-client';
import { ComparisonOperator } from '@twin.org/entity';
import type {
  IDataSpaceConnector as IDataSpaceConnectorEntry,
  IFederatedCatalogueComponent,
} from '@twin.org/federated-catalogue-models';
import type { ILoggingComponent } from '@twin.org/logging-models';
import { nameof } from '@twin.org/nameof';
import type { IActivity } from '@twin.org/standards-w3c-activity-streams';
import type { IWebinarAppConstructorOptions } from './IWebinarAppConstructorOptions';

/**
 * Test App Activity Handler.
 */
export class WebinarDataSpaceConnectorApp implements IDataSpaceConnectorApp {
  /**
   * Runtime name for the class.
   */
  public readonly CLASS_NAME: string = nameof<WebinarDataSpaceConnectorApp>();

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

  /**
   * Constructor options.
   * @param options The constructor options.
   */
  constructor(options: IWebinarAppConstructorOptions) {
    DataTypeHandlerFactory.register(
      'https://vocabulary.uncefact.org/Consignment',
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
      'https://vocabulary.uncefact.org/Document',
      () => ({
        context: 'https://vocabulary.uncefact.org/',
        type: 'Document',
        defaultValue: {},
        jsonSchema: async () => ({
          type: 'object',
        }),
      }),
    );

    // Register Event data type for AIS storage
    // Events have: type, timestamp, location, status fields
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
        // An Activity Create causes a Vertex to be created
        case 'Create': {
          const vertexIdObject = await this.createItem(
            activity.object,
            userIdentity,
            this._nodeIdentity,
          );
          await this._loggingService?.log({
            level: 'info',
            source: this.CLASS_NAME,
            message: `Item created: ${vertexIdObject}`,
          });
          break;
        }

        // An Activity Add causes a Vertex to be created and an edge between two Vertices
        case 'Add': {
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

          // Check if this is an Event activity
          if (
            activity.object.type === 'https://vocabulary.uncefact.org/Event'
          ) {
            // Get the Target: Extract the target ID from the activity (this is the Consignment ID the event belongs to)
            const consignmentId = activity.target.globalId;

            // Find the Consignment: Use this._aigComponent to find the vertex for that Consignment
            const consignmentResults = await this._aigComponent.query(
              undefined,
              [
                {
                  property: 'annotationObject.globalId',
                  value: consignmentId,
                  comparison: ComparisonOperator.Equals,
                },
              ],
            );

            if (consignmentResults.itemListElement.length === 0) {
              throw new Error(`Consignment with ID ${consignmentId} not found`);
            }

            const consignmentVertex = consignmentResults.itemListElement[0];

            // Find or Create the AIS: Check if the Consignment vertex already has a resource of type "AuditableItemStream"
            let streamId: string;
            const existingStreams = consignmentVertex.resources?.filter(
              (resource) => resource.resourceObject?.type === 'AuditableItemStream',
            );

            if (existingStreams && existingStreams.length > 0) {
              // Get the ID of the stream
              streamId = existingStreams[0].id!;
            } else {
              // Create a new AIS using this._aisComponent.create() and link it to the Consignment vertex as a new resource
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

              // Link the stream to the Consignment vertex as a resource
              const updateConsignment = {
                id: consignmentVertex.id,
                annotationObject: consignmentVertex.annotationObject,
                resources: [
                  ...(consignmentVertex.resources || []),
                  {
                    id: streamId,
                    type: 'AuditableItemStream',
                  },
                ],
              };
              await this._aigComponent.update(
                updateConsignment,
                userIdentity,
                this._nodeIdentity,
              );
            }

            // Add the Event to the Stream: Use this._aisComponent.createEntry() to add the new Event object to the stream
            await this._aisComponent.createEntry(
              streamId,
              {
                '@context': [
                  'https://www.w3.org/ns/activitystreams',
                  'https://schema.org/',
                ],
                type: 'Add',
                object: activity.object,
                published: new Date().toISOString(),
              },
              userIdentity,
              this._nodeIdentity,
            );

            await this._loggingService?.log({
              level: 'info',
              source: this.CLASS_NAME,
              message: `Event added to stream ${streamId} for consignment ${consignmentId}`,
            });
          } else {
            // EXISTING: Handle Document activities (unchanged logic)
            // Handle Document activities (existing logic)
            // Now the new vertex is created
            const aig: Omit<IAuditableItemGraphVertex, 'id'> = {
              '@context': [
                AuditableItemGraphContexts.ContextRoot,
                AuditableItemGraphContexts.ContextRootCommon,
              ],
              type: AuditableItemGraphTypes.Vertex,
              annotationObject: activity.object,
            };
            const objectVertexId = await this._aigComponent.create(
              aig,
              userIdentity,
              this._nodeIdentity,
            );
            await this._loggingService?.log({
              level: 'info',
              source: this.CLASS_NAME,
              message: `Object's Vertex created: ${objectVertexId}`,
            });

            // Now query to check whether there is an existing target with that Id and then create a relationship
            // As we are handling Documents and Consignment as per UN/CEFACT we are using `globalId`
            const results = await this._aigComponent.query(undefined, [
              {
                property: 'annotationObject.globalId',
                value: activity.target.globalId,
                comparison: ComparisonOperator.Equals,
              },
            ]);
            // In this case if the target does not exist it is created a new target
            // There can be cases where the target must exist
            let targetVertexId: string = '';
            if (results.itemListElement.length === 0) {
              targetVertexId = await this.createItem(
                activity.target,
                userIdentity,
                this._nodeIdentity,
              );
              await this._loggingService?.log({
                level: 'info',
                source: this.CLASS_NAME,
                message: `New Vertex for target created: ${targetVertexId}`,
              });
            } else {
              targetVertexId = results.itemListElement[0].id;
              // AIG vertex of the target
              await this._loggingService?.log({
                level: 'info',
                source: this.CLASS_NAME,
                message: `Valid target found. Vertex: ${results.itemListElement[0].id}`,
              });
            }

            // We assume the edge relationship concerns a Document
            const edge: IAuditableItemGraphEdge = {
              '@context': [
                AuditableItemGraphContexts.ContextRoot,
                AuditableItemGraphContexts.ContextRootCommon,
              ],
              targetId: objectVertexId,
              type: AuditableItemGraphTypes.Edge,
              edgeRelationships: [
                'https://vocabulary.uncefact.org/associatedDocument',
              ],
            };
            // The target is then updated to also have an edge to the object just created
            const updateObject = {
              id: targetVertexId,
              annotationObject: activity.target,
              edges: [edge],
            };
            await this._aigComponent.update(
              updateObject,
              userIdentity,
              this._nodeIdentity,
            );

            // This is for notifying other Participants
            const consignmentData =
              results.itemListElement[0]?.annotationObject;
            if (!Is.undefined(consignmentData)) {
              const commodity = consignmentData?.exportTypeCode;
              const destCountry = consignmentData?.destinationCountry as {
                countryId: string;
              };
              const destinationCountry = destCountry?.countryId;
              const documentTypeCode = activity.object
                .documentTypeCode as string;

              if (
                commodity === '09011101' &&
                destinationCountry &&
                destinationCountry.includes('#GB') &&
                documentTypeCode.includes('#853')
              ) {
                // Find the FSA endpoint to notify such a Participant
                const dsConnectors =
                  await this._fedCatalogue.queryDataSpaceConnectors(
                    undefined,
                    // The DID of the UK FSA
                    'did:iota:testnet:0x83e99fd9b8804966fd474da212aa93a5769f39f2150714a3c6701d20b5353975',
                  );
                const dsConnector = dsConnectors
                  .itemListElement[0] as IDataSpaceConnectorEntry;
                const endpoint = dsConnector.defaultEndpoint?.endpointURL;
                await this._loggingService?.log({
                  level: 'info',
                  source: this.CLASS_NAME,
                  message: `Endpoint to notify: ${endpoint}`,
                });

                const dsConnectorRestClient = new DataSpaceConnectorClient({
                  endpoint,
                });
                let notifyInError = false;
                try {
                  const notifiedActivity =
                    ObjectHelper.clone<IActivity>(activity);
                  notifiedActivity.generator = this._nodeIdentity;
                  // Workaround due to a bug in validation
                  delete notifiedActivity.object['@context'];
                  if (notifiedActivity.target) {
                    delete notifiedActivity.target['@context'];
                  }
                  await dsConnectorRestClient.notifyActivity(notifiedActivity);
                } catch (error) {
                  const theError = error as IError;
                  await this._loggingService?.log({
                    level: 'warn',
                    source: this.CLASS_NAME,
                    message: `Cannot notify ${endpoint}. Error: ${theError}`,
                  });
                  notifyInError = true;
                }
                if (!notifyInError) {
                  await this._loggingService?.log({
                    level: 'debug',
                    source: this.CLASS_NAME,
                    message: `Endpoint successfully notified: ${endpoint}`,
                  });
                }
              }
            }
          }
          break;
        }
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
}
