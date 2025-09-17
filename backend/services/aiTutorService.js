// Simple AI Tutor service with pluggable provider.
// Returns structured responses with subject-aware tips. Now accepts any topic.
let OpenAIClient = null;
const FORCE_BUILTIN = String(process.env.AI_FORCE_BUILTIN || '').toLowerCase() === 'true';
try {
  OpenAIClient = require('openai');
} catch (e) {
  OpenAIClient = null;
}

function generateEducationalResponse(question = '', subject = 'general') {
  const q = String(question || '').trim();
  const lowerQ = q.toLowerCase();

  // Mini knowledge base for common terms
  const definitions = {
    biology: 'the study of living organisms, their structure, function, growth, evolution, and interactions',
    photosynthesis: 'the process by which green plants and some organisms convert light energy into chemical energy (glucose)',
    osmosis: 'the diffusion of water across a semipermeable membrane from low to high solute concentration',
    mitosis: 'the process of eukaryotic cell division that produces two genetically identical daughter cells',
    algorithm: 'a finite, step-by-step procedure for solving a problem or performing a computation',
    'big-o notation': 'a mathematical notation that describes the upper bound of an algorithm’s time or space growth rate',
    derivative: 'the instantaneous rate of change of a function, or the slope of its tangent line',
    matrix: 'a rectangular array of numbers or symbols arranged in rows and columns',
    entropy: 'a measure of disorder or the number of possible microstates of a system',
    database: 'an organized collection of structured information stored and accessed electronically',
    api: 'an interface that lets one piece of software programmatically interact with another',
    gdp: 'the total monetary value of all final goods and services produced within a country in a given period',
    inflation: 'a sustained increase in the general price level of goods and services over time'
  };

  // Try to extract a topic from common question forms
  let topic = '';
  const m = lowerQ.match(/^(?:what\s+is|define|explain)\s+(.+?)(?:\?|$)/i);
  if (m && m[1]) {
    topic = m[1].trim().replace(/\.$/, '');
  } else if (lowerQ.length <= 40) {
    // Single-word or short-topic queries like "biology"
    topic = lowerQ.replace(/\?$/, '').trim();
  }

  const prettyTopic = topic ? topic.replace(/\b\w/g, c => c.toUpperCase()) : '';
  const defKey = topic && Object.keys(definitions).find(k => k === topic || topic.includes(k));
  const coreDef = defKey ? definitions[defKey] : null;

  if (coreDef) {
    return `Definition: ${prettyTopic || 'This concept'} is ${coreDef}.

Key points:
- Scope: where it applies and why it matters in ${subject || 'your course'}
- Related terms: learn common variations and examples
- Typical questions: definitions, differences, and simple applications

Example:
- For instance, teachers may ask you to identify ${prettyTopic || 'the concept'} in a short scenario and justify your answer.

Summary: Focus on understanding the idea in plain language, then practice with small questions to solidify it.`;
  }

  // Generic structured explanation when we don't have a canned definition
  const leadins = {
    mathematics: [
      "Great math question! Let me break this down step by step for you.",
      "Mathematics is all about patterns and logic. Here's how I'd approach this problem:",
      "This is a classic problem in mathematics. Let me explain the concept first, then we'll solve it together.",
    ],
    science: [
      "Excellent science question! Let's explore this concept together.",
      "Science is fascinating! This relates to some fundamental principles. Let me explain:",
      "Great observation! This touches on an important scientific principle. Here's what's happening:",
    ],
    programming: [
      "Nice coding question! Let's debug this step by step.",
      "Programming is about breaking problems into smaller pieces. Here's my approach:",
      "Great question! This is a common challenge in programming. Let me show you a solution:",
    ],
    writing: [
      "Excellent writing question! Let me help you improve your composition.",
      "Writing is an art! Here are some techniques that can help:",
      "Great question about writing! Let's work on making your text more engaging:",
    ],
    general: [
      "That's a thoughtful question! Let me help you understand this better.",
      "Great question! I'm here to help you learn. Here's my explanation:",
      "Thanks for asking! Learning is a journey, and I'm here to guide you:",
    ],
  };

  const additions = {
    mathematics: "\n\n🔢 Steps to approach math problems:\n1) Identify knowns and unknowns\n2) Choose relevant formulas\n3) Solve step-by-step\n4) Verify the result\n\nWould you like me to work through a concrete example?",
    science: "\n\n🔬 Scientific thinking:\n1) Observe\n2) Hypothesize\n3) Experiment\n4) Analyze\n5) Conclude\n\nWhich area (physics/chemistry/biology) should we focus on?",
    programming: "\n\n💻 Coding checklist:\n1) Reproduce the issue\n2) Read error messages\n3) Minimize to a small test\n4) Fix iteratively\n5) Add tests\n\nWhat language or stack are you using?",
    writing: "\n\n✍️ Writing tips:\n- Start with a clear thesis\n- Use topic sentences\n- Support with evidence\n- Revise for clarity\n\nWhat genre or assignment are you working on?",
    general: "\n\n🎓 Study strategy:\n- Break topics into chunks\n- Use active recall\n- Spaced repetition\n- Teach back to solidify\n\nWhat specific area should we tackle next?",
  };

  const list = leadins[subject] || leadins.general;
  const lead = list[Math.floor(Math.random() * list.length)];
  const add = additions[subject] || additions.general;

  // More substantive generic response
  return `${lead}

Here is a clear explanation in steps:
1) Plain-language definition: Describe the core idea in simple terms.
2) Key points: List 2–3 essential facts or properties.
3) Quick example: Show a minimal example to illustrate.
4) Common pitfalls: Mention one mistake to avoid.

Applied to your question:
- Topic: ${q || 'your topic'}
- Subject context: ${subject || 'general'}

${add}`;
}

async function generateAnswer(question, subject = 'general') {
  try {
    if (!FORCE_BUILTIN && process.env.OPENAI_API_KEY && OpenAIClient) {
      const openai = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY });
      const system = 'You are a helpful, accurate AI study tutor. Match the user\'s requested format and level of detail. If no format is specified, give a clear, step-by-step explanation with key points, examples, and a brief summary. When a simple visual helps, include up to 2 relevant images as Markdown links like ![alt](URL) using reputable sources (e.g., Wikimedia/Wikipedia). Do not include images if they are not helpful.';
      const userPrompt = `Subject: ${subject}\nQuestion: ${question}`;
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 600,
      });
      const content = (completion.choices?.[0]?.message?.content || '').trim();
      if (content) return content;
    }
  } catch (err) {
    // fall back to local response if OpenAI fails
  }
  return generateEducationalResponse(question, subject);
}

module.exports = {
  generateAnswer,
};

// Helper: direct fallback (concise, no preamble)
function generateDirectFallback(question = '', subject = 'general') {
  const q = String(question || '').trim();
  const lowerQ = q.toLowerCase();
  const definitions = {
    biology: 'the study of living organisms, how they function, interact, and evolve',
    photosynthesis: 'the process plants use to convert light, water, and CO₂ into glucose and O₂',
    osmosis: 'the movement of water across a semipermeable membrane toward higher solute concentration',
    mitosis: 'eukaryotic cell division producing two identical daughter cells',
    algorithm: 'a step‑by‑step procedure for solving a problem or performing a computation',
  };
  let topic = '';
  const m = lowerQ.match(/^(?:what\s+is|define|explain)\s+(.+?)(?:\?|$)/i);
  if (m && m[1]) topic = m[1].trim();
  else if (lowerQ.length <= 40) topic = lowerQ.replace(/\?$/, '').trim();
  const defKey = topic && Object.keys(definitions).find(k => k === topic || topic.includes(k));
  if (defKey) return definitions[defKey] + '.';
  return `${q || 'This topic'}: a concise explanation involves (1) a plain definition, (2) 2–3 key points, and (3) one short example.`;
}

// Extended API returning metadata for UI badges
async function generateAnswerWithMeta(question, subject = 'general', options = {}) {
  try {
    if (process.env.OPENAI_API_KEY && OpenAIClient) {
      const openai = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY });
      const direct = options && options.direct;
      const system = direct
        ? "You are a helpful, accurate AI study tutor. Provide a direct answer without preamble or headings. No 'Q:'/'A:' labels. Be concise but clear; include a minimal example only if helpful. Include at most 1 Markdown image link only if it truly clarifies the concept."
        : "You are a helpful, accurate AI study tutor. Match the user's requested format and level of detail. If no format is specified, give a clear, step-by-step explanation with key points, examples, and a brief summary. When a simple visual helps, include up to 2 relevant images as Markdown links like ![alt](URL) using reputable sources (e.g., Wikimedia/Wikipedia). Do not include images if they are not helpful.";
      const userPrompt = `Subject: ${subject}\nQuestion: ${question}`;
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt }
        ],
        temperature: direct ? 0.2 : 0.3,
        max_tokens: direct ? 250 : 600,
      });
      const content = (completion.choices?.[0]?.message?.content || '').trim();
      if (content) return { answer: content, provider: 'openai', model: completion.model || (process.env.OPENAI_MODEL || 'gpt-3.5-turbo') };
    }
  } catch (e) {
    // ignore and fallback
  }
  // Built-in fallback
  const direct = options && options.direct;
  const answer = direct ? generateDirectFallback(question, subject) : generateEducationalResponse(question, subject);
  return { answer, provider: 'builtin', model: 'study-hive-ai' };
}

module.exports.generateAnswerWithMeta = generateAnswerWithMeta;
