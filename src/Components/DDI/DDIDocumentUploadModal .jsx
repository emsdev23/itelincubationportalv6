import React, { useState, useEffect } from "react";
import {
  Upload,
  Building2,
  FileText,
  Eye,
  EyeOff,
  Calendar,
} from "lucide-react";
import Swal from "sweetalert2";
import { IPAdress } from "../Datafetching/IPAdrees";

const DDIDocumentUploadModal = () => {
  const incUserid = sessionStorage.getItem("incuserid");
  const [userid, setUserid] = useState(null);
  const [roleid, setRoleid] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [doctype, setDoctype] = useState("");
  const [doccategory, setDoccategory] = useState("");
  const [fromdate, setFromdate] = useState("");
  const [todate, setTodate] = useState("");
  const [visibility, setVisibility] = useState(false);
  const [loading, setLoading] = useState({
    companies: false,
    uploading: false,
    docTypes: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [docTypes, setDocTypes] = useState([]);
  const [hasCompanies, setHasCompanies] = useState(true); // New state to track if companies exist

  // Get file extension function
  const getFileExtension = (filename) => {
    const lastDotIndex = filename.lastIndexOf(".");
    if (lastDotIndex === -1 || lastDotIndex === 0) {
      return "";
    }
    return filename.substring(lastDotIndex + 1).toLowerCase();
  };

  // Get userid and roleid from sessionStorage
  useEffect(() => {
    const storedUserId = sessionStorage.getItem("userid");
    const storedRoleId = sessionStorage.getItem("roleid");
    if (storedUserId) {
      setUserid(storedUserId);
    }
    if (storedRoleId) {
      setRoleid(storedRoleId);
    }
  }, []);

  // Fetch companies list when component mounts (only for DDI role)
  useEffect(() => {
    if (userid && roleid === "7") {
      fetchCompanies();
      fetchDocumentTypes();
    }
  }, [userid, roleid]);

  const fetchCompanies = async () => {
    setLoading((prev) => ({ ...prev, companies: true }));
    setError("");

    try {
      const token = sessionStorage.getItem("token");
      const userID = sessionStorage.getItem("userid");
      const response = await fetch(
        `${IPAdress}/itelinc/resources/generic/getincubatessdash`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            userid: userID || "1",
            "X-Module": "DDI Documents",
            "X-Action": "Fetching Incubatees List assigned to DDI",
          },
          body: JSON.stringify({ userId: userID, incUserId: incUserid }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.statusCode === 200) {
        const companiesData = data.data || [];
        setCompanies(companiesData);
        setHasCompanies(companiesData.length > 0);

        // If no companies, don't try to fetch document types
        if (companiesData.length === 0) {
          return;
        }
      } else {
        setError(
          "Failed to fetch companies: " + (data.message || "Unknown error")
        );
      }
    } catch (err) {
      setError("Error fetching companies: " + err.message);
      console.error("Companies fetch error:", err);
      setHasCompanies(false);
    } finally {
      setLoading((prev) => ({ ...prev, companies: false }));
    }
  };

  // Fetch document types from API
  const fetchDocumentTypes = async () => {
    // Only fetch if we have companies
    if (!hasCompanies) {
      return;
    }

    setLoading((prev) => ({ ...prev, docTypes: true }));
    setError("");

    try {
      const token = sessionStorage.getItem("token");
      const userID = sessionStorage.getItem("userid");
      const response = await fetch(
        `${IPAdress}/itelinc/resources/generic/getddidoccatdetails`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            userid: userID || "1",
            "X-Module": "DDI Documents",
            "X-Action": "Fetching DDI Document Types",
          },
          body: JSON.stringify({ userId: userID, incUserId: incUserid }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.statusCode === 200) {
        // Check if data is an array or a single object
        if (Array.isArray(data.data)) {
          setDocTypes(data.data);
        } else if (data.data) {
          // If it's a single object, convert it to an array
          setDocTypes([data.data]);
        } else {
          setDocTypes([]);
        }
      } else {
        setError(
          "Failed to fetch document types: " + (data.message || "Unknown error")
        );
      }
    } catch (err) {
      // Only show error if we have companies, otherwise it's expected
      if (hasCompanies) {
        setError("Error fetching document types: " + err.message);
      }
      console.error("Document types fetch error:", err);
    } finally {
      setLoading((prev) => ({ ...prev, docTypes: false }));
    }
  };

  // When company is selected, extract its details
  useEffect(() => {
    if (selectedCompany) {
      const company = companies.find(
        (c) => c.incubateesrecid === parseInt(selectedCompany)
      );
      setCompanyDetails(company || null);
    } else {
      setCompanyDetails(null);
    }
  }, [selectedCompany, companies]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      const validExtensions = [
        "pdf",
        "png",
        "jpg",
        "jpeg",
        "docx",
        "xls",
        "xlsx",
      ];
      const fileExtension = getFileExtension(file.name);

      if (!validExtensions.includes(fileExtension)) {
        setError(
          `File type not supported. Allowed types: ${validExtensions.join(
            ", "
          )}`
        );
        return;
      }

      setSelectedFile(file);
      setError("");
    }
  };

  const formatDateForAPI = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString();
  };

  // SweetAlert for visibility toggle confirmation
  const handleVisibilityToggle = async () => {
    const result = await Swal.fire({
      title: "Change Visibility?",
      text: `Are you sure you want to make this document ${
        visibility ? "hidden" : "visible"
      } to others?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#667eea",
      cancelButtonColor: "#d33",
      confirmButtonText: `Yes, make it ${visibility ? "hidden" : "visible"}`,
      cancelButtonText: "Cancel",
      reverseButtons: true,
      customClass: {
        popup: "custom-swal-popup",
        confirmButton: "custom-swal-confirm",
        cancelButton: "custom-swal-cancel",
      },
    });

    if (result.isConfirmed) {
      setVisibility(!visibility);
      Swal.fire({
        title: "Visibility Updated!",
        text: `Document is now ${
          !visibility ? "visible" : "hidden"
        } to others.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        customClass: {
          popup: "custom-swal-popup",
        },
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCompany || !companyDetails) {
      setError("Please select a company and file");
      return;
    }

    if (!doctype || !doccategory) {
      setError("Please fill in Document Type and Document Category");
      return;
    }

    if (!fromdate || !todate) {
      setError("Please select From Date and To Date");
      return;
    }

    setLoading((prev) => ({ ...prev, uploading: true }));
    setError("");
    setSuccess("");

    // Show upload loader
    let uploadAlert = Swal.fire({
      title: "Uploading Document...",
      html: 'Please wait while we upload your document.<br/><div class="swal2-loader"></div>',
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: "custom-swal-popup upload-swal",
      },
    });

    try {
      console.log(
        "Starting file conversion...",
        selectedFile.name,
        selectedFile.size
      );

      const base64 = await convertToBase64(selectedFile);

      // Validate that base64 is not empty
      if (!base64 || base64.trim() === "") {
        throw new Error("File conversion failed - empty base64 content");
      }

      console.log("Base64 conversion successful, length:", base64.length);

      const uploadData = {
        ddidocumentuserid: companyDetails.usersrecid,
        ddidocumentsincubateesrecid: companyDetails.incubateesrecid,
        ddidocumentsstartupstagesrecid: companyDetails.incubateesstagelevel,
        ddidocumentsname: selectedFile.name,
        base64: base64,
        doctype: doctype,
        doccategory: doccategory,
        fromdate: formatDateForAPI(fromdate),
        todate: formatDateForAPI(todate),
        setvisibility: visibility ? 1 : 0,
      };

      console.log("DDI Upload data:", {
        ...uploadData,
        base64: `[BASE64_DATA: ${base64.length} characters]`,
      });

      const token = sessionStorage.getItem("token");
      const response = await fetch(
        `${IPAdress}/itelinc/resources/generic/adddocumentddi`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            userid: companyDetails.usersrecid || "1",
            "X-Module": "DDI Documents",
            "X-Action": "Add DDI Document for Incubatee",
          },
          body: JSON.stringify(uploadData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data?.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      if (data.statusCode === 200) {
        // Close upload loader and show success
        await Swal.fire({
          title: "Upload Successful!",
          text: data.message || "Document uploaded successfully!",
          icon: "success",
          timer: 3000,
          showConfirmButton: false,
          customClass: {
            popup: "custom-swal-popup success-swal",
          },
        });

        setSuccess(data.message || "Document uploaded successfully!");

        // Reset form after success
        setTimeout(() => {
          setSelectedCompany("");
          setSelectedFile(null);
          setCompanyDetails(null);
          setDoctype("");
          setDoccategory("");
          setFromdate("");
          setTodate("");
          setVisibility(false);
          setSuccess("");
        }, 2000);

        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error("Upload failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      // Close upload loader and show error
      await Swal.fire({
        title: "Upload Failed!",
        text: err.message || "Error uploading file",
        icon: "error",
        confirmButtonColor: "#667eea",
        customClass: {
          popup: "custom-swal-popup error-swal",
        },
      });

      setError("Error uploading file: " + (err.message || "Unknown error"));
      console.error("Upload error:", err);
    } finally {
      setLoading((prev) => ({ ...prev, uploading: false }));
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const result = reader.result;
          if (!result) {
            reject(new Error("FileReader returned empty result"));
            return;
          }

          const base64 = result.split(",")[1];

          if (!base64) {
            reject(new Error("No base64 data found after splitting"));
            return;
          }

          resolve(base64);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(new Error(`File reading failed: ${error.message}`));
      };

      reader.onabort = () => {
        reject(new Error("File reading was aborted"));
      };

      const timeout = setTimeout(() => {
        reader.abort();
        reject(new Error("File reading timeout"));
      }, 30000);

      reader.onloadend = () => {
        clearTimeout(timeout);
      };

      try {
        reader.readAsDataURL(file);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("dragOver");
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("dragOver");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("dragOver");

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      const validExtensions = [
        "pdf",
        "png",
        "jpg",
        "jpeg",
        "docx",
        "xls",
        "xlsx",
      ];
      const fileExtension = getFileExtension(file.name);

      if (!validExtensions.includes(fileExtension)) {
        setError(
          `File type not supported. Allowed types: ${validExtensions.join(
            ", "
          )}`
        );
        return;
      }

      setSelectedFile(file);
      setError("");
    }
  };

  // Don't render if not DDI role
  if (roleid !== "7") {
    return null;
  }

  return (
    <div className="ddi-upload-container">
      <div className="upload-card">
        <div className="card-header">
          <div className="header-icon">
            <Upload size={24} />
          </div>
          <div>
            <h2 className="card-title">Due Diligence Document Upload</h2>
            <p className="card-subtitle">
              Upload documents for selected company
            </p>
          </div>
        </div>

        {/* {error && <div className="error-message">{error}</div>} */}
        {success && <div className="success-message">{success}</div>}

        <div className="form-content">
          {/* No Companies Message */}
          {!hasCompanies && !loading.companies && (
            <div className="no-companies-message">
              <Building2 size={24} className="no-companies-icon" />
              <h3>No Companies Assigned</h3>
              <p>
                There are currently no companies assigned to you for document
                upload.
              </p>
            </div>
          )}

          {/* Company Selection */}
          <div className="form-group">
            <label className="form-label">
              <Building2 size={16} />
              Select Company *
            </label>
            <select
              className="form-select"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              disabled={loading.companies || !hasCompanies}
            >
              <option value="">-- Choose Company --</option>
              {companies.map((company) => (
                <option
                  key={company.incubateesrecid}
                  value={company.incubateesrecid}
                >
                  {company.incubateesname}
                </option>
              ))}
            </select>
            {loading.companies && (
              <div className="loading-text">Loading companies...</div>
            )}
          </div>

          {/* Company Details Display */}
          {companyDetails && (
            <div className="company-details">
              <h4 className="details-title">
                <Building2 size={16} />
                Company Information
              </h4>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Company Name:</span>
                  <span className="detail-value">
                    {companyDetails.incubateesname}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Field:</span>
                  <span className="detail-value">
                    {companyDetails.incubateesfieldofworkname || "N/A"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Stage:</span>
                  <span className="detail-value">
                    {companyDetails.incubateesstagelevelname || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Document Details Section */}
          {selectedCompany && hasCompanies && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <FileText size={16} />
                    Document Type *
                  </label>
                  <select
                    className="form-select"
                    value={doctype}
                    onChange={(e) => setDoctype(e.target.value)}
                    disabled={loading.docTypes}
                  >
                    <option value="">-- Select Document Type --</option>
                    {docTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.text}
                      </option>
                    ))}
                  </select>
                  {loading.docTypes && (
                    <div className="loading-text">
                      Loading document types...
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FileText size={16} />
                    Document Remarks *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g.,About the Document "
                    value={doccategory}
                    onChange={(e) => setDoccategory(e.target.value)}
                  />
                </div>
              </div>

              {/* Date Range Section */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <Calendar size={16} />
                    From Date *
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={fromdate}
                    onChange={(e) => setFromdate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Calendar size={16} />
                    To Date *
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={todate}
                    onChange={(e) => setTodate(e.target.value)}
                  />
                </div>
              </div>

              {/* Visibility Toggle */}
              <div className="form-group">
                <label className="form-label">Visibility Settings</label>
                <div className="visibility-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${visibility ? "active" : ""}`}
                    onClick={handleVisibilityToggle}
                    disabled={!doctype || !doccategory || !fromdate || !todate}
                  >
                    {visibility ? (
                      <>
                        <Eye size={20} />
                        <span>Visible</span>
                      </>
                    ) : (
                      <>
                        <EyeOff size={20} />
                        <span>Hidden</span>
                      </>
                    )}
                  </button>
                  <span className="toggle-description">
                    {visibility
                      ? "Document will be visible to Incubatee"
                      : "Document will be hidden for Incubatee"}
                  </span>
                </div>
              </div>

              {/* File Upload */}
              <div className="form-group">
                <label className="form-label">
                  <FileText size={16} />
                  Upload File *
                </label>
                <div
                  className="file-drop-area"
                  onClick={() =>
                    document.getElementById("ddiFileInput").click()
                  }
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {selectedFile ? (
                    <div className="file-selected">
                      <FileText size={32} className="file-icon" />
                      <p className="file-name">{selectedFile.name}</p>
                      <p className="file-size">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB •{" "}
                        {getFileExtension(selectedFile.name).toUpperCase()}
                      </p>
                    </div>
                  ) : (
                    <div className="file-placeholder">
                      <Upload size={32} className="upload-icon" />
                      <p className="placeholder-text">
                        Drag & drop file here or click to select
                      </p>
                      <p className="file-hint">
                        Max file size: 10MB • Supported: PDF, PNG, JPG, JPEG,
                        DOCX, XLS, XLSX
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    id="ddiFileInput"
                    className="file-input"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>
            </>
          )}

          {/* Upload Button */}
          {selectedCompany && selectedFile && hasCompanies && (
            <div className="button-group">
              <button
                className="btn-upload"
                disabled={loading.uploading}
                onClick={handleUpload}
              >
                {loading.uploading ? (
                  <>
                    <span className="spinner"></span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload Document
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .ddi-upload-container {
          width: 100%;
          margin: 0 auto;
          padding: 20px;
        }

        .upload-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .header-icon {
          background: rgba(255, 255, 255, 0.2);
          padding: 12px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .card-subtitle {
          margin: 4px 0 0 0;
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .form-content {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          margin-bottom: 10px;
          color: #333;
          font-size: 0.95rem;
        }

        .form-select,
        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          background-color: white;
          transition: all 0.2s;
        }

        .form-select {
          cursor: pointer;
        }

        .form-select:focus,
        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-select:disabled {
          background-color: #f5f5f5;
          color: #999;
          cursor: not-allowed;
        }

        .no-companies-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background-color: #f8f9fa;
          border-radius: 12px;
          border: 2px dashed #dee2e6;
          margin-bottom: 24px;
          text-align: center;
        }

        .no-companies-icon {
          color: #6c757d;
          margin-bottom: 16px;
        }

        .no-companies-message h3 {
          margin: 0 0 12px 0;
          font-size: 1.25rem;
          color: #495057;
        }

        .no-companies-message p {
          margin: 0;
          color: #6c757d;
          max-width: 500px;
        }

        .company-details {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 24px;
          border: 2px solid #e0e0e0;
        }

        .details-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px 0;
          font-size: 1rem;
          color: #333;
          font-weight: 600;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 0.85rem;
          color: #666;
          font-weight: 500;
        }

        .detail-value {
          font-size: 0.95rem;
          color: #222;
          font-weight: 600;
        }

        .visibility-toggle {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s;
          color: #666;
        }

        .toggle-btn:hover {
          border-color: #667eea;
          background: #f8f9ff;
        }

        .toggle-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: #667eea;
        }

        .toggle-description {
          font-size: 0.9rem;
          color: #666;
          font-style: italic;
        }

        .file-drop-area {
          border: 3px dashed #d0d0d0;
          border-radius: 12px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          background: #fafafa;
        }

        .file-drop-area:hover,
        .file-drop-area.dragOver {
          border-color: #667eea;
          background-color: #f8f9ff;
        }

        .file-selected {
          color: #28a745;
        }

        .file-icon {
          color: #28a745;
          margin-bottom: 8px;
        }

        .file-name {
          font-weight: 600;
          color: #333;
          margin: 8px 0 4px 0;
        }

        .file-placeholder {
          color: #666;
        }

        .upload-icon {
          color: #999;
          margin-bottom: 12px;
        }

        .placeholder-text {
          font-size: 1rem;
          font-weight: 500;
          color: #333;
          margin: 8px 0;
        }

        .file-size,
        .file-hint {
          font-size: 0.85rem;
          margin-top: 4px;
          color: #888;
        }

        .file-input {
          display: none;
        }

        .button-group {
          display: flex;
          justify-content: center;
          margin-top: 24px;
        }

        .btn-upload {
          display: flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .btn-upload:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }

        .btn-upload:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .error-message {
          color: #d9534f;
          margin-bottom: 20px;
          padding: 12px 16px;
          background-color: #f8d7da;
          border-radius: 8px;
          border-left: 4px solid #d9534f;
          font-size: 0.95rem;
        }

        .success-message {
          color: #28a745;
          margin-bottom: 20px;
          padding: 12px 16px;
          background-color: #d4edda;
          border-radius: 8px;
          border-left: 4px solid #28a745;
          font-size: 0.95rem;
        }

        .loading-text {
          color: #666;
          font-size: 0.9rem;
          margin-top: 8px;
          font-style: italic;
        }

        /* SweetAlert Custom Styles */
        :global(.custom-swal-popup) {
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        :global(.custom-swal-confirm) {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          border: none;
          padding: 10px 24px;
          font-weight: 600;
        }

        :global(.custom-swal-cancel) {
          background: #6c757d;
          border-radius: 8px;
          border: none;
          padding: 10px 24px;
          font-weight: 600;
        }

        :global(.upload-swal) {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        :global(.upload-swal .swal2-title) {
          color: white;
        }

        :global(.success-swal) {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
        }

        :global(.success-swal .swal2-title) {
          color: white;
        }

        :global(.error-swal) {
          background: linear-gradient(135deg, #dc3545 0%, #e83e8c 100%);
          color: white;
        }

        :global(.error-swal .swal2-title) {
          color: white;
        }

        :global(.swal2-loader) {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top: 3px solid white;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }

        @media (max-width: 768px) {
          .ddi-upload-container {
            padding: 12px;
          }

          .card-header {
            flex-direction: column;
            text-align: center;
            padding: 20px;
          }

          .card-title {
            font-size: 1.25rem;
          }

          .form-content {
            padding: 16px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }

          .file-drop-area {
            padding: 30px 15px;
          }

          .visibility-toggle {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default DDIDocumentUploadModal;
