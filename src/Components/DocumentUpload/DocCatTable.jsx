import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useContext,
} from "react";
import Swal from "sweetalert2";
import { IPAdress } from "../Datafetching/IPAdrees";
import { Download } from "lucide-react";
import { FaTimes } from "react-icons/fa";
import { DataContext } from "../Datafetching/DataProvider";

// Material UI imports
import {
  Button,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Backdrop,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

// Import your reusable component
import ReusableDataGrid from "../Datafetching/ReusableDataGrid"; // Adjust path as needed

// Styled components
const StyledBackdrop = styled(Backdrop)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  color: "#fff",
}));

const ActionButton = styled(IconButton)(({ theme, color }) => ({
  margin: theme.spacing(0.5),
  backgroundColor:
    color === "edit" ? theme.palette.primary.main : theme.palette.error.main,
  color: "white",
  "&:hover": {
    backgroundColor:
      color === "edit" ? theme.palette.primary.dark : theme.palette.error.dark,
  },
}));

// Common date formatting function
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    // Handle timestamp format from API
    if (Array.isArray(dateStr)) {
      dateStr = dateStr.map((num) => num.toString().padStart(2, "0")).join("");
    } else {
      dateStr = String(dateStr).replace(/,/g, "");
    }
    if (dateStr.length < 14) dateStr = dateStr.padEnd(14, "0");
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(8, 10);
    const minute = dateStr.substring(10, 12);
    const second = dateStr.substring(12, 14);
    const formattedDate = new Date(
      `${year}-${month}-${day}T${hour}:${minute}:${second}`
    );
    return formattedDate.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateStr;
  }
};

export default function DocCatTable() {
  const { menuItemsFromAPI } = useContext(DataContext);

  // Find the current path in menu items to check write access
  const currentPath = "/Incubation/Dashboard/AddDocuments"; // Make sure this path matches your API
  const menuItem = menuItemsFromAPI.find(
    (item) => item.guiappspath === currentPath
  );

  console.log(menuItemsFromAPI);
  // The user has write access if the item exists and appswriteaccess is 1
  const hasWriteAccess = menuItem ? menuItem.appswriteaccess === 1 : false;
  console.log("User Write Access:", hasWriteAccess);

  // --- 1. STATE DECLARATIONS ---
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const incUserid = sessionStorage.getItem("incuserid");
  const IP = IPAdress;

  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [formData, setFormData] = useState({
    doccatname: "",
    doccatdescription: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // --- 2. HANDLER FUNCTIONS (Must be defined before useMemo) ---
  const fetchCategories = useCallback(() => {
    setLoading(true);
    setError(null);
    const url = `${IP}/itelinc/getDoccatAll?incuserid=${encodeURIComponent(
      incUserid
    )}`;
    fetch(url, {
      method: "GET",
      mode: "cors",
      headers: {
        userid: userId || "1",
        "X-Module": "Document Management",
        "X-Action": "Fetch  Document Categories",
      },
    })
      .then((res) =>
        res.ok
          ? res.json()
          : Promise.reject(`HTTP error! status: ${res.status}`)
      )
      .then((data) => {
        setCats(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Please try again.");
        setLoading(false);
      });
  }, [IP, incUserid, userId]);

  const openAddModal = useCallback(() => {
    setEditCat(null);
    setFormData({ doccatname: "", doccatdescription: "" });
    setIsModalOpen(true);
    setError(null);
  }, []);

  const openEditModal = useCallback((cat) => {
    setEditCat(cat);
    setFormData({
      doccatname: cat.doccatname || "",
      doccatdescription: cat.doccatdescription || "",
    });
    setIsModalOpen(true);
    setError(null);
  }, []);

  const handleChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []); // Use functional update to avoid dependency on formData

  const handleDelete = useCallback(
    (catId) => {
      Swal.fire({
        title: "Are you sure?",
        text: "This category will be deleted permanently.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          setIsDeleting((prev) => ({ ...prev, [catId]: true }));
          Swal.fire({
            title: "Deleting...",
            text: "Please wait while we delete the category",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
          });
          const deleteUrl = `${IP}/itelinc/deletedoccat?doccatrecid=${catId}&doccatmodifiedby=${userId}`;
          fetch(deleteUrl, {
            method: "POST",
            mode: "cors",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/x-www-form-urlencoded",
              userid: userId || "1",
              "X-Module": "Document Management",
              "X-Action": "Delete Document Category",
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
              setIsDeleting((prev) => ({ ...prev, [catId]: false }));
            });
        }
      });
    },
    [IP, userId, token, fetchCategories]
  );

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setIsSaving(true);
      setError(null);
      if (!formData.doccatname.trim() || !formData.doccatdescription.trim()) {
        setError("Category name and description are required");
        setIsSaving(false);
        return;
      }
      setIsModalOpen(false);
      const loadingTitle = editCat ? "Updating..." : "Saving...";
      // Swal.fire({
      //   title: loadingTitle,
      //   text: "Please wait...",
      //   allowOutsideClick: false,
      //   showConfirmButton: false,
      //   didOpen: () => Swal.showLoading(),
      // });
      const params = new URLSearchParams();
      if (editCat) {
        params.append("doccatrecid", editCat.doccatrecid);
      }
      params.append("doccatname", formData.doccatname.trim());
      params.append("doccatdescription", formData.doccatdescription.trim());
      if (editCat) {
        params.append("doccatmodifiedby", userId || "1");
      } else {
        params.append("doccatcreatedby", userId || "1");
        params.append("doccatmodifiedby", userId || "1");
      }
      const baseUrl = editCat
        ? `${IP}/itelinc/updateDoccat`
        : `${IP}/itelinc/addDoccat`;
      const url = `${baseUrl}?${params.toString()}`;
      const action = editCat
        ? "Edit Document Category"
        : "Add Document Category";
      fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
          userid: userId || "1",
          "X-Module": "Document Management",
          "X-Action": action,
        },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then((data) => {
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
              ).then(() => setIsModalOpen(true));
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
          ).then(() => setIsModalOpen(true));
        })
        .finally(() => setIsSaving(false));
    },
    [formData, editCat, IP, userId, token, fetchCategories]
  );

  // --- 3. MEMOIZED VALUES (Must be defined after handler functions) ---
  const columns = useMemo(
    () => [
      {
        field: "doccatname",
        headerName: "Category Name",
        width: 200,
        sortable: true,
      },
      {
        field: "doccatdescription",
        headerName: "Description",
        width: 300,
        sortable: true,
      },
      {
        field: "doccatcreatedby",
        headerName: "Created By",
        width: 150,
        sortable: true,
        renderCell: (params) =>
          params?.row
            ? isNaN(params.row.doccatcreatedby)
              ? params.row.doccatcreatedby
              : "Admin"
            : "Admin",
      },
      {
        field: "doccatcreatedtime",
        headerName: "Created Time",
        width: 180,
        sortable: true,
        type: "date",
      },
      {
        field: "doccatmodifiedby",
        headerName: "Modified By",
        width: 150,
        sortable: true,
        renderCell: (params) =>
          params?.row
            ? isNaN(params.row.doccatmodifiedby)
              ? params.row.doccatmodifiedby
              : "Admin"
            : "Admin",
      },
      {
        field: "doccatmodifiedtime",
        headerName: "Modified Time",
        width: 180,
        sortable: true,
        type: "date",
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 150,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          if (!params?.row) return null;
          return (
            <Box>
              <ActionButton
                color="edit"
                onClick={() => openEditModal(params.row)}
                disabled={isSaving || isDeleting[params.row.doccatrecid]}
                title="Edit"
              >
                <EditIcon fontSize="small" />
              </ActionButton>
              <ActionButton
                color="delete"
                onClick={() => handleDelete(params.row.doccatrecid)}
                disabled={isSaving || isDeleting[params.row.doccatrecid]}
                title="Delete"
              >
                {isDeleting[params.row.doccatrecid] ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <DeleteIcon fontSize="small" />
                )}
              </ActionButton>
            </Box>
          );
        },
      },
    ],
    [isSaving, isDeleting, openEditModal, handleDelete]
  ); // Dependencies are now available

  const exportConfig = useMemo(
    () => ({
      filename: "document_categories",
      sheetName: "Document Categories",
    }),
    []
  );
  const onExportData = useMemo(
    () => (data) =>
      data.map((cat, index) => ({
        "S.No": index + 1,
        "Category Name": cat.doccatname || "",
        Description: cat.doccatdescription || "",
        "Created By": isNaN(cat.doccatcreatedby)
          ? cat.doccatcreatedby
          : "Admin",
        "Created Time": formatDate(cat.doccatcreatedtime),
        "Modified By": isNaN(cat.doccatmodifiedby)
          ? cat.doccatmodifiedby
          : "Admin",
        "Modified Time": formatDate(cat.doccatmodifiedtime),
      })),
    []
  );

  // --- 4. EFFECTS ---
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // --- 5. RENDER (JSX) ---
  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4">📂 Document Categories</Typography>
        <Button variant="contained" onClick={openAddModal} disabled={isSaving}>
          + Add Category
        </Button>
      </Box>
      {error && (
        <Box
          sx={{
            p: 2,
            mb: 2,
            bgcolor: "error.light",
            color: "error.contrastText",
            borderRadius: 1,
          }}
        >
          {error}
        </Box>
      )}
      <ReusableDataGrid
        data={cats}
        columns={columns}
        title="Document Categories"
        enableExport={true}
        enableColumnFilters={true}
        searchPlaceholder="Search categories..."
        searchFields={["doccatname", "doccatdescription"]}
        uniqueIdField="doccatrecid"
        onExportData={onExportData}
        exportConfig={exportConfig}
        loading={loading}
      />
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editCat ? "Edit Category" : "Add Category"}
          <IconButton
            aria-label="close"
            onClick={() => setIsModalOpen(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
            disabled={isSaving}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="doccatname"
              label="Category Name"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.doccatname}
              onChange={handleChange}
              required
              disabled={isSaving}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="doccatdescription"
              label="Description"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={formData.doccatdescription}
              onChange={handleChange}
              required
              disabled={isSaving}
            />
            {error && <Box sx={{ color: "error.main", mt: 1 }}>{error}</Box>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={20} /> : null}
            >
              {editCat ? "Update" : "Save"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <StyledBackdrop open={isSaving}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <CircularProgress color="inherit" />
          <Typography sx={{ mt: 2 }}>
            {editCat ? "Updating category..." : "Saving category..."}
          </Typography>
        </Box>
      </StyledBackdrop>
    </Box>
  );
}
