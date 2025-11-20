(function () {
    "use strict"; window.onload = function () { window.setTimeout(fadeout, 500); }
    function fadeout() {
        var preloader = document.querySelector('.preloader');
        if (preloader) {
            document.querySelector('.preloader').style.opacity = '0';
            document.querySelector('.preloader').style.display = 'none';
        }
    }
    window.onscroll = function () {
        var header_navbar = document.getElementById("header_navbar");
        var logo = document.querySelector("img#logo");
        var sticky = header_navbar && header_navbar.offsetTop;
        if (window.pageYOffset > sticky) {
            header_navbar && header_navbar.classList.add("sticky");
            logo && logo.setAttribute("src", "assets/images/logo.png")
        } else {
            header_navbar && header_navbar.classList.remove("sticky");
            logo && logo.setAttribute("src", "assets/images/logo.png")
        }
        var backToTo = document.querySelector(".back-to-top");
        if (backToTo) {
            if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
                backToTo.style.display = "block";
            } else {
                backToTo.style.display = "none";
            }
        }
    }
    var pageLink = document.querySelectorAll('.page-scroll');
    pageLink.forEach(elem => {
        elem.addEventListener('click', e => {
            e.preventDefault();
            document.querySelector(elem.getAttribute('href')).scrollIntoView({
                behavior: 'smooth',
                offsetTop: 1 - 60,
            });
        });
    });
    function onScroll(event) {
        var sections = document.querySelectorAll('.page-scroll');
        var scrollPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
        for (var i = 0; i < sections.length; i++) {
            var currLink = sections[i];
            var val = currLink.getAttribute('href');
            var refElement = document.querySelector(val);
            var scrollTopMinus = scrollPos + 73;
            if (refElement && refElement.offsetTop <= scrollTopMinus && (refElement && refElement.offsetTop + refElement && refElement.offsetHeight > scrollTopMinus)) {
                document.querySelector('.page-scroll').classList.remove('active');
                currLink.classList.add('active');
            } else {
                currLink.classList.remove('active');
            }
        }
    };
    window.document.addEventListener('scroll', onScroll);
    let navbarToggler = document.querySelector(".navbar-toggler");
    var navbarCollapse = document.querySelector(".navbar-collapse");
    document.querySelectorAll(".page-scroll") && document.querySelectorAll(".page-scroll").forEach(e => e.addEventListener("click", () => {
        navbarToggler && navbarToggler.classList.remove("active"); navbarCollapse && navbarCollapse.classList.remove('show')
    }));
    var wow = new WOW({ mobile: false });
    var glide = document.querySelector(".glide");
    if (glide) {
        wow.init(); setTimeout(function () {
            new Glide(glide, { type: 'slider', perView: 1, animationDuration: 1000 }).mount()
        }, 500);
    }
})();