import gsap from "gsap";
import "./register.css";
import { supabase } from "../lib/supabase.js";


/* =========================================================
   CHORUS 2026 — REGISTRATION FORM
========================================================= */

const form = document.querySelector("#registration-form");
const submitButton = document.querySelector("#submit-button");
const buttonText = document.querySelector("#button-text");


/* =========================================================
   SUPABASE REGISTRATION
========================================================= */

if (form) {

  form.addEventListener("submit", async (event) => {

    event.preventDefault();


    /* -------------------------------------------------------
       BROWSER VALIDATION
    ------------------------------------------------------- */

    if (!form.checkValidity()) {

      form.reportValidity();

      return;

    }


    /* -------------------------------------------------------
       LOADING STATE
    ------------------------------------------------------- */

    submitButton.disabled = true;

    buttonText.textContent = "Registering...";


    /* -------------------------------------------------------
       GET FORM DATA
    ------------------------------------------------------- */

    const formData = new FormData(form);


    const registrationData = {

      full_name:
        formData.get("fullName")?.trim(),

      phone:
        formData.get("phone")?.trim(),

      email:
        formData.get("email")?.trim() || null,

      gender:
        formData.get("gender"),

      city:
        formData.get("city")?.trim(),

      church:
        formData.get("church")?.trim() || null,

      attendance:
        formData.get("attendance"),

      group_size:
        Number(formData.get("groupSize")),

      source:
        formData.get("source") || null,

      message:
        formData.get("message")?.trim() || null

    };


    console.log(
      "Sending registration:",
      registrationData
    );


    /* -------------------------------------------------------
       SEND TO SUPABASE
    ------------------------------------------------------- */

    try {

      const { data, error } = await supabase

        .from("registrations")

        .insert([registrationData])

        .select("registration_id")

        .single();


      /* -----------------------------------------------------
         CHECK FOR SUPABASE ERROR
      ----------------------------------------------------- */

      if (error) {

        throw error;

      }


      /* -----------------------------------------------------
         GET REGISTRATION ID
      ----------------------------------------------------- */

      const registrationId =
        data?.registration_id;


      if (!registrationId) {

        throw new Error(
          "Registration was saved, but no registration ID was returned."
        );

      }


      console.log(
        "Registration successful:",
        registrationId
      );


      /* =====================================================
         SEND AUTOMATED CONFIRMATION EMAIL
      ===================================================== */

      let emailStatus = "skipped";

      if (registrationData.email) {

        console.log(
          "Sending confirmation email..."
        );

        try {

          const { data: emailData, error: emailError } =
            await supabase.functions.invoke(
              "send-registration-email",
              {
                body: {

                  full_name:
                    registrationData.full_name,

                  phone:
                    registrationData.phone,

                  email:
                    registrationData.email,

                  gender:
                    registrationData.gender,

                  city:
                    registrationData.city,

                  registration_id:
                    registrationId,

                  attendance:
                    registrationData.attendance,

                  group_size:
                    registrationData.group_size,

                  church:
                    registrationData.church,

                  source:
                    registrationData.source,

                  message:
                    registrationData.message

                }
              }
            );


          if (emailError) {

            /*
             * IMPORTANT:
             * Do NOT fail the registration if the
             * email fails.
             *
             * The person's registration has already
             * been successfully saved.
             */

            console.error(
              "Confirmation email failed:",
              emailError
            );

            emailStatus = "failed";

          }

          else {

            console.log(
              "Confirmation email sent:",
              emailData
            );

            emailStatus = "sent";

          }

        } catch (emailException) {

          console.error(
            "Confirmation email failed:",
            emailException
          );

          emailStatus = "failed";

        }

      }

      else {

        console.log(
          "No email provided. Skipping confirmation email."
        );

      }


      /* -----------------------------------------------------
         SUCCESS STATE
      ----------------------------------------------------- */

      buttonText.textContent =
        "Registration Complete ✓";


      /* Small success animation */

      gsap.to(submitButton, {

        scale: 1.04,

        duration: 0.2,

        yoyo: true,

        repeat: 1,

        ease: "power2.out"

      });


      /* -----------------------------------------------------
         REDIRECT TO SUCCESS PAGE
      ----------------------------------------------------- */

      setTimeout(() => {

        window.location.href =
          `/src/register/success.html?id=${encodeURIComponent(
            registrationId
          )}&email=${emailStatus}`;

      }, 1000);


    } catch (error) {

      console.error(
        "Registration failed:",
        error
      );


      /* -----------------------------------------------------
         ERROR STATE
      ----------------------------------------------------- */

      buttonText.textContent =
        "Registration Failed";


      gsap.fromTo(

        submitButton,

        {
          x: -6
        },

        {
          x: 6,

          duration: 0.08,

          repeat: 5,

          yoyo: true,

          ease: "power1.inOut",

          onComplete: () => {

            gsap.set(submitButton, {
              x: 0
            });

          }

        }

      );


      submitButton.disabled = false;


      setTimeout(() => {

        buttonText.textContent =
          "Complete Registration";

      }, 2500);

    }

  });

}


/* =========================================================
   CHORUS 2026 — REGISTRATION PAGE ANIMATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {


  /* =======================================================
     INITIAL STATES
  ======================================================= */

  gsap.set(".registration-nav", {
    opacity: 0,
    y: -25
  });


  gsap.set(".registration-intro", {
    opacity: 0,
    x: -50
  });


  gsap.set(".registration-form", {
    opacity: 0,
    x: 50
  });


  gsap.set(".registration-intro .eyebrow", {
    opacity: 0,
    y: 20
  });


  gsap.set(".registration-intro h1", {
    opacity: 0,
    y: 50
  });


  gsap.set(".intro-text", {
    opacity: 0,
    y: 25
  });


  gsap.set(".event-info > div", {
    opacity: 0,
    y: 20
  });


  gsap.set(".form-section", {
    opacity: 0,
    y: 35
  });


  gsap.set(".form-consent", {
    opacity: 0,
    y: 20
  });


  gsap.set(".submit-button", {
    opacity: 0,
    y: 20
  });


  gsap.set(".form-note", {
    opacity: 0
  });


  /* =======================================================
     MAIN PAGE ENTRANCE
  ======================================================= */

  const tl = gsap.timeline({
    defaults: {
      ease: "power3.out"
    }
  });


  /* -------------------------------------------------------
     NAVIGATION
  ------------------------------------------------------- */

  tl.to(".registration-nav", {

    opacity: 1,

    y: 0,

    duration: 0.8

  });


  /* -------------------------------------------------------
     LEFT SIDE
  ------------------------------------------------------- */

  tl.to(".registration-intro", {

    opacity: 1,

    x: 0,

    duration: 1

  }, "-=0.4");


  tl.to(".registration-intro .eyebrow", {

    opacity: 1,

    y: 0,

    duration: 0.6

  }, "-=0.6");


  tl.to(".registration-intro h1", {

    opacity: 1,

    y: 0,

    duration: 1,

    ease: "power4.out"

  }, "-=0.35");


  tl.to(".intro-text", {

    opacity: 1,

    y: 0,

    duration: 0.7

  }, "-=0.5");


  /* -------------------------------------------------------
     EVENT INFORMATION
  ------------------------------------------------------- */

  tl.to(".event-info > div", {

    opacity: 1,

    y: 0,

    duration: 0.6,

    stagger: 0.15

  }, "-=0.3");


  /* -------------------------------------------------------
     FORM
  ------------------------------------------------------- */

  tl.to(".registration-form", {

    opacity: 1,

    x: 0,

    duration: 1,

    ease: "power3.out"

  }, "-=0.9");


  /* -------------------------------------------------------
     FORM SECTIONS
  ------------------------------------------------------- */

  tl.to(".form-section", {

    opacity: 1,

    y: 0,

    duration: 0.7,

    stagger: 0.12

  }, "-=0.5");


  /* -------------------------------------------------------
     CONSENT
  ------------------------------------------------------- */

  tl.to(".form-consent", {

    opacity: 1,

    y: 0,

    duration: 0.6

  }, "-=0.3");


  /* -------------------------------------------------------
     SUBMIT BUTTON
  ------------------------------------------------------- */

  tl.to(".submit-button", {

    opacity: 1,

    y: 0,

    duration: 0.7,

    ease: "back.out(1.5)"

  }, "-=0.25");


  /* -------------------------------------------------------
     FORM NOTE
  ------------------------------------------------------- */

  tl.to(".form-note", {

    opacity: 1,

    duration: 0.6

  }, "-=0.35");


  /* =======================================================
     INPUT FOCUS ANIMATION
  ======================================================= */

  const fields = document.querySelectorAll(
    ".field input, .field select, .field textarea"
  );


  fields.forEach((field) => {

    field.addEventListener("focus", () => {

      gsap.to(field, {

        y: -2,

        duration: 0.25,

        ease: "power2.out"

      });

    });


    field.addEventListener("blur", () => {

      gsap.to(field, {

        y: 0,

        duration: 0.25,

        ease: "power2.out"

      });

    });

  });


  /* =======================================================
     ATTENDANCE / GROUP SIZE LOGIC
  ======================================================= */

  const attendance =
    document.querySelector("#attendance");

  const groupSize =
    document.querySelector("#groupSize");


  if (attendance && groupSize) {

    attendance.addEventListener(
      "change",
      () => {

        if (attendance.value === "alone") {

          groupSize.value = 1;

          groupSize.min = 1;

          groupSize.max = 1;

          groupSize.disabled = true;

        }

        else {

          groupSize.disabled = false;

          groupSize.min = 1;

          groupSize.max = 100;

        }

      }
    );

  }


  /* =======================================================
     BACK BUTTON HOVER
  ======================================================= */

  const backLink =
    document.querySelector(".back-link");


  if (backLink) {

    backLink.addEventListener(
      "mouseenter",
      () => {

        gsap.to(backLink, {

          x: -5,

          duration: 0.25,

          ease: "power2.out"

        });

      }
    );


    backLink.addEventListener(
      "mouseleave",
      () => {

        gsap.to(backLink, {

          x: 0,

          duration: 0.25,

          ease: "power2.out"

        });

      }
    );

  }


  /* =======================================================
     SUBMIT BUTTON HOVER
  ======================================================= */

  const submitArrow =
    submitButton?.querySelector(
      "span:last-child"
    );


  if (submitButton) {

    submitButton.addEventListener(
      "mouseenter",
      () => {

        if (submitButton.disabled) return;


        gsap.to(submitButton, {

          y: -4,

          duration: 0.3,

          ease: "power2.out"

        });


        if (submitArrow) {

          gsap.to(submitArrow, {

            x: 7,

            duration: 0.3,

            ease: "power2.out"

          });

        }

      }
    );


    submitButton.addEventListener(
      "mouseleave",
      () => {

        gsap.to(submitButton, {

          y: 0,

          duration: 0.3,

          ease: "power2.out"

        });


        if (submitArrow) {

          gsap.to(submitArrow, {

            x: 0,

            duration: 0.3,

            ease: "power2.out"

          });

        }

      }
    );

  }


  /* =======================================================
     LOGO HOVER
  ======================================================= */

  const logo =
    document.querySelector(".logo");


  if (logo) {

    logo.addEventListener(
      "mouseenter",
      () => {

        gsap.to(logo, {

          letterSpacing: "0.02em",

          duration: 0.3,

          ease: "power2.out"

        });

      }
    );


    logo.addEventListener(
      "mouseleave",
      () => {

        gsap.to(logo, {

          letterSpacing: "-0.04em",

          duration: 0.3,

          ease: "power2.out"

        });

      }
    );

  }

});