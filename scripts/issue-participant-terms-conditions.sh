#!/bin/sh
if [ -z "$1" ]; then
  echo "Please provide participant legal name"
  exit 1
fi

docker run -it -v "$(pwd)/../dataset:/ext" --rm onboardingcli/onboardingcli vc create \
--claims-file "/ext/claims/$1-terms-conditions.json" --template-file /ext/templates/template.json \
--trusted-issuer-file "/ext/identities/$1/$1.json" --vc-version 2 \
--subject-did "https://twinfoundation.github.io/federated-catalogue/public-web/terms-and-conditions.json" \
--issuers-dir /ext/identities --templates-dir /ext/templates --vc-dir /ext/credentials/evidences \
--valid-for 20000h
