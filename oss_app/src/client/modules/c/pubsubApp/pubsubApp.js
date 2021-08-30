import { LightningElement, api, track } from 'lwc';

import { subscribe, publish, unsubscribe, getAll } from '../../data/services/services';
import { reportFormValidity, createUUID } from '../commonUtils/commonUtils';
// DEFAULT ALIAS
const CALL_ORIGIN = 'PC';
const inputError = 'Must write a message ...';
const subscriptionUrl = "/api/v1/stream";

export default class PubsubApp extends LightningElement {
    // Stores the subscription connection
    subscription;

    isOnline = false;
    isOffline = !this.isOnline;

    loading = false;
    typing = false;

    messageValue = '';
    userAlias = CALL_ORIGIN;

    @track currentUser = {};
    @track _posts = [];
    // DEBUG
    @track debugLogs = [];

    objectApiName = `PubSubMessage__e`;
    channelName = `/event/${this.objectApiName}`;

    channelStartTime;
    channelEndTime;

    connectedCallback() {
        // Initializes the channel
        this.initListeners();
    }

    initListeners() {
        // Check if connection is open
        if (this.subscription) {
            this.subscription.onopen = () => {
                // This will be received on each published event
                this.subscription.addEventListener("pbevent", message => {
                    if (message.data) {
                        const response = JSON.parse(message.data);
                        this.debugLogs.push(response);
                        this.addPost(response);
                        this.typing = false;
                    }
                });
                // Register error listener       
                this.subscription.addEventListener("pberror", message => {
                    const errorMessage = JSON.parse(message.data);
                    console.log('pberror ', message.data);
                    this.notifyErrors('Error received from server', errorMessage.details);
                    this.debugLogs.push(message.data);
                });
            };
        }
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
    async handleSubscribe() {
        this.loading = true;
        try {

            const response = await subscribe(this.channelName, {});
            if (response.data) {
            
                const results = response.data;
                // DEBUG
                this.debugLogs.push(results);
                // Stop loader
                this.loading = false;

                if (results.errors) {
                    this.toggleSubscribeButton(false);
                    console.log('Failed to subscribe', results.errors);
                } else {
                    // Response contains the subscription information on subscribe call
                    console.log('Logged in and subscribed to stream... ', results);
                    // Start listening
                    this.subscription = new EventSource(subscriptionUrl);
                    this.initListeners();
                   
                    // Register org user connection data
                    this.currentUser = { ...results };
                    
                    // Reset posts
                    this._posts = [];
                    
                     // Toggle Buttons
                    this.toggleSubscribeButton(true);
                }
            }
        } catch (error) {
            console.log('Failed to call Streaming Api', error);
        }
    }

    // Handles unsubscribe button click
    handleUnsubscribe() {
        // Close connection on client 
        this.subscription.close();
        this.toggleSubscribeButton(false);

        // LOGOUT FROM SALESFORCE
        // const response = await unsubscribe(this.channelName, {});
        // if (response) {
        //     console.log('Unsubscribe response : ', response.data );
        //     this._posts = [];
        //     this.debugLogs.push(response.data);
        //     this.channelEndTime = new Date();
        //     this.toggleSubscribeButton(false);
        // }
    }

    toggleSubscribeButton(toggle) {
        this.isOnline = toggle;
        this.isOffline = !toggle;

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
            const response = await publish({
                objectApiName: this.objectApiName,
                fields: [{
                        key: 'Source__c',
                        value: this.userAlias
                    },
                    {
                        key: 'Message__c',
                        value: this.messageValue
                    },
                    {
                        key: 'UUID__c',
                        value: createUUID()
                    }
                ]
            });
            if (response.data) {
                this.loading = false;
                if (response.data.errors) {
                    console.log('Failed to publish from app ', response.data.errors);
                } else {
                    console.log('Published Successfully ', response.data);
                }
            }
        } catch (error) {
            console.log('Failed to publish from app catch ', error);
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

    // GET ALL STORED EVENTS
    async handleRefresh() {
        this.loading = true;

        try {
            const response = await getAll();
            if (response) {
                console.log('Got all events... ', response.data);
                this._posts = [...response.data].reverse();

                this.loading = false;
            }
        } catch (error) {
            console.log('Error on get all events ', error);
        }
    }

    get posts() {
        return this._posts.map((item, index) => ({
            ...item,
            direction: item.from === this.userAlias ? 'inbound' : 'outbound'
        }));
    }

    @api
    get logger() {
        return JSON.stringify(this.debugLogs, null, ' ');
    }

    notifyErrors(title, message, type = 'error', sticky = false) {
        this.dispatchEvent(new CustomEvent('error', { detail: { title, message, type, sticky, errors: null } }));
    }




}