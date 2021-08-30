
# LWC OSS App Using gRPC Server
- Start with `npm install` - to install all dependencies
- Setup your Org Credentials inside a new `.env` file as mentioned below.
- Use the node scripts `npm run build` OR `npm run build:development` to build the `dist` folder for this app and to include SLDS inside your project. 
- Run `npm run watch` or `yarn watch` - to view the app.
- View on your port - by default `http://localhost:3001` for DEV and `http://localhost:5000` for production.

## Set up your Salesforce org credential

- Create a `.env` file with your salesforce org credentials :

```js
    LOGIN_URL=https://CS18.salesforce.com   
    INSTANCE_URL=https://XXXX-dev-ed.cs110.my.salesforce.com   
    CLIENT_KEY=<<YOUR CLIENT KEY>>   
    CLIENT_SECRET=<<YOUR CLIENT SECRET>>   
    REDIRECT_URL=http://localhost:3001/callback   
    USERNAME=<<YOUR USER NAME>>   
    PASSWORD=<<YOUR PASSWORD>>   
    SECURITY_TOKEN=<<YOUR SECURITY TOKEN>>   
```

This will be used to establish the authentication to the Salesforce EventBus.

## Express JS Endpoints configuration
Main configuration is on the `server/main.js` file

- `/api/v1/stream` - using `express-sse` in order to push events to app.
- `/api/v1/subscribe` - will log in to Salesforce and will try to subscribed to channel given from the app. 
- `/api/v1/unsubscribe` - Will logout from Salesforce.
- `/api/v1/publish` - will publish a Platform Event with message given from the app.
- `/api/v1/events/all` - will get all stored events on server.


## gRPC Server configuration
Inside `server/services/salesforce` you'll find all the files that setup this as a micro-service with one interface that can `Subscribe`, `Publish`, `Query` and more.
