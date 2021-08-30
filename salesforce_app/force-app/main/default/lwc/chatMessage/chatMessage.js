import { LightningElement, api, track } from 'lwc';

export default class ChatMessage extends LightningElement {
   
    @api userName;
   
    @api
    get post() {
        return this._post;
    }
    set post(value) {
        this._post = value;
    }
    
    @track _post = {
        from: 'UK',
        message: 'hello',
        direction: 'inbound',
        date:''
    };

    get from() {
        return this.post.from;
    }

    get direction() {
        return this.post.direction;
    }

    get message() {
        return this.post.message;
    }

    get origin() {
        const timestamp = new Date(this.post.date).toLocaleString();
        return this.userName ? `${this.userName} • ${timestamp}` : 'unknown';
    }

    get isInbound() {
        return this.direction === 'inbound';
    }

    get isOutbound() {
        return this.direction === 'outbound';
    }

    get chatListClass() {
        return this.direction === 'inbound' ? 'slds-chat-listitem slds-chat-listitem_inbound' : 'slds-chat-listitem slds-chat-listitem_outbound';
    }
    get chatMessageClass() {
        return this.direction === 'inbound' ? 'slds-chat-message__text slds-chat-message__text_inbound' : 'slds-chat-message__text slds-chat-message__text_outbound';
    }

}