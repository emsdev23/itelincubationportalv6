import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import "./DocCatTable.css";
import { FaTrash, FaEdit, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";

export default function DocumentsTable() {
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");

  const [documents, setDocuments] = useState([]);
  const [cats, setCats] = useState([]);
  const [subcats, setSubcats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [formData, setFormData] = useState({
    documentname: "",
    documentdescription: "",
    documentcatrecid: "",
    documentsubcatrecid: "",
    documentperiodicityrecid: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // New loading states for specific operations
  const [isDeleting, setIsDeleting] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  // ✅ Fetch documents
  const IP = "http://121.242.232.212:8086";
  const fetchDocuments = () => {
    setLoading(true);
    setError(null);
    fetch(`${IP}/itelinc/getDocumentsAll`, {
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
        setError("Failed to load documents. Please try again.");
        setLoading(false);
      });
  };

  // ✅ Fetch categories independently
  const fetchCategories = () => {
    fetch(`${IP}/itelinc/getDoccatAll`, {
      method: "GET",
      mode: "cors",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Categories data:", data); // Log for debugging
        setCats(data.data || []);
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
      });
  };

  // ✅ Fetch subcategories independently
  const fetchSubCategories = () => {
    fetch(`${IP}/itelinc/getDocsubcatAll`, {
      method: "GET",
      mode: "cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Subcategories data:", data); // Log for debugging
        setSubcats(data.data || []);
      })
      .catch((err) => {
        console.error("Error fetching subcategories:", err);
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

  // Enhanced sorting function to handle different data types
  const sortValue = (value, key, originalIndex) => {
    // Handle null/undefined values
    if (value === null || value === undefined) {
      return "";
    }

    // For S.No column, use the original index
    if (key === "sno") {
      return originalIndex;
    }

    // Handle date/time strings
    if (key === "documentcreatedtime" || key === "documentmodifiedtime") {
      return value ? new Date(value) : new Date(0);
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

  const openAddModal = () => {
    setEditDoc(null);
    setFormData({
      documentname: "",
      documentdescription: "",
      documentcatrecid: "",
      documentsubcatrecid: "",
      documentperiodicityrecid: "",
    });
    // ✅ Refresh dropdown data before opening the modal
    refreshDropdownData();
    setIsModalOpen(true);
    setError(null);
  };

  const openEditModal = (doc) => {
    setEditDoc(doc);
    setFormData({
      documentname: doc.documentname || "",
      documentdescription: doc.documentdescription || "",
      documentcatrecid: doc.documentcatrecid || "",
      documentsubcatrecid: doc.documentsubcatrecid || "",
      documentperiodicityrecid: doc.documentperiodicityrecid || "",
    });
    // ✅ Refresh dropdown data before opening the modal
    refreshDropdownData();
    setIsModalOpen(true);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field changed: ${name} = ${value}`); // Log for debugging

    // ✅ Additional debugging for subcategory
    if (name === "documentsubcatrecid") {
      console.log("Subcategory value type:", typeof value);
      console.log("Is subcategory value numeric?", !isNaN(value));

      // Find the selected subcategory to verify we're using the ID
      const selectedSubcat = subcats.find(
        (sc) => sc.documentsubcatrecid === value || sc.docsubcatname === value
      );
      console.log("Selected subcategory object:", selectedSubcat);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "documentcatrecid") {
      setFormData((prev) => ({ ...prev, documentsubcatrecid: "" }));
    }
  };

  // ✅ Delete with SweetAlert and loading popup
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

        const url = `${IP}/itelinc/deleteDocumentDetails?documentsrecid=${docId}&documentmodifiedby=${
          userId || "32"
        }`;

        fetch(url, {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
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
            Swal.fire("Error", `Failed to delete: ${err.message}`, "error");
          })
          .finally(() => {
            // Remove loading state for this document
            setIsDeleting((prev) => ({ ...prev, [docId]: false }));
          });
      }
    });
  };

  // ✅ Add / Update Document with loading popup
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // Validate
    if (
      !formData.documentname.trim() ||
      !formData.documentdescription.trim() ||
      !formData.documentcatrecid ||
      !formData.documentsubcatrecid ||
      !formData.documentperiodicityrecid
    ) {
      setError("All fields are required");
      setIsSaving(false);
      return;
    }

    // ✅ Find the selected subcategory to ensure we have the right ID
    let subcatId = formData.documentsubcatrecid;

    // If the value is not a number, try to find the subcategory by name
    if (isNaN(formData.documentsubcatrecid)) {
      console.log("Subcategory value is not numeric, trying to find by name");
      const subcatByName = subcats.find(
        (sc) => sc.docsubcatname === formData.documentsubcatrecid
      );
      if (subcatByName) {
        subcatId = subcatByName.documentsubcatrecid;
        console.log("Found subcategory by name, using ID:", subcatId);
      } else {
        console.error(
          "Could not find subcategory by name:",
          formData.documentsubcatrecid
        );
        setError("Invalid subcategory selected");
        setIsSaving(false);
        return;
      }
    } else {
      console.log("Subcategory value is numeric, using as ID:", subcatId);
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

    const params = new URLSearchParams();
    if (editDoc) {
      params.append("documentsrecid", editDoc.documentsrecid);
    }

    // ✅ Use the verified IDs
    params.append("documentname", formData.documentname.trim());
    params.append("documentdescription", formData.documentdescription.trim());
    params.append("documentcatrecid", formData.documentcatrecid); // This is the ID
    params.append("documentsubcatrecid", subcatId); // Use the verified ID
    params.append(
      "documentperiodicityrecid",
      formData.documentperiodicityrecid
    );

    if (editDoc) {
      params.append("documentmodifiedby", userId || "32");
    } else {
      params.append("documentcreatedby", userId || "32");
      params.append("documentmodifiedby", userId || "32");
    }

    const baseUrl = editDoc
      ? `${IP}/itelinc/updateDocumentDetails`
      : `${IP}/itelinc/addDocumentDetails`;

    const url = `${baseUrl}?${params.toString()}`;

    // ✅ Log the URL for debugging
    console.log("Request URL:", url);
    console.log("Category ID being sent:", formData.documentcatrecid);
    console.log("Subcategory ID being sent:", subcatId);

    fetch(url, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data); // Log the response for debugging

        if (data.statusCode === 200) {
          if (
            data.data &&
            typeof data.data === "string" &&
            data.data.includes("Duplicate entry") &&
            data.data.includes("documents.unique_document_active")
          ) {
            setError("Document already exists");
            Swal.fire("Duplicate", "Document already exists!", "warning").then(
              () => {
                // Reopen the modal if there's a duplicate error
                setIsModalOpen(true);
              }
            );
          } else {
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
        setError(`Failed to save: ${err.message}`);
        Swal.fire("Error", `Failed to save: ${err.message}`, "error").then(
          () => {
            // Reopen the modal if there's an error
            setIsModalOpen(true);
          }
        );
      })
      .finally(() => setIsSaving(false));
  };

  // ✅ NEW: Add a function to get filtered subcategories for debugging
  const getFilteredSubcategories = () => {
    const filtered = subcats.filter(
      (sc) => sc.docsubcatscatrecid == formData.documentcatrecid
    );
    console.log("Filtered subcategories:", filtered);
    console.log("Selected category ID:", formData.documentcatrecid);
    return filtered;
  };

  return (
    <div className="doccat-container">
      <div className="doccat-header">
        <h2 className="doccat-title">📄 Documents</h2>
        <button className="btn-add-category" onClick={openAddModal}>
          + Add Document
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <p className="doccat-empty">Loading documents...</p>
      ) : (
        <div className="doccat-table-wrapper">
          <table className="doccat-table">
            <thead>
              <tr>
                {/* <th
                  className="sortable-header"
                  onClick={() => requestSort("sno")}
                >
                  S.No {getSortIcon("sno")}
                </th> */}
                <th
                  className="sortable-header"
                  onClick={() => requestSort("documentsrecid")}
                >
                  ID {getSortIcon("documentsrecid")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("doccatname")}
                >
                  Category {getSortIcon("doccatname")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("docsubcatname")}
                >
                  Subcategory {getSortIcon("docsubcatname")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("documentname")}
                >
                  Name {getSortIcon("documentname")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("documentdescription")}
                >
                  Description {getSortIcon("documentdescription")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("docperiodicityname")}
                >
                  Periodicity {getSortIcon("docperiodicityname")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("documentcreatedby")}
                >
                  Created By {getSortIcon("documentcreatedby")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("documentcreatedtime")}
                >
                  Created Time {getSortIcon("documentcreatedtime")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("documentmodifiedby")}
                >
                  Modified By {getSortIcon("documentmodifiedby")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("documentmodifiedtime")}
                >
                  Modified Time {getSortIcon("documentmodifiedtime")}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedDocuments.length > 0 ? (
                sortedDocuments.map((doc, idx) => (
                  <tr key={doc.documentsrecid || idx}>
                    {/* <td>{idx + 1}</td> */}
                    <td>{doc.documentsrecid}</td>
                    <td>{doc.doccatname}</td>
                    <td>{doc.docsubcatname}</td>
                    <td>{doc.documentname}</td>
                    <td>{doc.documentdescription}</td>
                    <td>{doc.docperiodicityname}</td>
                    <td>
                      {isNaN(doc.documentcreatedby)
                        ? doc.documentcreatedby
                        : "Admin"}
                    </td>
                    <td>
                      {new Date(doc.documentcreatedtime)
                        .toLocaleString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        })
                        .replace(",", "")}
                    </td>
                    <td>
                      {isNaN(doc.documentmodifiedby)
                        ? doc.documentmodifiedby
                        : "Admin"}
                    </td>
                    <td>
                      {new Date(doc.documentmodifiedtime)
                        .toLocaleString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        })
                        .replace(",", "")}
                    </td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => openEditModal(doc)}
                        disabled={isSaving} // Disable when saving
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(doc.documentsrecid)}
                        disabled={isDeleting[doc.documentsrecid] || isSaving} // Disable when deleting or saving
                      >
                        <FaTrash size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="12" className="doccat-empty">
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
                disabled={isSaving} // Disable when saving
              >
                &times;
              </button>
            </div>
            <form className="doccat-form" onSubmit={handleSubmit}>
              <label>
                Category *
                <select
                  name="documentcatrecid"
                  value={formData.documentcatrecid}
                  onChange={handleChange}
                  required
                  disabled={isSaving} // Disable when saving
                >
                  <option value="">Select Category</option>
                  {cats.map((cat) => (
                    <option key={cat.doccatrecid} value={cat.doccatrecid}>
                      {cat.doccatname}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Subcategory *
                <select
                  name="documentsubcatrecid"
                  value={formData.documentsubcatrecid}
                  onChange={handleChange}
                  required
                  disabled={!formData.documentcatrecid || isSaving} // Disable when no category or when saving
                >
                  <option value="">Select Subcategory</option>
                  {getFilteredSubcategories().map((sc) => (
                    <option key={sc.docsubcatrecid} value={sc.docsubcatrecid}>
                      {sc.docsubcatname}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Periodicity *
                <select
                  name="documentperiodicityrecid"
                  value={formData.documentperiodicityrecid}
                  onChange={handleChange}
                  required
                  disabled={isSaving} // Disable when saving
                >
                  <option value="">Select Periodicity</option>
                  <option value="1">One-time</option>
                  <option value="2">Monthly</option>
                  <option value="3">Quarterly</option>
                  <option value="4">Yearly</option>
                </select>
              </label>

              <label>
                Document Name *
                <input
                  type="text"
                  name="documentname"
                  value={formData.documentname}
                  onChange={handleChange}
                  required
                  disabled={isSaving} // Disable when saving
                />
              </label>

              <label>
                Description *
                <textarea
                  name="documentdescription"
                  value={formData.documentdescription}
                  onChange={handleChange}
                  required
                  rows="3"
                  disabled={isSaving} // Disable when saving
                />
              </label>

              {error && <div className="modal-error-message">{error}</div>}

              <div className="doccat-form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving} // Disable when saving
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={isSaving} // Disable when saving
                >
                  {editDoc ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
