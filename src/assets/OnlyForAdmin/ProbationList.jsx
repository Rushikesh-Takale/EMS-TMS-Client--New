import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const ProbationList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [additionalMonths, setAdditionalMonths] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const { role, username, id } = useParams();
  const [extendedDate, setExtendedDate] = useState("");
  const [reason, setReason] = useState("");
  const navigate = useNavigate();
  const MAX_REASON_LENGTH = 200;
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [showViewModal, setShowViewModal] = useState(false);
  const [errors, setErrors] = useState({
    probationEndDate: "",
    reason: "",
  });
  const viewModalRef = useRef(null);
  const updateModalRef = useRef(null);

  const token = localStorage.getItem("accessToken");
  const authAxios = axios.create({
    baseURL: "http://localhost:8000",
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchEmployees = async () => {
    try {
      const res = await authAxios.get("/admin/probation-ending-soon");
      setEmployees(res.data);
    } catch (err) {
      console.error("Failed to fetch probation employees", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);
  const indexOfLastItem = currentPage * rowsPerPage;

  const indexOfFirstItem =
    indexOfLastItem - rowsPerPage;

  const currentEmployees = employees.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalPages = Math.ceil(
    employees.length / rowsPerPage
  );
  const handleRowClick = (emp) => {
    setSelectedEmp(emp);
    setShowViewModal(true);
  };
  const handleUpdateClick = (emp) => {
    setSelectedEmp(emp);
    setAdditionalMonths(1);
    setMessage("");
    setShowModal(true);
    setExtendedDate("");
    setReason("");
    setErrors({
      probationEndDate: "",
      reason: "",
    });
  };
  const handleApprove = async (emp) => {
    const confirm = window.confirm(
      `Are you sure you want to approve ${emp.name}'s probation?`
    );

    if (!confirm) return;
    setIsSubmitting(true);

    try {
      await authAxios.post(
        `/admin/probation/approve/${emp._id}`
      );

      setEmployees((prev) =>
        prev.map((item) =>
          item._id === emp._id
            ? {
              ...item,
              probationStatus: "approved",
            }
            : item
        )
      );

      alert(
        `${emp.name}'s probation approved.`
      );

    } catch (err) {
      alert("Failed to approve probation.");
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const handleExtend = async () => {

    let newErrors = {
      probationEndDate: "",
      reason: "",
    };

    if (!extendedDate) {
      newErrors.probationEndDate =
        "Please select probation end date.";
    }

    if (!reason.trim()) {
      newErrors.reason =
        "Reason is required.";
    }

    const oldDate = new Date(
      selectedEmp.probationEndDate
    );

    const newDate = new Date(extendedDate);

    if (
      extendedDate &&
      newDate <= oldDate
    ) {
      newErrors.probationEndDate =
        "New probation date must be greater than current probation date.";
    }

    setErrors(newErrors);

    if (
      newErrors.probationEndDate ||
      newErrors.reason
    ) {
      return;
    }
    setIsSubmitting(true);

    try {
      await authAxios.post(
        `/admin/probation/extend/${selectedEmp._id}`,
        {
          newEndDate: extendedDate,
          reason: reason.trim(),
        }
      );

      alert(
        "Probation extended successfully!"
      );

      fetchEmployees();

      setShowModal(false);

      setExtendedDate("");
      setReason("");

    } catch (err) {
      setMessage(
        err.response?.data?.error ||
        "Failed to extend probation."
      );
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const trapFocus = (e, modalRef) => {
    if (!modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };


  // Focus when modal opens
  useEffect(() => {
    if (showViewModal && viewModalRef.current) {
      viewModalRef.current.focus();
    }
    if (showModal && updateModalRef.current) {
      updateModalRef.current.focus();
    }
  }, [showViewModal, showModal]);

  // Body scroll lock
  useEffect(() => {
    if (showViewModal || showModal) {
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
  }, [showViewModal, showModal]);



  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <div className="spinner-grow" role="status" style={{ width: "4rem", height: "4rem", color: "#3A5FBE" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 fw-semibold" style={{ color: "#3A5FBE" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 pt-3">
      <h4 style={{ color: "#3A5FBE", fontWeight: 600 }}>
        Probation Period Completion
      </h4>


      <div className="card shadow-sm border-0">
        <div className="table-responsive bg-white">
          <table className="table table-hover mb-0">
            <thead style={{ backgroundColor: "#ffffffff" }}>
              <tr>
                <th style={{
                  fontWeight: "500",
                  fontSize: "14px",
                  color: "#6c757d",
                  borderBottom: "2px solid #dee2e6",
                  padding: "12px",
                  whiteSpace: "nowrap",
                }}>Employee ID
                </th>

                <th style={{
                  fontWeight: "500",
                  fontSize: "14px",
                  color: "#6c757d",
                  borderBottom: "2px solid #dee2e6",
                  padding: "12px",
                  whiteSpace: "nowrap",
                }}>Name

                </th>

                <th style={{
                  fontWeight: "500",
                  fontSize: "14px",
                  color: "#6c757d",
                  borderBottom: "2px solid #dee2e6",
                  padding: "12px",
                  whiteSpace: "nowrap",
                }}>Department
                </th>

                <th style={{
                  fontWeight: "500",
                  fontSize: "14px",
                  color: "#6c757d",
                  borderBottom: "2px solid #dee2e6",
                  padding: "12px",
                  whiteSpace: "nowrap",
                }}>Designation
                </th>

                <th style={{
                  fontWeight: "500",
                  fontSize: "14px",
                  color: "#6c757d",
                  borderBottom: "2px solid #dee2e6",
                  padding: "12px",
                  whiteSpace: "nowrap",
                }}>DOJ</th>

                <th style={{
                  fontWeight: "500",
                  fontSize: "14px",
                  color: "#6c757d",
                  borderBottom: "2px solid #dee2e6",
                  padding: "12px",
                  whiteSpace: "nowrap",
                }}>Probation Ends On</th>

                <th style={{
                  fontWeight: "500",
                  fontSize: "14px",
                  color: "#6c757d",
                  borderBottom: "2px solid #dee2e6",
                  padding: "12px",
                  whiteSpace: "nowrap",
                }}>Status</th>

                <th style={{
                  fontWeight: "500",
                  fontSize: "14px",
                  color: "#6c757d",
                  borderBottom: "2px solid #dee2e6",
                  padding: "12px",
                  whiteSpace: "nowrap",
                }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="6"
                    className="text-center text-muted"
                    style={{
                      padding: "20px",
                      verticalAlign: "middle",
                    }}
                  >
                    No data available
                  </td>
                </tr>
              ) : (
                currentEmployees.map((emp) => (
                  <tr
                    key={emp._id}
                    className="align-middle"
                    onClick={() => handleRowClick(emp)}
                    style={{ cursor: "pointer" }}
                  >
                    <td style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                      color: "#212529",
                    }}>{emp.employeeId}</td>

                    <td style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                      color: "#212529",
                    }} className="text-capitalize">{emp.name}</td>

                    <td style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                      color: "#212529",
                    }}>{emp.department}</td>

                    <td style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      color: "#212529",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                    }}>{emp.designation}</td>

                    <td style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      color: "#212529",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                    }}>{formatDate(emp.doj)}</td>

                    <td style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      color: "#212529",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                    }}>
                      <span
                        className="badge"
                        style={{ backgroundColor: "#FFE493", color: "#000", fontWeight: 600 }}
                      >
                        {formatDate(emp.probationEndDate)}
                      </span>
                    </td>
                    <td style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      color: "#212529",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                    }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            emp.probationStatus === "approved"
                              ? "#cce5ff"
                              : emp.probationStatus ===
                                "extended"
                                ? "#d1f2dd"
                                : new Date(
                                  emp.probationEndDate
                                ) < new Date()
                                  ? "#f8d7da"
                                  : "#FFE493",

                          color: "#000",
                          fontWeight: 500,
                          fontSize: "14px",
                          padding: "10px 18px",
                          borderRadius: "6px",
                          minWidth: "110px",
                          display: "inline-flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        {emp.probationStatus === "approved" ? "Approved" :
                          emp.probationStatus === "extended" ? "Extended" :
                            new Date(emp.probationEndDate) < new Date() ? "Overdue" :
                              "Pending"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <div className="d-flex gap-2">
                        {emp.probationStatus !== "approved" && (
                          <>
                            <button
                              className="btn btn-sm custom-outline-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateClick(emp);
                              }}
                            >
                              Update
                            </button>

                            <button
                              className="btn btn-sm custom-outline-btn"
                              style={{ minWidth: "90px" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(emp);
                              }}
                              disabled={isSubmitting}
                            >
                              Approve
                            </button>
                          </>
                        )}
                      </div>
                    </td>            </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="d-flex justify-content-end align-items-center gap-4 px-3 py-3 flex-wrap">

        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: "14px" }}>
            Rows per page:
          </span>

          <select
            className="form-select form-select-sm"
            style={{ width: "60px" }}
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
        </div>

        <div style={{ fontSize: "14px" }}>
          {indexOfFirstItem + 1}-
          {Math.min(indexOfLastItem, employees.length)} of{" "}
          {employees.length}
        </div>

        <div className="d-flex align-items-center gap-2">

          <button
            className="btn btn-sm"
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage(currentPage - 1)
            }
          >
            &#8249;
          </button>

          <button
            className="btn btn-sm"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage(currentPage + 1)
            }
          >
            &#8250;
          </button>

        </div>
      </div>

      {/* Back Button */}
      <div className="d-flex justify-content-end mt-3">
        <button
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: "90px" }}
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>
      {showViewModal && selectedEmp && (
        <div
          ref={viewModalRef}
          tabIndex="-1"
          onKeyDown={(e) => trapFocus(e, viewModalRef)}
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: "550px" }}
          >
            <div className="modal-content">

              <div className="custom-modal-header">
                <span className="modal-title">
                  Employee Details
                </span>

                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() =>
                    setShowViewModal(false)
                  }
                />
              </div>

              <div className="modal-body">

                <div className="d-flex mb-2">
                  <label className="form-label fw-semibold" style={{ minWidth: "170px" }}>
                    Employee ID
                  </label>
                  {selectedEmp.employeeId}
                </div>

                <div className="d-flex mb-2">
                  <label className="form-label fw-semibold" style={{ minWidth: "170px" }}>
                    Name
                  </label>

                  <span className="text-capitalize">
                    {selectedEmp.name}
                  </span>
                </div>

                <div className="d-flex mb-2">
                  <label className="form-label fw-semibold" style={{ minWidth: "170px" }}>
                    Department
                  </label>

                  <span>{selectedEmp.department}</span>
                </div>

                <div className="d-flex mb-2">
                  <label className="form-label fw-semibold" style={{ minWidth: "170px" }}>
                    Designation
                  </label>

                  <span>{selectedEmp.designation}</span>
                </div>

                <div className="d-flex mb-2">
                  <label className="form-label fw-semibold" style={{ minWidth: "170px" }}>
                    DOJ:
                  </label>

                  <span>{formatDate(selectedEmp.doj)}</span>
                </div>

                <div className="d-flex mb-2">
                  <label className="form-label fw-semibold" style={{ minWidth: "170px" }}>
                    Probation End
                  </label>

                  <span>
                    {formatDate(selectedEmp.probationEndDate)}
                  </span>
                </div>

                <div className="d-flex mb-2 align-items-center">
                  <label className="form-label fw-semibold" style={{ minWidth: "170px" }}>
                    Status:
                  </label>

                  <span
                    className="badge"
                    style={{
                      backgroundColor:
                        selectedEmp.probationStatus ===
                          "approved"
                          ? "#cce5ff"
                          : selectedEmp.probationStatus ===
                            "extended"
                            ? "#d1f2dd"
                            : new Date(
                              selectedEmp.probationEndDate
                            ) < new Date()
                              ? "#f8d7da"
                              : "#FFE493",
                      color: "#000",
                      fontWeight: 600,
                    }}
                  >
                    {selectedEmp.probationStatus ===
                      "approved"
                      ? "Approved"
                      : selectedEmp.probationStatus ===
                        "extended"
                        ? "Extended"
                        : new Date(
                          selectedEmp.probationEndDate
                        ) < new Date()
                          ? "Overdue"
                          : "Pending"}
                  </span>
                </div>

              </div>

              <div className="modal-footer border-0 pt-0">

                {selectedEmp.probationStatus !== "approved" && (
                  <>
                    <button
                      className="btn btn-sm custom-outline-btn"
                      onClick={() => {
                        setShowViewModal(false);
                        handleUpdateClick(selectedEmp);
                      }}
                    >
                      Update
                    </button>

                    <button
                      className="btn btn-sm custom-outline-btn"
                      style={{ minWidth: "90px" }}
                      onClick={() => handleApprove(selectedEmp)}
                      disabled={isSubmitting}
                    >
                      Approve
                    </button>
                  </>
                )}

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


      {/* Update Modal */}
      {showModal && selectedEmp && (
        <div
          ref={updateModalRef}
          tabIndex="-1"
          onKeyDown={(e) => trapFocus(e, updateModalRef)}
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "550px" }}>
            <div className="modal-content">
              <div className="custom-modal-header">
                <span className="modal-title">Update Probation Period</span>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                />
              </div>
              <div className="modal-body">
                {/* Employee Info */}
                <div className="mb-3">
                  <div className="d-flex">
                    <label className="form-label fw-semibold" style={{ minWidth: "180px" }}>
                      Name
                    </label>
                    <span>{selectedEmp.name}</span>
                  </div>

                  <div className="d-flex">
                    <label className="form-label fw-semibold" style={{ minWidth: "180px" }}>
                      Department
                    </label>
                    <span>{selectedEmp.department}</span>
                  </div>

                  <div className="d-flex">
                    <label className="form-label fw-semibold" style={{ minWidth: "180px" }}>
                      Current Probation End
                    </label>

                    <span>
                      {formatDate(selectedEmp.probationEndDate)}
                    </span>
                  </div>
                </div>

                <hr />

                <label className="form-label fw-semibold">
                  Extended Probation Date
                  <span style={{ color: "red" }}>
                    {" "}*
                  </span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={extendedDate}
                  min={new Date(selectedEmp.probationEndDate)
                    .toISOString()
                    .split("T")[0]}
                  onChange={(e) => setExtendedDate(e.target.value)}
                />
                {errors.probationEndDate && (
                  <div
                    style={{
                      color: "red",
                      fontSize: "14px",
                      marginTop: "4px",
                    }}
                  >
                    {errors.probationEndDate}
                  </div>
                )}
                <label className="form-label fw-semibold mt-3">
                  Reason
                  <span style={{ color: "red" }}>
                    {" "}*
                  </span>
                </label>

                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Enter reason"
                  value={reason}
                  maxLength={MAX_REASON_LENGTH}
                  onChange={(e) => setReason(e.target.value)}
                />
                {errors.reason && (
                  <div
                    style={{
                      color: "red",
                      fontSize: "14px",
                      marginTop: "4px",
                    }}
                  >
                    {errors.reason}
                  </div>
                )}

                <div className="d-flex justify-content-between mt-1">
                  <small className="text-muted">
                    Maximum 200 characters allowed
                  </small>

                  <small
                    style={{
                      color:
                        reason.length >= MAX_REASON_LENGTH
                          ? "red"
                          : "#6c757d",
                    }}
                  >
                    {reason.length}/{MAX_REASON_LENGTH}
                  </small>
                </div>

                {/* New end date preview */}
                {extendedDate && (
                  <small className="text-muted mt-2 d-block">
                    New probation end date:
                    <strong>
                      {" "}
                      {formatDate(extendedDate)}
                    </strong>
                  </small>
                )}



              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={() => setShowModal(false)}
                  style={{ minWidth: "90px" }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={handleExtend}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Extending....' : 'Extend Probation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProbationList;