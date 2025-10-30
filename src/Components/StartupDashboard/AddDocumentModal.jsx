import { useState, useEffect } from "react";
import api from "../Datafetching/api"; // your axios instance
import styles from "./StartupDashboard.module.css";
import { IPAdress } from "../Datafetching/IPAdrees";
const AddDocumentModal = ({ userid, onClose, onUploadSuccess }) => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [documentsInfo, setDocumentsInfo] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedDocument, setSelectedDocument] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [selectedDate, setselectedDate] = useState(null);

  const token = sessionStorage.getItem("token"); // auth token

  // 1️⃣ Fetch categories when modal opens
  useEffect(() => {
    if (!userid) return;

    const fetchCategories = async () => {
      try {
        const res = await api.post(
          "/generic/getdoccat",
          { userid },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCategories(res.data.data || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, [userid, token]);

  // 2️⃣ Fetch subcategories when category changes
  useEffect(() => {
    if (!selectedCategory) return;

    const fetchSubcategories = async () => {
      try {
        const res = await api.post(
          "/generic/getdocsubcat",
          { userid, docid: selectedCategory },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSubcategories(res.data.data || []);
      } catch (err) {
        console.error("Error fetching subcategories:", err);
      }
    };

    fetchSubcategories();
    setSelectedSubCategory("");
    setDocumentsInfo([]);
    setSelectedDocument("");
  }, [selectedCategory, userid, token]);

  // 3️⃣ Fetch document info when subcategory changes
  useEffect(() => {
    if (!selectedCategory || !selectedSubCategory) return;

    const fetchDocumentsInfo = async () => {
      try {
        const res = await api.post(
          "/generic/getdocinfo",
          {
            userid,
            doccatid: selectedCategory,
            docsubcatid: selectedSubCategory,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDocumentsInfo(res.data.data || []);
      } catch (err) {
        console.error("Error fetching document info:", err);
      }
    };

    fetchDocumentsInfo();
    setSelectedDocument("");
  }, [selectedCategory, selectedSubCategory, userid, token]);

  const handleFileSelect = (e) => setSelectedFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!selectedDocument || !selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("userid", userid);
    formData.append("doccatid", selectedCategory);
    formData.append("docsubcatid", selectedSubCategory);
    formData.append("docinfoid", selectedDocument);

    try {
      await api.post("/generic/uploaddocument", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      onUploadSuccess(); // refresh documents table in parent
      onClose();
      setSelectedFile(null);
      setSelectedCategory("");
      setSelectedSubCategory("");
      setSelectedDocument("");
    } catch (err) {
      console.error("Error uploading document:", err);
    }
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        <h3 className="text-lg font-bold mb-4">Upload Document</h3>
        {/* Category Dropdown */}
        <div className={styles.accordionSection}>
          <label className="font-semibold">Select Category</label>
          <select
            className={styles.dropdown}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">-- Choose Category --</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.text}
              </option>
            ))}
          </select>
        </div>
        {/* Subcategory Dropdown */}
        {selectedCategory && (
          <div className={styles.accordionSection}>
            <label className="font-semibold">Select Sub-Category</label>
            <select
              className={styles.dropdown}
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value)}
            >
              <option value="">-- Choose Sub-Category --</option>
              {subcategories.map((sub) => (
                <option key={sub.value} value={sub.value}>
                  {sub.text}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Document Info Dropdown */}
        {selectedSubCategory && (
          <div className={styles.accordionSection}>
            <label className="font-semibold">Select Document</label>
            <select
              className={styles.dropdown}
              value={selectedDocument}
              onChange={(e) => setSelectedDocument(e.target.value)}
            >
              <option value="">-- Choose Document --</option>
              {documentsInfo.map((doc) => (
                <option key={doc.value} value={doc.value}>
                  {doc.text}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* File Upload */}
        {selectedDocument && (
          <div className={styles.accordionSection}>
            <label className="font-semibold">Upload File</label>
            <div
              className={styles.dragDropArea}
              onClick={() => document.getElementById("fileInput").click()}
            >
              <p>Drag & drop file here or click to select</p>
              <input
                type="file"
                id="fileInput"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>
        )}
        {/* Buttons */}
        <div
          className="flex justify-end gap-2 mt-2"
          style={{ marginTop: "2rem" }}
        >
          <button className={styles.buttonOutline} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.buttonPrimary}
            disabled={!selectedDocument || !selectedFile}
            onClick={handleUpload}
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDocumentModal;
