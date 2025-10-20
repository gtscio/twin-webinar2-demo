// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRestRoute } from '@twin.org/api-models';
import type { IComponent } from '@twin.org/core';
import {
  DataSpaceConnectorAppFactory,
  type IDataSpaceConnectorApp,
} from '@twin.org/data-space-connector-models';
import type {
  IEngineCore,
  IEngineCoreConfig,
  IEngineCoreContext,
  IEngineServer,
} from '@twin.org/engine-models';
import type { IEventAppConstructorOptions } from './IEventAppConstructorOptions';
import { EventDataSpaceConnectorApp } from './eventDataSpaceConnectorApp';

/**
 * Initialise the  extension.
 * @param envVars The environment variables for the node.
 * @param nodeEngineConfig The node engine config.
 */
export async function extensionInitialise(
  envVars: { [id: string]: string },
  nodeEngineConfig: IEngineCoreConfig,
): Promise<void> {
  nodeEngineConfig.types.eventAppComponent = [
    {
      type: 'service',
      options: {},
    },
  ];
}

/**
 * Initialise the engine for the extension.
 * @param engineCore The engine core instance.
 */
export async function extensionInitialiseEngine(
  engineCore: IEngineCore,
): Promise<void> {
  engineCore.addTypeInitialiser(
    'eventAppComponent',
    '@twindev.org/data-space-connector-event-app',
    'eventAppInitialiser',
  );
}

/**
 * Initialise the engine server for the extension.
 * @param engineCore The engine core instance.
 * @param engineServer The engine server instance.
 */
export async function extensionInitialiseEngineServer(
  engineCore: IEngineCore,
  engineServer: IEngineServer,
): Promise<void> {
  engineServer.addRestRouteGenerator(
    'eventAppComponent',
    '@twindev.org/data-space-connector-event-app',
    'generateRestRoutes',
  );
}

/**
 * Event Data Space Connector App initializer.
 * @param engineCore The engine core.
 * @param context The context for the engine.
 * @param instanceConfig The instance config.
 * @param instanceConfig.options The instance config options.
 * @param instanceConfig.type The instance type.
 * @returns The instance created and the factory for it.
 */
export async function eventAppInitialiser(
  engineCore: IEngineCore,
  context: IEngineCoreContext,
  instanceConfig: { type: 'service'; options: IEventAppConstructorOptions },
): Promise<{
  instanceType?: string;
  factory?: typeof DataSpaceConnectorAppFactory;
  component?: IComponent;
}> {
  let component: IDataSpaceConnectorApp | undefined;
  let instanceType: string | undefined;

  if (instanceConfig.type === 'service') {
    component = new EventDataSpaceConnectorApp({
      dataSpaceConnectorComponentType: engineCore.getRegisteredInstanceType(
        'dataSpaceConnectorComponent',
      ),
      loggingComponentType:
        engineCore.getRegisteredInstanceType('loggingComponent'),
      auditableItemGraphComponentType: engineCore.getRegisteredInstanceType(
        'auditableItemGraphComponent',
      ),
      auditableItemStreamComponentType: engineCore.getRegisteredInstanceType(
        'auditableItemStreamComponent',
      ),
      federatedCatalogueComponentType: engineCore.getRegisteredInstanceType(
        'federatedCatalogueComponent',
      ),
      ...instanceConfig.options,
    });
    instanceType = EventDataSpaceConnectorApp.APP_ID;
  }

  return {
    instanceType,
    factory: DataSpaceConnectorAppFactory,
    component,
  };
}

/**
 * Generate the rest routes for the component.
 * @param baseRouteName The base route name.
 * @param componentName The component name.
 * @returns The rest routes.
 */
export function generateRestRoutes(
  baseRouteName: string,
  componentName: string,
): IRestRoute[] {
  return [];
}
