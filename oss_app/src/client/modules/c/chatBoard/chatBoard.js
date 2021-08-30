import { LightningElement, api, track } from 'lwc';

export default class ChatBoard extends LightningElement {
    @api active = false;

    @api startTime;
    @api endTime;

    @track _user;
    @track _posts = [];
    _offline = false;

    @api
    get typing() {
        return this._typing;
    }
    set typing(value) {
        this._typing = value;
    }
    _typing = false;

    @api
    get user() {
        return this._user;
    }
    set user(value) {
        this._user = value;
    }


    set user(value) {
        this._user = value;
    }

    @api
    get posts() {
        return this._posts;
    }
    set posts(value) {
        this._posts = value;
    }


    loading = false;
    @track errors = [];

    connectedCallback() {

    }

    handleRefresh() {
        this.dispatchEvent(new CustomEvent('refresh', { detail: true }));
    }


    get userName() {
        return this.user && this.user.currentUser ? this.user.currentUser.Name : 'Yuval';
    }

    get isOnline() {
        return this.active;
    }
    get isOffline() {
        return this._offline;
    }

    get startMessage() {
        const timestamp = this.startTime ? this.startTime.toTimeString() : '';
        return this.isOnline || this.isOffline ? `Chat started by ${this.userName} • ${timestamp}` : false;
    }

    get endMessage() {
        const timestamp = this.endTime ? this.endTime.toTimeString() : '';
        return this.isOffline ? `Chat ended by ${this.userName} • ${timestamp}` : false;
    }

    @api
    toggleOffline(toggle) {
        this._offline = toggle;
    }




}