# Data Space Connector test REST Server for Webinar Sept 2025

A REST server implementation support the Data Space Connector routes.

## Open API

The Open API Spec is [spec.json](./docs/open-api/spec.json)

## Building and running the application

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

## Configuration

There are various options you can set through configuration, these can be found in [docs/configuration.md](docs/configuration.md).

## Changelog

The changes between each version can be found in [docs/changelog.md](docs/changelog.md).
