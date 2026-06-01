import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import EmployeeMyRegularization from "./EmployeeMyRegularization";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import dayjs from "dayjs";

function ApplyRegularization({ user, selectedRecord }) {
  const [date, setDate] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [checkOut, setCheckOut] = useState("");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  // ✅ Regularization counts
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [workMode, setWorkMode] = useState("");
  const [attendance, setAttendance] = useState([]); // ✅ store attendance data
  
  const [reason, setReason] = useState("");
  

  
  //TANVI
  const modalRef = useRef(null);

  //TANVI
useEffect(() => {
  if (!showModal || !modalRef.current) return;

  const modal = modalRef.current;

  const getFocusableElements = () =>
    modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

  setTimeout(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, 0);

  const handleKeyDown = (e) => {
    const focusableElements = getFocusableElements();

    if (!focusableElements.length) return;

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

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
}, [showModal]);
  // ✅ Function to fetch counts
  const fetchCounts = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/attendance/regularization/my/${user._id}`,
      );

      const requests = res.data || [];
      //Added by Jaicy
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(today.getMonth() - 3);

      // ✅ FILTER BY DATE FIRST
      const lastThreeMonthsData = res.data.filter((req) => {
        const recordDate = new Date(
          req.regularizationRequest?.requestedAt || req.createdAt || req.date,
        );
        recordDate.setHours(0, 0, 0, 0);

        return recordDate >= threeMonthsAgo && recordDate <= today;
      });

      // ✅ SORT NEWEST FIRST
      const sortedData = lastThreeMonthsData.sort(
        (a, b) =>
          new Date(
            b.regularizationRequest?.requestedAt || b.createdAt || b.date,
          ) -
          new Date(
            a.regularizationRequest?.requestedAt || a.createdAt || a.date,
          ),
      );
      setAcceptedCount(
        sortedData.filter(
          (r) => r?.regularizationRequest?.status === "Approved",
        ).length,
      );
      setRejectedCount(
        sortedData.filter(
          (r) => r?.regularizationRequest?.status === "Rejected",
        ).length,
      );
      setPendingCount(
        sortedData.filter((r) => r?.regularizationRequest?.status === "Pending")
          .length,
      );
    } catch (err) {
      console.error("Failed to fetch regularization counts", err);
    }
  };

  // ✅ Fetch counts initially and whenever refresh changes
  useEffect(() => {
    fetchCounts();
  }, [user._id, refresh]);

  const [weeklyOffs, setWeeklyOffs] = useState([]);

  useEffect(() => {
    const fetchWeeklyOffs = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/admin/weeklyoff/${new Date().getFullYear()}`,
        );

        const weeklyData = res.data?.data || res.data || {};
        const saturdayOffs = weeklyData.saturdays || []; // example: [2, 4]
        const sundayOff = true; // all Sundays are off

        setWeeklyOffs({ saturdays: saturdayOffs, sundayOff });
        console.log("✅ Weekly offs fetched:", {
          saturdays: saturdayOffs,
          sundayOff,
        });
      } catch (err) {
        console.error("❌ Error fetching weekly offs:", err);
        setWeeklyOffs({ saturdays: [], sundayOff: true });
      }
    };

    fetchWeeklyOffs();
  }, []);

  // ✅ Fetch Attendance Data (used to prefill Check-In)
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/attendance/regularization/my/${user._id}`,
        );
        setAttendance(res.data);
        console.log(res.data);
      } catch (err) {
        console.error("❌ Error fetching attendance:", err);
      }
    };
    fetchAttendance();
  }, [user._id]);

  useEffect(() => {
    const modalBody = document.querySelector(".modal-body");
  
    if (!modalBody) return;
  
    if (isTimePickerOpen) {
      modalBody.style.overflow = "hidden";
    } else {
      modalBody.style.overflowY = "auto";
    }
  
    return () => {
      modalBody.style.overflowY = "auto";
    };
  }, [isTimePickerOpen]);

  // ✅ Whenever date changes, check if there’s an attendance record for it
  // useEffect(() => {
  //   if (!date || attendance.length === 0) return;

  //   const record = attendance.find((a) => {
  //     const recordDate = new Date(a.date);
  //     const selectedDate = new Date(date);
  //     recordDate.setHours(0, 0, 0, 0);
  //     selectedDate.setHours(0, 0, 0, 0);
  //     return recordDate.getTime() === selectedDate.getTime();
  //   });

  //   if (record && record.checkIn) {
  //     const localCheckIn = new Date(record.checkIn)
  //       .toLocaleTimeString("en-IN", {
  //         timeZone: "Asia/Kolkata",
  //         hour: "2-digit",
  //         minute: "2-digit",
  //         hour12: false,
  //       });
  //     setCheckIn(localCheckIn);
  //   } else {
  //     setCheckIn("");
  //   }

  //   if (record && record.checkOut) {
  //     const localCheckOut = new Date(record.checkOut)
  //       .toLocaleTimeString("en-IN", {
  //         timeZone: "Asia/Kolkata",
  //         hour: "2-digit",
  //         minute: "2-digit",
  //         hour12: false,
  //       });
  //     setCheckOut(localCheckOut);
  //   } else {
  //     setCheckOut("");
  //   }
  // }, [date, attendance]);

  // ✅ Whenever date changes, check if there’s an attendance record for it
  useEffect(() => {
    if (!date || attendance.length === 0) return;

    const record = attendance.find((a) => {
      const recordDate = new Date(a.date);
      const selectedDate = new Date(date);
      recordDate.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === selectedDate.getTime();
    });

    if (record) {
      // 🕒 Convert and prefill existing Check-In
      if (record.checkIn) {
        const localCheckIn = new Date(record.checkIn).toLocaleTimeString(
          "en-IN",
          {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          },
        );
        setCheckIn(localCheckIn);
        setCheckInTime(dayjs(`2000-01-01T${localCheckIn}`));
      } else {
        setCheckIn("");
        setCheckInTime(null);
      }

      // 🕒 Convert and prefill existing Check-Out
      if (record.checkOut) {
        const localCheckOut = new Date(record.checkOut).toLocaleTimeString(
          "en-IN",
          {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          },
        );
        setCheckOut(localCheckOut);
        setCheckOutTime(dayjs(`2000-01-01T${localCheckOut}`));
      } else {
        setCheckOut("");
        setCheckOutTime(null);
      }

      // ✅ Auto-fill Work Mode (e.g., WFH or Office)
      if (record.mode) {
        setWorkMode(record.mode);
      } else {
        setWorkMode("");
      }
    } else {
      // 🧹 Clear everything if no record found
      setCheckIn("");
      setCheckOut("");
      setWorkMode("");
    }
  }, [date, attendance]);

  console.log("attendance", attendance);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const selected = new Date(date);
      selected.setHours(0, 0, 0, 0); // normalize date to midnight

      const today = new Date();

      today.setHours(0, 0, 0, 0);

      const todayDate = today.getDate();
      let windowStart;
      let windowEnd;

      // Determine rolling window
      if (todayDate <= 5) {
        // Previous month → yesterday of current month
        windowStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      } else {
        // Current month → yesterday
        windowStart = new Date(today.getFullYear(), today.getMonth(), 1);
      }
      windowEnd = new Date(today);
      windowEnd.setDate(today.getDate() - 1);
      windowEnd.setHours(23, 59, 59, 999);

      console.log("windowStart:", windowStart);
      console.log("windowEnd:", windowEnd);

      //  Block if outside allowed window
      if (selected < windowStart || selected > windowEnd) {
        alert(
          " Regularization is allowed only for past dates within the permitted window.",
        );
        setMessage(
          " You can apply regularization only for past dates within the allowed period.",
        );
        return;
      }

      // ✅ Use reference weeklyOffs (already fetched in useEffect)
      const day = selected.getDay(); // 0 = Sunday, 6 = Saturday

      // 🚫 Sunday Off Check
      if (weeklyOffs.sundayOff && day === 0) {
        alert("❌ You cannot apply regularization on a Sunday (Weekly Off)");
        setMessage("❌ Regularization not allowed on Sunday");
        return;
      }

      // 🚫 2nd/4th Saturday Off Check
      if (day === 6 && Array.isArray(weeklyOffs.saturdays)) {
        const firstDay = new Date(
          selected.getFullYear(),
          selected.getMonth(),
          1,
        );
        let saturdayCount = 0;
        for (
          let temp = new Date(firstDay);
          temp <= selected;
          temp.setDate(temp.getDate() + 1)
        ) {
          if (temp.getDay() === 6) saturdayCount++;
        }

        if (weeklyOffs.saturdays.includes(saturdayCount)) {
          alert(
            `❌ You cannot apply regularization on Weekly Off Saturday (${date})`,
          );
          setMessage("❌ Regularization not allowed on 2nd/4th Saturday");
          return;
        }
      }

      //       // 🚫 BLOCK REGULARIZATION IF CHECK-IN/CHECK-OUT ALREADY EXISTS FOR THAT DATE
      // const existingAttendance = attendance.find((a) => {
      //     const recordDate = new Date(a.date);
      //     const selectedDate = new Date(date);

      //     recordDate.setHours(0, 0, 0, 0);
      //     selectedDate.setHours(0, 0, 0, 0);

      //     return recordDate.getTime() === selectedDate.getTime();
      // });

      // // 👉 If employee already checked-in or checked-out for that day
      // if (existingAttendance && (existingAttendance.checkIn || existingAttendance.checkOut)) {
      //     alert("❌ You cannot apply regularization for this date because check-in/check-out is already recorded.");
      //     setMessage("❌ Regularization not allowed because attendance already exists for this date.");
      //     return;
      // }
      //new code
      const existingAttendance = attendance.find((a) => {
        const recordDate = new Date(a.date);
        const selectedDate = new Date(date);

        recordDate.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);

        return recordDate.getTime() === selectedDate.getTime();
      });

      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      //1) Today + check-in done + no check-out ask to check out first
      if (
        existingAttendance &&
        existingAttendance.checkIn &&
        !existingAttendance.checkOut &&
        selectedDate.getTime() === today.getTime()
      ) {
        alert(
          "Please check out first before applying regularization for today.",
        );
        setMessage(
          "Please check out first before applying regularization for today.",
        );
        return;
      }

      // 2) Full attendance (both check-in and check-out) block regularization
      if (
        existingAttendance &&
        existingAttendance.checkIn &&
        existingAttendance.checkOut
      ) {
        alert(
          "You cannot apply regularization for this date because check-in and check-out are already recorded.",
        );
        setMessage(
          "Regularization not allowed because full attendance already exists for this date.",
        );
        return;
      }

      // 1️⃣ Fetch existing leaves for the employee
      const leaveRes = await axios.get(
        `http://localhost:8000/leave/my/${user._id}`,
      );
      const leaves = leaveRes.data || [];

      // 🔹 Check if the selected date falls in any leave range
      const isLeaveDay = leaves.some((leave) => {
        const from = new Date(leave.dateFrom);
        const to = new Date(leave.dateTo);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
        return (
          selected >= from && selected <= to && leave.status !== "rejected"
        );
      });

      if (isLeaveDay) {
        alert("❌ You cannot apply regularization on a leave date!");
        setMessage("❌ You cannot apply regularization on a leave date!");
        return;
      }
      // 2️⃣ Fetch holidays dynamically
      const currentYear = new Date().getFullYear();
      const holidaysRes = await axios.get("http://localhost:8000/getHolidays");
      const holidays = holidaysRes.data.filter(
        (h) => new Date(h.date).getFullYear() === currentYear,
      );

      // 🔹 Check if selected date is a holiday
      const isHoliday = holidays.some((holiday) => {
        const holidayDate = new Date(holiday.date);
        holidayDate.setHours(0, 0, 0, 0);
        return holidayDate.getTime() === selected.getTime();
      });

      if (isHoliday) {
        alert(
          "🎉 It's a holiday! You cannot apply regularization on this date.",
        );
        setMessage("🎉 You cannot apply regularization on a holiday.");
        return;
      }

      // 3 Fetch existing regularization requests (✅ fixed link)
      const regRes = await axios.get(
        `http://localhost:8000/attendance/regularization/my/${user._id}`,
      );
      const regularizations = regRes.data || [];

      // 🔹 Check if already applied regularization for same date (Pending or Approved)
      const alreadyApplied = regularizations.some((reg) => {
        const regDate = new Date(reg.date);
        regDate.setHours(0, 0, 0, 0);
        const status = reg?.regularizationRequest?.status || "";
        return (
          regDate.getTime() === selected.getTime() &&
          (status === "Pending" || status === "Approved")
        );
      });

      if (alreadyApplied) {
        alert("⚠️ You already applied regularization for this date!");
        setMessage("⚠️ You already applied regularization for this date!");
        return;
      }

      // 3️⃣ If all checks pass → Submit regularization request
      const token = localStorage.getItem("accessToken");
      const authAxios = axios.create({
        baseURL: "http://localhost:8000",
        headers: { Authorization: `Bearer ${token}` },
      });

      const res = await authAxios.post("/attendance/regularization/apply", {
        employeeId: user._id,
        date,
        requestedCheckIn: checkIn || null,
        requestedCheckOut: checkOut || null,
        mode: workMode,
        reason: reason.trim(),
      });
      console.log("res", res);
      // ✅ Reset after success
      setRefresh((prev) => !prev);
      alert("✅ Regularization request submitted successfully!");
      setShowModal(false);
      // setDate("");
      // setCheckIn("");
      // setCheckOut("");
      // setMessage("");
      setDate("");
      setCheckIn("");
      setCheckOut("");
      setCheckInTime(null);
setCheckOutTime(null);
      setWorkMode("");
      setMessage("");
      setReason("");
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        "Something went wrong while applying regularization.";

      alert(`❌ ${errorMessage}`);
      setMessage(errorMessage);
    }
  finally {
    setIsSubmitting(false);
  }
  };

  // ✅ Date limits
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = today.getMonth();
  const maxDate = today.toISOString().split("T")[0];
  const minDate = new Date(yyyy, mm, 1).toISOString().split("T")[0];

  const checkInMissing = !selectedRecord?.checkIn && !selectedRecord?.leaveType;
  const checkOutMissing =
    !selectedRecord?.checkOut && !selectedRecord?.leaveType;
//bg scroll stop
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    useEffect;

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [showModal]);
  // dip code changes 11-02-2026
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
        Regularization
      </h2>

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

      {/* ✅ Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100 border-0">
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
                {acceptedCount}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "20px", color: "#3A5FBE" }}
              >
                Accepted Regularization Request
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100 border-0">
            <div
              className="card-body d-flex align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "40px",
                  backgroundColor: "#faccccff",
                  padding: "10px",
                  textAlign: "center",
                  minWidth: "75px",
                  minHeight: "75px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {rejectedCount}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "20px", color: "#3A5FBE" }}
              >
                Rejected Regularization Request
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card shadow-sm h-100 border-0">
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
                {pendingCount}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "20px", color: "#3A5FBE" }}
              >
                Pending Regularization Request
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Apply Button */}
      <button
        className="btn btn-sm custom-outline-btn"
        style={{ marginBottom: "30px" }}
        onClick={() => setShowModal(true)}
      >
        Apply Regularization
      </button>

      {/* 🔹 Modal */}
      {showModal && (
<div
  className="modal fade show d-block"
  ref={modalRef}
  tabIndex={-1}
 
  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
>
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ width: "600px" ,  }}
          >
            <div className="modal-content shadow-lg">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title">Apply Regularization</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  // onClick={() => setShowModal(false)}
                  onClick={() => {
                    setShowModal(false);
                    setDate("");
                    setCheckIn("");
                    setCheckOut("");
                    setCheckInTime(null);
setCheckOutTime(null);
                    setWorkMode("");
                    setMessage("");
                    setReason("");
                  }}
                ></button>
              </div>

              <div className="modal-body px-3">
                {/* {message && <p className="mt-2">{message}</p>} */}
                {date && (
                  <div className="mb-3">
                    <strong>Selected Date:</strong>{" "}
                    {new Date(date + "T00:00").toDateString()}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-2">
                    <label className="form-label">Date<span style={{ color: "red" }}>  *</span></label>
                    <input
                      type="date"
                      className="form-control"
                      value={date}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                      
                        setDate(selectedDate);
                      
                        setCheckIn("");
                        setCheckOut("");
                        setCheckInTime(null);
                        setCheckOutTime(null);
                      }}
                      required
                      //min={minDate}
                      max={maxDate}
                    />
                  </div>

                  {/* {checkInMissing && (
                    <div className="mb-2">
                      <label className="form-label">Requested Check-In Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={checkIn}
                       // onChange={(e) => setCheckIn(e.target.value)}
                        onChange={(e) => {
        setCheckIn(e.target.value);
        e.target.blur(); // 👈 This will close the time picker dropdown
      }}
                        required
                      />
                    </div>
                  )}

                  {checkOutMissing && (
                    <div className="mb-2">
                      <label className="form-label">Requested Check-Out Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={checkOut}
                       // onChange={(e) => setCheckOut(e.target.value)}
                       onChange={(e) => {
        setCheckOut(e.target.value);
        e.target.blur(); // 👈 This closes the dropdown right after selection
      }}
                        required
                      />
                    </div>
                  )} */}

                  {/* ✅ Requested Check-In Time */}
                  <div className="mb-2">
                    <label className="form-label">
                      Requested Check-In Time<span style={{ color: "red" }}>  *</span>
                    </label>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <TimePicker
                        label="Select Check-In Time"
                        value={checkInTime}
                        onOpen={() => setIsTimePickerOpen(true)}
                        onClose={() => setIsTimePickerOpen(false)}
                        onChange={(newValue) => {
                          setCheckInTime(newValue);
                        
                          if (newValue && dayjs(newValue).isValid()) {
                            setCheckIn(dayjs(newValue).format("HH:mm"));
                          } else {
                            setCheckIn("");
                          }
                        }}
                        viewRenderers={{
                          hours: renderTimeViewClock,
                          minutes: renderTimeViewClock,
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                          },

                        desktopPaper: {
                          sx: {
                            width: "320px",
                            height: "250px",

                            "& .MuiClock-root": {
                              transform: "scale(0.92)",
                              marginTop: "-7px",
                              marginRight:"5px"
                            },

                            "& .MuiDialogActions-root": {
                              marginTop: "-25px",
                            },
                          },
                        },

                        popper: {
                          placement: "top-start",
                          sx: {
                            "& .MuiPaper-root": {
                              transformOrigin: "bottom center",
                              marginBottom: "4px",
                            },
                          },
                        },
                        }}
                      />
                    </LocalizationProvider>
                  </div>

                  {/* ✅ Requested Check-Out Time */}
                  <div className="mb-2">
                    <label className="form-label">
                      Requested Check-Out Time<span style={{ color: "red" }}>  *</span>
                    </label>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <TimePicker
                        label="Select Check-Out Time"
                        value={checkOutTime}
                        onOpen={() => setIsTimePickerOpen(true)}
                        onClose={() => setIsTimePickerOpen(false)}
                        onChange={(newValue) => {
                          setCheckOutTime(newValue);
                        
                          if (newValue && dayjs(newValue).isValid()) {
                            setCheckOut(dayjs(newValue).format("HH:mm"));
                          } else {
                            setCheckOut("");
                          }
                        }}
                        viewRenderers={{
                          hours: renderTimeViewClock,
                          minutes: renderTimeViewClock,
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                          },

                        desktopPaper: {
                          sx: {
                            width: "320px",
                            height: "250px",

                            "& .MuiClock-root": {
                              transform: "scale(0.92)",
                              marginTop: "-7px",
                              marginRight:"5px"
                            },

                            "& .MuiDialogActions-root": {
                              marginTop: "-25px",
                            },
                          },
                        },

                        popper: {
                          placement: "top-start",
                          sx: {
                            "& .MuiPaper-root": {
                              transformOrigin: "bottom center",
                              marginBottom: "4px",
                            },
                          },
                        },
                        }}
                      />
                    </LocalizationProvider>
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Work Mode (optional)</label>
                    <select
                      className="form-control"
                      value={workMode}
                      onChange={(e) => setWorkMode(e.target.value)}
                    >
                      <option value="">-- Select Mode --</option>
                      <option value="Office">Office (WFO)</option>
                      <option value="WFH">Work From Home (WFH)</option>
                    </select>
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Reason<span style={{ color: "red" }}>  *</span> </label>
                    <textarea
                      className="form-control"
                      placeholder="Enter reason (Max 300 characters)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      required
                      maxLength={300}
                    ></textarea>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', textAlign: 'right' }}>{reason.length}/300
                    </div>
                  </div>

                 <div className="modal-footer">
                  <button
                    type="submit"
                    className="btn btn-sm custom-outline-btn"
                    style={{
                      minWidth: "90px",
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                    <button
                      type="button"
                      className="btn btn-sm custom-outline-btn"
                      style={{
                        minWidth: "90px",
                      }}
                      //onClick={() => setShowModal(false)}
                      onClick={() => {
                        setShowModal(false);
                        setDate("");
                        setCheckIn("");
                        setCheckOut("");
                        setCheckInTime(null);
                        setCheckOutTime(null);
                        setWorkMode("");
                        setMessage("");
                        setReason("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 List Table */}
      <EmployeeMyRegularization employeeId={user._id} refreshKey={refresh} />
    </div>
  );
}

export default ApplyRegularization;
