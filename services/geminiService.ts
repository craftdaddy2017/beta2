import { GoogleGenAI, Type } from "@google/genai";

export const suggestLineItemsFromPrompt = async (prompt: string) => {
  try {
    // Access the API key provided via Vite's define or environment
    const apiKey = process.env.API_KEY;
    
    // STRICT CHECK: The SDK throws an error if initialized with an empty string or undefined.
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === "") {
      console.warn('Gemini API functionality is disabled because API_KEY is missing or empty in environment variables.');
      return [];
    }

    // Only initialize if we definitely have a key
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract a list of professional invoice line items (description, quantity, estimated market rate in INR, and common GST percentage for that item in India) from the following business scenario: "${prompt}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { 
                type: Type.STRING,
                description: 'The name or description of the service/product'
              },
              qty: { 
                type: Type.NUMBER,
                description: 'The quantity'
              },
              rate: { 
                type: Type.NUMBER,
                description: 'The unit rate in INR'
              },
              taxRate: { 
                type: Type.NUMBER,
                description: 'The GST rate as a percentage (e.g. 18)'
              },
              hsn: { 
                type: Type.STRING,
                description: 'The HSN or SAC code'
              }
            },
            required: ['description', 'qty', 'rate', 'taxRate'],
            propertyOrdering: ['description', 'hsn', 'qty', 'rate', 'taxRate']
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini AI Service Error:', error);
    return [];
  }
};