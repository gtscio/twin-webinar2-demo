import { Guards } from '@twin.org/core';
import type { IJsonLdNodeObject } from '@twin.org/data-json-ld';
import type { ILoggingComponent } from '@twin.org/logging-models';
import type { IActivity } from '@twin.org/standards-w3c-activity-streams';
import type { TypeMatcher } from './common';

interface ConsignmentHandlerDeps {
  loggingService?: ILoggingComponent;
  createItem: (
    object: IJsonLdNodeObject,
    userIdentity: string,
    nodeIdentity: string,
  ) => Promise<string>;
  nodeIdentity: string;
  className: string;
  consignmentType: string;
  isTypeMatch: TypeMatcher;
}

export async function handleConsignmentCreate(
  activity: IActivity,
  userIdentity: string,
  deps: ConsignmentHandlerDeps,
): Promise<void> {
  Guards.object<IJsonLdNodeObject>(
    deps.className,
    'activity.object',
    activity.object,
  );

  const objectNode = activity.object as IJsonLdNodeObject;

  if (
    !deps.isTypeMatch(
      objectNode.type as string | string[] | undefined,
      deps.consignmentType,
    )
  ) {
    throw new Error(`Unsupported Create activity for type ${objectNode.type}`);
  }

  const vertexIdObject = await deps.createItem(
    objectNode,
    userIdentity,
    deps.nodeIdentity,
  );

  await deps.loggingService?.log({
    level: 'info',
    source: deps.className,
    message: `Item created: ${vertexIdObject}`,
  });
}
