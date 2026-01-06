
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getAiCommentary = async (
  guess: number,
  target: number,
  attempts: number,
  previousGuesses: number[]
) => {
  try {
    const isHigher = guess < target;
    const distance = Math.abs(target - guess);
    
    let prompt = `You are a witty and encouraging game show host for a 'Guess the Number' game (1-100).
    The player just guessed ${guess}. The target is ${target}. 
    This is attempt number ${attempts + 1}.
    The guess is too ${isHigher ? 'LOW' : 'HIGH'}. 
    The distance from the target is ${distance}.
    Previous guesses: ${previousGuesses.join(', ')}.
    
    Provide a short, 1-2 sentence response in Korean. 
    Be funny, supportive, or slightly mysterious. 
    If they are very close (within 5), be excited.
    If they are very far (more than 30), give a playful tease.
    Do not reveal the target number.`;

    if (guess === target) {
      prompt = `The player WON! They guessed the target number ${target} in ${attempts + 1} attempts.
      Give a grand, celebratory 2-sentence congratulatory message in Korean.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });

    return response.text || "흥미진진한 전개네요! 다음 숫자는 무엇일까요?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "오호, 과연 이 숫자가 맞을까요? 계속 도전해보세요!";
  }
};

export const getSecretHint = async (
  target: number,
  previousGuesses: number[]
) => {
  try {
    const prompt = `The target number is ${target}. The player has already guessed: ${previousGuesses.join(', ')}.
    Provide a cryptic but helpful hint in Korean about the target number without revealing it directly.
    For example, mention if it's prime, even/odd, its relation to a famous number, or its tens digit in a riddle-like way.
    Keep it to one short sentence.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.9,
      }
    });

    return response.text || "숫자의 기운이 심상치 않군요...";
  } catch (error) {
    return "흐음... 좀 더 집중해보세요!";
  }
};
