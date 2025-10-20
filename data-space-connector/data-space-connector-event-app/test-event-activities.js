// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Test script to demonstrate sending Event and Document activities to the data space connector app.
 * This script shows how to:
 * 1. Create a consignment (Create activity)
 * 2. Add an event targeting that consignment (Add activity)
 * 3. Add a document targeting that consignment (Add activity)
 *
 * Run this script with: node test-event-activities.js
 */

import { DataSpaceConnectorClient } from '@twin.org/data-space-connector-rest-client';

// Configuration - Update to match test server port and route from server logs
const DS_CONNECTOR_ENDPOINT = 'http://localhost:44444/data-space-connector'; // Test server runs on port 44444 with /data-space-connector prefix
const USER_IDENTITY = 'did:iota:testnet:0x1ee831611a9fe9877c82e05075d9670c4970b4fd0904c208082ee50e45817a9d'; // Example identity

async function main() {
  console.log('Starting Event Activity Test...');

  // Initialize the REST client
  const client = new DataSpaceConnectorClient({
    endpoint: DS_CONNECTOR_ENDPOINT,
  });

  try {
    // Step 1: Create a consignment (Create activity)
    console.log('\n1. Creating a consignment...');

    const consignmentId = `urn:consignment:${Date.now()}`;

    const createActivity = {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        'https://schema.org/',
      ],
      type: 'Create',
      actor: {
        id: USER_IDENTITY,
        type: 'Person',
      },
      object: {
        '@context': 'https://vocabulary.uncefact.org/',
        type: 'Consignment',
        globalId: consignmentId,
        consignorParty: USER_IDENTITY,
        exportTypeCode: '09011101', // Example commodity code
        destinationCountry: {
          countryId: '#GB', // United Kingdom
        },
      },
      published: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    console.log('Sending Create activity for consignment:', JSON.stringify(createActivity, null, 2));

    const createResult = await client.notifyActivity(createActivity);
    console.log('Create activity result:', createResult);

    // Step 2: Add an event targeting the consignment (Add activity)
    console.log('\n2. Adding an event to the consignment...');

    const eventActivity = {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        'https://schema.org/',
      ],
      type: 'Add',
      actor: {
        id: USER_IDENTITY,
        type: 'Person',
      },
      object: {
        '@context': 'https://vocabulary.uncefact.org/',
        type: 'Event',
        timestamp: new Date().toISOString(),
        location: 'Warsaw, Poland',
        status: 'Shipment departed from origin',
      },
      target: {
        '@context': 'https://vocabulary.uncefact.org/',
        type: 'Consignment',
        globalId: consignmentId,
      },
      published: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    console.log('Sending Add activity for event:', JSON.stringify(eventActivity, null, 2));

    const eventResult = await client.notifyActivity(eventActivity);
    console.log('Event Add activity result:', eventResult);

    // Step 3: Add a document targeting the consignment (Add activity)
    console.log('\n3. Adding a document to the consignment...');

    const documentActivity = {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        'https://schema.org/',
      ],
      type: 'Add',
      actor: {
        id: USER_IDENTITY,
        type: 'Person',
      },
      object: {
        '@context': 'https://vocabulary.uncefact.org/',
        type: 'Document',
        globalId: `urn:document:${Date.now()}`,
        documentTypeCode: '#853', // Veterinary certificate
        issueDateTime: new Date().toISOString(),
        content: 'Veterinary health certificate for consignment',
      },
      target: {
        '@context': 'https://vocabulary.uncefact.org/',
        type: 'Consignment',
        globalId: consignmentId,
      },
      published: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    console.log('Sending Add activity for document:', JSON.stringify(documentActivity, null, 2));

    const documentResult = await client.notifyActivity(documentActivity);
    console.log('Document Add activity result:', documentResult);

    console.log('\n✅ Test completed successfully!');
    console.log(`Created consignment with ID: ${consignmentId}`);
    console.log('Event was added to the consignment\'s audit stream.');
    console.log('Document was linked to the consignment via AIG edge.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Activity Structure Reference
/*
Create Activity Structure:
{
  "@context": ["https://www.w3.org/ns/activitystreams", "https://schema.org/"],
  "type": "Create",
  "actor": { "id": "user-identity", "type": "Person" },
  "object": {
    "@context": "https://vocabulary.uncefact.org/",
    "type": "Consignment",
    "globalId": "urn:consignment:unique-id",
    "consignorParty": "user-identity",
    "exportTypeCode": "09011101",
    "destinationCountry": { "countryId": "#GB" }
  },
  "published": "2025-10-17T08:17:35.000Z"
}

Add Event Activity Structure:
{
  "@context": ["https://www.w3.org/ns/activitystreams", "https://schema.org/"],
  "type": "Add",
  "actor": { "id": "user-identity", "type": "Person" },
  "object": {
    "@context": "https://vocabulary.uncefact.org/",
    "type": "Event",
    "timestamp": "2025-10-17T08:17:35.000Z",
    "location": "Location description",
    "status": "Event description"
  },
  "target": {
    "@context": "https://vocabulary.uncefact.org/",
    "type": "Consignment",
    "globalId": "urn:consignment:unique-id"
  },
  "published": "2025-10-17T08:17:35.000Z"
}

Add Document Activity Structure:
{
  "@context": ["https://www.w3.org/ns/activitystreams", "https://schema.org/"],
  "type": "Add",
  "actor": { "id": "user-identity", "type": "Person" },
  "object": {
    "@context": "https://vocabulary.uncefact.org/",
    "type": "Document",
    "globalId": "urn:document:unique-id",
    "documentTypeCode": "#853",
    "issueDateTime": "2025-10-17T08:17:35.000Z",
    "content": "Document content"
  },
  "target": {
    "@context": "https://vocabulary.uncefact.org/",
    "type": "Consignment",
    "globalId": "urn:consignment:unique-id"
  },
  "published": "2025-10-17T08:17:35.000Z"
}
*/

// Run the test
main().catch(console.error);