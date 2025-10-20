import {
  AuditableItemGraphContexts,
  AuditableItemGraphTypes,
  type IAuditableItemGraphComponent,
  type IAuditableItemGraphEdge,
  type IAuditableItemGraphVertex,
} from '@twin.org/auditable-item-graph-models';
import { type IError, Is, ObjectHelper } from '@twin.org/core';
import type { IJsonLdNodeObject } from '@twin.org/data-json-ld';
import { DataSpaceConnectorClient } from '@twin.org/data-space-connector-rest-client';
import { ComparisonOperator } from '@twin.org/entity';
import type {
  IDataSpaceConnector as IDataSpaceConnectorEntry,
  IFederatedCatalogueComponent,
} from '@twin.org/federated-catalogue-models';
import type { ILoggingComponent } from '@twin.org/logging-models';
import type { IActivity } from '@twin.org/standards-w3c-activity-streams';
import type { JsonLdWithGlobalId } from './common';

interface DocumentHandlerDeps {
  loggingService?: ILoggingComponent;
  nodeIdentity: string;
  className: string;
  aigComponent: IAuditableItemGraphComponent;
  fedCatalogue: IFederatedCatalogueComponent;
  createItem: (
    object: IJsonLdNodeObject,
    userIdentity: string,
    nodeIdentity: string,
  ) => Promise<string>;
  documentEdgeRelationship: string;
  targetParticipantDid: string;
}

export async function handleDocumentAddActivity(
  activity: IActivity,
  userIdentity: string,
  deps: DocumentHandlerDeps,
): Promise<void> {
  const objectNode = activity.object as IJsonLdNodeObject;
  const targetNode = activity.target as JsonLdWithGlobalId;

  const aig: Omit<IAuditableItemGraphVertex, 'id'> = {
    '@context': [
      AuditableItemGraphContexts.ContextRoot,
      AuditableItemGraphContexts.ContextRootCommon,
    ],
    type: AuditableItemGraphTypes.Vertex,
    annotationObject: objectNode,
  };

  const objectVertexId = await deps.aigComponent.create(
    aig,
    userIdentity,
    deps.nodeIdentity,
  );

  await deps.loggingService?.log({
    level: 'info',
    source: deps.className,
    message: `Object's Vertex created: ${objectVertexId}`,
  });

  const results = await deps.aigComponent.query(undefined, [
    {
      property: 'annotationObject.globalId',
      value: targetNode.globalId,
      comparison: ComparisonOperator.Equals,
    },
  ]);

  let targetVertexId: string = '';
  if (results.itemListElement.length === 0) {
    targetVertexId = await deps.createItem(
      targetNode,
      userIdentity,
      deps.nodeIdentity,
    );
    await deps.loggingService?.log({
      level: 'info',
      source: deps.className,
      message: `New Vertex for target created: ${targetVertexId}`,
    });
  } else {
    targetVertexId = results.itemListElement[0].id;
    await deps.loggingService?.log({
      level: 'info',
      source: deps.className,
      message: `Valid target found. Vertex: ${results.itemListElement[0].id}`,
    });
  }

  const edge: IAuditableItemGraphEdge = {
    '@context': [
      AuditableItemGraphContexts.ContextRoot,
      AuditableItemGraphContexts.ContextRootCommon,
    ],
    targetId: objectVertexId,
    type: AuditableItemGraphTypes.Edge,
    edgeRelationships: [deps.documentEdgeRelationship],
  };

  const updateObject = {
    id: targetVertexId,
    annotationObject: targetNode,
    edges: [edge],
  };
  await deps.aigComponent.update(updateObject, userIdentity, deps.nodeIdentity);

  const consignmentData = results.itemListElement[0]?.annotationObject;
  if (Is.undefined(consignmentData)) {
    return;
  }

  const commodity = consignmentData?.exportTypeCode;
  const destCountry = consignmentData?.destinationCountry as {
    countryId: string;
  };
  const destinationCountry = destCountry?.countryId;
  const documentTypeCode = (objectNode.documentTypeCode as string) ?? '';

  if (
    commodity === '09011101' &&
    destinationCountry &&
    destinationCountry.includes('#GB') &&
    documentTypeCode.includes('#853')
  ) {
    const dsConnectors = await deps.fedCatalogue.queryDataSpaceConnectors(
      undefined,
      deps.targetParticipantDid,
    );
    const dsConnector = dsConnectors
      .itemListElement[0] as IDataSpaceConnectorEntry;
    const endpoint = dsConnector.defaultEndpoint?.endpointURL;
    await deps.loggingService?.log({
      level: 'info',
      source: deps.className,
      message: `Endpoint to notify: ${endpoint}`,
    });

    const dsConnectorRestClient = new DataSpaceConnectorClient({
      endpoint,
    });
    let notifyInError = false;
    try {
      const notifiedActivity = ObjectHelper.clone<IActivity>(activity);
      notifiedActivity.generator = deps.nodeIdentity;
      delete notifiedActivity.object['@context'];
      if (notifiedActivity.target) {
        delete notifiedActivity.target['@context'];
      }
      await dsConnectorRestClient.notifyActivity(notifiedActivity);
    } catch (error) {
      const theError = error as IError;
      await deps.loggingService?.log({
        level: 'warn',
        source: deps.className,
        message: `Cannot notify ${endpoint}. Error: ${theError}`,
      });
      notifyInError = true;
    }
    if (!notifyInError) {
      await deps.loggingService?.log({
        level: 'debug',
        source: deps.className,
        message: `Endpoint successfully notified: ${endpoint}`,
      });
    }
  }
}
