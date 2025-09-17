import { exec } from "node:child_process";
import path from "node:path";
import { readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { json } from "node:stream/consumers";

const args = process.argv.slice(2); // skip "node" and script name

if (args.length < 3) {
    console.error("Error: You must provide at least three arguments.");
    console.error("Usage: node app.js <participant name> <data resource name> <data resource id>");
    process.exit(1); // exit with failure code
}

// Extract the three arguments
const [participantName, dataResourceName, dataResourceId] = args;

const commandLine = `./issue-data-resource-credential.sh ${participantName} ${dataResourceName} ${dataResourceId}`;
exec(commandLine, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error: ${error.message}`);
        return;
    }

    const newPath = renameFile(stderr, participantName + "-" + dataResourceName + "-" + "data-resource" + ".json");

    console.log("Credential created");

    const identityFile = path.resolve(path.join("../dataset/identities", participantName, participantName + ".json"));
    let identityData = readJson(identityFile);
    console.log(identityData.did, identityData.privateKeyJwk.kid);

    const signingCommand = `node ./signCredentialJsonWebSignature "$(cat ${newPath.toString()})" "${identityData.did}#${
        identityData.privateKeyJwk.kid
    }" "$(cat ${identityFile.toString()})"`;
    exec(signingCommand, (error, stdout, stderr) => {
        const credential = stdout;
        const jsonContent = JSON.parse(stdout);
        const id = jsonContent.id;
        const fileName = id.split("/").pop();

        console.log("Writing file", fileName);
        const credentialPath = path.resolve(path.join("../docs/public-credentials", fileName));
        writeFileSync(credentialPath, credential, "utf-8");

        // Now it is needed to calculate the digest
        const digestCommand = `node ./calculateDigest.js "$(cat ${credentialPath})"`;
        exec(digestCommand, (error, stdout, stderr) => {
            const digest = stdout;

            const claimsPath = "../dataset/claims/data-resources";
            const claimsTemplateFile = path.resolve(path.join(claimsPath, "compliant-data-resource-template.json"));
            const claimsTemplate = readJson(claimsTemplateFile);

            claimsTemplate.evidence[0].id = id;
            claimsTemplate.evidence[0].digestSRI = digest;

            writeFileSync(
                path.resolve(path.join(claimsPath, dataResourceName + "-" + "data-resource-compliant.json")),
                JSON.stringify(claimsTemplate, null, 2)
            );

            // And now calling the issuance of a compliance credential
            const complianceCredentialCmd = `./issue-compliance-credential-data-resource.sh ${dataResourceName} ${dataResourceId}`;
            exec(complianceCredentialCmd, (error, stdout, stderr) => {
                renameFile(stderr, dataResourceName + "-" + "compliant-data-resource.json");
            });
        });
    });
});

function renameFile(stderr, newFileName) {
    let result = stderr.trim();
    result = result.substring(0, result.length - 1);

    const index = result.indexOf("/ext/credentials");
    const fullPath = result.substring(index).trim();

    const parts = fullPath.split("/"); 
    const file = parts.pop();

    console.log(parts)

    const base = path.join("../dataset", parts.slice(2).join(path.sep));
    console.log(base);

    let filePath = path.resolve(path.join(base, file));
    // Now we need to rename the file
    const newPath = path.resolve(path.join(base, newFileName));
    rmSync(newPath, { force: true });
    renameSync(filePath, newPath);

    return newPath;
}

function readJson(file) {
    try {
        const data = readFileSync(file, "utf-8");
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading JSON file:", err);
    }
}
