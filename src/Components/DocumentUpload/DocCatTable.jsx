import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import "./DocCatTable.css";
import { FaTrash, FaEdit, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { IPAdress } from "../Datafetching/IPAdrees";

export default function DocCatTable() {
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const incUserid = sessionStorage.getItem("incUserid");

  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [formData, setFormData] = useState({
    doccatname: "",
    doccatdescription: "",
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

  // ✅ Fetch all categories
  const IP = IPAdress;
  const fetchCategories = () => {
    setLoading(true);
    setError(null);

    // 1. Construct the URL with the query parameter
    //    Use the exact lowercase name 'incuserid' as required by the server.
    //    Use encodeURIComponent() to safely handle special characters.
    const url = `${IP}/itelinc/getDoccatAll?incuserid=${encodeURIComponent(
      incUserid
    )}`;

    fetch(url, {
      method: "GET",
      mode: "cors",
      // 2. REMOVE the 'body' property entirely. It's not allowed for GET.
    })
      .then((res) => {
        if (!res.ok) {
          // It's good practice to throw an error if the response is not successful
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setCats(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Please try again.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCategories();
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

    // Handle date/time strings
    if (key === "doccatcreatedtime" || key === "doccatmodifiedtime") {
      return value ? new Date(value.replace("?", "")) : new Date(0);
    }

    // Handle numeric values
    if (
      key === "doccatcreatedby" ||
      key === "doccatmodifiedby" ||
      key === "doccatrecid"
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
  const sortedCats = React.useMemo(() => {
    let sortableCats = [...cats];
    if (sortConfig.key !== null) {
      sortableCats.sort((a, b) => {
        const aValue = sortValue(
          a[sortConfig.key],
          sortConfig.key,
          cats.indexOf(a)
        );
        const bValue = sortValue(
          b[sortConfig.key],
          sortConfig.key,
          cats.indexOf(b)
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
    return sortableCats;
  }, [cats, sortConfig]);

  const openAddModal = () => {
    setEditCat(null);
    setFormData({ doccatname: "", doccatdescription: "" });
    setIsModalOpen(true);
    setError(null);
  };

  const openEditModal = (cat) => {
    setEditCat(cat);
    setFormData({
      doccatname: cat.doccatname || "",
      doccatdescription: cat.doccatdescription || "",
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Delete with SweetAlert and loading popup
  const handleDelete = (catId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This category will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        // Set loading state for this specific category
        setIsDeleting((prev) => ({ ...prev, [catId]: true }));

        // Show loading popup
        Swal.fire({
          title: "Deleting...",
          text: "Please wait while we delete the category",
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const deleteUrl = `${IP}/itelinc/deletedoccat?doccatrecid=${catId}&doccatmodifiedby=${userId}`;

        fetch(deleteUrl, {
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
                "Category deleted successfully!",
                "success"
              );
              fetchCategories();
            } else {
              throw new Error(data.message || "Failed to delete category");
            }
          })
          .catch((err) => {
            console.error("Error deleting category:", err);
            Swal.fire("Error", `Failed to delete: ${err.message}`, "error");
          })
          .finally(() => {
            // Remove loading state for this category
            setIsDeleting((prev) => ({ ...prev, [catId]: false }));
          });
      }
    });
  };

  // ✅ FIXED: Add/Update with proper URL encoding and loading popup
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // Validate form data
    if (!formData.doccatname.trim() || !formData.doccatdescription.trim()) {
      setError("Category name and description are required");
      setIsSaving(false);
      return;
    }

    // Close the modal before showing the loading popup
    setIsModalOpen(false);

    // Show loading popup
    const loadingTitle = editCat ? "Updating..." : "Saving...";
    const loadingText = editCat
      ? "Please wait while we update the category"
      : "Please wait while we save the category";

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

    // Build URL parameters safely
    const params = new URLSearchParams();

    if (editCat) {
      params.append("doccatrecid", editCat.doccatrecid);
    }
    params.append("doccatname", formData.doccatname.trim());
    params.append("doccatdescription", formData.doccatdescription.trim());

    // ✅ FIX: User ID is REQUIRED for both add and update operations
    if (editCat) {
      params.append("doccatmodifiedby", userId || "1"); // Fallback to "1" if null
    } else {
      params.append("doccatcreatedby", userId || "1");
      params.append("doccatmodifiedby", userId || "1");
    }

    const baseUrl = editCat
      ? `${IP}/itelinc/updateDoccat`
      : `${IP}/itelinc/addDoccat`;

    const url = `${baseUrl}?${params.toString()}`;

    console.log("API URL:", url); // Debug URL

    fetch(url, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("API Response:", data);

        if (data.statusCode === 200) {
          if (
            data.data &&
            typeof data.data === "string" &&
            data.data.includes("Duplicate entry")
          ) {
            setError("Category name already exists");
            Swal.fire(
              "Duplicate",
              "Category name already exists!",
              "warning"
            ).then(() => {
              // Reopen the modal if there's a duplicate error
              setIsModalOpen(true);
            });
          } else {
            setEditCat(null);
            setFormData({ doccatname: "", doccatdescription: "" });
            fetchCategories();
            Swal.fire(
              "Success",
              data.message || "Category saved successfully!",
              "success"
            );
          }
        } else {
          throw new Error(
            data.message || `Operation failed with status: ${data.statusCode}`
          );
        }
      })
      .catch((err) => {
        console.error("Error saving category:", err);
        setError(`Failed to save: ${err.message}`);
        Swal.fire(
          "Error",
          `Failed to save category: ${err.message}`,
          "error"
        ).then(() => {
          // Reopen the modal if there's an error
          setIsModalOpen(true);
        });
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <div className="doccat-container">
      <div className="doccat-header">
        <h2 className="doccat-title">📂 Document Categories</h2>
        <button className="btn-add-category" onClick={openAddModal}>
          + Add Category
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <p className="doccat-empty">Loading categories...</p>
      ) : (
        <div className="doccat-table-wrapper">
          <table className="doccat-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("doccatname")}
                >
                  Category Name {getSortIcon("doccatname")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("doccatdescription")}
                >
                  Description {getSortIcon("doccatdescription")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("doccatcreatedby")}
                >
                  Created By {getSortIcon("doccatcreatedby")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("doccatcreatedtime")}
                >
                  Created Time {getSortIcon("doccatcreatedtime")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("doccatmodifiedby")}
                >
                  Modified By {getSortIcon("doccatmodifiedby")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("doccatmodifiedtime")}
                >
                  Modified Time {getSortIcon("doccatmodifiedtime")}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCats.length > 0 ? (
                sortedCats.map((cat, idx) => (
                  <tr key={cat.doccatrecid || idx}>
                    <td>{idx + 1}</td>
                    <td>{cat.doccatname}</td>
                    <td>{cat.doccatdescription}</td>
                    <td>
                      {isNaN(cat.doccatcreatedby)
                        ? cat.doccatcreatedby
                        : "Admin"}
                    </td>
                    <td>{cat.doccatcreatedtime.replace("?", "")}</td>
                    <td>
                      {isNaN(cat.doccatmodifiedby)
                        ? cat.doccatmodifiedby
                        : "Admin"}
                    </td>
                    <td>{cat.doccatmodifiedtime.replace("?", "")}</td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => openEditModal(cat)}
                        disabled={isSaving} // Disable when saving
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(cat.doccatrecid)}
                        disabled={isDeleting[cat.doccatrecid] || isSaving} // Disable when deleting or saving
                      >
                        <FaTrash size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="doccat-empty">
                    No categories found
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
              <h3>{editCat ? "Edit Category" : "Add Category"}</h3>
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
                Category Name *
                <input
                  type="text"
                  name="doccatname"
                  value={formData.doccatname}
                  onChange={handleChange}
                  required
                  placeholder="Enter category name"
                  disabled={isSaving} // Disable when saving
                />
              </label>
              <label>
                Description *
                <textarea
                  name="doccatdescription"
                  value={formData.doccatdescription}
                  onChange={handleChange}
                  required
                  placeholder="Enter category description"
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
                  {editCat ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
