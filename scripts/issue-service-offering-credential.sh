#!/bin/sh
docker run -it -v "$(pwd)/../dataset:/ext" --rm onboardingcli/onboardingcli vc create \
--claims-file /ext/claims/invoice-service-offering.json --template-file /ext/templates/template.json \
--trusted-issuer-file /ext/identities/acme/acme.json --vc-version 2 \
--subject-did "https://service-offerings.example.org/commercial-invoice-1" \
--issuers-dir /ext/identities --templates-dir /ext/templates --vc-dir /ext/credentials/evidences \
--valid-for 20000h
