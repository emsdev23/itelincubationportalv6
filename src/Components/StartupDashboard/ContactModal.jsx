import React, { useState, useEffect } from "react";
import styles from "./ContactModal.module.css";
import api from "../Datafetching/api"; // Axios instance
import { Mail, User, X, Loader } from "lucide-react";

const ContactModal = ({ isOpen, onClose, userId }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && userId) {
      fetchContacts();
    }
  }, [isOpen, userId]);

  const fetchContacts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/generic/getspocs", {
        userId: userId,
      });

      if (response.data.statusCode === 200) {
        setContacts(response.data.data || []);
      } else {
        setError(response.data.message || "Failed to fetch contacts");
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.message || "Failed to fetch contacts");
      } else {
        setError("Network error: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <h2>Contact SPOCs</h2>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <Loader className={styles.spinner} size={32} />
              <p>Loading contacts...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p className={styles.error}>{error}</p>
              <button className={styles.retryButton} onClick={fetchContacts}>
                Retry
              </button>
            </div>
          ) : contacts.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No contacts available</p>
            </div>
          ) : (
            <div className={styles.contactsList}>
              {contacts.map((contact) => (
                <div key={contact.usersrecid} className={styles.contactCard}>
                  <div className={styles.contactInfo}>
                    <div className={styles.contactRow}>
                      <User size={18} className={styles.icon} />
                      <div>
                        <span className={styles.label}>Name</span>
                        <span className={styles.value}>
                          {contact.usersname}
                        </span>
                      </div>
                    </div>
                    <div className={styles.contactRow}>
                      <Mail size={18} className={styles.icon} />
                      <div>
                        <span className={styles.label}>Email</span>
                        <a
                          href={`mailto:${contact.usersemail}`}
                          className={styles.emailLink}
                        >
                          {contact.usersemail}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
