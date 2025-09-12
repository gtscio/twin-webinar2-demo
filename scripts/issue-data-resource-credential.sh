#!/bin/sh
docker run -it -v "$(pwd)/../dataset:/ext" --rm onboardingcli/onboardingcli vc create \
--claims-file /ext/claims/documents-data-resource.json --template-file /ext/templates/template.json \
--trusted-issuer-file /ext/identities/acme/acme.json --vc-version 2 \
--subject-did "https://my-data-resources.example.org/docs-resource-1" \
--issuers-dir /ext/identities --templates-dir /ext/templates --vc-dir /ext/credentials/evidences \
--valid-for 20000h
