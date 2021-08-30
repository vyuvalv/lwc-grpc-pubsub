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

// CONNECT TO SALESFORCE
const jsforce = require('jsforce');
require('dotenv').config();

// ORG CREDENTIALS
const { LOGIN_URL, INSTANCE_URL, USERNAME, PASSWORD, SECURITY_TOKEN } = process.env;
// CONNECTED APP
// const { LOGIN_URL, INSTANCE_URL, CLIENT_KEY, CLIENT_SECRET, REDIRECT_URL } = process.env;

// Setup for Connected App in Salesforce
let connection = new jsforce.Connection({
    loginUrl: LOGIN_URL,
    instanceUrl: INSTANCE_URL,
    // oauth2: {
    //     // you can change loginUrl to connect to sandbox or prerelease env.
    //     loginUrl : 'https://test.salesforce.com',
    //     clientId: CLIENT_KEY,
    //     clientSecret: CLIENT_SECRET,
    //     redirectUri: REDIRECT_URL
    // }
});

// log events in memory
let posts = [];
// Check if event is Included in list or not
function isIncluded(post) {
    if (posts.length) {
        const postId = post.payload.UUID__c;
        // Filter to unique posts
        const currentIds = posts.map(item => item.payload.UUID__c);
        return currentIds.includes(postId);
    }
    return false;
}

// Connect and Get Current User
async function ConnectOrg(call, callback) {
    // const { username, password, securityToken, instanceUrl } = call.request;
    console.log(`Trying to log in as : ${USERNAME}`);
    // Reset posts
    posts = [];
    // Direct login to salesforce
    await connection.login(USERNAME, PASSWORD + SECURITY_TOKEN, (err, userInfo) => {
        if (err) {
            console.log(`Unable to login, ${err.name} : ${err.message}`);
            return callback({
                code: grpc.status.UNAUTHENTICATED,
                message: `Unable to login, ${err.name} : ${err.message}`,
            });
        }
        // Start build Auth response
        let response = {...userInfo }
        const userId = userInfo.id;
        try {
            connection.sobject('User').retrieve(userId, (error, result) => {
                if (error) {
                    console.log(`Failed to retreive User record => ${err.name}:${err.message}`, JSON.stringify(err.stack));
                    return callback({
                        code: grpc.status.INVALID_ARGUMENT,
                        message: `Failed to retreive User record => ${err.name}:${err.message}`,
                    });
                }
                // console.log('result user ' + JSON.stringify(result));
                response.currentUser = {...result };
                // Return response object
                return callback(null, response);
            });
        } catch (error) {
            throw error;
        }

    });
}

// Connect and Subscribe to Events
async function Subscribe(call) {
    // const channelName = `/event/PubSubMessage__e`;
    if (!connection.accessToken) {
        call.write({
            code: grpc.status.UNAUTHENTICATED,
            message: `No Connection to Salesforce`,
        });
        call.end();
    }
    // SUBSCRIBE TO CHANNEL
    try {
        await connection.streaming.topic(call.request.topicName).subscribe((response) => {
            console.log('grpc subscription response :', JSON.stringify(response));

            let subscribedEvent = response;
            // Format payload fields to key, value pairs
            if (subscribedEvent.payload) {
                subscribedEvent.fields = Object.keys(subscribedEvent.payload).map(field => ({
                    key: field,
                    value: response.payload[field]
                }));
            }
            // build response
            const subscribeResponse = {...subscribedEvent };
            // Check if this event has already been included in memory
            if (!isIncluded(subscribeResponse)) {
                // add to memory list make unique
                posts.push(subscribeResponse);
                // Send to client
                call.write(subscribeResponse);
            }

        });

    } catch (error) {
        call.write({
            code: grpc.status.UNAUTHENTICATED,
            message: `Failed to Subscribe to Salesforce Event => ${error.name}:${error.message}`,
        });
        // Will Close the streaming
        call.end();
    }

    // In case needed to call all stored events
    // const replayId = -2; // -2 is all retained events** -1
    // const replayExt = new jsforce.StreamingExtension.Replay(call.request.topicName, replayId);
    // const fayeClient = connection.streaming.createClient([replayExt]);
    // if (err) { return console.log(err); }
    // console.log("Connected");

    // fayeClient.subscribe(call.request.topicName, data => {
    //     console.log('grpc server response ' + JSON.stringify(data));
    //     call.write(data);
    // }); 
}

// LOGOUT From Salesforce
async function UnSubscribe(call, callback) {
    try {
        connection.logout(function(err) {
            if (err) {
                console.error(err);
                callback({
                    code: grpc.status.UNAUTHENTICATED,
                    message: `Failed to logout => ${err.name}:${err.message}`,
                });
            }
            // now the session has been expired.
            return callback(null, { success: true, message: 'grpc logout from salesforce' });
        });
    } catch (error) {
        return callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: `Something went wrong in UnSubscribe method => ${error.message}`,
        });
    }

}

// Create Record
async function PublishEvent(call, callback) {
    if (!connection.accessToken) {
        return callback({
            code: grpc.status.UNAUTHENTICATED,
            message: `No Connection to JSForce`,
        });
    }

    const { objectApiName, fields } = call.request;
    try {
        // Convert fields array to record object fields
        let record = fields.length ? fields.reduce((obj, field) => { obj[field.key] = field.value; return obj; }, {}) : {};

        await connection.sobject(objectApiName).create(record, function(err, ret) {
            if (err || !ret.success) {
                console.error(`Failed to publish/create record.. ${err.name} : ${err.message}`);
                callback({
                    code: grpc.status.UNAUTHENTICATED,
                    message: `Failed to publish/create record.. ${err.name}:${err.message}`,
                });
            } else {
                // SUCCESS
                console.log("Created record id : " + JSON.stringify(ret));
                callback(null, ret);
            }
        });

    } catch (error) {
        callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: `Failed to publish event.. ${error.message}`,
        });
    }
}

// Fetch events Stored on gRPC Server
async function getAllEvents(call, callback) {
    if (posts.length) {
        // Filter to unique posts
        const uniqueIds = posts.map(item => item.payload.UUID__c).filter((item, ind, arr) => arr.indexOf(item) === ind);
        const filtered = posts.filter(item => uniqueIds.includes(item.payload.UUID__c));

        filtered.forEach(post => {
            call.write(post);
        });
    }
    call.end();
}

// Connected Services running
function serverSF(port = '30047') {
    const server = new grpc.Server();
    const GRPC_PORT = `127.0.0.1:${port}`;
    server.addService(protoPackage.SalesforceService.service, {
        "ConnectOrg": ConnectOrg,
        "getAllEvents": getAllEvents,
        "PublishEvent": PublishEvent,
        "Subscribe": Subscribe,
        "UnSubscribe": UnSubscribe
    });
    server.bind(GRPC_PORT, grpc.ServerCredentials.createInsecure());
    console.log(`🔥 GRPC Server is running at http://${GRPC_PORT}`);
    // server.start();
    return server;
}

module.exports = serverSF;