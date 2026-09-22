document.addEventListener('DOMContentLoaded', function () {
  var dropdowns = document.querySelectorAll('.dropdown');

  dropdowns.forEach(function (dd) {
    var toggle = dd.querySelector('.dropdown-toggle');

    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      var isOpen = dd.classList.contains('open');
      closeAll();
      if (!isOpen) dd.classList.add('open');
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.dropdown')) closeAll();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll();
  });

  function closeAll() {
    dropdowns.forEach(function (dd) {
      dd.classList.remove('open');
    });
  }
});