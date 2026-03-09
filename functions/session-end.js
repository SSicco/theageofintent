const Anthropic = require('@anthropic-ai/sdk');
const { getStore } = require('@netlify/blobs');

const anthropic = new Anthropic();

var SESSION_END_PROMPT = `You are a session analyst for a Socratic dialogue system. You will receive the complete transcript of a conversation between a reader and an AI agent about a specific concept. Your job is to produce two outputs in a single response.

OUTPUT 1: SESSION SUMMARY
Write a prose summary (1–2 paragraphs) of the entire conversation. Include:
- Which concept was discussed
- Where the reader ended up — did they reach the concept's insight? Did they articulate it in their own words? Did they get stuck?
- The reader's journey — how their thinking evolved. Not a list of topics, but a narrative arc: where they started, what shifted, what resisted.
- Key moments — 2–4 specific exchanges where something significant happened
- What the reader brought — their context, domain, personal experiences, analogies

OUTPUT 2: EXTRACTED CONTRIBUTIONS
Scan every reader message for moments that fall into these categories:
- novel-framing: The reader described the concept using an analogy or framing the author hadn't considered
- strong-objection: The reader pushed back in a way that exposed a weakness in the argument
- invalidating-argument: The reader made an argument that challenges the entire concept's validity (highest priority)
- personal-application: The reader applied the concept to their own domain in a revealing way
- articulated-insight: The reader stated the concept's core insight in their own words
- sticking-point: The reader got confused or stuck, suggesting the argument needs work

For each contribution found, include: the exchange index, the type, the exact reader message, the preceding agent message, and a brief note explaining why it's notable.

It is perfectly valid to find zero contributions. Do not force classifications.

RESPONSE FORMAT:
Respond with a JSON object:
{
  "sessionSummary": "The prose summary...",
  "contributions": [
    {
      "exchangeIndex": 5,
      "type": "novel-framing",
      "readerMessage": "exact reader message",
      "agentMessage": "the agent message that preceded it",
      "note": "why this is notable"
    }
  ]
}

Output ONLY the JSON object. No other text.`;

async function processSession(sessionId) {
  var store = getStore('sessions');
  var session;
  try {
    session = await store.get(sessionId, { type: 'json' });
  } catch (e) {
    return;
  }

  if (!session || session.sessionSummary) return;

  var transcript = session.exchanges.map(function (ex) {
    var text = 'Exchange ' + ex.index + ':\n';
    if (ex.readerMessage) text += 'Reader: ' + ex.readerMessage + '\n';
    text += 'Agent: ' + ex.agentResponse;
    return text;
  }).join('\n\n');

  var userContent = 'CONCEPT: ' + session.conceptSlug + '\n\n';
  userContent += 'FULL TRANSCRIPT:\n\n' + transcript;

  var response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: SESSION_END_PROMPT,
    messages: [{ role: 'user', content: userContent }]
  });

  var result;
  try {
    result = JSON.parse(response.content[0].text);
  } catch (e) {
    session.sessionSummary = 'Session processed but output could not be parsed.';
    await store.setJSON(sessionId, session);
    return;
  }

  session.sessionSummary = result.sessionSummary;
  await store.setJSON(sessionId, session);

  if (result.contributions && result.contributions.length > 0) {
    var contributionsStore = getStore('contributions');
    var conceptKey = session.conceptSlug;
    var existing = [];
    try {
      var raw = await contributionsStore.get(conceptKey, { type: 'json' });
      if (raw) existing = raw;
    } catch (e) {
      existing = [];
    }

    var timestamp = new Date().toISOString();
    for (var i = 0; i < result.contributions.length; i++) {
      var c = result.contributions[i];
      existing.push({
        sessionId: sessionId,
        conceptSlug: session.conceptSlug,
        timestamp: timestamp,
        exchangeIndex: c.exchangeIndex,
        type: c.type,
        readerMessage: c.readerMessage,
        agentMessage: c.agentMessage,
        note: c.note
      });
    }

    await contributionsStore.setJSON(conceptKey, existing);
  }
}

module.exports = { processSession };
