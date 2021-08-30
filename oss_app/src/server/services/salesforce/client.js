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

const clientSF = (port = '30047') => {
    return new SalesforceService(`localhost:${port}`,
        grpc.credentials.createInsecure()
    );
}

module.exports = clientSF;