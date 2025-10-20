// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Event App Constructor options.
 */
export interface IEventAppConstructorOptions {
  /**
   * Logging component type.
   * @default logging
   */
  loggingComponentType?: string;

  /**
   * Data space connector component type.
   * @default data-space-connector
   */
  dataSpaceConnectorComponentType?: string;

  /**
   * The Auditable Item Graph Component Type.
   */
  auditableItemGraphComponentType?: string;

  /**
   * The Auditable Item Stream Component Type.
   */
  auditableItemStreamComponentType?: string;

  /**
   * The Federated Catalogue Component Type.
   */
  federatedCatalogueComponentType?: string;
}