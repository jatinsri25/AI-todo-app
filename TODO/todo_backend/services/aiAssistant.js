const { OpenAI } = require('langchain/llms/openai');
const { LLMChain } = require('langchain/chains');
const { PromptTemplate } = require('langchain/prompts');

const priorityTemplate = new PromptTemplate({
  inputVariables: ["tasks"],
  template: `Analyze these tasks and prioritize them:
  {tasks}
  Return JSON format: { id: string, priority: number (1-10), reason: string }[]`
});

exports.getAIPriorities = async (tasks) => {
  const model = new OpenAI({ temperature: 0.5 });
  const chain = new LLMChain({ llm: model, prompt: priorityTemplate });
  const { text } = await chain.call({ tasks: JSON.stringify(tasks) });
  return JSON.parse(text);
};