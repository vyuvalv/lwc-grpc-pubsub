
# LWC OSS App Using gRPC Server
- Start with `npm install` - to install all dependencies

    * Breakdown of the dependencies installed below :
    * run `npm i` - `npm install` 
        * `grpc` - main library for grpc
        * `@grpc/proto-loader` - handle protobuffers
        * `express-sse` - for server sent events push to client app
        * `jsforce` - Connection to Salesforce
        * `dotenv`- Storing parameters used for the connection to Salesforce Connected App option

## Set up your Salesforce org credential
- Setup your Org Credentials inside a new `.env` file as mentioned below.
- Create a `.env` file with your salesforce org credentials :

```js
    USERNAME=<<YOUR USER NAME>>   
    PASSWORD=<<YOUR PASSWORD>>   
    SECURITY_TOKEN=<<YOUR SECURITY TOKEN>>   
    LOGIN_URL=https://CS18.salesforce.com   
    INSTANCE_URL=https://XXXX-dev-ed.cs110.my.salesforce.com   
    CLIENT_KEY=<<YOUR CLIENT KEY>>   
    CLIENT_SECRET=<<YOUR CLIENT SECRET>>   
    REDIRECT_URL=http://localhost:3001/callback   
```


- Use the node scripts `npm run build` OR `npm run build:development` to build the `dist` folder for this app and to include SLDS inside your project. 
- Run `npm run watch` or `yarn watch` - to view the app.
- View on your port - by default `http://localhost:3001` for DEV and `http://localhost:5000` for production.


## Express JS Endpoints configuration
Main configuration is on the `server/main.js` file

- `/api/v1/stream` - using `express-sse` in order to push events to app.
- `/api/v1/subscribe` - will log in to Salesforce and will try to subscribed to channel given from the app. 
- `/api/v1/unsubscribe` - Will logout from Salesforce.
- `/api/v1/publish` - will publish a Platform Event with message given from the app.
- `/api/v1/events/all` - will get all stored events on server.


## gRPC Proto Schema definition
- Inside `server/services/salesforce` - you'll find all the files that setup this as a micro-service.
- `salesforce.proto` -  One interface that can `Subscribe`, `Publish` and more...
- `server.js` - our gRPC server - that will encode and decode our payloads. 
- `client.js` - our gRPC client that communicate between our Express server to our gRPC Server.


```proto
syntax = "proto3";

service SalesforceService {
    // Salesforce API Operations
    rpc ConnectOrg (ConnectRequest) returns (ConnectedOrg) {}
    rpc Subscribe (SubscribeRequest) returns (stream SubscribeResponse) {}
    rpc UnSubscribe (Empty) returns (SubscribeResponse) {}
    rpc PublishEvent (PublishRequest) returns (PublishResponse) {}
    rpc getAllEvents (Empty) returns (stream SubscribeResponse) {}
}

```

- Each Request and response has a Schema defition strongly typed using protobuffer. 
- Example Request payload for connecting to salesforce

    ```proto
    message ConnectRequest {
        string username = 1;
        string password = 2;
        string securityToken = 3;
        string instanceUrl = 4;
        string accessToken = 5;
    }
    ```


## Start our gRPC server
```js
const PROTO_PATH = __dirname + "/salesforce.proto";

const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
});

const protoPackage = grpc.loadPackageDefinition(packageDefinition);

// Connected Services running
const server = new grpc.Server();
const GRPC_PORT = `127.0.0.1:30047`;
server.addService(protoPackage.SalesforceService.service, {
    "ConnectOrg": ConnectOrg,
    "getAllEvents": getAllEvents,
    "PublishEvent": PublishEvent,
    "Subscribe": Subscribe,
    "UnSubscribe": UnSubscribe
});
server.bind(GRPC_PORT, grpc.ServerCredentials.createInsecure());
console.log(`🔥 GRPC Server is running at http://${GRPC_PORT}`);

server.start();

```

## Start our gRPC client

```js
const PROTO_PATH =  __dirname + "/salesforce.proto";

const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: false,
    longs: String,
    enums: String,
    arrays: true
});

const SalesforceService = grpc.loadPackageDefinition(packageDefinition).SalesforceService;

const clientSF =  new SalesforceService(`localhost:30047`,
        grpc.credentials.createInsecure()
    );

module.exports = clientSF;
```