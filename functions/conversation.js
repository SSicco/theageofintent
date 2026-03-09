const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const Anthropic = require('@anthropic-ai/sdk');
const { getStore } = require('@netlify/blobs');

const anthropic = new Anthropic();

function readInstruction(conceptSlug) {
  const filePath = path.join(__dirname, '..', 'content', 'instructions', conceptSlug + '.md');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = matter(raw);
  return parsed.content;
}

function buildMessages(instructionContent, exchanges, readerMessage) {
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

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  var body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  var sessionId = body.sessionId;
  var conceptSlug = body.conceptSlug;
  var message = body.message;

  if (!sessionId || !conceptSlug || message === undefined) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  var instructionContent;
  try {
    instructionContent = readInstruction(conceptSlug);
  } catch (e) {
    return { statusCode: 404, body: 'Instruction file not found for concept: ' + conceptSlug };
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

  var messages = buildMessages(instructionContent, session.exchanges, message);

  var responseText = '';

  var encoder = new TextEncoder();
  var stream = new ReadableStream({
    async start(controller) {
      try {
        var apiStream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6-20250514',
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
          index: session.exchanges.length + 1,
          readerMessage: message,
          agentResponse: responseText,
          summary: null,
          timestamp: new Date().toISOString()
        };
        session.exchanges.push(newExchange);
        session.lastActiveAt = new Date().toISOString();

        await store.setJSON(sessionId, session);

        controller.enqueue(encoder.encode('data: ' + JSON.stringify({ ready: true }) + '\n\n'));
        controller.close();
      } catch (error) {
        try {
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
};
