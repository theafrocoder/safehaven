require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const port = process.env.BACKEND_PORT || 5000;
console.log("__dirname:", __dirname);        // Directory of the current file
console.log("process.cwd():", process.cwd()); // Current working directory when the script was launched
// IBM Watson Services
const IBMWatson = require('ibm-watson');
const { IamAuthenticator } = IBMWatson.auth;

// Configure IBM Cloud IAM
const authenticator = new IamAuthenticator({
  apikey: process.env.IBMCLOUD_API_KEY,
});

// Configure Watson Discovery
const discovery = new IBMWatson.DiscoveryV2({
  version: '2020-08-01', // Use the appropriate API version
  authenticator: authenticator,
  url: process.env.WATSON_DISCOVERY_URL,
});

// Configure Watson Language Translator
const languageTranslator = new IBMWatson.LanguageTranslatorV3({
  version: '2018-05-01', // Use the appropriate API version
  authenticator: authenticator,
  url: process.env.WATSON_LANGUAGE_TRANSLATOR_URL,
});

// Configure Watsonx.ai
const watsonxAiUrl = process.env.WATSON_ASSISTANT_URL; // Using the ASSISTANT_URL for watsonx.ai endpoint
const watsonxAiProjectId = process.env.WATSON_ASSISTANT_ID; // Using the ASSISTANT_ID for watsonx.ai project ID

app.use(cors());
app.use(express.json());

const sessions = {};

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(apiLimiter);

app.get('/', (req, res) => {
  res.send('SafeHaven Backend is running!');
});

app.get('/session', (req, res) => {
    const sessionId = uuidv4();
    sessions[sessionId] = { history: [], language: 'en' };
    console.log(`New session created: ${sessionId}`);
    res.json({ sessionId: sessionId });
});

// Function to build the prompt for watsonx.ai
function buildWatsonxAiPrompt(query, context, sessionHistory) {
    let prompt = "";

    // Add conversation history to the prompt for context
    if (sessionHistory.length > 0) {
        prompt += "Conversation History\n";
        // Include recent history, excluding the current turn which is implicitly in the query
        sessionHistory.slice(-6, -1).forEach(item => {
            prompt += `${item.sender}: ${item.text}
`;
        });
        prompt += "\n";
    }

    // Add retrieved context to the prompt
    if (context) {
        prompt += "Relevant Information:\n";
        prompt += context;
        prompt += "\n";
    }

    // Add the current user query
    prompt += `User: ${query}
`;
    prompt += "AI: "; // Prompt the AI to respond

    // Add instructions for the AI
    prompt += "Instructions: Based on the conversation history and relevant information provided, please answer the user's question. If the information is not available, state that you cannot answer based on the provided documents.";

    return prompt;
}

// Function to call watsonx.ai for text generation
async function getWatsonxAIGeneration(query, context, sessionHistory) {
    console.log('Calling watsonx.ai for text generation...');

    const prompt = buildWatsonxAiPrompt(query, context, sessionHistory);
    console.log('Watsonx.ai Prompt:\n', prompt);

    if (!process.env.IBMCLOUD_API_KEY || !watsonxAiUrl || !watsonxAiProjectId) {
        console.error('Watsonx.ai configuration missing.');
        return 'Backend configuration error: Watsonx.ai not configured.';
    }

    try {
        const response = await axios.post(
            `${watsonxAiUrl}/v1/predictions`,
            {
                input: {
                    prompt: prompt
                },
                parameters: { // Example parameters, adjust as needed
                    decoding_method: "greedy", // or "sample"
                    max_new_tokens: 200,
                    min_new_tokens: 10,
                    // temperature: 0.7, // if using sampling
                    // top_k: 50,
                    // top_p: 1,
                },
                model_id: 'YOUR_WATSONX_MODEL_ID', // TODO: Replace with your actual watsonx.ai model ID
                project_id: watsonxAiProjectId,
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.IBMCLOUD_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (response.data && response.data.results && response.data.results[0] && response.data.results[0].generated_text) {
             return response.data.results[0].generated_text;
        } else {
             console.error('Unexpected response format from watsonx.ai:', response.data);
             return 'Error generating response from AI: Unexpected response format.';
        }

    } catch (error) {
        console.error('Error calling watsonx.ai:', error.response ? error.response.data : error.message);
        return 'Error generating response from AI.';
    }
}

// Emergency Assistance Endpoint
app.post('/emergency', async (req, res) => {
    const { sessionId, language } = req.body;
    console.log(`Emergency assistance requested for session ${sessionId} in language ${language}`);

    if (!sessions[sessionId]) {
        return res.status(400).json({ reply: 'Invalid session ID.' });
    }

    const session = sessions[sessionId];
    const userMessage = "Emergency assistance needed.";
    session.history.push({ sender: 'user', text: userMessage });
    if (language) {
        session.language = language;
    }

    try {
        // TODO: Implement logic to retrieve and provide emergency contacts/information from Discovery or other source
        const emergencyResponseEnglish = "Please contact the nearest emergency services or a local NGO for immediate assistance. You can find a list of resources here: [Link to Emergency Resources]";

        let finalEmergencyResponse = emergencyResponseEnglish;
        const targetLanguage = language || session.language || 'en';

        if (targetLanguage !== 'en' && emergencyResponseEnglish) {
          const translateBackResponse = await languageTranslator.translate({
            text: emergencyResponseEnglish,
            source: 'en',
            target: targetLanguage,
          });
          finalEmergencyResponse = translateBackResponse.result.translations[0].translation;
          console.log(`Translated emergency response back to ${targetLanguage}:`, finalEmergencyResponse);
        }

        session.history.push({ sender: 'bot', text: finalEmergencyResponse });

        res.json({ reply: finalEmergencyResponse });
    } catch (error) {
        console.error('Error providing emergency assistance:', error);
        const errorMessage = 'Error processing your request.';
         session.history.push({ sender: 'bot', text: errorMessage });
        res.status(500).json({ reply: errorMessage });
    }
});

app.post('/chat', async (req, res) => {
  const { sessionId, message, language } = req.body;
  console.log(`Received message for session ${sessionId} in language ${language}:`, message);

  if (!sessions[sessionId]) {
      return res.status(400).json({ reply: 'Invalid session ID.' });
  }

  const userMessage = message;
  const session = sessions[sessionId];
  session.history.push({ sender: 'user', text: userMessage });

  if (language) {
      session.language = language;
  }

  try {
    const userLanguage = language || (await languageTranslator.identify({
      text: userMessage,
    })).result.languages[0].language;
    console.log('Using language for translation:', userLanguage);

    let translatedMessage = userMessage;
    if (userLanguage !== 'en') {
      const translateResponse = await languageTranslator.translate({
        text: userMessage,
        source: userLanguage,
        target: 'en',
      });
      translatedMessage = translateResponse.result.translations[0].translation;
      console.log('Translated message to English:', translatedMessage);
    }

    const discoveryResults = await discovery.query({
      environmentId: process.env.WATSON_DISCOVERY_ENVIRONMENT_ID,
      collectionId: process.env.WATSON_DISCOVERY_COLLECTION_ID,
      naturalLanguageQuery: translatedMessage,
      count: 5,
    });

    const documents = discoveryResults.result.results;

    const retrievedContext = documents.map(doc => doc.document_gronding || doc.extracted_metadata?.text).filter(Boolean).join('\n');

    const botResponseEnglish = await getWatsonxAIGeneration(translatedMessage, retrievedContext, session.history);

    let finalBotResponse = botResponseEnglish;
    if (userLanguage !== 'en' && botResponseEnglish) {
      const translateBackResponse = await languageTranslator.translate({
        text: botResponseEnglish,
        source: 'en',
        target: userLanguage,
      });
      finalBotResponse = translateBackResponse.result.translations[0].translation;
      console.log(`Translated response back to ${userLanguage}:`, finalBotResponse);
    }

    session.history.push({ sender: 'bot', text: finalBotResponse });

    res.json({ reply: finalBotResponse });

  } catch (error) {
    console.error('Error processing chat message:', error);
    const errorMessage = 'Error processing your request.';
     session.history.push({ sender: 'bot', text: errorMessage });
    res.status(500).json({ reply: errorMessage });
  }
});

app.listen(port, () => {
  console.log(`SafeHaven Backend listening on port ${port}`);
});