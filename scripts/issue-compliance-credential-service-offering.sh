#!/bin/sh
if [ "$#" -ne 2 ]; then echo "Please provide a service offeringname and service offering ID URI"
    exit -1
fi

docker run -it -v "$(pwd)/../dataset:/ext" --rm onboardingcli/onboardingcli vc create \
--claims-file "/ext/claims/service-offerings/$1-service-offering-compliant.json" \
--template-file /ext/templates/compliance-credential-template.json \
--subject-did $2 --trusted-issuer-file /ext/identities/clearing-house/clearing-house.json \
--vc-version 2 --issuers-dir /ext/identities --templates-dir /ext/templates --vc-dir /ext/credentials/compliance \
--valid-for 20000h
