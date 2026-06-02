import { useState, useEffect, useRef } from "react";
import Select from "react-select";

function Performances({ user }) {
  const [showModal, setShowModal] = useState(false);
  const [userName, setUserName] = useState("");
  const [userID, setUserID] = useState("");
  const [userDescription, setUserDescription] = useState("");
  const [manager, setManager] = useState("");
  const [managerId, setManagerId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [department, setDepartment] = useState("");
  const [durationType, setDurationType] = useState("");
  const [durationDate, setDurationDate] = useState("");
  const [errors, setErrors] = useState({});
  const [selectedPerformance, setSelectedPerformance] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  // New states for pending requests and active view
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allPendingRequests, setAllPendingRequests] = useState([]);//rutuja
  const [pendingLoading, setPendingLoading] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
  const [pendingItemsPerPage, setPendingItemsPerPage] = useState(5);
  const [activeView, setActiveView] = useState("all"); // "all" or "pending"

  // rutuja code start
  const [pendingSearchTerm, setPendingSearchTerm] = useState("");
  const [pendingStatusFilter, setPendingStatusFilter] = useState("All");
  const modalRef = useRef(null);        
  const createModalRef = useRef(null);
const [tl, setTl] = useState("");
  const [tlId, setTlId] = useState(null);
  useEffect(() => {
    const isAnyModalOpen = selectedPerformance || showModal;

    if (isAnyModalOpen) {
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
  }, [selectedPerformance, showModal]);

  useEffect(() => {
    if (!selectedPerformance || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];
    
    modal.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setSelectedPerformance(null);
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
    return () => modal.removeEventListener("keydown", handleKeyDown);
  }, [selectedPerformance]);

  useEffect(() => {
    if (!showModal || !createModalRef.current) return;

    const modal = createModalRef.current;
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];
    
    modal.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setShowModal(false);
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
    return () => modal.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

  // Check user role for admin permissions
  const isAdminRole = ["admin", "hr", "ceo", "coo", "md"].includes(user?.role);

  useEffect(() => {
    console.log("User prop in Performances:", user);
    console.log("User role:", user?.role);
    console.log("Is admin role:", isAdminRole);
  }, [user]);

  // Reset Form Data
  const resetForm = () => {
    setSelectedEmployee(null);
    setUserName("");
    setUserID("");
    setManager("");
    setManagerId(null);
    setDepartment("");
    setDurationType("");
    setDurationDate("");
    setUserDescription("");
    setErrors({});
    setTl(""); 
    setTlId(null);
  };

  // Fetch employees for dropdown
  useEffect(() => {
    if (showModal) {
      fetch("https://ems-tms-server-new.vercel.app/employees/teams")
        .then((res) => res.json())
        .then((data) => {
          console.log("EMPLOYEES:", data.employees);
          if (data.success) {
            const options = data.employees.map((emp) => ({
              value: emp.employeeId,
              label: emp.name,
              manager: emp.reportingManager?.name || "",
              managerId: emp.reportingManager?._id || null,
              teamLeads: emp.teamLeads || [],
              teamLeadNames: emp.teamLeadNames || "Not Assigned",
              department: emp.department || "N/A",
            }));
            setEmployeeOptions(options);
          }
        })
        .catch((err) => console.error("API error:", err));
    }
  }, [showModal]);

  // Fetch all performance requests on component load
  useEffect(() => {
    fetchPerformanceRequests();
  }, []);

  // Fetch pending requests when activeView changes to "pending"
  useEffect(() => {
    if (activeView === "pending" && isAdminRole) {
      fetchPendingRequests();
    }
  }, [activeView, isAdminRole]);

  const fetchPerformanceRequests = async () => {
    try {
      const res = await fetch("https://ems-tms-server-new.vercel.app/performance/getrequests", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data);
        setAllEmployees(data.data);
      }
    } catch (err) {
      console.error("Fetch list error:", err);
    }
  };

  // Fetch pending requests for admin
  const fetchPendingRequests = async () => {
    if (!isAdminRole) return;

    setPendingLoading(true);
    try {
      const res = await fetch(
        "https://ems-tms-server-new.vercel.app/performance/admin/pending",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );
      const data = await res.json();
      console.log("Pending requests API response:", data);
      if (data.success) {
        setPendingRequests(data.data);
        setAllPendingRequests(data.data);//rutuja
        console.log("Pending requests fetched:", data.data.length);
      } else {
        console.error("Failed to fetch pending requests:", data.message);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    } finally {
      setPendingLoading(false);
    }
  };

  // Handle approve request
  const handleApproveRequest = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to approve this performance request?",
      )
    )
      return;

    setProcessingRequest(id);
    try {
      const res = await fetch(
        `https://ems-tms-server-new.vercel.app/performance/${id}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await res.json();

      if (data.success) {
        alert("Performance request approved successfully!");
        // Refresh both lists
        fetchPerformanceRequests();
        if (activeView === "pending") {
          fetchPendingRequests();
        }
      } else {
        alert(data.message || "Failed to approve request");
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("Something went wrong while approving");
    } finally {
      setProcessingRequest(null);
    }
  };

  // Handle reject request
  const handleRejectRequest = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to reject this performance request?",
      )
    )
      return;

    setProcessingRequest(id);
    try {
      const res = await fetch(
        `https://ems-tms-server-new.vercel.app/performance/${id}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await res.json();

      if (data.success) {
        alert("Performance request rejected successfully!");
        // Refresh both lists
        fetchPerformanceRequests();
        if (activeView === "pending") {
          fetchPendingRequests();
        }
      } else {
        alert(data.message || "Failed to reject request");
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("Something went wrong while rejecting");
    } finally {
      setProcessingRequest(null);
    }
  };

  // Delete performance
  const handleDeletePerformance = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?"))
      return;

    try {
      const res = await fetch(`https://ems-tms-server-new.vercel.app/performance/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        alert("Performance request deleted successfully");
        // Refresh list
        fetchPerformanceRequests();
        if (activeView === "pending" && isAdminRole) {
          fetchPendingRequests();
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Something went wrong while deleting");
    }
  };

  // Status color classes
  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-warning text-dark";
      case "Added":
        return "bg-success text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  // Admin status color classes
  const getAdminStatusClass = (adminStatus) => {
    switch (adminStatus) {
      case "pending":
        return "bg-warning text-dark";
      case "approved":
        return "bg-success text-white";
      case "rejected":
        return "bg-danger text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  // Global Search
  const filteredEmployees = employees.filter((emp) =>
    Object.values(emp)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

    // rutuja code start
    const filterPendingRequests = () => {
      let filtered = [...allPendingRequests];
  
      if (pendingStatusFilter !== "All") {
        filtered = filtered.filter(
          (item) =>
            item.adminStatus &&
            item.adminStatus.toLowerCase().trim() ===
              pendingStatusFilter.toLowerCase().trim(),
        );
      }
  
      if (pendingSearchTerm) {
        filtered = filtered.filter((emp) =>
          Object.values(emp)
            .join(" ")
            .toLowerCase()
            .includes(pendingSearchTerm.toLowerCase())
        );
      }
  
      setPendingRequests(filtered);
      setPendingCurrentPage(1);
    };
  
  
    const resetPendingFilters = () => {
      setPendingStatusFilter("All");
      setPendingSearchTerm("");
      setPendingRequests(allPendingRequests);
      setPendingCurrentPage(1);
    };
  
  
const handleSectionChange = (section) => {
  setActiveView(section);

  // reset all request filters
  setSearchTerm("");
  setStatusFilter("All");
  setEmployees(allEmployees);

  // reset manager request filters
  setPendingSearchTerm("");
  setPendingStatusFilter("All");
  setPendingRequests(allPendingRequests);

  // reset pagination
  setCurrentPage(1);
  setPendingCurrentPage(1);
};

  // Submit request
  const submitRequest = async () => {
    if (submitting) return;
    let newErrors = {};

    // Validation
    if (!selectedEmployee || !userID) {
      newErrors.employee = "Please select an employee";
    }

    if (!managerId || managerId.trim() === "") {
      newErrors.manager =
        "Manager not assigned. Please select another employee.";
    }
    if (!tlId || tlId.trim() === "") {
    newErrors.tl = "Team Lead not assigned. Please select another employee.";
    }

    if (!durationType) {
      newErrors.durationType = "Please select a duration type";
    }

    if (!durationDate) {
      newErrors.durationDate =
        durationType === "Monthly"
          ? "Please select a month"
          : "Please select a date";
    }

    if (!userDescription || userDescription.trim() === "") {
      newErrors.description = "Description is required";
    } else if (userDescription.length > 250) {
      newErrors.description = "Description cannot exceed 250 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    // Payload
    const payload = {
      employeeId: userID,
      employeeName: userName,
      department: department,
      manager: manager,
      managerId,
      teamLead: tl, 
      teamLeadId: tlId,
      durationType: durationType,
      durationDate: durationDate,
      description: userDescription,
      createdBy: user?._id || "",
      createdByName: user?.name || "",
      createdByRole: user?.role || "",
      adminStatus: "pending", // Add adminStatus field
    };

    try {
      const res = await fetch("https://ems-tms-server-new.vercel.app/performance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert("Performance request created successfully");
        // Refresh lists
        fetchPerformanceRequests();
        // If admin is viewing pending requests, refresh that too
        if (isAdminRole && activeView === "pending") {
          fetchPendingRequests();
        }
        resetForm();
        setShowModal(false);
      } else {
        alert(data.message || "Failed to create performance request");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Something went wrong while submitting the request");
    }
    finally {
      setSubmitting(false); 
    }
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = [...allEmployees];

    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (item) =>
          item.status &&
          item.status.toLowerCase().trim() ===
            statusFilter.toLowerCase().trim(),
      );
    }

    if (dateFromFilter) {
      filtered = filtered.filter(
        (item) => new Date(item.durationDate) >= new Date(dateFromFilter),
      );
    }
    if (dateToFilter) {
      filtered = filtered.filter(
        (item) => new Date(item.durationDate) <= new Date(dateToFilter),
      );
    }

    if (searchTerm) {
      filtered = filtered.filter((emp) =>
        Object.values(emp)
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    setEmployees(filtered);
    setCurrentPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter("All");
    setDateFromFilter("");
    setSearchTerm(""); //rutuja
    setDateToFilter("");
    setEmployees(allEmployees);
    setCurrentPage(1);
  };

  // Pagination for main table
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPerformances = employees.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(employees.length / itemsPerPage);

  // Pagination for pending table
  const pendingIndexOfLastItem = pendingCurrentPage * pendingItemsPerPage;
  const pendingIndexOfFirstItem = pendingIndexOfLastItem - pendingItemsPerPage;
  const currentPendingPerformances = pendingRequests.slice(
    pendingIndexOfFirstItem,
    pendingIndexOfLastItem,
  );
  const pendingTotalPages = Math.ceil(
    pendingRequests.length / pendingItemsPerPage,
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePendingPageChange = (page) => {
    if (page >= 1 && page <= pendingTotalPages) {
      setPendingCurrentPage(page);
    }
  };

  // User welcome message
  const getUserWelcomeMessage = () => {
    if (!user) return "Performance Management";

    const roleMap = {
      hr: "HR",
      admin: "Admin",
      manager: "Manager",
      employee: "Employee",
      ceo: "CEO",
      coo: "COO",
      md: "MD",
      IT_Support: "IT Support",
    };

    const roleName = roleMap[user.role] || user.role;
    return `${roleName} Performance Management`;
  };

  return (
    <div className="container-fluid p-2">
      {/* HEADER WITH BUTTONS AFTER HEADING */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2
          style={{
            color: "#3A5FBE",
            fontSize: "25px",

            // marginBottom: "40px",
          }}
        >
          Performance
        </h2>
        {/* HR Only: Add Request Button */}
        {user?.role === "hr" && (
            <button
              className="btn btn-sm custom-outline-btn"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              + Request Performance Details
            </button>
          )}
        {/* mahesh code header change font size */}
      </div>

      <div className="d-flex flex-wrap gap-2 justify-content-center mb-3">
  {isAdminRole && (
    <>
      <button
        type="button"
        className="btn btn-sm"
        style={{
          backgroundColor:
            activeView === "all" ? "#3A5FBE" : "transparent",
          border: "1px solid #3A5FBE",
          color:
            activeView === "all" ? "#fff" : "#3A5FBE",
          minWidth: "120px",
        }}
     onClick={() => handleSectionChange("all")}
      >
        All Requests
      </button>

      <button
        type="button"
        className="btn btn-sm"
        style={{
          backgroundColor:
            activeView === "pending" ? "#3A5FBE" : "transparent",
          border: "1px solid #3A5FBE",
          color:
            activeView === "pending" ? "#fff" : "#3A5FBE",
          minWidth: "120px",
        }}
      onClick={() => {
  handleSectionChange("pending");

  if (pendingRequests.length === 0) {
    fetchPendingRequests();
  }
}}
      >
        Manager Requests
      </button>
    </>
  )}
</div>
     

      {/* FILTER BAR (only for "All Requests" view) */}
      {activeView === "all" && (
        <div className="card mb-4 mt-3 shadow-sm border-0">
          <div className="card-body">
            <form
              className="row g-2 align-items-center"
              onSubmit={(e) => {
                e.preventDefault();
                applyFilters();
              }}
            >
              {/* STATUS */}
              <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-2">
                <label className="fw-bold mb-0" style={{ color: "#3A5FBE" }}>
                  Status
                </label>
                <select
                  className="form-select"
                  style={{ minWidth: 120 }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Added">Added</option>
                </select>
              </div>

              {/* FROM */}
              {/* <div className="col-12 col-md-auto d-flex align-items-center mb-1 ms-2">
                <label
                  className="fw-bold mb-0 me-2"
                  style={{ color: "#3A5FBE" }}
                >
                  From
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                />
              </div>

              <div className="col-12 col-md-auto d-flex align-items-center mb-1 ms-2">
                <label
                  className="fw-bold mb-0 me-2"
                  style={{ color: "#3A5FBE" }}
                >
                  To
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                />
              </div> */}

              <div className="col-12 col-md-auto d-flex align-items-center mb-1 ms-2">
                <label
                  className="fw-bold mb-0 me-2"
                  style={{ color: "#3A5FBE" }}
                >
                  Search
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  style={{ maxWidth: "600px" }} //mahesh coded search bar size increase
                  placeholder="Search by any field"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* BUTTONS */}
              <div className="col-auto ms-auto d-flex gap-2">
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
                  onClick={resetFilters}
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL for Creating Request (HR Only) */}
      {showModal && user?.role === "hr" && (
        <>
          <div
            className="modal fade show d-block"
            style={{ background: "rgba(0,0,0,0.5)" }}
            ref={createModalRef}  
            tabIndex="-1" 
          >
            <div className= "modal-dialog modal-lg modal-dialog-centered"
          style={{
            maxWidth: "600px", width: "95%"
          }}>
              <div className="modal-content">
                <div
                  className="modal-header"
                  style={{ backgroundColor: "#3A5FBE" }}
                >
                  <h5 className="modal-title text-white">
                    Request Performance Details
                  </h5>
                  <button
                    className="btn-close btn-close-white"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <div className="modal-body" style={{ maxHeight: "60vh" }}>
                  <label className="form-label">Employee Name<span className="text-danger"> *</span></label>
                  <div style={{ position: "relative", zIndex: 1050 }}>
                    <Select
                      options={employeeOptions}
                      value={selectedEmployee}
                      placeholder="Search employee..."
                      isSearchable
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                        menu: (base) => ({
                          ...base,
                          zIndex: 99999,
                        }),
                      }}
                      onChange={(selected) => {
                        setSelectedEmployee(selected);
                        setUserName(selected.label);
                        setUserID(selected.value);
                        setManager(selected.manager);
                        setDepartment(selected.department);
                        setManagerId(selected.managerId);
                        if (selected.teamLeads && selected.teamLeads.length > 0) {
                          setTl(selected.teamLeadNames); 
                          setTlId(selected.teamLeads[0]?._id || null);
                        } else {
                          setTl("Not Assigned");
                          setTlId(null);
                        }
                        setErrors((prev) => ({
                          ...prev,
                          employee: "",
                          manager: "",
                        }));
                      }}
                    />
                  </div>

                  <label className="form-label mt-3">Employee ID</label>
                  <input
                    className={`form-control ${errors.employee ? "is-invalid" : ""}`}
                    value={userID}
                    disabled
                  />
                  {errors.employee && (
                    <div className="invalid-feedback">{errors.employee}</div>
                  )}

            
                  <label className="form-label mt-3">Team Lead</label>
                  <input
                    className={`form-control ${errors.tl ? "is-invalid" : ""}`}
                    value={tl || "Not Assigned"}
                    disabled
                  />
                  {errors.tl && (
                    <div className="invalid-feedback">{errors.tl}</div>
                  )}
                  {errors.manager && (
                    <div className="invalid-feedback">{errors.manager}</div>
                  )}

                  <label className="form-label mt-3">Department</label>
                  <input className="form-control" value={department} disabled />

                  <label className="form-label mt-3">Duration Type<span className="text-danger"> *</span></label>
                  <select
                    className={`form-control ${errors.employee ? "is-invalid" : ""}`}
                    value={durationType}
                    onChange={(e) => {
                      setDurationType(e.target.value);
                      setDurationDate("");
                      if (e.target.value) {
                        setErrors((prev) => ({ ...prev, durationType: "" }));
                      }
                    }}
                  >
                    <option value="">Select Duration</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                  {errors.durationType && (
                    <div className="invalid-feedback">
                      {errors.durationType}
                    </div>
                  )}

                  <label className="form-label mt-3">
                    {durationType === "Monthly"
                      ? "Select Month"
                      : durationType === "Weekly"
                        ? "Select Week Start Date"
                        : "Select Date"}
                  </label>

                  <input
                    type={durationType === "Monthly" ? "month" : "date"}
                    className={`form-control ${errors.durationDate ? "is-invalid" : ""}`}
                    value={durationDate}
                    disabled={!durationType}
                    onChange={(e) => {
                      setDurationDate(e.target.value);
                      if (e.target.value) {
                        setErrors((prev) => ({ ...prev, durationDate: "" }));
                      }
                    }}
                  />
                  {errors.durationDate && (
                    <div className="invalid-feedback">
                      {errors.durationDate}
                    </div>
                  )}

                  <label className="form-label mt-3">
                    Description <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className={`form-control ${errors.description ? "is-invalid" : ""}`}
                    rows="3"
                    value={userDescription}
                    maxLength={250} 
                    placeholder="Type description (max 250 characters)"
                    onChange={(e) => {
                      setUserDescription(e.target.value);
                      if (e.target.value.trim() !== "") {
                        setErrors((prev) => ({ ...prev, description: "" }));
                      }
                    }}
                  ></textarea>
                  {errors.description && (
                    <div className="invalid-feedback">{errors.description}</div>
                  )}

                  <div
                    className="text-end text-muted"
                    style={{ fontSize: "12px" }}
                  >
                    {userDescription.length}/250
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{ minWidth: 90 }}
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm custom-outline-btn"
                      style={{ minWidth: 90 }}
                    onClick={submitRequest}
                    disabled={submitting}
                  >
                    {submitting ? "Submit" : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* MANAGER PENDING REQUESTS TABLE (Shown when activeView is "pending") */}
      {activeView === "pending" && isAdminRole && (
        <>
        
         <div className="card mb-4 mt-3 shadow-sm border-0">
            <div className="card-body">
              <form
                className="row g-2 align-items-center"
                onSubmit={(e) => {
                  e.preventDefault();
                  filterPendingRequests();
                }}
              >
                <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-2">
                  <label className="fw-bold mb-0" style={{ color: "#3A5FBE" }}>
                    Status
                  </label>
                  <select
                    className="form-select"
                    style={{ minWidth: 120 }}
                    value={pendingStatusFilter}
                    onChange={(e) => setPendingStatusFilter(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="col-12 col-md-auto d-flex align-items-center mb-1 ms-2">
                  <label
                    className="fw-bold mb-0 me-2"
                    style={{ color: "#3A5FBE" }}
                  >
                    Search
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    style={{ maxWidth: "600px" }}
                    placeholder="Search by any field"
                    value={pendingSearchTerm}
                    onChange={(e) => setPendingSearchTerm(e.target.value)}
                  />
                </div>

                {/* BUTTONS */}
                <div className="col-auto ms-auto d-flex gap-2">
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
                    onClick={resetPendingFilters}
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>


          <h4 className="mt-4 mb-3" style={{ color: "#3A5FBE" }}>
            Pending Requests for Approval
          </h4>

         

          {pendingLoading ? (
            <div className="text-center p-4">
              <p className="mt-2">Loading pending requests...</p>
            </div>
          ) : (
            <>
              <div
                className="table-responsive mt-3"
                style={{
          
                  borderRadius: "8px",
                }}
              >
                <table className="table table-hover align-middle mb-0 bg-white">
                  <thead style={{ backgroundColor: "#FFF8E1" }}>
                    <tr>
                      {[
                        "Request ID",
                        "Employee",
                        "Manager",
                        // "Department",
                        "Duration",
                        "Rating",
                        "Remark",
                        "Admin Status",
                        "Action",
                      ].map((h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                        {pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-4 text-muted">
                      No performance requests found.
                    </td>
                  </tr>
                ) : (
                    currentPendingPerformances.map((emp, index) => (
                      <tr
                        key={emp._id || index}
                        onClick={() => setSelectedPerformance(emp)}
                        style={{ cursor: "pointer" }}
                      >
                        <td style={tdStyle()}>{emp.requestId}</td>
                        <td style={tdStyle()}>{emp.employeeName}</td>
                        <td style={tdStyle()}>{emp.manager}</td>
                        {/* <td style={tdStyle()}>{emp.department}</td> */}
                        <td style={tdStyle()}>
                          {emp.durationType} –{" "}
                          {emp.durationType === "Monthly"
                            ? new Date(emp.durationDate).toLocaleString(
                                "default",
                                {
                                  month: "long",
                                  year: "numeric",
                                },
                              )
                            : new Date(emp.durationDate).toLocaleDateString()}
                        </td>
                        <td style={tdStyle()}>{emp.rating ?? "-"}</td>
                        <td style={{
                        ...tdStyle(),
                       verticalAlign: "middle",
                      borderBottom: "1px solid #dee2e6",
                      maxWidth: "100px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      }}>
                        {emp.description}
                      </td>
                        <td style={tdStyle()}>
                          <span
                            style={{
                              backgroundColor:
                                emp.adminStatus === "pending"
                                  ? "#FFE493"
                                  : emp.adminStatus === "approved"
                                    ? "#d1f2dd"
                                    : "#ffcccc",
                              padding: "6px 14px",
                              borderRadius: "4px",
                              fontSize: "13px",
                              fontWeight: 500,
                              display: "inline-block",
                              minWidth: "90px",
                              textAlign: "center",
                            }}
                          >
                            {emp.adminStatus
                              ? emp.adminStatus.charAt(0).toUpperCase() +
                                emp.adminStatus.slice(1)
                              : "Pending"}
                          </span>
                        </td>
                        <td style={tdStyle()}>
                          {emp.adminStatus === "pending" && (
                            <div className="d-flex gap-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                style={{minWidth :"90px"}}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApproveRequest(emp._id);
                                }}
                                disabled={processingRequest === emp._id}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                style={{minWidth :"90px"}}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectRequest(emp._id);
                                }}
                                disabled={processingRequest === emp._id}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
  )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION for Pending Requests */}
              <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center">
                    <span style={{ fontSize: "14px", marginRight: "8px" }}>
                      Rows per page:
                    </span>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: "auto", fontSize: "14px" }}
                      value={pendingItemsPerPage}
                      onChange={(e) => {
                        setPendingItemsPerPage(Number(e.target.value));
                        setPendingCurrentPage(1);
                      }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                    </select>
                  </div>

                  <span style={{ fontSize: "14px" }}>
                    {pendingRequests.length === 0
                      ? "0–0 of 0"
                      : `${pendingIndexOfFirstItem + 1}-${Math.min(
                          pendingIndexOfLastItem,
                          pendingRequests.length,
                        )} of ${pendingRequests.length}`}
                  </span>

                  <div className="d-flex align-items-center">
                    <button
                    className="btn btn-sm "
                      onClick={() =>
                        handlePendingPageChange(pendingCurrentPage - 1)
                      }
                      disabled={pendingCurrentPage === 1}
                    >
                      ‹
                    </button>
                    <button
                     className="btn btn-sm "
                      onClick={() =>
                        handlePendingPageChange(pendingCurrentPage + 1)
                      }
                      disabled={pendingCurrentPage === pendingTotalPages}
                    >
                      ›
                    </button>
                  </div>
                </div>
              </nav>
                        </>
          )}
     
        </>
      )}

      {/* PERFORMANCE REQUEST HISTORY TABLE (Shown when activeView is "all") */}
      {activeView === "all" && (
        <>
          <h4 className="mt-4 mb-3" style={{ color: "#3A5FBE" }}>
            Performance Request History
          </h4>

          <div
            className="table-responsive mt-3"
            style={{
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              borderRadius: "8px",
            }}
          >
            <table className="table table-hover align-middle mb-0 bg-white">
              <thead style={{ backgroundColor: "#ffffff" }}>
                <tr>
                  {[
                    "Request ID",
                    "Employee",
                    "Manager",
                    // "Department",
                    "Duration",
                    "Rating",
                    "Remark",
                    "Status",
                    "Recommendation",
                    "Admin Status",
                    "Action",
                  ].map((h) => (
                    <th key={h} style={thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center py-4 text-muted">
                      No performance requests found.
                    </td>
                  </tr>
                ) : (
                  currentPerformances.map((emp, index) => (
                    <tr
                      key={emp._id || index}
                      onClick={() => setSelectedPerformance(emp)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Request ID */}
                      <td style={tdStyle()}>{emp.requestId}</td>
                      <td style={tdStyle()}>{emp.employeeName}</td>
                      <td style={tdStyle()}>{emp.manager}</td>
                      {/* <td style={tdStyle()}>{emp.department}</td> */}
                      {/* Duration */}
                      <td style={tdStyle()}>
                        {emp.durationType} –{" "}
                        {emp.durationType === "Monthly"
                          ? new Date(emp.durationDate).toLocaleString(
                              "default",
                              {
                                month: "long",
                                year: "numeric",
                              },
                            )
                          : new Date(emp.durationDate).toLocaleDateString()}
                      </td>

                      <td style={tdStyle()}>{emp.rating ?? "-"}</td>
                      
                    <td style={{
                        ...tdStyle(),
                       verticalAlign: "middle",
                      borderBottom: "1px solid #dee2e6",
                      maxWidth: "100px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      }}>
                        {emp.description}
                      </td>

                      {/* Status */}
                      <td style={tdStyle()}>
                        <span
                          style={{
                            backgroundColor:
                              emp.status === "Pending" ? "#FFE493" : "#d1f2dd",
                            padding: "6px 14px",
                            borderRadius: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            display: "inline-block",
                            minWidth: "90px",
                            textAlign: "center",
                          }}
                        >
                          {emp.status}
                        </span>
                      </td>

                      {/* Recommendation */}
                      <td style={tdStyle()}>
                        <span
                          style={{
                            backgroundColor:
                              emp.recommendation === "Pending"
                                ? "#FFE493"
                                : "#d1f2dd",
                            padding: "6px 14px",
                            borderRadius: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            display: "inline-block",
                            minWidth: "110px",
                            textAlign: "center",
                          }}
                        >
                          {emp.recommendation}
                        </span>
                      </td>

                      {/* Admin Status */}
                      <td style={tdStyle()}>
                        <span
                          style={{
                            backgroundColor:
                              emp.adminStatus === "pending"
                                ? "#FFE493"
                                : emp.adminStatus === "approved"
                                  ? "#d1f2dd"
                                  : emp.adminStatus === "rejected"
                                    ? "#ffcccc"
                                    : "#e9ecef",
                            padding: "6px 14px",
                            borderRadius: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            display: "inline-block",
                            minWidth: "90px",
                            textAlign: "center",
                          }}
                        >
                          {emp.adminStatus
                            ? emp.adminStatus.charAt(0).toUpperCase() +
                              emp.adminStatus.slice(1)
                            : "N/A"}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={tdStyle()}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePerformance(emp._id);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION for Main Table */}
          <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
            <div className="d-flex align-items-center gap-3">
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

              <span style={{ fontSize: "14px" }}>
                {employees.length === 0
                  ? "0–0 of 0"
                  : `${indexOfFirstItem + 1}-${Math.min(
                      indexOfLastItem,
                      employees.length,
                    )} of ${employees.length}`}
              </span>

              <div className="d-flex align-items-center">
                <button
                 className="btn btn-sm focus-ring"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ‹
                </button>
                <button
                  className="btn btn-sm focus-ring"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  ›
                </button>
              </div>
            </div>
          </nav>
        </>
      )}

    <div className="text-end mt-3">
      <button
        style={{ minWidth: 90 }}
        className="btn btn-sm custom-outline-btn"
        onClick={() => {
          if (activeView === "pending") {
            setActiveView("all");
            setCurrentPage(1);
          } else {
            window.history.back();
          }
        }}
      >
        Back
      </button>
    </div>

      {/* DETAIL MODAL (when clicking on a row from either table) */}
      {selectedPerformance && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          ref={modalRef}      
          tabIndex="-1" 
        >
          <div className="modal-dialog"
          style={{
            maxWidth: "650px",
            width: "95%",
            marginTop: "80px" ,
          }}>
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">
                  Performance Request Details
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedPerformance(null)}
                />
              </div>

              <div className="modal-body" style={{ maxHeight: "60vh" }}>
{[
  ["Request ID", selectedPerformance.requestId],
  ["Employee Name", selectedPerformance.employeeName],
  ["Employee ID", selectedPerformance.employeeId],
  ["Manager", selectedPerformance.manager],
  ["Department", selectedPerformance.department],
  [
    "Duration",
    `${selectedPerformance.durationType} - ${
      selectedPerformance.durationType === "Monthly"
        ? new Date(
            selectedPerformance.durationDate
          ).toLocaleString("default", {
            month: "long",
            year: "numeric",
          })
        : new Date(
            selectedPerformance.durationDate
          ).toLocaleDateString()
    }`,
  ],
  ["Rating", selectedPerformance.rating ?? "-"],
].map(([label, value]) => (
  <div
    className="row"
    key={label}
    style={{
      marginBottom: "12px",
      alignItems: "flex-start",
    }}
  >
    <div className="col-5 col-sm-4 fw-semibold">
      {label}
    </div>

    <div
      className="col-7 col-sm-8"
      style={{
        wordBreak: "break-word",
        paddingLeft: "10px",
      }}
    >
      {value}
    </div>
  </div>
))}

{/* Status */}
<div className="row mb-2">
  <div className="col-5 col-sm-4 fw-semibold">Status</div>

  <div className="col-7 col-sm-8" style={{ paddingLeft: "10px" }}>
    <span
      style={{
        
        backgroundColor:
          selectedPerformance.status === "Pending"
            ? "#FFE493"
            : "#d1f2dd",
        padding: "6px 14px",
        borderRadius: "4px",
        fontSize: "13px",
        fontWeight: 500,
        display: "inline-block",
        minWidth: "90px",
        textAlign: "center",
      }}
    >
      {selectedPerformance.status}
    </span>
  </div>
</div>

{/* Recommendation */}
<div className="row mb-2">
  <div className="col-5 col-sm-4 fw-semibold">Recommendation</div>

  <div className="col-7 col-sm-8" style={{ paddingLeft: "10px" }}>
    <span
      style={{
        backgroundColor:
          selectedPerformance.recommendation === "Pending"
            ? "#FFE493"
            : "#d1f2dd",
        padding: "6px 14px",
        borderRadius: "4px",
        fontSize: "13px",
        fontWeight: 500,
        display: "inline-block",
        minWidth: "90px",
        textAlign: "center",
      }}
    >
      {selectedPerformance.recommendation || "-"}
    </span>
  </div>
</div>

{/* Admin Status */}
<div className="row mb-2">
  <div className="col-5 col-sm-4 fw-semibold">Admin Status</div>

  <div className="col-7 col-sm-8" style={{ paddingLeft: "10px" }}>
    <span
      style={{
        backgroundColor:
          selectedPerformance.adminStatus === "pending"
            ? "#FFE493"
            : selectedPerformance.adminStatus === "approved"
            ? "#d1f2dd"
            : "#ffcccc",
        padding: "6px 14px",
        borderRadius: "4px",
        fontSize: "13px",
        fontWeight: 500,
        display: "inline-block",
        minWidth: "90px",
        textAlign: "center",
      }}
    >
      {selectedPerformance.adminStatus
        ? selectedPerformance.adminStatus.charAt(0).toUpperCase() +
          selectedPerformance.adminStatus.slice(1)
        : "Pending"}
    </span>
  </div>
</div>


                {selectedPerformance.adminStatus === "approved" &&
                  selectedPerformance.approvedBy && (
                  <div className="row mb-2">
  <div className="col-5 col-sm-4 fw-semibold">Approved By</div>
  <div className="col-7 col-sm-8" style={{ paddingLeft: "10px" }}>
    <span className="fw-semibold">
      {selectedPerformance.approvedBy.name || "N/A"}
    </span>
    {selectedPerformance.approvedAt && (
      <span className="text-muted ms-2">
        on {new Date(selectedPerformance.approvedAt).toLocaleDateString()}
      </span>
    )}
  </div>
</div>
                  )}

                {selectedPerformance.adminStatus === "rejected" &&
                  selectedPerformance.rejectedBy && (
                    <div className="row mb-2">
                      <div className="col-5 col-sm-4 fw-semibold">Rejected By</div>
                      <div className="col-7 col-sm-8"style={{ paddingLeft: "10px" }}>
                        <span className="fw-semibold">
                          {selectedPerformance.rejectedBy.name || "N/A"}
                        </span>
                        {selectedPerformance.rejectedAt && (
                          <span className="text-muted ms-2">
                            on{" "}
                            {new Date(
                              selectedPerformance.rejectedAt,
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                {/* DESCRIPTION */}
      <div className="row mt-3">
  <div className="col-5 col-sm-4 fw-semibold">
    Description
  </div>

  <div
    className="col-7 col-sm-8"
    style={{
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      paddingLeft: "10px",
    }}
  >
    {selectedPerformance.description}
  </div>
</div>
              </div>

              <div className="modal-footer border-0">
                {isAdminRole &&
                  selectedPerformance.adminStatus === "pending" &&
                  activeView === "pending" && (
                    <>
                      <button
                        className="btn btn-sm btn-outline-success"
                        style={{minWidth :"90px"}}
                        onClick={() => {
                          handleApproveRequest(selectedPerformance._id);
                          setSelectedPerformance(null);
                        }}
                        disabled={processingRequest === selectedPerformance._id}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        style={{ width: 90 }}

                        onClick={() => {
                          handleRejectRequest(selectedPerformance._id);
                          setSelectedPerformance(null);
                        }}
                        disabled={processingRequest === selectedPerformance._id}
                      >
                        Reject
                      </button>
                    </>
                  )}
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ width: 90 }}
                  onClick={() => setSelectedPerformance(null)}
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

const thStyle = {
  fontWeight: 500,
  fontSize: "14px",
  color: "#6c757d",
  borderBottom: "2px solid #dee2e6",
  padding: "12px",
  whiteSpace: "nowrap",
};

const tdStyle = (color = "#212529", weight = 400) => ({
  padding: "12px",
  fontSize: "14px",
  borderBottom: "1px solid #dee2e6",
  whiteSpace: "nowrap",
  color,
  fontWeight: weight,
});

export default Performances;