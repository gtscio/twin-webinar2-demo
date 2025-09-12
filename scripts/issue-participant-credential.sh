#!/bin/sh
docker run -it -v "$(pwd)/../dataset:/ext" --rm onboardingcli/onboardingcli vc create \
--claims-file /ext/claims/piorin-legal-entity-participant.json --template-file /ext/templates/template.json \
--subject-did-file /ext/identities/PIORIN/piorin.json --trusted-issuer-file /ext/identities/notary/notary.json --vc-version 2 \
--issuers-dir /ext/identities --templates-dir /ext/templates --vc-dir /ext/credentials/evidences \
--valid-for 20000h
