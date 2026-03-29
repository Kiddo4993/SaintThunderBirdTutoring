// Hide page immediately to prevent flash
document.documentElement.style.display = 'none';

const skipIntro = localStorage.getItem('skip_intro');

if (skipIntro === 'true') {
    localStorage.removeItem('skip_intro');
    document.documentElement.style.display = 'block';
} else {
    localStorage.setItem('skip_intro', 'true');
    window.location.replace('loading.html');
}
