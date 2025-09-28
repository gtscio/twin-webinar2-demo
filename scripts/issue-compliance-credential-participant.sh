#!/bin/sh
if [ "$#" -lt 1 ]; then echo "Please provide a participant name"
    exit -1
fi

docker run -i -v "$(pwd)/../dataset:/ext" --rm onboardingcli/onboardingcli vc create \
--claims-file "/ext/claims/participants/compliance/$1-participant-compliant.json" --template-file /ext/templates/compliance-credential-template.json \
--subject-did-file "/ext/identities/$1/$1.json" --trusted-issuer-file /ext/identities/clearing-house/clearing-house.json \
--vc-version 2 --issuers-dir /ext/identities --templates-dir /ext/templates --vc-dir /ext/credentials/compliance \
--valid-for 20000h
