import { OpenAI } from "langchain/llms/openai";
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";


const openai = new OpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7,
});
console.log("API Key:", process.env.OPENAI_API_KEY ? "Loaded" : "Not Found");


const template = `
You are an AI assistant helping users prioritize tasks. 
Given a list of tasks with deadlines and types, rank them based on priority.
Return JSON format: [{ "task": "...", "priority": "...", "reason": "..." }]
Tasks: {tasks}
`;

const prompt = new PromptTemplate({
  template,
  inputVariables: ["tasks"],
});

const chain = new LLMChain({ llm: openai, prompt });

export const getTaskPriorities = async (tasks) => {
  try {
    const response = await chain.run({ tasks: JSON.stringify(tasks) });
    console.log("AI Response:", response); // Debugging line

    const jsonResponse = JSON.parse(response);
    return jsonResponse;
  } catch (error) {
    console.error("Error in AI Task Prioritization:", error);
    return [];
  }
};

