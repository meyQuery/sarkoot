const aside = document.querySelector('#aside');
const asideBtn = document.querySelector('#aside-btn');
function handleAside(event) {
    aside.classList.add('open');
}
if (asideBtn)
{
    asideBtn.addEventListener('click', handleAside);
}

const profile = document.querySelector('.profile');

if (profile)
{
    const dropdown = document.querySelector('.profile-dropdown');

    function handleProfileClick(event) {
        dropdown.classList.add('open');
    }
    profile.addEventListener('click', handleProfileClick);
    window.addEventListener('click', function(event) {
        if (!event.target.closest('.profile-div')) {
            dropdown.classList.remove('open');
        }
        if (!event.target.closest('#aside') && !event.target.closest('#aside-btn')) {
            aside.classList.remove('open');
        }
    });
}


$(document).ready(function() {
    if ($.fn.select2)
    {
        $('.select2').select2();
    }
});