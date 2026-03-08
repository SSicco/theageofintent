var hamburger = document.getElementById('hamburger');
var sidebar = document.getElementById('sidebar');

hamburger.addEventListener('click', function () {
  sidebar.classList.toggle('sidebar-open');
});
