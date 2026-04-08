gsap.registerPlugin(ScrollTrigger);

const tl = gsap.timeline({
    scrollTrigger: {
        trigger: ".scroll-trigger-section",
        start: "top top",
        end: "+=4000", // Keep it pinned for 4000px of scrolling
        pin: true,
        scrub: 1.5 // Smooth scrubbing effect
    }
});

// initial setup
gsap.set(".layer-sms", { opacity: 0, scale: 0.95 });
gsap.set(".layer-laptop", { opacity: 0, scale: 0.9 });
gsap.set(".laptop-screen", { opacity: 0, scale: 0.8 });
gsap.set(".step-email", { opacity: 0, y: 30 });
gsap.set(".step-sms", { opacity: 0, y: 30 });
gsap.set(".step-laptop", { opacity: 0, y: 30 });

// 1. Email state (bring in text)
tl.to(".step-email", { opacity: 1, y: 0, duration: 2 });

// Hold
tl.to({}, {duration: 2});

// 2. Transition Email -> SMS
tl.to(".step-email", { opacity: 0, y: -30, duration: 2 }, "email-out")
  .to(".layer-email", { opacity: 0, scale: 1.1, filter: "blur(10px)", duration: 4 }, "email-out")
  .to(".layer-sms", { opacity: 1, scale: 1, duration: 4 }, "email-out+=0.5")
  .to(".step-sms", { opacity: 1, y: 0, duration: 2 }, "email-out+=2");

// Hold
tl.to({}, {duration: 2});

// 3. Transition SMS -> Laptop
tl.to(".step-sms", { opacity: 0, y: -30, duration: 2 }, "sms-out")
  .to(".layer-sms", { opacity: 0, scale: 1.1, filter: "blur(10px)", duration: 4 }, "sms-out")
  .to(".layer-laptop", { opacity: 1, scale: 1, duration: 4 }, "sms-out+=0.5")
  .to(".laptop-screen", { opacity: 1, scale: 1, duration: 3, ease: "back.out(1.7)" }, "sms-out+=2")
  .to(".step-laptop", { opacity: 1, y: 0, duration: 2 }, "sms-out+=2.5");

// Final hold
tl.to({}, {duration: 3});
