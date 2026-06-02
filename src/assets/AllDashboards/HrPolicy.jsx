import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const API_BASE = "https://ems-tms-server-new.vercel.app";
const STORAGE_KEY = "hr_policy";
const ACK_KEY = "policy_ack_employee";

function HrPolicy() {
  const { role, username, id } = useParams();
  const [readEmployees, setReadEmployees] = useState([]);

  const canEdit = role === "admin" || role === "hr";
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    title: "",
    description: "",
  });

  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); 
  const [policies, setPolicies] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [editFile, setEditFile] = useState(null);//added by shivani
  const [showModal, setShowModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [ackMap, setAckMap] = useState({});
  const [employees, setEmployees] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusPolicy, setStatusPolicy] = useState(null);
  const [activeTab, setActiveTab] = useState("read");
  const [searchQuery, setSearchQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewPolicy, setViewPolicy] = useState(null);
  const modalRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAnyModalOpen =
    showViewModal ||
    showModal ||
    showAddModal ||
    showStatusModal ||
    statusPolicy||
    showFileModal; 

  useEffect(() => {
    if (!isAnyModalOpen || !modalRef.current) return;
    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (!focusableElements.length) return;

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    modal.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setShowViewModal(false);
        setShowModal(false);
        setShowAddModal(false);
        setShowStatusModal(false);
        setStatusPolicy(false);
      }
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    modal.addEventListener("keydown", handleKeyDown);

    return () => {
      modal.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAnyModalOpen]);

  // rutuja
  useEffect(() => {
    const isModalOpen =
      !!showViewModal ||
      showModal ||
      showAddModal ||
      showStatusModal||
      showFileModal;

    if (isModalOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [
    showViewModal,
    showModal,
    showAddModal,
    showStatusModal,
    showFileModal,
  ]);

  const handleViewClick = (policy) => {
    console.log("Selected Policy:", policy);
    setSelectedPolicy(policy);
    fetchReadEmployees(policy._id); //Added by harshada 25 Feb 2026
  };

  const handleRowClick = (policy) => {
    setViewPolicy(policy);
    setShowViewModal(true);
  };

  useEffect(() => {
    const syncAck = () => {
      const stored = JSON.parse(localStorage.getItem(ACK_KEY)) || {};
      setAckMap(stored);
    };

    window.addEventListener("storage", syncAck);

    return () => window.removeEventListener("storage", syncAck);
  }, []);

  const [policyForm, setPolicyForm] = useState({
    title: "",
    description: "",
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    if (statusPolicy) {
      axios
        .get(
          `https://ems-tms-server-new.vercel.app/policy/read-employees/${statusPolicy._id}`
        )
        .then((res) => {
          setReadEmployees(res.data.data);
        })
        .catch((err) => console.log(err));
    }
  }, [statusPolicy]);

  //Added by harshada
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const res = await axios.get(
          "https://ems-tms-server-new.vercel.app/getAllEmployees",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const activeEmployees = (res.data || []).filter(
          (e) => e.isDeleted !== true
        );

        setEmployees(activeEmployees);

      } catch (err) {
        console.error("Failed to fetch employees", err);
      }
    };

    fetchEmployees();
  }, []);

  const fetchReadEmployees = async (policyId) => {
    try {
      const res = await axios.get(
        `https://ems-tms-server-new.vercel.app/policy/read-employees/${policyId}`
      );

      if (res.data.success) {
        setReadEmployees(res.data.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddPolicy = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    if (!newPolicy.title ) {
      alert("Title is required");
      return;
    }
    if(!newPolicy.description){
      alert("Description is required");
    }
  
    if (newPolicy.pdf && !newPolicy.pdf.type.includes("pdf") && !newPolicy.pdf.name.endsWith(".pdf")) {
      alert("Only PDF files are allowed");
      return;
    }
    if (newPolicy.pdf && newPolicy.pdf.size > 5 * 1024 * 1024) {
      alert("File size should not exceed 5MB");
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append("title", newPolicy.title);
      formData.append("description", newPolicy.description);
  
      if (newPolicy.pdf) {
        formData.append("pdf", newPolicy.pdf);
      }
  
      const res = await axios.post(
        `${API_BASE}/policy/create`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      if (res.data.success) {
        alert(res.data.message);
        setShowAddModal(false);
        setNewPolicy({ title: "", description: "", pdf: null });
        fetchPolicies();
      }
    } catch (error) {
      console.error("Failed to add policy", error);
      alert("Failed to create policy");
    } finally {
    setIsSubmitting(false);
  }
  };
  
  const fetchPolicies = async () => {
    try {
      const res = await axios.get(`${API_BASE}/policy/get`);
      if (res.data.success) {
        setPolicies(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch policies", error);
    }
  };

  const handleSearch = () => {
    setSearchQuery(searchText);
  };
  const handleReset = () => {
    setSearchText("");
    setSearchQuery("");
  };

  const filteredPolicies = policies.filter((p) =>
    `${p.title || ""} ${p.description || ""}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  const totalItems = filteredPolicies.length;

  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);

  const currentPolicies = filteredPolicies.slice(startIndex, endIndex);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, rowsPerPage]);
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleEditClick = (policy) => {
    setSelectedPolicy(policy);

    setPolicyForm({
      title: policy.title || "",
      description: policy.description || "",
      version: policy.version || "1.0",
      createdAt: policy.createdAt || today,
    });
    setEditFile(null);// added by shivani
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedPolicy) return;
  
    if (editFile && !editFile.type.includes("pdf") && !editFile.name.endsWith(".pdf")) {
      alert("Only PDF files are allowed");
      return;
    }
    if (editFile && editFile.size > 5 * 1024 * 1024) {
      alert("File size should not exceed 5MB");
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append("title", policyForm.title);
      formData.append("description", policyForm.description);
  
      if (editFile) {
        formData.append("pdf", editFile);
      }
      const res = await axios.put(
        `${API_BASE}/policy/update/${selectedPolicy._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      if (res.data.success) {
        alert(res.data.message);
        fetchPolicies();
        setShowModal(false);
        setIsEditMode(false);
        setSelectedPolicy(null);
        setEditFile(null);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update policy");
    }
  };


  const deletePolicy = async (pid) => {
    if (!window.confirm("Delete this policy?")) return;

    try {
      const res = await axios.delete(`${API_BASE}/policy/delete/${pid}`);

      if (res.data.success) {
        alert(res.data.message); // ✅ SHOW MESSAGE
        fetchPolicies();
      }
    } catch (error) {
      alert("Failed to delete policy");
    }
  };

  const isNewPolicy = (createdAt) => {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    if (isNaN(created)) return false;

    const now = new Date();
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };
  const isUpdatedPolicy = (policy) => {
    if (!policy.createdAt || !policy.updatedAt) return false;
    return policy.updatedAt !== policy.createdAt;
  };

  <button className="btn btn-sm custom-outline-btn" onClick={handleAddPolicy}>
    Save Policy
  </button>;
  useEffect(() => {
    const loadAck = () => {
      const stored = JSON.parse(localStorage.getItem(ACK_KEY)) || {};
      setAckMap(stored);
    };

    loadAck();
    window.addEventListener("storage", loadAck);

    return () => window.removeEventListener("storage", loadAck);
  }, []);
  //26-02-2026
  const readList = readEmployees.map(e => ({
    employeeName: e.employeeName,
    acknowledgedAt: e.acknowledgedAt
  }));

  const pendingList = employees.filter(emp =>
    !readEmployees.some(read => read.employeeId === emp._id)
  );

const getFileType = (url) => {
  if (!url) return "unknown";
  
  const urlLower = url.toLowerCase();
  
  // Check by extension
  if (urlLower.endsWith('.pdf')) return "pdf";
  if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg') || urlLower.endsWith('.png') || urlLower.endsWith('.gif') || urlLower.endsWith('.webp')) return "image";
  if (urlLower.endsWith('.mp4') || urlLower.endsWith('.webm') || urlLower.endsWith('.ogg') || urlLower.endsWith('.mov')) return "video";
  
  // Check by URL pattern (if backend stores type)
  if (urlLower.includes('/image/') || urlLower.includes('image')) return "image";
  if (urlLower.includes('/video/') || urlLower.includes('video')) return "video";
  if (urlLower.includes('/pdf/') || urlLower.includes('pdf')) return "pdf";
  
  return "unknown";
};

  return (
    <div className="container-fluid ">
      <div className="d-flex justify-content-between mb-3">
        <h2 style={{ color: "#3A5FBE", fontSize: "25px", marginLeft: "15px" }}>
          HR Policies
        </h2>

        {canEdit && (
          <button
            className="btn btn-sm custom-outline-btn"
            onClick={() => setShowAddModal(true)}
            style={{ minWidth: 90, height: 30 }}
          >
            Add New Policy
          </button>
        )}
      </div>

      {/* 
//Added by mahesh */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            {/* Search Input */}
            <div
              className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0 w-md-100"
              style={{ maxWidth: "400px" }}
            >
              <label
                className="fw-bold mb-0"
                style={{ fontSize: "16px", color: "#3A5FBE" }}
              >
                Search
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Search By Any Field..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            {/* Filter and Reset Buttons */}
            <div className="d-flex gap-2 ms-auto">
              <button
                type="button"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
                onClick={handleSearch}
              >
                Filter
              </button>
              <button
                type="button"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

<div className="card shadow-sm border-0">
        <div className="table-responsive bg-white">
         <table
       
              className="table table-hover mb-0"
              style={{ borderCollapse: "collapse" }}
            >
              <thead style={{ backgroundColor: "#f8f9fa" }}>
              <tr >
                <th
                    style={{
                      fontWeight: "500",
                      fontSize: "14px",
                      color: "#6c757d",
                      borderBottom: "2px solid #dee2e6",
                      padding: "10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Policy Title
                  </th>
                <th
                    style={{
                      fontWeight: "500",
                      fontSize: "14px",
                      color: "#6c757d",
                      borderBottom: "2px solid #dee2e6",
                      padding: "10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Description
                  </th>
                  <th
                    style={{
                      fontWeight: "500",
                      fontSize: "14px",
                      color: "#6c757d",
                      borderBottom: "2px solid #dee2e6",
                      padding: "10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Uploaded File
                  </th>
                 <th
                    style={{
                      fontWeight: "500",
                      fontSize: "14px",
                      color: "#6c757d",
                      borderBottom: "2px solid #dee2e6",
                      padding: "10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      fontWeight: "500",
                      fontSize: "14px",
                      color: "#6c757d",
                      borderBottom: "2px solid #dee2e6",
                      padding: "10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Action
                  </th>
              </tr>
            </thead>

            <tbody>
              {currentPolicies.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4" style={{ color: "#6c757d", fontWeight: "300" }}>
                    No record found
                  </td>
                </tr>
              ) : (
                currentPolicies.map((policy) => (
                  <tr
                    key={policy._id}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "transparent",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#e9ecef";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    onClick={() => handleRowClick(policy)}
                  >
                    {/* ✅ TITLE + BADGES */}
                    <td style={{ padding: "10px", verticalAlign: "middle", fontSize: "14px", borderBottom: "1px solid #dee2e6", whiteSpace: "nowrap" }}>
                      {policy.title}

                      {/* 🆕 NEW */}
                      {isNewPolicy(policy.createdAt) && (
                        <span
                          style={{
                            marginLeft: "8px",
                            fontSize: "11px",
                            background: "#dcfce7",
                            color: "#166534",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            fontWeight: 600,
                          }}
                        >
                          NEW
                        </span>
                      )}

                      {/* ✏️ UPDATED */}
                      {isUpdatedPolicy(policy) && (
                        <span
                          style={{
                            marginLeft: "6px",
                            fontSize: "11px",
                            background: "#e0f2fe",
                            color: "#075985",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            fontWeight: 600,
                          }}
                        >
                          UPDATED
                        </span>
                      )}
                    </td>

                    <td style={{ padding: "10px", verticalAlign: "middle", fontSize: "14px", borderBottom: "1px solid #dee2e6", whiteSpace: "nowrap" ,maxWidth: "250px", overflow: "hidden"}} title={policy.description}>
                      {policy.description}
                    </td>


                    <td style={{ padding: "10px", verticalAlign: "middle", fontSize: "14px", borderBottom: "1px solid #dee2e6", whiteSpace: "nowrap" }}>
                    {policy.image ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const fileType = getFileType(policy.image);
                          setSelectedFile({
                            url: policy.image,
                            title: policy.title,
                            type: fileType
                          });
                          setShowFileModal(true);
                        }}
                        style={{
                          color: "#3A5FBE",
                          fontWeight: 500,
                          textDecoration: "none",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.textDecoration = "underline";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.textDecoration = "none";
                        }}
                      >
                        📄 View File
                      </button>
                    ) : (
                      <span style={{ color: "#9ca3af" }}>-</span>
                    )}
                  </td>

                    <td style={{ padding: "10px", verticalAlign: "middle", fontSize: "14px", borderBottom: "1px solid #dee2e6", whiteSpace: "nowrap" }}>
                      <button
                        className="btn btn-sm custom-outline-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStatusPolicy(policy);
                          setShowStatusModal(true);
                        }}
                      >
                        View Status
                      </button>
                    </td>

                    <td style={{ padding: "10px", verticalAlign: "middle", fontSize: "14px", borderBottom: "1px solid #dee2e6", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {canEdit ? (
                          <>
                            <button
                              className="btn btn-sm custom-outline-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(policy);
                              }}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              tabIndex="0"
                              className="btn btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePolicy(policy._id);
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = "#dc3545";
                                e.target.style.color = "#ffffff";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "transparent";
                                e.target.style.color = "#dc3545";
                              }}
                              onFocus={(e) => {
                                e.target.style.boxShadow = "0 0 0 2px rgba(58,95,190,0.4)";
                              }}
                              onBlur={(e) => {
                                e.target.style.boxShadow = "none";
                              }}
                              style={{
                                border: "1px solid #dc3545",
                                color: "#dc3545",
                                background: "transparent",
                                outline: "none"
                              }}
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn btn-sm custom-outline-btn"
                            onClick={() => handleViewClick(policy)}
                          >
                            View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showViewModal && viewPolicy && (
        <div
          className="modal fade show"
          ref={modalRef}
          tabIndex="-1"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1050,
            overflowX: "auto",
          }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "500px" }}          >
            <div className="modal-content">
              {/* HEADER */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">View Policy</h5>
                <button
                  className="btn-close btn-close-white p-1"
                  onClick={() => setShowViewModal(false)}
                />
              </div>

              {/* BODY */}
              <div className="modal-body">
                <div className="mb-2 row" style={{wordBreak:"break-word",
              overflowWrap:"break-word"}}>
                  <label className="col-4 form-label fw-semibold mb-0">
                    Policy Title
                  </label>
                  <div className="col-8">
                    <p className="mb-0">{viewPolicy.title}</p>
                  </div>
                </div>

                <div className="mb-2 row">
                  <label className="col-4 form-label fw-semibold mb-0">
                    Description
                  </label>
                  <div className="col-8">
                    <p
                      className="mb-0"
                      style={{
                        maxHeight: "120px",
                        overflowY: "auto",
                        overflowX: "hidden",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        lineHeight: "1.5",
                        paddingRight: "6px",
                      }}
                    >
                      {viewPolicy.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="d-flex justify-content-end gap-2 p-3">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: "90px" }}
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && selectedPolicy && (
        <div
          className="modal fade show"
          ref={modalRef}
          tabIndex="-1"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
          }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "500px" }}
          >
            <div className="modal-content">
              {/* HEADER */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Edit Policy</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                />
              </div>

              {/* BODY */}
              <div className="modal-body">
                <label className="fw-semibold mb-1">Policy Title</label>
                <input
                  className="form-control mb-3"
                  maxLength={50}
                  value={policyForm.title}
                  onChange={(e) =>
                    setPolicyForm({ ...policyForm, title: e.target.value })
                  }
                />

              <textarea
                rows="3"
                className="form-control"
                maxLength={500}
                value={policyForm.description}
                onChange={(e) =>
                  setPolicyForm({
                    ...policyForm,
                    description: e.target.value,
                  })
                }
              />
                  <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    fontSize: "12px",
                    color: "#6c757d",
                    marginTop: "4px",
                  }}
                >
                  {policyForm.description.length}/500
                </div>

                {/* added by shivani */}
                <label className="fw-semibold mb-1 mt-2">Upload Policy PDF</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="form-control"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file && !file.type.includes("pdf") && !file.name.endsWith(".pdf")) {
                      alert("Only PDF files are allowed. Please select a PDF file.");
                      e.target.value = "";
                      return;
                    }
                    if (file && file.size > 5 * 1024 * 1024) {
                      alert("File size should not exceed 5MB");
                      e.target.value = "";
                      return;
                    }
                    setEditFile(file);
                  }}
                />

                {/*  */}
              </div>

              {/* FOOTER */}
              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={handleSave}
                >
                  Save
                </button>

                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div
          className="modal fade show"
          ref={modalRef}
          tabIndex="-1"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
            // marginTop: "40px",
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "500px" }}>
            <div className="modal-content">
              {/* HEADER */}
              <div
                className="modal-header"
                style={{ background: "#3A5FBE", color: "#fff" }}
              >
                <h5 className="modal-title">Add New Policy</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAddModal(false)}
                />
              </div>

              {/* BODY */}
              <div
                className="modal-body"
                style={{
                  maxHeight: "70vh",
                  overflowY: "auto",
                }}
              >
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Policy Title<span style={{ color: "red" }}>  *</span></label>
                    <input
                      className="form-control"
                      placeholder="Enter policy title"
                      maxLength={50}
                      value={newPolicy.title}
                      onChange={(e) =>
                        setNewPolicy({ ...newPolicy, title: e.target.value })
                      }
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        fontSize: "12px",
                        color: "#6c757d",
                        marginTop: "4px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {newPolicy.title.length}/50
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Policy Description<span style={{ color: "red" }}>  *</span></label>

                    <textarea
                      rows="3"
                      className="form-control"
                      placeholder="Enter policy description"
                      maxLength={500}
                      value={newPolicy.description}
                      onChange={(e) =>
                        setNewPolicy({
                          ...newPolicy,
                          description: e.target.value,
                        })
                      }
                    />

                    {/* Character count */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        fontSize: "12px",
                        color: "#6c757d",
                        marginTop: "4px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {newPolicy.description.length}/500
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Upload Policy PDF</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="form-control"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file && !file.type.includes("pdf") && !file.name.endsWith(".pdf")) {
                          alert("Only PDF files are allowed");
                          e.target.value = "";
                          return;
                        }
                        if (file && file.size > 5 * 1024 * 1024) {
                          alert("File size should not exceed 5MB");
                          e.target.value = "";
                          return;
                        }
                        setNewPolicy({ ...newPolicy, pdf: file });
                      }}
                    />
                    <small className="text-muted d-block mt-1" style={{fontSize:"13px"}}>
                      Allowed formats: PDF | Max size: 5 MB
                    </small>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-sm custom-outline-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>

            <button
  className="btn btn-sm custom-outline-btn"
  onClick={handleAddPolicy}
  disabled={isSubmitting}
>
  {isSubmitting ? "Saving..." : "Save Policy"}
</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {totalItems > 0 && (
        <div
          ref={modalRef}
          tabIndex="-1"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "14px",
            padding: "12px 16px",
            fontSize: "14px",
            color: "#475569",
            borderTop: "1px solid #e5e7eb",
            marginTop: "18px",
          }}
        >
          {/* Rows per page */}
          <span>Rows per page:</span>

          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>

          <span>
            {startIndex + 1}-{endIndex} of {totalItems}
          </span>

          <div
                className="d-flex align-items-center"
                style={{ marginLeft: "16px" }}
              >
              <button
              className="btn btn-sm focus-ring"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              style={{ fontSize: "18px", padding: "2px 8px" }}
              >
                ‹
              </button>

              {/* Next */}
              <button
                disabled={currentPage === totalPages}
                className="btn btn-sm focus-ring"
                onClick={() => setCurrentPage((p) => p + 1)}
              style={{ fontSize: "18px", padding: "2px 8px" }}
              >
                ›
              </button>
           </div>
        </div>
      )}

      <div className="text-end mt-3">
        <button
          style={{ minWidth: 90 }}
          className="btn btn-sm custom-outline-btn"
          onClick={() => window.history.go(-1)}
        >
          Back
        </button>
      </div>
      {showStatusModal && statusPolicy && (
  <div
    className="modal fade show"
    ref={modalRef}
    tabIndex="-1"
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.5)",
      position: "fixed",
      inset: 0,
      zIndex: 1050,
    }}
  >
    <div
      className="modal-dialog modal-dialog-centered"
      style={{ maxWidth: "560px", width: "95%" }}
    >
      <div className="modal-content">
        {/* HEADER */}
        <div
          className="modal-header text-white"
          style={{ backgroundColor: "#3A5FBE" }}
        >
          <h5 className="modal-title mb-0">
             {statusPolicy.title}
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setShowStatusModal(false)}
          />
        </div>

        {/* BODY */}
        <div className="modal-body p-0">
          {/* TABS */}
          <div style={{ display: "flex", borderBottom: "1px solid #dee2e6" }}>
            <button
              onClick={() => setActiveTab("read")}
              style={{
                flex: 1,
                padding: "10px",
                border: "none",
                background: activeTab === "read" ? "#e0e7ff" : "transparent",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== "read") {
                  e.target.style.backgroundColor = "#f3f4f6";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== "read") {
                  e.target.style.backgroundColor = "transparent";
                }
              }}
            >
              Read ({readList.length})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              style={{
                flex: 1,
                padding: "10px",
                border: "none",
                background: activeTab === "pending" ? "#fde68a" : "transparent",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== "pending") {
                  e.target.style.backgroundColor = "#f3f4f6";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== "pending") {
                  e.target.style.backgroundColor = "transparent";
                }
              }}
            >
              Pending ({pendingList.length})
            </button>
          </div>

          {/* CONTENT */}
          <div style={{ padding: "16px", maxHeight: "350px", overflowY: "auto" }}>
            {activeTab === "read" && (
              <>
                {readList.length === 0 ? (
                  <p className="text-center text-muted py-3 mb-0">
                    No employee has read this policy.
                  </p>
                ) : (
                  <table className="table table-sm mb-0">
                    <thead>
                      <tr>
                        <th style={{ borderBottom: "1px solid #dee2e6", padding: "8px" }}>
                          Employee Name
                        </th>
                        <th style={{ borderBottom: "1px solid #dee2e6", padding: "8px" }}>
                          Date & Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {readList.map((item, index) => (
                        <tr key={index}>
                          <td style={{ padding: "8px", verticalAlign: "middle" }}>
                            {item.employeeName || "-"}
                          </td>
                          <td style={{ padding: "8px", verticalAlign: "middle" }}>
                            {item.acknowledgedAt
                              ? new Date(item.acknowledgedAt).toLocaleString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {activeTab === "pending" && (
              <>
                {pendingList.length === 0 ? (
                  <p className="text-center text-muted py-3 mb-0">
                    All employees have read this policy.
                  </p>
                ) : (
                  <table className="table table-sm mb-0">
                    <thead>
                      <tr>
                        <th style={{ borderBottom: "1px solid #dee2e6", padding: "8px" }}>
                          Employee Name
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingList.map((emp) => (
                        <tr key={emp._id}>
                          <td style={{ padding: "8px", verticalAlign: "middle" }}>
                            {emp.name}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="modal-footer border-0">
          <button
            className="btn btn-sm custom-outline-btn"
            style={{ minWidth: 90 }}
            onClick={() => setShowStatusModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}


      {showFileModal && selectedFile && (
        <div
          className="modal fade show"
          ref={modalRef}
          tabIndex="-1"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
          }}
        >
          <div 
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "650px" }}
          >
            <div className="modal-content">
              {/* HEADER */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">
                  {selectedFile.title || "File Viewer"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowFileModal(false);
                    setSelectedFile(null);
                  }}
                />
              </div>

              {/* BODY - Dynamic content based on file type */}
              <div className="modal-body p-3">
                {selectedFile.type === "image" && (
                  <div className="text-center">
                    <img
                      src={selectedFile.url}
                      alt={selectedFile.title || "Image"}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "60vh",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                )}

                {selectedFile.type === "video" && (
                  <div className="text-center">
                    <video
                      src={selectedFile.url}
                      controls
                      autoPlay
                      style={{
                        maxWidth: "100%",
                        maxHeight: "60vh",
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {selectedFile.type === "pdf" && (
                  <iframe
                    src={selectedFile.url}
                    title={selectedFile.title || "PDF Viewer"}
                    style={{
                      width: "100%",
                      height: "60vh",
                      border: "none",
                    }}
                    frameBorder="0"
                  />
                )}

                {selectedFile.type === "unknown" && (
                  <div className="text-center p-4">
                    <p>Cannot preview this file type.</p>
                    <a 
                      href={selectedFile.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-sm custom-outline-btn"
                    >
                      Download File
                    </a>
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="modal-footer border-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={() => {
                    setShowFileModal(false);
                    setSelectedFile(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export default HrPolicy;
