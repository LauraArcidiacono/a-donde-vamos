import {
  TAGS,
  TAG_LABELS,
  CITIES,
  MG1_QUESTIONS,
  MG2_IMPORTANT_OPTIONS,
  MG2_NOWANT_OPTIONS,
  SCORING_WEIGHTS,
  EPSILON,
} from '../public/data.js';

export function computeResults(room) {
  const [player1, player2] = room.players;

  const p1Scores = computePlayerScores(player1);
  const p2Scores = computePlayerScores(player2);

  const p1Top4 = getTopCities(p1Scores, 4);
  const p2Top4 = getTopCities(p2Scores, 4);

  // Combined scores
  const combinedScores = {};
  for (const city of CITIES) {
    combinedScores[city.id] = ((p1Scores[city.id] || 0) + (p2Scores[city.id] || 0)) / 2;
  }
  const combinedTop5 = getTopCities(combinedScores, 5);

  // Find coincidences
  const p1Top4Ids = new Set(p1Top4.map(c => c.cityId));
  const p2Top4Ids = new Set(p2Top4.map(c => c.cityId));
  const coincidences = [...p1Top4Ids].filter(id => p2Top4Ids.has(id));

  // Build tag profiles
  const p1Profile = buildTagProfile(player1);
  const p2Profile = buildTagProfile(player2);

  // Build penalty explanations
  const p1Penalties = buildPenaltyExplanation(player1);
  const p2Penalties = buildPenaltyExplanation(player2);

  return {
    player1: { id: player1.id, name: player1.name, top4: p1Top4, tagProfile: p1Profile },
    player2: { id: player2.id, name: player2.name, top4: p2Top4, tagProfile: p2Profile },
    combined: { top5: combinedTop5 },
    coincidences,
    penalties: { player1: p1Penalties, player2: p2Penalties }
  };
}

function computePlayerScores(player) {
  const scores = {};

  const mg1Prefs = buildMG1Preferences(player);
  const mg2Prefs = buildMG2ImportantPreferences(player);
  const mg3Prefs = buildMG3Preferences(player);

  const noWantData = getNoWantData(player);

  for (const city of CITIES) {
    // Normalize city tags: t_i = T_i / 2 (0..2 -> 0..1)
    const normalizedCityTags = {};
    for (const tag of TAGS) {
      normalizedCityTags[tag] = (city.tags[tag] || 0) / 2;
    }

    const s1 = computeSimilarity(mg1Prefs, normalizedCityTags);
    const s2 = computeSimilarity(mg2Prefs, normalizedCityTags);
    const s3 = computeSimilarity(mg3Prefs, normalizedCityTags);

    let finalScore = SCORING_WEIGHTS.mg1 * s1 + SCORING_WEIGHTS.mg2 * s2 + SCORING_WEIGHTS.mg3 * s3;
    finalScore = applyNoWantPenalties(finalScore, city, normalizedCityTags, noWantData);

    scores[city.id] = finalScore;
  }

  return scores;
}

export function buildMG1Preferences(player) {
  const prefs = {};
  for (const tag of TAGS) {
    prefs[tag] = 0;
  }

  for (const question of MG1_QUESTIONS) {
    const key = `mg1_${question.id}`;
    const selectedIds = player.answers[key] || [];
    for (const optId of selectedIds) {
      const option = question.options.find(o => o.id === optId);
      if (option && option.tags) {
        for (const [tag, weight] of Object.entries(option.tags)) {
          prefs[tag] = (prefs[tag] || 0) + weight;
        }
      }
    }
  }

  return normalizePrefs(prefs);
}

export function buildMG2ImportantPreferences(player) {
  const prefs = {};
  for (const tag of TAGS) {
    prefs[tag] = 0;
  }

  const selectedIds = player.answers.mg2_important || [];
  for (const optId of selectedIds) {
    const option = MG2_IMPORTANT_OPTIONS.find(o => o.id === optId);
    if (option && option.tags) {
      for (const [tag, weight] of Object.entries(option.tags)) {
        prefs[tag] = (prefs[tag] || 0) + weight;
      }
    }
  }

  return normalizePrefs(prefs);
}

export function buildMG3Preferences(player) {
  const prefs = {};
  const sliderValues = player.answers.mg3 || {};

  for (const tag of TAGS) {
    // p_i = (slider_value - 1) / 4  (1..5 -> 0..1)
    const val = sliderValues[tag] !== undefined ? sliderValues[tag] : 3;
    prefs[tag] = (val - 1) / 4;
  }

  return prefs;
}

export function normalizePrefs(prefs) {
  let maxVal = 0;
  for (const tag of TAGS) {
    if ((prefs[tag] || 0) > maxVal) {
      maxVal = prefs[tag];
    }
  }
  if (maxVal > 0) {
    for (const tag of TAGS) {
      prefs[tag] = (prefs[tag] || 0) / maxVal;
    }
  }
  return prefs;
}

export function computeSimilarity(prefs, cityTags) {
  let numerator = 0;
  let denominator = 0;

  for (const tag of TAGS) {
    const p = prefs[tag] || 0;
    const t = cityTags[tag] || 0;
    numerator += p * t;
    denominator += p;
  }

  return numerator / (denominator + EPSILON);
}

export function getNoWantData(player) {
  const selectedIds = player.answers.mg2_nowant || [];
  const selections = [];

  for (const optId of selectedIds) {
    const option = MG2_NOWANT_OPTIONS.find(o => o.id === optId);
    if (option) {
      selections.push(option);
    }
  }

  return selections;
}

export function applyNoWantPenalties(score, city, normalizedCityTags, noWantSelections) {
  let totalPenalty = 0;

  for (const option of noWantSelections) {
    // Tag-based penalties
    if (option.penalty) {
      for (const [tag, penaltyAmount] of Object.entries(option.penalty)) {
        const cityTagValue = normalizedCityTags[tag] || 0;

        if (penaltyAmount < 0) {
          // Negative penalty (e.g., no_aburrido): penalize cities WITH this tag
          totalPenalty += Math.abs(penaltyAmount) * cityTagValue;
        } else {
          // Positive penalty: penalize cities WITHOUT this tag
          totalPenalty += penaltyAmount * (1 - cityTagValue);
        }
      }
    }

    // Direct city penalty
    if (option.affectedCities && option.affectedCities.includes(city.id)) {
      totalPenalty += option.cityPenalty || 0.05;
    }

    // Boost tag (inverted penalty - boosts instead of penalizes)
    if (option.boostTag) {
      const boostAmount = option.boostAmount || 0.05;
      const cityTagValue = normalizedCityTags[option.boostTag] || 0;
      totalPenalty -= boostAmount * cityTagValue;
    }
  }

  // Cap total penalty at 0.15 (15%)
  totalPenalty = Math.max(0, Math.min(totalPenalty, 0.15));

  return score * (1 - totalPenalty);
}

export function getTopCities(scores, count) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([cityId, score]) => {
      const city = CITIES.find(c => c.id === cityId);
      return {
        cityId,
        name: city ? city.name : cityId,
        country: city ? city.country : '',
        score: Math.round(score * 1000) / 1000,
        topTags: getTopTagsForCity(city)
      };
    });
}

function getTopTagsForCity(city) {
  if (!city) return [];
  return Object.entries(city.tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .filter(([, val]) => val > 0)
    .map(([tag]) => ({ tag, label: TAG_LABELS[tag] || tag }));
}

function buildTagProfile(player) {
  const profile = {};

  const mg1 = buildMG1Preferences(player);
  const mg2 = buildMG2ImportantPreferences(player);
  const mg3 = buildMG3Preferences(player);

  for (const tag of TAGS) {
    const combined = (SCORING_WEIGHTS.mg1 * (mg1[tag] || 0))
                   + (SCORING_WEIGHTS.mg2 * (mg2[tag] || 0))
                   + (SCORING_WEIGHTS.mg3 * (mg3[tag] || 0));
    profile[tag] = {
      tag,
      label: TAG_LABELS[tag] || tag,
      score: Math.round(combined * 1000) / 1000
    };
  }

  return profile;
}

function buildPenaltyExplanation(player) {
  const selectedIds = player.answers.mg2_nowant || [];
  const explanations = [];

  for (const optId of selectedIds) {
    const option = MG2_NOWANT_OPTIONS.find(o => o.id === optId);
    if (option) {
      explanations.push({
        id: option.id,
        label: option.label,
        affectedCities: option.affectedCities || [],
        penaltyTags: Object.keys(option.penalty || {}),
        boostTag: option.boostTag || null
      });
    }
  }

  return explanations;
}
