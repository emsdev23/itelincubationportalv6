// src/components/Message.jsx
import React, { useState, useEffect } from "react";
import "./Message.css";

const Message = ({
  message,
  currentUser,
  onReply,
  isPublicReplyChat,
  isPrivateReplyChat,
  allMessages,
}) => {
  const isOwnMessage = message.chatdetailsfrom == currentUser.id;
  const hasAttachment = message.chatdetailsattachmentpath;
  const isReply = message.chatdetailsreplyfor !== null;
  const [repliedToMessage, setRepliedToMessage] = useState(null);
  const [attachmentInfo, setAttachmentInfo] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to generate a filename with datetime
  const generateFilenameWithDateTime = (originalFileName) => {
    const now = new Date();
    const dateTimeString = now
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\..+/, "");

    // Extract file extension if present
    const lastDotIndex = originalFileName.lastIndexOf(".");
    const nameWithoutExtension =
      lastDotIndex > 0
        ? originalFileName.substring(0, lastDotIndex)
        : originalFileName;
    const fileExtension =
      lastDotIndex > 0 ? originalFileName.substring(lastDotIndex) : "";

    return `${nameWithoutExtension}_${dateTimeString}${fileExtension}`;
  };

  const handleReplyClick = () => {
    if (onReply) {
      onReply(message);
    }
  };

  useEffect(() => {
    if (isReply && allMessages && allMessages.length > 0) {
      const repliedMessage = allMessages.find(
        (msg) => msg.chatdetailsrecid === message.chatdetailsreplyfor
      );
      if (repliedMessage) {
        setRepliedToMessage(repliedMessage.chatdetailsmessage);
      }
    }
  }, [isReply, message.chatdetailsreplyfor, allMessages]);

  // Process attachment data to handle the new structure with a separate filename field
  useEffect(() => {
    if (hasAttachment) {
      processAttachment();
    }
  }, [hasAttachment]);

  const processAttachment = () => {
    try {
      const attachmentData = message.chatdetailsattachmentpath;
      const fileName = message.chatdetailsfilename; // Use chatdetailsfilename from API response

      // Check if the attachment is a URL path (not base64)
      const isUrlPath =
        attachmentData &&
        !attachmentData.startsWith("http") &&
        !attachmentData.startsWith("data:") &&
        attachmentData.includes("/");

      // Check if the attachment is a base64 string
      const isBase64 =
        attachmentData &&
        !attachmentData.startsWith("http") &&
        !attachmentData.startsWith("data:") &&
        !isUrlPath &&
        attachmentData.length > 100;

      if (isUrlPath) {
        // This is a URL path that needs to be resolved via API
        setAttachmentInfo({
          isUrlPath: true,
          path: attachmentData,
          fileName: fileName || "attachment",
        });
      } else if (isBase64) {
        // This is base64 data (legacy support)
        let mimeType = "application/octet-stream";
        let fileExtension = "bin";

        if (attachmentData.startsWith("iVBORw0KGgo")) {
          mimeType = "image/png";
          fileExtension = "png";
        } else if (attachmentData.startsWith("/9j/")) {
          mimeType = "image/jpeg";
          fileExtension = "jpg";
        } else if (attachmentData.startsWith("R0lGOD")) {
          mimeType = "image/gif";
          fileExtension = "gif";
        } else if (attachmentData.startsWith("JVBORw0KGgo")) {
          mimeType = "application/pdf";
          fileExtension = "pdf";
        } else if (attachmentData.startsWith("UEs")) {
          mimeType = "application/zip";
          fileExtension = "zip";
        }

        // Use the provided filename if available, otherwise generate one
        const displayName = fileName || `attachment.${fileExtension}`;

        setAttachmentInfo({
          isBase64: true,
          mimeType: mimeType,
          fileName: displayName,
          data: attachmentData,
        });
      } else {
        // Regular URL attachment
        setAttachmentInfo({
          isUrl: true,
          url: attachmentData,
          fileName: fileName || "attachment",
        });
      }
    } catch (error) {
      console.error("Error processing attachment:", error);
      setAttachmentInfo(null);
    }
  };

  // Function to get file URL from API
  const getFileUrl = async (path) => {
    try {
      const response = await fetch(
        "http://121.242.232.212:8086/itelinc/resources/generic/getfileurl",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            userid: currentUser.id,
            url: path,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get file URL");
      }

      const data = await response.json();
      return data.data; // Return the URL from the response
    } catch (error) {
      console.error("Error getting file URL:", error);
      throw error;
    }
  };

  // Function to view attachment in a new tab
  const viewAttachment = async () => {
    if (!attachmentInfo) return;

    try {
      if (attachmentInfo.isUrlPath) {
        // Get the file URL from API
        const fileUrl = await getFileUrl(attachmentInfo.path);
        // Open in a new tab
        window.open(fileUrl, "_blank");
      } else if (attachmentInfo.isBase64) {
        // Create a data URL and open in a new tab
        const dataUrl = `data:${attachmentInfo.mimeType};base64,${attachmentInfo.data}`;
        window.open(dataUrl, "_blank");
      } else if (attachmentInfo.isUrl) {
        // Handle direct URL
        window.open(attachmentInfo.url, "_blank");
      }
    } catch (error) {
      console.error("Error viewing attachment:", error);
      // You could show an error message to the user here
    }
  };

  // Function to preview attachment in chat
  const previewAttachment = async () => {
    if (!attachmentInfo) return;

    setPreviewLoading(true);
    setShowPreview(true);

    try {
      let content = null;

      if (attachmentInfo.isUrlPath) {
        // Get the file URL from API
        const fileUrl = await getFileUrl(attachmentInfo.path);

        // For images, create an img element
        if (isImageFile(attachmentInfo.fileName)) {
          content = {
            type: "image",
            url: fileUrl,
          };
        }
        // For PDFs, create an iframe
        else if (isPdfFile(attachmentInfo.fileName)) {
          content = {
            type: "pdf",
            url: fileUrl,
          };
        }
        // For text files, fetch and display content
        else if (isTextFile(attachmentInfo.fileName)) {
          const response = await fetch(fileUrl, {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          });
          const text = await response.text();
          content = {
            type: "text",
            content: text,
          };
        }
        // For other files, just show file info
        else {
          content = {
            type: "file",
            url: fileUrl,
            fileName: attachmentInfo.fileName,
          };
        }
      } else if (attachmentInfo.isBase64) {
        // Handle base64 data
        if (attachmentInfo.mimeType.startsWith("image/")) {
          content = {
            type: "image",
            dataUrl: `data:${attachmentInfo.mimeType};base64,${attachmentInfo.data}`,
          };
        } else if (attachmentInfo.mimeType === "application/pdf") {
          content = {
            type: "pdf",
            dataUrl: `data:${attachmentInfo.mimeType};base64,${attachmentInfo.data}`,
          };
        } else {
          // For other base64 files, just show file info
          content = {
            type: "file",
            fileName: attachmentInfo.fileName,
          };
        }
      } else if (attachmentInfo.isUrl) {
        // Handle direct URL
        if (isImageFile(attachmentInfo.fileName)) {
          content = {
            type: "image",
            url: attachmentInfo.url,
          };
        } else if (isPdfFile(attachmentInfo.fileName)) {
          content = {
            type: "pdf",
            url: attachmentInfo.url,
          };
        } else {
          content = {
            type: "file",
            url: attachmentInfo.url,
            fileName: attachmentInfo.fileName,
          };
        }
      }

      setPreviewContent(content);
    } catch (error) {
      console.error("Error previewing attachment:", error);
      setPreviewContent({
        type: "error",
        message: "Failed to load preview",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Helper functions to check file types
  const isImageFile = (fileName) => {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
    const extension = fileName
      .substring(fileName.lastIndexOf("."))
      .toLowerCase();
    return imageExtensions.includes(extension);
  };

  const isPdfFile = (fileName) => {
    return fileName.toLowerCase().endsWith(".pdf");
  };

  const isTextFile = (fileName) => {
    const textExtensions = [
      ".txt",
      ".csv",
      ".json",
      ".xml",
      ".html",
      ".css",
      ".js",
      ".md",
    ];
    const extension = fileName
      .substring(fileName.lastIndexOf("."))
      .toLowerCase();
    return textExtensions.includes(extension);
  };

  const downloadAttachment = async () => {
    if (!attachmentInfo) return;

    setIsDownloading(true);

    try {
      // Use the filename from the API response with datetime
      const downloadFileName = generateFilenameWithDateTime(
        attachmentInfo.fileName
      );

      if (attachmentInfo.isUrlPath) {
        // Get the file URL from API
        const fileUrl = await getFileUrl(attachmentInfo.path);

        // Fetch the file content
        const response = await fetch(fileUrl, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch file");
        }

        // Get the blob from the response
        const blob = await response.blob();

        // Create a URL for the blob
        const blobUrl = URL.createObjectURL(blob);

        // Create a link and trigger download
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = downloadFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL
        URL.revokeObjectURL(blobUrl);
      } else if (attachmentInfo.isBase64) {
        // Handle base64 data (legacy support)
        const byteCharacters = atob(attachmentInfo.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: attachmentInfo.mimeType });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = downloadFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (attachmentInfo.isUrl) {
        // For direct URLs, we also need to fetch the content first
        try {
          // Fetch the file content
          const response = await fetch(attachmentInfo.url, {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch file");
          }

          // Get the blob from the response
          const blob = await response.blob();

          // Create a URL for the blob
          const blobUrl = URL.createObjectURL(blob);

          // Create a link and trigger download
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = downloadFileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clean up the blob URL
          URL.revokeObjectURL(blobUrl);
        } catch (fetchError) {
          // If fetching fails, fall back to the original method
          console.warn(
            "Could not fetch file content, falling back to direct download:",
            fetchError
          );
          const link = document.createElement("a");
          link.href = attachmentInfo.url;
          link.download = downloadFileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.error("Error downloading attachment:", error);
      // You could show an error message to the user here
    } finally {
      setIsDownloading(false);
    }
  };

  // Get file type icon based on MIME type or file extension
  const getFileTypeIcon = (mimeType, fileName) => {
    if (mimeType.startsWith("image/")) {
      return "🖼️";
    } else if (mimeType === "application/pdf") {
      return "📄";
    } else if (
      mimeType === "application/zip" ||
      mimeType === "application/x-rar-compressed"
    ) {
      return "📦";
    } else if (
      mimeType.includes("word") ||
      fileName.endsWith(".doc") ||
      fileName.endsWith(".docx")
    ) {
      return "📝";
    } else if (
      mimeType.includes("sheet") ||
      fileName.endsWith(".xls") ||
      fileName.endsWith(".xlsx")
    ) {
      return "📊";
    } else if (
      mimeType.includes("presentation") ||
      fileName.endsWith(".ppt") ||
      fileName.endsWith(".pptx")
    ) {
      return "📑";
    } else {
      return "📎";
    }
  };

  // Get file type text based on MIME type or file extension
  const getFileTypeText = (mimeType, fileName) => {
    if (mimeType.startsWith("image/")) {
      return "IMAGE";
    } else if (mimeType === "application/pdf") {
      return "PDF";
    } else if (
      mimeType === "application/zip" ||
      mimeType === "application/x-rar-compressed"
    ) {
      return "ARCHIVE";
    } else if (
      mimeType.includes("word") ||
      fileName.endsWith(".doc") ||
      fileName.endsWith(".docx")
    ) {
      return "DOCUMENT";
    } else if (
      mimeType.includes("sheet") ||
      fileName.endsWith(".xls") ||
      fileName.endsWith(".xlsx")
    ) {
      return "SPREADSHEET";
    } else if (
      mimeType.includes("presentation") ||
      fileName.endsWith(".ppt") ||
      fileName.endsWith(".pptx")
    ) {
      return "PRESENTATION";
    } else {
      return "FILE";
    }
  };

  const renderAttachmentPreview = () => {
    if (!attachmentInfo) return null;

    if (
      attachmentInfo.isBase64 &&
      attachmentInfo.mimeType.startsWith("image/")
    ) {
      // For base64 images, show preview
      const dataUrl = `data:${attachmentInfo.mimeType};base64,${attachmentInfo.data}`;

      return (
        <div className="message-attachment image-attachment">
          <img
            src={dataUrl}
            alt="Attachment"
            className="attachment-preview"
            onClick={previewAttachment}
          />
        </div>
      );
    } else {
      // For all other files, show WhatsApp-style file preview
      const fileIcon = getFileTypeIcon(
        attachmentInfo.mimeType || "",
        attachmentInfo.fileName
      );
      const fileType = getFileTypeText(
        attachmentInfo.mimeType || "",
        attachmentInfo.fileName
      );

      return (
        <div
          className="message-attachment file-attachment whatsapp-style"
          onClick={previewAttachment}
        >
          <div className="file-icon-container">
            <div className="file-icon">{fileIcon}</div>
          </div>
          <div className="file-info">
            <div className="file-name">{attachmentInfo.fileName}</div>
            <div className="file-type">{fileType}</div>
          </div>
          <div className="preview-icon"></div>
        </div>
      );
    }
  };

  const renderPreviewModal = () => {
    if (!showPreview) return null;

    return (
      <div
        className="attachment-preview-modal"
        onClick={() => setShowPreview(false)}
      >
        <div className="preview-container" onClick={(e) => e.stopPropagation()}>
          <div className="preview-header">
            <h3>{attachmentInfo.fileName}</h3>
            <button className="close-btn" onClick={() => setShowPreview(false)}>
              ✕
            </button>
          </div>

          <div className="preview-content">
            {previewLoading ? (
              <div className="preview-loading">Loading preview...</div>
            ) : (
              <>
                {previewContent && previewContent.type === "image" && (
                  <img
                    src={previewContent.dataUrl || previewContent.url}
                    alt="Preview"
                    className="preview-image"
                  />
                )}

                {previewContent && previewContent.type === "pdf" && (
                  <iframe
                    src={previewContent.dataUrl || previewContent.url}
                    className="preview-pdf"
                    title="PDF Preview"
                  />
                )}

                {previewContent && previewContent.type === "text" && (
                  <pre className="preview-text">{previewContent.content}</pre>
                )}

                {previewContent && previewContent.type === "file" && (
                  <div className="preview-file-info">
                    <div className="file-icon-large">
                      {getFileTypeIcon("", attachmentInfo.fileName)}
                    </div>
                    <p>Preview not available for this file type.</p>
                    <p>Click the download button to view this file.</p>
                  </div>
                )}

                {previewContent && previewContent.type === "error" && (
                  <div className="preview-error">
                    <p>{previewContent.message}</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="preview-footer">
            <button className="download-btn" onClick={downloadAttachment}>
              {isDownloading ? "Downloading..." : "Download"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`message ${isOwnMessage ? "own-message" : "other-message"}`}
    >
      {!isOwnMessage && (
        <div className="message-sender">
          {message.chatdetailsfrom === currentUser.id
            ? "You"
            : `User ${message.chatdetailsfrom}`}
        </div>
      )}

      {isReply && repliedToMessage && (
        <div className="reply-indicator">
          <span>Reply to: {repliedToMessage}</span>
        </div>
      )}

      <div className="message-content">{message.chatdetailsmessage}</div>

      {hasAttachment && renderAttachmentPreview()}

      <div className="message-footer">
        <span className="message-time">
          {formatTime(message.chatdetailscreatedtime)}
        </span>

        {!isOwnMessage && onReply && (
          <button className="reply-btn" onClick={handleReplyClick}>
            Reply
          </button>
        )}
      </div>

      {renderPreviewModal()}
    </div>
  );
};

export default Message;
