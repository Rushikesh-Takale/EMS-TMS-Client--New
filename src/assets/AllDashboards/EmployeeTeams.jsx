import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

function EmployeeTeams({ user }) { 
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchText, setSearchText] = useState(""); // Changed from searchInput
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [error, setError] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]); 

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!user || !user._id) {
        setError("User information not available");
        setLoading(false);
        return;
      }

      if (!["manager", "employee"].includes(user.role)) {
        setError("You don't have permission to view teams");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const userId = user._id;
        
        if (user.role === "manager") {
          const res = await axios.get(
            `http://localhost:8000/managers/${userId}/assigned-employees`
          );
          setEmployees(res.data.employees || []);
          setTeamMembers([]); 
        } else {
          const res = await axios.get(
            `http://localhost:8000/employee/${userId}/team-member`
          );
          
          if (res.data.success) {
            const members = res.data.teamMembers.map(member => ({
              _id: member._id,
              employeeId: member.employeeId,
              name: member.name,
              department: member.department,
              designation: member.designation,
              email: member.email,
              contact: member.contact,
              role: member.role,
              image: member.image
            }));
            
            setTeamMembers(members || []);
            setEmployees([]); 
          }
        }
      } catch (err) {
        console.error("Error fetching data", err);
        setError(err.response?.data?.message || "Failed to fetch team data");
        setEmployees([]);
        setTeamMembers([]);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 700);
      }
    };

    fetchTeamData();
  }, [user]); 

  const displayData = user?.role === "manager"
    ? employees 
    : teamMembers;

  useEffect(() => {
    setFilteredEmployees(displayData);
  }, [displayData]);

  const handleSearch = () => {
    const value = searchText.toLowerCase().trim();

    if (!value) {
      setFilteredEmployees(displayData);
      setCurrentPage(1);
      return;
    }

    const filtered = displayData.filter((emp) => {
      const employeeId = emp.employeeId?.toString().toLowerCase() || "";
      const name = emp.name?.toLowerCase() || "";
      const department = emp.department?.toLowerCase() || "";
      const designation = emp.designation?.toLowerCase() || "";
      const email = emp.email?.toLowerCase() || "";
      const contact = emp.contact?.toLowerCase() || "";

      return (
        employeeId.includes(value) ||
        name.includes(value) ||
        department.includes(value) ||
        designation.includes(value) ||
        email.includes(value) ||
        contact.includes(value)
      );
    });

    setFilteredEmployees(filtered);
    setCurrentPage(1);
  };

  const handleResetSearch = () => {
    setSearchText("");
    setFilteredEmployees(displayData);
    setCurrentPage(1);
  };

  /* ===== Pagination logic (exactly like TLAllEmployee) ===== */
  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredEmployees.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [itemsPerPage, filteredEmployees.length]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };
  
  const modalRef = useRef(null);

  useEffect(() => {
    if (!selectedEmployee || !modalRef.current) return;

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
        setSelectedEmployee(null);
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
  }, [selectedEmployee]);

  useEffect(() => {
    if (selectedEmployee) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.body.style.position = 'relative';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.height = 'auto';
      document.body.style.position = 'static';
    }
  
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.height = 'auto';
      document.body.style.position = 'static';
    };
  }, [selectedEmployee]);

  if (loading) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center mt-5"
        style={{
          height: "100vh",
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <div
          className="spinner-grow"
          role="status"
          style={{ width: "4rem", height: "4rem", color: "#3A5FBE" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 fw-semibold" style={{ color: "#3A5FBE" }}>
          Loading team members...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error!</h4>
          <p>{error}</p>
        </div>
        <div className="text-end mt-3">
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

  return (
    <div className="container-fluid">
      <h2
        style={{
          color: "#3A5FBE",
          fontSize: "25px",
          marginLeft: "15px",
          marginBottom: "40px",
        }}
      >
        My Team Members
      </h2>
      
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body p-3">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0 w-md-100">
              <label
                className="mb-0 fw-bold"
                style={{ fontSize: 16, color: "#3A5FBE", whiteSpace: "nowrap" }}
              >
                Search
              </label>

              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search By Any Field..."
                className="form-control form-control-sm"
                style={{ flex: 1 }}
              />
            </div>

            <div className="d-flex gap-2 ms-auto">
              <button
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
                onClick={handleSearch}
              >
                Filter
              </button>

              <button
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
                onClick={handleResetSearch}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive bg-white">
          <table className="table table-hover mb-0">
            <thead style={{ backgroundColor: "#ffffffff" }}>
              <tr>
                {[
                  "Employee ID",
                  "Name",
                  "Department",
                  "Designation",
                  "Email",
                  "Contact",
                ].map((head) => (
                  <th key={head} style={thStyle}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4" >
                    {user?.role === "employee" 
                      ? "No data found." 
                      : "No team members found."}
                  </td>
                </tr>
              ) : (
                currentItems.map((emp) => (
                  <tr
                    key={emp._id || emp.employeeId}
                    onClick={() => setSelectedEmployee(emp)}
                    style={{ cursor: "pointer" }}
                  >
                    <td style={tdStyle}>{emp.employeeId}</td>
                    <td style={tdStyle}>{emp.name}</td>
                    <td style={tdStyle}>{emp.department}</td>
                    <td style={tdStyle}>{emp.designation}</td>
                    <td style={tdStyle}>{emp.email}</td>
                    <td style={tdStyle}>{emp.contact}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredEmployees.length > 0 && (
        <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center">
              <span style={{ fontSize: "14px", marginRight: "8px", color: "#212529" }}>
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

            <span style={{ fontSize: "14px", marginLeft: "16px", color: "#212529" }}>
              {filteredEmployees.length === 0
                ? "0–0 of 0"
                : `${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems}`}
            </span>

            <div className="d-flex align-items-center" style={{ marginLeft: "16px" }}>
              <button
                className="btn btn-sm border-0"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
              >
                ‹
              </button>
              <button
                className="btn btn-sm border-0"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
              >
                ›
              </button>
            </div>
          </div>
        </nav>
      )}

      {selectedEmployee && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="modal-dialog"
            ref={modalRef}
            style={{ maxWidth: "650px", width: "95%", marginTop: "120px" }}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Team Member Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedEmployee(null)}
                />
              </div>

              <div className="modal-body py-2">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
                      Employee ID
                    </div>
                    <div className="col-7 col-sm-9" style={{ color: "#212529" }}>
                      {selectedEmployee?.employeeId || ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-body py-2">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
                      Name
                    </div>
                    <div className="col-7 col-sm-9" style={{ color: "#212529" }}>
                      {selectedEmployee?.name || ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-body py-2">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
                      Department
                    </div>
                    <div className="col-7 col-sm-9" style={{ color: "#212529" }}>
                      {selectedEmployee?.department || ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-body py-2">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
                      Designation
                    </div>
                    <div className="col-7 col-sm-9" style={{ color: "#212529" }}>
                      {selectedEmployee?.designation || ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-body py-2">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
                      Email
                    </div>
                    <div
                      className="col-7 col-sm-9"
                      style={{
                        color: "#212529",
                        wordBreak: "break-all",
                        overflowWrap: "anywhere",
                        minWidth: 0,
                      }}
                    >
                      {selectedEmployee?.email || ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-body py-2">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
                      Contact
                    </div>
                    <div className="col-7 col-sm-9" style={{ color: "#212529" }}>
                      {selectedEmployee?.contact || ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-body py-2">
                <div className="container-fluid">
                  <div className="row mb-2">
                    <div className="col-5 col-sm-3 fw-semibold" style={{ color: "#212529" }}>
                      Role
                    </div>
                    <div className="col-7 col-sm-9" style={{ color: "#212529" }}>
                      {selectedEmployee?.role || "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: "90px" }}
                  onClick={() => setSelectedEmployee(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-end mt-3">
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

const thStyle = {
  fontWeight: "500",
  fontSize: "14px",
  color: "#6c757d",
  borderBottom: "2px solid #dee2e6",
  padding: "12px",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px",
  verticalAlign: "middle",
  fontSize: "14px",
  borderBottom: "1px solid #dee2e6",
  color: "#212529",
};

export default EmployeeTeams;