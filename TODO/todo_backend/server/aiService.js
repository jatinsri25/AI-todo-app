const { GPT4All } = require('gpt4all');

let gpt4allInstance;

const initGPT4All = async () => {
    gpt4allInstance = new GPT4All('gpt4all-lora-quantized', {
        verbose: true,
        device: 'cpu' // or 'gpu' if you have CUDA
    });
    await gpt4allInstance.init();
    await gpt4allInstance.open();
    console.log('GPT4All initialized');
};

const getAISuggestions = async (todos) => {
    const prompt = `
        Analyze these tasks and suggest priorities (1-5 where 5 is most important):
        ${JSON.stringify(todos.map(t => t.task))}
        
        Consider:
        - Urgency
        - Importance
        - Estimated effort
        
        Return as JSON array with: id, priority, reason
    `;
    
    const response = await gpt4allInstance.prompt(prompt);
    try {
        return JSON.parse(response);
    } catch (e) {
        console.error('Failed to parse AI response:', e);
        return [];
    }
};

const getMotivationalTip = async () => {
    return await gpt4allInstance.prompt(
        "Give a brief motivational tip for productivity (1 sentence)"
    );
};

module.exports = {
    initGPT4All,
    getAISuggestions,
    getMotivationalTip
};