import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ProbationReminderPopup = ({ user, role, username, id, onClose }) => {
  const [popupEmployees, setPopupEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const modalRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkProbation = async () => {
      if (!user?.role || (user.role !== "admin" && user.role !== "hr")) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get("https://ems-tms-server-new.vercel.app//admin/probation-reminder", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.employees && res.data.employees.length > 0) {
          setPopupEmployees(res.data.employees);
        }
      } catch (err) {
        console.log("Error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    checkProbation();
  }, [user]);

useEffect(() => {
  if (!modalRef.current) return;
  modalRef.current.focus();

  const focusableElements = modalRef.current.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) return;
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  };

  const handleEscapeKey = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
  document.addEventListener('keydown', handleTabKey);
  document.addEventListener('keydown', handleEscapeKey);

  return () => {
    document.removeEventListener('keydown', handleTabKey);
    document.removeEventListener('keydown', handleEscapeKey);
  };
}, [onClose]);

  if (loading) return null;
  if (popupEmployees.length === 0) return null;

  return (
    <div
      ref={modalRef}
      className="modal fade show"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
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
      <div className="modal-dialog modal-dialog-centered" 
      style={{ 
        maxWidth: "650px", 
        width: "95%" 
      }}>
        <div className="modal-content">
          <div
            className="modal-header text-white"
            style={{ backgroundColor: "#3A5FBE" }}
          >
            <h5 className="modal-title mb-0">
              Probation Period Reminder
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            />
          </div>

          <div className="modal-body" 
          style={{ 
            padding: "20px" 
          }}>
            <p className="mb-3" >
              <strong>The following employees' probation period is ending within the next 30 days:</strong>
            </p>
            
            <div style={{ 
              maxHeight: "450px", 
              overflow: "auto" 
            }}>
              <table className="table table-hover table-sm" 
              style={{ minWidth: "750px" }}>
                <thead style={{ 
                  backgroundColor: "#f8f9fa", 
                  position: "sticky", 
                  top: 0, 
                  zIndex: 1 
                }}>
                  <tr>
                    
                  <th 
                  style={{ 
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap"}}
                    >
                      Employee Name
                    </th>
                  <th 
                  style={{ 
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap"
                  }}>
                    Designation
                  </th>
                  <th 
                  style={{ 
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap"
                  }}>
                    Date of Joining
                  </th>
                  <th 
                  style={{ 
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap"
                  }}>
                    Probation End Date
                  </th>
                  <th 
                  style={{ 
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#6c757d",
                    borderBottom: "2px solid #dee2e6",
                    padding: "12px",
                    whiteSpace: "nowrap"
                  }}>
                    Status
                  </th>
                </tr>
                </thead>
                <tbody>
                  {popupEmployees.map((emp, index) => {
                    const doj = emp.doj ? new Date(emp.doj).toLocaleDateString("en-GB") : "N/A";
                    
                    return (
                      <tr key={emp._id}>
                        <td 
                        style={{
                          padding: "12px",
                          verticalAlign: "middle",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          whiteSpace: "nowrap"
                        }}>
                          {emp.name}
                        </td>
                        <td 
                        style={{
                          padding: "12px",
                          verticalAlign: "middle",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          whiteSpace: "nowrap"
                        }}>
                          {emp.designation || "-"}
                        </td>
                        <td 
                        style={{ 
                          padding: "12px",
                          verticalAlign: "middle",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          whiteSpace: "nowrap"
                        }}>
                          {doj}
                        </td>
                        <td 
                        style={{ 
                          padding: "12px",
                          verticalAlign: "middle",
                          fontSize: "14px",
                          borderBottom: "1px solid #dee2e6",
                          whiteSpace: "nowrap"
                        }}>
                          {new Date(emp.probationEndDate).toLocaleDateString("en-GB")}
                        </td>
                        <td style={{ 
                          padding: "12px", 
                          verticalAlign: "middle", 
                          fontSize: "14px", 
                          borderBottom: "1px solid #dee2e6", 
                          whiteSpace: "nowrap" }}
                        >
                          <span style={{
                            color: emp.probationStatus === 'extended' ? '#856404' : '#0c5460',
                            backgroundColor: emp.probationStatus === 'extended' ? '#fff3cd' : '#d1ecf1',
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            display: "inline-block",
                            fontWeight: "500"
                          }}>
                            {emp.probationStatus === 'extended' ? 'Extended' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="modal-footer border-0" style={{ padding: "15px 20px" }}>
            <button
              className="btn custom-outline-btn btn-sm"
              style={{ minWidth: "90px" }}
              onClick={onClose}
            >
              Ok
            </button>
            <button
              className="btn custom-outline-btn btn-smbtn btn-sm"
              style={{ 
                minWidth: "90px", 
              }}
              onClick={() => {
                onClose();
                navigate(`/dashboard/${role}/${username}/${id}/probation`);
              }}
            >
              View 
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProbationReminderPopup;