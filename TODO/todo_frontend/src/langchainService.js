import { ChatOpenAI } from "langchain/chat_models";
import { HumanMessage } from "langchain/schema";

const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.REACT_APP_OPENAI_API_KEY,
});

export const fetchAISuggestions = async (query) => {
  try {
    const response = await chatModel.call([new HumanMessage(query)]);
    return response.content;
  } catch (error) {
    console.error("LangChain API Error:", error);
    return "Error fetching response";
  }
};
