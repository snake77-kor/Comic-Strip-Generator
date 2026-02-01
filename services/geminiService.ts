
import { GoogleGenAI, Type } from "@google/genai";
import type { ComicStripScript, ComicPanelData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SCRIPT_GENERATION_PROMPT_MOMENTS = `
Analyze the following text, which may be in English or Korean, and may contain multiple passages separated by "---".
Your task is to transform EACH passage into a multi-panel comic strip script by breaking it down into its key semantic ideas or scenes. The number of panels should reflect the natural flow and distinct moments of the story, typically between 2 and 5 panels per passage.

For each distinct idea/scene you identify in a passage, generate one line in the format:
CAPTION|||IMAGE_PROMPT

- "CAPTION": A concise summary of the moment, in the original language of the passage.
- "|||": Use this exact separator.
- "IMAGE_PROMPT": A detailed, vivid, and artistic prompt IN ENGLISH for an AI image generator describing a cinematic comic art style scene.
  **CRITICAL RULES FOR VISUAL CONSISTENCY (DO NOT IGNORE):**
  1. **Character Definition:** In the very first panel, explicitly describe the main character's physical appearance (e.g., "Vincent Van Gogh with a red beard, wearing a blue smock and straw hat"). If it's a specific person mentioned in the text, use their known traits.
  2. **Character Persistence:** In ALL subsequent panels, **YOU MUST COPY-PASTE** the character's physical description. Do not refer to them as "he", "she", or "the man". Use "The same Vincent Van Gogh with red beard and straw hat...".
  3. **Contextual Flow:** Analyze the relationship between sentences. The background and lighting should remain consistent unless the scene explicitly changes. If the character was holding an object in the previous moment, they should probably still be holding it unless they dropped it.

Separate scripts for different passages with a single line containing only:
---PASSAGE_BREAK---

Example for a Korean text passage about a knight's journey:
한때 평화로웠던 왕국에 어둠이 내렸습니다.|||A sweeping landscape of a fantasy kingdom under dark, swirling clouds, with a castle in the distance, dramatic lighting, comic book style.
왕은 용감한 기사를 불렀습니다.|||Close-up of a king on his throne speaking to a **knight in silver armor with a red cape**, grand hall interior, cinematic shadows.
기사는 전설의 검을 찾아 여정을 떠났습니다.|||**The same knight in silver armor with a red cape** riding a white horse away from the castle towards mountains, determined expression.
마침내 그는 괴물이 지키는 검을 발견했습니다.|||**The same knight in silver armor with a red cape** confronting a fearsome dragon in a fiery cave, a glowing sword resting on a pedestal, dynamic action scene.
`;

const SCRIPT_GENERATION_PROMPT_SENTENCE = `
Analyze the following text, which may be in English or Korean, and may contain multiple passages separated by "---".
Your task is to transform EACH passage into a multi-panel comic strip script by treating EACH SENTENCE as a separate comic panel.

For each sentence you identify in a passage, generate one line in the format:
CAPTION|||IMAGE_PROMPT

- "CAPTION": The exact sentence from the passage, in its original language.
- "|||": Use this exact separator.
- "IMAGE_PROMPT": A detailed, vivid, and artistic prompt IN ENGLISH for an AI image generator.
  **CRITICAL RULES FOR VISUAL CONSISTENCY (DO NOT IGNORE):**
  1. **Consistent Subject:** If the text is about a specific subject (e.g., "Van Gogh", "A dog"), fully describe them in the first prompt (e.g., "Vincent Van Gogh, a man with a red beard and straw hat").
  2. **Link to Previous Panel:** For every sentence after the first, consider the visual context of the previous sentence. If the character is "looking at the stars", and the next sentence is "he felt lonely", the image should show "The same Van Gogh with red beard standing under the starry night sky, looking lonely".
  3. **Repeat Descriptions:** NEVER use pronouns alone in prompts. Always repeat the full visual description (e.g., "The same man with glasses and a red tie").

Separate scripts for different passages with a single line containing only:
---PASSAGE_BREAK---

Example:
Text: He walked into the dark forest. He heard a strange noise.
Output:
He walked into the dark forest.|||A young man with a backpack walking into a dense, dark, misty forest, tall pine trees, mysterious atmosphere.
He heard a strange noise.|||The same young man with a backpack stopping in the same dark forest, looking around with a fearful expression, cupping his ear, misty trees in background.
`;

const SCRIPT_GENERATION_PROMPT_DIALOGUE = `
Analyze the following text, which may be in English or Korean. Your task is to transform it into a multi-panel conversational comic strip script between two speakers.

For each panel, generate one line in the format:
IMAGE_PROMPT|||LEFT_SPEAKER_TEXT|||RIGHT_SPEAKER_TEXT

- "IMAGE_PROMPT": A detailed, vivid prompt IN ENGLISH for an AI image generator.
  **CRITICAL RULES FOR VISUAL CONSISTENCY (DO NOT IGNORE):**
  1. **Define Appearance:** In the first panel, you MUST define the specific visual appearance of the Left Speaker and Right Speaker (e.g., "Left: a woman in a business suit, Right: a robot").
  2. **Maintain Appearance:** In ALL subsequent panels, you MUST repeat these descriptions exactly to ensure they do not change appearance.
  3. **Contextual Expressions:** Describe their facial expressions and body language matching the dialogue context (e.g., "The woman looks surprised", "The robot gestures angrily").
  4. **Consistent Setting:** Describe the background scene in the first panel and repeat the setting description in every subsequent panel unless they move.

- "|||": Use this exact separator.
- "LEFT_SPEAKER_TEXT": The dialogue for the character on the left. Can be empty if they are not speaking. Use the original language of the text.
- "|||": Use this exact separator.
- "RIGHT_SPEAKER_TEXT": The dialogue for the character on the right. Can be empty if they are not speaking. Use the original language of the text.

If the original text is not a dialogue, create a plausible conversation between two characters based on the text's content.
Separate scripts for different passages with a single line containing only:
---PASSAGE_BREAK---
`;


const handleApiError = (error: unknown, context: 'script' | 'image'): Error => {
    console.error(`Error generating comic ${context}:`, error);
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('quota')) {
            return new Error("API 사용 할당량을 초과했습니다. Gemini API의 무료 사용량 한도에 도달했을 수 있습니다. 잠시 후 다시 시도하거나 Google AI Studio에서 할당량 설정을 확인해 주세요.");
        }
        if (message.includes('api key not valid')) {
            return new Error("제공된 API 키가 유효하지 않습니다. Google AI Studio에서 키를 확인하고 다시 시도해 주세요.");
        }
    }
    const contextMessage = context === 'script' ? '스크립트' : '이미지';
    return new Error(`${contextMessage}를 생성하는 중에 예상치 못한 오류가 발생했습니다. 일시적인 네트워크 문제일 수 있으니 잠시 후 다시 시도해 주세요.`);
}

export const generateComicScript = async (text: string, scriptType: 'moments' | 'sentence' | 'dialogue'): Promise<ComicStripScript[][]> => {
  try {
    const prompt = scriptType === 'sentence' 
      ? SCRIPT_GENERATION_PROMPT_SENTENCE 
      : scriptType === 'dialogue'
      ? SCRIPT_GENERATION_PROMPT_DIALOGUE
      : SCRIPT_GENERATION_PROMPT_MOMENTS;
      
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${prompt}\n\n---TEXT---\n${text}`,
    });

    const resultText = response.text.trim();
    if (!resultText) {
      throw new Error("API returned an empty response.");
    }
    
    const passageScripts = resultText.split('---PASSAGE_BREAK---');

    const scripts: ComicStripScript[][] = passageScripts.map(passageStr => {
      if (!passageStr.trim()) return [];
      const lines = passageStr.trim().split('\n');
      return lines.map(line => {
        const parts = line.split('|||');
        if (scriptType === 'dialogue') {
            if (parts.length !== 3) {
                console.warn('Skipping malformed dialogue line from AI:', line);
                return null;
            }
            return {
                image_prompt: parts[0].trim(),
                caption: '', // Not used in dialogue mode
                dialogue: {
                    left: parts[1].trim(),
                    right: parts[2].trim(),
                }
            };
        } else {
            if (parts.length !== 2) {
              console.warn('Skipping malformed line from AI:', line);
              return null;
            }
            return {
              caption: parts[0].trim(),
              image_prompt: parts[1].trim(),
            };
        }
      }).filter((panel): panel is ComicStripScript => panel !== null);
    }).filter(passage => passage.length > 0);

    if (scripts.length === 0) {
        throw new Error("API returned an empty or invalid script format after parsing.");
    }
    return scripts;
  } catch (error) {
    throw handleApiError(error, 'script');
  }
};

export const generateSingleImage = async (prompt: string, stylePrompt: string): Promise<string> => {
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const imageResponse = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `${prompt}, ${stylePrompt}`,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '1:1',
                },
            });

            if (!imageResponse.generatedImages || imageResponse.generatedImages.length === 0) {
                throw new Error("API returned no images.");
            }

            const base64ImageBytes: string = imageResponse.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;

        } catch (error) {
            lastError = handleApiError(error, 'image');
            if (i < MAX_RETRIES - 1) {
                const delay = 2 ** i * 2000; // Exponential backoff: 2s, 4s
                console.warn(`Attempt ${i + 1} failed for prompt "${prompt}". Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error(`Image generation failed for prompt "${prompt}" after ${MAX_RETRIES} attempts.`);
    throw lastError || new Error('이미지 생성에 여러 번 실패했습니다. 잠시 후 다시 시도해 주세요.');
};
