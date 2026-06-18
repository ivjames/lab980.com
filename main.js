document.querySelector('.cta-secondary').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('projects').scrollIntoView({ behavior: 'smooth' });
});