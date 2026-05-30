import React, { useEffect, useState, useRef} from "react";
import axios from "axios";

function EmployeeMyLeave({ user, refreshKey,fetchNotifications}) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const [previewDaysMap, setPreviewDaysMap] = useState({});//prateek
  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [filteredLeaves, setFilteredLeaves] = useState([]);

  // ✅ NEW: State for weekly offs and holidays (to calculate duration correctly)
  const [weeklyOffs, setWeeklyOffs] = useState({ saturdays: [1, 3, 5], sundayOff: true }); // Default fallback
  const [publicHolidays, setPublicHolidays] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);

  const [selectedLeave, setSelectedLeave] = useState(null);

  // ✅ NEW: Fetch weekly offs (matches EmployeeApplyLeave.jsx)
  useEffect(() => {
    const fetchWeeklyOffs = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/admin/weeklyoff/${new Date().getFullYear()}`);
        const weeklyData = res.data?.data || res.data || {};
        const saturdayOffs = weeklyData.saturdays || [1, 3, 5];
        const sundayOff = true; // Sundays always off
        setWeeklyOffs({ saturdays: saturdayOffs, sundayOff });
      } catch (err) {
        console.error("❌ Error fetching weekly offs:", err);
        setWeeklyOffs({ saturdays: [1, 3, 5], sundayOff: true }); // Fallback
      }
    };
    fetchWeeklyOffs();
  }, []);

  const popupRef = useRef(null);
  useEffect(() => {
    if (selectedLeave && popupRef.current) {
      popupRef.current.focus();
    }
  }, [selectedLeave]);

  const trapFocus = (e) => {
    if (!popupRef.current) return;

    const focusableElements = popupRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

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


  // ✅ NEW: Fetch public holidays (matches EmployeeApplyLeave.jsx)
  useEffect(() => {
    const fetchPublicHolidays = async () => {
      setLoadingHolidays(true);
      try {
        const res = await axios.get(`http://localhost:8000/getHolidays`);
        const holidays = res.data.map(h => h.date); // Extract YYYY-MM-DD strings
        setPublicHolidays(holidays);
      } catch (err) {
        console.error("❌ Error fetching public holidays:", err);
        setPublicHolidays([]);
        alert("⚠️ Unable to load holidays. Duration calculations may be inaccurate.");
      } finally {
        setLoadingHolidays(false);
      }
    };
    fetchPublicHolidays();
  }, []);

  // ✅ UPDATED: Fetch leaves (unchanged, but ensure it runs after data loads)
  useEffect(() => {
    if (loadingHolidays) return;
  
    const fetchLeaves = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/leave/my/${user._id}`
        );
    console.log(res.data)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
  
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3);
;
        const filteredByDate = res.data.filter((l) => {
          const appliedDate = new Date(l.appliedAt || l.createdAt);
          appliedDate.setHours(0, 0, 0, 0);
          return appliedDate >= threeMonthsAgo && appliedDate <= today;
        });
  
        const leavesData = filteredByDate.sort(
          (a, b) =>
            new Date(b.appliedAt || b.createdAt) -
            new Date(a.appliedAt || a.createdAt)
        );
  
        const allIds = [
          ...new Set(
            leavesData.flatMap((l) => [
              l.reportingManager,
              l.reportingManagerId,
              l.approver,
              l.approvedBy,
              l.approvedById,
              l.rejectedBy,
              l.rejectedById,
            ].filter(Boolean))
          ),
        ];
  
        const usersMap = {};
  
        await Promise.all(
          allIds.map(async (id) => {
            try {
              const r = await axios.get(
                `http://localhost:8000/users/${id}`
              );
              usersMap[id] = r.data?.name || "N/A";
            } catch {
              usersMap[id] = "N/A";
            }
          })
        );
  
        // ✅ FINAL DATA PREP
        const leavesWithNames = leavesData.map((leave) => {
          const reportingManagerId =
            leave.reportingManager || leave.reportingManagerId;
          const approverId =
            leave.approver || leave.approvedBy || leave.approvedById;
          const rejectedById =
            leave.rejectedBy || leave.rejectedById;
  
          const reportingManagerName =
            usersMap[reportingManagerId] || "N/A";
          const approverName = usersMap[approverId] || "N/A";
          const rejectedByName = usersMap[rejectedById] || "N/A";
  
          let approverDisplay = "N/A";
          const status = (leave.status || "").toLowerCase();
  
          if (status === "pending") {
            approverDisplay = reportingManagerName;
          } else if (status === "approved") {
            approverDisplay =
              approverName !== "N/A"
                ? approverName
                : reportingManagerName;
          } else if (status === "rejected") {
            approverDisplay =
              rejectedByName !== "N/A"
                ? rejectedByName
                : approverName !== "N/A"
                ? approverName
                : reportingManagerName;
          } else {
            approverDisplay =
              approverName || reportingManagerName || "N/A";
          }
  
          return {
            ...leave,
             actionReason: leave.actionReason,
            reportingManagerName,
            approverName,
            rejectedByName,
            approverDisplay,
          };
        });
  
        setLeaves(leavesWithNames);
      } catch (err) {
        console.error("Error fetching leaves:", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchLeaves();
  }, [user, refreshKey, loadingHolidays]); // ✅ Added loadingHolidays dependency

  useEffect(() => {
    setFilteredLeaves(leaves);
  }, [leaves]);

  useEffect(() => {
    if (selectedLeave ) {
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


  // ✅ Pagination logic (unchanged)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeaves = filteredLeaves.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);

  const applyFilters = () => {
    let temp = [...leaves];
    if (statusFilter !== "All") {
      temp = temp.filter(l => (l.status || "").toLowerCase() === statusFilter.toLowerCase());
    }
    if (dateFromFilter) {
      temp = temp.filter(l => new Date(l.dateFrom) >= new Date(dateFromFilter));
    }
    if (dateToFilter) {
      temp = temp.filter(l => new Date(l.dateTo) <= new Date(dateToFilter));
    }
    setFilteredLeaves(temp);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setStatusFilter("All");
    setDateFromFilter("");
    setDateToFilter("");
    setFilteredLeaves(leaves);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // prateek code 
  // useEffect(() => {
  //   const fetchPreview = async () => {
  //     const map = {};
  
  //     for (let leave of leaves) {
  //       try {
  //         const res = await axios.post(
  //           "http://localhost:8000/leave/calculate",
  //           {
  //             // employeeId: leave.employee,
  //             employeeId:
  //               typeof leave.employee === "object"
  //               ? leave.employee._id
  //               : leave.employee,
  //             // start: leave.dateFrom,
  //             // end: leave.dateTo,
  //             dateFrom: leave.dateFrom,
  //             dateTo: leave.dateTo,
  //             leaveType: leave.leaveType,
  //           }
  //         );
  
  //         map[leave._id] = res.data.totalDays;
  //       } catch (err) {
  //         map[leave._id] = leave.totalDays || 1;
  //       }
  //     }
  
  //     setPreviewDaysMap(map);
  //   };
  
  //   if (leaves.length > 0) {
  //     fetchPreview();
  //   }
  // }, [leaves]);
  
  
  

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center mt-5" style={{ height: "100vh", width: "100%", position: "absolute", top: 0, left: 0 }}>
        <div className="spinner-grow" role="status" style={{ width: "4rem", height: "4rem", color: "#3A5FBE" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 fw-semibold" style={{ color: "#3A5FBE" }}>Loading ...</p>
      </div>
    );
  }

  // if (leaves.length === 0) return <p>No leave applications found.</p>;

  // ✅ NEW: Function to get correct duration
  

  const handleDelete = async (id) => {
    const leave = leaves.find((x) => x._id === id);
    if (!leave) return;
    if (leave.status !== "pending") {
      alert("Only pending leaves can be deleted.");
      return;
    }
    const ok = window.confirm("Delete this pending leave?");
    if (!ok) return;
    setDeletingId(id);
    const prevLeaves = leaves;
    setLeaves((ls) => ls.filter((x) => x._id !== id));
    try {
      const res = await fetch(`http://localhost:8000/leave/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setLeaves(prevLeaves);
        fetchNotifications();
        alert("Failed to delete leave");
      }
      else {
        fetchNotifications();
        alert("Leave deleted successfully.");
      }
    } catch (err) {
      setLeaves(prevLeaves);
      alert(err.message || "Something went wrong while deleting.");
    } finally {
      setDeletingId(null);
    }
  };
//   const calculateDays = (from, to) => {
//   const start = new Date(from);
//   const end = new Date(to);

//   const diffTime = end - start;
//   const diffDays = diffTime / (1000 * 60 * 60 * 24) + 1;

//   return diffDays > 0 ? diffDays : 0;
// };
  
  return (
    <>
      {/* ✅ CSS INSIDE JSX */}
      <style>{`
        .filter-control {
          height: 42px;
          width: 100%;
        }

        .status-badge {
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
          max-width: 100%;
          white-space: normal;
          word-break: break-word;
          text-align: center;
        }

        .badge-approved { background:#d1f2dd; }
        .badge-rejected { background:#f8d7da; }
        .badge-pending { background:#ffe493; }

        @media (max-width: 576px) {
          .card-body {
            padding: 12px;
          }
        }
      `}</style>
    
    <div>
      <div className="card mb-4 mt-3 shadow-sm border-0">
        <div className="card-body">
         <form
            className="row g-2 align-items-center"
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters();
            }}
          >
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-2">
              <label
                htmlFor="statusFilter"
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  width: "50px",
                  minWidth: "50px",
                }}
              >
                Status
              </label>
              <select
                id="statusFilter"
                className="form-select"
                style={{ minWidth: 100 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="col-12 col-md-auto d-flex align-items-center mb-1 ms-2">
              <label
                htmlFor="dateFromFilter"
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  width: "50px",
                  minWidth: "50px",
                  marginRight: "8px",
                }}
              >
                From
              </label>
              <input
                id="dateFromFilter"
                type="date"
                className="form-control"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                style={{ minWidth: "140px" }}
              />
            </div>
            <div className="col-12 col-md-auto d-flex align-items-center mb-1 ms-2">
              <label
                htmlFor="dateToFilter"
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  width: "50px",
                  fontSize: "16px",
                  color: "#3A5FBE",
                  minWidth: "50px",
                  marginRight: "8px",
                }}
              >
                To
              </label>
             <input
  id="dateToFilter"
  type="date"
  className="form-control"
  value={dateToFilter}
  min={dateFromFilter}   // ✅ IMPORTANT
  onChange={(e) => setDateToFilter(e.target.value)}
/>
            </div>

            <div className="col-auto ms-auto d-flex gap-2">
              <button
                type="submit"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
              >
                Filter
              </button>
              <button
                type="button"
                // className="btn btn-primary"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
                onClick={resetFilters}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        className="table-responsive mt-3"
        style={{
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          borderRadius: "8px",
        }}
      >
        {/* <table className="table table-hover mb-0">
          <thead style={{ backgroundColor: "#f8f9fa" }}> */}
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
                Leave Type
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
                Reason for Leave
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
              Actioned By
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
            {currentLeaves.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  className="text-center py-4"
                  style={{ color: "#6c757d" }}
                >
                  No leaves requests found.
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
                    {new Date(l.appliedAt).toLocaleDateString("en-GB", {
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
                   {/* {calculateDays(l.dateFrom, l.dateTo)} */}
                   {/* {l.status === "approved" ? (l.totalDays ?? 1) : (previewDaysMap[l._id] ?? l.totalDays ?? 1)} */}
                   {/* {l.duration === "half"
                          ? "0.5"
                          : l.isSandwich && l.totalDays === 0
                          ? "Sandwich Leave"
                          : l.totalDays} */}
                      {l.isMerged
                        ? "Merged Leave"
                        : (l.totalDays ?? 1)}
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
                      textTransform: "capitalize",
                    }}
                  >
                    {l.approverDisplay || "N/A"}
                  </td>

                  <td
                    style={{
                      padding: "12px",
                      verticalAlign: "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                  >
                    {l.status === "pending" && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        aria-label="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(l._id);
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* select table model box */}

      {selectedLeave && (
        <div
        ref={popupRef}
          tabIndex="-1"
          autoFocus
          onKeyDown={trapFocus}
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="modal-dialog modal-dialog-centered" 
            style={{ maxWidth: "600px", width: "95%"}}
          >
            {" "}
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
                    <div className="col-5 col-sm-3 fw-semibold">Leave Type</div>
                    <div className="col-sm-9 col-7">
                      {selectedLeave.leaveType}
                    </div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Date From</div>
                    <div className="col-sm-9 col-7">
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
                    <div className="col-5 col-sm-3 fw-semibold">Date To</div>
                    <div className="col-sm-9 col-7">
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
                    <div className="col-5 col-sm-3 fw-semibold">Duration</div>
                    <div className="col-sm-9 col-7">
                     {/* {calculateDays(selectedLeave.dateFrom, selectedLeave.dateTo)} */}
                     {/* {selectedLeave.totalDays} */}
                     {selectedLeave.isSandwich && selectedLeave.totalDays === 0
                          ? "Sandwich leave calculated in previous applied leave"
                          : `${selectedLeave.totalDays} ${
                          selectedLeave.totalDays === 1 ? "day" : "days"
                          }`}
                    </div>
                  </div>

                      <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">Reason</div>
                    <div
                      className="col-sm-9 col-7"
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
                    <div className="col-5 col-sm-3 fw-semibold">Status</div>
                    <div className="col-sm-9 col-7">
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

                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">
                  {selectedLeave.status === "approved"
                    ? "Approved By"
                    : selectedLeave.status === "rejected"
                    ? "Rejected By"
                    : "Reviewed By"}
                </div>
                    <div
                      className="col-sm-9 col-7"
                      style={{
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        textTransform: "capitalize",
                      }}
                    >
                      {selectedLeave.approverName || "-"}
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold">
                      Action Reason
                    </div>

                    <div
                      className="col-sm-9 col-7"
                      style={{
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      {selectedLeave.actionReason || "-"}
                    </div>
                  </div>

                  

                 
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer border-0 pt-0">
                {selectedLeave.status === "pending" && (
                  <button
                    className="btn btn-outline-danger btn-sm "
                    style={{ minWidth: 90 }}
                    onClick={() => {
                      handleDelete(selectedLeave._id);
                      setSelectedLeave(null); // close modal after delete
                    }}
                  >
                    Delete
                  </button>
                )}

                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={() => setSelectedLeave(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Pagination controls */}
        {/* ✅ Pagination controls */}
      <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
        <div className="d-flex align-items-center gap-3">
          {/* Rows per page dropdown */}
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

          {/* Page range display */}
          <span style={{ fontSize: "14px", marginLeft: "16px" }}>
            {filteredLeaves.length === 0
              ? "0–0 of 0"
              : `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredLeaves.length)} of ${filteredLeaves.length}`}
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

      <div className="text-end mt-3">
        <button
          style={{ minWidth: 90 }}
          className="btn btn-sm custom-outline-btn"
          onClick={() => window.history.go(-1)}
        >
          Back
        </button>
      </div>
    </div>
    </>
  );
}

export default EmployeeMyLeave;
 