import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: any = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function getRamadanCoachAdvice(userContext: any, lang: string = 'en') {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [{ text: `You are an expert Islamic Ramadan Coach. Based on the user's current progress: ${JSON.stringify(userContext)}, provide 3 actionable, motivational, and spiritually uplifting tips for today. Provide the response in ${lang === 'bn' ? 'Bengali' : 'English'}. Keep it concise and inspiring.` }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            motivation: { type: Type.STRING }
          },
          required: ["tips", "motivation"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Coach Error:", error);
    return { tips: [], motivation: "Keep striving for your spiritual goals!" };
  }
}

export async function getDuaRecommendation(mood: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [{ text: `The user is feeling ${mood}. Recommend a powerful Dua from the Quran or Sunnah that fits this mood. Provide the Arabic text, transliteration, and English meaning.` }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            duaArabic: { type: Type.STRING },
            transliteration: { type: Type.STRING },
            meaning: { type: Type.STRING },
            source: { type: Type.STRING }
          },
          required: ["duaArabic", "transliteration", "meaning"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Dua Error:", error);
    return { duaArabic: "Ø±ÙŽØ¨Ù‘ÙŽÙ†ÙŽØ§ Ø¢ØªÙ Ù†ÙŽØ§ Ù Ù ÙŠ Ø§Ù„Ø¯Ù‘Ù Ù†Ù’ÙŠÙŽØ§ Ø­ÙŽØ³ÙŽÙ†ÙŽØ©Ù‹", transliteration: "Rabbana atina fid-dunya hasanatan", meaning: "Our Lord, give us in this world [that which is] good" };
  }
}
