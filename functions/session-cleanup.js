const { getStore } = require('@netlify/blobs');
const { processSession } = require('./session-end');

var ONE_HOUR_MS = 60 * 60 * 1000;

exports.handler = async function () {
  var store = getStore('sessions');
  var now = Date.now();

  var { blobs } = await store.list();

  for (var i = 0; i < blobs.length; i++) {
    var key = blobs[i].key;
    try {
      var session = await store.get(key, { type: 'json' });
      if (!session) continue;
      if (session.sessionSummary) continue;

      var lastActive = new Date(session.lastActiveAt).getTime();
      if (now - lastActive > ONE_HOUR_MS) {
        await processSession(key);
      }
    } catch (e) {
      continue;
    }
  }

  return { statusCode: 200, body: 'Cleanup complete' };
};

exports.config = {
  schedule: '*/15 * * * *'
};
