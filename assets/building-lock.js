(function () {
  var KEY = 'borealis_public_unlock_v1';
  var PASS = 'duncan';
  if (sessionStorage.getItem(KEY) === '1') return;

  document.documentElement.classList.add('site-building-lock-active');

  var el = document.createElement('div');
  el.id = 'site-building-lock';
  el.className = 'site-building-lock';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'site-building-lock-title');
  el.innerHTML =
    '<div class="site-building-lock__card">' +
      '<div class="site-building-lock__icon"><i class="fas fa-lock" aria-hidden="true"></i></div>' +
      '<p id="site-building-lock-title" class="site-building-lock__note">We are building — site preview is password-only for now.</p>' +
      '<form class="site-building-lock__form">' +
        '<label class="site-building-lock__label" for="site-building-pw">Password</label>' +
        '<input type="password" id="site-building-pw" class="site-building-lock__input" autocomplete="current-password" placeholder="Password" required>' +
        '<p class="site-building-lock__err" hidden>Incorrect password.</p>' +
        '<button type="submit" class="btn btn-primary site-building-lock__btn">Enter site</button>' +
      '</form>' +
    '</div>';
  document.body.appendChild(el);

  var form = el.querySelector('form');
  var input = el.querySelector('input');
  var err = el.querySelector('.site-building-lock__err');
  input.focus();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (input.value === PASS) {
      sessionStorage.setItem(KEY, '1');
      document.documentElement.classList.remove('site-building-lock-active');
      el.remove();
      return;
    }
    err.hidden = false;
    input.value = '';
    input.focus();
  });
})();
