#!/bin/sh

#!/bin/sh
if [ "$#" -ne 3 ]; then echo "Please provide a participant name, a data resource name and ID URL"
    exit -1
fi

docker run -it -v "$(pwd)/../dataset:/ext" --rm onboardingcli/onboardingcli vc create \
--claims-file "/ext/claims/data-resources/$2-data-resource.json" --template-file /ext/templates/template.json \
--trusted-issuer-file "/ext/identities/$1/$1.json" --vc-version 2 \
--issuers-dir /ext/identities --templates-dir /ext/templates --vc-dir /ext/credentials/evidences/data-resources \
--subject-did $3 \
--valid-for 20000h
