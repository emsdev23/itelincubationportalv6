import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { IPAdress } from "./IPAdrees";

export function InactivityHandler({ children }) {
  const navigate = useNavigate();
  const alertShown = useRef(false);
  const isLoggedOut = useRef(false); // ✅ Track manual logout

  useEffect(() => {
    let timeout;

    const resetTimer = () => {
      if (isLoggedOut.current) return; // stop timer if logged out
      clearTimeout(timeout);
      timeout = setTimeout(showSessionExpiredAlert, 900000); // 15 min
    };

    const currentTime = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });
    const logoutUser = async (
      reason = `Auto logout due to inactivity at ${currentTime}`
    ) => {
      if (isLoggedOut.current) return; // prevent multiple logouts
      isLoggedOut.current = true;

      try {
        const userid = String(JSON.parse(sessionStorage.getItem("userid")));
        const token = sessionStorage.getItem("token");

        // 🕒 Get current date & time

        if (userid && token) {
          await fetch(`${IPAdress}/itelinc/resources/auth/logout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ userid, reason: reason }),
          });
        }
      } catch (error) {
        console.error("Logout error:", error);
      } finally {
        sessionStorage.clear();
        navigate("/", { replace: true });
      }
    };

    const showSessionExpiredAlert = () => {
      if (alertShown.current || isLoggedOut.current) return;
      alertShown.current = true;

      Swal.fire({
        title: "Session Expired",
        text: "You have been logged out due to inactivity.",
        icon: "warning",
        confirmButtonText: "OK",
        allowOutsideClick: false,
      }).then(() => {
        logoutUser();
      });
    };

    // Track user activity
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);

    resetTimer(); // start timer

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [navigate]);

  return children;
}
