const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 5000;
const SERVER_URL = `http://${HOST}:${PORT}`;
const GRPC_PORT = '30044';
// PRODUCTION BUILD
const DIST_DIR = './dist';

const SSE = require('express-sse');
const channel = new SSE();

// gRPC Server and Client
const serverSF = require("./services/salesforce/server");
const clientSF = require("./services/salesforce/client");

const server = serverSF(GRPC_PORT);
const client = clientSF(GRPC_PORT);

const app = express();

app.use(helmet(), compression(), express.json());

// Publish and push server events
app.use("/api/v1/stream", channel.init);
// Connection details
activeOrg = '';
// LOG IN TO SALESFORCE AND SUBSCRIBE
app.post("/api/v1/subscribe", (req, res) => {
    // SUBSCRIBE TO SALESFORCE VIA GRPC CLIENT
    // "/event/PubSubMessage__e" => Platform Event
    // "/data/ChangeEvents" OR "/data/ObjectName__ChangeEvent" => Change Data Capture
    if (!activeOrg) {
        client.ConnectOrg({}, (err, data) => {
            if (err) {
                channel.send(err, 'pberror');
                res.status(500);
                res.send({ data: { errors: [err] } });
            } else {
                console.log('connnected : ' + JSON.stringify(data));
                channel.send(data, 'pblogin');
                activeOrg = data;
                // Subscribe
                subscribeToSalesforce(client, req.query.topic);
                // Respond to client with status
                res.status(200);
                res.send({ data: {...activeOrg } });
            }
        });
    } else {
        // Subscribe
        subscribeToSalesforce(client, req.query.topic);
        res.status(200);
        res.send({ data: {...activeOrg } });
    }

});
// ACTIVATE STREAMING CHANNEL
function subscribeToSalesforce(grpcClient, topic) {
    let callCounter = 0;
    const subscribeCall = grpcClient.Subscribe({
        topicName: topic
    });

    subscribeCall.on("data", recordStream => {
        console.log('response from channel : ' + callCounter);
        // Publish to client subscriber
        channel.send(recordStream, 'pbevent');
        callCounter++;
    });
    subscribeCall.on("end", () => {
        // NEVER CALLED UNLESS AN ERROR
        console.log("closed connection ");
    });
    subscribeCall.on("error", (error) => {
        channel.send(error, 'pberror');
        grpcClient.close();
    });
}
// Logout from Salesforce
app.get("/api/v1/unsubscribe", (req, res) => {
    client.UnSubscribe({}, (err, data) => {
        if (err) {
            channel.send(err, 'pberror');
            res.send({ data: { errors: [err] } });
        } else {
            res.send({ data: data });
        }
    });
});

// Logout from Salesforce
app.post("/api/v1/publish", (req, res) => {

    client.PublishEvent(req.body, (err, data) => {
        if (err) {
            channel.send(err, 'pberror');
            res.send({ data: { errors: err } });
        } else {
            res.send({ data: data });
        }
    });
});


// Get List of all events
app.get("/api/v1/events/all", (req, res) => {
    const call = client.getAllEvents();
    let items = [];
    call.on("data", record => {
        // construct posts from payload
        const { schema, fields, payload, event } = record;
        let recordObj = fields && fields.length ? fields.reduce((obj, field) => { obj[field.key] = field.value; return obj; }, {}) : null;
        items.push({
            from: recordObj.Source__c,
            message: recordObj.Message__c,
            date: payload.CreatedDate,
            uuid: recordObj.UUID__c
        });
    });
    // Close call
    call.on("end", () => {
        res.send({ data: items });
    });

    call.on("error", error => {
        channel.send(error, 'pberror');
        res.send({ data: { errors: [...error] } });
    });
});

// DML
app.get("/api/v1/logs/:method", (req, res) => {
    if (req.params.method === 'GET') {
        let items = [];
        const call = client.getStreamRecords({ pageSize: 100 });
        call.on("data", record => {
            console.log("received record from server " + JSON.stringify(record));
            items.push(record);
        });
        call.on("end", () => {
            // res.end();
            res.send({ data: items });
            console.log("server done!");
        });
    }
});


app.use(express.static(DIST_DIR));
// Use SPA and ignore any url path locations and always serves index
app.use('*', (req, res) => {
    res.sendFile(path.resolve(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => {
    // Activate gRPC server
    server.start();
    console.log(`✅  API Server started: ${SERVER_URL}`)
});