// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from 'node:path';
import { EnvHelper } from '@twin.org/core';
import { initSchema } from '@twin.org/data-space-connector-service';
import type { IEngineCore, IEngineServer } from '@twin.org/engine-models';
import {
  AuditableItemGraphComponentType,
  FederatedCatalogueComponentType,
  type IEngineConfig,
} from '@twin.org/engine-types';
import { AuditableItemStreamComponentType } from '@twin.org/engine-types';
import { INodeEnvironmentVariables, run } from '@twin.org/node-core';
import * as dotenv from 'dotenv';

dotenv.config({
  path: [path.resolve('.env'), path.resolve('.env.local')],
  quiet: true,
});
const envVars = EnvHelper.envToJson(process.env, 'TWIN_NODE');

await run({
  serverName: 'Data Space Connector Test Server',
  serverVersion: '0.0.1-next.4', // x-release-please-version
  envPrefix: 'TWIN_NODE_',
  localesDirectory: path.resolve('dist/locales'),
  extendConfig,
  extendEngine,
  extendEngineServer,
});

/**
 * Extends the engine config with types specific.
 * @param envVars The env vars.
 * @param engineConfig The engine configuration.
 */
export async function extendConfig(
  envVars: INodeEnvironmentVariables,
  engineConfig: IEngineConfig,
): Promise<void> {
  initSchema();
  engineConfig.types.auditableItemGraphComponent = [
    {
      type: AuditableItemGraphComponentType.Service,
      options: {},
      restPath: 'auditable-item-graph',
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
  engineConfig.types.auditableItemStreamComponent = [
    {
      type: AuditableItemStreamComponentType.Service,
      options: {},
      restPath: 'auditable-item-stream',
    },
  ];
}

/**
 * Extends the engine.
 * @param engineCore Engine Core
 */
export async function extendEngine(engineCore: IEngineCore): Promise<void> {
  engineCore.addTypeInitialiser(
    'auditableItemGraphComponent',
    '@twin.org/engine-types',
    'initialiseAuditableItemGraphComponent',
  );

  engineCore.addTypeInitialiser(
    'federatedCatalogueComponent',
    '@twin.org/engine-types',
    'initialiseFederatedCatalogueComponent',
  );

  engineCore.addTypeInitialiser(
    'auditableItemStreamComponent',
    '@twin.org/engine-types',
    'initialiseAuditableItemStreamComponent',
  );
}

/**
 * Extends the engine server.
 * @param server The engine server.
 */
export async function extendEngineServer(
  server: IEngineServer,
): Promise<void> {}
