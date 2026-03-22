function loadUser() {
  fetch('/api/session', {credentials: 'include'})
  .then(res => res.json())
  .then(data => {
    if (data.user) {
      // Add welcome
      let welcome = document.getElementById('user-welcome');
      if (!welcome) {
        welcome = document.createElement('li');
        welcome.id = 'user-welcome';
        welcome.className = 'nav-item';
        welcome.innerHTML = 'Welcome, ' + data.user.name;
        const nav = document.querySelector('.navbar-nav');
        if (nav) nav.appendChild(welcome);
      }
      
      // Add logout
      let logout = document.getElementById('logout-link');
      if (!logout) {
        logout = document.createElement('li');
        logout.id = 'logout-link';
        logout.className = 'nav-item';
        logout.innerHTML = '<a class="nav-link" href="#" onclick="logoutUser()">Logout</a>';
        const nav = document.querySelector('.navbar-nav');
        if (nav) nav.appendChild(logout);
      }
      
      // Hide login
      const logins = document.querySelectorAll('a[href*="login"]');
      logins.forEach(link => link.closest('li').style.display = 'none');
    }
  })
  .catch(() => {});
}

function logoutUser() {
  fetch('/api/logout', {method: 'POST', credentials: 'include'})
  .then(() => location.reload());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadUser);
} else {
  loadUser();
}

