import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const ProbationList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [additionalMonths, setAdditionalMonths] = useState(1);
  const [message, setMessage] = useState("");
  const { role, username, id } = useParams();
  const [extendedDate, setExtendedDate] = useState("");
const [reason, setReason] = useState("");
  const navigate = useNavigate();
  const MAX_REASON_LENGTH = 200;
  const [currentPage, setCurrentPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(5);

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
  const handleUpdateClick = (emp) => {
    setSelectedEmp(emp);
    setAdditionalMonths(1);
    setMessage("");
    setShowModal(true);
    setExtendedDate("");
    setReason("");
  };
  const handleApprove = async (emp) => {
  const confirm = window.confirm(
    `Are you sure you want to approve ${emp.name}'s probation?`
  );

  if (!confirm) return;

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
};

const handleExtend = async () => {
  if (!extendedDate) {
    setMessage("Please select probation end date.");
    return;
  }

  if (!reason.trim()) {
    setMessage("Reason is required.");
    return;
  }

  const oldDate = new Date(selectedEmp.probationEndDate);
  const newDate = new Date(extendedDate);

  if (newDate <= oldDate) {
    setMessage("New probation date must be greater than current probation date.");
    return;
  }

  try {
    await authAxios.post(`/admin/probation/extend/${selectedEmp._id}`, {
      newEndDate: extendedDate,   
      reason: reason.trim()
    });

    alert("Probation extended successfully!");
    fetchEmployees(); 
    setShowModal(false);
    setExtendedDate("");
    setReason("");
  } catch (err) {
    setMessage(err.response?.data?.error || "Failed to extend probation.");
  }
};




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

      <div className="card shadow-sm mt-3">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead style={{ backgroundColor: "#fff" }}>
                <tr>
                  <th style={{ fontWeight: 600, fontSize: "14px" }}>Employee ID</th>
                  <th style={{ fontWeight: 600, fontSize: "14px" }}>Name</th>
                  <th style={{ fontWeight: 600, fontSize: "14px" }}>Department</th>
                  <th style={{ fontWeight: 600, fontSize: "14px" }}>Designation</th>
                  <th style={{ fontWeight: 600, fontSize: "14px" }}>DOJ</th>
                  <th style={{ fontWeight: 600, fontSize: "14px" }}>Probation Ends On</th>
                  <th style={{ fontWeight: 600, fontSize: "14px" }}>Status</th>
                  <th style={{ fontWeight: 600, fontSize: "14px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      No employees with probation ending this week
                    </td>
                  </tr>
                ) : (
               currentEmployees.map((emp) => (
                    <tr key={emp._id}>
                      <td style={{ fontSize: "14px" }}>{emp.employeeId}</td>
                      <td style={{ fontSize: "14px" }} className="text-capitalize">{emp.name}</td>
                      <td style={{ fontSize: "14px" }}>{emp.department}</td>
                      <td style={{ fontSize: "14px" }}>{emp.designation}</td>
                      <td style={{ fontSize: "14px" }}>{formatDate(emp.doj)}</td>
                      <td style={{ fontSize: "14px" }}>
                        <span
                          className="badge"
                          style={{ backgroundColor: "#FFE493", color: "#000", fontWeight: 600 }}
                        >
                          {formatDate(emp.probationEndDate)}
                        </span>
                      </td>
                      <td style={{ fontSize: "14px" }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            emp.probationStatus === "approved" ? "#cce5ff" :
                            emp.probationStatus === "extended" ? "#d1f2dd" :
                            new Date(emp.probationEndDate) < new Date() ? "#f8d7da" :
                            "#FFE493",
                          color: "#000",
                          fontWeight: 600,
                        }}
                      >
                        {emp.probationStatus === "approved" ? "Approved" :
                        emp.probationStatus === "extended" ? "Extended" :
                        new Date(emp.probationEndDate) < new Date() ? "Overdue" :
                        "Pending"}
                      </span>
                    </td>
                     <td className="d-flex gap-2">

  <button
    className="btn btn-sm custom-outline-btn"
    onClick={() => handleUpdateClick(emp)}
    disabled={emp.probationStatus === "approved"}
  >
    Update
  </button>

  {emp.probationStatus === "approved" ? (
    <button
      className="btn btn-sm custom-outline-btn"
      style={{minWidth:"90px"}}
      disabled
    >
      Approved
    </button>
  ) : (
    <button
      className="btn btn-sm custom-outline-btn"
      style={{minWidth:"90px"}}
      onClick={() => handleApprove(emp)}
    >
      Approve
    </button>
  )}

</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
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
          style={{minWidth:"90px"}}
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>

      {/* Update Modal */}
      {showModal && selectedEmp && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "600px" }}>
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
    <strong style={{ minWidth: "180px" }}>Name:</strong>
    <span>{selectedEmp.name}</span>
  </div>

  <div className="d-flex">
    <strong style={{ minWidth: "180px" }}>Department:</strong>
    <span>{selectedEmp.department}</span>
  </div>

  <div className="d-flex">
    <strong style={{ minWidth: "180px" }}>
      Current Probation End:
    </strong>

    <span>
      {formatDate(selectedEmp.probationEndDate)}
    </span>
  </div>
</div>

                <hr />

                  <label className="form-label fw-semibold">
                    Extended Probation Date:
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
                            <label className="form-label fw-semibold mt-3">
                            Reason:
                            </label>

                            <textarea
                            className="form-control"
                            rows={3}
                            placeholder="Enter reason"
                            value={reason}
                            maxLength={MAX_REASON_LENGTH}
                            onChange={(e) => setReason(e.target.value)}
                            />

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

                {message && (
                  <p className={`mt-2 fw-medium ${message.includes("success") ? "text-success" : "text-danger"}`}>
                    {message}
                  </p>
                )}
                
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={() => setShowModal(false)}
                  style={{minWidth:"90px"}}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-sm custom-outline-btn"
                  onClick={handleExtend}
                >
                  Extend Probation
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