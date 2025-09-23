#!/bin/sh

if [ "$#" -ne 3 ]; then echo "Please provide a participant name, a data space connector name and ID URL"
    exit -1
fi

docker run -i -v "$(pwd)/../dataset:/ext" --rm onboardingcli/onboardingcli vc create \
--claims-file "/ext/claims/data-space-connectors/$2-data-space-connector.json" --template-file /ext/templates/template.json \
--trusted-issuer-file "/ext/identities/$1/$1.json" --vc-version 2 \
--subject-did $3 \
--issuers-dir /ext/identities --templates-dir /ext/templates --vc-dir /ext/credentials/evidences/data-space-connectors \
--valid-for 20000h
