import { LightningElement, api, track } from 'lwc';

const menuTabs = ['home', 'debug'];
const LOGO = './resources/lwc.png';

export default class App extends LightningElement {
    @api
    get pathName() {
        // validate path with existing tabs
        return menuTabs.includes(this._pathName) ? this._pathName : menuTabs[0];
    }
    set pathName(value) {
        this._pathName = `${value}`;
    }

    _pathName = 'home';
    logoImage = LOGO;

    @track alert = {};
    showAlert = false;
    @track logger = 'Nothing to show yet';
    @track errors;

    connectedCallback() {

    }

    // Change Tab and Browser path
    handleActiveTab(event) {
        event.preventDefault();
        const activeTab = event.target.value;

        // Handle Debugger
        if (this.pathName === 'home') {
            try {
                const chatter = this.template.querySelector('c-pubsub-app');
                if (chatter) {
                    this.logger = chatter.logger;
                }
            } catch (error) {
                console.log('unable to init logger');
            }
        }
        this.navigate(activeTab);
    }

    // handle messages from child components
    handleNotifications(event) {
        const { title, message, type, sticky, errors } = event.detail;
        if (errors) { this.errors = errors; }
        this.showAlertPanel(title, message, type, sticky);
    }

    hideAlert() {
        this.showAlert = false;
    }

    showAlertPanel(title = 'Error', message = 'Something went wrong...', type = 'error', sticky = false) {
        this.alert = {
            title,
            message,
            type
        };
        this.showAlert = true;
        // hides alert automatically
        if (sticky) {
            window.setTimeout(() => { this.hideAlert() }, 3000);
        }
    }

    errorCallback(error, stack) {
        this.errors = error;
        this.showAlertPanel('Errors in child components', stack, 'error');
    }

    // Browser navigation
    navigate(pageName = 'home') {
        this._pathName = pageName;
        // add page to browser history
        window.history.pushState({ page: this._pathName },
            null,
            '#'.concat(this._pathName)
        );
        // set page title
        document.title = this._pathName;
    }

}