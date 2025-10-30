import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import Swal from "sweetalert2";
import "./DocCatTable.css";
import {
  FaTrash,
  FaEdit,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFileUpload,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaInfoCircle,
  FaSpinner,
  FaFile,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileAlt,
  FaEye,
  FaDownload,
} from "react-icons/fa";
import { IPAdress } from "../Datafetching/IPAdrees";

// Using forwardRef to allow parent components to access methods
const DocumentsTable = forwardRef(({ title = "📄 Documents" }, ref) => {
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const roleid = sessionStorage.getItem("roleid");
  const incUserid = sessionStorage.getItem("incUserid");

  const [documents, setDocuments] = useState([]);
  const [cats, setCats] = useState([]);
  const [subcats, setSubcats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [editDoc, setEditDoc] = useState(null);
  const [formData, setFormData] = useState({
    documentname: "",
    documentdescription: "",
    documentcatrecid: "",
    documentsubcatrecid: "",
    documentperiodicityrecid: "",
    documentremarks: "",
    sampleDocName: "",
    sampleDocBase64: "",
    templateDocName: "",
    templateDocBase64: "",
  });
  // ✅ NEW: State to hold original file names to prevent them from being cleared on update
  const [originalFileNames, setOriginalFileNames] = useState({
    sample: "",
    template: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isUploading, setIsUploading] = useState({
    sample: false,
    template: false,
  });

  // New loading states for specific operations
  const [isDeleting, setIsDeleting] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  // ✅ Fetch documents
  const IP = IPAdress;

  // Expose the openAddModal function to parent components
  useImperativeHandle(ref, () => ({
    openAddModal,
  }));

  const fetchDocuments = () => {
    const url = `${IP}/itelinc/api/documents/getDocumentsAll?incuserid=${encodeURIComponent(
      incUserid
    )}`;
    setLoading(true);
    fetch(url, {
      method: "GET",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        setDocuments(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching documents:", err);
        showToast("Failed to load documents. Please try again.", "error");
        setLoading(false);
      });
  };

  // ✅ Fetch categories independently
  const fetchCategories = () => {
    const url = `${IP}/itelinc/getDoccatAll?incuserid=${encodeURIComponent(
      incUserid
    )}`;
    fetch(url, {
      method: "GET",
      mode: "cors",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Categories data:", data);
        setCats(data.data || []);
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
      });
  };

  // ✅ Fetch subcategories independently
  const fetchSubCategories = () => {
    const url = `${IP}/itelinc/getDocsubcatAll?incuserid=${encodeURIComponent(
      incUserid
    )}`;
    fetch(url, {
      method: "GET",
      mode: "cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Subcategories data:", data);
        // Check if data exists and has the expected structure
        if (data && data.data && Array.isArray(data.data)) {
          setSubcats(data.data);
        } else if (data && Array.isArray(data)) {
          // If data is directly an array
          setSubcats(data);
        } else {
          console.warn("Unexpected subcategories data structure:", data);
          setSubcats([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching subcategories:", err);
        setSubcats([]); // Set to empty array on error
      });
  };

  // ✅ Refresh all data
  const refreshData = () => {
    fetchDocuments();
    fetchCategories();
    fetchSubCategories();
  };

  // ✅ Refresh just dropdown data
  const refreshDropdownData = () => {
    fetchCategories();
    fetchSubCategories();
  };

  // ✅ NEW: Enhanced toast notification with auto-dismiss
  const showToast = (message, type = "success", duration = 3000) => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, duration);
  };

  // ✅ NEW: Field validation
  const validateField = (name, value) => {
    const errors = { ...fieldErrors };

    switch (name) {
      case "documentname":
        if (!value || value.trim() === "") {
          errors[name] = "Document name is required";
        } else if (value.length < 3) {
          errors[name] = "Document name must be at least 3 characters";
        } else if (value.length > 100) {
          errors[name] = "Document name must be less than 100 characters";
        } else {
          delete errors[name];
        }
        break;

      case "documentdescription":
        if (!value || value.trim() === "") {
          errors[name] = "Description is required";
        } else if (value.length < 10) {
          errors[name] = "Description must be at least 10 characters";
        } else if (value.length > 500) {
          errors[name] = "Description must be less than 500 characters";
        } else {
          delete errors[name];
        }
        break;

      case "documentcatrecid":
        if (!value) {
          errors[name] = "Please select a category";
        } else {
          delete errors[name];
        }
        break;

      case "documentsubcatrecid":
        if (!value) {
          errors[name] = "Please select a subcategory";
        } else {
          delete errors[name];
        }
        break;

      case "documentperiodicityrecid":
        if (!value) {
          errors[name] = "Please select periodicity";
        } else {
          delete errors[name];
        }
        break;

      default:
        break;
    }

    setFieldErrors(errors);
    return !errors[name];
  };

  // ✅ NEW: Validate entire form
  const validateForm = () => {
    const isValid =
      validateField("documentname", formData.documentname) &&
      validateField("documentdescription", formData.documentdescription) &&
      validateField("documentcatrecid", formData.documentcatrecid) &&
      validateField("documentsubcatrecid", formData.documentsubcatrecid) &&
      validateField(
        "documentperiodicityrecid",
        formData.documentperiodicityrecid
      );

    return isValid;
  };

  useEffect(() => {
    refreshData();
  }, []);

  // ✅ NEW: Add event listener to refresh dropdown data when category/subcategory changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "categoryUpdated" || e.key === "subcategoryUpdated") {
        refreshDropdownData();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Debug useEffect to check subcategories data
  useEffect(() => {
    console.log("Subcategories state updated:", subcats);
    if (subcats.length > 0) {
      console.log("First subcategory object:", subcats[0]);
      console.log("Keys in subcategory object:", Object.keys(subcats[0]));
    }
  }, [subcats]);

  // Sorting functions
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) {
      return <FaSort className="sort-icon" />;
    }
    return sortConfig.direction === "ascending" ? (
      <FaSortUp className="sort-icon active" />
    ) : (
      <FaSortDown className="sort-icon active" />
    );
  };

  // ✅ NEW: Function to parse date strings with question mark
  const parseDate = (dateString) => {
    if (!dateString) return new Date(0);

    // Handle date strings with question mark (e.g., "Sep 19, 2025, 12:46:43?PM")
    try {
      // Replace the question mark with a space to make it a valid date string
      const normalizedDate = dateString.replace("?", " ");
      return new Date(normalizedDate);
    } catch (error) {
      console.error("Error parsing date:", dateString, error);
      return new Date(0);
    }
  };

  // ✅ NEW: Function to format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = parseDate(dateString);
      return date
        .toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
        .replace(",", "");
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Invalid Date";
    }
  };

  // Enhanced sorting function to handle different data types
  const sortValue = (value, key, originalIndex) => {
    // Handle null/undefined values
    if (value === null || value === undefined) {
      return "";
    }

    // Handle date/time strings - use our parseDate function
    if (key === "documentcreatedtime" || key === "documentmodifiedtime") {
      return parseDate(value);
    }

    // Handle numeric values
    if (
      key === "documentcreatedby" ||
      key === "documentmodifiedby" ||
      key === "documentsrecid" ||
      key === "documentcatrecid" ||
      key === "documentsubcatrecid" ||
      key === "documentperiodicityrecid"
    ) {
      // Check if it's a numeric ID or a name
      if (!isNaN(value)) {
        return parseInt(value, 10);
      }
      return value.toString().toLowerCase();
    }

    // Default to string comparison
    return value.toString().toLowerCase();
  };

  // Apply sorting to the data
  const sortedDocuments = React.useMemo(() => {
    let sortableDocuments = [...documents];
    if (sortConfig.key !== null) {
      sortableDocuments.sort((a, b) => {
        const aValue = sortValue(
          a[sortConfig.key],
          sortConfig.key,
          documents.indexOf(a)
        );
        const bValue = sortValue(
          b[sortConfig.key],
          sortConfig.key,
          documents.indexOf(b)
        );

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableDocuments;
  }, [documents, sortConfig]);

  // ✅ NEW: Function to get file icon based on file extension
  const getFileIcon = (fileName) => {
    if (!fileName) return <FaFile />;

    const extension = fileName.split(".").pop().toLowerCase();

    switch (extension) {
      case "pdf":
        return <FaFilePdf style={{ color: "#dc2626" }} />;
      case "doc":
      case "docx":
        return <FaFileWord style={{ color: "#2563eb" }} />;
      case "xls":
      case "xlsx":
        return <FaFileExcel style={{ color: "#16a34a" }} />;
      case "txt":
        return <FaFileAlt style={{ color: "#6b7280" }} />;
      default:
        return <FaFile />;
    }
  };

  // ✅ NEW: Function to get file type text based on file extension
  const getFileTypeText = (fileName) => {
    if (!fileName) return "FILE";

    const extension = fileName.split(".").pop().toLowerCase();

    switch (extension) {
      case "pdf":
        return "PDF";
      case "doc":
      case "docx":
        return "DOCUMENT";
      case "xls":
      case "xlsx":
        return "SPREADSHEET";
      case "txt":
        return "TEXT";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "bmp":
      case "webp":
        return "IMAGE";
      default:
        return "FILE";
    }
  };

  // ✅ UPDATED: Function to get filename with datetime
  const getFilenameWithDateTime = (originalName) => {
    if (!originalName) return "";

    const now = new Date();
    const dateTimeString = now.toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const lastDotIndex = originalName.lastIndexOf(".");

    if (lastDotIndex > 0) {
      const nameWithoutExt = originalName.substring(0, lastDotIndex);
      const extension = originalName.substring(lastDotIndex);
      return `${nameWithoutExt}_${dateTimeString}${extension}`;
    }

    return `${originalName}_${dateTimeString}`;
  };

  // ✅ UPDATED: Function to get file URL from API with better error handling
  const getFileUrl = async (path) => {
    try {
      console.log("Getting file URL for path:", path);

      const response = await fetch(
        `${IP}/itelinc/resources/generic/getfileurl`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userid: userId || "39",
            url: path,
          }),
        }
      );

      console.log("Get file URL response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Get file URL response data:", data);

      if (data.statusCode === 200 && data.data) {
        return data.data; // Return the URL from the response
      } else {
        throw new Error(data.message || "Invalid response format");
      }
    } catch (error) {
      console.error("Error getting file URL:", error);
      throw error;
    }
  };

  // ✅ NEW: Helper function to process blob and trigger download (from Message component)
  const processBlobDownload = (blob, docName) => {
    try {
      // Debug: Log blob information
      console.log("Blob size:", blob.size);
      console.log("Blob type:", blob.type);

      if (blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }

      // Create a blob URL (this is temporary and not exposed to user)
      const blobUrl = window.URL.createObjectURL(blob);

      // Get filename with datetime
      const filenameWithDateTime = getFilenameWithDateTime(docName);

      // Create a temporary link element to trigger download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filenameWithDateTime;
      link.style.display = "none";

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL after download
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);

      showToast(`Downloaded ${filenameWithDateTime}`, "success");
      return blob; // Return the blob for further processing if needed
    } catch (error) {
      console.error("Error processing blob download:", error);
      throw error;
    }
  };

  // ✅ UPDATED: Function to download document using approach from Message component
  const downloadDocument = async (docPath, docName) => {
    if (!docPath) {
      showToast("Document not available", "warning");
      return null;
    }

    setIsDownloading(true);

    try {
      // Show loading notification
      showToast(`Preparing download for ${docName}...`, "info");

      // Debug: Log the document path
      console.log("Document path:", docPath);
      console.log("Document name:", docName);

      // Call the POST API to get the download URL
      const response = await fetch(
        `${IP}/itelinc/resources/generic/getfileurl`,
        {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userid: userId || "39",
            url: docPath,
          }),
        }
      );

      // Debug: Log the response
      console.log("Get file URL response status:", response.status);
      console.log("Get file URL response headers:", response.headers);

      const data = await response.json();
      console.log("Get file URL response data:", data);

      if (data.statusCode === 200 && data.data) {
        // Debug: Log the file URL
        console.log("File URL received:", data.data);

        // Use the filename from the API response with datetime
        const downloadFileName = getFilenameWithDateTime(docName);

        // Fetch the actual file as a blob (this prevents URL exposure)
        const fileResponse = await fetch(data.data, {
          method: "GET",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Debug: Log the file response
        console.log("File response status:", fileResponse.status);
        console.log("File response headers:", fileResponse.headers);

        if (!fileResponse.ok) {
          // Try without authorization header if the first attempt fails
          console.log("First attempt failed, trying without authorization...");
          const fileResponseNoAuth = await fetch(data.data, {
            method: "GET",
            mode: "cors",
          });

          console.log(
            "File response (no auth) status:",
            fileResponseNoAuth.status
          );

          if (!fileResponseNoAuth.ok) {
            throw new Error(
              `Failed to fetch the file. Status: ${fileResponseNoAuth.status}`
            );
          }

          const blob = await fileResponseNoAuth.blob();
          return processBlobDownload(blob, docName);
        }

        const blob = await fileResponse.blob();
        return processBlobDownload(blob, docName);
      } else {
        throw new Error(data.message || "Failed to get download URL");
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      showToast(`Failed to download: ${error.message}`, "error");
      return null;
    } finally {
      setIsDownloading(false);
    }
  };

  // ✅ UPDATED: Function to preview document with better error handling
  const previewDocument = async (docPath, docName) => {
    if (!docPath) {
      showToast("Document not available", "warning");
      return;
    }

    setPreviewLoading(true);
    setIsPreviewModalOpen(true);
    // ✅ FIXED: Store the original path along with other info
    setPreviewDoc({
      name: docName,
      url: null,
      type: null,
      originalPath: docPath, // Store the original path for download
    });
    setPreviewContent(null);

    try {
      console.log("Previewing document:", docPath, docName);

      // Get the file URL from API
      const fileUrl = await getFileUrl(docPath);
      console.log("File URL for preview:", fileUrl);

      // Get file extension to determine type
      const extension = docName.split(".").pop().toLowerCase();
      let type = "unknown";

      switch (extension) {
        case "pdf":
          type = "pdf";
          break;
        case "doc":
        case "docx":
          type = "word";
          break;
        case "xls":
        case "xlsx":
          type = "excel";
          break;
        case "txt":
        case "csv":
        case "json":
        case "xml":
        case "html":
        case "css":
        case "js":
        case "md":
          type = "text";
          break;
        case "jpg":
        case "jpeg":
        case "png":
        case "gif":
        case "bmp":
        case "webp":
          type = "image";
          break;
        default:
          type = "unknown";
      }

      let content = null;

      // For images, create an img element
      if (type === "image") {
        content = {
          type: "image",
          url: fileUrl,
        };
      }
      // For PDFs, create an iframe
      else if (type === "pdf") {
        content = {
          type: "pdf",
          url: fileUrl,
        };
      }
      // For text files, fetch and display content
      else if (type === "text") {
        try {
          const response = await fetch(fileUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            // Try without authorization
            const responseNoAuth = await fetch(fileUrl);
            if (!responseNoAuth.ok) {
              throw new Error("Failed to fetch text content");
            }
            const text = await responseNoAuth.text();
            content = {
              type: "text",
              content: text,
            };
          } else {
            const text = await response.text();
            content = {
              type: "text",
              content: text,
            };
          }
        } catch (error) {
          console.error("Error fetching text content:", error);
          content = {
            type: "error",
            message: "Failed to load text content",
          };
        }
      }
      // For other files, just show file info
      else {
        content = {
          type: "file",
          url: fileUrl,
          fileName: docName,
        };
      }

      // ✅ FIXED: Update previewDoc with the URL and keep the original path
      setPreviewDoc({
        name: docName,
        url: fileUrl,
        type: type,
        originalPath: docPath, // Keep the original path for download
      });

      setPreviewContent(content);
    } catch (error) {
      console.error("Error previewing document:", error);
      showToast(`Failed to preview: ${error.message}`, "error");
      setPreviewContent({
        type: "error",
        message: `Failed to load preview: ${error.message}`,
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // ✅ NEW: Function to fetch a document and convert it to base64
  const fetchDocumentAsBase64 = async (docPath, docName) => {
    if (!docPath) {
      console.log("Document path is empty");
      return null;
    }

    try {
      // Get the download URL first
      const response = await fetch(
        `${IP}/itelinc/resources/generic/getfileurl`,
        {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userid: userId || "39",
            url: docPath,
          }),
        }
      );

      const data = await response.json();

      if (data.statusCode === 200 && data.data) {
        // Now fetch the actual file as a blob
        const fileResponse = await fetch(data.data, {
          method: "GET",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!fileResponse.ok) {
          throw new Error("Failed to fetch the file");
        }

        const blob = await fileResponse.blob();

        // Convert blob to base64
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            // Extract just the base64 part (remove the data URL prefix)
            const result = reader.result;
            const base64Data = result.split(",")[1];
            resolve(base64Data);
          };
          reader.onerror = (error) => reject(error); // ✅ FIXED: Added arrow function syntax
          reader.readAsDataURL(blob);
        });
      } else {
        throw new Error(data.message || "Failed to get download URL");
      }
    } catch (error) {
      console.error("Error fetching document as base64:", error);
      return null;
    }
  };

  const openAddModal = () => {
    setEditDoc(null);
    setOriginalFileNames({ sample: "", template: "" }); // Reset original file names
    setFormData({
      documentname: "",
      documentdescription: "",
      documentcatrecid: "",
      documentsubcatrecid: "",
      documentperiodicityrecid: "",
      documentremarks: "",
      sampleDocName: "",
      sampleDocBase64: "",
      templateDocName: "",
      templateDocBase64: "",
    });
    setFieldErrors({});
    // ✅ Refresh dropdown data before opening the modal
    refreshDropdownData();
    setIsModalOpen(true);
  };

  const openEditModal = (doc) => {
    setEditDoc(doc);
    // ✅ UPDATED: Store original file names to use them if no new file is uploaded
    setOriginalFileNames({
      sample: doc.documentsampledocname || "",
      template: doc.documenttemplatedocname || "",
    });
    setFormData({
      documentname: doc.documentname || "",
      documentdescription: doc.documentdescription || "",
      documentcatrecid: doc.documentcatrecid || "",
      documentsubcatrecid: doc.documentsubcatrecid || "",
      documentperiodicityrecid: doc.documentperiodicityrecid || "",
      documentremarks: doc.documentremarks || "",
      sampleDocName: doc.documentsampledocname || "",
      sampleDocBase64: "", // Reset base64, user must choose a new file to replace
      templateDocName: doc.documenttemplatedocname || "",
      templateDocBase64: "", // Reset base64, user must choose a new file to replace
    });
    setFieldErrors({});
    // ✅ Refresh dropdown data before opening the modal
    refreshDropdownData();
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear error when user starts typing
    if (fieldErrors[name]) {
      validateField(name, value);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "documentcatrecid") {
      setFormData((prev) => ({ ...prev, documentsubcatrecid: "" }));
      // Clear subcategory error when category changes
      if (fieldErrors.documentsubcatrecid) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.documentsubcatrecid;
          return newErrors;
        });
      }
    }

    // ✅ Additional debugging for subcategory
    if (name === "documentsubcatrecid") {
      console.log("Subcategory value type:", typeof value);
      console.log("Is subcategory value numeric?", !isNaN(value));

      // Find the selected subcategory to verify we're using the ID
      const selectedSubcat = subcats.find(
        (sc) => sc.docsubcatrecid === value || sc.docsubcatname === value
      );
      console.log("Selected subcategory object:", selectedSubcat);
    }
  };

  // ✅ FIXED: Function to convert file to base64 (strips data URL prefix)
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Extract just the base64 part (remove the data URL prefix)
        const result = reader.result;
        const base64Data = result.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error); // ✅ FIXED: Added arrow function syntax
    });
  };

  // ✅ ENHANCED: Handle file selection for sample document
  const handleSampleDocChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading((prev) => ({ ...prev, sample: true }));

      try {
        // Check file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
          showToast(
            `File size ${(file.size / (1024 * 1024)).toFixed(
              2
            )}MB exceeds the 10MB limit`,
            "error"
          );
          // Clear the file input
          e.target.value = "";
          return;
        }

        // Check file type
        const allowedTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/plain",
        ];
        if (!allowedTypes.includes(file.type)) {
          showToast(
            "Invalid file type. Please select PDF, DOC, DOCX, XLS, XLSX, or TXT files.",
            "error"
          );
          // Clear the file input
          e.target.value = "";
          return;
        }

        const base64 = await convertFileToBase64(file);
        setFormData((prev) => ({
          ...prev,
          sampleDocName: file.name,
          sampleDocBase64: base64,
        }));
        showToast("Sample document uploaded successfully", "success");
      } catch (error) {
        console.error("Error converting file to base64:", error);
        showToast("Failed to process sample document", "error");
        // Clear the file input on error
        e.target.value = "";
      } finally {
        setIsUploading((prev) => ({ ...prev, sample: false }));
      }
    }
  };

  // ✅ ENHANCED: Handle file selection for template document
  const handleTemplateDocChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading((prev) => ({ ...prev, template: true }));

      try {
        // Check file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
          showToast(
            `File size ${(file.size / (1024 * 1024)).toFixed(
              2
            )}MB exceeds the 10MB limit`,
            "error"
          );
          // Clear the file input
          e.target.value = "";
          return;
        }

        // Check file type
        const allowedTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/plain",
        ];
        if (!allowedTypes.includes(file.type)) {
          showToast(
            "Invalid file type. Please select PDF, DOC, DOCX, XLS, XLSX, or TXT files.",
            "error"
          );
          // Clear the file input
          e.target.value = "";
          return;
        }

        const base64 = await convertFileToBase64(file);
        setFormData((prev) => ({
          ...prev,
          templateDocName: file.name,
          templateDocBase64: base64,
        }));
        showToast("Template document uploaded successfully", "success");
      } catch (error) {
        console.error("Error converting file to base64:", error);
        showToast("Failed to process template document", "error");
        // Clear the file input on error
        e.target.value = "";
      } finally {
        setIsUploading((prev) => ({ ...prev, template: false }));
      }
    }
  };

  // ✅ NEW: Helper function to validate base64
  const isValidBase64 = (str) => {
    try {
      return btoa(atob(str)) === str;
    } catch (err) {
      return false;
    }
  };

  // ✅ NEW: Function to check for duplicate documents
  const checkForDuplicate = () => {
    // Check if a document with the same details already exists
    const duplicate = documents.find(
      (doc) =>
        doc.documentcatrecid == formData.documentcatrecid &&
        doc.documentsubcatrecid == formData.documentsubcatrecid &&
        doc.documentperiodicityrecid == formData.documentperiodicityrecid &&
        doc.documentname.toLowerCase() === formData.documentname.toLowerCase()
    );

    return duplicate;
  };

  // ✅ UPDATED: Delete with POST API and JSON body
  const handleDelete = (docId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This document will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        // Set loading state for this specific document
        setIsDeleting((prev) => ({ ...prev, [docId]: true }));

        // Show loading popup
        Swal.fire({
          title: "Deleting...",
          text: "Please wait while we delete the document",
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // ✅ UPDATED: Use POST API with JSON body and bearer token
        const url = `${IP}/itelinc/api/documents/deleteDocumentDetails`;
        const requestBody = {
          documentsrecid: docId,
          documentmodifiedby: parseInt(userId) || 39,
        };

        fetch(url, {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.statusCode === 200) {
              Swal.fire(
                "Deleted!",
                "Document deleted successfully!",
                "success"
              );
              refreshData();
            } else {
              throw new Error(data.message || "Failed to delete document");
            }
          })
          .catch((err) => {
            console.error("Error deleting document:", err);
            showToast(`Failed to delete: ${err.message}`, "error");
            // ✅ FIXED: Close the loading popup on error
            Swal.close();
          })
          .finally(() => {
            // Remove loading state for this document
            setIsDeleting((prev) => ({ ...prev, [docId]: false }));
          });
      }
    });
  };

  // ✅ ENHANCED: Add / Update Document with better validation
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form first
    if (!validateForm()) {
      showToast("Please fix the errors in the form", "error");
      return;
    }

    setIsSaving(true);

    // ✅ FIXED: Get the subcategory ID directly from form data
    // The dropdown value should already be the correct ID
    let subcatId = formData.documentsubcatrecid;

    // ✅ IMPROVED: Add robust logic to handle subcategory ID similar to the second code
    // If the value is not a number, try to find the subcategory by name
    if (isNaN(formData.documentsubcatrecid)) {
      console.log("Subcategory value is not numeric, trying to find by name");
      const subcatByName = subcats.find(
        (sc) => sc.docsubcatname === formData.documentsubcatrecid
      );
      if (subcatByName) {
        subcatId = subcatByName.docsubcatrecid;
        console.log("Found subcategory by name, using ID:", subcatId);
      } else {
        console.error(
          "Could not find subcategory by name:",
          formData.documentsubcatrecid
        );
        showToast("Invalid subcategory selected", "error");
        setIsSaving(false);
        return;
      }
    } else {
      console.log("Subcategory value is numeric, using as ID:", subcatId);
      // Convert to integer if it's a string
      if (typeof subcatId === "string" && subcatId !== "") {
        subcatId = parseInt(subcatId);
      }
    }

    console.log("Subcategory ID from form:", subcatId);

    // Validate that we have a valid subcategory ID
    if (!subcatId || isNaN(subcatId)) {
      showToast("Please select a valid subcategory", "error");
      setIsSaving(false);
      return;
    }

    // Check for duplicates before submitting
    if (!editDoc) {
      const duplicate = checkForDuplicate();
      if (duplicate) {
        showToast(
          `A document with these details already exists (ID: ${duplicate.documentsrecid})`,
          "warning"
        );
        setIsSaving(false);
        return;
      }
    }

    // For new documents, validate base64 data if files were selected
    if (!editDoc) {
      if (formData.sampleDocName && !formData.sampleDocBase64) {
        showToast(
          "Sample document conversion failed. Please try again.",
          "error"
        );
        setIsSaving(false);
        return;
      }

      if (formData.templateDocName && !formData.templateDocBase64) {
        showToast(
          "Template document conversion failed. Please try again.",
          "error"
        );
        setIsSaving(false);
        return;
      }

      // Optional: Validate base64 format
      if (
        formData.sampleDocBase64 &&
        !isValidBase64(formData.sampleDocBase64)
      ) {
        showToast("Invalid sample document format. Please try again.", "error");
        setIsSaving(false);
        return;
      }

      if (
        formData.templateDocBase64 &&
        !isValidBase64(formData.templateDocBase64)
      ) {
        showToast(
          "Invalid template document format. Please try again.",
          "error"
        );
        setIsSaving(false);
        return;
      }
    }

    // Close the modal before showing the loading popup
    setIsModalOpen(false);

    // Show loading popup
    const loadingTitle = editDoc ? "Updating..." : "Saving...";
    const loadingText = editDoc
      ? "Please wait while we update the document"
      : "Please wait while we save the document";

    Swal.fire({
      title: loadingTitle,
      text: loadingText,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Different handling for add vs update
    if (editDoc) {
      // ✅ NEW: Check if we need to download the other document
      let sampleDocBase64 = formData.sampleDocBase64;
      let templateDocBase64 = formData.templateDocBase64;
      let sampleDocName = formData.sampleDocName;
      let templateDocName = formData.templateDocName;

      // If only sample document is being updated, download the template document
      if (
        formData.sampleDocBase64 &&
        !formData.templateDocBase64 &&
        editDoc.documenttemplatedoc
      ) {
        console.log("Downloading template document for update");
        templateDocBase64 = await fetchDocumentAsBase64(
          editDoc.documenttemplatedoc,
          editDoc.documenttemplatedocname
        );
        if (templateDocBase64) {
          templateDocName = editDoc.documenttemplatedocname;
          console.log("Template document downloaded and converted to base64");
        } else {
          console.error("Failed to download template document");
        }
      }

      // If only template document is being updated, download the sample document
      if (
        !formData.sampleDocBase64 &&
        formData.templateDocBase64 &&
        editDoc.documentsampledoc
      ) {
        console.log("Downloading sample document for update");
        sampleDocBase64 = await fetchDocumentAsBase64(
          editDoc.documentsampledoc,
          editDoc.documentsampledocname
        );
        if (sampleDocBase64) {
          sampleDocName = editDoc.documentsampledocname;
          console.log("Sample document downloaded and converted to base64");
        } else {
          console.error("Failed to download sample document");
        }
      }

      // ✅ FINAL FIX: Construct the payload to be explicit about file names to prevent deletion.
      const requestBody = {
        userid: parseInt(userId) || 32,
        documentsrecid: editDoc.documentsrecid,
        doccatid: parseInt(formData.documentcatrecid),
        docsubcatid: subcatId,
        documentperiodicityrecid: parseInt(formData.documentperiodicityrecid),
        documentname: formData.documentname.trim(),
        documentdescription: formData.documentdescription.trim(),
        documentcreatedby: editDoc.documentcreatedby,
        documentmodifiedby: parseInt(userId) || 32,
        documentremarks: formData.documentremarks || "",
      };

      // ✅ NEW: Always include file names and base64 data
      // Use the new name and base64 if a file was uploaded,
      // otherwise use the original name and downloaded base64
      requestBody.sampleDocName = sampleDocName || originalFileNames.sample;
      requestBody.templateDocName =
        templateDocName || originalFileNames.template;

      if (sampleDocBase64) {
        requestBody.sampleDocBase64 = sampleDocBase64;
      }
      if (templateDocBase64) {
        requestBody.templateDocBase64 = templateDocBase64;
      }

      console.log("Final Update Request Body being sent:", requestBody);

      const url = `${IP}/itelinc/api/documents/updateDocumentDetails`;

      fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Update API Response:", data);

          if (data.statusCode === 200) {
            setEditDoc(null);
            refreshData();
            Swal.fire(
              "Success",
              data.message || "Document updated successfully!",
              "success"
            );
          } else {
            throw new Error(data.message || "Operation failed");
          }
        })
        .catch((err) => {
          console.error("Error updating document:", err);
          showToast(`Failed to update: ${err.message}`, "error");
          // ✅ FIXED: Close the loading popup on error
          Swal.close();
          // ✅ FIXED: Reopen the modal so user can retry
          setIsModalOpen(true);
        })
        .finally(() => setIsSaving(false));
    } else {
      // ✅ FIXED: Ensure all required fields are properly set and validated
      const userIdValue = userId ? parseInt(userId) : 39;
      const catIdValue = formData.documentcatrecid
        ? parseInt(formData.documentcatrecid)
        : null;
      const subcatIdValue = subcatId ? parseInt(subcatId) : null;

      // Debug logging
      console.log("Form values before API call:", {
        userId: userId,
        userIdValue: userIdValue,
        documentcatrecid: formData.documentcatrecid,
        catIdValue: catIdValue,
        documentsubcatrecid: formData.documentsubcatrecid,
        subcatId: subcatId,
        subcatIdValue: subcatIdValue,
      });

      // Validate required fields
      if (!userIdValue) {
        showToast("User ID is missing. Please log in again.", "error");
        setIsSaving(false);
        Swal.close();
        return;
      }

      if (!catIdValue) {
        showToast("Category is required. Please select a category.", "error");
        setIsSaving(false);
        Swal.close();
        setIsModalOpen(true); // Reopen modal
        return;
      }

      if (!subcatIdValue) {
        showToast(
          "Subcategory is required. Please select a subcategory.",
          "error"
        );
        setIsSaving(false);
        Swal.close();
        setIsModalOpen(true); // Reopen modal
        return;
      }

      // Add document - use the new JSON API with updated payload format
      const requestBody = {
        userid: userIdValue,
        doccatid: catIdValue,
        docsubcatid: subcatIdValue,
        documentperiodicityrecid:
          parseInt(formData.documentperiodicityrecid) || 4,
        documentname: formData.documentname.trim(),
        documentdescription: formData.documentdescription.trim(),
        documentcreatedby: userIdValue,
        documentmodifiedby: userIdValue,
        documentremarks: formData.documentremarks || "",
        sampleDocName: formData.sampleDocName || "",
        sampleDocBase64: formData.sampleDocBase64 || "",
        templateDocName: formData.templateDocName || "",
        templateDocBase64: formData.templateDocBase64 || "",
      };

      console.log("Request body being sent:", requestBody);

      const url = `${IP}/itelinc/api/documents/addDocumentDetails`;

      fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
        .then((res) => {
          console.log("Response status:", res.status);
          return res.json();
        })
        .then((data) => {
          console.log("API Response:", data);

          if (data.statusCode === 200) {
            // Check if there's an error message in the data field
            if (data.data && data.data.includes("Duplicate entry")) {
              // Extract the document name from the error message for a more user-friendly message
              const docNameMatch = data.data.match(/Duplicate entry '([^']+)'/);
              const docName = docNameMatch ? docNameMatch[1] : "this document";

              Swal.fire(
                "Duplicate Document",
                `A document with the same details (${docName}) already exists. Please use a different name or check existing documents.`,
                "warning"
              ).then(() => {
                // Reopen the modal so the user can modify their entry
                setIsModalOpen(true);
                setFieldErrors({
                  documentname: `Document "${docName}" already exists`,
                });
              });
            } else {
              // Success case
              setEditDoc(null);
              refreshData();
              Swal.fire(
                "Success",
                data.message || "Document saved successfully!",
                "success"
              );
            }
          } else {
            throw new Error(data.message || "Operation failed");
          }
        })
        .catch((err) => {
          console.error("Error saving document:", err);
          showToast(`Failed to save: ${err.message}`, "error");
          // ✅ FIXED: Close the loading popup on error
          Swal.close();
          // Reopen modal on error so user can retry
          setIsModalOpen(true);
        })
        .finally(() => setIsSaving(false));
    }
  };

  // ✅ FIXED: Function to get filtered subcategories
  const getFilteredSubcategories = () => {
    if (!formData.documentcatrecid || subcats.length === 0) {
      return [];
    }

    // ✅ CORRECT: Use the correct field name from the API response
    const filtered = subcats.filter((sc) => {
      // Convert both to strings for comparison to handle type mismatches
      const catId = String(formData.documentcatrecid);

      // ✅ Use the correct field name: docsubcatscatrecid
      return sc.docsubcatscatrecid && String(sc.docsubcatscatrecid) === catId;
    });

    console.log("Filtered subcategories:", filtered);
    console.log("Selected category ID:", formData.documentcatrecid);
    console.log("Available subcategories:", subcats);

    return filtered;
  };

  // ✅ NEW: Function to render the preview modal
  const renderPreviewModal = () => {
    if (!isPreviewModalOpen) return null;

    return (
      <div
        className="attachment-preview-modal"
        onClick={() => setIsPreviewModalOpen(false)}
      >
        <div className="preview-container" onClick={(e) => e.stopPropagation()}>
          <div className="preview-header">
            <h3>{previewDoc?.name}</h3>
            <button
              className="close-btn"
              onClick={() => setIsPreviewModalOpen(false)}
            >
              <FaTimes />
            </button>
          </div>

          <div className="preview-content">
            {previewLoading ? (
              <div className="preview-loading">
                <FaSpinner className="spinner" />
                <p>Loading document preview...</p>
              </div>
            ) : (
              <>
                {previewContent && previewContent.type === "image" && (
                  <img
                    src={previewContent.url}
                    alt="Preview"
                    className="preview-image"
                  />
                )}

                {previewContent && previewContent.type === "pdf" && (
                  <iframe
                    src={`${previewContent.url}#view=FitH`}
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
                      {getFileIcon(previewDoc?.name)}
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
            <button
              className="btn-cancel"
              onClick={() => setIsPreviewModalOpen(false)}
            >
              Close
            </button>
            {previewDoc?.originalPath && (
              <button
                className="btn-download"
                onClick={() =>
                  downloadDocument(previewDoc.originalPath, previewDoc.name)
                }
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <FaSpinner className="spinner" /> Downloading...
                  </>
                ) : (
                  <>
                    <FaDownload /> Download
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="doccat-container">
      {/* ✅ UPDATED: Header with title and button side-by-side */}
      <div className="doccat-header-with-title">
        <h2 className="doccat-title">{title}</h2>
        {Number(roleid) === 1 && (
          <button className="btn-add-category" onClick={openAddModal}>
            + Add Document
          </button>
        )}
      </div>

      {loading ? (
        <div className="skeleton-row"></div>
      ) : (
        <div className="doccat-table-wrapper">
          <table className="doccat-table">
            <thead>
              <tr>
                {/* ✅ NEW: Added S.No column header */}
                <th className="sno-header">S.No</th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("doccatname")}
                >
                  <div className="header-content">
                    <span>Category</span>
                    <span className="sort-icon-container">
                      {getSortIcon("doccatname")}
                    </span>
                  </div>
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("docsubcatname")}
                >
                  <div className="header-content">
                    <span>Subcategory</span>
                    <span className="sort-icon-container">
                      {getSortIcon("docsubcatname")}
                    </span>
                  </div>
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("documentname")}
                >
                  <div className="header-content">
                    <span>Name</span>
                    <span className="sort-icon-container">
                      {getSortIcon("documentname")}
                    </span>
                  </div>
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("documentdescription")}
                >
                  <div className="header-content">
                    <span>Description</span>
                    <span className="sort-icon-container">
                      {getSortIcon("documentdescription")}
                    </span>
                  </div>
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("docperiodicityname")}
                >
                  <div className="header-content">
                    <span>Periodicity</span>
                    <span className="sort-icon-container">
                      {getSortIcon("docperiodicityname")}
                    </span>
                  </div>
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("documentremarks")}
                >
                  <div className="header-content">
                    <span>Remarks</span>
                    <span className="sort-icon-container">
                      {getSortIcon("documentremarks")}
                    </span>
                  </div>
                </th>
                <th>Sample Document</th>
                <th>Template Document</th>
                {/* Hide these columns if roleid is 4 */}
                {Number(roleid) !== 4 && (
                  <>
                    <th
                      className="sortable-header"
                      onClick={() => requestSort("documentcreatedby")}
                    >
                      <div className="header-content">
                        <span>Created By</span>
                        <span className="sort-icon-container">
                          {getSortIcon("documentcreatedby")}
                        </span>
                      </div>
                    </th>
                    <th
                      className="sortable-header"
                      onClick={() => requestSort("documentcreatedtime")}
                    >
                      <div className="header-content">
                        <span>Created Time</span>
                        <span className="sort-icon-container">
                          {getSortIcon("documentcreatedtime")}
                        </span>
                      </div>
                    </th>
                    <th
                      className="sortable-header"
                      onClick={() => requestSort("documentmodifiedby")}
                    >
                      <div className="header-content">
                        <span>Modified By</span>
                        <span className="sort-icon-container">
                          {getSortIcon("documentmodifiedby")}
                        </span>
                      </div>
                    </th>
                    <th
                      className="sortable-header"
                      onClick={() => requestSort("documentmodifiedtime")}
                    >
                      <div className="header-content">
                        <span>Modified Time</span>
                        <span className="sort-icon-container">
                          {getSortIcon("documentmodifiedtime")}
                        </span>
                      </div>
                    </th>
                    <th>Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedDocuments.length > 0 ? (
                sortedDocuments.map((doc, idx) => (
                  <tr key={doc.documentsrecid || idx}>
                    {/* ✅ NEW: Added S.No column with sequential numbering */}
                    <td className="sno-cell">{idx + 1}</td>
                    <td>{doc.doccatname}</td>
                    <td>{doc.docsubcatname}</td>
                    <td className="doccat-name">{doc.documentname}</td>
                    <td>{doc.documentdescription}</td>
                    <td>{doc.docperiodicityname}</td>
                    <td className="doc-remarks">
                      {doc.documentremarks ? (
                        <span title={doc.documentremarks}>
                          {doc.documentremarks.length > 20
                            ? `${doc.documentremarks.substring(0, 20)}...`
                            : doc.documentremarks}
                        </span>
                      ) : (
                        <span className="no-data">-</span>
                      )}
                    </td>
                    <td className="doc-file-cell">
                      {doc.documentsampledocname ? (
                        <div
                          className="message-attachment file-attachment whatsapp-style"
                          onClick={() =>
                            previewDocument(
                              doc.documentsampledoc,
                              doc.documentsampledocname
                            )
                          }
                          title={`Click to preview ${doc.documentsampledocname}`}
                        >
                          <div className="file-icon-container">
                            <div className="file-icon">
                              {getFileIcon(doc.documentsampledocname)}
                            </div>
                          </div>
                          <div className="file-info">
                            <div className="file-name">
                              {doc.documentsampledocname.length > 20
                                ? `${doc.documentsampledocname.substring(
                                    0,
                                    20
                                  )}...`
                                : doc.documentsampledocname}
                            </div>
                            <div className="file-type">
                              {getFileTypeText(doc.documentsampledocname)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="no-data">-</span>
                      )}
                    </td>
                    <td className="doc-file-cell">
                      {doc.documenttemplatedocname ? (
                        <div
                          className="message-attachment file-attachment whatsapp-style"
                          onClick={() =>
                            previewDocument(
                              doc.documenttemplatedoc,
                              doc.documenttemplatedocname
                            )
                          }
                          title={`Click to preview ${doc.documenttemplatedocname}`}
                        >
                          <div className="file-icon-container">
                            <div className="file-icon">
                              {getFileIcon(doc.documenttemplatedocname)}
                            </div>
                          </div>
                          <div className="file-info">
                            <div className="file-name">
                              {doc.documenttemplatedocname.length > 20
                                ? `${doc.documenttemplatedocname.substring(
                                    0,
                                    20
                                  )}...`
                                : doc.documenttemplatedocname}
                            </div>
                            <div className="file-type">
                              {getFileTypeText(doc.documenttemplatedocname)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="no-data">-</span>
                      )}
                    </td>
                    {/* Hide these cells if roleid is 4 */}
                    {Number(roleid) !== 4 && (
                      <>
                        <td>
                          {isNaN(doc.documentcreatedby)
                            ? doc.documentcreatedby
                            : "Admin"}
                        </td>
                        <td>{formatDate(doc.documentcreatedtime)}</td>
                        <td>
                          {isNaN(doc.documentmodifiedby)
                            ? doc.documentmodifiedby
                            : "Admin"}
                        </td>
                        <td>{formatDate(doc.documentmodifiedtime)}</td>
                        <td>
                          <div className="doccat-actions">
                            <button
                              className="btn-edit"
                              onClick={() => openEditModal(doc)}
                              disabled={isSaving}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDelete(doc.documentsrecid)}
                              disabled={
                                isDeleting[doc.documentsrecid] || isSaving
                              }
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  {/* ✅ UPDATED: Updated colspan to account for the new S.No column and roleid */}
                  <td
                    colSpan={Number(roleid) === 4 ? 10 : 15}
                    className="doccat-empty"
                  >
                    No documents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="doccat-modal-backdrop">
          <div className="doccat-modal-content">
            <div className="doccat-modal-header">
              <h3>{editDoc ? "Edit Document" : "Add Document"}</h3>
              <button
                className="btn-close"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                <FaTimes />
              </button>
            </div>
            <div className="doccat-modal-body-scrollable">
              <form className="doccat-form compact" onSubmit={handleSubmit}>
                <div className="form-row">
                  <label
                    className={`form-field ${
                      fieldErrors.documentcatrecid ? "field-error" : ""
                    }`}
                  >
                    Category *
                    <select
                      name="documentcatrecid"
                      value={formData.documentcatrecid}
                      onChange={handleChange}
                      required
                      disabled={isSaving}
                    >
                      <option value="">Select Category</option>
                      {cats.map((cat) => (
                        <option key={cat.doccatrecid} value={cat.doccatrecid}>
                          {cat.doccatname}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.documentcatrecid && (
                      <span className="field-error-message">
                        <FaExclamationTriangle /> {fieldErrors.documentcatrecid}
                      </span>
                    )}
                  </label>

                  <label
                    className={`form-field ${
                      fieldErrors.documentsubcatrecid ? "field-error" : ""
                    }`}
                  >
                    Subcategory *
                    <select
                      name="documentsubcatrecid"
                      value={formData.documentsubcatrecid}
                      onChange={handleChange}
                      required
                      disabled={!formData.documentcatrecid || isSaving}
                    >
                      <option value="">Select Subcategory</option>
                      {getFilteredSubcategories().length > 0 ? (
                        getFilteredSubcategories().map((sc) => (
                          <option
                            key={sc.docsubcatrecid}
                            value={sc.docsubcatrecid}
                          >
                            {sc.docsubcatname}
                          </option>
                        ))
                      ) : formData.documentcatrecid ? (
                        <option value="" disabled>
                          No subcategories available for this category
                        </option>
                      ) : (
                        <option value="" disabled>
                          Please select a category first
                        </option>
                      )}
                    </select>
                    {fieldErrors.documentsubcatrecid && (
                      <span className="field-error-message">
                        <FaExclamationTriangle />{" "}
                        {fieldErrors.documentsubcatrecid}
                      </span>
                    )}
                  </label>
                </div>

                <div className="form-row">
                  <label
                    className={`form-field ${
                      fieldErrors.documentperiodicityrecid ? "field-error" : ""
                    }`}
                  >
                    Periodicity *
                    <select
                      name="documentperiodicityrecid"
                      value={formData.documentperiodicityrecid}
                      onChange={handleChange}
                      required
                      disabled={isSaving}
                    >
                      <option value="">Select Periodicity</option>
                      <option value="1">One-time</option>
                      <option value="2">Monthly</option>
                      <option value="3">Quarterly</option>
                      <option value="4">Yearly</option>
                    </select>
                    {fieldErrors.documentperiodicityrecid && (
                      <span className="field-error-message">
                        <FaExclamationTriangle />{" "}
                        {fieldErrors.documentperiodicityrecid}
                      </span>
                    )}
                  </label>

                  <label
                    className={`form-field ${
                      fieldErrors.documentname ? "field-error" : ""
                    }`}
                  >
                    Document Name *
                    <input
                      type="text"
                      name="documentname"
                      value={formData.documentname}
                      onChange={handleChange}
                      onBlur={(e) =>
                        validateField("documentname", e.target.value)
                      }
                      required
                      disabled={isSaving}
                      placeholder="Document name"
                    />
                    {fieldErrors.documentname && (
                      <span className="field-error-message">
                        <FaExclamationTriangle /> {fieldErrors.documentname}
                      </span>
                    )}
                  </label>
                </div>

                <label
                  className={`form-field ${
                    fieldErrors.documentdescription ? "field-error" : ""
                  }`}
                >
                  Description *
                  <textarea
                    name="documentdescription"
                    value={formData.documentdescription}
                    onChange={handleChange}
                    onBlur={(e) =>
                      validateField("documentdescription", e.target.value)
                    }
                    required
                    rows="2"
                    disabled={isSaving}
                    placeholder="Brief description"
                  />
                  {fieldErrors.documentdescription && (
                    <span className="field-error-message">
                      <FaExclamationTriangle />{" "}
                      {fieldErrors.documentdescription}
                    </span>
                  )}
                </label>

                {/* Remarks field - shown for both add and edit */}
                <label className="form-field">
                  Remarks
                  <input
                    type="text"
                    name="documentremarks"
                    value={formData.documentremarks}
                    onChange={handleChange}
                    disabled={isSaving}
                    placeholder="Optional remarks"
                  />
                </label>

                {/* ✅ CHANGED: File upload fields are now shown for both add and edit */}
                <div className="form-row">
                  <label className="form-field file-input-label">
                    {editDoc ? "Replace Sample Document" : "Sample Document"}
                    <div className="file-input-container">
                      <input
                        type="file"
                        id="sampleDoc"
                        onChange={handleSampleDocChange}
                        disabled={isSaving || isUploading.sample}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      />
                      <label htmlFor="sampleDoc" className="file-input-button">
                        {isUploading.sample ? (
                          <>
                            <FaSpinner className="spinner" /> Uploading...
                          </>
                        ) : (
                          <>
                            <FaFileUpload /> Choose File
                          </>
                        )}
                      </label>
                      <span className="file-name">
                        {formData.sampleDocName || "No file chosen"}
                      </span>
                    </div>
                  </label>

                  <label className="form-field file-input-label">
                    {editDoc
                      ? "Replace Template Document"
                      : "Template Document"}
                    <div className="file-input-container">
                      <input
                        type="file"
                        id="templateDoc"
                        onChange={handleTemplateDocChange}
                        disabled={isSaving || isUploading.template}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      />
                      <label
                        htmlFor="templateDoc"
                        className="file-input-button"
                      >
                        {isUploading.template ? (
                          <>
                            <FaSpinner className="spinner" /> Uploading...
                          </>
                        ) : (
                          <>
                            <FaFileUpload /> Choose File
                          </>
                        )}
                      </label>
                      <span className="file-name">
                        {formData.templateDocName || "No file chosen"}
                      </span>
                    </div>
                    {/* ✅ NEW: File size indicator */}
                    <div className="file-requirements">
                      <FaInfoCircle className="info-icon" />
                      <span>Maximum file size: 10MB</span>
                    </div>
                  </label>
                </div>

                {/* Show existing documents in edit mode */}
                {editDoc && (
                  <div className="existing-docs-section compact">
                    <h4>Existing Documents</h4>
                    <div className="existing-docs-grid">
                      <div className="existing-doc-item">
                        <label>Sample Document</label>
                        {editDoc.documentsampledocname ? (
                          <div className="existing-doc-info">
                            {getFileIcon(editDoc.documentsampledocname)}
                            <span className="doc-name">
                              {editDoc.documentsampledocname}
                            </span>
                            <button
                              type="button"
                              className="preview-existing-btn"
                              onClick={() =>
                                previewDocument(
                                  editDoc.documentsampledoc,
                                  editDoc.documentsampledocname
                                )
                              }
                            >
                              <FaEye /> Preview
                            </button>
                          </div>
                        ) : (
                          <span className="no-data">No sample document</span>
                        )}
                      </div>
                      <br />
                      <div className="existing-doc-item">
                        <label>Template Document</label>
                        {editDoc.documenttemplatedocname ? (
                          <div className="existing-doc-info">
                            {getFileIcon(editDoc.documenttemplatedocname)}
                            <span className="doc-name">
                              {editDoc.documenttemplatedocname}
                            </span>
                            <button
                              type="button"
                              className="preview-existing-btn"
                              onClick={() =>
                                previewDocument(
                                  editDoc.documenttemplatedoc,
                                  editDoc.documenttemplatedocname
                                )
                              }
                            >
                              <FaEye /> Preview
                            </button>
                          </div>
                        ) : (
                          <span className="no-data">No template document</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
            <div className="doccat-modal-footer">
              <div className="doccat-form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  onClick={handleSubmit}
                  disabled={isSaving || Object.keys(fieldErrors).length > 0}
                >
                  {isSaving ? (
                    <>
                      <div className="spinner"></div>
                      {editDoc ? "Updating..." : "Saving..."}
                    </>
                  ) : editDoc ? (
                    "Update"
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: Preview Modal adapted from Message component */}
      {renderPreviewModal()}

      {/* Enhanced Toast notification */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === "success" && <FaCheck />}
            {toast.type === "error" && <FaTimes />}
            {toast.type === "warning" && <FaExclamationTriangle />}
            {toast.type === "info" && <FaInfoCircle />}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-close"
            onClick={() => setToast(null)}
            aria-label="Close notification"
          >
            <FaTimes />
          </button>
        </div>
      )}
    </div>
  );
});

DocumentsTable.displayName = "DocumentsTable";

export default DocumentsTable;
