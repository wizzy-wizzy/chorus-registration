import gsap from "gsap";
import { supabase } from "../lib/supabase.js";
import "./admin.css";


/* =========================================================
   CHORUS 2026 — ADMIN LOGIN
========================================================= */

const form =
  document.querySelector("#admin-login-form");

const emailInput =
  document.querySelector("#email");

const passwordInput =
  document.querySelector("#password");

const loginButton =
  document.querySelector("#login-button");

const buttonText =
  document.querySelector("#login-button-text");

const errorElement =
  document.querySelector("#login-error");


/* =========================================================
   CHECK EXISTING SESSION
========================================================= */

async function checkExistingSession() {

  const {
    data: {
      session
    }
  } = await supabase.auth.getSession();


  if (session) {

    window.location.href =
      "/src/admin/dashboard.html";

  }

}


checkExistingSession();


/* =========================================================
   LOGIN
========================================================= */

if (form) {

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      errorElement.textContent = "";


      const email =
        emailInput.value.trim();

      const password =
        passwordInput.value;


      if (!email || !password) {

        errorElement.textContent =
          "Please enter your email and password.";

        return;

      }


      /* -----------------------------------------------------
         LOADING STATE
      ----------------------------------------------------- */

      loginButton.disabled = true;

      buttonText.textContent =
        "Signing in...";


      /* -----------------------------------------------------
         SUPABASE AUTH
      ----------------------------------------------------- */

      try {

        const {
          data,
          error
        } =
          await supabase.auth.signInWithPassword({

            email,

            password

          });


        if (error) {

          throw error;

        }


        if (!data.session) {

          throw new Error(
            "Login succeeded but no session was created."
          );

        }


        /* ---------------------------------------------------
           SUCCESS
        --------------------------------------------------- */

        buttonText.textContent =
          "Welcome ✓";


        gsap.to(
          ".login-card",
          {
            scale: 1.02,
            duration: .25,
            yoyo: true,
            repeat: 1,
            ease: "power2.out"
          }
        );


        setTimeout(() => {

          window.location.href =
            "/src/admin/dashboard.html";

        }, 700);


      } catch (error) {

        console.error(
          "Admin login failed:",
          error
        );


        errorElement.textContent =
          "Invalid email or password. Please try again.";


        buttonText.textContent =
          "Sign In";


        loginButton.disabled = false;


        /* ---------------------------------------------------
           ERROR SHAKE
        --------------------------------------------------- */

        gsap.fromTo(

          ".login-card",

          {
            x: -8
          },

          {
            x: 8,
            duration: .08,
            repeat: 5,
            yoyo: true,
            ease: "power1.inOut",

            onComplete: () => {

              gsap.set(
                ".login-card",
                {
                  x: 0
                }
              );

            }

          }

        );

      }

    }
  );

}


/* =========================================================
   PAGE ENTRANCE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    gsap.set(
      [
        ".admin-nav",
        ".login-card",
        ".admin-footer"
      ],
      {
        opacity: 0
      }
    );


    gsap.set(
      ".login-card",
      {
        y: 40,
        scale: .97
      }
    );


    const tl =
      gsap.timeline({
        defaults: {
          ease: "power3.out"
        }
      });


    tl.to(
      ".admin-nav",
      {
        opacity: 1,
        duration: .7
      }
    );


    tl.to(
      ".login-card",
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        ease: "power4.out"
      },
      "-=.3"
    );


    tl.to(
      ".admin-footer",
      {
        opacity: 1,
        duration: .6
      },
      "-=.4"
    );

  }
);