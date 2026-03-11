import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import Anthropic from '@anthropic-ai/sdk';
import { getStore } from '@netlify/blobs';
import sessionEnd from './session-end.js';
const { processSession } = sessionEnd;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const anthropic = new Anthropic();

var SUMMARISER_PROMPT = `You are a conversation summariser. Your job is to write a concise summary of a single exchange (one reader message + one agent response) from a Socratic dialogue.

Your summary must capture:
- What was discussed — the topic or sub-question explored in this exchange
- What the reader revealed — their position, reasoning, intuitions, personal experiences, emotional reactions
- Where in the argument the exchange sits — which part of the concept's progression this exchange belongs to
- Key phrases — distinctive words or phrases the reader used, preserved exactly as spoken

Write 2–4 sentences. Be specific and preserve the reader's exact language for key claims or phrases. These summaries will be used downstream to detect when the reader references earlier parts of the conversation, so distinctive language matters.

Output ONLY the summary text. No labels, no prefixes, no formatting.`;

var CONTEXT_ASSEMBLER_PROMPT = `You are a context assembler for a Socratic dialogue system. Your job is to read the reader's new message and determine whether it references, revisits, or contradicts anything from older exchanges (those beyond the most recent 4).

You will receive:
- The reader's new message
- Summaries of all exchanges
- The full text of all exchanges

RULES:
1. The last 4 exchanges are ALWAYS included verbatim. You do not need to decide anything about them.
2. All older exchanges are included as summaries by default.
3. Your ONLY job is to identify which older exchanges (if any) should be pulled in VERBATIM because the reader's new message references them.

What counts as a reference:
- Direct references: "Earlier you said...", "Going back to...", "Remember when I mentioned..."
- Topic revisits: The reader brings up a topic discussed in an older exchange, even without saying "earlier"
- Contradictions: The reader says something that contradicts a position they took in an older exchange

When in doubt, INCLUDE the exchange. A slightly larger context is better than losing track of something the reader is thinking about.

OUTPUT FORMAT:
Respond with a JSON array of exchange indices (1-based) that should be included verbatim, beyond the last 4. If no older exchanges need to be pulled in, respond with an empty array: []

Output ONLY the JSON array. No explanation, no other text.`;

function readInstruction(conceptSlug) {
  var candidates = [
    path.join(__dirname, 'content', 'instructions', conceptSlug + '.md'),
    path.join(__dirname, '..', 'content', 'instructions', conceptSlug + '.md'),
    path.join(process.cwd(), 'content', 'instructions', conceptSlug + '.md'),
    path.join('/var/task', 'content', 'instructions', conceptSlug + '.md')
  ];
  for (var i = 0; i < candidates.length; i++) {
    if (fs.existsSync(candidates[i])) {
      var raw = fs.readFileSync(candidates[i], 'utf-8');
      var parsed = matter(raw);
      return parsed.content;
    }
  }
  throw new Error('Instruction file not found for "' + conceptSlug + '". __dirname=' + __dirname + ', cwd=' + process.cwd() + '. Tried: ' + candidates.join(', '));
}

function buildMessagesRaw(exchanges, readerMessage) {
  var messages = [];
  for (var i = 0; i < exchanges.length; i++) {
    var ex = exchanges[i];
    if (ex.readerMessage) {
      messages.push({ role: 'user', content: ex.readerMessage });
    }
    messages.push({ role: 'assistant', content: ex.agentResponse });
  }
  if (readerMessage === '') {
    messages.push({ role: 'user', content: '[Opening exchange — no reader message. Generate your opening based on the concept instruction document.]' });
  } else {
    messages.push({ role: 'user', content: readerMessage });
  }
  return messages;
}

function formatContextBlock(exchanges, referencedIndices, readerMessage) {
  var lastFourStart = Math.max(0, exchanges.length - 4);
  var lines = ['CONVERSATION CONTEXT:\n'];

  for (var i = 0; i < exchanges.length; i++) {
    var ex = exchanges[i];
    var isLastFour = i >= lastFourStart;
    var isReferenced = referencedIndices.indexOf(ex.index) !== -1;

    if (isLastFour || isReferenced) {
      var label = isLastFour ? 'verbatim, recent' : 'verbatim, reader references this exchange';
      lines.push('[Exchange ' + ex.index + ' — ' + label + ']');
      if (ex.readerMessage) {
        lines.push('Reader: ' + ex.readerMessage);
      }
      lines.push('Agent: ' + ex.agentResponse);
      lines.push('');
    } else if (ex.summary) {
      lines.push('[Exchange ' + ex.index + ' summary]');
      lines.push(ex.summary);
      lines.push('');
    }
  }

  return lines.join('\n');
}

function buildMessagesWithContext(contextBlock, readerMessage) {
  var messages = [];
  messages.push({ role: 'user', content: contextBlock });
  messages.push({ role: 'assistant', content: 'I understand the conversation context. I will continue the dialogue from where we left off.' });
  if (readerMessage === '') {
    messages.push({ role: 'user', content: '[Opening exchange — no reader message. Generate your opening based on the concept instruction document.]' });
  } else {
    messages.push({ role: 'user', content: readerMessage });
  }
  return messages;
}

async function summariseExchange(exchange) {
  var userContent = 'Summarise this exchange:\n\n';
  if (exchange.readerMessage) {
    userContent += 'Reader: ' + exchange.readerMessage + '\n\n';
  }
  userContent += 'Agent: ' + exchange.agentResponse;

  var response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: SUMMARISER_PROMPT,
    messages: [{ role: 'user', content: userContent }]
  });

  return response.content[0].text;
}

async function summariseExchanges(exchanges) {
  var results = [];
  for (var i = 0; i < exchanges.length; i++) {
    var summary = await summariseExchange(exchanges[i]);
    results.push({ index: exchanges[i].index, summary: summary });
  }
  return results;
}

async function detectReferences(readerMessage, exchanges) {
  var summaryList = exchanges.map(function (ex) {
    return 'Exchange ' + ex.index + ': ' + (ex.summary || '(no summary)');
  }).join('\n');

  var exchangeList = exchanges.map(function (ex) {
    var text = 'Exchange ' + ex.index + ':\n';
    if (ex.readerMessage) text += 'Reader: ' + ex.readerMessage + '\n';
    text += 'Agent: ' + ex.agentResponse;
    return text;
  }).join('\n\n');

  var userContent = 'READER\'S NEW MESSAGE:\n' + readerMessage + '\n\n';
  userContent += 'EXCHANGE SUMMARIES:\n' + summaryList + '\n\n';
  userContent += 'FULL EXCHANGES:\n' + exchangeList;

  var response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: CONTEXT_ASSEMBLER_PROMPT,
    messages: [{ role: 'user', content: userContent }]
  });

  try {
    return JSON.parse(response.content[0].text);
  } catch (e) {
    return [];
  }
}

export default async function(request, context) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  var body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response('Invalid JSON', { status: 400 });
  }

  var sessionId = body.sessionId;
  var conceptSlug = body.conceptSlug;
  var message = body.message;

  if (!sessionId || !conceptSlug || message === undefined) {
    return new Response('Missing required fields', { status: 400 });
  }

  var instructionContent;
  try {
    instructionContent = readInstruction(conceptSlug);
  } catch (e) {
    return new Response('Instruction file not found for concept: ' + conceptSlug, { status: 404 });
  }

  var store = getStore('sessions');
  var session;
  try {
    var existing = await store.get(sessionId, { type: 'json' });
    session = existing || null;
  } catch (e) {
    session = null;
  }

  if (!session) {
    session = {
      conceptSlug: conceptSlug,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      exchanges: []
    };
  }

  var exchangeNumber = session.exchanges.length + 1;
  var messages;

  if (exchangeNumber <= 8) {
    messages = buildMessagesRaw(session.exchanges, message);
  } else {
    var referencedIndices = [];
    if (message !== '') {
      var olderExchanges = session.exchanges.slice(0, -4);
      if (olderExchanges.length > 0) {
        referencedIndices = await detectReferences(message, session.exchanges);
        var lastFourStart = session.exchanges.length - 4;
        referencedIndices = referencedIndices.filter(function (idx) {
          return idx <= lastFourStart;
        });
      }
    }
    var contextBlock = formatContextBlock(session.exchanges, referencedIndices, message);
    messages = buildMessagesWithContext(contextBlock, message);
  }

  var responseText = '';

  var encoder = new TextEncoder();
  var stream = new ReadableStream({
    async start(controller) {
      try {
        var apiStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: [
            {
              type: 'text',
              text: instructionContent,
              cache_control: { type: 'ephemeral' }
            }
          ],
          messages: messages
        });

        apiStream.on('text', function (text) {
          responseText += text;
          controller.enqueue(encoder.encode('data: ' + JSON.stringify({ token: text }) + '\n\n'));
        });

        await apiStream.finalMessage();

        controller.enqueue(encoder.encode('data: ' + JSON.stringify({ done: true }) + '\n\n'));

        var newExchange = {
          index: exchangeNumber,
          readerMessage: message,
          agentResponse: responseText,
          summary: null,
          timestamp: new Date().toISOString()
        };
        session.exchanges.push(newExchange);
        session.lastActiveAt = new Date().toISOString();

        await store.setJSON(sessionId, session);

        if (exchangeNumber >= 9) {
          if (exchangeNumber === 9) {
            var retroSummaries = await summariseExchanges(session.exchanges.slice(0, 8));
            for (var i = 0; i < retroSummaries.length; i++) {
              var s = retroSummaries[i];
              session.exchanges[s.index - 1].summary = s.summary;
            }
          }
          var currentSummary = await summariseExchange(newExchange);
          session.exchanges[session.exchanges.length - 1].summary = currentSummary;

          await store.setJSON(sessionId, session);
        }

        if (exchangeNumber >= 25) {
          processSession(sessionId).catch(function () {});
        }

        controller.enqueue(encoder.encode('data: ' + JSON.stringify({ ready: true }) + '\n\n'));
        controller.close();
      } catch (error) {
        console.error('Stream error:', error.message, error.stack);
        try {
          controller.enqueue(encoder.encode('data: ' + JSON.stringify({ error: error.message }) + '\n\n'));
          controller.enqueue(encoder.encode('data: ' + JSON.stringify({ done: true }) + '\n\n'));
          controller.close();
        } catch (e) {
          controller.close();
        }
      }
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

export const config = {
  path: '/.netlify/functions/conversation',
  includedFiles: ['content/instructions/**']
};
