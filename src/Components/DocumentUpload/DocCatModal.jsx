import React, { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";

export default function DocCatModal({
  isOpen,
  onClose,
  onSave,
  editData,
  isLoading = false,
}) {
  const [formData, setFormData] = useState({
    doccatname: "",
    doccatdescription: "",
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        doccatname: editData.doccatname,
        doccatdescription: editData.doccatdescription,
      });
    } else {
      // Reset form when adding new category
      setFormData({
        doccatname: "",
        doccatdescription: "",
      });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      doccatrecid: editData?.doccatrecid, // include ID for updates
      doccatmodifiedby: "system", // required by backend
    });
  };

  if (!isOpen) return null;

  return (
    <div className="doccat-modal-backdrop">
      <div className="doccat-modal-content">
        <div className="doccat-modal-header">
          <h3>{editData ? "Edit Category" : "Add Category"}</h3>
          <button className="btn-close" onClick={onClose} disabled={isLoading}>
            &times;
          </button>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="modal-loading-overlay">
            <div className="modal-loading-spinner">
              <FaSpinner className="spinner" size={24} />
              <p>{editData ? "Updating category..." : "Saving category..."}</p>
            </div>
          </div>
        )}

        <form className="doccat-form" onSubmit={handleSubmit}>
          <label>
            Category Name
            <input
              type="text"
              name="doccatname"
              value={formData.doccatname}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </label>
          <label>
            Description
            <textarea
              name="doccatdescription"
              value={formData.doccatdescription}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </label>
          <div className="doccat-form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={isLoading}>
              {isLoading ? (
                <>
                  <FaSpinner className="spinner" size={14} />
                  {editData ? "Updating..." : "Saving..."}
                </>
              ) : editData ? (
                "Update"
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
