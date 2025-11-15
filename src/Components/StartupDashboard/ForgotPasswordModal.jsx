import React, { useState, useContext } from "react";
import styles from "./ForgotPasswordModal.module.css";
import Swal from "sweetalert2";
import axios from "axios";
import { IPAdress } from "../Datafetching/IPAdrees";
import { DataContext } from "../Datafetching/DataProvider";

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const { userid, incuserid } = useContext(DataContext);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendResetLink = async () => {
    console.log("Send Reset Link button clicked");
    setError("");

    // Validation
    if (!email) {
      setError("Email is required.");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      console.log("Sending request to API...");

      const response = await axios.post(
        `${IPAdress}/itelinc/resources/auth/forgot-password`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
            userid: userid || "1",
            "X-Module": "Forgot Password",
            "X-Action": "Forgot Password Request",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      console.log("API Response:", response.data);

      if (response.data.statusCode === 200) {
        // Show SweetAlert with message from API
        Swal.fire({
          icon: "success",
          title: "Success",
          text:
            response.data.data?.message ||
            "Password reset link generated and sent to your email",
          confirmButtonColor: "#3085d6",
        });

        onClose(); // close modal
        setEmail(""); // reset input
      } else {
        setError(response.data.message || "Failed to send reset link.");
      }
    } catch (err) {
      console.error("API Error:", err);

      if (err.code === "ECONNABORTED") {
        setError("Request timeout. Please try again.");
      } else if (err.response) {
        // Server responded with error status
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            `Server error: ${err.response.status}`
        );
      } else if (err.request) {
        // Network error
        setError("Network error. Please check your connection and try again.");
      } else {
        // Other errors
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendResetLink();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Forgot Password</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.instruction}>
            Enter your email address and we'll send you a link to reset your
            password.
          </p>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your email"
              className={styles.input}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {error && (
            <div className={styles.error}>
              <span className={styles.errorIcon}>⚠</span>
              {error}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSendResetLink}
            disabled={loading || !email}
            className={styles.submitButton}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Sending...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
