import { ComparisonOperator } from '@twin.org/entity';
import type {
  IAuditableItemGraphComponent,
  IAuditableItemGraphVertex,
} from '@twin.org/auditable-item-graph-models';
import type { IAuditableItemStreamComponent } from '@twin.org/auditable-item-stream-models';
import type { ILoggingComponent } from '@twin.org/logging-models';
import type { IActivity } from '@twin.org/standards-w3c-activity-streams';
import type { JsonLdWithGlobalId } from './common';

interface EventHandlerDeps {
  loggingService?: ILoggingComponent;
  nodeIdentity: string;
  className: string;
  aigComponent: IAuditableItemGraphComponent;
  aisComponent: IAuditableItemStreamComponent;
  auditableItemStreamType: string;
}

export async function handleEventAddActivity(
  activity: IActivity,
  userIdentity: string,
  deps: EventHandlerDeps,
): Promise<void> {
  const targetNode = activity.target as JsonLdWithGlobalId;
  const consignmentId = targetNode.globalId;

  if (!consignmentId) {
    throw new Error('Consignment identifier missing for Event activity');
  }

  const consignmentResults = await deps.aigComponent.query(undefined, [
    {
      property: 'annotationObject.globalId',
      value: consignmentId,
      comparison: ComparisonOperator.Equals,
    },
  ]);

  if (consignmentResults.itemListElement.length === 0) {
    throw new Error(`Consignment with ID ${consignmentId} not found`);
  }

  const consignmentVertex = consignmentResults
    .itemListElement[0] as IAuditableItemGraphVertex;

  let streamId: string;
  const existingStreams = consignmentVertex.resources?.filter(
    (resource) =>
      resource.resourceObject?.type === deps.auditableItemStreamType,
  );

  if (existingStreams && existingStreams.length > 0) {
    streamId = existingStreams[0].id!;
  } else {
    streamId = await deps.aisComponent.create(
      {
        annotationObject: {
          '@context': [
            'https://www.w3.org/ns/activitystreams',
            'https://schema.org/',
          ],
          type: deps.auditableItemStreamType,
          name: `Event Stream for Consignment ${consignmentId}`,
        },
      },
      undefined,
      userIdentity,
      deps.nodeIdentity,
    );

    const updateConsignment = {
      id: consignmentVertex.id,
      annotationObject: consignmentVertex.annotationObject,
      resources: [
        ...(consignmentVertex.resources || []),
        {
          id: streamId,
          type: deps.auditableItemStreamType,
        },
      ],
    };
    await deps.aigComponent.update(
      updateConsignment,
      userIdentity,
      deps.nodeIdentity,
    );
  }

  await deps.aisComponent.createEntry(
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
    deps.nodeIdentity,
  );

  await deps.loggingService?.log({
    level: 'info',
    source: deps.className,
    message: `Event added to stream ${streamId} for consignment ${consignmentId}`,
  });
}
