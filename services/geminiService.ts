import { GoogleGenAI } from "@google/genai";

export const enhanceBioWithAI = async (currentBio: string, name: string, facts: string): Promise<string> => {
  // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
  // Assume this variable is pre-configured, valid, and accessible.
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key not found.");
    return "Gemini API Key missing. Please configure process.env.API_KEY.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-2.5-flash"; 
    
    const prompt = `
      You are a helpful assistant for a social networking app called KnowMe App.
      Please write a short, engaging, and friendly bio (max 2 sentences) for a user profile card.
      
      User Name: ${name}
      Current Bio Draft: ${currentBio}
      Fun Facts: ${facts}

      If the current bio is empty, create one based on the fun facts.
      Make it sound natural and approachable.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text?.trim() || currentBio;
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return currentBio; // Fallback to original on error
  }
};