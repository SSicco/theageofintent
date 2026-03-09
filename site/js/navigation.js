(function () {
  var hamburgerBtn = document.getElementById('hamburger-btn');
  var mobileBackdrop = document.getElementById('mobile-backdrop');
  var mobileMenu = document.getElementById('mobile-menu');
  var mobileMenuClose = document.getElementById('mobile-menu-close');
  var articleToggleBtn = document.getElementById('article-toggle-btn');
  var returnToConversation = document.getElementById('return-to-conversation');
  var conversationView = document.getElementById('conversation-view');
  var articleView = document.getElementById('article-view');

  var conversationScrollTop = 0;
  var articleScrollTop = 0;
  var currentView = 'conversation';

  function openMobileMenu() {
    mobileMenu.classList.add('open');
    mobileBackdrop.classList.add('open');
  }

  function closeMobileMenu() {
    mobileMenu.classList.remove('open');
    mobileBackdrop.classList.remove('open');
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', openMobileMenu);
  }
  if (mobileBackdrop) {
    mobileBackdrop.addEventListener('click', closeMobileMenu);
  }
  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', closeMobileMenu);
  }

  function switchToArticle() {
    if (currentView === 'article') return;
    conversationScrollTop = conversationView.scrollTop || window.scrollY;
    currentView = 'article';
    conversationView.style.display = 'none';
    articleView.hidden = false;
    articleView.style.display = '';
    articleToggleBtn.classList.add('active');
    articleView.scrollTop = articleScrollTop;
  }

  function switchToConversation() {
    if (currentView === 'conversation') return;
    articleScrollTop = articleView.scrollTop || window.scrollY;
    currentView = 'conversation';
    articleView.hidden = true;
    articleView.style.display = '';
    conversationView.style.display = '';
    articleToggleBtn.classList.remove('active');
    var chatArea = document.getElementById('chat-area');
    if (chatArea) {
      chatArea.scrollTop = conversationScrollTop;
    }
  }

  if (articleToggleBtn) {
    articleToggleBtn.addEventListener('click', function () {
      if (currentView === 'conversation') {
        switchToArticle();
      } else {
        switchToConversation();
      }
    });
  }

  if (returnToConversation) {
    returnToConversation.addEventListener('click', switchToConversation);
  }
})();
