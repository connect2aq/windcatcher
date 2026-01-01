// Header HTML template
const headerHTML = `
<header class="site-header">
    <nav class="nav-container">
        <a href="index.html" class="nav-logo">WindCatcher</a>
        <ul class="nav-links">
            <li><a href="index.html" data-page="index">Home</a></li>
            <li><a href="overview.html" data-page="overview">Overview</a></li>
            <li><a href="section-01.html" data-page="section-01">Inlet Design</a></li>
            <li><a href="section-03.html" data-page="section-03">Nose Cone</a></li>
            <li><a href="section-04.html" data-page="section-04">Vanes</a></li>
            <li><a href="section-05.html" data-page="section-05">MVG</a></li>
            <li><a href="section-06.html" data-page="section-06">Diffuser</a></li>
            <li><a href="section-07.html" data-page="section-07">Summary</a></li>
            <li><a href="appendix.html" data-page="appendix">Appendix</a></li>
            <li><a href="citations.html" data-page="citations">Citations</a></li>
        </ul>
    </nav>
</header>
`;

// Load header on page load
document.addEventListener('DOMContentLoaded', function() {
    // Insert header
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        headerPlaceholder.innerHTML = headerHTML;
        // Set active page
        setActivePage();
    }
});

// Set active navigation link based on current page
function setActivePage() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('data-page');
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
}
