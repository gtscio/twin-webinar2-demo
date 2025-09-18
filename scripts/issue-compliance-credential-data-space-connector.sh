#!/bin/sh
if [ "$#" -ne 2 ]; then echo "Please provide a data space connector name and ID URI"
    exit -1
fi

docker run -i -v "$(pwd)/../dataset:/ext" --rm onboardingcli/onboardingcli vc create \
--claims-file "/ext/claims/data-space-connectors/$1-data-space-connector-compliant.json" \
--template-file /ext/templates/compliance-credential-template.json \
--subject-did $2 --trusted-issuer-file /ext/identities/clearing-house/clearing-house.json \
--vc-version 2 --issuers-dir /ext/identities --templates-dir /ext/templates --vc-dir /ext/credentials/compliance \
--valid-for 20000h
