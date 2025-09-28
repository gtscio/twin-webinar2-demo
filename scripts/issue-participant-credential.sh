#!/bin/sh

if [ -z "$1" ]; then
  echo "Please provide participant legal name"
  exit 1
fi

docker run -i -v "$(pwd)/../dataset:/ext" --rm onboardingcli/onboardingcli vc create \
--claims-file "/ext/claims/participants/$1-legal-entity-participant.json" --template-file /ext/templates/template.json \
--subject-did-file "/ext/identities/$1/$1.json" --trusted-issuer-file /ext/identities/notary/notary.json --vc-version 2 \
--issuers-dir /ext/identities --templates-dir /ext/templates --vc-dir /ext/credentials/evidences \
--valid-for 20000h
