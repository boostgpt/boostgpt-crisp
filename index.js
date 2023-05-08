const { BoostGPT } = require("boostgpt")
const dotenv  = require('dotenv')
dotenv.config()
var Crisp = require("crisp-api");
var CrispClient = new Crisp();

// Authenticate to API with your plugin token (identifier, key)

let identifier = process.env.CRISP_PLUGIN_IDENTIFIER;
let key =  process.env.CRISP_PLUGIN_KEY;

CrispClient.authenticateTier("plugin", identifier, key);


const boostgpt = new BoostGPT({
    key: process.env.BOOSTGPT_API_KEY,
    project_id: process.env.BOOSTGPT_PROJECT_ID
});


// Notice: make sure to authenticate before listening for an event
CrispClient.on("message:send", async function(message) {
    
    if (message.content && message.origin == 'chat') {

        let payload = {
            bot_id: process.env.BOOSTGPT_BOT_ID,//The collection to chat
            openai_key: process.env.OPENAI_API_KEY,
            model: process.env.BOOSTGPT_BOT_MODEL, //The model to use for the chat response. Defaults to the bot model.
            message: message.content, //The chat message
            source_ids: process.env.BOOSTGPT_BOT_SOURCE_IDS, //The training source id's you want the AI's knowledge to be limited to.
            tags: process.env.BOOSTGPT_BOT_TAGS, //Use tags to get the segment of the training data you want the AI's knowledge to be limited to.
            top: process.env.BOOSTGPT_BOT_TOP, //Optional. The weight of training data used to form a context. Defaults to 10. Recommended settings between : 10 - 15 give better response from the AI.
        }

        let error_message = `Hi there! ${process.env.ERROR_MESSAGE}`;

        let chatbot = await boostgpt.chat(payload);

        if (chatbot.err) {
           //Handle boostgpt errors here.
            await sendMessage(message,error_message);
        }else{
            if (chatbot.response.chat) {
                await sendMessage(message,chatbot.response.chat.reply);
            }
        }
    }

})
.then(function() {
    console.error("Requested to listen to sent messages");
})
.catch(function(error) {
    console.error("Failed listening to sent messages:", error);
});


const sendMessage = async (message,reply) => {
    let isOnline = await CrispClient.website.getWebsiteAvailabilityStatus(message.website_id);

    if (isOnline.status != 'online') {

        return CrispClient.website.sendMessageInConversation(
            message.website_id, message.session_id,
            {
              type    : "text",
              content :  reply,
              from    : "operator", // or user
              origin  : "chat"
            }
        )
        .then(function(message) {
          console.log("Message sent:", message);
        })
        .catch(function(error) {
          console.error("Error sending message:", error);
        });
    }
}

