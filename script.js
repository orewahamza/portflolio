if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// Fade out immediately when leaving the page (refresh or link click)
window.addEventListener('beforeunload', () => {
    document.body.style.opacity = '0';
});

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, TextPlugin);
ScrollTrigger.config({ limitCallbacks: true });

document.addEventListener('DOMContentLoaded', () => {
    const bootHash = window.location.hash;
    const isDeepLink = bootHash && bootHash.length > 1; // Any hash is a valid target now

    if (!isDeepLink) {
        window.scrollTo(0, 0);
    }

    // 2. Controlled Boot
    setTimeout(() => {
        initLenis();

        // Stop Lenis from processing scroll until we are ready
        if (window.lenis) window.lenis.stop();

        // Perform instant jump if deep linking, but stay hidden
        if (isDeepLink) {
            const target = document.querySelector(bootHash);
            if (target) {
                // Use GSAP for a robust instant jump
                gsap.set(window, { scrollTo: { y: target, offsetY: 90 } });

                // Sync Lenis to this new position
                if (window.lenis) {
                    const targetScroll = Math.max(0, target.offsetTop - 90);
                    window.lenis.scrollTo(targetScroll, { immediate: true });
                }
            }
        } else {
            window.scrollTo(0, 0);
        }

        // Initialize all other components
        initSmoothScroll();
        initScrollSpy();
        initCardTilt();
        createParticles();
        initScrollProgress();
        initGlowingEffect();
        initSkillBars();
        initTerminalAnimation();
        initInteractiveTerminal();
        initTextScrollAnimation();
        initSimpleForm();

        // NEW PREMIUM ANIMATIONS
        initParallax();
        initTextScramble();
        initMagnetButtons();
        initSectionWipes();
        initScrollDock();
        initProjectFlips();
        initProjectModal();
        initExtraAnimations();
        initAccessibility();

        // 3. Reveal and Sync
        // Wait for all calculations to settle AND fonts to load
        document.fonts.ready.then(() => {
            requestAnimationFrame(() => {
                // Unlock ScrollTrigger
                ScrollTrigger.config({ limitCallbacks: false });
                ScrollTrigger.refresh();

                // Sync UI to current position
                if (window.updateScrollDock) window.updateScrollDock(true);
                if (isDeepLink && window.updateNavUI) {
                    window.updateNavUI(bootHash.replace('#', ''), true);
                }

                // FADE IN
                document.body.classList.remove('is-loading');
                if (window.lenis) window.lenis.start();

                // Ensure all hero elements are visible immediately after loading screen disappears
                // gsap.set(".name, .greeting, .hero .title, .cta-buttons, .social-icon, .hero-image", { visibility: "visible" }); // Replaced by timeline reveals
                gsap.set(".social-icon", { visibility: "visible" }); 


                // Run Entrance Animations ONLY if we are at the top (Home)
                if (!isDeepLink) {
                    // Tiny delay to ensure browser layout engine settles (fixes "Requires Refresh" bugs)
                    setTimeout(() => {
                        const heroTL = gsap.timeline({ 
                            defaults: { ease: "power4.out" },
                            onComplete: () => {
                                // Final sync after animations to catch any layout changes
                                ScrollTrigger.refresh();
                                // Initialize 3D Name effect ONLY after the animation is finished to prevent misplacement
                                init3DName();
                                initMouseSpotlight();
                                initChatbot();
                                initTextReveal();
                            }
                        });

                        // Use fromTo for absolute control over the first-load state
                        heroTL.fromTo(".greeting", 
                            { opacity: 0, x: -30 }, 
                            { opacity: 1, x: 0, duration: 1, delay: 0.2 }
                        )
                        .fromTo(".name", 
                            { opacity: 0, y: 30, scale: 0.95 },
                            { opacity: 1, y: 0, scale: 1, duration: 1.2 }, 
                            "-=0.8"
                        )
                        .fromTo(".hero .title", 
                            { opacity: 0, x: -20 },
                            { opacity: 1, x: 0, duration: 1 }, 
                            "-=1"
                        )
                        .fromTo(".cta-buttons", 
                            { opacity: 0, y: 20 },
                            { opacity: 1, y: 0, duration: 0.8 }, 
                            "-=0.8"
                        )
                        .fromTo(".social-icon", 
                            { opacity: 0, y: 20 },
                            { opacity: 1, y: 0, stagger: 0.1, duration: 0.8 }, 
                            "-=0.6"
                        )
                        .fromTo(".hero-image", 
                            { opacity: 0, scale: 0.8, x: 50 },
                            { opacity: 1, scale: 1, x: 0, duration: 1.5 }, 
                            "-=1.5"
                        )
                        .fromTo(".scroll-indicator", 
                            { opacity: 0, y: -20 },
                            { opacity: 1, y: 0, duration: 1 }, 
                            "-=0.5"
                        )
                        .fromTo(".code-line", 
                            { opacity: 0, x: -10 },
                            { opacity: 1, x: 0, duration: 0.5, stagger: 0.3 }, 
                            "-=0.5"
                        );
                    }, 120);
                } else {
                    // If deep linking, just reveal everything immediately
                    gsap.set(".name, .greeting, .hero .title, .cta-buttons, .hero-image", { opacity: 1, visibility: "visible", scale: 1 });
                    init3DName();
                    initMouseSpotlight();
                    initChatbot();
                    initTextReveal();
                }

                initNavLamp();
            });
        });
    }, 80); // Tightened boot window for a more professional, snappier feel

    // Final stabilization on full window load
    window.addEventListener('load', () => {
        setTimeout(() => {
            ScrollTrigger.refresh();
            if (window.updateScrollDock) window.updateScrollDock(true);
        }, 100);
    });
});

// 15. Side Scroll Dock Logic (Animation #6)
function initScrollDock() {
    const ball = document.querySelector('.dock-ball');
    const track = document.querySelector('.dock-track');
    const dots = document.querySelectorAll('.indicator-dot');
    const sections = document.querySelectorAll('section');
    const activeLabel = document.querySelector('.active-section-label');

    if (!ball || !track) return;

    let scrollPercent = 0;
    let isDragging = false;
    let lastActiveIndex = -1;

    // Stable absolute offset helper
    const getPageOffset = (el) => {
        const rect = el.getBoundingClientRect();
        return rect.top + window.pageYOffset;
    };

    // Dynamic Dot Positioning and Sync
    const refreshDots = () => {
        const maxScroll = ScrollTrigger.maxScroll(window);
        const trackHeight = track.offsetHeight;
        const ballHeight = ball.offsetHeight;
        const moveRange = trackHeight - ballHeight;

        sections.forEach((section, i) => {
            if (dots[i]) {
                const sectionTop = getPageOffset(section);
                // Align with where the ball is when the section is at the top (with a 90px nav offset)
                const targetScroll = Math.min(maxScroll, Math.max(0, sectionTop - 90));
                const percent = Math.min(1, targetScroll / (maxScroll || 1));

                const dotY = (percent * moveRange) + (ballHeight / 2);
                dots[i].style.top = `${dotY}px`;
                dots[i].style.opacity = "1";
            }
        });
    };

    // Initial positioning and on refresh
    setTimeout(refreshDots, 100); // Small delay to ensure offsets are correct
    ScrollTrigger.addEventListener("refresh", refreshDots);

    // Smooth update using GSAP for better performance and look
    const updateDock = (force = false) => {
        if (!isDragging || force) {
            const scrolled = window.scrollY;
            const maxScroll = ScrollTrigger.maxScroll(window);
            scrollPercent = Math.min(1, Math.max(0, scrolled / (maxScroll || 1)));
        }

        const trackHeight = track.offsetHeight;
        const ballHeight = ball.offsetHeight;
        const moveRange = trackHeight - ballHeight;
        const targetY = scrollPercent * moveRange;

        const animDuration = isDragging ? 0.02 : 0.4;
        const animEase = isDragging ? "none" : "power2.out";

        gsap.to(ball, {
            y: targetY,
            duration: animDuration,
            ease: animEase,
            overwrite: true
        });

        if (activeLabel) {
            const labelY = targetY + (ballHeight / 2) - (activeLabel.offsetHeight / 2);
            gsap.to(activeLabel, {
                y: labelY,
                duration: animDuration,
                ease: animEase,
                overwrite: true
            });
        }

        // Update Active Dots and Label
        let currentSectionIndex = 0;
        const triggerPoint = window.scrollY + (window.innerHeight / 3);

        sections.forEach((section, i) => {
            if (triggerPoint >= getPageOffset(section) - 100) {
                currentSectionIndex = i;
            }
        });

        if (currentSectionIndex !== lastActiveIndex) {
            dots.forEach(dot => dot.classList.remove('active'));
            if (dots[currentSectionIndex]) {
                dots[currentSectionIndex].classList.add('active');
                if (activeLabel) {
                    activeLabel.textContent = dots[currentSectionIndex].getAttribute('data-tooltip') || "Section";
                    gsap.fromTo(activeLabel, { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: 0.3 });
                }

                // Sync Navbar UI in real-time
                const sectionId = dots[currentSectionIndex].getAttribute('href')?.replace('#', '');
                if (sectionId && typeof window.updateNavUI === 'function') {
                    window.updateNavUI(sectionId, isDragging);
                }
            }
            lastActiveIndex = currentSectionIndex;
        }

        if (isDragging) requestAnimationFrame(() => updateDock(false));
    };

    window.addEventListener('scroll', () => {
        if (!isDragging) updateDock();
    }, { passive: true });

    // Drag Logic
    const startDrag = (e) => {
        isDragging = true;
        // Don't set isNavigating = true to allow UI updates during manual drag
        document.body.style.cursor = 'grabbing';
        ball.classList.add('dragging');
        updateDock(true);
    };

    const doDrag = (e) => {
        if (!isDragging) return;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = track.getBoundingClientRect();
        const relativeY = clientY - rect.top;

        // Use ball center for dragging logic
        const dragPercent = Math.max(0, Math.min((relativeY - ball.offsetHeight / 2) / (rect.height - ball.offsetHeight), 1));
        scrollPercent = dragPercent;

        const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({
            top: scrollPercent * totalScroll,
            behavior: 'auto'
        });
    };

    const endDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        isNavigating = false;
        document.body.style.cursor = 'default';
        ball.classList.remove('dragging');
        setTimeout(() => ScrollTrigger.refresh(), 100);
    };

    ball.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', endDrag);

    ball.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('touchmove', doDrag, { passive: false });
    window.addEventListener('touchend', endDrag);

    updateDock();

    // Expose updateDock to global scope for external calls (e.g., after lenis scroll)
    window.updateScrollDock = updateDock;

    // Dot click scrolling
    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = dot.getAttribute('href');
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                isNavigating = true;
                activeLinkLock = true;

                const navLink = document.querySelector(`.nav-link[href="${targetId}"]`);
                if (navLink) {
                    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                    navLink.classList.add('active');
                    setNavIndicator(navLink, false, 0.8);
                }

                if (window.lenis) {
                    window.lenis.scrollTo(targetEl, {
                        offset: -90,
                        duration: 1.2,
                        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                        onComplete: () => {
                            setTimeout(() => {
                                isNavigating = false;
                                activeLinkLock = false;
                                ScrollTrigger.refresh();
                            }, 100);
                        }
                    });
                } else {
                    gsap.to(window, {
                        scrollTo: { y: targetEl, offsetY: 90 },
                        duration: 1.2,
                        ease: "power3.inOut",
                        onComplete: () => {
                            setTimeout(() => {
                                isNavigating = false;
                                activeLinkLock = false;
                                ScrollTrigger.refresh();
                            }, 100);
                        }
                    });
                }
            }
        });
    });
}



// REMOVED Custom Cursor & Mesh Gradient for performance (per user request)


// 2. Parallax Logic (High Scroll Animation #1)
function initParallax() {
    const parallaxEls = document.querySelectorAll('.parallax-el');
    parallaxEls.forEach(el => {
        const speed = el.getAttribute('data-speed') || 0.1;
        gsap.to(el, {
            y: -20, // Reduced offset for stability
            ease: "none",
            scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    });

    /* Hero Parallax disabled for performance
    gsap.to(".hero-text", {
        y: 100,
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    gsap.to(".hero-image", {
        y: -50,
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });
    */
}







// 5. Text Scramble Effect (High Animation #3)
function initTextScramble() {
    class TextScramble {
        constructor(el) {
            this.el = el;
            this.chars = '!<>-_\\/[]{}—=+*^?#________';
            this.update = this.update.bind(this);
        }
        setText(newText) {
            const oldText = this.el.innerText;
            const length = Math.max(oldText.length, newText.length);
            const promise = new Promise((resolve) => this.resolve = resolve);
            this.queue = [];
            for (let i = 0; i < length; i++) {
                const from = oldText[i] || '';
                const to = newText[i] || '';
                const start = Math.floor(Math.random() * 15);
                const end = start + Math.floor(Math.random() * 15);
                this.queue.push({ from, to, start, end });
            }
            cancelAnimationFrame(this.frameRequest);
            this.frame = 0;
            this.update();
            return promise;
        }
        update() {
            let output = '';
            let complete = 0;
            for (let i = 0, n = this.queue.length; i < n; i++) {
                let { from, to, start, end, char } = this.queue[i];
                if (this.frame >= end) {
                    complete++;
                    output += to;
                } else if (this.frame >= start) {
                    if (!char || Math.random() < 0.28) {
                        char = this.randomChar();
                        this.queue[i].char = char;
                    }
                    output += `<span class="dud">${char}</span>`;
                } else {
                    output += from;
                }
            }
            this.el.innerHTML = output;
            if (complete === this.queue.length) {
                this.resolve();
            } else {
                this.frameRequest = requestAnimationFrame(this.update);
                this.frame++;
            }
        }
        randomChar() {
            return this.chars[Math.floor(Math.random() * this.chars.length)];
        }
    }

    const title = document.querySelector('.hero .title');
    if (title) {
        const phrases = [
            'Full Stack Web Developer',
            'MERN Stack Enthusiast',
            'Problem Solver'
        ];
        const fx = new TextScramble(title);
        let counter = 0;
        const next = () => {
            fx.setText(phrases[counter]).then(() => {
                setTimeout(next, 2000);
            });
            counter = (counter + 1) % phrases.length;
        };
        setTimeout(next, 2000);
    }
}

// 6. Magnet Buttons Logic (Medium Animation #5)
// Integrated into initGlowingEffect for performance and stability
function initMagnetButtons() {}

    // 7. Section Transition Wipes (Staggered 3D Reveal with Replay)
function initSectionWipes() {
    const isMobileDevice = window.innerWidth < 768;
    const hireMeCard = document.querySelector('.hire-me-card');
    const skillCategories = gsap.utils.toArray('.skill-category');
    
    const elementsToAnimate = gsap.utils.toArray('section:not(.hero) .section-subtitle, .about-text > h2, .about-text > .about-location, .portfolio-card');
    const terminalElements = gsap.utils.toArray('.terminal-container, .terminal-actions');

    if (elementsToAnimate.length === 0) return;

    // Standard elements: Fade + Slide
    gsap.set(elementsToAnimate, {
        opacity: 0,
        y: 20,
        willChange: "transform, opacity"
    });

    // Terminal elements: Only hide on desktop, show immediately on mobile
    if (isMobileDevice) {
        gsap.set(terminalElements, { opacity: 1, y: 0 });
    } else {
        gsap.set(terminalElements, { opacity: 0, y: 20 });
        elementsToAnimate.push(...terminalElements);
    }

    ScrollTrigger.batch(elementsToAnimate, {
        start: "top 75%", // Trigger further in view
        onEnter: (batch) => {
            if (isNavigating) {
                gsap.set(batch, { opacity: 1, y: 0 });
                return;
            }
            gsap.to(batch, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "power2.out",
                overwrite: "auto",
                pointerEvents: "auto"
            });
        },
        onEnterBack: (batch) => {
            gsap.to(batch, {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "power2.out",
                overwrite: "auto",
                pointerEvents: "auto"
            });
        },
        onLeaveBack: (batch) => {
            if (isNavigating) return;
            gsap.to(batch, {
                opacity: 0,
                y: 10,
                duration: 0.5,
                ease: "power2.inOut",
                overwrite: "auto",
                pointerEvents: "none"
            });
        }
    });

    // Hire Me Card: PURE FADE only. No Y, No Rotation, No Scale. 
    // This is the only way to avoid perspective-induced shrinking.
    if (hireMeCard) {
        gsap.set(hireMeCard, { opacity: 0 });

        ScrollTrigger.create({
            trigger: hireMeCard,
            start: "top 75%", // Reveal card slightly later
            onEnter: () => {
                if (isNavigating) {
                    gsap.set(hireMeCard, { opacity: 1 });
                } else {
                    gsap.to(hireMeCard, { opacity: 1, duration: 0.8, ease: "power2.out", overwrite: "auto", pointerEvents: "auto" });
                }
            },
            onEnterBack: () => gsap.to(hireMeCard, { opacity: 1, duration: 0.8, ease: "power2.out", overwrite: "auto", pointerEvents: "auto" }),
            onLeaveBack: () => {
                if (isNavigating) return;
                gsap.to(hireMeCard, { opacity: 0, duration: 0.5, ease: "power2.inOut", overwrite: "auto", pointerEvents: "none" });
            }
        });
    }

    // Handle Skill Categories separately
    if (skillCategories.length > 0) {
        gsap.set(skillCategories, { opacity: 0, y: 30 });

        ScrollTrigger.batch(skillCategories, {
            start: "top 75%",
            onEnter: (batch) => {
                if (isNavigating) {
                    gsap.set(batch, { opacity: 1, y: 0 });
                    return;
                }
                gsap.to(batch, {
                    opacity: 1,
                    y: 0,
                    rotationX: 0,
                    duration: 0.8,
                    stagger: 0.05,
                    ease: "power2.out",
                    overwrite: true,
                    force3D: true,
                    transformPerspective: 1200
                });
            },
            onEnterBack: (batch) => {
                gsap.to(batch, {
                    opacity: 1,
                    y: 0,
                    rotationX: 0,
                    duration: 0.8,
                    stagger: 0.05,
                    ease: "power2.out",
                    overwrite: true,
                    force3D: true,
                    transformPerspective: 1200
                });
            },
            onLeaveBack: (batch) => {
                if (isNavigating) return;
                gsap.to(batch, {
                    opacity: 0,
                    y: 20,
                    duration: 0.5,
                    ease: "power2.inOut",
                    overwrite: true,
                    force3D: true
                });
            },
            once: false
        });
    }

    // 3. Project, Services & About Terminal Scroll Rotation (The "Flow")
    const projectCards = document.querySelectorAll('.portfolio-card');
    const serviceCardsEls = document.querySelectorAll('.service-card');
    const aboutTerminal = document.querySelector('.hire-me-card');
    
    [...projectCards, aboutTerminal].forEach((card) => {
        if (!card) return;
        const inner = card.querySelector('.card-inner') || card;
        
        // Store the ScrollTrigger in a variable so we can disable it when flipping
        const revealST = ScrollTrigger.create({
            trigger: card,
            start: "top bottom",
            end: "top center",
            scrub: 1.2,
            animation: gsap.fromTo(inner,
                { rotationY: -12, transformPerspective: 1200 },
                { 
                    rotationY: 0, 
                    duration: 1.2,
                    ease: "power2.out",
                    immediateRender: false 
                }
            )
        });
        
        inner._revealST = revealST;
    });

    // Service Cards: staggered slide-up + fade
    const serviceCards = gsap.utils.toArray('.service-card');
    if (serviceCards.length > 0) {
        gsap.set(serviceCards, {
            opacity: 0,
            y: 50,
            transformPerspective: 1000,
            transformOrigin: "top center"
        });

        ScrollTrigger.batch(serviceCards, {
            start: "top 70%",
            onEnter: (batch) => {
                if (isNavigating) {
                    gsap.set(batch, { opacity: 1, y: 0 });
                    batch.forEach(card => {
                        const targets = card.querySelectorAll('h3, p, .service-features li span, .btn-text');
                        targets.forEach(t => t.dataset.typed = "true");
                    });
                    return;
                }
                gsap.to(batch, {
                    opacity: 1,
                    y: 0,
                    duration: 0.9,
                    stagger: 0.15,
                    ease: "power3.out",
                    overwrite: true,
                    force3D: true,
                    onStart: function () {
                        // After entry, we'll let the global floating take over once fully visible
                        // Typing effect triggered for each card in the batch
                        batch.forEach(card => {
                            const title = card.querySelector('h3');
                            const desc = card.querySelector('p');
                            const features = card.querySelectorAll('.service-features li span');

                            if (title && !title.dataset.typed) {
                                const originalTitle = title.innerText;
                                title.style.minHeight = title.offsetHeight + "px"; // Freeze height
                                title.innerText = "";
                                gsap.to(title, {
                                    duration: 0.8,
                                    text: originalTitle,
                                    ease: "none",
                                    delay: 0.2,
                                    onComplete: () => { title.style.minHeight = ""; }
                                });
                                title.dataset.typed = "true";
                            }

                            if (desc && !desc.dataset.typed) {
                                const originalDesc = desc.innerText;
                                desc.style.minHeight = desc.offsetHeight + "px"; // Freeze height
                                desc.innerText = "";
                                gsap.to(desc, {
                                    duration: 1.5,
                                    text: originalDesc,
                                    ease: "none",
                                    delay: 0.6,
                                    onComplete: () => { desc.style.minHeight = ""; }
                                });
                                desc.dataset.typed = "true";
                            }

                            if (features.length > 0) {
                                features.forEach((span, index) => {
                                    if (!span.dataset.typed) {
                                        const originalText = span.innerText;
                                        const li = span.parentElement;
                                        li.style.minHeight = li.offsetHeight + "px"; // Stabilize height
                                        span.innerText = "";
                                        gsap.set(li, { opacity: 0 }); // Hide the whole line (including icon) initially

                                        gsap.to(span, {
                                            duration: 0.6,
                                            text: originalText,
                                            ease: "none",
                                            delay: 1.2 + (index * 0.4),
                                            onStart: () => {
                                                gsap.to(li, { opacity: 1, duration: 0.3 }); // Fade in the icon + line as typing starts
                                            },
                                            onComplete: () => {
                                                li.style.minHeight = ""; // Clean up
                                            }
                                        });
                                        span.dataset.typed = "true";
                                    }
                                });
                            }
                            const contactBtn = card.querySelector('.service-contact-btn');
                            if (contactBtn && !contactBtn.dataset.animated) {
                                const btnText = contactBtn.querySelector('.btn-text');
                                if (btnText) {
                                    const originalBtnText = btnText.innerText;
                                    btnText.innerText = "";
                                    gsap.set(contactBtn, { opacity: 0, y: 15 });

                                    gsap.to(contactBtn, {
                                        opacity: 1,
                                        y: 0,
                                        duration: 0.6,
                                        delay: 1.5,
                                        ease: "power2.out",
                                        onStart: () => {
                                            gsap.to(btnText, {
                                                duration: 1,
                                                text: originalBtnText,
                                                ease: "none",
                                                delay: 0.2
                                            });
                                        }
                                    });
                                }
                                contactBtn.dataset.animated = "true";
                            }
                        });
                    }
                });
            },
            onEnterBack: (batch) => {
                gsap.to(batch, {
                    opacity: 1,
                    y: 0,
                    duration: 0.9,
                    stagger: 0.1,
                    ease: "power3.out",
                    overwrite: true,
                    force3D: true
                });
            },
            onLeaveBack: (batch) => {
                if (isNavigating) return;
                gsap.to(batch, {
                    opacity: 0,
                    y: 30,
                    duration: 0.5,
                    stagger: 0.08,
                    ease: "power2.inOut",
                    overwrite: true,
                    force3D: true
                });
            },
            once: false
        });
    }

    // 4. Dedicated Floating for All Main Cards (Services & Skills) - IMMEDIATE AND CONTINUOUS
    gsap.fromTo(".service-card, .skill-category", 
        { y: 0 },
        {
            y: -15,
            duration: 4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: 0.05,
            force3D: true
        }
    );

    // Content breathing logic for services - IMMEDIATELY ACTIVE
    gsap.fromTo(".service-content", 
        { y: 0 },
        {
            y: 8,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: 0.05,
            force3D: true
        }
    );
}






// Glowing effect logic removed as per user request to eliminate irritating shine oscillations.

// Scroll Progress Bar Logic
function initScrollProgress() {
    const progressBar = document.querySelector('.scroll-progress-bar');
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + "%";
    });
}

let isNavigating = false;

// Smooth Scroll Spy with moving indicator
function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    // Expose globally so Sidebar can sync it
    window.updateNavUI = (id, force = false) => {
        if (activeLinkLock && !force) return;
        if (!id) return;

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${id}`) {
                link.classList.add('active');
                setNavIndicator(link, false, 0.4);
            }
        });

        // Sync URL hash immediately so refresh works
        if (history.replaceState) {
            const currentHash = window.location.hash;
            if (currentHash !== `#${id}`) {
                history.replaceState(null, null, `#${id}`);
            }
        }
    };

    sections.forEach(section => {
        ScrollTrigger.create({
            trigger: section,
            // Trigger when section is in the top 40% of the viewport
            start: "top 40%",
            end: "bottom 40%",
            onToggle: (self) => {
                if (self.isActive && !isNavigating) {
                    window.updateNavUI(section.getAttribute('id'));
                }
            }
        });
    });
}

let activeLinkLock = false;

// Smooth Scroll for Navigation Links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href.length <= 1) return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (!target) return;

            isNavigating = true;
            activeLinkLock = true;

            // 1. Force state immediately
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            setNavIndicator(this, false, 0.8);

            // 2. Scroll smoothly
            if (window.lenis) {
                window.lenis.scrollTo(target, {
                    offset: -90,
                    duration: 1.2,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                    onComplete: () => {
                        setTimeout(() => {
                            ScrollTrigger.refresh();
                            isNavigating = false;
                            activeLinkLock = false;
                        }, 100);
                        if (history.pushState) history.pushState(null, null, href);
                    }
                });
            } else {
                gsap.to(window, {
                    scrollTo: { y: target, offsetY: 90 },
                    duration: 1.2,
                    ease: "power3.inOut",
                    onComplete: () => {
                        setTimeout(() => {
                            ScrollTrigger.refresh();
                            isNavigating = false;
                            activeLinkLock = false;
                        }, 100);
                        if (history.pushState) history.pushState(null, null, href);
                    }
                });
            }
        });
    });
}

// Moving Navigation Indicator Logic
function initNavLamp() {
    const activeLink = document.querySelector('.nav-link.active');
    if (activeLink) {
        setNavIndicator(activeLink, true);
    }

    // Manual click handling removed here because initSmoothScroll 
    // already handles the scroll, and ScrollTrigger handles the line movement.
    // This prevents "Double-triggering" when clicking far links.

    // Handle window resize
    window.addEventListener('resize', () => {
        const currentActive = document.querySelector('.nav-link.active');
        if (currentActive) setNavIndicator(currentActive, true);
    });
}

function setNavIndicator(link, immediate = false, customDuration = 0.4) {
    const lamp = document.querySelector('.moving-lamp');
    const container = document.querySelector('.nav-container');
    const navLinksParent = document.querySelector('.nav-links');
    if (!lamp || !container || !link || !navLinksParent) return;

    // Use offsetLeft relative to .nav-links for stability
    // and then add .nav-links's own offset relative to .nav-container
    const targetX = link.offsetLeft + navLinksParent.offsetLeft + (link.offsetWidth / 2) - (lamp.offsetWidth / 2);

    gsap.to(lamp, {
        x: targetX,
        width: 35,
        duration: immediate ? 0 : customDuration,
        ease: customDuration > 0.5 ? "power3.inOut" : "power2.out",
        overwrite: true
    });
}


// 3D Tilt Effect for All Premium Containers (Animation #2 Enhanced)
function initCardTilt() {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const targets = document.querySelectorAll('.portfolio-card, .monitor, .terminal-flipper-container, .hire-me-card');

    targets.forEach(target => {
        let isHovering = false;

        const onWindowMove = (e) => {
            if (!isHovering) return;
            if (target.classList.contains('is-flipped') || target.dataset.isAnimating === 'true') return;

            // Use LIVE viewport-relative coordinates for stable calculation during scroll
            const rect = target.getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            // Check if mouse is within a reasonable distance of the card
            const buffer = 50;
            if (mouseX < rect.left - buffer ||
                mouseX > rect.right + buffer ||
                mouseY < rect.top - buffer ||
                mouseY > rect.bottom + buffer) {

                isHovering = false;
                gsap.to(target, {
                    rotationX: 0,
                    rotationY: 0,
                    duration: 0.8,
                    ease: "power2.out",
                    overwrite: "auto"
                });
                window.removeEventListener('mousemove', onWindowMove);
                return;
            }

            const x = mouseX - rect.left;
            const y = mouseY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            let intensity = 20; // Improved intensity
            if (target.classList.contains('monitor')) intensity = 12;
            if (target.classList.contains('terminal-flipper-container') || target.classList.contains('terminal-window')) intensity = 25;

            const rotateX = -(y - centerY) / intensity;
            const rotateY = (x - centerX) / intensity;

            gsap.to(target, {
                rotationX: rotateX,
                rotationY: rotateY,
                duration: 0.4,
                ease: "power2.out",
                transformPerspective: 1200,
                force3D: true,
                overwrite: "auto"
            });
        };

        target.addEventListener('mouseenter', () => {
            if (isHovering) return;
            isHovering = true;
            window.addEventListener('mousemove', onWindowMove);
        });
    });
}

// 16. Project Flip Card Logic & Micro-interactions
function initProjectFlips() {
    const flipButtons = document.querySelectorAll('.flip-btn');
    const flipBackButtons = document.querySelectorAll('.flip-back-btn');

    flipButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const card = btn.closest('.portfolio-card');
            const inner = card.querySelector('.card-inner');
            const cardFront = card.querySelector('.card-front');
            const cardBack = card.querySelector('.card-back');

            // Kill any active animations to prevent conflicts
            gsap.killTweensOf([card, inner, cardFront, cardBack]);
            
            // Capture exact current height so fromTo never snaps
            const startHeight = card.offsetHeight;
            const isMobile = window.innerWidth < 768;
            const flipHeight = isMobile ? 650 : 700;

            // Fix: Disable the scroll-reveal ScrollTrigger during flipping 
            if (inner._revealST) inner._revealST.disable();

            // Block tilt logic immediately
            card.dataset.isAnimating = 'true';

            const tl = gsap.timeline({ defaults: { ease: "power2.inOut", duration: 1.4 } });

            tl
                .fromTo(card,
                    { height: startHeight },
                    {
                        height: flipHeight,
                        zIndex: 100,
                        onStart: () => card.classList.add('is-flipped')
                    }, 0)
                .to(inner,
                    { rotationY: 180, transformPerspective: 1200, z: 30 }, 0)
                // Swap faces exactly at the halfway point (0.7s)
                .set(cardFront, { autoAlpha: 0 }, 0.7)
                .set(cardBack,  { autoAlpha: 1 }, 0.7)
                .to(card, { rotationX: 0, rotationY: 0, duration: 0.3 }, 0);


            // Typing effect: Start after the flip is nearly complete
            const backDesc = card.querySelector('.project-detailed-desc');
            if (backDesc && !backDesc.dataset.typed) {
                const text = backDesc.textContent;
                backDesc.textContent = '';
                backDesc.dataset.typed = 'true';

                setTimeout(() => {
                    let i = 0;
                    const typeInterval = setInterval(() => {
                        if (i < text.length) {
                            backDesc.textContent += text.charAt(i);
                            i++;
                        } else {
                            clearInterval(typeInterval);
                        }
                    }, 15);
                }, 700);
            }
        });
    });

    flipBackButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const card = btn.closest('.portfolio-card');
            const inner = card.querySelector('.card-inner');
            const cardFront = card.querySelector('.card-front');
            const cardBack = card.querySelector('.card-back');

            gsap.killTweensOf([card, inner, cardFront, cardBack]);

            const isMobileFlip = window.innerWidth < 768;
            const duration = isMobileFlip ? 1.0 : 1.4;
            const restoreHeight = isMobileFlip ? 420 : 480;

            const tl = gsap.timeline({
                defaults: { ease: "power2.inOut", duration: duration }
            });

            tl.to(inner, {
                rotationY: 0,
                z: 0 // Reset depth
            }, 0)
                // Halfway visibility swap
                .set(cardFront, { autoAlpha: 1 }, duration / 2)
                .set(cardBack,  { autoAlpha: 0 }, duration / 2)
                .to(card, {
                    height: restoreHeight,
                    zIndex: 1,
                    onComplete: () => {
                        card.classList.remove('is-flipped');
                        delete card.dataset.isAnimating;
                        if (inner._revealST) inner._revealST.enable();
                        // Final cleanup to ensure no leftover styles interfere with re-clicking
                        gsap.set([cardFront, cardBack], { clearProps: "opacity,visibility" });
                    }
                }, 0);
        });
    });
}

// 17. Project Details Data
const projectData = {
    learn: {
        title: "LearnCode",
        reason: "Education accessibility is important to me. LearnCode was born from the desire to consolidate fragmented learning resources into a single, interactive roadmap for aspiring developers.",
        process: "I focused on state management to handle complex quiz logic and progress tracking. The admin panel was built to provide insights into user engagement, requiring deep dives into data visualization and secure API endpoints.",
        features: [
            "Interactive Quizzes",
            "Curated Learning Roadmaps",
            "Admin Analytics Dashboard",
            "User Progress Tracking",
            "Community Resource Links"
        ],
        github: "https://github.com/orewahamza/learn-code.git",
        live: "https://learn-code-ta9i.onrender.com",
        desktop: [
            "images/learn-code/screencapture-learn-code-ta9i-onrender-2026-03-18-02_09_04.png",
            "images/learn-code/screencapture-learn-code-ta9i-onrender-courses-2026-03-18-02_09_13.png",
            "images/learn-code/screencapture-learn-code-ta9i-onrender-roadmaps-2026-03-18-02_09_23.png",
            "images/learn-code/screencapture-learn-code-ta9i-onrender-course-javascript-2026-03-18-02_09_43.png",
            "images/learn-code/screencapture-learn-code-ta9i-onrender-learn-video-1-2026-03-18-02_10_28.png",
            "images/learn-code/screencapture-learn-code-ta9i-onrender-quiz-1-2026-03-18-02_10_42.png",
            "images/learn-code/screencapture-learn-code-ta9i-onrender-learn-javascript-2026-03-18-02_10_55.png",
            "images/learn-code/screencapture-learn-code-ta9i-onrender-roadmap-javascript-2026-03-18-02_11_11.png",
            "images/learn-code/screencapture-learn-code-ta9i-onrender-profile-2026-03-18-02_59_50.png",
            "images/learn-code/screencapture-learn-code-ta9i-onrender-settings-2026-03-18-02_12_02.png",
            "images/learn-code/screencapture-learn-code-ta9i-onrender-premium-2026-03-18-02_12_14.png",
            "images/learn-code/screencapture-learn-code-ta9i-onrender-admin-2026-03-18-02_12_23.png"
        ],
        mobile: [
            "images/learn-code/learn-code-ta9i.onrender.com_course_database-pro(iPhone 14 Pro Max).png",
            "images/learn-code/learn-code-ta9i.onrender.com_course_database-pro(iPhone 14 Pro Max) (1).png",
            "images/learn-code/learn-code-ta9i.onrender.com_roadmaps(iPhone 14 Pro Max).png",
            "images/learn-code/learn-code-ta9i.onrender.com_roadmaps(iPhone 14 Pro Max) (1).png",
            "images/learn-code/learn-code-ta9i.onrender.com_roadmaps(iPhone 14 Pro Max) (4).png",
            "images/learn-code/learn-code-ta9i.onrender.com_quiz_3_course=javascript(iPhone 14 Pro Max).png",
            "images/learn-code/learn-code-ta9i.onrender.com_roadmaps(iPhone 14 Pro Max) (2).png",
            "images/learn-code/learn-code-ta9i.onrender.com_roadmaps(iPhone 14 Pro Max) (3).png",
            "images/learn-code/learn-code-ta9i.onrender.com_roadmaps(iPhone 14 Pro Max) (5).png",
            "images/learn-code/learn-code-ta9i.onrender.com_roadmaps(iPhone 14 Pro Max) (7).png",
            "images/learn-code/learn-code-ta9i.onrender.com_roadmaps(iPhone 14 Pro Max) (6).png",
            "images/learn-code/learn-code-ta9i.onrender.com_roadmaps(iPhone 14 Pro Max) (8).png"
        ]
    }
};

// 18. Project Modal Logic (Premium Dialogue)
function initProjectModal() {
    const modal = document.getElementById('project-modal');
    if (!modal) return;

    const overlay = modal.querySelector('.modal-overlay');
    const closeBtn = modal.querySelector('.modal-close');
    const knowMoreBtns = document.querySelectorAll('.know-more-btn');
    const viewButtons = modal.querySelectorAll('.view-btn');
    const imgWrapper = modal.querySelector('.modal-image-wrapper');
    const nextBtn = modal.querySelector('.next-btn');
    const prevBtn = modal.querySelector('.prev-btn');
    const screenCounter = modal.querySelector('.screen-counter');

    // Modal elements to populate
    const modalImg = document.getElementById('modal-project-img');
    const modalTitle = document.getElementById('modal-project-title');
    const modalReason = document.getElementById('modal-project-reason');
    const modalProcess = document.getElementById('modal-project-process');
    const modalFeaturesList = document.getElementById('modal-project-features-detailed');
    const modalGithub = document.getElementById('modal-github-link');
    const modalLive = document.getElementById('modal-live-link');

    let currentProject = null;
    let currentView = 'desktop';
    let currentIndex = 0;

    const updateDisplay = () => {
        if (!currentProject) return;
        const data = projectData[currentProject];
        const images = data[currentView];

        // Handle cases where no images are provided yet
        if (images.length === 0) {
            modalImg.src = "https://via.placeholder.com/800x600?text=Screenshots+Coming+Soon";
            screenCounter.textContent = "0 / 0";
            return;
        }

        // Update Counter
        screenCounter.textContent = `${currentIndex + 1} / ${images.length}`;

        // Disable nav if only 1 image
        prevBtn.style.opacity = images.length > 1 ? "1" : "0.3";
        nextBtn.style.opacity = images.length > 1 ? "1" : "0.3";
        prevBtn.style.pointerEvents = images.length > 1 ? "auto" : "none";
        nextBtn.style.pointerEvents = images.length > 1 ? "auto" : "none";

        const newSrc = images[currentIndex];
        const deviceScreen = imgWrapper.querySelector('.device-screen');

        gsap.to(modalImg, {
            opacity: 0,
            duration: 0.2,
            onComplete: () => {
                modalImg.src = newSrc;
                imgWrapper.className = `modal-image-wrapper ${currentView}-view`;

                // Reset scroll on the internal screen
                if (deviceScreen) {
                    deviceScreen.scrollTop = 0;
                }

                gsap.to(modalImg, { opacity: 1, duration: 0.4 });
            }
        });
    };

    const updateView = (view) => {
        if (!currentProject) return;
        currentView = view;
        currentIndex = 0; // Reset index on view switch

        viewButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-view') === view);
        });

        updateDisplay();
    };

    const navigate = (direction) => {
        if (!currentProject) return;
        const images = projectData[currentProject][currentView];
        const total = images.length;

        if (direction === 'next') {
            currentIndex = (currentIndex + 1) % total;
        } else {
            currentIndex = (currentIndex - 1 + total) % total;
        }
        updateDisplay();
    };

    const openModal = (projectId) => {
        const data = projectData[projectId];
        if (!data) return;

        currentProject = projectId;
        currentView = 'desktop';
        currentIndex = 0;

        // Populate Static Data
        modalTitle.textContent = data.title;
        modalReason.textContent = data.reason;
        modalProcess.textContent = data.process;
        modalImg.alt = `${data.title} Screenshot`;
        modalGithub.href = data.github;
        modalLive.href = data.live;

        // Reset toggles
        viewButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-view') === 'desktop');
        });

        // Features
        modalFeaturesList.innerHTML = '';
        data.features.forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature;
            modalFeaturesList.appendChild(li);
        });

        updateDisplay();

        // GSAP Animation for Opening
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const container = modal.querySelector('.modal-container');
        
        // Reset state before animating
        gsap.set(modal, { opacity: 0, visibility: 'visible' });
        gsap.set(container, { scale: 0.9, y: 40, opacity: 0 });

        // Main Entrance
        const modalTL = gsap.timeline();
        
        modalTL.to(modal, { 
            opacity: 1, 
            duration: 0.4, 
            ease: "power2.out" 
        })
        .to(container, { 
            scale: 1, 
            y: 0, 
            opacity: 1, 
            duration: 0.8, 
            ease: "expo.out" 
        }, "-=0.2")
        .fromTo(modalImg,
            { scale: 1.05, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1, ease: "power2.out" },
            "-=0.6"
        )
        .from(".modal-section", {
            y: 25,
            opacity: 0,
            stagger: 0.1,
            duration: 0.7,
            ease: "power3.out"
        }, "-=0.8");
    };

    const closeModal = () => {
        const container = modal.querySelector('.modal-container');
        
        gsap.to(container, {
            scale: 0.95,
            y: 20,
            opacity: 0,
            duration: 0.4,
            ease: "power2.in"
        });

        gsap.to(modal, {
            opacity: 0,
            duration: 0.4,
            delay: 0.1,
            ease: "power2.inOut",
            onComplete: () => {
                modal.classList.remove('active');
                gsap.set(modal, { visibility: 'hidden' });
                document.body.style.overflow = '';
                currentProject = null;
            }
        });
    };

    knowMoreBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const projectId = btn.getAttribute('data-project');
            openModal(projectId);
        });
    });

    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            if (view !== currentView) updateView(view);
        });
    });

    nextBtn.addEventListener('click', () => navigate('next'));
    prevBtn.addEventListener('click', () => navigate('prev'));

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowRight') navigate('next');
        if (e.key === 'ArrowLeft') navigate('prev');
    });
}

// Create Floating Bubbles & Sparkles (Restored Animation)
function createParticles() {
    const container = document.getElementById('hero-particles');
    if (!container) return;

    const isMobile = window.innerWidth < 768;

    // 1. Create Glowing Blue Particles (Going Up) - fewer on mobile
    const bubbleCount = isMobile ? 15 : 50;
    for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'particle';

        // Random size for particles
        const size = Math.random() * 6 + 4;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;

        container.appendChild(bubble);

        // Animation: Start from bottom, move to top
        const duration = Math.random() * 15 + 10;
        const delay = Math.random() * 15;

        gsap.set(bubble, { y: "110vh", opacity: 0 });

        gsap.to(bubble, {
            y: "-110vh",
            x: `+=${Math.random() * 100 - 50}`, // Slight swaying
            opacity: Math.random() * 0.6 + 0.4,
            duration: duration,
            delay: delay,
            repeat: -1,
            ease: "none",
            onRepeat: () => {
                gsap.set(bubble, { x: 0, left: `${Math.random() * 100}%` });
            }
        });

        // Add "Shining" / Twinkle effect
        gsap.to(bubble, {
            scale: 1.5,
            duration: Math.random() * 1 + 0.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // Fade out near the top
        gsap.to(bubble, {
            opacity: 0,
            duration: 2,
            delay: delay + duration - 2,
            repeat: -1,
            repeatDelay: 2,
            ease: "power1.in"
        });
    }

    // 2. Create Twinkling Sparkles - fewer on mobile
    const sparkleCount = isMobile ? 8 : 30;
    for (let i = 0; i < sparkleCount; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';

        const size = Math.random() * 3 + 1;
        sparkle.style.width = `${size}px`;
        sparkle.style.height = `${size}px`;
        sparkle.style.left = `${Math.random() * 100}%`;
        sparkle.style.top = `${Math.random() * 100}%`;

        container.appendChild(sparkle);

        // Twinkling animation
        gsap.to(sparkle, {
            opacity: Math.random() * 0.8 + 0.2,
            scale: Math.random() * 1.5 + 0.5,
            duration: Math.random() * 2 + 1,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: Math.random() * 5
        });

        // Slow movement
        gsap.to(sparkle, {
            x: `random(-50, 50)`,
            y: `random(-50, 50)`,
            duration: Math.random() * 10 + 10,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    }
}

/**
 * Real Web3Forms handling for the standard contact form
 */
function initSimpleForm() {
    const form = document.getElementById('portfolio-contact-form');
    const result = document.getElementById('simple-form-result');
    const resultText = document.getElementById('result-text');
    const closeBtn = document.getElementById('close-result-btn');
    const submitBtn = document.getElementById('simple-form-submit');
    const formActions = document.getElementById('form-actions-btns');

    const testBtn = document.getElementById('test-fill-btn');
    if (!form || !result || !submitBtn) return;

    if (testBtn) {
        testBtn.addEventListener('click', () => {
            if(form.querySelector('[name="name"]')) form.querySelector('[name="name"]').value = "Test User";
            if(form.querySelector('[name="email"]')) form.querySelector('[name="email"]').value = "test@example.com";
            if(form.querySelector('[name="message"]')) form.querySelector('[name="message"]').value = "This is a test message to verify the email service is working correctly.";
            
            testBtn.innerHTML = '<i class="fas fa-check"></i> FILLED!';
            setTimeout(() => {
                testBtn.innerHTML = '<i class="fas fa-vial"></i> TEST FILL';
            }, 2000);
        });
    }

    // Populate key from config
    const keyInput = document.getElementById('web3forms-access-key-input');
    if (keyInput && window.config && window.config.WEB3FORMS_ACCESS_KEY) {
        keyInput.value = window.config.WEB3FORMS_ACCESS_KEY;
    }

    // Helper: fade buttons out (up) and hide
    function hideButtons() {
        return new Promise(resolve => {
            gsap.to(formActions, {
                y: -18,
                opacity: 0,
                duration: 0.35,
                ease: "power2.in",
                onComplete: () => {
                    formActions.style.display = 'none';
                    gsap.set(formActions, { y: 0 }); // reset y for next show
                    resolve();
                }
            });
        });
    }

    // Helper: show buttons (fade up from below)
    function showButtons() {
        formActions.style.display = 'flex';
        gsap.fromTo(formActions,
            { y: 18, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
        );
    }

    // Helper: collapse result box
    function hideResult() {
        gsap.to(result, {
            height: 0,
            opacity: 0,
            paddingTop: 0,
            paddingBottom: 0,
            marginTop: 0,
            borderWidth: 0,
            duration: 0.5,
            ease: "power3.inOut",
            onComplete: () => {
                resultText.textContent = "";
                result.style.color = '';
                result.style.borderColor = '';
            }
        });
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 1. Fade buttons out first
        await hideButtons();

        // 2. Prepare result box
        resultText.textContent = "";
        result.style.color = "#ffcb6b";
        result.style.borderColor = "rgba(255,255,255,0.15)";
        submitBtn.disabled = true;

        // 3. Start fetch immediately
        const formData = new FormData(form);
        const json = JSON.stringify(Object.fromEntries(formData));
        const fetchPromise = fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: json
        });

        // 4. Expand result box + type message
        const animationPromise = new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve });
            
            tl.to(result, { 
                height: "auto", 
                opacity: 1, 
                paddingTop: 10,
                paddingBottom: 10,
                marginTop: 12,
                borderWidth: 1,
                duration: 0.55, 
                ease: "power3.out"
            })
            .to(resultText, { 
                duration: 1.2, 
                text: "> SENDING YOUR MESSAGE... PLEASE WAIT", 
                ease: "none" 
            })
            .to({}, { duration: 3 }); 
        });

        // 5. Handle results
        try {
            const [response] = await Promise.all([fetchPromise, animationPromise]);
            let jsonData = await response.json();
            const success = (response.status == 200);

            const finishTL = gsap.timeline();
            finishTL.to(resultText, { 
                duration: 0.8, 
                text: { value: "", rtl: true }, 
                ease: "none" 
            });

            setTimeout(() => {
                if (success) {
                    result.style.color = "#c3e88d";
                    result.style.borderColor = "#c3e88d";
                    form.reset();
                    finishTL.to(resultText, { duration: 1.2, text: "✓ MAIL SENT SUCCESSFULLY! THANK YOU!" });
                } else {
                    result.style.color = "#f78c6c";
                    result.style.borderColor = "#f78c6c";
                    finishTL.to(resultText, { duration: 1.2, text: "✗ ERROR: COULD NOT SEND MAIL." });
                }
            }, 850);

        } catch (error) {
            await animationPromise;
            result.style.color = "#f78c6c";
            gsap.to(resultText, { duration: 1.0, text: "✗ NETWORK ERROR. PLEASE TRY AGAIN." });
        } finally {
            submitBtn.disabled = false;
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            // Collapse result box, then fade buttons back in
            gsap.to(result, { 
                height: 0, 
                opacity: 0, 
                paddingTop: 0,
                paddingBottom: 0,
                marginTop: 0,
                borderWidth: 0,
                duration: 0.5, 
                ease: "power3.inOut",
                onComplete: () => {
                    resultText.textContent = "";
                    result.style.color = '';
                    result.style.borderColor = '';
                    showButtons();
                }
            });
        });
    }

    // TEST FILL BUTTON LOGIC;
}

// Removed redundant initScrollReveal logic - now unified in initSectionWipes

const animateBars = (bars) => {
    bars.forEach((bar, index) => {
        const level = bar.getAttribute('data-level');
        gsap.fromTo(bar,
            { width: 0, opacity: 0 },
            {
                width: level,
                opacity: 1,
                duration: 1.8,
                delay: (index * 0.1) + 0.4,
                ease: "power3.out",
                onStart: () => bar.classList.add('bar-animate')
            }
        );
    });
};

// Animate Skill Bars on View (Medium Animation #11)
function initSkillBars() {
    const categories = document.querySelectorAll('.skill-category');
    categories.forEach(cat => {
        const bars = cat.querySelectorAll('.skill-progress');

        ScrollTrigger.create({
            trigger: cat,
            start: "top 80%", // Sync with card reveal for a "stacked" animation feel
            onEnter: () => animateBars(bars),
            onEnterBack: () => animateBars(bars),
            onLeaveBack: () => {
                if (isNavigating) return;
                // Reset bars when scrolling up
                bars.forEach(bar => {
                    gsap.set(bar, { width: 0, opacity: 0 });
                    bar.classList.remove('bar-animate');
                });
            }
        });
    });
}

// Terminal Typing Animation on Scroll
// Terminal Typing Animation on Scroll
function initTerminalAnimation() {
    const codeWindow = document.querySelector('.hire-me-card.glowing-container');
    if (!codeWindow) return;

    const codeElement = codeWindow.querySelector('code');
    if (!codeElement) return;

    // Use GSAP TextPlugin like the services card for butter-smooth 60fps rendering without setTimeout jitter
    const tokens = codeElement.querySelectorAll('span:not(.terminal-cursor)');
    
    // Cache text once to protect against multiple runs
    tokens.forEach(token => {
        if (typeof token.dataset.originalText === 'undefined') {
            token.dataset.originalText = token.textContent; 
        }
    });

    const startTyping = () => {
        if (codeElement.dataset.typingStarted === 'true') return;
        codeElement.dataset.typingStarted = 'true';

        gsap.killTweensOf(codeElement);
        gsap.set(codeElement, { opacity: 1 });
        
        // Empty them out initially
        tokens.forEach(token => token.textContent = "");

        let tl = gsap.timeline({ overwrite: "auto" });

        tokens.forEach(token => {
            const txt = token.dataset.originalText;
            if (txt && txt.length > 0) {
                // Type the token smoothly
                tl.to(token, {
                    // Quick base duration, dynamically scaled by character length
                    duration: Math.max(0.05, txt.length * 0.03), 
                    text: txt,
                    ease: "none"
                });
                
                // Add natural human pauses at punctuation or newlines
                if (txt.includes('\n') || txt.trim() === '') {
                     tl.to({}, {duration: 0.15}); 
                } else if (txt.includes(';') || txt.includes('}')) {
                     tl.to({}, {duration: 0.1});
                }
            }
        });
    };

    ScrollTrigger.create({
        trigger: codeWindow,
        start: "top 80%", 
        onEnter: startTyping,
        onEnterBack: startTyping,
        onLeaveBack: () => {
            if (isNavigating) return;
            codeElement.dataset.typingStarted = 'false';
            gsap.killTweensOf(codeElement);
            gsap.to(codeElement, {
                opacity: 0, 
                duration: 0.3,
                onComplete: () => {
                    tokens.forEach(token => {
                        gsap.killTweensOf(token);
                        token.textContent = "";
                    });
                }
            });
        }
    });
}
// Interactive Terminal Logic
function initInteractiveTerminal() {
    const input = document.getElementById('terminal-input');
    const display = document.getElementById('terminal-input-display');
    const historyDisp = document.getElementById('terminal-history');
    const terminalBody = document.getElementById('terminal-body');
    const pills = document.querySelectorAll('.terminal-pill');

    if (!input || !display || !historyDisp || !terminalBody) return;

    let history = []; // Command history
    let historyIndex = -1;
    let isAwaitingEmail = false;
    let emailStep = 0;
    let tempEmail = "";

    const updatePills = (active) => {
        pills.forEach(pill => {
            if (pill.getAttribute('data-command') === 'exit') {
                pill.classList.toggle('hidden', !active);
            } else {
                pill.classList.toggle('disabled', active);
            }
        });
    };

    // Update real-time visual output with dynamic cursor positioning & selection support
    const updateDisplay = () => {
        const val = input.value;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        
        if (start === end) {
            // Normal cursor positioning
            const before = val.substring(0, start);
            const after = val.substring(start);
            display.innerHTML = `<span>${before}</span><span class="cursor"></span><span>${after}</span>`;
        } else {
            // Selection highlighting (for Ctrl+A or shift+arrows)
            const before = val.substring(0, start);
            const selected = val.substring(start, end);
            const after = val.substring(end);
            display.innerHTML = `<span>${before}</span><span class="terminal-selection">${selected}</span><span>${after}</span>`;
        }
        
        terminalBody.scrollTop = terminalBody.scrollHeight;
    };

    input.addEventListener('input', updateDisplay);
    input.addEventListener('click', updateDisplay);
    input.addEventListener('selectionchange', updateDisplay);
    
    // Focus terminal on body click (mobile support)
    terminalBody.addEventListener('click', () => {
        input.focus();
        updateDisplay();
    });

    const commands = {
        help: () => appendLine("Available commands: help, github, linkedin, email, clear", "highlight-cyan"),
        github: () => appendLine(`Visit: <a href="https://github.com/orewahamza" target="_blank" class="highlight-cyan">github.com/orewahamza</a>`),
        linkedin: () => appendLine(`Connect: <a href="https://www.linkedin.com/in/hamza-mirza-dev" target="_blank" class="highlight-cyan">linkedin.com/in/hamza-mirza-dev</a>`, "highlight-yellow"),
        email: () => {
            appendLine("Step 1: Enter your email address:", "highlight-cyan");
            isAwaitingEmail = true;
            emailStep = 1;
            updatePills(true);
        },
        clear: () => historyDisp.innerHTML = "",
        exit: () => {
            isAwaitingEmail = false;
            emailStep = 0;
            appendLine("Process cancelled.", "highlight-yellow");
            updatePills(false);
        }
    };

    function appendLine(content, className = "") {
        const line = document.createElement('div');
        line.className = `terminal-line-visible ${className}`;
        line.innerHTML = `<span class="line-content">${content}</span>`;
        historyDisp.appendChild(line);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    async function processCommand(cmd) {
        const cleanCmd = cmd.trim();
        if (cleanCmd) {
            history.push(cleanCmd);
            historyIndex = -1;
        }

        if (isAwaitingEmail && cleanCmd.toLowerCase() !== 'exit') {
            if (emailStep === 1) {
                if (cleanCmd.includes("@")) {
                    tempEmail = cleanCmd;
                    appendLine(`Registered: ${tempEmail}`, "highlight-green");
                    appendLine("Step 2: Enter your message:", "highlight-cyan");
                    emailStep = 2;
                } else {
                    appendLine("Invalid email.", "highlight-red");
                }
            } else {
                appendLine("Sending message...", "highlight-yellow");
                
                // Real Web3Forms Submission for Terminal
                try {
                    const response = await fetch("https://api.web3forms.com/submit", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                        body: JSON.stringify({
                            access_key: window.config ? window.config.WEB3FORMS_ACCESS_KEY : "", // Web3Forms Access Key
                            name: "Terminal User",
                            email: tempEmail,
                            message: cleanCmd,
                            subject: "Message from Portfolio Terminal"
                        }),
                    });

                    const json = await response.json();
                    if (response.status === 200) {
                        appendLine("Mail sent successfully! Thank you!", "highlight-green");
                    } else {
                        appendLine("Error: " + (json.message || "Something went wrong"), "highlight-red");
                    }
                } catch (error) {
                    appendLine("Failed to connect to service.", "highlight-red");
                }

                isAwaitingEmail = false;
                updatePills(false);
            }
            input.value = ""; updateDisplay(); return;
        }

        const echoLine = document.createElement('div');
        echoLine.className = "terminal-line-visible";
        echoLine.innerHTML = `<span class="prompt">$</span> ${cmd}`;
        historyDisp.appendChild(echoLine);

        const lowerCmd = cleanCmd.toLowerCase();
        if (commands[lowerCmd]) {
            commands[lowerCmd]();
        } else {
            appendLine(`Command not found: <span class="highlight-red">${cleanCmd}</span>`, "error-line");
            appendLine("Type <span class=\"highlight-cyan\">'help'</span> to see a list of available commands.");
        }
        
        input.value = ""; updateDisplay();
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            processCommand(input.value);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (history.length > 0) {
                if (historyIndex === -1) historyIndex = history.length - 1;
                else if (historyIndex > 0) historyIndex--;
                input.value = history[historyIndex];
                updateDisplay();
                // Move cursor to end
                setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (history.length > 0) {
                if (historyIndex !== -1 && historyIndex < history.length - 1) {
                    historyIndex++;
                    input.value = history[historyIndex];
                } else {
                    historyIndex = -1;
                    input.value = "";
                }
                updateDisplay();
            }
        }
    });

    pills.forEach(pill => pill.addEventListener('click', () => {
        if (!pill.classList.contains('disabled')) processCommand(pill.getAttribute('data-command'));
    }));

    // 22. Flip Toggle Logic with Dynamic Height (Growing Flip)
    const flipBtn = document.getElementById('terminal-flip-btn');
    const flipper = document.getElementById('terminal-flipper');
    
    if (flipBtn && flipper) {
        flipBtn.addEventListener('click', () => {
            const isFlipped = flipper.classList.toggle('is-flipped');
            const isMob = window.innerWidth < 768;
            const front = flipper.querySelector('.terminal-window.front');
            const back = flipper.querySelector('.contact-form-window.back');
            
            // Elements to disable: all pills EXCEPT the flip button and the clear button
            // The user wanted "clear and use terminal" to remain usable.
            const otherActions = document.querySelectorAll('.terminal-pill:not(#terminal-flip-btn):not([data-command="clear"])');
            const clearPill = document.querySelector('.terminal-pill[data-command="clear"]');
            
            // Sync content while flipping
            if (isFlipped) {
                // Dim other actions (GitHub, LinkedIn, Help, Email)
                gsap.to(otherActions, { 
                    opacity: 0.4, 
                    filter: "grayscale(1) blur(1px)",
                    pointerEvents: "none",
                    duration: 0.5, 
                    ease: "power2.inOut" 
                });

                // Ensure Clear Pill is bright and active
                if (clearPill) {
                    gsap.to(clearPill, { opacity: 1, filter: "none", pointerEvents: "auto", duration: 0.5 });
                }

                if (isMob) {
                    gsap.to(flipper, { minHeight: 620, duration: 0.8, ease: "power2.inOut" });
                    setTimeout(() => {
                        if(front) front.style.visibility = 'hidden';
                        if(back) back.style.visibility = 'visible';
                    }, 400);
                }
                flipBtn.innerHTML = '<i class="fas fa-terminal"></i> use terminal';
                flipBtn.title = "Switch back to Terminal View";
            } else {
                // Restore all actions
                gsap.to([otherActions, clearPill], { 
                    opacity: 1, 
                    filter: "grayscale(0) blur(0px)",
                    pointerEvents: "auto",
                    duration: 0.5, 
                    ease: "power2.inOut" 
                });

                if (isMob) {
                    gsap.to(flipper, { minHeight: 460, duration: 0.8, ease: "power2.inOut" });
                    setTimeout(() => {
                        if(front) front.style.visibility = 'visible';
                        if(back) back.style.visibility = 'hidden';
                    }, 400);
                }
                flipBtn.innerHTML = '<i class="fas fa-magic"></i> use form';
                flipBtn.title = "Switch to Form View";
                setTimeout(() => input.focus(), 800);
            }

            // ADDITION: Unified Clear Logic for both Terminal Pill and Form Button
            const contactForm = document.getElementById('portfolio-contact-form');
            const resetFormAction = (e) => {
                if (e) e.preventDefault();
                const inputs = contactForm.querySelectorAll('input, textarea');
                gsap.to(inputs, {
                    opacity: 0,
                    y: -5,
                    duration: 0.3,
                    stagger: 0.05,
                    ease: "power2.inOut",
                    onComplete: () => {
                        contactForm.reset();
                        gsap.set(inputs, { y: 5 }); // Reset position for slide-in
                        gsap.to(inputs, {
                            opacity: 1,
                            y: 0,
                            duration: 0.4,
                            ease: "power2.out",
                            clearProps: "all"
                        });
                    }
                });
            };

            const formResetBtn = document.getElementById('form-clear-btn');
            if (formResetBtn && contactForm) formResetBtn.onclick = resetFormAction;
            
            // Wire the clear pill to also reset the form if it's flipped
            if (clearPill && contactForm) {
                clearPill.onclick = () => {
                    const flippr = document.getElementById('terminal-flipper');
                    if (flippr && flippr.classList.contains('is-flipped')) {
                        resetFormAction();
                    } else {
                        // Original terminal clear logic
                        processCommand('clear');
                    }
                };
            }
            
            // Force Layout Recalculation for absolute children
            setTimeout(() => {
                ScrollTrigger.refresh();
                if (window.lenis) window.lenis.resize();
            }, 800);
        });
    }

    // Initial sync
    updateDisplay();

    // 21. GSAP-Powered Entrance for the terminal and its controls
    const isMobile = window.innerWidth < 768;
    
    // Safety: ensure visibility immediately on mobile to prevent "vanished terminal" bugs
    if (isMobile) {
        gsap.set(".terminal-window, .contact-form-window, .terminal-actions, .terminal-flipper-container", {
            opacity: 1,
            visibility: "visible",
            y: 0,
            scale: 1,
            x: 0
        });
    }

    const contactReveal = ScrollTrigger.create({
        trigger: ".contact-section",
        start: isMobile ? "top 95%" : "top 90%",
        onEnter: () => {
            gsap.to(".terminal-window, .contact-form-window", 
                { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power2.out", overwrite: true }
            );
            gsap.to(".terminal-actions", 
                { opacity: 1, x: 0, duration: 0.8, delay: 0.1, stagger: 0.05, ease: "power2.out", overwrite: true }
            );
        },
        onEnterBack: () => {
            gsap.to(".terminal-window, .contact-form-window, .terminal-actions", { 
                opacity: 1, x: 0, y: 0, scale: 1, overwrite: true 
            });
        },
        onRefresh: (self) => {
            if (self.isActive || isMobile) {
                gsap.set(".terminal-window, .contact-form-window, .terminal-actions", { 
                    opacity: 1, x: 0, y: 0, scale: 1 
                });
            }
        }
    });

    // Refresh after boot
    setTimeout(() => {
        contactReveal.refresh();
        if (contactReveal.isActive || isMobile) {
            gsap.set(".terminal-window, .contact-form-window, .terminal-actions", { 
                opacity: 1, x: 0, y: 0, scale: 1 
            });
        }
    }, 500);
}

// 16. Lenis Smooth Scroll Initialization
function initLenis() {
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smoothHover: true,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    // Expose lenis globally for other functions to use
    window.lenis = lenis;

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Integrate with ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
}

// 17. Text Scroll Animation (21st.dev Style CharacterV1)
function initTextScrollAnimation() {
    const targets = document.querySelectorAll('.section-title');

    targets.forEach(target => {
        const text = target.textContent.trim();
        if (!text) return;

        const isCentered = target.classList.contains('center');
        target.innerHTML = '';

        // Create an inner container to hold the spans and handle centering
        const inner = document.createElement('div');
        inner.style.display = "inline-flex";
        inner.style.width = "100%";
        inner.style.justifyContent = isCentered ? "center" : "flex-start";
        inner.style.perspective = "1000px";
        target.appendChild(inner);

        const chars = text.split('');
        const centerIndex = Math.floor(chars.length / 2);

        const spans = chars.map((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.display = 'inline-block';
            span.style.willChange = 'transform, opacity';
            span.style.webkitBackgroundClip = 'text';
            span.style.webkitTextFillColor = 'inherit';
            inner.appendChild(span);
            return {
                el: span,
                distanceFromCenter: index - centerIndex
            };
        });

        // Mirror 21st.dev CharacterV1 logic: x and rotateX
        spans.forEach(item => {
            gsap.fromTo(item.el,
                {
                    x: item.distanceFromCenter * 50,
                    rotateX: item.distanceFromCenter * 50,
                    opacity: 0
                },
                {
                    x: 0,
                    rotateX: 0,
                    opacity: 1,
                    ease: "none",
                    scrollTrigger: {
                        trigger: target,
                        start: "top bottom-=100",
                        end: "top center",
                        scrub: 1
                    }
                }
            );
        });

        // Trigger the underline animation (revealed class)
        ScrollTrigger.create({
            trigger: target,
            start: "top 90%",
            onEnter: () => target.classList.add('revealed'),
            once: true
        });
    });
}

// 18. Dedicated Hero Name Animation removed to fix invisible name issues
// (Background-clip: text is notoriously picky with split-text spans)

// 19. Glowing Effect (Re-added for Home CMD and About CMD)
// 19. Unified Proximity-Based Glowing Effect (High Performance & Stable)
// 19. GSAP-Powered Proximity Glowing Effect (Ultra-Stable & Performant)
function initGlowingEffect() {
    const targets = document.querySelectorAll('.monitor, .skill-category, .hire-me-card, .service-card, .card-front');
    if (!targets.length) return;

    window.addEventListener('mousemove', (e) => {
        if (window.innerWidth < 768) return;

        const mx = e.clientX;
        const my = e.clientY;

        targets.forEach(target => {
            const effect = target.querySelector('.glowing-effect');
            if (!effect) return;

            const rect = target.getBoundingClientRect();
            // Reduced buffer to 40px for a more controlled "vanishing" feel while keeping the premium glow
            const buffer = 40; 

            const isNear = 
                mx >= rect.left - buffer &&
                mx <= rect.right + buffer &&
                my >= rect.top - buffer &&
                my <= rect.bottom + buffer;

            if (isNear) {
                const relX = mx - rect.left;
                const relY = my - rect.top;

                // Sync mouse position immediately for the initial frame
                gsap.set(target, {
                    '--mouse-x': `${relX}px`, 
                    '--mouse-y': `${relY}px`
                });
                
                // Fade in the effect with a snappier duration to prevent "blinking" perception
                gsap.to(effect, {
                    opacity: 1,
                    duration: 0.3,
                    ease: "power2.out",
                    overwrite: 'auto'
                });
            } else {
                // Fade out snappily when leaving the buffer zone
                gsap.to(effect, {
                    opacity: 0,
                    duration: 0.4,
                    ease: "power2.inOut",
                    overwrite: 'auto'
                });
            }
        });
    }, { passive: true });

    // Ensure glows vanish if mouse leaves the viewport entirely
    document.addEventListener('mouseleave', () => {
        targets.forEach(target => {
            const effect = target.querySelector('.glowing-effect');
            if (effect) {
                gsap.to(effect, { opacity: 0, duration: 0.4, overwrite: 'auto' });
            }
        });
    });
}

// --- NEW EXTRA ANIMATIONS ---
function initExtraAnimations() {
    // 1. Continuous slow pulse on the Hero "Projects" button
    const projectsBtn = document.querySelector(".hero .btn-filled");
    if (projectsBtn) {
        const pulse = gsap.to(projectsBtn, {
            scale: 1.05,
            boxShadow: "0 8px 25px rgba(0, 212, 255, 0.6)",
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        projectsBtn.addEventListener('mouseenter', () => {
            // Pause pulse and move to hover state
            pulse.pause();
            gsap.to(projectsBtn, {
                y: -5,
                scale: 1.1,
                boxShadow: "0 15px 35px rgba(0, 212, 255, 0.8)",
                duration: 0.4,
                ease: "power2.out",
                overwrite: true
            });
        });

        projectsBtn.addEventListener('mouseleave', () => {
            // Transition back to pulse
            gsap.to(projectsBtn, {
                y: 0,
                scale: projectsBtn._gsap && projectsBtn._gsap.scaleX || 1, // Start from current scale
                duration: 0.4,
                ease: "power2.inOut",
                onComplete: () => pulse.play()
            });
        });
    }

    // 2. Floating Footer Logo
    gsap.to(".footer-logo", {
        y: -10,
        textShadow: "0 0 20px rgba(0, 212, 255, 0.8)",
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
    });

    // 3. Continuous slow rotation on Project Card Placeholder Icons
    const projectIcons = document.querySelectorAll(".placeholder-project i");
    projectIcons.forEach(icon => {
        // Continuous rotation
        gsap.to(icon, {
            rotation: 360,
            duration: 20,
            repeat: -1,
            ease: "none"
        });

        // Smooth hover scale (replacing CSS transition to avoid transform conflicts)
        const card = icon.closest('.portfolio-card');
        if (card) {
            card.addEventListener('mouseenter', () => {
                gsap.to(icon, {
                    scale: 1.1,
                    opacity: 1,
                    filter: "drop-shadow(0 0 30px var(--accent-primary))",
                    duration: 0.5,
                    ease: "power2.out"
                });
            });
            card.addEventListener('mouseleave', () => {
                gsap.to(icon, {
                    scale: 1,
                    opacity: 0.8,
                    filter: "drop-shadow(0 0 20px var(--accent-glow))",
                    duration: 0.5,
                    ease: "power2.out"
                });
            });
        }
    });

    // 4. Bouncing Map Marker in About Section
    gsap.to(".about-location i", {
        y: -6,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "power2.out"
    });

    // 5. Constant pulsing of window dots (Independent per container)
    const dotContainers = document.querySelectorAll(".terminal-dots, .window-dots, .card-header-dots");
    dotContainers.forEach(container => {
        const dots = container.querySelectorAll(".dot");
        gsap.to(dots, {
            opacity: 0.3,
            scale: 0.8,
            duration: 0.8,
            stagger: 0.15,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    });

    // 6. Smooth floating for Social Icons
    gsap.to(".social-icon", {
        y: -5,
        duration: 2.5,
        stagger: 0.1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 2, // Wait for the entrance animation to finish before recording starting Y values
        force3D: true // Ensure subpixel anti-aliasing
    });

    // 7. Floating Terminals (More distinct but slower for elegance)
    gsap.to(".hero-image .desk-setup, .about-visual", {
        y: -20,
        duration: 4.5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        force3D: true
    });

    // 8. Fluid Floating effect for About text block (Improved for smoothness)
    gsap.to(".about-text", {
        y: -12,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        // Multi-axis movement to make it feel more "alive" than a simple up/down
        rotation: 0.5,
        force3D: true
    });
}

// --- NEW INTERACTIVE ANIMATIONS ---
function init3DName() {
    const nameEl = document.querySelector('.hero .name');
    if (!nameEl) return;
    if (window.innerWidth < 768) return; // Disable completely on mobile

    // Smooth magnetic 3D rotation based on mouse
    window.addEventListener('mousemove', (e) => {
        if (window.innerWidth < 768) return; // Disable on mobile for stability
        // Calculate center of screen
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Offset percentage (-1 to 1) 
        // More subtle range to avoid 'background-clip: text' glitches
        const percentX = (e.clientX - centerX) / centerX;
        const percentY = (e.clientY - centerY) / centerY;

        // Max rotation in degrees - reduced for stability
        const maxRot = 15;

        gsap.to(nameEl, {
            rotationY: percentX * maxRot,
            rotationX: -percentY * (maxRot / 2), // Half intensity for X to reduce artifacts
            transformPerspective: 1200,
            duration: 0.8,
            ease: "power2.out",
            overwrite: "auto"
        });
    });
}

function initMouseSpotlight() {
    const gridBg = document.querySelector('.grid-bg');
    if (!gridBg) return;

    window.addEventListener('mousemove', (e) => {
        if (window.innerWidth < 768) return;
        gridBg.style.setProperty('--mouse-x', `${e.clientX}px`);
        gridBg.style.setProperty('--mouse-y', `${e.clientY}px`);
    });
}


function initChatbot() {
    const launcher = document.getElementById('chatbotLauncher');
    const container = document.getElementById('chatbotContainer');
    const closeBtn = document.getElementById('closeChat');
    const chatMessages = document.getElementById('chatMessages');
    const chatOptions = document.getElementById('chatOptions');

    if (!launcher || !container) return;

    const botData = {
        name: "Luffy",
        intro: "Hi there! I'm Luffy. Want to know more about Hamza or this portfolio? Ask away!",
        qa: [
            {
                q: "Who is Hamza?",
                a: "Hamza is a passionate Full Stack Developer who loves building web apps with the help of MERN stack. He's also a big fan of anime! You can learn more [about him here](#about)."
            },
            {
                q: "What services do you offer?",
                a: "Hamza builds complete websites (frontend and backend). You can [see more services here](#services)!"
            },
            {
                q: "What are your top projects?",
                a: "Check out the [projects section](#projects)! Hamza has built a Fashion Shop and some other websites."
            },
            {
                q: "How can I contact him?",
                a: "You can find his links in the footer, or use the [contact terminal](#contact)!"
            },
            {
                q: "What tech do you use?",
                a: "Hamza uses the MERN stack for building high-quality sites. See his [other skills here](#skills)."
            },
            {
                q: "Can I ask other questions?",
                a: "I'm not connected to an AI, so I can only answer these specific questions. To ask more, please [contact Hamza](#contact) directly!"
            }
        ]
    };

    launcher.addEventListener('click', () => {
        container.classList.toggle('active');
        if (container.classList.contains('active')) {
            renderOptions();
        }
    });

    closeBtn.addEventListener('click', () => {
        container.classList.remove('active');
    });

    function addMessage(text, type) {
        const msg = document.createElement('div');
        msg.className = `message ${type}-message`;

        // Simple markdown-style link conversion: [text](#id) -> <a href="#id" class="chat-link">text</a>
        const processedText = text.replace(/\[([^\]]+)\]\((#[^)]+)\)/g, '<a href="$2" class="chat-link">$1</a>');
        msg.innerHTML = processedText;

        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Handle link clicks in chat to close the container
    chatMessages.addEventListener('click', (e) => {
        if (e.target.classList.contains('chat-link')) {
            container.classList.remove('active');
        }
    });

    function showTyping() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return indicator;
    }

    function renderOptions(showAll = false) {
        chatOptions.innerHTML = '';
        const limit = showAll ? botData.qa.length : 2;

        botData.qa.slice(0, limit).forEach(item => {
            const btn = document.createElement('div');
            btn.className = 'chat-option';
            btn.textContent = item.q;
            btn.addEventListener('click', () => {
                handleQuestion(item);
            });
            chatOptions.appendChild(btn);
        });

        if (botData.qa.length > 2) {
            const toggle = document.createElement('div');
            toggle.className = 'chat-option toggle-options';
            toggle.innerHTML = showAll ? 'See less <i class="fas fa-chevron-up"></i>' : 'More questions <i class="fas fa-chevron-down"></i>';
            toggle.style.background = 'rgba(0, 212, 255, 0.15)';
            toggle.style.borderColor = '#00d4ff';

            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                renderOptions(!showAll);
            });
            chatOptions.appendChild(toggle);
        }
    }

    function handleQuestion(item) {
        addMessage(item.q, 'user');

        // Disable only individual questions, keep toggle functional
        const options = chatOptions.querySelectorAll('.chat-option:not(.toggle-options)');
        options.forEach(opt => {
            opt.style.pointerEvents = 'none';
            opt.style.opacity = '0.5';
        });

        const indicator = showTyping();

        setTimeout(() => {
            indicator.remove();
            addMessage(item.a, 'bot');

            // Re-enable individual questions
            options.forEach(opt => {
                opt.style.pointerEvents = 'auto';
                opt.style.opacity = '1';
            });
        }, 1500);
    }
}

// 21. About Section Text Highlight on Scroll
function initTextReveal() {
    const revealTexts = document.querySelectorAll('.about-text .reveal-text, .about-text .about-email, .hero-description .reveal-text');
    
    // Convert NodeList to array to help with batch scoping if needed
    revealTexts.forEach((el, index) => {

        // Setup start state. Use willChange to promote to its own GPU layer
        gsap.set(el, { 
            opacity: 0, 
            y: 20,
            webkitMaskImage: "linear-gradient(to right, #000 50%, transparent 100%)",
            webkitMaskSize: "300% 100%",
            webkitMaskPosition: "100% 0%",
            willChange: "transform, opacity",
            // Small Z translation forces a stable GPU texture that isn't re-rasterized every frame
            z: 0.1
        });

        const startTyping = () => {
            if (el.dataset.typingStarted === 'true') return;
            el.dataset.typingStarted = 'true';

            gsap.killTweensOf(el);

            const tl = gsap.timeline();
            
            // 1. Smooth Fade & Cinematic Reveal
            tl.to(el, {
                opacity: 1,
                y: 0,
                webkitMaskPosition: "0% 0%",
                duration: 1.5, // Faster entrance
                ease: "power2.out",
                force3D: true,
                // Removed `index * 0.25` delay! Since each has its own ScrollTrigger based on their position, they stagger naturally.
                // We add a tiny fixed delay to ensure smooth paint composite.
                delay: 0.1, 
                onComplete: () => {
                    // Clear the mask property here so it doesn't interfere with the smooth floating and pixel-snap the text.
                    gsap.set(el, { clearProps: "webkitMaskImage,webkitMaskSize,webkitMaskPosition" });
                }
            });

            // 2. Continuous "Alive" Floating
            // Increased the distance (-15 instead of -8) and reduced duration text so it moves fast enough 
            // that the browser can apply smooth fractional rendering without snapping to integer pixels ("staircasing").
            tl.to(el, {
                y: -12, 
                duration: 2.8,
                repeat: -1,
                yoyo: true,
                ease: "power1.inOut",
                force3D: true
            }, ">");
        };

        ScrollTrigger.create({
            trigger: el,
            start: "top 80%", // Only trigger when section is more visible to prevent jumpy layout shifts
            onEnter: () => {
                if (isNavigating) {
                    gsap.set(el, { opacity: 1, y: 0, webkitMaskPosition: "0% 0%" });
                } else {
                    startTyping();
                }
            },
            onEnterBack: () => {
                 if (isNavigating) {
                    gsap.set(el, { opacity: 1, y: 0, webkitMaskPosition: "0% 0%" });
                } else {
                    startTyping();
                }
            },
            onLeaveBack: () => {
                el.dataset.typingStarted = 'false';
                gsap.killTweensOf(el);
                gsap.to(el, {
                    opacity: 0,
                    y: 20,
                    webkitMaskPosition: "100% 0%",
                    duration: 0.4,
                    ease: "power2.in",
                    onComplete: () => {
                        // Restore mask for next time
                        gsap.set(el, {
                            webkitMaskImage: "linear-gradient(to right, #000 50%, transparent 100%)",
                            webkitMaskSize: "300% 100%",
                            webkitMaskPosition: "100% 0%"
                        });
                    }
                });
            }
        });
    });
}

// 22. Better Accessibility & Keyboard Support
function initAccessibility() {
    // 1. Accessibility for Terminal Pills
    const pills = document.querySelectorAll('.terminal-pill');
    pills.forEach(pill => {
        pill.setAttribute('role', 'button');
        pill.setAttribute('tabindex', '0');
        pill.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                pill.click();
            }
        });
    });

    // 2. Accessibility for Chatbot
    const chatbotLauncher = document.getElementById('chatbotLauncher');
    if (chatbotLauncher) {
        chatbotLauncher.setAttribute('aria-label', 'Open chatbot');
        chatbotLauncher.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                chatbotLauncher.click();
            }
        });
    }

    // 3. Ensuring Project Flip Buttons are accessible
    const flipBtns = document.querySelectorAll('.flip-btn, .flip-back-btn');
    flipBtns.forEach(btn => {
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
    });
}
