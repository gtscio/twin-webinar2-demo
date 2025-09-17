#!/bin/sh
if [ "$#" -ne 2 ]; then echo "Please provide a data resource name and data resource ID URI"
    exit -1
fi

docker run -i -v "$(pwd)/../dataset:/ext" --rm onboardingcli/onboardingcli vc create \
--claims-file "/ext/claims/data-resources/$1-data-resource-compliant.json" \
--template-file /ext/templates/compliance-credential-template.json \
--subject-did $2 --trusted-issuer-file /ext/identities/clearing-house/clearing-house.json \
--vc-version 2 --issuers-dir /ext/identities --templates-dir /ext/templates --vc-dir /ext/credentials/compliance \
--valid-for 20000h
