const express = require("express") //Node.js web application framework
const path = require("path") //provides way of working with directories and file paths
const body_parser = require("body-parser") //parses incoming request bodies in a middleware
const dotenv = require("dotenv") //loads environment variables from .env file
dotenv.config()

const docusign = require("docusign-esign")
const fs = require("fs")
const os = require("os");

const app = express()
app.use(body_parser.urlencoded({extended:true}))
app.use(express.static(__dirname + '/public')) //setting up path for static files like css

//TO STORE ACCESS TOKEN AND EXPIRY DATE
const session = require("express-session")
const { request } = require("http")
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: true,
    saveUninitialized: true
}))

function setEnvValue(key, value) {      //Append to .env
    const ENV_VARS = fs.readFileSync("./.env", "utf8").split(os.EOL);
    const target = ENV_VARS.indexOf(ENV_VARS.find((line) => {
        return line.match(new RegExp(key));
    })); 
    ENV_VARS.splice(target, 1, `${key} = ${value}`);
    fs.writeFileSync("./.env", ENV_VARS.join(os.EOL));

}
 
async function check_token(request){ //CHECK STATUS OF ACCESS TOKEN

    if(request.session.access_token && Date.now()<request.session.expires_at){//REUSE OLD TOKEN
        //console.log("Reuse Access Toke: ", request.session.access_token)
    }
    else{ //GENERATE TOKEN HERE
        console.log("Gen New Token")
        let dsApiClient = new docusign.ApiClient();
        dsApiClient.setBasePath(process.env.BASE_PATH);
        const results = await dsApiClient.requestJWTUserToken(
            process.env.INTEGRATION_KEY, 
            process.env.USER_ID, 
            "signature", 
            fs.readFileSync(path.join(__dirname, "private.key")), 
            3600
            );
        //console.log(results.body)
        request.session.access_token = results.body.access_token;
        request.session.expires_at = Date.now() + (results.body.expires_in - 60) * 1000;
    //Date.now(millisecs) + [expires_in(seconds) - 60(seconds - cause we want to refresh a few mins before it expires) *1000](millisecs)
    }
}

let template_id;
let account_id;

async function get_account_id(request){
    let dsApi = new docusign.ApiClient();
    dsApi.setBasePath(process.env.BASE_PATH);
    const results = await dsApi.getUserInfo(request.session.access_token)
    
    request.session.account_id = results.accounts[0].accountId
    account_id = results.accounts[0].accountId

    setEnvValue("ACCOUNT_ID",results.accounts[0].accountId)
    //console.log(results.accounts[0])

}

function getEnvelopeApi(request){
    /*
    We have already called check_token, so we can assume that the request already 
    has a valid access token embeded in it. 
    */
    let dsApiClient = new docusign.ApiClient();
    dsApiClient.setBasePath(process.env.BASE_PATH);
    dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + request.session.access_token);
    return new docusign.EnvelopesApi(dsApiClient);
}

function makeEnvelope(request, name, email){

    // Create the envelope definition
    let env = new docusign.EnvelopeDefinition();
    env.templateId = process.env.TEMPLATE_ID;
 
    // Create template role elements to connect the signer and cc recipients to the template
    // We're setting the parameters via the object creation
    let signer1 = docusign.TemplateRole.constructFromObject({
        email: email,
        name: name,
        roleName: 'Signer'});

    // Add the TemplateRole objects to the envelope object
    env.templateRoles = [signer1];
    env.status = "sent"; // We want the envelope to be sent
    return env;
}

app.post('/envelopes', async(request, response)=>{
    await check_token(request)  //check is token is generated
    let envelopesApi = getEnvelopeApi(request)
    let envelope = makeEnvelope(request, request.body.name, request.body.email)
    
    let results = await envelopesApi.createEnvelope(
        process.env.ACCOUNT_ID,
        {envelopeDefinition: envelope}
        );

    response.sendFile(path.join(__dirname, "file_send.html"))
})
app.post('/get_template', async(request, response)=>{
    //console.log(request.body.template_id)
    request.session.template_id = request.body.template_id
    template_id = request.body.template_id
    setEnvValue("TEMPLATE_ID",request.body.template_id)
    //console.log(request.session.template_id)
    response.sendFile(path.join(__dirname,"get_envelope.html"))
}) 
 
app.get('/start', async(request, response)=>{
    await check_token(request)
    await get_account_id(request)
    response.sendFile(path.join(__dirname,"get_template.html"))
})

app.get('/', async(request, response)=>{
    response.sendFile(path.join(__dirname,"get_auth.html"))
})

app.listen(8000,()=>{
    console.log("Server Started", process.env.USER_ID)
})

//easier to just take care of it
app.get('/favico.ico', (req, res) => {
    res.sendStatus(404);
});