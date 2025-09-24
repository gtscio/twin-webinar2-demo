// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IRestRoute } from "@twin.org/api-models";
import { ComponentFactory, StringHelper } from "@twin.org/core";
import type { IDataSpaceConnectorApp } from "@twin.org/data-space-connector-models";
import type { IEngineCore, IEngineCoreContext } from "@twin.org/engine-models";
import { nameof } from "@twin.org/nameof";
import type { IWebinarAppConstructorOptions } from "./IWebinarAppConstructorOptions";
import { WebinarAppDescriptor } from "./webinarAppDescriptor";
import { WebinarDataSpaceConnectorApp } from "./webinarDataSpaceConnectorApp";

/**
 * Test Data Space Connector App initializer.
 * @param core The engine core.
 * @param context The context for the engine.
 * @param instanceConfig The instance config.
 * @param instanceConfig.options The instance config options.
 * @param overrideInstanceType The instance type to override the default.
 * @returns The name of the instance created.
 */
export function appInitialiser(
	core: IEngineCore,
	context: IEngineCoreContext,
	instanceConfig: { options: IWebinarAppConstructorOptions },
	overrideInstanceType: string
): string {
	const componentName = `${StringHelper.kebabCase(nameof<IDataSpaceConnectorApp>(), true)}-${WebinarAppDescriptor.id}`;
	ComponentFactory.register(
		componentName,
		() => new WebinarDataSpaceConnectorApp(instanceConfig.options)
	);
	return overrideInstanceType ?? componentName;
}

/**
 * Generate the rest routes for the component.
 * @param baseRouteName The base route name.
 * @param componentName The component name.
 * @returns The rest routes.
 */
export function generateRestRoutes(baseRouteName: string, componentName: string): IRestRoute[] {
	return [];
}
