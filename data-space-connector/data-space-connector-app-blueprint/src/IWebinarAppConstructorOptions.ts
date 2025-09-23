// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IDataSpaceConnectorAppConstructorOptions } from "@twin.org/data-space-connector-models";

/**
 * Test App Constructor options.
 */
export interface ITestAppConstructorOptions extends IDataSpaceConnectorAppConstructorOptions {
  /**
   * The Auditable Item Graph Component Type.
   */
  auditableItemGraphComponentType?: string;

  /**
   * The Federated Catalogue Component Type.
   */
  federatedCatalogueComponentType?: string;
}
