
# Salesforce App
- Go into the `salesforce_app` folder 

    ## Create a new Scratch org using SFDX CLI
    - `sfdx force:org:create -f config/project-scratch-def.json --durationdays 30 -a <<TargetOrgAlias>>`

    ## Deploy the code into your org. 
    - `sfdx force:source:push -u <<TargetOrgAlias>>`

- You will have a Lightning App Page called `PubSub_Demo` or you can simply drag and drop the component `PubSub Chat Messenger` on any page layout.
- A Platform Event Object named `PubSubMessage__e` will need to be deployed.
- Fields :
    - Message__c
    - Source__c
    - UUID__c

    This will be Setup so we can seperate between inbound to outbound messages

- Generate a Security Token or setup a Connected App to allow login in to this scratch org.

- Setup your authentication credentials
    ## Create a User Password
    - `sfdx force:user:password:generate -u <<TargetOrgAlias>>`
    ## Display User details
    - `sfdx force:user:display -u <<TargetOrgAlias>>`
    ## Genrate and Reset your Security Token
    - Login into your new scratch org 
    - `sfdx force:org:open -u <<TargetOrgAlias>>`
    - Got into `User settings > My Personal Information > Reset Security Token` to get a new security token, this will be sent by email.

    - Copy All those User details into your `.env` file


# Code Snippets Per Request :) 

- Publish Event
```js
const userAlias = 'SF'; // SF / PC Depends on current user 
const messageValue = 'Our message';  

const publishRequest = {
    objectApiName: 'PubSubMessage__e',
    fields: [{
            key: 'Source__c',
            value: userAlias
        },
        {
            key: 'Message__c',
            value: messageValue
        },
        {
            key: 'UUID__c',
            value: createUUID()
        }
    ]
}


```

- Subscribe and Parse Response 
```js
    let items = [];
    // Construct posts from payload
    const { schema, fields, payload, event } = record;
    // Format Platform Event fields
    let record = fields && fields.length ? fields.reduce((obj, field) => { obj[field.key] = field.value; return obj; }, {}) : null;
    items.push({
        from: record.Source__c,
        message: record.Message__c,
        date: payload.CreatedDate,
        uuid: record.UUID__c
    });
```
_____________________


## Read More about SFDX

- [Salesforce Extensions Documentation](https://developer.salesforce.com/tools/vscode/)
- [Salesforce CLI Setup Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm)
- [Salesforce DX Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_intro.htm)
- [Salesforce CLI Command Reference](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference.htm)
