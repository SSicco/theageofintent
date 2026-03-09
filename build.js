const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ARTICLES_DIR = path.join(__dirname, 'content', 'articles');
const SITE_DIR = path.join(__dirname, 'site');
const ASSETS_DIR = path.join(__dirname, 'assets');

const REQUIRED_ARTICLE_FIELDS = ['title', 'slug', 'concept', 'description', 'domain', 'status'];

function validateArticle(data, filename) {
  const slug = path.basename(filename, '.md');
  const missing = REQUIRED_ARTICLE_FIELDS.filter(f => !data[f]);
  if (missing.length > 0) {
    throw new Error(`${filename}: missing frontmatter fields: ${missing.join(', ')}`);
  }
  if (data.slug !== slug) {
    throw new Error(`${filename}: slug "${data.slug}" does not match filename "${slug}"`);
  }
  if (data.status === 'published' && !data.content.trim()) {
    throw new Error(`${filename}: status is "published" but body is empty`);
  }
}

function conceptPageTemplate(article, articleHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article.title} — The Age of Intent</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body data-concept-slug="${article.slug}">
  <aside class="sidebar">
    <div class="sidebar-header">
      <a href="index.html" class="sidebar-title">The Age of Intent</a>
    </div>
    <nav class="sidebar-nav">
      <ul class="concept-list" id="concept-list"></ul>
    </nav>
  </aside>

  <header class="mobile-header">
    <button class="hamburger" id="hamburger-btn" aria-label="Open menu">
      <span></span>
      <span></span>
      <span></span>
    </button>
    <span class="mobile-title">The Age of Intent</span>
  </header>

  <div class="mobile-menu-backdrop" id="mobile-backdrop"></div>
  <nav class="mobile-menu" id="mobile-menu">
    <button class="mobile-menu-close" id="mobile-menu-close" aria-label="Close menu">&times;</button>
    <ul class="concept-list" id="mobile-concept-list"></ul>
  </nav>

  <main class="main-content">
    <div class="conversation-view" id="conversation-view">
      <div class="chat-area" id="chat-area">
        <div class="agent-label">Sicco</div>
      </div>
    </div>

    <div class="article-view" id="article-view" hidden>
      <article class="article-content">
        <h1>${article.title}</h1>
        <div class="article-domain">${article.domain}</div>
        ${articleHtml}
        <div class="article-footer">
          <button class="return-to-conversation" id="return-to-conversation">Return to conversation</button>
        </div>
      </article>
    </div>

    <div class="input-bar" id="input-bar">
      <div class="exchange-countdown" id="exchange-countdown" hidden></div>
      <div class="timeout-countdown" id="timeout-countdown" hidden></div>
      <div class="input-bar-inner">
        <textarea id="message-input" placeholder="Type your message..." rows="1"></textarea>
        <button class="article-toggle-btn" id="article-toggle-btn" title="Read the article">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm1 3v2h10V6H5zm0 4v2h10v-2H5zm0 4v1h6v-1H5z" fill="currentColor"/>
          </svg>
        </button>
        <button class="send-btn" id="send-btn" title="Send message">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10l7-7v4.5c0 .28.22.5.5.5h6a.5.5 0 01.43.75l-3 5A.5.5 0 0113.5 14H10.5a.5.5 0 00-.5.5V19l-7-9z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  </main>

  <script src="js/navigation.js"></script>
  <script src="js/conversation.js"></script>
</body>
</html>`;
}

function landingPageTemplate(articles) {
  const conceptCards = articles
    .sort((a, b) => a.concept - b.concept)
    .map(a => `      <a href="${a.slug}.html" class="concept-card">
        <span class="concept-number">${a.concept}</span>
        <div class="concept-card-body">
          <h2 class="concept-card-title">${a.title}</h2>
          <p class="concept-card-description">${a.description}</p>
          <span class="concept-card-domain">${a.domain}</span>
        </div>
      </a>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Age of Intent</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <section class="hero">
    <div class="hero-content">
      <h1 class="hero-title">The Age of Intent</h1>
      <p class="hero-tagline">What happens when the source of truth is no longer code?</p>
    </div>
  </section>

  <section class="concept-list-section">
    <div class="concept-list-container">
${conceptCards}
    </div>
  </section>
</body>
</html>`;
}

function build() {
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    console.log('No article files found in content/articles/');
    return;
  }

  const articles = [];

  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(raw);

    parsed.data.content = parsed.content;
    validateArticle(parsed.data, file);

    if (parsed.data.status !== 'published') {
      console.log(`Skipping ${file} (status: ${parsed.data.status})`);
      continue;
    }

    const articleHtml = marked(parsed.content);
    const pageHtml = conceptPageTemplate(parsed.data, articleHtml);
    const outputPath = path.join(SITE_DIR, `${parsed.data.slug}.html`);
    fs.writeFileSync(outputPath, pageHtml);
    console.log(`Built ${parsed.data.slug}.html`);

    articles.push(parsed.data);
  }

  const landingHtml = landingPageTemplate(articles);
  fs.writeFileSync(path.join(SITE_DIR, 'index.html'), landingHtml);
  console.log('Built index.html');

  const imagesDir = path.join(SITE_DIR, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  const portraitSrc = path.join(ASSETS_DIR, 'portrait.jpg');
  if (fs.existsSync(portraitSrc)) {
    fs.copyFileSync(portraitSrc, path.join(imagesDir, 'portrait.jpg'));
    console.log('Copied portrait.jpg to site/images/');
  }

  console.log('Build complete.');
}

build();
