# TWIN Webinar 2 Demo Repository Overview

## Overview

This repository contains materials for the TWIN Webinar 2 (September 2025), focusing on a 3-way document sharing educational case. It demonstrates the integration of various components in a data space ecosystem, including participants, data resources, service offerings, and data space connectors. The repository provides a complete dataset, scripts for credential generation, data space connector implementations, and documentation to facilitate experimentation and understanding of TWIN's federated catalogue and data sharing mechanisms.

The primary purpose is to showcase how different actors (e.g., exporters, freight forwarders, veterinary agencies, and food standards agencies) can securely share documents through a decentralized data space using verifiable credentials and compliance mechanisms. It serves as an educational resource for developers and stakeholders interested in implementing similar systems using TWIN technologies.

From a TWIN architecture perspective, this demo illustrates the Trust Framework's role in enabling self-sovereign participants through Decentralized Identifiers (DIDs) and Verifiable Credentials, ensuring data sovereignty and interoperability in Data Spaces. Key ecosystem roles include Providers (e.g., exporters offering data resources) and Consumers (e.g., agencies querying for compliance documents), facilitated by TWIN Data Space Connectors and Adaptors for seamless data exchange without intermediaries.

## Dataset

The dataset models the entities involved in the 3-way document sharing scenario and is structured hierarchically:

### Identities

- **Location**: `dataset/identities/`
- **Contents**: Decentralized Identifiers (DIDs) for all actors including GIW (Poland Veterinary Agency), Exporter, Freight Forwarder (FFW), UK Food Standards Agency (FSA), Notary service, and Clearing House.
- **Details**: Each identity includes DID documents, private keys, and verification methods registered on the IOTA Ledger.
- **Role in TWIN Ecosystem**: Identities serve as the foundational unique identifiers for all participants in the data space. They enable secure, decentralized authentication and authorization, allowing entities to prove ownership and control over their digital representations without relying on centralized authorities. In the TWIN Trust Framework, DIDs are resolved via a verifiable registry (DLT), supporting self-sovereign identity management aligned with W3C standards and Gaia-X principles.
- **Relationships**: Identities are referenced in claims and credentials as the subject (e.g., `id` field in credential subjects), establishing the link between the real-world entity and its verifiable attestations. For instance, a participant's DID is used across claims for legal entities, data resources, and service offerings. DIDs underpin the Trust Framework by enabling Trust Anchors to issue Participant Credentials and Compliance Credentials.
- **Practical Example**: The file [`dataset/identities/poland-exporter/poland-exporter.json`](dataset/identities/poland-exporter/poland-exporter.json:1) contains the DID `did:iota:testnet:0x1ee831611a9fe9877c82e05075d9670c4970b4fd0904c208082ee50e45817a9d`, along with cryptographic keys for signing and verification, demonstrating how identities are structured for secure interactions in the ecosystem. This DID serves as the subject for Participant Compliance Credentials, enabling registration in the TWIN Catalogue.

### Claims

- **Location**: `dataset/claims/`
- **Subfolders**:
  - `participants/`: Legal entity attestations and terms and conditions for each participant.
  - `data-resources/`: Claims for data resources like veterinary certificates, exporter consignments, and documents.
  - `service-offerings/`: Claims for query services offered by participants.
  - `data-space-connectors/`: Claims for data space connector configurations.
- **Role in TWIN Ecosystem**: Claims are structured assertions about the properties, capabilities, and compliance of entities (participants, data resources, etc.) in the data space. They form the basis for verifiable credentials, enabling trust and interoperability by defining what an entity claims to be or provide. In the TWIN Trust Framework, claims are attested by Trust Anchors (e.g., government agencies or accredited bodies) to create Participant Attributes, which are then used in Verifiable Credentials for onboarding and compliance verification.
- **Relationships**: Claims are transformed into verifiable credentials (evidences) through signing and issuance processes. Compliance credentials aggregate multiple evidences to certify overall adherence to standards, which are then registered in the TWIN Federated Catalogue for discovery and sharing. Claims underpin the Trust Framework by providing the raw data for Credential Issuers and Clearing Houses to validate ecosystem rules.
- **Practical Example**: The file [`dataset/claims/participants/compliance/poland-exporter-participant-compliant.json`](dataset/claims/participants/compliance/poland-exporter-participant-compliant.json:1) is a claim for the Poland Exporter participant, specifying its type as "LegalEntity" and referencing evidences like legal entity and terms-and-conditions credentials, illustrating how claims prepare data for credential generation. This claim would be verified by a TWIN Clearing House to issue a Compliance Credential, enabling the participant's registration as a Provider in the Data Space.

### Credentials

- **Location**: `dataset/credentials/`
- **Subfolders**:
  - `evidences/`: Verifiable credentials generated from claims, published as public evidences.
  - `compliance/`: Final compliance credentials that can be consumed by the TWIN Catalogue.
- **Role in TWIN Ecosystem**: Credentials provide cryptographically verifiable proofs of claims, ensuring data integrity and authenticity in the decentralized ecosystem. Evidences are individual, signed credentials (e.g., legal entity proofs), while compliance credentials aggregate evidences to confirm full compliance, enabling secure registration and querying in the TWIN Federated Catalogue. In the Trust Framework, Verifiable Credentials are issued by Trust Anchors and validated by Clearing Houses to ensure ecosystem governance, with revocation support via DLT-based lists.
- **Relationships**: Evidences are derived directly from claims and serve as building blocks for compliance credentials. Compliance credentials reference evidences via digests and URLs, creating a chain of trust from raw claims to catalogue-ready attestations. Templates guide the structure of these credentials. Credentials enable Data Exchange by proving Participant Attributes and Service Offering policies, aligning with W3C VC standards and Gaia-X compliance.
- **Practical Example**: The evidence file [`dataset/credentials/evidences/poland-exporter-legal-entity.json`](dataset/credentials/evidences/poland-exporter-legal-entity.json:1) is a verifiable credential attesting to the Poland Exporter's legal details (e.g., name "Kurczak Food", EORI number), signed with a DID. The compliance credential [`dataset/credentials/compliance/poland-exporter-compliant-participant.json`](dataset/credentials/compliance/poland-exporter-compliant-participant.json:1) aggregates this and a terms-and-conditions evidence, ready for catalogue registration. This demonstrates how Trust Anchors (e.g., Notary services) issue credentials to establish trust for Data Space participation.

### Templates

- **Location**: `dataset/templates/`
- **Contents**: Base templates for generating various types of credentials, following W3C Verifiable Credentials standards.
- **Role in TWIN Ecosystem**: Templates standardize the format and context for credentials, ensuring consistency and compliance with W3C standards across the ecosystem. They facilitate automated generation of evidences and compliance credentials, reducing errors and promoting interoperability in data sharing scenarios.
- **Relationships**: Templates are used as starting points for creating credentials from claims, with specific fields populated based on entity details. They underpin both evidences and compliance credentials, linking back to identities and claims through structured schemas.
- **Practical Example**: The base template [`dataset/templates/template.json`](dataset/templates/template.json:1) includes essential W3C contexts and types, which are extended in generated credentials like the legal entity evidence, demonstrating how templates provide a reusable foundation for verifiable attestations.

## Scripts

The scripts directory contains tools for generating and managing credentials:

- **Location**: `scripts/`
- **Technologies**: Mix of JavaScript (ES modules) and shell scripts.
- **Key Dependencies**:
  - `@twin.org/standards-w3c-did`: For DID operations.
  - `@twin.org/crypto`: For cryptographic functions.
- **Main Script**: `calculate-entry-compliance-credential.js`
  - Generates compliance credentials for participants, data resources, service offerings, and data space connectors.
  - Usage examples:

    ```bash
    # For data resources
    node ./calculate-entry-compliance-credential "data-resource" "poland-veterinary-agency" "giw-vet-cert" "https://twin.example.org/data-resources/vet-cert-doc-6ce567"

    # For participants
    node ./calculate-entry-compliance-credential "participant" "poland-exporter"
    ```

- **Prerequisites**: Requires `npm install` in the scripts directory and Docker for full functionality.
- **Role in TWIN Trust Framework**: These scripts automate the issuance of Verifiable Credentials and Compliance Credentials by Trust Anchors and Clearing Houses. They facilitate onboarding by generating evidences from claims, ensuring compliance with ecosystem rules, and enabling registration in the TWIN Catalogue for Data Space participation.

## Data Space Connector

This component provides implementations for data space connectivity:

### Data Space Connector App Blueprint

- **Location**: `data-space-connector/data-space-connector-app-blueprint/`
- **Purpose**: Blueprint for custom Data Space Connector Apps that can handle the 3-way document sharing case.
- **Technologies**: TypeScript, Node.js (>=20.0.0), with dependencies on TWIN libraries like `@twin.org/data-space-connector-models`, `@twin.org/federated-catalogue-models`.
- **Features**: REST API generation, engine initialization, and webinar-specific app logic.
- **Build System**: Uses Rollup for bundling, Vitest for testing, TypeDoc for documentation.
- **Role in TWIN Architecture**: This blueprint enables the creation of TWIN Data Space Connector Apps, which extend the core TWIN DS Connector functionality. It supports Data Exchange Services by implementing query/subscribe interfaces, facilitating secure data sharing between Providers and Consumers in the Data Space, with policy enforcement for access control.

### Data Space Connector Test Server

- **Location**: `data-space-connector/data-space-connector-test-server/`
- **Purpose**: Custom REST server based on TWIN Node libraries for testing data space connector functionality.
- **Note**: May not be needed if using TWIN Playground.
- **Integration**: Uses the blueprint app as a dependency.
- **Role in TWIN Architecture**: Acts as a TWIN Adaptor or DS Connector implementation for testing Data Exchange protocols. It demonstrates how existing IT systems can integrate with TWIN Nodes via Adaptors, enabling bi-directional data flow and subscription-based notifications for activity streams in the demo's document sharing scenario.

## Docs

- **Location**: `docs/`
- **Public Credentials**: `docs/public-credentials/` contains web-published verifiable credentials that serve as evidences for compliance credentials.
- **Terms and Conditions**: `docs/terms-and-conditions.json` defines the legal agreements between participants.

## Integration

The materials integrate with the [TWIN Federated Catalogue](https://github.com/twinfoundation/federated-catalogue):

- **Registration**: Use compliance credentials to register participants, data resources, service offerings, and data space connectors.
- **Example API Call**:

  ```bash
  curl --location 'http://localhost:3020/federated-catalogue/participant-credentials' \
  --header 'Content-Type: application/jwt' \
  --data 'eyJhbGciOiJFZERTQSIsImlzcyI...'
  ```

- **Querying**: Retrieve registered entities via REST endpoints.
- **Deployment Options**: Docker deployment or Node.js/TypeScript stack, with a playground option for easier experimentation.
- **Role in TWIN Architecture**: The TWIN Catalogue serves as the core Enabling & Federation Service, a decentralized registry for compliant Participants, Service Offerings, and Data Resources. It enables discovery and policy enforcement in Data Exchange Services, ensuring that only verified entities with valid Compliance Credentials can participate in the Data Space. This facilitates the demo's 3-way document sharing by allowing Consumers to query for Providers' offerings securely.

## Setup Guide

### Prerequisites

- Node.js >= 20.0.0
- Docker (for full functionality)
- Git (for cloning the repository)

### Local Development Setup

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/gtscio/twin-webinar2-demo.git
   cd twin-webinar2-demo
   ```

2. **Install Dependencies for Scripts**:

   ```bash
   cd scripts
   npm install
   cd ..
   ```

3. **Build Data Space Connector Components** (optional, for development):

   ```bash
   cd data-space-connector/data-space-connector-app-blueprint
   npm install
   npm run build
   cd ../data-space-connector-test-server
   npm install
   npm run build
   cd ../..
   ```

4. **Generate Credentials**:
   - Follow the script usage examples in the Scripts section.
   - Ensure Docker is running for shell script dependencies.

5. **Deploy TWIN Federated Catalogue**:
   - Use Docker or Node.js setup as described in the integration section.
   - Register entities using the generated compliance credentials.

6. **Run Data Space Connector Test Server** (optional):

   ```bash
   cd data-space-connector/data-space-connector-test-server
   npm start
   ```

### Experimentation

- Fork the repository for custom experiments.
- Use the provided dataset and scripts to generate new credentials.
- Integrate with TWIN Playground for simplified testing.
- Publish public credentials via GitHub Pages for web accessibility.

### Notes

- Current implementation does not include TWIN Rights Management components or OpenID authentication (work in progress).
- All credentials follow W3C Verifiable Credentials v2 standards.
- DIDs are registered on IOTA Testnet.

## TWIN Architecture Overview

TWIN (Trade Worldwide Information Network) is a Digital Public Infrastructure for decentralized value chain ecosystems, particularly international trade and global supply chains. It builds on open-source software, open protocols, and standards like W3C DIDs/VCs, Gaia-X, and IDSA RAM to enable scalable, secure data exchange without intermediaries.

### High-Level Architecture

TWIN revolves around **TWIN Nodes** as modular agents providing runtime for services across three planes:

- **Application Plane**: Existing IT systems (e.g., Single Window Systems, ERP) integrate via **TWIN Adaptors** for bi-directional data flow. TWIN Native Solutions consume services for analytics or compliance checking.
- **Data & Services Plane**: Core services include Visibility Services (Auditable Item Graph/Streams for digital twins and events), Document Management (storage, verification, tokenization), and Data Exchange Services via **TWIN Data Space Connectors** (DS Connectors) for query/subscribe interfaces.
- **Infrastructure Plane**: Includes the **TWIN Catalogue** (federated registry for discovery), verifiable registries (DLT-based), and datastores/object stores.

### Trust Framework

Enables self-sovereign Participants through:

- **Decentralized Identities**: W3C DIDs resolved via IOTA DLT.
- **Verifiable Credentials**: Issued by Trust Anchors, validated by Clearing Houses for Compliance Credentials.
- **Onboarding**: Participants prove attributes via KYC/Identity Providers, get attested credentials, and achieve compliance for Catalogue registration.

### Data Spaces and Exchange

Participants act as Providers (offering data/services) or Consumers (querying). Data sovereignty is ensured via policies (W3C ODRL) enforced by DS Connectors. Exchange uses Activity Streams for notifications, with Adaptors bridging legacy systems.

### Demo Context

This repository demonstrates TWIN in a 3-way document sharing scenario: Poland Exporter shares veterinary certificates with UK FSA via Freight Forwarder, using DS Connectors for secure, policy-governed exchange. Credentials ensure trust, Catalogue enables discovery, and Adaptors integrate existing systems.

For full details, refer to the [TWIN Whitepaper Reference Architecture](TWIN_Whitepaper_Reference_Architecture-Draft4-July-2025-ae56ceb4f476ac9f6fecea8630c9d780.pdf).
