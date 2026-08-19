import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);


/* =========================================================
   CHORUS 2026 — MAIN PAGE
========================================================= */

document.querySelector('#app').innerHTML = `

  <main class="site">

    <!-- =====================================================
         HERO
    ====================================================== -->

    <section class="hero">

      <nav class="navbar">

        <a href="/" class="logo">
          CHORUS<span>2026</span>
        </a>

        <a
          href="/src/register/register.html"
          class="nav-button"
        >
          Register
        </a>

      </nav>


      <div class="hero-content">

        <p class="eyebrow hero-eyebrow">
          AN ECHO OF WORSHIP
        </p>


        <h1 class="hero-title">

          CHORUS

          <span>2026</span>

        </h1>


        <p class="hero-description">

          One sound. One spirit. One encounter.

          A gathering of worshippers, singers,
          musicians and lovers of God's presence.

        </p>


        <div class="hero-actions">

          <a
            href="/src/register/register.html"
            class="primary-button hero-button"
          >
            Register Now
            <span>↗</span>
          </a>


          <a
            href="#about"
            class="secondary-button hero-button"
          >
            Explore
          </a>

        </div>

      </div>


      <div class="hero-footer">

        <span>
          13TH SEPTEMBER 2026
        </span>

        <span>
          PORT HARCOURT, NIGERIA
        </span>

      </div>


      <div class="scroll-indicator">

        <span></span>

        SCROLL TO EXPLORE

      </div>

    </section>



    <!-- =====================================================
         ABOUT
    ====================================================== -->

    <section
      class="about"
      id="about"
    >

      <div class="section-label">
        01 — ABOUT
      </div>


      <div class="about-content">

        <h2>

          More than a program.

          <span>
            An encounter.
          </span>

        </h2>


        <p>

          CHORUS 2026 is a gathering created to bring
          people together through worship, music,
          fellowship and an atmosphere centered
          on God's presence.

        </p>

      </div>

    </section>



    <!-- =====================================================
         REGISTRATION
    ====================================================== -->

    <section
      class="register-section"
      id="register"
    >

      <div class="section-label">
        02 — REGISTRATION
      </div>


      <div class="register-card">

        <p class="eyebrow">
          CHORUS 2026
        </p>


        <h2>

          Your seat

          <span>
            awaits.
          </span>

        </h2>


        <p>
          Secure your place at CHORUS 2026.
        </p>


        <a
          href="/src/register/register.html"
          class="primary-button"
        >
          Begin Registration
          <span>→</span>
        </a>

      </div>

    </section>

  </main>

`;



/* =========================================================
   GSAP — HERO TIMELINE
========================================================= */

const tl = gsap.timeline({
  defaults: {
    ease: "power3.out"
  }
});



/* =========================================================
   INITIAL STATES
========================================================= */

gsap.set(".navbar", {
  opacity: 0,
  y: -30
});

gsap.set(".hero-eyebrow", {
  opacity: 0,
  y: 30
});

gsap.set(".hero-title", {
  opacity: 0,
  y: 80
});

gsap.set(".hero-description", {
  opacity: 0,
  y: 35
});

gsap.set(".hero-button", {
  opacity: 0,
  y: 25
});

gsap.set(".hero-footer", {
  opacity: 0,
  y: 20
});

gsap.set(".scroll-indicator", {
  opacity: 0
});



/* =========================================================
   NAVBAR
========================================================= */

tl.to(".navbar", {
  opacity: 1,
  y: 0,
  duration: 0.8
});



/* =========================================================
   EYEBROW
========================================================= */

tl.to(
  ".hero-eyebrow",
  {
    opacity: 1,
    y: 0,
    duration: 0.7
  },
  "-=0.35"
);



/* =========================================================
   TITLE
========================================================= */

tl.to(
  ".hero-title",
  {
    opacity: 1,
    y: 0,
    duration: 1.2,
    ease: "power4.out"
  },
  "-=0.35"
);



/* =========================================================
   DESCRIPTION
========================================================= */

tl.to(
  ".hero-description",
  {
    opacity: 1,
    y: 0,
    duration: 0.8
  },
  "-=0.55"
);



/* =========================================================
   BUTTONS
========================================================= */

tl.to(
  ".hero-button",
  {
    opacity: 1,
    y: 0,
    duration: 0.7,
    stagger: 0.12
  },
  "-=0.4"
);



/* =========================================================
   FOOTER
========================================================= */

tl.to(
  ".hero-footer",
  {
    opacity: 1,
    y: 0,
    duration: 0.7
  },
  "-=0.25"
);



/* =========================================================
   SCROLL INDICATOR
========================================================= */

tl.to(
  ".scroll-indicator",
  {
    opacity: 1,
    duration: 0.8
  },
  "-=0.3"
);



/* =========================================================
   TITLE MICRO ANIMATION
========================================================= */

gsap.from(".hero-title span", {

  opacity: 0,
  y: 35,

  duration: 1,

  delay: 1.5,

  ease: "power3.out"

});



/* =========================================================
   PRIMARY BUTTON HOVER
========================================================= */

const primaryButtons =
  document.querySelectorAll(".primary-button");


primaryButtons.forEach((button) => {

  const arrow =
    button.querySelector("span");


  button.addEventListener("mouseenter", () => {

    gsap.to(button, {

      y: -4,

      duration: 0.3,

      ease: "power2.out"

    });


    if (arrow) {

      gsap.to(arrow, {

        x: 5,

        duration: 0.3,

        ease: "power2.out"

      });

    }

  });


  button.addEventListener("mouseleave", () => {

    gsap.to(button, {

      y: 0,

      duration: 0.3,

      ease: "power2.out"

    });


    if (arrow) {

      gsap.to(arrow, {

        x: 0,

        duration: 0.3,

        ease: "power2.out"

      });

    }

  });

});



/* =========================================================
   NAV BUTTON HOVER
========================================================= */

const navButton =
  document.querySelector(".nav-button");


if (navButton) {

  navButton.addEventListener(
    "mouseenter",
    () => {

      gsap.to(navButton, {

        y: -2,

        duration: 0.25,

        ease: "power2.out"

      });

    }
  );


  navButton.addEventListener(
    "mouseleave",
    () => {

      gsap.to(navButton, {

        y: 0,

        duration: 0.25,

        ease: "power2.out"

      });

    }
  );

}



/* =========================================================
   SCROLL INDICATOR
========================================================= */

gsap.to(
  ".scroll-indicator span",
  {

    scaleY: 0.45,

    transformOrigin: "top",

    duration: 1.4,

    repeat: -1,

    yoyo: true,

    ease: "sine.inOut"

  }
);



/* =========================================================
   SCROLLTRIGGER — ABOUT
========================================================= */

gsap.from(
  ".about .section-label",
  {

    scrollTrigger: {

      trigger: ".about",

      start: "top 80%",

      toggleActions:
        "play none none reverse"

    },

    opacity: 0,

    x: -40,

    duration: 0.8,

    ease: "power3.out"

  }
);


gsap.from(
  ".about-content h2",
  {

    scrollTrigger: {

      trigger: ".about-content",

      start: "top 80%",

      toggleActions:
        "play none none reverse"

    },

    opacity: 0,

    y: 80,

    duration: 1,

    ease: "power4.out"

  }
);


gsap.from(
  ".about-content p",
  {

    scrollTrigger: {

      trigger: ".about-content p",

      start: "top 85%",

      toggleActions:
        "play none none reverse"

    },

    opacity: 0,

    y: 40,

    duration: 0.8,

    delay: 0.15,

    ease: "power3.out"

  }
);



/* =========================================================
   SCROLLTRIGGER — REGISTRATION
========================================================= */

gsap.from(
  ".register-section .section-label",
  {

    scrollTrigger: {

      trigger: ".register-section",

      start: "top 80%",

      toggleActions:
        "play none none reverse"

    },

    opacity: 0,

    x: -40,

    duration: 0.8,

    ease: "power3.out"

  }
);


gsap.from(
  ".register-card",
  {

    scrollTrigger: {

      trigger: ".register-card",

      start: "top 80%",

      toggleActions:
        "play none none reverse"

    },

    opacity: 0,

    y: 100,

    scale: 0.97,

    duration: 1.1,

    ease: "power4.out"

  }
);