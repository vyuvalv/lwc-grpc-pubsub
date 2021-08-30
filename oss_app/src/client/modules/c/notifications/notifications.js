import { LightningElement, api, track } from 'lwc';
import { reduceErrors } from '../commonUtils/commonUtils';

const DEFAULT = {
        title:'Error',
        message:'details',
        type:'error'
}
export default class Notifications extends LightningElement {

    @api errors;

    @api
    get alert() {
        return this._alert;
    }
    set alert(value) {
        this._alert = value;
    }
    @track _alert = DEFAULT;

    rendered = false;
    renderedCallback() {
        if (!this.rendered) {
            this.setTheme();
            this.rendered = true;
        }
    }
    setTheme() {
        const panel = this.template.querySelector('.slds-notify');
        if(panel){
        switch (this.type) {
            case 'success':
                panel.classList.add('slds-theme_success');
                break;
            case 'offline':
                panel.classList.add('slds-alert_offline');
                break;
            case 'warning':
                panel.classList.add('slds-alert_warning');
                break;
            default:
                panel.classList.add('slds-alert_error');
                break;
        }}
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close', {}));
    }

    get type() {
        return this.alert.type;
    }
    get title() {
        return this.alert.title;
    }
    get message() {
        return this.alert.message;
    }
    get messages() {
        return this.errors ? reduceErrors(this.errors) : [];
    }
}
