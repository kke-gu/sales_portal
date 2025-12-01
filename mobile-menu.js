// 모바일 메뉴 토글 기능
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.getElementById('mainNav');
    const menuClose = document.querySelector('.mobile-menu-close');
    const siteHeader = document.querySelector('.site-header');
    
    function closeMenu() {
        if (mainNav) {
            mainNav.classList.remove('mobile-open');
        }
        if (menuToggle) {
            menuToggle.classList.remove('active');
        }
        if (siteHeader) {
            siteHeader.classList.remove('menu-open');
        }
    }
    
    function openMenu() {
        if (mainNav) {
            mainNav.classList.add('mobile-open');
        }
        if (menuToggle) {
            menuToggle.classList.add('active');
        }
        if (siteHeader) {
            siteHeader.classList.add('menu-open');
        }
    }
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function() {
            if (mainNav.classList.contains('mobile-open')) {
                closeMenu();
            } else {
                openMenu();
            }
        });
    }
    
    // 닫기 버튼 클릭 시 메뉴 닫기
    if (menuClose) {
        menuClose.addEventListener('click', function() {
            closeMenu();
        });
    }

    if (mainNav) {
        // 메뉴 링크 클릭 시 모바일 메뉴 닫기
        const navLinks = mainNav.querySelectorAll('.nav-pill');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                closeMenu();
            });
        });

        // 외부 클릭 시 메뉴 닫기
        document.addEventListener('click', function(event) {
            if (mainNav.classList.contains('mobile-open')) {
                if (!mainNav.contains(event.target) && !menuToggle?.contains(event.target)) {
                    closeMenu();
                }
            }
        });
    }
});

