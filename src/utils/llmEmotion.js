import { GoogleGenAI } from "@google/genai";
const API_KEY = 'AIzaSyDI56RTPDK4cpK-k9lhZTopqhxnBAO-jz4';

const ai = new GoogleGenAI({ apiKey: API_KEY });


const EMOTION_DATA = [
  { id: 'a1', name: 'cheerful', type: 'positive', note: 'Happy, cheerful' },
  { id: 'a2', name: 'excited', type: 'positive', note: 'Excited, enthusiastic' },
  { id: 'a3', name: 'relaxed', type: 'positive', note: 'Relaxed, easy-going' },
  { id: 'a4', name: 'sad', type: 'negative', note: 'Sad, upset' },
  { id: 'a5', name: 'frustrated', type: 'negative', note: 'Frustrated, frustrated' },
  { id: 'a6', name: 'anxious', type: 'negative', note: 'Anxious, nervous' },
  { id: 'a7', name: 'content', type: 'neutral', note: 'Content, satisfied' },
  { id: 'a8', name: 'calm', type: 'neutral', note: 'Calm, composed' },
  { id: 'a9', name: 'balanced', type: 'neutral', note: 'Balanced, even' },
  { id: 'a10', name: 'conflicted', type: 'complex', note: 'Conflicted, torn' },
  { id: 'a11', name: 'adventurous', type: 'complex', note: 'Adventurous, exploring' },
  { id: 'a12', name: 'nostalgic', type: 'complex', note: 'Nostalgic, remembering' }
];

const EMOTIONAL_COMBINATIONS = [
  { id: 'b1', primary: 'a4', secondary: 'a10', note: 'Emotional low, internal pull' },
  { id: 'b2', primary: 'a5', secondary: 'a10', note: 'Frustrated, conflicted' },
  { id: 'b3', primary: 'a6', secondary: 'a10', note: 'Anxious, uncertain state' },
  { id: 'b4', primary: 'a4', secondary: 'a12', note: 'Nostalgic, remembering' },
  { id: 'b5', primary: 'a2', secondary: 'a11', note: 'Excited, trying' },
  { id: 'b6', primary: 'a1', secondary: 'a11', note: 'Happy, exploring' },
  { id: 'b7', primary: 'a3', secondary: 'a11', note: 'Relaxed, adventurous' },
  { id: 'b8', primary: 'a3', secondary: 'a12', note: 'Relaxed, remembering' },
  { id: 'b9', primary: 'a7', secondary: 'a10', note: 'Surface satisfaction, internal conflict' },
  { id: 'b10', primary: 'a9', secondary: 'a10', note: 'Balanced, internal pull' },
  { id: 'b11', primary: 'a7', secondary: 'a11', note: 'Stable, trying' },
  { id: 'b12', primary: 'a8', secondary: 'a12', note: 'Calm, remembering' },
  { id: 'b13', primary: 'a7', secondary: 'a12', note: 'Content, nostalgic' }
];

const EMOTION_KEYWORDS = {
  a1: ['cheerful', 'happy', 'joyful', 'lively', 'excited'],
  a2: ['excited', 'excited', 'energetic', 'high-spirited', 'vibrant', 'full of energy'],
  a3: ['relaxed', 'easy-going', 'comfort', 'comfortable', 'free'],
  a4: ['sad', 'upset', 'heartbroken', 'depressed', 'down', 'gloomy', 'melancholic'],
  a5: ['frustrated', 'discouraged', 'defeated', 'disappointed', 'dismayed', 'helpless'],
  a6: ['anxious', 'uneasy', 'tense', 'worried', 'apprehensive', 'nervous'],
  a7: ['satisfaction', 'contentment', 'content', 'pleasure', 'happiness', 'fulfillment'],
  a8: ['calm', 'composure', 'poise', 'ease', 'peace', 'tranquility'],
  a9: ['balance', 'equilibrium', 'stability', 'coordination', 'harmony'],
  a10: ['contradiction', 'conflict', 'struggle', 'hesitation', 'full of contradictions'],
  a11: ['adventure', 'exploration', 'attempt', 'novelty', 'curiosity', 'eager to try'],
  a12: ['nostalgia', 'memories', 'the past', 'longing', 'reflection']
};

function buildPrompt(userText) {
  const emotionList = EMOTION_DATA.map(e => `${e.id}: ${e.name} (${e.note})`).join('\n');

  const combinationList = EMOTIONAL_COMBINATIONS.map(c => {
    const primary = EMOTION_DATA.find(e => e.id === c.primary);
    const secondary = EMOTION_DATA.find(e => e.id === c.secondary);
    return `${c.id}: ${primary.name} + ${secondary.name} (${c.note})`;
  }).join('\n');

  return `## Expert in Sentiment Analysis and ID Matching

**Role and Tasks:**
You are an expert in semantic analysis and sentiment analysis. Based on the text I provide, you need to identify the most relevant sentiment from the two given sets of sentiment data and return only its corresponding ID.

**Input Data:**

1. **Text to be analyzed:** ${userText}
2. **Compound Emotions Dataset:** ${combinationList}
3. **Single Emotions Dataset:** ${emotionList}

**Recognition Logic (Priority):**

1. **First Priority:** Search the 【Compound Emotions】 dataset. If the emotion expressed in the text matches any entry in this dataset, select that emotion.
2. **Second Priority:** If no match is found in the 【Compound Emotions】 dataset, search the 【Single Emotions】 dataset.
3. **Matching Criteria:** Select the entry that best aligns with the core sentiment of the text based on semantic understanding.

**Output Specifications (Strictly Enforced):**

* **Return Only the ID**: Do not include any explanations, analysis, punctuation, or leading characters (such as 'ID: '). Return only the emotionId, e.g., 'a1' or 'b2'.
* **No Matches Found:** If neither dataset matches, return 'a7'.

Before checking the [Single Emotion Dataset], be sure to thoroughly analyze the text to determine whether it contains the characteristics of intertwined emotions described in the [Composite Emotion Dataset].`;
}

export async function matchEmotionWithGLM(userText) {
  const prompt = buildPrompt(userText);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    })

    console.log(response.candidates[0].content.parts[0].text)

    const content = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return fallbackMatch(userText);
    }

    const emotionId = content.trim();

    if (emotionId && /^[ab]\d+$/.test(emotionId)) {
      return {
        emotionId: emotionId,
        type: 'emotion'
      };
    }

    return fallbackMatch(userText);
  } catch (error) {
    console.error('Gemini API Failed:', error);
    return fallbackMatch(userText);
  }
}

function fallbackMatch(text) {
  const lowerText = text.toLowerCase();

  for (const combo of EMOTIONAL_COMBINATIONS) {
    const primaryKeywords = EMOTION_KEYWORDS[combo.primary] || [];
    const secondaryKeywords = EMOTION_KEYWORDS[combo.secondary] || [];

    const hasPrimary = primaryKeywords.some(kw => lowerText.includes(kw));
    const hasSecondary = secondaryKeywords.some(kw => lowerText.includes(kw));

    if (hasPrimary && hasSecondary) {
      return {
        emotionId: combo.id,
        type: 'combination'
      };
    }
  }

  for (const emotion of EMOTION_DATA) {
    const keywords = EMOTION_KEYWORDS[emotion.id] || [];
    if (keywords.some(kw => lowerText.includes(kw))) {
      return {
        emotionId: emotion.id,
        type: 'emotion'
      };
    }
  }

  return {
    emotionId: 'a7',
    type: 'default'
  };
}

export function matchEmotion(text) {
  return fallbackMatch(text);
}
