import { LightningElement, api, track } from 'lwc';

import { subscribe, unsubscribe, onError, setDebugFlag, isEmpEnabled } from 'lightning/empApi';
import publishPlatformEvent from '@salesforce/apex/PubsubController.publishPlatformEvent';
import { reportFormValidity, reduceErrors, createUUID } from 'c/commonUtils';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// DEFAULT ALIAS
const CALL_ORIGIN = 'SF';
const inputError = 'Must write a message ...';

export default class PubsubApp extends LightningElement {
    // Stores the subscription connection
    subscription;

    isOnline = false;
    isOffline = !this.isOnline;

    loading = false;
    typing = false;
    @track errors;

    messageValue = '';
    userAlias = CALL_ORIGIN;

    @track currentUser = {};
    @track _posts = [];

    objectApiName = `PubSubMessage__e`;
    channelName = `/event/${this.objectApiName}`;
    
    channelStartTime;
    channelEndTime;

    // Initializes the component
    connectedCallback() {
         // Register error listener     
        this.registerErrorListener();  
    }

    registerErrorListener() {
        // Invoke onError empApi method
        onError(error => {
            // Error contains the server-side error
            console.log('Received error from server: ', { ...error });
            this.dispatchEvent(new ShowToastEvent({
                title: `Received error from channel ${error.subscription}`,
                message: error.error,
                variant: 'error',
                mode:'sticky'
            }));
        });
    }


    // Tracks changes to channelName text field
    handleChannelName(event) {
        this.channelName = event.target.value;
    }
     // Tracks changes to message text field
     handleMessageChange(event) {
        const input = event.target;
        this.messageValue = input.value;
        if (this.messageValue.length) {
            input.setCustomValidity('');
        }
        else {
            input.setCustomValidity(inputError);
        }
        input.reportValidity();
    }
    // Tracks changes to message text field
    handleAliasChange(event) {
        this.userAlias = event.target.value;
    }

    // Handles subscribe button click
    handleSubscribe() {
        this.loading = true;
         // Callback invoked whenever a new event message is received
         const messageCallback = (response) => {
            let subscribedEvent = { ...response.data, fields:[] };
            if (subscribedEvent.payload) {
                 subscribedEvent.fields = Object.keys(subscribedEvent.payload).map(field => ({
                     key: field,
                     value: subscribedEvent.payload[field]
                }));
            }
            // Response contains the payload of the new message received
            this.addPost(subscribedEvent);
            this.typing = false;
        };
        
        // Invoke subscribe method of empApi. Pass reference to messageCallback
        // Change to -2 to get all captured events
        subscribe(this.channelName, -1, messageCallback).then(response => {
            // Response contains the subscription information on subscribe call
            console.log('Subscribed to stream: ', response.channel);
            this.subscription = response;

            // Register org user connection data
            this.currentUser = {
                id: '1',
                currentUser: { Name : 'Saleseforce' }
            };
            // Stop loader
            this.loading = false;

            // Reset posts
            this._posts = [];

            // Toggle Buttons
            this.toggleSubscribeButton(true);
        });
    }

    // Handles unsubscribe button click
    handleUnsubscribe() {
        // Invoke unsubscribe method of empApi
        unsubscribe(this.subscription, response => {
            // Response is true for successful unsubscribe
            console.log('is Unsubscribed => ' , response.successful );
            this.toggleSubscribeButton(false);
        });
    }

    toggleSubscribeButton(toggle) {
        this.isOnline = toggle;
        this.isOffline = !toggle;

        // Handle Online / Offline Messeges
        const chatter = this.template.querySelector('c-chat-board');
        if (chatter) {
            if (this.isOffline) {
                this.channelEndTime = new Date();
                chatter.toggleOffline(true);
            } else {
                this.channelStartTime = new Date();
                chatter.toggleOffline(false);
            }
        }
    }

    // Publish on Enter keyboard press
    handleEnterPress(event) {
        if(event.keyCode === 13){
            this.sendMessage();
          }
    }
    // Validate Message exists before publish
    sendMessage() {
        const messageInput = this.template.querySelector('.chat-message');
        const valid = reportFormValidity([messageInput], inputError);
        if (valid) {
            this.handlePublish();
        }
    }
   
    
    async handlePublish() {
        this.loading = true;
        this.typing = true;
        try {
            const response = await publishPlatformEvent({
                objectApiName: this.objectApiName,
                fields: [
                    {
                        key: 'Source__c', value: this.userAlias
                    },
                    {
                        key: 'Message__c', value: this.messageValue
                    },
                    {
                        key: 'UUID__c',  value: createUUID()
                    }]
            });
            if (response) {
                this.loading = false;
                console.log('Published Successfully ', response);
            }
        }
        catch (error) {
            this.loading = false;
            this.errors = reduceErrors(error);
            console.log('Failed to publish from app', error.body);
            this.dispatchEvent(new ShowToastEvent({
                title: `Failed to publish from app`,
                message: JSON.stringify( this.errors ),
                variant: 'error',
                mode:'sticky'
            }));
        }
    }

    addPost(response) {
        console.log('Streaming response ', response);
        const { schema, fields, payload, event } = response;
        let record = fields && fields.length ? fields.reduce((obj, field) => { obj[field.key] = field.value; return obj; }, {}) : null;
        if (record) {
            const post = {
                from: record.Source__c,
                message: record.Message__c,
                uuid: record.UUID__c,
                date: payload.CreatedDate
            };
            // Adding the post to list
            this._posts.splice(0, 0, post);
        }
    }

    get posts() {
        return this._posts.map((item, index) => ({
            ...item,
            direction: item.from === this.userAlias ? 'inbound' : 'outbound'
        }));
    }

   
    
}