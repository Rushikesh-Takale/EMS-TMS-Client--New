import React, { useState, useEffect, useRef} from "react";
import axios from "axios";

function EmployeeApplyLeave({ user, onLeaveApplied }) {
  const [form, setForm] = useState({
    leaveType: "SL",
    dateFrom: "",
    dateTo: "",
    duration: "full",
    reason: "",
  });
  const [leaveBalances, setLeaveBalances] = useState({
    sickLeaveBalance: 0,
    casualLeaveBalance: 0
  });
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmSubmitting, setIsConfirmSubmitting] = useState(false);
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState([]);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [manager, setManager] = useState(null);
  const [weeklyOffs, setWeeklyOffs] = useState({});
  const [publicHolidays, setPublicHolidays] = useState([]);
  const [daysCount, setDaysCount] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [showPreviewModal,
  setShowPreviewModal] =
  useState(false);

  useEffect(() => {
    const fetchWeeklyOffs = async () => {
      try {
        const res = await axios.get(
          `https://ems-tms-server-new.vercel.app//admin/weeklyoff/${new Date().getFullYear()}`,
        );
        const weeklyData = res.data?.data || res.data || {};
        const saturdayOffs = weeklyData.saturdays || [];
        const sundayOff = true; // All Sundays are off
        setWeeklyOffs({ saturdays: saturdayOffs, sundayOff });
        console.log("✅ Weekly offs fetched:", { saturdays: saturdayOffs, sundayOff });
      } catch (err) {
        console.error("❌ Error fetching weekly offs:", err);
        setWeeklyOffs({ saturdays: [1, 3, 5], sundayOff: true }); // Fallback
        console.log("🔄 Using fallback weekly offs:", { saturdays: [1, 3, 5], sundayOff: true });
      }
    };
    fetchWeeklyOffs();
  }, []);

  useEffect(() => {
    console.log("🔍 useEffect for holidays triggered"); // Confirms it runs
    const fetchPublicHolidays = async () => {
      console.log("🔍 Starting holiday fetch");
      setLoadingHolidays(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("No auth token found");

        const res = await axios.get('https://ems-tms-server-new.vercel.app//getHolidays', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        console.log("🔍 Response status:", res.status);
        console.log("🔍 Response data:", res.data);

        if (!Array.isArray(res.data)) {
          throw new Error("Response is not an array");
        }

        const holidays = res.data.map(h => {
          const d = new Date(h.date);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        });

        setPublicHolidays(holidays);
        console.log("✅ Holidays loaded in React:", holidays);
        console.log("✅ Total holidays:", holidays.length);
      } catch (err) {
        console.error("❌ Holiday fetch failed:", err.message);
        console.error("Full error:", err);
        setPublicHolidays([]);
        alert(`Failed to load holidays: ${err.message}`);
      } finally {
        setLoadingHolidays(false);
      }
    };
    fetchPublicHolidays();
  }, []);

  useEffect(() => {
    const fetchTeamLeaders = async () => {
      if (!user?._id) {
        console.log("user not found");
        return;
      }
      
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(
          `https://ems-tms-server-new.vercel.app//employee/${user._id}/team-leader`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        if (Array.isArray(response.data)) {
          setTeamLeaders(response.data);
        } else {
          setTeamLeaders([]);
        }
      } catch (err) {
        console.error("Error fetching team leaders:", err.response?.data || err.message);
        setTeamLeaders([]);
      }
    };
    
    fetchTeamLeaders();
  }, [user]);

  useEffect(() => {
    const fetchManager = async () => {
      if (!user?.reportingManager || !/^[0-9a-fA-F]{24}$/.test(user.reportingManager)) {
        // ✅ Skip if ID is invalid or missing
        console.warn("Invalid or missing reportingManager ID:", user?.reportingManager);
        setManager({ name: "No manager assigned", role: "Unknown", _id: null });
        return;
      }
      try {
        // ✅ Confirm this URL matches your backend (e.g., change to /api/users if needed)
        const res = await axios.get(`https://ems-tms-server-new.vercel.app//users/${user.reportingManager}`);
        setManager(res.data); // Process response
      } catch (err) {
        // ✅ Handle 404 specifically (user not found)
        if (err.response?.status === 404) {
          console.warn(`Manager not found for ID ${user.reportingManager} (404)`);
          setManager({ name: "No manager assigned", role: "Unknown", _id: null });
        } else {
          // For other errors (e.g., 500, network issues)
          console.error("Error fetching manager:", err.message);
          setManager({ name: "Unknown User", role: "Unknown", _id: null });
        }
      }
    };
    fetchManager();
  }, [user]);

  useEffect(() => {
    const fetchLeaveBalances = async () => {
      if (!user?._id) return;
      try {
        const res = await axios.get(`https://ems-tms-server-new.vercel.app//leave/${user._id}`);
        setLeaveBalances({
          sickLeaveBalance: res.data.sickLeaveBalance || 0,
          casualLeaveBalance: res.data.casualLeaveBalance || 0
        });
      } catch (err) {
        console.error("Error fetching leave balances:", err);
      }
    };
    fetchLeaveBalances();
  }, [user]);
  
  

  useEffect(() => {
    if (!showModal) return;
    
    const now = new Date();
    const doj = new Date(user.doj);
    const probationEnd = new Date(doj);
    probationEnd.setMonth(probationEnd.getMonth() + user.probationMonths);
    
    const hasSL = leaveBalances.sickLeaveBalance > 0;
    const hasCL = leaveBalances.casualLeaveBalance > 0;
    
    if (now < probationEnd) {
      setAvailableLeaveTypes(["LWP"]);
      setForm((prev) => ({ ...prev, leaveType: "LWP" }));
    } else {
      const available = [];
      if (hasCL) available.push("CL");
      if (hasSL) available.push("SL");
      available.push("LWP"); 
      
      setAvailableLeaveTypes(available);
      
      if (hasCL) {
        setForm((prev) => ({ ...prev, leaveType: "CL" }));
      } else if (hasSL) {
        setForm((prev) => ({ ...prev, leaveType: "SL" }));
      } else {
        setForm((prev) => ({ ...prev, leaveType: "LWP" }));
      }
    }
  }, [showModal, user, leaveBalances]);
  const popupRef = useRef(null);
  const previewPopupRef = useRef(null);

  useEffect(() => {
    if (showModal && popupRef.current) {
      popupRef.current.focus();
    }
  }, [showModal]);

  useEffect(() => {
    if (showPreviewModal && previewPopupRef.current) {
      previewPopupRef.current.focus();
    }
  }, [showPreviewModal]);

  const trapFocus = (e, modalRef) => {
    if (!modalRef || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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

  useEffect(() => {
    const fetchDays = async () => {
      if (!form.dateFrom || !form.dateTo) {
        setDaysCount(0);
        return;
      }

      try {
        const res = await axios.post(
          "https://ems-tms-server-new.vercel.app//leave/calculate",
          {
            employeeId: user._id,
            leaveType: form.leaveType,
            dateFrom: form.dateFrom,
            dateTo: form.dateTo,
            duration: form.duration,
          }
        );

        //setDaysCount(res.data.previewDays || res.data.totalDays || 0);

        const preview = res.data.preview || {};

        setPreviewData(preview);

        setDaysCount(
          preview.totalDays ||
          res.data.totalDays ||
          0
        );
      } catch (err) {
        console.error("Error calculating leave days:", err);
        setDaysCount(0);
      }
    };

    fetchDays();
  }, [form.dateFrom, form.dateTo, form.duration]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? "half" : "full") : value,
    }));
  };

  const today = new Date();
  const minDate = today.toISOString().split("T")[0];
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 2);
  const maxDate = futureDate.toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    if (isSubmitting) return; 

    e.preventDefault();
    const dateFromParsed = parseDate(form.dateFrom);
    const dateToParsed = parseDate(form.dateTo);
    const fromDate = new Date(dateFromParsed);
    const toDate = new Date(dateToParsed);
    const min = new Date(minDate);
    const max = new Date(maxDate);

    if (!form.reason || !dateFromParsed || !dateToParsed) {
      setMessage("Please fill all required fields");
      return;
    }
    if (fromDate < min) {
      setMessage("From date cannot be before today.");
      return;
    }
    if (toDate > max) {
      setMessage("To date cannot be beyond next 2 months.");
      return;
    }
    if (toDate < fromDate) {
      setMessage("⚠️ Invalid date range: 'To Date' cannot precede 'From Date'.");
      return;
    }

    // 🔄 UPDATED: Check the entire date range for off days (not just from/to)
    if (isOffDay(fromDate) || isOffDay(toDate)) {
      let message = "❌ Cannot apply leave on off days.";
      const offDate = isOffDay(fromDate) ? fromDate : toDate; // Identify which date is off
      if (isHoliday(offDate)) {
        message = "❌ Cannot apply leave on holidays.";
      } else if (isSunday(offDate)) {
        message = "❌ Cannot apply leave on Sundays.";
      } else if (isNthSaturday(offDate)) {
        message = "❌ Cannot apply leave on weekly off Saturdays.";
      }
      alert(message);
      return;
    }

    setIsSubmitting(true);

    try {
      // const existingLeavesRes = await axios.get(`https://ems-tms-server-new.vercel.app//leave/my/${user._id}`);
      // const existingLeaves = existingLeavesRes.data || [];
      
      // let overlappingLeaveDetails = [];
      // for (let i = 0; i < existingLeaves.length; i++) {
      //   const leave = existingLeaves[i];
      //   if (leave.status !== "rejected") {
      //     const leaveFrom = new Date(leave.dateFrom);
      //     const leaveTo = new Date(leave.dateTo);
      //     leaveFrom.setHours(0, 0, 0, 0);
      //     leaveTo.setHours(23, 59, 59, 999);
      //     fromDate.setHours(0, 0, 0, 0);
      //     toDate.setHours(23, 59, 59, 999);
          
      //     if (fromDate <= leaveTo && toDate >= leaveFrom) {
      //       const existingFromStr = leave.dateFrom;
      //       const existingToStr = leave.dateTo;
      //       overlappingLeaveDetails.push(`${existingFromStr} to ${existingToStr}`);
      //     }
      //   }
      // }
      
      // if (overlappingLeaveDetails.length > 0) {
      //   const leaveDates = overlappingLeaveDetails.join(", ");
      //   alert(`❌ You already have a leave application from ${form.dateFrom} to ${form.dateTo}.`);
      //   return;

      // }
      // await axios.post("https://ems-tms-server-new.vercel.app//leave/apply", {
      //   employeeId: user._id,
      //   leaveType: form.leaveType,
      //   dateFrom: dateFromParsed,
      //   dateTo: dateToParsed,
      //   duration: form.duration,
      //   reason: form.reason,
      //   reportingManagerId: manager?._id || null,
      // });

    //   alert("Leave applied successfully! Waiting for approval.");
    //   if (typeof onLeaveApplied === "function") onLeaveApplied();
    //   setForm({ leaveType: availableLeaveTypes[0], dateFrom: "", dateTo: "", duration: "full", reason: "" });
    //   setShowModal(false);
    //   setDaysCount(0);
    // } catch (err) {
    //   setMessage(err.response?.data?.error || "Error applying leave");
    //   alert(err.response?.data?.error || "Error applying leave");
    // }
    // finally {
    //   setIsSubmitting(false);
    // }

        setShowModal(false);

    setShowPreviewModal(true);

  } catch (err) {

    setMessage(
      err.response?.data?.error ||
      "Error applying leave"
    );

    alert(
      err.response?.data?.error ||
      "Error applying leave"
    );

  } finally {

    setIsSubmitting(false);
  }
};

  // Helper functions
  const parseDate = (dateStr) => {
    console.log("Parsing date:", dateStr);
    if (!dateStr) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    return null;
  };

  const isHoliday = (d) => {
    const isHol = publicHolidays.includes(d.toISOString().split('T')[0]);
    if (isHol) console.log(`📅 ${d.toISOString().split('T')[0]} is a holiday`);
    return isHol;
  };

  const isSunday = (d) => {
    const isSun = d.getDay() === 0 && weeklyOffs.sundayOff;
    if (isSun) console.log(`☀️ ${d.toISOString().split('T')[0]} is Sunday (off)`);
    return isSun;
  };

  const isNthSaturday = (d) => {
    if (d.getDay() !== 6) return false;
    const nth = Math.ceil(d.getDate() / 7);
    const isNthSat = weeklyOffs.saturdays.includes(nth);
    if (isNthSat) console.log(`🕒 ${d.toISOString().split('T')[0]} is ${nth}th Saturday (off)`);
    return isNthSat;
  };

  const isOffDay = (d) => {
    const off = isSunday(d) || isNthSaturday(d) || isHoliday(d);
    if (off) console.log(`🚫 ${d.toISOString().split('T')[0]} is off day`);
    return off;
  };

  const getApplyToValue = () => {
    if (user?.role === "employee" && teamLeaders.length > 0) {
      return teamLeaders.map(tl => tl.name).join(", ");
    }
    if (user?.role === "employee") {
      return "No team leader assigned";
    }
    if (manager && manager._id) {
      return `${manager.role.charAt(0).toUpperCase() + manager.role.slice(1)} (${manager.name})`;
    }
    return "No approver assigned";
  };

    const confirmApplyLeave = async () => {
      
      if (isConfirmSubmitting) return;
      setIsConfirmSubmitting(true);

      try {

        const dateFromParsed =
          parseDate(form.dateFrom);

        const dateToParsed =
          parseDate(form.dateTo);

        await axios.post(
          "https://ems-tms-server-new.vercel.app//leave/apply",
          {
            employeeId: user._id,
            leaveType: form.leaveType,
            dateFrom: dateFromParsed,
            dateTo: dateToParsed,
            duration: form.duration,
            reason: form.reason,
            reportingManagerId:
              manager?._id || null,
          }
        );

        alert(
          "Leave applied successfully!"
        );

        if (
          typeof onLeaveApplied ===
          "function"
        ) {
          onLeaveApplied();
        }

        setForm({
          leaveType: "SL",
          dateFrom: "",
          dateTo: "",
          duration: "full",
          reason: "",
        });

        setShowPreviewModal(false);

        setShowModal(false);

        setDaysCount(0);

        setPreviewData(null);

      } catch (err) {

        setMessage(
          err.response?.data?.error ||
          "Error applying leave"
        );

        alert(
          err.response?.data?.error ||
          "Error applying leave"
        );
      }
      finally {
        setIsConfirmSubmitting(false);
      }
    };

useEffect(() => {
  if (showModal || showPreviewModal) {
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
}, [showModal, showPreviewModal]);
  return (
    <>
      <button
        className="btn btn-sm custom-outline-btn me-2"
        // style={{
        //   whiteSpace: "nowrap",
        //   height: "31px",
        //   display: "flex",
        //   alignItems: "center",
        //   justifyContent: "center",
        // }}
        onClick={() => setShowModal(true)}
      >
        Apply Leave
      </button>
      <style>{`
        .modal-body .btn:focus {
          outline: none;
        }

        .modal-body .btn:focus-visible {
          outline: 3px solid #3A5FBE;
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(58, 95, 190, 0.25);
          transform: scale(1.02);
          transition: all 0.2s ease;
        }

        .modal-body button[type="submit"]:focus-visible {
          outline: 3px solid #ffffff;
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.4);
          filter: brightness(1.1);
        }

        .modal-body button[type="button"]:focus-visible {
          outline: 3px solid #3A5FBE;
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(58, 95, 190, 0.25);
          background-color: rgba(58, 95, 190, 0.05);
        }

        .modal-body input:focus-visible {
          outline: 2px solid #3A5FBE;
          outline-offset: 2px;
          border-color: #3A5FBE;
          box-shadow: 0 0 0 3px rgba(58, 95, 190, 0.15);
        }
      `}</style>

{showModal && (
        <div
          ref={popupRef}
          tabIndex="-1"
          autoFocus
          onKeyDown={(e) => trapFocus(e, popupRef)}
              className="modal fade show d-block"
style={{
  display: "flex",
 alignItems: "flex-start",
  justifyContent: "center",
  background: "rgba(0,0,0,0.5)",
  position: "fixed",
  inset: 0,
  zIndex: 1050,
  overflow: "hidden",
  // paddingTop: "100px"   
}}
        >
   <div
  className="modal-dialog modal-lg modal-dialog-centered"
  style={{
    maxWidth: "650px",
    width: "95%",
  }}
>
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title">Apply Leave</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowModal(false);
                    setForm({
                      leaveType: "SL",
                      dateFrom: "",
                      dateTo: "",
                      duration: "full",
                      reason: "",
                    });
                    setMessage("");
                    setDaysCount(0);
                  }}
                ></button>
              </div>
              <div className="modal-body" style={{ paddingTop: "24px" }}>
                {/* {message && <div className="alert alert-info">{message}</div>} */}
                <form onSubmit={handleSubmit}>
                  {/* Leave Type */}
                  <div className="mb-2">
                    <label
                      className="form-label"
                    >
                      Leave type:<span style={{ color: "red" }}>  *</span>
                    </label>
                    {/* NEW: Fixed width for all labels */}
             <div className="d-flex flex-wrap gap-3 w-100">
                     <div className="form-check d-flex align-items-center" style={{ minWidth: "140px" }}>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="leaveType"
                          id="casual-radio"
                          value="CL"
                          checked={form.leaveType === "CL"}
                          onChange={handleChange}
                          disabled={!availableLeaveTypes.includes("CL") || leaveBalances.casualLeaveBalance === 0}
                          style={{
                            width: "20px",
                            height: "20px",
                            cursor: leaveBalances.casualLeaveBalance === 0 ? "not-allowed" : "pointer",
                            accentColor: "#2E4A8B",
                          }}
                        />
                        <label
                          className="form-check-label ms-2"
                          htmlFor="casual-radio"
                          style={{
                            fontSize: "14px",
                            color: "#495057",
                            marginLeft: "8px",
                            cursor: leaveBalances.casualLeaveBalance === 0 ? "not-allowed" : "pointer",
                          }}
                        >
                          Casual
                        </label>
                      </div>
                    <div className="form-check d-flex align-items-center" style={{ minWidth: "140px" }}>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="leaveType"
                          id="sick-radio"
                          value="SL"
                          checked={form.leaveType === "SL"}
                          onChange={handleChange}
                          disabled={!availableLeaveTypes.includes("SL") || leaveBalances.sickLeaveBalance === 0}
                          style={{
                            width: "20px",
                            height: "20px",
                            cursor: "pointer",
                            cursor: leaveBalances.sickLeaveBalance === 0 ? "not-allowed" : "pointer",
                            accentColor: "#2E4A8B",
                          }}
                        />
                        <label
                          className="form-check-label ms-2"
                          htmlFor="sick-radio"
                          style={{
                            fontSize: "14px",
                            color: "#495057",
                            marginLeft: "8px",
                            cursor: leaveBalances.sickLeaveBalance === 0 ? "not-allowed" : "pointer",
                          }}
                        >
                          Sick
                        </label>
                      </div>
                      
            {availableLeaveTypes.includes("LWP") && (
  <div className="form-check d-flex align-items-center" style={{ minWidth: "180px" }}>
    <input
      className="form-check-input"
      type="radio"
      name="leaveType"
      value="LWP"
      checked={form.leaveType === "LWP"}
      onChange={handleChange}
      style={{
        width: "20px",
        height: "20px",
        accentColor: "#2E4A8B",
      }}
    />
    <label
      className="form-check-label ms-2"
      style={{
        fontSize: "14px",
        color: "#495057",
      }}
    >
      Leave Without Pay
    </label>
  </div>
)}
                        
                      
                    </div>
                  </div>
                  {/* Half Day */}
                  <div className="ms-2">
                    <label
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#495057",
                        width: "90px",
                        flexShrink: 0,
                      }}
                    >
                      Half day:
                    </label>{" "}
                    {/* NEW: Fixed width */}{" "}
                    <div className="form-check">
                      <input
                        disabled
                        type="checkbox"
                        name="duration"
                        className="form-check-input"
                        checked={form.duration === "half"}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            duration: e.target.checked ? "half" : "full",
                          }))
                        }
                        style={{
                          width: "18px",
                          height: "18px",
                          cursor: "pointer",
                          accentColor: "#2E4A8B",
                        }}
                      />
                    </div>
                  </div>
                  {/* Dates */}
                  <div className="mb-2">
                    <label
                      className="form-label"
                    >
                      Select Date:<span style={{ color: "red" }}>  *</span>
                    </label>
                    <div className="row">
                      <div className="col-md-4 mb-2 mb-md-0">
                        <label
                        className="form-label"
                          style={{
                            fontSize: "12px",
                            color: "#6c757d",
                          }}
                        >
                          From<span style={{ color: "red" }}>  *</span>
                        </label>
                        <input
                          type="date"
                          name="dateFrom"
                          value={form.dateFrom}
                          onChange={handleChange}
                          className="form-control"
                          required
                          style={{
                            fontSize: "14px",
                          }}
                          min={minDate} // cannot select past date
                          max={maxDate} // cannot select beyond next 2 months
                        />
                      </div>
                      <div className="col-md-4 mb-2 mb-md-0">
                        <label
                        className="form-label"
                          style={{
                            fontSize: "12px",
                            color: "#6c757d",
                          }}
                        >
                          To<span style={{ color: "red" }}>  *</span>
                        </label>
                        <input
                          type="date"
                          name="dateTo"
                          value={form.dateTo}
                          onChange={handleChange}
                          className="form-control"
                          required
                          style={{
                            fontSize: "14px",
                          }}
                          min={form.dateFrom || minDate}
                          max={maxDate} // cannot select beyond next 2 months
                        />
                      </div>

                      {/* No of Days */}
                      <div className="col-md-4">
                        <label
                        className="form-label"
                          style={{
                            fontSize: "12px",
                            color: "#6c757d",
                            marginBottom: "6px",
                          }}
                        >
                          <label>No of Days: {loadingHolidays ? "Loading..." : daysCount}</label>
                          {/* <span>{daysCount}</span> */}

                        </label>
                        <input
                          type="text"
                          value={daysCount}
                          className="form-control"
                          readOnly
                          style={{
                            fontSize: "14px",
                            padding: "8px 12px",
                            border: "1px solid #ced4da",
                            borderRadius: "4px",
                            backgroundColor: "#f8f9fa",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Apply to section */}
                  <div className="mb-2">
                    <label
                      className="form-label"
                    >
                      Apply to:
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={getApplyToValue()}
                      // value={
                      //   manager
                      //     ? `${manager.role.charAt(0).toUpperCase() +
                      //     manager.role.slice(1)
                      //     } (${manager.name})`
                      //     : "No manager assigned"
                      // }
                     style={{
  fontSize: "14px",
  backgroundColor: "#f8f9fa",
  textTransform: "capitalize",
}}
                    />
                  </div>

                  {/* Reason */}
                <div className="mb-2">
  <label
    className="form-label"
  >
    Reason:<span style={{ color: "red" }}>  *</span>
  </label>

  <div style={{ flex: 1 }}>
    <textarea
      name="reason"
      value={form.reason}
      onChange={(e) => {
        if (e.target.value.length <= 200) {
          handleChange(e);
        }
      }}
      maxLength={200}
      className="form-control"
      style={{
        resize: "vertical",
      }}
      required
    />

    {/* ✅ Character Count */}
    <div
      style={{
        fontSize: "12px",
        color: "#6c757d",
        textAlign: "right",
        marginTop: "4px",
      }}
    >
      {form.reason.length}/200
    </div>
  </div>
</div>

                  {/* Buttons */}
                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-sm custom-outline-btn"
                      style={{ minWidth: 90 }}
                      onClick={() => {
                        setShowModal(false);
                        setForm({
                          leaveType: "SL",
                          dateFrom: "",
                          dateTo: "",
                          duration: "full",
                          reason: "",
                        });
                        setMessage("");
                        setDaysCount(0);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-sm custom-outline-btn"
                      style={{ minWidth: 90 }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Apply" : "Apply"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {showPreviewModal && (

        <div
          ref={previewPopupRef}
          tabIndex="-1"
          onKeyDown={(e) => trapFocus(e, previewPopupRef)}
          className="modal d-block"
          style={{
            backgroundColor:
              "rgba(0,0,0,0.5)",
              overflow: "hidden",
            position: "fixed",
            inset: 0,
            zIndex: 1050
          }}
        >

          <div
            className="modal-dialog"
            style={{
              maxWidth: "450px",
              marginTop: "180px"
            }}
          >

            <div className="modal-content">

              <div
                className="modal-header text-white"
                style={{
                  backgroundColor:
                    "#3A5FBE"
                }}
              >

                <h5 className="modal-title">
                  Leave Preview
                </h5>

                <button
                  type="button"
                  className=
                    "btn-close btn-close-white"
                  onClick={() => {
                    setShowPreviewModal(false);
                    setShowModal(true);
                  }}
                />

              </div>

              <div className="modal-body">

                <div className="mb-2">
                  <strong>
                    Actual Leave:
                  </strong>{" "}
                  {previewData?.actualDays || 0}
                </div>

                <div className="mb-2">
                  <strong>
                    Weekend/Holiday:
                  </strong>{" "}
                  {previewData?.sandwichDays || 0}
                </div>

                {/* <div className="mb-2">
                  <strong>
                    Final Deduction:
                  </strong>{" "}
                  {previewData?.totalDays || 0}
                </div> */}
                <div className="mb-2">

  <strong>
    Previously Approved Leave:
  </strong>{" "}

  {previewData?.previousApprovedLeave || 0}

</div>

<div className="mb-2">

  <strong>
    New Additional Deduction:
  </strong>{" "}

  {previewData?.newAdditionalDeduction || 0}

</div>

<div className="mb-2">

  <strong>
    Final Total Chain:
  </strong>{" "}

  {previewData?.totalDays || 0}

</div>

                {previewData?.isSandwich && (

                  <div
                    style={{
                      color: "#d97706",
                      fontWeight: "600",
                      marginTop: "10px"
                    }}
                  >
                    Sandwich leave rule applied
                  </div>
                )}

              </div>

              <div className="modal-footer">

                <button
                 className="btn btn-sm custom-outline-btn"
                      style={{ minWidth: 90 }}
                  // onClick={() =>
                  //   setShowPreviewModal(false),
                  //   setShowModal(true)
                  // }
                  onClick={() => {

                  setShowPreviewModal(false);

                  setShowModal(true);
                  }}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={
                    confirmApplyLeave
                  }
                  disabled={isConfirmSubmitting}
                >
                  Confirm Apply
                </button>

              </div>

            </div>

          </div>

        </div>
      )}
    </>
  );
}

export default EmployeeApplyLeave;
