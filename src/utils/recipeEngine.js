import alcoholContentRangeData from '../data/alcoholContentRange.json';
import alcoholVolumeData from '../data/alcoholVolume.json';
import bitterUsageData from '../data/bitterUsage.json';
import emotionData from '../data/emotion.json';
import emotionalCombinationData from '../data/emotionalCombination.json';
import emotionWithToneData from '../data/emotionWithTone.json';
import materialData from '../data/material.json';
import methodData from '../data/method.json';
import sourSweetRatioData from '../data/sourSweetRatio.json';
import spicyUsageData from '../data/spicyUsage.json';
import tasteRatioData from '../data/tasteRatio.json';
import toneWithMaterialData from '../data/toneWithMaterial.json';
import { matchEmotionWithGLM } from './glmEmotion';

function getMaterialById(id) {
  return materialData.find(m => m.id === id);
}

function getToneWithMaterialById(toneId) {
  return toneWithMaterialData.find(t => t.toneId === toneId);
}

function getMethodById(methodId) {
  return methodData.find(m => m.id === methodId);
}

function getAlcoholVolumeById(id) {
  return alcoholVolumeData.find(a => a.id === id);
}

function getAlcoholContentRangeById(id) {
  return alcoholContentRangeData.find(a => a.id === id);
}

class EmotionNotFoundError extends Error {
  constructor(emotionId) {
    super(`Emotion not found: ${emotionId}`);
    this.name = 'EmotionNotFoundError';
    this.emotionId = emotionId;
  }
}

class InvalidConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidConfigError';
  }
}

function getToneIdByEmotion(emotionId) {
  if (!emotionId || typeof emotionId !== 'string') {
    throw new EmotionNotFoundError(emotionId);
  }

  if (!emotionWithToneData || typeof emotionWithToneData !== 'object') {
    throw new InvalidConfigError('Invalid emotionWithTone.json format');
  }

  const toneData = emotionWithToneData[emotionId];

  if (!toneData) {
    throw new EmotionNotFoundError(emotionId);
  }

  if (!toneData.toneId || typeof toneData.toneId !== 'string') {
    throw new InvalidConfigError(`Invalid toneId for emotion: ${emotionId}`);
  }

  return toneData.toneId;
}

function getTasteRatio(tasteId, tasteLevelId) {
  return tasteRatioData[tasteId]?.[tasteLevelId];
}

function levelToNumber(level) {
  return parseInt(level.replace('h', ''));
}

function numberToLevel(num) {
  return 'h' + Math.min(3, Math.max(0, num));
}

function evaluateFormula(formula, variables) {
  let result = formula;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(key, 'g'), value);
  }
  return (new Function('return ' + result))();
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function calculatePureAlcoholBounds(totalVolume, minAlcoholPercent, maxAlcoholPercent) {
  return {
    minPureAlcohol: totalVolume * minAlcoholPercent / 100,
    maxPureAlcohol: totalVolume * maxAlcoholPercent / 100
  };
}

function calculateMtVolumesByAlcoholVolumeId(pureAlcohol, alcoholVolumeId, mt1AlcoholContent, mt2AlcoholContent = 0) {
  if (alcoholVolumeId === 'av1') {
    return {
      mt1Volume: pureAlcohol / mt1AlcoholContent,
      mt2Volume: 0
    };
  } else if (alcoholVolumeId === 'av2') {
    const mt1Volume = pureAlcohol / (mt1AlcoholContent + mt2AlcoholContent / 2);
    return {
      mt1Volume,
      mt2Volume: mt1Volume / 2
    };
  } else if (alcoholVolumeId === 'av3') {
    const mt1Volume = pureAlcohol / (mt1AlcoholContent + mt2AlcoholContent / 3);
    return {
      mt1Volume,
      mt2Volume: mt1Volume / 3
    };
  }
  return { mt1Volume: 0, mt2Volume: 0 };
}

function alignVolumesToFiveMultiples(volumes, totalVolume, targetPureAlcohol, getAlcoholContentFn) {
  const entries = Object.entries(volumes).map(([id, vol]) => ({ id, volume: vol }));
  entries.sort((a, b) => b.volume - a.volume);

  const roundToFive = (n) => Math.max(0, Math.round(n / 5) * 5);

  const currentVolumes = {};
  for (const e of entries) {
    currentVolumes[e.id] = roundToFive(e.volume);
  }

  let currentTotal = Object.values(currentVolumes).reduce((sum, v) => sum + v, 0);

  if (currentTotal === totalVolume) {
    let pureAlcohol = 0;
    for (const e of entries) {
      const alcoholContent = getAlcoholContentFn(e.id);
      if (alcoholContent !== null) {
        pureAlcohol += currentVolumes[e.id] * alcoholContent;
      }
    }
    return { volumes: currentVolumes, pureAlcohol };
  }

  const diff = totalVolume - currentTotal;
  
  if (entries.length > 0 && diff > 0) {
    const alcoholEntries = entries.filter(e => {
      const alcoholContent = getAlcoholContentFn(e.id);
      return alcoholContent && alcoholContent > 0;
    });

    if (alcoholEntries.length > 0) {
      let volumeToAdd = roundToFive(diff / alcoholEntries.length) * alcoholEntries.length;
      for (let i = 0; i < alcoholEntries.length && volumeToAdd > 0; i++) {
        const addAmount = Math.min(5, volumeToAdd);
        alcoholEntries[i].volume += addAmount;
        volumeToAdd -= addAmount;
      }
    } else {
      entries[0].volume += diff;
    }
  }

  const newVolumes = {};
  for (const e of entries) {
    newVolumes[e.id] = roundToFive(e.volume);
  }

  let pureAlcohol = 0;
  for (const e of entries) {
    const alcoholContent = getAlcoholContentFn(e.id);
    if (alcoholContent !== null) {
      pureAlcohol += newVolumes[e.id] * alcoholContent;
    }
  }

  return { volumes: newVolumes, pureAlcohol };
}

function calculateActualAlcoholPercent(pureAlcoholVolume, totalVolume) {
  return (pureAlcoholVolume / totalVolume) * 100;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function matchEmotion(text) {
  const lowerText = text.toLowerCase();
  const emotionKeywords = {};
  for (const emotion of emotionData) {
    emotionKeywords[emotion.id] = emotion.name.toLowerCase();
  }

  let matchedCombination = null;
  for (const combo of emotionalCombinationData) {
    const primary = combo.emotionalCombination.primary.toLowerCase();
    const secondary = combo.emotionalCombination.secondary.toLowerCase();
    const primaryKeyword = emotionKeywords[combo.emotionalCombination.primary];
    const secondaryKeyword = emotionKeywords[combo.emotionalCombination.secondary];

    const hasPrimary = lowerText.includes(primary) || (primaryKeyword && lowerText.includes(primaryKeyword));
    const hasSecondary = lowerText.includes(secondary) || (secondaryKeyword && lowerText.includes(secondaryKeyword));

    if (hasPrimary && hasSecondary) {
      matchedCombination = combo;
      break;
    }
  }

  if (matchedCombination) {
    const currentEmotionId = matchedCombination.id;
    const currentToneId = emotionWithToneData[currentEmotionId]?.toneId || 'c1';
    return {
      emotionId: currentEmotionId,
      toneId: currentToneId,
      type: 'combination'
    };
  }

  for (const emotion of emotionData) {
    const keyword = emotion.name.toLowerCase();
    if (lowerText.includes(keyword)) {
      const currentEmotionId = emotion.id;
      const currentToneId = emotionWithToneData[currentEmotionId]?.toneId || 'c1';
      return {
        emotionId: currentEmotionId,
        toneId: currentToneId,
        type: 'emotion'
      };
    }
  }

  return {
    emotionId: 'a7',
    toneId: 'c4',
    type: 'default'
  };
}

function selectMaterials(toneId) {
  const toneMaterial = getToneWithMaterialById(toneId);
  if (!toneMaterial) return [];

  const material = toneMaterial.material;
  const selectedMaterials = new Set();

  for (const group of material.exactly_one) {
    if (group.length > 0) {
      const selected = randomChoice(group);
      selectedMaterials.add(selected);
    }
  }

  for (const group of material.at_least_one) {
    if (group.length > 0) {
      const numToSelect = randomInt(1, group.length);
      const shuffled = [...group].sort(() => Math.random() - 0.5);
      for (let i = 0; i < numToSelect; i++) {
        selectedMaterials.add(shuffled[i]);
      }
    }
  }

  if (material.required) {
    for (const id of material.required) {
      selectedMaterials.add(id);
    }
  }

  for (const group of material.all_or_none) {
    if (group.length > 0 && Math.random() > 0.5) {
      for (const id of group) {
        selectedMaterials.add(id);
      }
    }
  }

  for (const id of material.at_will) {
    if (Math.random() > 0.5) {
      selectedMaterials.add(id);
    }
  }

  return Array.from(selectedMaterials);
}

function determineMethod(materialIds) {
  const materials = materialIds.map(id => getMaterialById(id));

  const hasE1 = materials.some(m => m.method === 'e1');
  const hasE3 = materials.some(m => m.method === 'e3');
  const alcoholCount = materials.filter(m => m.type === 'mt1' || m.type === 'mt2').length;

  if (hasE1) {
    if (hasE3) {
      return 'e3';
    } else {
      return 'e1';
    }
  } else {
    if (hasE3) {
      return 'e4';
    } else {
      if (alcoholCount > 1) {
        return 'e2';
      } else {
        return 'e1';
      }
    }
  }
}

function selectAlcoholVolumeId(materialIds) {
  const materials = materialIds.map(id => getMaterialById(id));
  const hasMt1 = materials.some(m => m.type === 'mt1');
  const hasMt2 = materials.some(m => m.type === 'mt2');

  if (hasMt1 && !hasMt2) {
    return 'av1';
  }

  if (hasMt1 && hasMt2) {
    return Math.random() > 0.5 ? 'av2' : 'av3';
  }

  return 'av1';
}

function calculateTastePreference(currentTasteId, currentRefuseTasteIds, currentTasteLevelId, secondaryTasteId) {
  const defaultRatio = {
    sourLevel: 'h1',
    sweetLevel: 'h1',
    bitterLevel: 'h0',
    spicyLevel: 'h0'
  };
  let tasteRatio = { ...(getTasteRatio(currentTasteId, currentTasteLevelId) || defaultRatio) };

  tasteRatio.sourLevel = numberToLevel(levelToNumber(tasteRatio.sourLevel) + 1);
  tasteRatio.sweetLevel = numberToLevel(levelToNumber(tasteRatio.sweetLevel) + 1);

  if (secondaryTasteId && secondaryTasteId !== 'neutralize') {
    const targetLevel = secondaryTasteId === 't1' ? 'sourLevel' :
      secondaryTasteId === 't2' ? 'sweetLevel' :
        secondaryTasteId === 't3' ? 'bitterLevel' : 'spicyLevel';
    tasteRatio[targetLevel] = numberToLevel(levelToNumber(tasteRatio[targetLevel]) + 1);
  } else if (secondaryTasteId === 'neutralize') {
    tasteRatio.sourLevel = 'h1';
    tasteRatio.sweetLevel = 'h1';
  }

  for (const refuseId of currentRefuseTasteIds) {
    if (refuseId === 't1') tasteRatio.sourLevel = 'h0';
    if (refuseId === 't2') tasteRatio.sweetLevel = 'h0';
    if (refuseId === 't3') tasteRatio.bitterLevel = 'h0';
    if (refuseId === 't4') tasteRatio.spicyLevel = 'h0';
  }

  return tasteRatio;
}

function subtractMaterialTaste(materialIds, tasteRatio) {
  for (const id of materialIds) {
    const material = getMaterialById(id);
    if (material && material.taste && material.tasteLevel) {
      const tasteId = material.taste;
      const tasteLevel = material.tasteLevel;
      const subtractValue = levelToNumber(tasteLevel);

      if (tasteId === 't1') {
        tasteRatio.sourLevel = numberToLevel(levelToNumber(tasteRatio.sourLevel) - subtractValue);
      } else if (tasteId === 't2') {
        tasteRatio.sweetLevel = numberToLevel(levelToNumber(tasteRatio.sweetLevel) - subtractValue);
      } else if (tasteId === 't3') {
        tasteRatio.bitterLevel = numberToLevel(levelToNumber(tasteRatio.bitterLevel) - subtractValue);
      } else if (tasteId === 't4') {
        tasteRatio.spicyLevel = numberToLevel(levelToNumber(tasteRatio.spicyLevel) - subtractValue);
      }
    }
  }

  return tasteRatio;
}

function getSourSweetRatio(sourLevel, sweetLevel) {
  const sourNum = levelToNumber(sourLevel);
  const sweetNum = levelToNumber(sweetLevel);

  if (!sourSweetRatioData?.data) {
    return { materialRatio: '1:1', sourLevel: '1', sweetLevel: '1' };
  }

  for (const ratio of sourSweetRatioData.data) {
    if (parseInt(ratio.sourLevel) === sourNum && parseInt(ratio.sweetLevel) === sweetNum) {
      return ratio;
    }
  }

  return sourSweetRatioData.data[0];
}

function hasMaterialWithTaste(materialIds, tasteId) {
  return materialIds.some(id => {
    const material = getMaterialById(id);
    return material && material.taste === tasteId;
  });
}

function allocateSourSweetVolume(currentVolume, currentMaterialRatio, currentTotalVolume) {
  const ratioParts = currentMaterialRatio.materialRatio.split(':');
  const ratioSour = parseFloat(ratioParts[0]);
  const ratioSweet = parseFloat(ratioParts[1]);

  const d11Id = 'd11';
  const d12Id = 'd12';
  const d13Id = 'd13';
  const d14Id = 'd14';

  const hasD11 = currentVolume.hasOwnProperty(d11Id);
  const hasD12 = currentVolume.hasOwnProperty(d12Id);
  const hasD13 = currentVolume.hasOwnProperty(d13Id);
  const hasD14 = currentVolume.hasOwnProperty(d14Id);

  if (!hasD11 && !hasD12 && !hasD13 && !hasD14) {
    return currentVolume;
  }

  const maxIterations = 100;
  for (let iter = 0; iter < maxIterations; iter++) {
    const baseVolume = Math.min(60, currentTotalVolume - 20);
    const sourBase = (ratioSour / (ratioSour + ratioSweet)) * baseVolume;
    const sweetBase = (ratioSweet / (ratioSour + ratioSweet)) * baseVolume;

    let d11 = hasD11 ? randomInt(10, Math.floor(sourBase)) : 0;
    let d12 = hasD12 ? randomInt(10, Math.floor(sourBase)) : 0;
    let d13 = hasD13 ? randomInt(10, Math.floor(sweetBase)) : 0;
    let d14 = hasD14 ? randomInt(10, Math.floor(sweetBase)) : 0;

    d11 = Math.floor(d11 / 5) * 5;
    d12 = Math.floor(d12 / 5) * 5;
    d13 = Math.floor(d13 / 5) * 5;
    d14 = Math.floor(d14 / 5) * 5;

    const sourTotal = (hasD11 ? d11 : 0) + (hasD12 ? d12 : 0);
    const sweetTotal = (hasD13 ? d13 : 0) + (hasD14 ? d14 : 0);

    if (sourTotal >= 10 && sweetTotal >= 10 && sourTotal + sweetTotal < currentTotalVolume) {
      const result = { ...currentVolume };
      if (hasD11) result[d11Id] = d11;
      if (hasD12) result[d12Id] = d12;
      if (hasD13) result[d13Id] = d13;
      if (hasD14) result[d14Id] = d14;
      return result;
    }
  }


  let d11 = hasD11 ? 15 : 0;
  let d12 = hasD12 ? 15 : 0;
  let d13 = hasD13 ? 15 : 0;
  let d14 = hasD14 ? 15 : 0;

  const result = { ...currentVolume };
  if (hasD11) result[d11Id] = d11;
  if (hasD12) result[d12Id] = d12;
  if (hasD13) result[d13Id] = d13;
  if (hasD14) result[d14Id] = d14;
  return result;
}

function fillVolume(currentVolume, currentTotalVolume, usedMaterialIds) {
  let total = 0;
  for (const vol of Object.values(currentVolume)) {
    total += vol;
  }

  if (total < currentTotalVolume) {
    const missingVolume = currentTotalVolume - total;

    const existingMt4Id = Object.keys(currentVolume).find(id => {
      const m = materialData.find(mat => mat.id === id);
      return m && m.type === 'mt4';
    });

    if (existingMt4Id) {
      currentVolume[existingMt4Id] += missingVolume;
    } else {
      const mt4InMaterialIds = usedMaterialIds.find(id => {
        const m = materialData.find(mat => mat.id === id);
        return m && m.type === 'mt4';
      });

      if (mt4InMaterialIds) {
        currentVolume[mt4InMaterialIds] = missingVolume;
      } else {
        const mt4Materials = materialData.filter(m => m.type === 'mt4');
        if (mt4Materials.length > 0) {
          const randomMt4 = randomChoice(mt4Materials);
          currentVolume[randomMt4.id] = missingVolume;
          usedMaterialIds.push(randomMt4.id);
        }
      }
    }
  }

  return currentVolume;
}

function generateRecipeDetail(methodId, currentMaterialIds, currentVolume) {
  const method = getMethodById(methodId);
  if (!method) return { detail: [], alcoholContent: 0 };

  const mt1Materials = currentMaterialIds.filter(id => {
    const m = getMaterialById(id);
    return m && m.type === 'mt1';
  });
  const mt2Materials = currentMaterialIds.filter(id => {
    const m = getMaterialById(id);
    return m && m.type === 'mt2';
  });
  const mt3Materials = currentMaterialIds.filter(id => {
    const m = getMaterialById(id);
    return m && m.type === 'mt3' && id !== 'd15' && id !== 'd16';
  });
  const mt4Materials = currentMaterialIds.filter(id => {
    const m = getMaterialById(id);
    return m && m.type === 'mt4';
  });

  const getMaterialStr = (type) => {
    let materials = [];
    if (type === 'mt1') materials = mt1Materials;
    else if (type === 'mt2') materials = mt2Materials;
    else if (type === 'mt3') materials = mt3Materials;
    else if (type === 'mt4') materials = mt4Materials;

    if (materials.length === 0) return null;

    return materials.map(id => {
      const m = getMaterialById(id);
      const vol = currentVolume[id] || 0;
      const unit = m?.unit || 'ml';
      return `${vol}${unit} ${m.name}`;
    }).join(' + ');
  };

  const detail = [];

  if (mt1Materials.length > 0) {
    const mt1Str = getMaterialStr('mt1');
    if (method.id === 'e1' || method.id === 'e3') {
      detail.push(`加入基酒 → ${mt1Str}，倒入摇壶底部`);
    } else if (method.id === 'e2' || method.id === 'e4') {
      detail.push(`加入基酒 → ${mt1Str}，放入调酒杯`);
    }
  }

  if (mt2Materials.length > 0) {
    const mt2Str = getMaterialStr('mt2');
    detail.push(`加入利口酒 → ${mt2Str}`);
  }

  if (method.id === 'e1' || method.id === 'e3') {
    detail.push(`加入冰块 → 3块 方冰`);
    detail.push(`快速摇晃 → 10-15秒，高频`);
  } else if (method.id === 'e2' || method.id === 'e4') {
    detail.push(`加入冰块 → 4块 方冰`);
    detail.push(`缓慢搅拌 → 20-30秒，单向`);
  }

  const mt4Shake = mt4Materials.filter(id => {
    const m = getMaterialById(id);
    return m && m.method === 'e1';
  });
  const mt4Build = mt4Materials.filter(id => {
    const m = getMaterialById(id);
    return m && m.method === 'e3';
  });

  if (mt3Materials.length > 0 || mt4Shake.length > 0) {
    const parts = [];
    if (mt3Materials.length > 0) parts.push(getMaterialStr('mt3'));
    if (mt4Shake.length > 0) {
      const shakeMt4Str = mt4Shake.map(id => {
        const m = getMaterialById(id);
        const vol = currentVolume[id] || 0;
        const unit = m?.unit || 'ml';
        return `${vol}${unit} ${m.name}`;
      }).join(' + ');
      parts.push(shakeMt4Str);
    }
    if (parts.length > 0) {
      detail.push(`加入辅料 → ${parts.join(' + ')}`);
    }
  }

  detail.push(`过滤倒出 → 进入成品杯`);

  if ((method.id === 'e3' || method.id === 'e4') && mt4Build.length > 0) {
    const buildMt4Str = mt4Build.map(id => {
      const m = getMaterialById(id);
      const vol = currentVolume[id] || 0;
      const unit = m?.unit || 'ml';
      return `${vol}${unit} ${m.name}`;
    }).join(' + ');
    detail.push(`加入软饮 → ${buildMt4Str}，轻微搅拌1-2次`);
  }

  const d15Materials = currentMaterialIds.filter(id => id === 'd15');
  const d16Materials = currentMaterialIds.filter(id => id === 'd16');

  if (d15Materials.length > 0 || d16Materials.length > 0) {
    const parts = [];
    if (d15Materials.length > 0) {
      const d15Str = d15Materials.map(id => {
        const m = getMaterialById(id);
        const vol = currentVolume[id] || 0;
        const unit = m?.unit || 'ml';
        return `${vol}${unit} ${m.name}`;
      }).join(' + ');
      parts.push(d15Str);
    }
    if (d16Materials.length > 0) {
      const d16Str = d16Materials.map(id => {
        const m = getMaterialById(id);
        const vol = currentVolume[id] || 0;
        const unit = m?.unit || 'ml';
        return `${vol}${unit} ${m.name}`;
      }).join(' + ');
      parts.push(d16Str);
    }
    if (parts.length > 0) {
      detail.push(`加入调味 → ${parts.join(' + ')}`);
    }
  }

  return detail;
}

export async function calculateRecipe(emotionText, alcoholIndex, flavorPreference, useGLM = true) {
  const {
    primaryTasteId = 't1',
    secondaryTasteId = null,
    refuseTasteIds = [],
    tasteLevelId = 'h1'
  } = flavorPreference || {};

  let step1;
  if (useGLM) {
    step1 = await matchEmotionWithGLM(emotionText);
  } else {
    step1 = matchEmotion(emotionText);
  }

  const currentEmotionId = step1.emotionId;
  let currentToneId;
  try {
    currentToneId = getToneIdByEmotion(currentEmotionId);
  } catch (error) {
    console.error('getToneIdByEmotion error:', error.message);
    currentToneId = 'c4';
  }

  let currentMaterialIds = selectMaterials(currentToneId);

  const currentMethodId = determineMethod(currentMaterialIds);

  const alcoholRange = getAlcoholContentRangeById(alcoholIndex) || getAlcoholContentRangeById('g2');
  const minAlcoholPercent = alcoholRange.lowestAlcoholContent;
  const maxAlcoholPercent = alcoholRange.highestAlcoholContent;

  const method = getMethodById(currentMethodId);
  const currentTotalVolume = parseInt(method.totalVolume);

  const { minPureAlcohol, maxPureAlcohol } = calculatePureAlcoholBounds(
    currentTotalVolume,
    minAlcoholPercent,
    maxAlcoholPercent
  );

  const targetPureAlcohol = minPureAlcohol + Math.random() * (maxPureAlcohol - minPureAlcohol);

  const currentAlcoholVolumeId = selectAlcoholVolumeId(currentMaterialIds);

  const mt1Materials = currentMaterialIds.filter(id => {
    const m = getMaterialById(id);
    return m && m.type === 'mt1';
  });
  const mt2Materials = currentMaterialIds.filter(id => {
    const m = getMaterialById(id);
    return m && m.type === 'mt2';
  });

  const mt1Material = mt1Materials.length > 0 ? getMaterialById(mt1Materials[0]) : null;
  const mt2Material = mt2Materials.length > 0 ? getMaterialById(mt2Materials[0]) : null;
  const mt1AlcoholContent = parseFloat(mt1Material?.alcohol || 40) / 100;
  const mt2AlcoholContent = parseFloat(mt2Material?.alcohol || 20) / 100;

  const { mt1Volume, mt2Volume } = calculateMtVolumesByAlcoholVolumeId(
    targetPureAlcohol,
    currentAlcoholVolumeId,
    mt1AlcoholContent,
    mt2AlcoholContent
  );

  let initialVolume = {};
  for (const id of currentMaterialIds) {
    initialVolume[id] = 0;
  }

  const mt1Count = mt1Materials.length;
  const mt2Count = mt2Materials.length;

  if (mt1Count > 0) {
    const mt1Each = mt1Volume / mt1Count;
    for (const id of mt1Materials) {
      initialVolume[id] = mt1Each;
    }
  }

  if (mt2Count > 0) {
    const mt2Each = mt2Volume / mt2Count;
    for (const id of mt2Materials) {
      initialVolume[id] = mt2Each;
    }
  }

  const getAlcoholContentById = (materialId) => {
    const m = getMaterialById(materialId);
    if (!m) return null;
    if (m.type === 'mt1' || m.type === 'mt2') {
      return parseFloat(m.alcohol || 0) / 100;
    }
    return 0;
  };

  const alignedResult = alignVolumesToFiveMultiples(
    initialVolume,
    currentTotalVolume,
    targetPureAlcohol,
    getAlcoholContentById
  );

  const currentVolume = alignedResult.volumes;
  const alignedPureAlcohol = alignedResult.pureAlcohol;
  const actualAlcoholPercent = parseFloat(calculateActualAlcoholPercent(alignedPureAlcohol, currentTotalVolume).toFixed(1));

  const currentOtherVolume = currentTotalVolume - Object.values(currentVolume).reduce((sum, v) => sum + v, 0);

  let currentTasteRatio = calculateTastePreference(primaryTasteId, refuseTasteIds, tasteLevelId, secondaryTasteId);

  currentTasteRatio = subtractMaterialTaste(currentMaterialIds, currentTasteRatio);

  const currentMaterialRatio = getSourSweetRatio(currentTasteRatio.sourLevel, currentTasteRatio.sweetLevel);

  const hasSourOrSweet = currentMaterialIds.includes('d11') ||
    currentMaterialIds.includes('d12') ||
    currentMaterialIds.includes('d13') ||
    currentMaterialIds.includes('d14');

  if (hasSourOrSweet) {
    const sourLevel = levelToNumber(currentTasteRatio.sourLevel);
    const sweetLevel = levelToNumber(currentTasteRatio.sweetLevel);

    if (!hasMaterialWithTaste(currentMaterialIds, 't1') && sourLevel > 0) {
      if (!currentMaterialIds.includes('d11')) {
        currentMaterialIds.push('d11');
      }
    }
    if (!hasMaterialWithTaste(currentMaterialIds, 't2') && sweetLevel > 0) {
      if (!currentMaterialIds.includes('d13')) {
        currentMaterialIds.push('d13');
      }
    }
    if (!hasMaterialWithTaste(currentMaterialIds, 't3') && levelToNumber(currentTasteRatio.bitterLevel) > 0) {
      if (!currentMaterialIds.includes('d16')) {
        currentMaterialIds.push('d16');
      }
    }
    if (!hasMaterialWithTaste(currentMaterialIds, 't4') && levelToNumber(currentTasteRatio.spicyLevel) > 0) {
      if (!currentMaterialIds.includes('d15')) {
        currentMaterialIds.push('d15');
      }
    }

    for (const id of currentMaterialIds) {
      if ((id === 'd11' || id === 'd12' || id === 'd13' || id === 'd14') && !currentVolume.hasOwnProperty(id)) {
        currentVolume[id] = 0;
      }
    }

    const processedVolume = allocateSourSweetVolume(currentVolume, currentMaterialRatio, currentOtherVolume);

    for (const [key, val] of Object.entries(processedVolume)) {
      currentVolume[key] = val;
    }
  }

  const bitterLevel = levelToNumber(currentTasteRatio.bitterLevel);
  const spicyLevel = levelToNumber(currentTasteRatio.spicyLevel);

  const bitterUsage = bitterUsageData[`h${bitterLevel}`];
  const spicyUsage = spicyUsageData[`h${spicyLevel}`];

  if (bitterUsage && bitterUsage.usage > 0) {
    if (!currentMaterialIds.includes(bitterUsage.material)) {
      currentMaterialIds.push(bitterUsage.material);
    }
    currentVolume[bitterUsage.material] = bitterUsage.usage;
  }

  if (spicyUsage && spicyUsage.usage > 0) {
    if (!currentMaterialIds.includes(spicyUsage.material)) {
      currentMaterialIds.push(spicyUsage.material);
    }
    currentVolume[spicyUsage.material] = spicyUsage.usage;
  }

  const finalVolume = fillVolume(currentVolume, currentTotalVolume, currentMaterialIds);

  for (const id of Object.keys(finalVolume)) {
    const m = getMaterialById(id);
    if (m && m.unit === 'ml') {
      const vol = finalVolume[id];
      finalVolume[id] = Math.round(vol / 5) * 5;
    }
  }

  let mt4TotalVolume = 0;
  for (const id of currentMaterialIds) {
    const m = getMaterialById(id);
    if (m && m.type === 'mt4') {
      mt4TotalVolume += finalVolume[id] || 0;
    }
  }

  if (mt4TotalVolume < 20) {
    const missingVolume = 20 - mt4TotalVolume;
    
    const mt4WithZeroVolume = currentMaterialIds.filter(id => {
      const m = getMaterialById(id);
      return m && m.type === 'mt4' && finalVolume[id] === 0;
    });

    if (mt4WithZeroVolume.length > 0) {
      const addVolume = Math.ceil(missingVolume / mt4WithZeroVolume.length / 5) * 5;
      for (const id of mt4WithZeroVolume) {
        finalVolume[id] = addVolume;
      }
    } else {
      const allMt4 = currentMaterialIds.filter(id => {
        const m = getMaterialById(id);
        return m && m.type === 'mt4';
      });
      if (allMt4.length > 0) {
        const addVolume = Math.ceil(missingVolume / allMt4.length / 5) * 5;
        for (const id of allMt4) {
          finalVolume[id] = (finalVolume[id] || 0) + addVolume;
        }
      }
    }
  }

  currentMaterialIds = currentMaterialIds.filter(id => finalVolume[id] > 0);

  const recipeDetail = generateRecipeDetail(currentMethodId, currentMaterialIds, finalVolume);

  const materialsInfo = {};
  for (const id of currentMaterialIds) {
    const m = getMaterialById(id);
    if (m && finalVolume[id] > 0) {
      materialsInfo[id] = {
        name: m.name,
        type: m.type,
        volume: finalVolume[id] || 0,
        unit: m.unit || 'ml'
      };
    }
  }

  return {
    emotionId: currentEmotionId,
    toneId: currentToneId,
    methodId: currentMethodId,
    methodName: method.name,
    alcoholContent: actualAlcoholPercent,
    totalVolume: currentTotalVolume,
    materials: materialsInfo,
    detail: recipeDetail,
    tasteRatio: currentTasteRatio,
    sourSweetRatio: currentMaterialRatio,
    bitterUsage: bitterUsage,
    spicyUsage: spicyUsage
  };
}
