// src/components/MessageInput.jsx
import React, { useState, useRef } from "react";
import "./MessageInput.css";

const MessageInput = ({
  onSendMessage,
  fileInputRef,
  placeholder,
  disabled = false, // Add disabled prop with default value
}) => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileError, setFileError] = useState("");

  // Allowed file types and their MIME types
  const allowedFileTypes = {
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
    ],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "application/zip": [".zip"],
    "application/x-zip-compressed": [".zip"],
  };

  // Maximum file size in bytes (5MB)
  const maxFileSize = 5 * 1024 * 1024;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;
    if (disabled) return; // Prevent submission if disabled

    setIsSubmitting(true);
    try {
      // If there's an attachment but no message, create a default message
      let messageToSend = message.trim();
      if (!messageToSend && selectedFile) {
        const timestamp = new Date().toLocaleString();
        messageToSend = `attachment - ${timestamp}`;
      }

      await onSendMessage(messageToSend, selectedFile);
      setMessage("");
      setSelectedFile(null);
      setFileError("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    if (disabled) return; // Prevent file selection if disabled

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Reset previous error
      setFileError("");

      // Check file size
      if (file.size > maxFileSize) {
        setFileError(
          `File size exceeds 5MB limit. Current size: ${(
            file.size /
            (1024 * 1024)
          ).toFixed(2)}MB`
        );
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Check file type
      const fileExtension = "." + file.name.split(".").pop().toLowerCase();
      const isValidType = Object.values(allowedFileTypes)
        .flat()
        .includes(fileExtension);

      if (!isValidType) {
        setFileError(
          `Invalid file type. Allowed types: PDF, XLSX, DOCX, JPEG, JPG, PNG, ZIP`
        );
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // If all validations pass, set the selected file
      setSelectedFile(file);
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return; // Prevent keyboard submission if disabled

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Create a string of accepted file types for the input's accept attribute
  const acceptedFileTypes = Object.keys(allowedFileTypes).join(",");

  return (
    <div className={`message-input-container ${disabled ? "disabled" : ""}`}>
      <form onSubmit={handleSubmit} className="message-form">
        <div className="input-group">
          <textarea
            className="message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Type a message..."}
            rows={1}
            disabled={disabled || isSubmitting}
          />

          <input
            ref={fileInputRef}
            type="file"
            id="file-upload"
            className="file-input"
            onChange={handleFileChange}
            disabled={disabled || isSubmitting}
            accept={acceptedFileTypes}
          />

          <label
            htmlFor="file-upload"
            className={`file-upload-btn ${disabled ? "disabled" : ""}`}
            title={
              disabled
                ? "Cannot attach files to closed chat"
                : "Attach file (PDF, XLSX, DOCX, JPEG, JPG, PNG, ZIP - Max 5MB)"
            }
          >
            📎
          </label>

          <button
            type="submit"
            className="send-btn"
            disabled={
              disabled || isSubmitting || (!message.trim() && !selectedFile)
            }
          >
            {isSubmitting ? "..." : "➤"}
          </button>
        </div>

        {fileError && <div className="file-error">{fileError}</div>}

        {selectedFile && (
          <div className="selected-file">
            <span>
              📄 {selectedFile.name} (
              {(selectedFile.size / (1024 * 1024)).toFixed(2)}MB)
            </span>
            <button
              type="button"
              className="remove-file-btn"
              onClick={() => {
                setSelectedFile(null);
                setFileError("");
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              disabled={disabled}
            >
              ×
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default MessageInput;
