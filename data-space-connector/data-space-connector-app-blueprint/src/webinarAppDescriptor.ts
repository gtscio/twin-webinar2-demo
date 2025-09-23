// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IDataSpaceConnectorAppDescriptor } from "@twin.org/data-space-connector-models";

/**
 * Test App Descriptor.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const WebinarAppDescriptor: IDataSpaceConnectorAppDescriptor = {
	/**
	 * App Id.
	 */
	id: "https://twin.example.org/twin-webinar2-ds-connector-app",

	/**
	 * The module name.
	 */
	moduleName: "@twin.org/data-space-connector-app-webinar",

	/**
	 * Activities handled.
	 */
	activitiesHandled: [
		{
			objectType: "https://vocabulary.uncefact.org/Consignment",
			activityType: "https://www.w3.org/ns/activitystreams#Create"
		},
		{
			objectType: "https://vocabulary.uncefact.org/Document",
			targetType: "https://vocabulary.uncefact.org/Consignment",
			activityType: "https://www.w3.org/ns/activitystreams#Add"
		}
	]
};
