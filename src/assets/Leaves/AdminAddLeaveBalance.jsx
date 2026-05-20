import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function AdminAddLeaveBalance({fetchNotifications}) {
  const [user, setUser] = useState(null);
  const [sl, setSl] = useState(0);
  const [cl, setCl] = useState(0);
  const [message, setMessage] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [previewDaysMap, setPreviewDaysMap] = useState({});


  // 🔹 Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // NEW: Status,date,name  filter state
  const [statusFilter, setStatusFilter] = useState("All");
  const [employeeNameFilter, setEmployeeNameFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [filteredLeaves, setFilteredLeaves] = useState(leaves); 

  //adesh code
  const [selectedLeave, setSelectedLeave] = useState(null);
  const modalRef = useRef(null);
  useEffect(() => {
    if (!selectedLeave || !modalRef.current) return;

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
        setSelectedLeave(null);
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

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedLeave]);
  // dipali code
  
  // 🔹 Fetch logged-in admin user
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    axios
      .get("http://localhost:8000/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUser(res.data))
      .catch((err) => console.error("User fetch error:", err));
  }, []);

  // prateek code
  useEffect(() => {
    const fetchPreview = async () => {
      const map = {};
  
      for (let leave of leaves) {
        try {
          if (!leave.employee?._id) continue;
          const res = await axios.post(
            "http://localhost:8000/leave/calculate",
            {
              // employeeId: leave.employee,
              employeeId: leave.employee?._id,
              leaveType: leave.leaveType,
              dateFrom: leave.dateFrom,
              dateTo: leave.dateTo,
              duration: leave.duration,
            }
          );
  
          map[leave._id] = res.data.totalDays;
        } catch (err) {
          map[leave._id] = leave.totalDays || 1;
        }
      }
  
      setPreviewDaysMap(map);
    };
  
    if (leaves.length > 0 && user) {
      fetchPreview();
    }
  }, [leaves]);
    

  // 🔹 Fetch all leaves Added by Rutuja
  useEffect(() => {
    if (!user) return;
     setLoadingLeaves(true);
    axios
      .get("http://localhost:8000/leaves")
      .then((res) => {
        const filteredByAdmin = res.data.filter(
          (l) => l.employee?.employeeId !== user?.employeeId,
        );

        const sortedLeaves = filteredByAdmin.sort(
          (a, b) => new Date(b.appliedAt) - new Date(a.appliedAt),
        );
        setLeaves(sortedLeaves);
        setFilteredLeaves(sortedLeaves);

        const pending = filteredByAdmin.filter(
          (l) => l.status === "pending",
        ).length;
        setPendingRequests(pending);
      })
      .catch((err) => console.error("Leaves fetch error:", err))
      .finally(() => setLoadingLeaves(false));
  }, [user]);

  const updateStatus = async (leaveId, status) => {
    if (!user?._id) return;
    
    if (!confirm(`Are you sure you want to ${status} this leave request?`)) {
      return;
    }
  
    try {
      const response = await axios.put(`http://localhost:8000/leave/${leaveId}/status`, {
        status,
        userId: user._id,
        role: "admin",
      });
  
      const updatedLeaveFromBackend = response.data.leave;
      const breakdown = response.data.breakdown;
  
      const updatedLeaves = leaves.map((l) =>
        l._id === leaveId 
          ? { 
              ...l, 
              status: status,
              totalDays: breakdown?.totalDays ?? updatedLeaveFromBackend?.totalDays ?? l.totalDays,
              paidDays: breakdown?.paidDays ?? updatedLeaveFromBackend?.paidDays,
              lwpDays: breakdown?.lwpDays ?? updatedLeaveFromBackend?.lwpDays
            } 
          : l,
      );
  
      setLeaves(updatedLeaves);
      setFilteredLeaves((prev) =>
        prev.map((l) => 
          l._id === leaveId 
            ? { 
                ...l, 
                status: status,
                totalDays: breakdown?.totalDays ?? updatedLeaveFromBackend?.totalDays ?? l.totalDays
              } 
            : l
        ),
      );

      if (selectedLeave && selectedLeave._id === leaveId) {
        setSelectedLeave((prev) => ({
          ...prev,
          status: status,
          totalDays:
            breakdown?.totalDays ??
            updatedLeaveFromBackend?.totalDays ??
            prev.totalDays,
          paidDays:
            breakdown?.paidDays ??
            updatedLeaveFromBackend?.paidDays,
          lwpDays:
            breakdown?.lwpDays ??
            updatedLeaveFromBackend?.lwpDays,
        }));
      }
  
      if (breakdown?.totalDays) {
        setPreviewDaysMap(prev => ({
          ...prev,
          [leaveId]: breakdown.totalDays
        }));
      }
  
      setPendingRequests((prev) => (status !== "pending" ? prev - 1 : prev));
      alert(`Leave request ${status} successfully!`);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Something went wrong while applying leave.";
      alert(`❌ ${errorMessage}`);
      setMessage(errorMessage);
    }
  };
  const [data, setData] = useState([]);
  const fetchYearlySettings = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/leave/yearly-settings",
      );
      setData(res.data);
    } catch (err) {
      console.error("Error fetching yearly settings:", err);
    }
  };

  useEffect(() => {
    fetchYearlySettings();
  }, []);

  const grantYearly = async () => {
    try {
      const res = await axios.post("http://localhost:8000/leave/grant-yearly", {
        sl,
        cl,
      });

      // ✅ Show alert on success
      window.alert(res.data.message + " for " + res.data.count + " employees");
      // ✅ Close modal box automatically
      setShowModal(false);
      //refresh
      fetchYearlySettings();
      // Update message in state too (if needed for UI)
      setMessage(res.data.message + " for " + res.data.count + " employees");

      // 🔁 Refresh balance from backend
      await fetchLeaveBalance();
    } catch (err) {
      console.error("Error granting yearly leave:", err);

      // ⚠️ Show error alert
      if (err.response?.data?.message) {
        window.alert("Error: " + err.response.data.message);
      } else {
        window.alert("Something went wrong while granting leaves.");
      }
    }
  };

  const grantMonthly = async () => {
    try {
      const res = await axios.post(
        "http://localhost:8000/leave/grant-monthly",
        {
          sl,
          cl,
        },
      );
      setMessage(res.data.message + " for " + res.data.count + " employees");
      alert(res.data.message + " for " + res.data.count + " employees");
      // 🔁 Refresh balance from backend
      await fetchLeaveBalance();
    } catch (err) {
      console.error("Error granting monthly leave:", err);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const res = await axios.get("http://localhost:8000/leave/balance");
      console.log("data", res.data);
    } catch (err) {
      console.error("Error fetching leave balance:", err);
    }
  };

  useEffect(() => {
    fetchLeaveBalance();
  }, []);

  // 🔹 Derived counts
  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;
  const approvedLeaves = leaves.filter((l) => l.status === "approved").length;
  const rejectedLeaves = leaves.filter((l) => l.status === "rejected").length;


  // dipali  code
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeaves = filteredLeaves.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);


  const HandleDelete = async (leaveId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this leave?",
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:8000/leave/${leaveId}`);

      // ✅ Remove the deleted leave from state
      const updatedLeaves = leaves.filter((l) => l._id !== leaveId);
    setLeaves(updatedLeaves);
    setFilteredLeaves(updatedLeaves);
      
      
fetchNotifications();
      alert("🗑️ Leave deleted successfully!");
    } catch (err) {
      console.error("Error deleting leave:", err);
      alert("❌ Failed to delete leave. Please try again.");
    }
  };

  console.log("currentLeaves", currentLeaves);

  const resetYearlySettings = async () => {
    if (
      !window.confirm(
        "⚠️ Are you sure you want to reset all yearly leave settings and employee balances?",
      )
    ) {
      return;
    }

    try {
      const res = await axios.delete("http://localhost:8000/leave/reset-all");
      alert(res.data.message);
      setData([]); // clear yearly table instantly
    } catch (err) {
      console.error("Error resetting yearly settings:", err);
      alert("❌ Failed to reset yearly leave settings. Please try again.");
    }
  };

  const getLeaveDurationText = (leave) => {
    if (!leave) return "-";

    if (leave.duration === "half") {
      return "0.5 day";
    }

    if (
      leave.totalDays === 0 
    ) {
      return "Sandwich leave calculated in previous applied leave";
    }

    const days =
  leave.status === "approved"
    ? leave.totalDays
    : (previewDaysMap[leave._id] ?? leave.totalDays ?? 1);

    return `${days} ${days === 1 ? "day" : "days"}`;
  };


  // dipali code
  //NEW CODE
  const applyFilters = () => {
    const filtered = leaves.filter((l) => {
      // status filter
      const matchesStatus = statusFilter === "All" || l.status === statusFilter;
      // name filter
      const employeeName = l.employee?.name || "";
      const matchesName = employeeName
        .toLowerCase()
        .includes(employeeNameFilter.toLowerCase());
      // date filter
      const leaveFromDate = new Date(l.dateFrom);
      const fromDateFilterDate = dateFromFilter
        ? new Date(dateFromFilter)
        : null;
      const toDateFilterDate = dateToFilter ? new Date(dateToFilter) : null;
      const matchesDateFrom = fromDateFilterDate
        ? leaveFromDate >= fromDateFilterDate
        : true;
      const matchesDateTo = toDateFilterDate
        ? leaveFromDate <= toDateFilterDate
        : true;
      return matchesStatus && matchesName && matchesDateFrom && matchesDateTo;
    });

    setFilteredLeaves(filtered);
    setCurrentPage(1); // optional: reset page to first
  };
  //bg scroll stop
  useEffect(() => {
    if (selectedLeave) {
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
  }, [selectedLeave]);
  // dip code changes 11-02-2026
  if (loadingLeaves) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          
        }}
      >
        <div className="text-center">
          <div
            className="spinner-grow"
            role="status"
            style={{ width: "4rem", height: "4rem", color: "#3A5FBE" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 fw-semibold" style={{ color: "#3A5FBE" }}>
            Loading, please wait...
          </p>
        </div>
      </div>
    );
  }
  
  return (

    <div className="container-fluid">
      <h3 className="mb-4 " style={{ color: "#3A5FBE", fontSize: "25px" }}>
        Leaves
      </h3>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card shadow-sm border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "40px",
                  backgroundColor: "#D7F5E4",
                  padding: "10px",
                  textAlign: "center",
                  minWidth: "75px",
                  minHeight: "75px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {approvedLeaves}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "20px", color: "#3A5FBE" }}
              >
                Accepted Leave Requests
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card shadow-sm border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "40px",
                  backgroundColor: "#F8D7DA",
                  padding: "10px",
                  textAlign: "center",
                  minWidth: "75px",
                  minHeight: "75px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {rejectedLeaves}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "20px", color: "#3A5FBE" }}
              >
                Rejected Leave Requests
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card shadow-sm border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "40px",
                  backgroundColor: "#FFE493",
                  padding: "10px",
                  textAlign: "center",
                  minWidth: "75px",
                  minHeight: "75px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {pendingLeaves}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "20px", color: "#3A5FBE" }}
              >
                Pending Leave Requests
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Set Leave Modal */}
      <>

        <style>{`
  .modal-body .btn:focus {
    outline: none;
  }

  /* For all buttons in modal-footer */
  .modal-footer .btn:focus-visible {
    outline: 3px solid #3A5FBE;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(58, 95, 190, 0.25);
    transform: scale(1.02);
    transition: all 0.2s ease;
  }

  /* Submit buttons (blue background) */
  .modal-footer button[type="submit"]:focus-visible,
  .modal-footer .btn[style*="backgroundColor: \"#3A5FBE\""]:focus-visible {
    outline: 3px solid #ffffff;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.4);
    filter: brightness(1.1);
  }

  /* Cancel button (outline style) */
  .modal-footer .btn-outline:focus-visible {
    outline: 3px solid #3A5FBE;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(58, 95, 190, 0.25);
    background-color: rgba(58, 95, 190, 0.05);
  }

  /* Input fields */
  .modal-body input:focus-visible {
    outline: 2px solid #3A5FBE !important;
    outline-offset: 2px;
    border-color: #3A5FBE !important;
    box-shadow: 0 0 0 3px rgba(58, 95, 190, 0.15) !important;
  }
`}</style>
        
      </>

      <div className="card mt-4 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters();
            }}
          >
            {/* Status Filter */}
            <div className="col-12 col-md-auto d-flex align-items-center  mb-1  ms-2">
              <label
                htmlFor="statusFilter"
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  width: "55px",
                  minWidth: "55px",
                  fontSize: "16px",
                  color: "#3A5FBE",
                  marginRight: "8px",
                }}
              >
                Status
              </label>
              <select
                id="statusFilter"
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Name Filter */}
            <div className="col-12 col-md-auto d-flex align-items-center  mb-1  ms-2">
              <label
                htmlFor="employeeNameFilter"
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  width: "55px",
                  minWidth: "55px",
                  fontSize: "16px",
                  color: "#3A5FBE",
                  marginRight: "8px",
                }}
              >
                Name
              </label>
              <input
                id="employeeNameFilter"
                type="text"
                className="form-control"
                value={employeeNameFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  const cleaned = value.replace(/[^A-Za-z\s]/g, "");

                  setEmployeeNameFilter(cleaned);
                  setCurrentPage(1);
                }}
                placeholder="Employee name"
              />
            </div>

            {/* From Date Filter */}
            <div className="col-12 col-md-auto d-flex align-items-center mb-1 ms-2">
              <label
                htmlFor="dateFromFilter"
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  width: "55px",
                  minWidth: "55px",
                  marginRight: "8px",
                }}
              >
                From
              </label>
              <input
                type="date"
                id="dateFromFilter"
                value={dateFromFilter}
                onKeyDown={(e) => e.preventDefault()}
                onClick={(e) => e.target.showPicker?.()}
                onFocus={(e) => e.target.showPicker?.()}
                onChange={(e) => {
                  const value = e.target.value;
                  setDateFromFilter(value);

                  if (dateToFilter && value > dateToFilter) {
                    setDateError('"From Date" cannot be later than "To Date".');
                  } else {
                    setDateError("");
                  }
                }}
                className="form-control"
                placeholder="dd-mm-yyyy"
              />
            </div>

            <div className="col-12 col-md-auto d-flex align-items-center mb-1 ms-2">
              <label
                htmlFor="dateToFilter"
                className="fw-bold mb-0 text-start text-md-end "
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  width: "55px",
                  minWidth: "55px",
                  marginRight: "8px",
                  textAlign: "right",
                }}
              >
                To
              </label>
              <input
                type="date"
                id="dateToFilter"
                value={dateToFilter}
                min={dateFromFilter || ""}
                onKeyDown={(e) => e.preventDefault()}
                onClick={(e) => e.target.showPicker?.()}
                onFocus={(e) => e.target.showPicker?.()}
                onChange={(e) => {
                  const value = e.target.value;
                  setDateToFilter(value);

                  if (dateFromFilter && dateFromFilter > value) {
                    setDateError('"From Date" cannot be later than "To Date".');
                  } else {
                    setDateError("");
                  }
                }}
                className="form-control"
                placeholder="dd-mm-yyyy"
              />
            </div>
            {/* Filter and Reset buttons */}
            <div className="col-12 col-md-auto ms-md-auto d-flex gap-2 mb-1 justify-content-end">
              <button
                type="submit"
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
              >
                Filter
              </button>
              <button
                type="button"
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
                onClick={() => {
                  setStatusFilter("All");
                  setEmployeeNameFilter("");
                  setDateFromFilter("");
                  setDateToFilter("");
                  setCurrentPage(1);
                  setFilteredLeaves(leaves);
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      <>
        {
         leaves.length === 0 ? (
          <p>No leave applications found.</p>
        ) : (
          <div className="card shadow-sm border-0 mt-5">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 bg-white">
                <thead style={{ backgroundColor: "#ffffffff" }}>
                  <tr>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ID
                    </th>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Employee
                    </th>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Apply Date
                    </th>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Type
                    </th>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      From
                    </th>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      To
                    </th>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Duration
                    </th>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
                        whiteSpace: "nowrap",
                        maxWidth: "220px",
                        wordBreak: "break-word",
                      }}
                    >
                      Reason
                    </th>
                    <th
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#6c757d",
                        borderBottom: "2px solid #dee2e6",
                        padding: "12px",
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
                        padding: "12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* NEW: Show message when no results */}
                  {currentLeaves.length === 0 ? (
                    <tr>
                      <td
                        colSpan="10"
                        className="text-center py-4"
                        style={{
                          color: "#6c757d",
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}
                        >
                        No leave requests found with status "{statusFilter}"
                        </td>
                    </tr>
                  ) : (
                    currentLeaves.map((l) => (
                      <tr
                        key={l._id}
                        onClick={() => setSelectedLeave(l)}
                        style={{ cursor: "pointer" }}
                      >
                        <td
                          style={{
                            padding: "12px",
                            verticalAlign: "middle",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {l.employee?.employeeId}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            verticalAlign: "middle",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {l.employee?.name}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            verticalAlign: "middle",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {l.appliedAt
                            ? new Date(l.appliedAt).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "-"}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            verticalAlign: "middle",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {l.leaveType}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            verticalAlign: "middle",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {new Date(l.dateFrom).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            verticalAlign: "middle",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {new Date(l.dateTo).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            verticalAlign: "middle",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {l.duration === "half"
                            ? "0.5"
                            : l.totalDays === 0
                            ? "Merged Leaves"
                            : l.status === "approved"
                            ? l.totalDays
                            : (previewDaysMap[l._id] ?? l.totalDays ?? 1)
                          }
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            verticalAlign: "middle",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                            whiteSpace: "nowrap",
                            maxWidth: "220px",
                            wordBreak: "break-word",
                            overflow: "auto",
                          }}
                        >
                          {l.reason}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            verticalAlign: "middle",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {l.status === "approved" ? (
                            <span
                              style={{
                                backgroundColor: "#d1f2dd",
                                padding: "8px 16px",
                                borderRadius: "4px",
                                fontSize: "13px",
                                fontWeight: "500",
                                display: "inline-block",
                                width: "100px",
                                textAlign: "center",
                              }}
                            >
                              Approved
                            </span>
                          ) : l.status === "rejected" ? (
                            <span
                              style={{
                                backgroundColor: "#f8d7da",
                                padding: "8px 16px",
                                borderRadius: "4px",
                                fontSize: "13px",
                                fontWeight: "500",
                                display: "inline-block",
                                width: "100px",
                                textAlign: "center",
                              }}
                            >
                              Rejected
                            </span>
                          ) : (
                            <span
                              style={{
                                backgroundColor: "#FFE493",
                                padding: "8px 16px",
                                borderRadius: "4px",
                                fontSize: "13px",
                                fontWeight: "500",
                                display: "inline-block",
                                width: "100px",
                                textAlign: "center",
                              }}
                            >
                              Pending
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            verticalAlign: "middle",
                            fontSize: "14px",
                            borderBottom: "1px solid #dee2e6",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {l.status === "pending" ? (
                            <>
                              <button
                                className="btn btn-sm btn-outline-success me-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatus(l._id, "approved");
                                }}
                              >
                                Approve
                              </button>

                              <button
                                className="btn btn-sm btn-outline-danger me-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatus(l._id, "rejected");
                                }}
                              >
                                Reject
                              </button>

                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  HandleDelete(l._id);
                                }}
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>

      {selectedLeave && (
        <div
          className="modal fade show"
           ref={modalRef}
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="modal-dialog modal-dialog-centered" 
            ref={modalRef}
            style={{ maxWidth: "600px", width: "95%"}}
          >
            <div className="modal-content">
              {/* Header */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Leave Request Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedLeave(null)}
                />
              </div>

              {/* Body */}
              <div className="modal-body">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-sm-3 fw-semibold">Employee ID</div>
                    <div className="col-sm-9">
                      {selectedLeave.employee?.employeeId || "-"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-sm-3 fw-semibold">Name</div>
                    <div className="col-sm-9">
                      {selectedLeave.employee?.name || "-"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-sm-3 fw-semibold">Apply Date</div>
                    <div className="col-sm-9">
                      {selectedLeave.appliedAt
                        ? new Date(selectedLeave.appliedAt).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "-"}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-sm-3 fw-semibold">Leave Type</div>
                    <div className="col-sm-9">{selectedLeave.leaveType}</div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-sm-3 fw-semibold">Date From</div>
                    <div className="col-sm-9">
                      {new Date(selectedLeave.dateFrom).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-sm-3 fw-semibold">Date To</div>
                    <div className="col-sm-9">
                      {new Date(selectedLeave.dateTo).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-sm-3 fw-semibold">Duration</div>
                    <div className="col-sm-9">
                      {getLeaveDurationText(selectedLeave)}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-sm-3 fw-semibold">Reason</div>
                    <div
                      className="col-sm-9"
                      style={{
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      {selectedLeave.reason || "-"}
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-sm-3 fw-semibold">Status</div>
                    <div className="col-sm-9">
                      <span
                        className={
                          "badge text-capitalize " +
                          (selectedLeave.status === "approved"
                            ? "bg-success"
                            : selectedLeave.status === "rejected"
                              ? "bg-danger"
                              : "bg-warning text-dark")
                        }
                      >
                        {selectedLeave.status}
                      </span>
                    </div>
                  </div>
                  {/* //Added by Rutuja */}
                  {selectedLeave.status !== "pending" && (
                    <div className="row mb-2">
                      <div className="col-sm-3 fw-semibold">
                        {selectedLeave.status === "approved"
                          ? "Approved by"
                          : "Rejected by"}
                      </div>
                      <div className="col-sm-9">
                        {selectedLeave.approvedBy ? (
                          <>
                            {selectedLeave.approvedBy.name}
                            {selectedLeave.approvedBy.role &&
                              ` (${selectedLeave.approvedBy.role})`}
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer border-0 pt-0">
                {selectedLeave.status === "pending" && (
                  <>
                    <button
                      className="btn btn-sm btn-outline-success" // mahesh code approve button
                      style={{ width: 90 }}
                      onClick={() =>
                        updateStatus(selectedLeave._id, "approved")
                      }
                    >
                      Approve
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger" // mahesh code reject button
                      style={{ width: 90 }}
                      onClick={() =>
                        updateStatus(selectedLeave._id, "rejected")
                      }
                    >
                      Reject
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger" // mahesh code delete button
                      style={{ width: 90 }}
                      onClick={(e) => {
                        HandleDelete(selectedLeave._id);
                        setSelectedLeave(null);
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}

                <button
                  className="btn btn-sm custom-outline-btn" // mahesh code close button
                  style={{ width: 90 }}
                  onClick={() => setSelectedLeave(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Modern Pagination Section */}
      <nav className="d-flex align-items-center justify-content-end mt-3 text-muted p-3">
        <div className="d-flex align-items-center gap-3">
          {/* Rows per page */}
          <div className="d-flex align-items-center">
            <span style={{ fontSize: "14px", marginRight: "8px" }}>
              Rows per page:
            </span>
            <select
              className="form-select form-select-sm"
              style={{ width: "auto", fontSize: "14px" }}
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </div>

          {/* Page range */}
          {/* New Page range */}
          <span style={{ fontSize: "14px", marginLeft: "16px" }}>
            {filteredLeaves.length === 0 ? 0 : indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, filteredLeaves.length)} of{" "}
            {filteredLeaves.length}
          </span>

          {/* Navigation arrows */}
          <div
            className="d-flex align-items-center"
            style={{ marginLeft: "16px" }}
          >
            <button
              className="btn btn-sm focus-ring"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ fontSize: "18px", padding: "2px 8px" }}
            >
              ‹
            </button>
            <button
              className="btn btn-sm focus-ring"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{ fontSize: "18px", padding: "2px 8px" }}
            >
              ›
            </button>
          </div>
        </div>
      </nav>

      <div className="text-end">
        <button
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 90 }}
          onClick={() => window.history.go(-1)}
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default AdminAddLeaveBalance;
