import gsap from "gsap";
import "./success.css";


/* =========================================================
   CHORUS 2026 — SUCCESS PAGE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(
    window.location.search
  );

  const registrationId =
    params.get("id");


  const registrationElement =
    document.querySelector("#registration-id");


  const copyButton =
    document.querySelector("#copy-id");


  const copyMessage =
    document.querySelector("#copy-message");


  /* -------------------------------------------------------
     DISPLAY REGISTRATION ID
  ------------------------------------------------------- */

  if (registrationId) {

    registrationElement.textContent =
      registrationId;

  }


  /* -------------------------------------------------------
     COPY REGISTRATION ID
  ------------------------------------------------------- */

  copyButton.addEventListener(
    "click",
    async () => {

      if (!registrationId) return;

      try {

        await navigator.clipboard.writeText(
          registrationId
        );

        copyMessage.textContent =
          "Registration ID copied ✓";


        gsap.fromTo(
          copyMessage,

          {
            opacity: 0,
            y: 5
          },

          {
            opacity: 1,
            y: 0,
            duration: .4
          }
        );


      } catch (error) {

        console.error(
          "Could not copy registration ID:",
          error
        );

      }

    }
  );


  /* =======================================================
     PAGE ANIMATION
  ======================================================= */

  gsap.from(".success-container", {

    opacity: 0,

    y: 40,

    duration: 1,

    ease: "power3.out"

  });


  gsap.from(".success-icon", {

    scale: 0,

    rotation: -90,

    duration: .8,

    delay: .3,

    ease: "back.out(1.7)"

  });


  gsap.from(
    [
      ".eyebrow",
      "h1",
      ".success-message",
      ".registration-card",
      ".event-details",
      ".success-actions"
    ],

    {

      opacity: 0,

      y: 25,

      duration: .7,

      delay: .4,

      stagger: .08,

      ease: "power3.out"

    }

  );

});