const API_KEY = '6965d19bd80542d1ab19d0e408a9e0d7.otoDDb01C2ieKspP';

const EMOTION_DATA = [
  { id: 'a1', name: 'cheerful', type: 'positive', note: '愉快、开心' },
  { id: 'a2', name: 'excited', type: 'positive', note: '兴奋、激动' },
  { id: 'a3', name: 'relaxed', type: 'positive', note: '放松、轻松' },
  { id: 'a4', name: 'sad', type: 'negative', note: '悲伤、难过' },
  { id: 'a5', name: 'frustrated', type: 'negative', note: '沮丧、受挫' },
  { id: 'a6', name: 'anxious', type: 'negative', note: '焦虑、不安' },
  { id: 'a7', name: 'content', type: 'neutral', note: '满足、满意' },
  { id: 'a8', name: 'calm', type: 'neutral', note: '平静、冷静' },
  { id: 'a9', name: 'balanced', type: 'neutral', note: '平衡、均衡' },
  { id: 'a10', name: 'conflicted', type: 'complex', note: '矛盾、纠结' },
  { id: 'a11', name: 'adventurous', type: 'complex', note: '冒险、探索' },
  { id: 'a12', name: 'nostalgic', type: 'complex', note: '怀旧、回忆' }
];

const EMOTIONAL_COMBINATIONS = [
  { id: 'b1', primary: 'a4', secondary: 'a10', note: '情绪低落、内在拉扯' },
  { id: 'b2', primary: 'a5', secondary: 'a10', note: '受挫、矛盾' },
  { id: 'b3', primary: 'a6', secondary: 'a10', note: '焦虑、不确定' },
  { id: 'b4', primary: 'a4', secondary: 'a12', note: '怀旧偏伤感' },
  { id: 'b5', primary: 'a2', secondary: 'a11', note: '兴奋、想尝试' },
  { id: 'b6', primary: 'a1', secondary: 'a11', note: '愉快、探索' },
  { id: 'b7', primary: 'a3', secondary: 'a11', note: '轻松状态下的冒险' },
  { id: 'b8', primary: 'a3', secondary: 'a12', note: '放松、温和回忆' },
  { id: 'b9', primary: 'a7', secondary: 'a10', note: '表面满足、内在纠结' },
  { id: 'b10', primary: 'a9', secondary: 'a10', note: '理性平衡、拉扯' },
  { id: 'b11', primary: 'a7', secondary: 'a11', note: '稳定状态下想尝试' },
  { id: 'b12', primary: 'a8', secondary: 'a12', note: '平静、回忆' },
  { id: 'b13', primary: 'a7', secondary: 'a12', note: '满足、怀旧' }
];

const EMOTION_KEYWORDS = {
  a1: ['开心', '快乐', '愉快', '高兴', '欢乐', '喜悦', '欢快', '兴奋'],
  a2: ['兴奋', '激动', '热情', '高涨', '蓬勃', '精力充沛'],
  a3: ['放松', '轻松', '悠闲', '自在', '舒适', '悠闲自得'],
  a4: ['悲伤', '难过', '伤心', '沮丧', '低落', '郁闷', '忧郁'],
  a5: ['受挫', '沮丧', '挫败', '失望', '气馁', '无奈'],
  a6: ['焦虑', '不安', '紧张', '担心', '忧虑', '忐忑'],
  a7: ['满足', '满意', '知足', '惬意', '幸福', '美满'],
  a8: ['平静', '冷静', '淡定', '从容', '安宁', '静心'],
  a9: ['平衡', '均衡', '稳定', '协调', '和谐'],
  a10: ['矛盾', '纠结', '冲突', '挣扎', '犹豫', '矛盾重重'],
  a11: ['冒险', '探索', '尝试', '新鲜', '好奇', '跃跃欲试'],
  a12: ['怀旧', '回忆', '往事', '怀念', '感慨']
};

function buildPrompt(userText) {
  const emotionList = EMOTION_DATA.map(e => `${e.id}: ${e.name} (${e.note})`).join('\n');

  const combinationList = EMOTIONAL_COMBINATIONS.map(c => {
    const primary = EMOTION_DATA.find(e => e.id === c.primary);
    const secondary = EMOTION_DATA.find(e => e.id === c.secondary);
    return `${c.id}: ${primary.name} + ${secondary.name} (${c.note})`;
  }).join('\n');

  return `## 情绪识别与 ID 匹配专家

**角色任务：**
你是一个精通语义分析与情绪识别的专家。你需要根据我提供的文本内容，从给定的两组情绪数据中识别出最匹配的情绪，并仅返回其对应的 ID。

**输入数据：**

1. **待分析文本：** ${userText}
2. **复合情绪数据集 (Compound Emotions)：** ${combinationList}
3. **单个情绪数据集 (Single Emotions)：** ${emotionList}

**识别逻辑（优先级）：**

1. **第一优先级：** 检索【复合情绪数据集】。如果文本表达的情绪符合该集合中的任意项，请选择该情绪。
2. **第二优先级：** 若在【复合情绪数据集】中未找到匹配项，则检索【单个情绪数据集】。
3. **匹配准则：** 请基于语义理解选择最契合文本核心情感的条目。

**输出规范（严禁违背）：**

* **只返回 ID**：不要包含任何解释，分析、标点符号或前导字符（如 "ID: "）。只需要返回 emotionId，例如 "a1" 或 "b2"。
* **无匹配结果：** 如果两组数据均无法匹配，请返回 "a7"。

在检查【单个情绪数据集】之前，请务必深度解析文本是否包含【复合情绪数据集】中所描述的多种情感交织特征。`;
}

export async function matchEmotionWithGLM(userText) {
  const prompt = buildPrompt(userText);

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4.5-air',
        messages: [
          { role: 'system', content: '你是情绪识别专家，对语言的理解精准深刻，只返回指定内容。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        stream: false,
        thinking: {
          type: "disabled"
        },
        max_tokens: 500
      })
    });

    if (!response.ok) {
      console.error('GLM API错误:', response.status, response.statusText);
      return fallbackMatch(userText);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

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
    console.error('GLM API调用失败:', error);
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
