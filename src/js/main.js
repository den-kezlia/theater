let performancesToggle = document.getElementById('js-performances__toggle');

performancesToggle.addEventListener('click', function() {
    let block = document.getElementById('js-performances');
    block.classList.toggle('performances--collapsed');
});
