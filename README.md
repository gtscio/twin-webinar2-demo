# TWIN Webinar 2 (September 2025)

Materials of the 3-way document sharing educational case. 
*Note: If you want to experiment with these materials you can try to fork this repository with your own GH Pages* 

## Description of the resources available

* [dataset](./dataset) The dataset that models the different entities involved: Participants, Data Resources, Service Offerings, and Data Space Connectors.
* [scripts](./scripts/) It contains scripts that allows to generate credentials associated with the dataset.
* [docs/public-credentials](./docs/public-credentials/). A folder that is published on the Web that contains public credentials that act as evidences to obtain a Compliance Credential for each of the entries.
* [data-space-connector](./data-space-connector). The DS Connector Apps and a DS Connector Service that can be used for experimentation.

### Dataset

The dataset contains the following assets:

* [identities](./dataset/identities). The identities (DID) of the actors involved (GIW, Exporter, FFW, UK FSA), together with the Notary service (that attests legal entities) and the Clearing House (that issues Compliance Credentials). This folder also contains the keys associated with the Verification Methods being published through each DID Document (registered on the IOTA Ledger).
* [claims](./dataset/claims). The claims associated with the different entities involved.
* [credentials](./dataset/credentials/). The credentials that are generated from the claims.
* [templates](./dataset/templates). Templates needed to generate credentials.

#### Claims

Claims are structured into the following sub-folders:

* [participants](./dataset/claims/participants/). The claims associated with Participants (Legal Entity attestation and Terms and Conditions).
* [data-resources](./dataset/claims/data-resources/). Data Resources' claims.
* [service-offerings](./dataset/claims/service-offerings/). Service Offerings' claims.
* [data-space-connectors](./dataset/claims/data-space-connectors). Data Space Connector's claims.

#### Credentials

Credentials are structured into the following sub-folders:

* [evidences](./dataset/credentials/evidences/). The Credentials that are generated (from claims) as evidences for the final Compliance Credentials (the ones that can actually be consumed by the TWIN Catalog). There are folders for each of the evidences needed for each type of entity in the catalog. Participants are in the root folder, though. Evidences are then published on the Web through GH pages, see [docs/public-credentials](./docs/public-credentials/) folder.
* [compliance](./dataset/credentials/compliance). The Compliance Credentials as referred above. These Compliance Credentials are the ones that have to be supplied to the TWIN Catalogue so that the corresponding entities are available ecosystem-wide. 

### Scripts

The scripts are a mix of Javascript and shell script. There are individual scripts and other scripts that orchestrate those.

A pre-requisite is to perform an `npm install` over the [scripts](./scripts) folder. Also it is needed to have Docker installed locally.

To generate a Data Resource, Service Offering or Data Space Connector Compliance credential, the following command needs to be executed:

```sh
node ./calculate-entry-compliance-credential  <entry type> <participant name> <entry name> <entry id>
```

For example if we want to generate a Compliance Credential for the GIW Data Resource that includes Veterinary Certificates:

```sh
node ./calculate-entry-compliance-credential "data-resource" "poland-veterinary-agency" "giw-vet-cert" "https://twin.example.org/data-resources/vet-cert-doc-6ce567"
```

Similarly it can be done with other types of entries.

For Participants the script has to be invoked as follows:

```sh
node ./calculate-entry-compliance-credential "participant" "poland-exporter" 
```

## How to use these materials

The dataset can be used together with the [TWIN Federated Catalogue](https://github.com/twinfoundation/federated-catalogue). The TWIN Catalogue needs to be deployed with Docker or running it through a Node.js / Typescript stack and start registering the different entries. The TWIN Catalogue is also available by deploying a playground which can be an easiest path.

Once you have your instance of the Federated Catalogue deployed you can, for example, register a Participant as follows:

```sh
curl --location 'http://localhost:3020/federated-catalogue/participant-credentials' \
--header 'Content-Type: application/jwt' \
--data 'eyJhbGciOiJFZERTQSIsImlzcyI...'
```

where data will contain the JWT Compliance Credential, for instance the one you can find in this [file](./dataset/credentials/compliance/ffw-compliant-participant.json).

Similarly it can be done with other types of catalogue resources.

Later you can query which Participants are registered in the Federated Catalogue, for instance:

```sh
curl --location 'http://localhost:3020/federated-catalogue/participants'
```

```json
{
    "@context": [
        "https://schema.org",
        "https://w3id.org/gaia-x/development",
        "https://schema.twindev.org/federated-catalogue/"
    ],
    "type": "ItemList",
    "itemListElement": [
        {
            "id": "did:iota:testnet:0xac534b750ac453d573a55954760af140f87358c7be9a18000a831c452c32f246",
            "type": "LegalPerson",
            "dateCreated": "2025-09-15T11:27:40.363Z",
            "legalAddress": {
                "type": "Address",
                "countryCode": "GB"
            },
            "legalName": "Freight Forwarder, Ltd",
            "registrationNumber": {
                "type": "EORI",
                "eori": "GB987654321000"
            },
            "evidence": [
                "https://gtscio.github.io/twin-webinar2-demo/public-credentials/ffw-legal-entity.json",
                "https://gtscio.github.io/twin-webinar2-demo/public-credentials/ffw-terms-and-conditions.json"
            ],
            "issuer": "did:iota:testnet:0xcfff2995cb976c5706c8a0f908c4c9819d575bf85797d1294657dd1a0775899d",
            "validFrom": "2025-09-15T11:14:33Z",
            "validUntil": "2027-12-27T19:14:33Z"
        }
    ]
}
```