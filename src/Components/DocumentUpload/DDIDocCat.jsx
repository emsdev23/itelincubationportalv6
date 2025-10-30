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
    ddidoccatname: "",
    ddidoccatdescription: "",
    ddidoccatadminstate: 1,
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

  // ✅ Fetch all categories with new API
  const IP = IPAdress;
  const fetchCategories = () => {
    setLoading(true);
    setError(null);

    fetch(`${IP}/itelinc/resources/generic/getddidoccatlist`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: parseInt(userId) || 1,
        incUserId: incUserid,
      }),
    })
      .then((res) => res.json())
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

  // Apply sorting to the data
  const sortedCats = React.useMemo(() => {
    let sortableCats = [...cats];
    if (sortConfig.key !== null) {
      sortableCats.sort((a, b) => {
        // Handle different data types
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // For S.No column, use the index
        if (sortConfig.key === "sno") {
          aValue = cats.indexOf(a);
          bValue = cats.indexOf(b);
        }

        // Handle string comparison
        if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        // Handle date/time strings
        if (
          sortConfig.key === "ddidoccatcreatedtime" ||
          sortConfig.key === "ddidoccatmodifiedtime"
        ) {
          aValue = aValue ? new Date(aValue.replace("?", "")) : new Date(0);
          bValue = bValue ? new Date(bValue.replace("?", "")) : new Date(0);
        }

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
    setFormData({
      ddidoccatname: "",
      ddidoccatdescription: "",
      ddidoccatadminstate: 1,
    });
    setIsModalOpen(true);
    setError(null);
  };

  const openEditModal = (cat) => {
    setEditCat(cat);
    setFormData({
      ddidoccatname: cat.ddidoccatname || "",
      ddidoccatdescription: cat.ddidoccatdescription || "",
      ddidoccatadminstate: cat.ddidoccatadminstate || 1,
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Delete with SweetAlert and loading popup using new API
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

        const deleteUrl = `${IP}/itelinc/ddidoccatdelete?ddidoccatrecid=${catId}&ddidoccatmodifiedby=${
          userId || 1
        }`;

        fetch(deleteUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${token}`,
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

  // ✅ FIXED: Add/Update with new API endpoints
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // Validate form data
    if (
      !formData.ddidoccatname.trim() ||
      !formData.ddidoccatdescription.trim()
    ) {
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

    // Build URL parameters for the new API
    let url;
    if (editCat) {
      url = `${IP}/itelinc/ddidoccatedit?ddidoccatrecid=${
        editCat.ddidoccatrecid
      }&ddidoccatname=${encodeURIComponent(
        formData.ddidoccatname.trim()
      )}&ddidoccatdescription=${encodeURIComponent(
        formData.ddidoccatdescription.trim()
      )}&ddidoccatmodifiedby=${userId || 1}&ddidoccatadminstate=${
        formData.ddidoccatadminstate
      }`;
    } else {
      url = `${IP}/itelinc/ddidoccatadd?ddidoccatname=${encodeURIComponent(
        formData.ddidoccatname.trim()
      )}&ddidoccatdescription=${encodeURIComponent(
        formData.ddidoccatdescription.trim()
      )}&ddidoccatcreatedby=${userId || 1}&ddidoccatmodifiedby=${
        userId || 1
      }&ddidoccatadminstate=${formData.ddidoccatadminstate}`;
    }

    console.log("API URL:", url); // Debug URL

    fetch(url, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
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
            setFormData({
              ddidoccatname: "",
              ddidoccatdescription: "",
              ddidoccatadminstate: 1,
            });
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
        <h2 className="doccat-title">📂 Due Deligence Document Categories</h2>
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
                <th
                  className="sortable-header"
                  onClick={() => requestSort("sno")}
                >
                  S.No {getSortIcon("sno")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("ddidoccatname")}
                >
                  Category Name {getSortIcon("ddidoccatname")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("ddidoccatdescription")}
                >
                  Description {getSortIcon("ddidoccatdescription")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("ddidoccatcreatedby")}
                >
                  Created By {getSortIcon("ddidoccatcreatedby")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("ddidoccatcreatedtime")}
                >
                  Created Time {getSortIcon("ddidoccatcreatedtime")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("ddidoccatmodifiedby")}
                >
                  Modified By {getSortIcon("ddidoccatmodifiedby")}
                </th>
                <th
                  className="sortable-header"
                  onClick={() => requestSort("ddidoccatmodifiedtime")}
                >
                  Modified Time {getSortIcon("ddidoccatmodifiedtime")}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCats.length > 0 ? (
                sortedCats.map((cat, idx) => (
                  <tr key={cat.ddidoccatrecid || idx}>
                    <td>{idx + 1}</td>
                    <td>{cat.ddidoccatname}</td>
                    <td>{cat.ddidoccatdescription}</td>
                    <td>
                      {isNaN(cat.ddidoccatcreatedby)
                        ? cat.ddidoccatcreatedby
                        : "Admin"}
                    </td>
                    <td>
                      {cat.ddidoccatcreatedtime
                        ? cat.ddidoccatcreatedtime.replace("?", "")
                        : ""}
                    </td>
                    <td>
                      {isNaN(cat.ddidoccatmodifiedby)
                        ? cat.ddidoccatmodifiedby
                        : "Admin"}
                    </td>
                    <td>
                      {cat.ddidoccatmodifiedtime
                        ? cat.ddidoccatmodifiedtime.replace("?", "")
                        : ""}
                    </td>
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
                        onClick={() => handleDelete(cat.ddidoccatrecid)}
                        disabled={isDeleting[cat.ddidoccatrecid] || isSaving} // Disable when deleting or saving
                      >
                        <FaTrash size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="doccat-empty">
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
                  name="ddidoccatname"
                  value={formData.ddidoccatname}
                  onChange={handleChange}
                  required
                  placeholder="Enter category name"
                  disabled={isSaving} // Disable when saving
                />
              </label>
              <label>
                Description *
                <textarea
                  name="ddidoccatdescription"
                  value={formData.ddidoccatdescription}
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
