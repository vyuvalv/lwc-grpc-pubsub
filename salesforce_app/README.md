
# Salesforce App
- Go into the `salesforce_app` folder 

    ## Create a new Scratch org using SFDX CLI
    - `sfdx force:org:create -f config/project-scratch-def.json --durationdays 30 -a <<TargetOrgAlias>>`

    ## Deploy the code into your org. 
    - `sfdx force:source:push -u <<TargetOrgAlias>>`

- You will have a Lightning App Page that will display our main component `pubsubApp` but this could be dragged and dropped to any other lightning page layout inside your org.

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

_____________________


## Read More about SFDX

- [Salesforce Extensions Documentation](https://developer.salesforce.com/tools/vscode/)
- [Salesforce CLI Setup Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm)
- [Salesforce DX Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_intro.htm)
- [Salesforce CLI Command Reference](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference.htm)
