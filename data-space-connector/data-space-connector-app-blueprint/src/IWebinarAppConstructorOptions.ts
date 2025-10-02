// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Test App Constructor options.
 */
export interface IWebinarAppConstructorOptions {
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
   * The Federated Catalogue Component Type.
   */
  federatedCatalogueComponentType?: string;
}
