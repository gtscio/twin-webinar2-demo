# Data Space Connector test REST Server for Webinar Sept 2025

A REST server implementation support the Data Space Connector example application.

## Deploying the DS Connector App

Go to the [Data Space Connector App folder](../data-space-connector-app-blueprint/) and build the package.

## Building and running the test server

To install the dependencies, perform a full build and start the server.

```shell
npm install
npm run dist
npm start
```

## Development mode

Once you have performed a full build you can run the server in development mode, this will watch the TypeScript code, rebuild if there are any changes, and relaunch the server.

```shell
npm run dev
```
