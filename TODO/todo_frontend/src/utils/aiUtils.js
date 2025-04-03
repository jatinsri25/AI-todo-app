import { Configuration, OpenAIApi } from "openai";

const openai = new OpenAIApi(
    new Configuration({ apiKey: process.env.REACT_APP_OPENAI_API_KEY })
);

export const getAISuggestions = async (todos) => {
    try {
        const response = await openai.createChatCompletion({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are an AI assistant helping users organize their tasks efficiently.",
                },
                {
                    role: "user",
                    content: `Analyze the following tasks and suggest priorities and deadlines:\n${JSON.stringify(todos)}`,
                },
            ],
        });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("AI suggestion error:", error);
        return [];
    }
};

export const getMotivationalTip = async () => {
    try {
        const response = await openai.createChatCompletion({
            model: "gpt-4",
            messages: [{ role: "user", content: "Give me a motivational tip about productivity." }],
        });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Motivational tip error:", error);
        return "Stay consistent, and success will follow!";
    }
};
