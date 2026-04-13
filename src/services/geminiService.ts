import { GoogleGenAI, Type } from "@google/genai";
import { WordData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function processWord(word: string): Promise<WordData> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Translate the English word "${word}" to Russian and provide a natural example sentence in English. Also provide a "context" version of that English sentence where the target word is replaced by its Russian translation in square brackets (e.g., "I like [яблоки]"). 
    Additionally, provide 2-3 "complex forms" of the word (e.g., if it's a verb: past tense, gerund; if it's a noun: plural; if it's an adjective: comparative/superlative).
    Finally, provide 4 "grammar challenges" for this word. Each challenge should be an English sentence with a gap "___" where the word (or its correct grammatical form) should be placed. 
    CRITICAL: Make the challenges difficult. Do not just use the base form. 
    - Require correct tenses (Past Simple, Present Continuous, Present Perfect).
    - Require correct endings (-s, -ing, -ed).
    - Sometimes require auxiliary verbs or constructions (to, is/are, did, have/has) if they are part of the gap.
    - The student must think about the grammatical form, not just translate.
    Example for "help":
    1. Why ___ you ___ me yesterday? (помогать) -> answer: "did help"
    2. She ___ me every day. (помогать) -> answer: "helps"
    3. I am ___ him at the moment. (помогать) -> answer: "helping"
    4. I have already ___ them. (помочь) -> answer: "helped"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          translation: { type: Type.STRING },
          example: { type: Type.STRING },
          exampleContext: { type: Type.STRING },
          complexForms: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.STRING },
              },
              required: ["label", "value"],
            },
          },
          grammarChallenges: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sentence: { type: Type.STRING },
                answer: { type: Type.STRING },
                translation: { type: Type.STRING },
              },
              required: ["sentence", "answer", "translation"],
            },
          },
        },
        required: ["word", "translation", "example", "exampleContext", "complexForms", "grammarChallenges"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Failed to generate word data");
  }

  return JSON.parse(text) as WordData;
}

export async function suggestWords(count: number = 15): Promise<WordData[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Suggest ${count} useful English words for learning. For each word, provide its Russian translation, an example sentence in English, a "context" version of that English sentence where the target word is replaced by its Russian translation in square brackets (e.g., "I like [яблоки]").
    Also provide 2-3 "complex forms" for each word.
    Finally, provide 4 "grammar challenges" for each word (sentences with "___" gaps, correct answers, and Russian translations for the context).
    CRITICAL: Make the challenges difficult. Require correct tenses, endings, and auxiliary verbs (do/did/have/is/are).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            translation: { type: Type.STRING },
            example: { type: Type.STRING },
            exampleContext: { type: Type.STRING },
            complexForms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                },
                required: ["label", "value"],
              },
            },
            grammarChallenges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sentence: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  translation: { type: Type.STRING },
                },
                required: ["sentence", "answer", "translation"],
              },
            },
          },
          required: ["word", "translation", "example", "exampleContext", "complexForms", "grammarChallenges"],
        },
      },
    },
  });

  const text = response.text;
  if (!text) return [];
  return JSON.parse(text) as WordData[];
}
