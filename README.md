# OAuth-DocuSign
_under edit_  
[Jump to Demo]()

## Objective
Create a web application that integrates OAuth with DocuSign to enable the user to perform the below actions:
- Get template details
- Create and send an envelope to recipients email using a template

## Procedure

### Setting up DocuSign Account
- A DocuSign developer account is created.
- Upon Logging-In, under the “My Apps & Keys” section, a new App is created.
- This app, titled “PG-App-T1” will be our main application.
- In an .env file, save the Integration Key
- Generate RSA Keypair and save the public and private keys in a secure location as they are only showed once.
- In the redirect URIs section, whitelist the URI that will be used for this project. In our case this is ‘localhost:8000/start’

### Local Setup
- Initially, the below files are created: 
  - get_auth.html
      - This is the landing page and will allow user to authorize.
      - Upon authorization user will be redirected to the functionalities webpage. 
   -  index.js
   - public/css/style.css 
   - get_template.html
      - Allows user to input the template id they wish to send 
    - get_envelope.html
      - Allows user to input the name and email of the recipient 
    - file_send.html
      - Shows success message after envelop is sent.
      - Also, allow user to go back to change template and recipient information
 
- Download the required dependencies and set up the package.json file, adding in “server”: “nodemon index.js” in the scripts sections.
- Settup server on port 8000

- _more to be added_


## Demonstration
https://github.com/yusha-g/OAuth-DocuSign/assets/110189579/b256424e-8e19-4021-b151-91aa264fb77d

