import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useNavigate, useParams } from "react-router-dom";

function TodaysEmployeeDetails() {

  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { role, username, id } = useParams();
  const navigate = useNavigate();
  const [showCardList, setShowCardList] = useState(null);

  // ✅ Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [presentCurrentPage, setPresentCurrentPage] = useState(1);
const [presentItemsPerPage, setPresentItemsPerPage] = useState(5);

const [absentCurrentPage, setAbsentCurrentPage] = useState(1);
const [absentItemsPerPage, setAbsentItemsPerPage] = useState(5);

  // NEW: Status filter state
  const [statusFilter, setStatusFilter] = useState("All");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("All");
  const [employeeNameFilter, setEmployeeNameFilter] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeBreaks, setEmployeeBreaks] = useState([]);
  const [breakLoading, setBreakLoading] = useState(false);
  const modalRef = useRef(null);
  const lateModalRef = useRef(null);
  const leaveModalRef = useRef(null);
  const [lateSearch, setLateSearch] = useState("");
 
  const [appliedLateSearch, setAppliedLateSearch] = useState("");
 const [lateFromDate, setLateFromDate] = useState("");
const [lateToDate, setLateToDate] = useState("");

const [appliedLateFromDate, setAppliedLateFromDate] = useState("");
const [appliedLateToDate, setAppliedLateToDate] = useState("");
const [lateCheckInEmployeesData, setLateCheckInEmployeesData] = useState([]);
const [leaveEmployees, setLeaveEmployees] = useState([]);
const [lateCurrentPage, setLateCurrentPage] = useState(1);
const [lateItemsPerPage, setLateItemsPerPage] = useState(5);
const [leaveCurrentPage, setLeaveCurrentPage] = useState(1);

const [leaveItemsPerPage, setLeaveItemsPerPage] = useState(5);
const [showLateModal, setShowLateModal] = useState(false);
const [showLeaveModal, setShowLeaveModal] = useState(false);
const [selectedLeaveEmployee, setSelectedLeaveEmployee] =useState(null);
const [selectedLateEmployee, setSelectedLateEmployee] = useState(null);
const [downloadedFile, setDownloadedFile] =useState("");
  const [leaveDate, setLeaveDate] = useState("");
  const [showPresentModal, setShowPresentModal] = useState(false);
const [selectedPresentEmployee, setSelectedPresentEmployee] = useState(null);

const [showAbsentModal, setShowAbsentModal] = useState(false);
const [selectedAbsentEmployee, setSelectedAbsentEmployee] = useState(null);
const [presentSearch, setPresentSearch] = useState("");
const [appliedPresentSearch, setAppliedPresentSearch] = useState("");
const [absentSearch, setAbsentSearch] = useState("");
const [appliedAbsentSearch, setAppliedAbsentSearch] = useState("");
      useEffect(() => {
            const isModalOpen = showModal || showLateModal ||showLeaveModal;
          
            if ((!showModal && !showLateModal && !showLeaveModal) || (!modalRef.current && !lateModalRef.current && !leaveModalRef.current))
              return;
          
              let modal = null;
              if (showModal) modal = modalRef.current;
              else if (showLateModal) modal = lateModalRef.current;
              else if (showLeaveModal) modal = leaveModalRef.current;
              
          
            const focusableElements = modal.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
          
            const firstEl = focusableElements[0];
            const lastEl =
              focusableElements[focusableElements.length - 1];
          
            modal.focus();
          
            const handleKeyDown = (e) => {
              if (e.key === "Escape") {
                e.preventDefault();
          
                if (showModal) {
                  setShowModal(false);
                }
          
                if (showLateModal) {
                  setShowLateModal(false);
                }
              if (showLeaveModal) {
                setShowLeaveModal(false);
              }
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
              modal.removeEventListener(
                "keydown",
                handleKeyDown
              );
            };
      }, [showModal, showLateModal,showLeaveModal]);

  useEffect(() => {
  const isModalOpen = showModal || showLateModal||showLeaveModal||showPresentModal||showAbsentModal;

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
}, [showModal, showLateModal,showLeaveModal,showAbsentModal,showPresentModal]);
  const openEmployeePopup = async (emp) => {
    try {
      setSelectedEmployee(emp);
      setShowModal(true);
      setBreakLoading(true);

      const token = localStorage.getItem("accessToken");

      //  today date
      const today = new Date().toISOString().split("T")[0];

      const res = await axios.get(
        `http://localhost:8000/api/break/admin/${emp._id}?date=${today}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // API returns array → take today's record
      const todayBreakDoc = res.data?.[0];

      setEmployeeBreaks(todayBreakDoc?.breaks || []);
    } catch (error) {
      console.error("Failed to fetch breaks", error);
      setEmployeeBreaks([]);
    } finally {
      setBreakLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEmployee(null);
  };
  const getCompletedBreaks = (breaks = []) =>
    breaks.filter((b) => b.startTime && b.endTime);

  const getBreakDurationInMinutes = (start, end) => {
    if (!start || !end) return 0;
    return Math.floor((new Date(end) - new Date(start)) / (1000 * 60));
  };

  const getTotalBreakMinutes = (breaks = []) =>
    getCompletedBreaks(breaks).reduce(
      (total, brk) =>
        total + getBreakDurationInMinutes(brk.startTime, brk.endTime),
      0,
    );

  const formatMinutes = (mins) => {
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem === 0 ? `${hrs} hr` : `${hrs} hr ${rem} min`;
  };
  const formatDurationHMS = (start, end) => {
    if (!start || !end) return "0 sec";

    const diffMs = new Date(end) - new Date(start);
    const totalSeconds = Math.floor(diffMs / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let result = [];
    if (hours > 0) result.push(`${hours} hr`);
    if (minutes > 0) result.push(`${minutes} min`);
    if (seconds > 0 || result.length === 0) result.push(`${seconds} sec`);

    return result.join(" ");
  };

  const getTotalBreakDurationHMS = (breaks = []) => {
    const totalSeconds = getCompletedBreaks(breaks).reduce((total, brk) => {
      return (
        total +
        Math.floor((new Date(brk.endTime) - new Date(brk.startTime)) / 1000)
      );
    }, 0);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let result = [];
    if (hours > 0) result.push(`${hours} hr`);
    if (minutes > 0) result.push(`${minutes} min`);
    if (seconds > 0 || result.length === 0) result.push(`${seconds} sec`);

    return result.join(" ");
  };

  // ✅ Summary counts
  const [summary, setSummary] = useState({
    present: 0,
    absent: 0,
    lateCheckIn: 0,
  });

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        const authAxios = axios.create({
          baseURL: "http://localhost:8000",
          headers: { Authorization: `Bearer ${token}` },
        });

        // const res = await authAxios.get("/attendance/today");
        // const employees = res.data?.employees || [];
        //Added by Harshada
        const res = await authAxios.get("/attendance/today");
        const employees = res.data?.employees || [];

   

        const today = new Date().toISOString().split("T")[0];

        // Fetch break for each employee
        const employeesWithBreaks = await Promise.all(
          employees.map(async (emp) => {
            try {
              const breakRes = await authAxios.get(
                `/api/break/admin/${emp._id}?date=${today}`
              );

              const todayBreakDoc = breakRes.data?.[0];

              return {
                ...emp,
                breaks: todayBreakDoc?.breaks || [],
              };
            } catch (err) {
              return {
                ...emp,
                breaks: [],
              };
            }
          })
        );

        // ✅ Calculate counts
        let present = 0;
        let absent = 0;
        let lateCheckIn = 0;
        let onLeave = 0;
             const leaveRes = await authAxios.get(
  "/attendance/on-leave-employees"
);

const leaveEmployeesData =
  leaveRes.data?.employees || [];
  console.log("Leave API", leaveRes.data);

onLeave = leaveRes.data?.count || 0;

setLeaveEmployees(leaveEmployeesData);

        employees.forEach((emp) => {
          const checkIn = emp.checkInTime;
          const checkOut = emp.checkOutTime;
          const workingHours = calculateWorkingHours(checkIn, checkOut);
          // const status = getStatus(checkIn, checkOut, workingHours);
        
          const status = getStatus(
  checkIn,
  checkOut,
  workingHours,
  emp.lateCheckInCount || 0
);
          if (status === "Present" || status === "Working" || status === "Late Check-In") present++;
          else if (status === "Absent") absent++;
        
          // Late check-in logic same
          if (checkIn) {
            const dt = new Date(checkIn);
            const hours = dt.getHours();
            const minutes = dt.getMinutes();
        
            if (hours > 9 || (hours === 9 && minutes > 10)){
              lateCheckIn++;
            }
          }
        });
        
        setSummary({ present, absent, lateCheckIn,onLeave, });
        //Added by Harshada - to include breaks in employee data
        setAttendanceData({
          ...res.data,
          employees: employeesWithBreaks,
        });
      } catch (err) {
        console.error(err);
        setError("Failed to fetch today's attendance.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);
  useEffect(() => {
    if (attendanceData?.employees) {
      setFilteredEmployees(attendanceData.employees);
    }
  }, [attendanceData]);
  const calculateWorkingHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const diffMs = new Date(checkOut) - new Date(checkIn);
    const diffHrs = diffMs / (1000 * 60 * 60);
    return diffHrs.toFixed(2);
  };

  
const getStatus = (
  checkIn,
  checkOut,
  workingHours,
  lateCheckInCount = 0
) => {

  // ❌ No check-in
  if (!checkIn) {
    return "Absent";
  }

  // ✅ Current working employee (not checked out yet)
  if (checkIn && !checkOut) {

    // 1st & 2nd late attempt
    if (lateCheckInCount === 1 || lateCheckInCount === 2) {
      return "Working";
    }

    // 3rd late attempt
    if (lateCheckInCount >= 3) {
      return "Half Day/Late Check-In";
    }

    return "Working";
  }

  // ❌ Less than 4 hrs
  if (workingHours < 4) {
    return "Absent";
  }

  // ⚠️ Between 4 to 8 hrs
  if (workingHours >= 4 && workingHours < 8) {

    // 3rd late attempt
    if (lateCheckInCount >= 3) {
      return "Half Day/Late Check-In";
    }

    return "Half Day";
  }

  // ✅ 8+ hrs completed
  if (workingHours >= 8) {

    // 1st & 2nd late check-in
    if (lateCheckInCount === 1 || lateCheckInCount === 2) {
      return "Present/Late Check-In";
    }

    // 3rd late check-in
    if (lateCheckInCount >= 3) {
      return "Half Day/Late Check-In";
    }

    return "Present";
  }

  return "Absent";
};

  const employees = attendanceData?.employees || [];
  const presentEmployees = employees.filter((emp) => {
  const status = getStatus(
    emp.checkInTime,
    emp.checkOutTime,
    calculateWorkingHours(
      emp.checkInTime,
      emp.checkOutTime
    ),
    emp.lateCheckInCount || 0
  );

  return (
    status === "Present" ||
    status === "Working" ||
    status === "Present/Late Check-In"
  );
});
const filteredPresentEmployees = presentEmployees.filter((emp) =>
  emp.name
    ?.toLowerCase()
    .includes(appliedPresentSearch.toLowerCase())
);
const absentEmployees = employees.filter((emp) => {
  const status = getStatus(
    emp.checkInTime,
    emp.checkOutTime,
    calculateWorkingHours(
      emp.checkInTime,
      emp.checkOutTime
    ),
    emp.lateCheckInCount || 0
  );

  return status === "Absent";
});
const filteredAbsentEmployees = absentEmployees.filter((emp) =>
  emp.name
    ?.toLowerCase()
    .includes(appliedAbsentSearch.toLowerCase())
);
const lateCheckInEmployees = useMemo(() => {
  if (lateCheckInEmployeesData.length > 0) {
    return lateCheckInEmployeesData;
  }
  return employees.filter((emp) => {
    if (!emp.checkInTime) return false;

    const dt = new Date(emp.checkInTime);
    const hours = dt.getHours();
    const minutes = dt.getMinutes();

    const isLate =
      hours > 9 || (hours === 9 && minutes > 10);

    const matchesName =
      appliedLateSearch.trim() === "" ||
      emp.name
        .toLowerCase()
        .includes(appliedLateSearch.toLowerCase());

    const empDate = new Date(emp.checkInTime);
const matchesDate =
  (!appliedLateFromDate && !appliedLateToDate) ||
  (
    (!appliedLateFromDate ||
      empDate >= new Date(appliedLateFromDate)) &&
    (!appliedLateToDate ||
      empDate <= new Date(appliedLateToDate))
  );

    return isLate && matchesName && matchesDate;
   
  });
}, [
  employees,
  appliedLateSearch,
  appliedLateFromDate,
  appliedLateToDate,
  lateCheckInEmployeesData,
]);

const lateTotalPages = Math.ceil(
  lateCheckInEmployees.length / lateItemsPerPage
);

const lateIndexOfLastItem =
  lateCurrentPage * lateItemsPerPage;

const lateIndexOfFirstItem =
  lateIndexOfLastItem - lateItemsPerPage;

const currentLateEmployees =
  lateCheckInEmployees.slice(
    lateIndexOfFirstItem,
    lateIndexOfLastItem
  );
 const presentTotalPages = Math.ceil(
  filteredPresentEmployees.length / presentItemsPerPage
);

const presentIndexOfLastItem =
  presentCurrentPage * presentItemsPerPage;

const presentIndexOfFirstItem =
  presentIndexOfLastItem - presentItemsPerPage;

const currentPresentEmployees =
  filteredPresentEmployees.slice(
    presentIndexOfFirstItem,
    presentIndexOfLastItem
  );

const absentTotalPages = Math.ceil(
  filteredAbsentEmployees.length / absentItemsPerPage
);

const absentIndexOfLastItem =
  absentCurrentPage * absentItemsPerPage;

const absentIndexOfFirstItem =
  absentIndexOfLastItem - absentItemsPerPage;

const currentAbsentEmployees =
  filteredAbsentEmployees.slice(
    absentIndexOfFirstItem,
    absentIndexOfLastItem
  );


const fetchLateCheckInHistory = async () => {
  if (!lateFromDate && !lateToDate) {
    setLateCheckInEmployeesData([]);
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const fromDate = lateFromDate || today;
  const toDate = lateToDate || today;

  try {
    const token = localStorage.getItem("accessToken");
    const res = await axios.get(
      `http://localhost:8000/attendance/late-checkins`,
      {
        params: {
          from: fromDate,
          to: toDate,
          name: lateSearch,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setLateCheckInEmployeesData(res.data);
    setLateCurrentPage(1);
  } catch (err) {
    console.error(err);
    setLateCheckInEmployeesData([]);
  }
};

useEffect(() => {
  if (showCardList === "lateCheckIn") {
    fetchLateCheckInHistory();
  }
}, [showCardList]);

const downloadLateCheckInExcel = () => {  
  const employeeName = lateSearch?.trim() ||"All_Employees";

  const safeName =
    employeeName.replace(/\s+/g, "_");

  // prevent same file multiple times
  if (downloadedFile === safeName) return;

  try {

    const excelData =
      lateCheckInEmployees.map((emp) => ({
        Name: emp.name,

        "Check-In Time": new Date(
          emp.checkInTime
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),

        Date: new Date(
          emp.checkInTime
        ).toLocaleDateString(),

        Status: "Late Check-In",
      }));

    const worksheet =
      XLSX.utils.json_to_sheet(excelData);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Late Check-Ins"
    );

    XLSX.writeFile(
      workbook,
      `${safeName}_Late_CheckIns.xlsx`
    );

    setDownloadedFile(safeName);

  } catch (err) {

    console.error(err);
  }
};

const openLateModal = (emp) => {
  setSelectedLateEmployee(emp);
  setShowLateModal(true);
};

const closeLateModal = () => {
  setShowLateModal(false);
  setSelectedLateEmployee(null);
};

const openLeaveModal = (emp) => {
  setSelectedLeaveEmployee(emp);
  setShowLeaveModal(true);
};

const closeLeaveModal = () => {
  setShowLeaveModal(false);
  setSelectedLeaveEmployee(null);
};
const openPresentModal = (emp) => {
  setSelectedPresentEmployee(emp);
  setShowPresentModal(true);
};

const closePresentModal = () => {
  setShowPresentModal(false);
  setSelectedPresentEmployee(null);
};

const openAbsentModal = (emp) => {
  setSelectedAbsentEmployee(emp);
  setShowAbsentModal(true);
};

const closeAbsentModal = () => {
  setShowAbsentModal(false);
  setSelectedAbsentEmployee(null);
};
 if (loading)
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div
          className="spinner-grow"
          role="status"
          style={{ width: "4rem", height: "4rem", color: "#3A5FBE" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 fw-semibold" style={{ color: "#3A5FBE" }}>
          Loading ...
        </p>
      </div>
    );

if (error) {
  return (
    <div className="container-fluid">
      <p className="text-danger">{error}</p>
    </div>
  );
}

  const applyFilters = () => {
    const employeesList = attendanceData?.employees || [];
    let temp = [...employeesList];
    setAppliedStatusFilter(statusFilter);

    // Status filter
    if (statusFilter !== "All") {
      temp = temp.filter((emp) => {
        const checkIn = emp.checkInTime;
        const checkOut = emp.checkOutTime;
        const workingHours = calculateWorkingHours(checkIn, checkOut);
       const status = getStatus(
  checkIn,
  checkOut,
  workingHours,
  emp.lateCheckInCount
);

        // ✅ Late Check-In
        if (statusFilter === "Late Check-In") {
          if (!checkIn) return false;

          const dt = new Date(checkIn);
          const hours = dt.getHours();
          const minutes = dt.getMinutes();

          return hours > 9 || (hours === 9 && minutes > 10);
        }

        // ✅ Present should include Working
        if (statusFilter === "Present") {
          return status === "Present" || status === "Working";
        }

        // ✅ Default
        return status === statusFilter;
      });
    }
    // Name filter
    if (employeeNameFilter.trim() !== "") {
      temp = temp.filter((emp) =>
        emp.name
          .toLowerCase()
          .includes(employeeNameFilter.trim().toLowerCase()),
      );
    }

    setFilteredEmployees(temp);
    setCurrentPage(1); // reset to first page
  };

  // CHANGED: Use filteredEmployees instead of employees for pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = filteredEmployees.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };


  console.log("currentEmployees", currentEmployees);

  const leaveTotalPages = Math.ceil(
  leaveEmployees.length / leaveItemsPerPage
);

const leaveIndexOfLastItem =
  leaveCurrentPage * leaveItemsPerPage;

const leaveIndexOfFirstItem =
  leaveIndexOfLastItem - leaveItemsPerPage;

const currentLeaveEmployees =
  leaveEmployees.slice(
    leaveIndexOfFirstItem,
    leaveIndexOfLastItem
  );

  return (
    <div className="container-fluid">
      <h2
        style={{
          color: "#3A5FBE",
          fontSize: "25px",
          marginLeft: "15px",
          marginBottom: "30px",
        }}
      >
        Today's Attendance Details
      </h2>

      {/* ✅ Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-4">
          <div
            className="card shadow-sm h-100 border-0"
            style={{ cursor: "pointer" }}
            onClick={() => setShowCardList("present")}
          >
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
                  minWidth: "75px", // Fixed minimum width
                  minHeight: "75px", // Fixed minimum height
                  display: "flex", // Center content
                  alignItems: "center", // Center vertically
                  justifyContent: "center", // Center horizontally
                }}
              >
                {summary.present}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "20px", color: "#3A5FBE" }}
              >
                Total Present Employees
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-4">
          <div
                className="card shadow-sm h-100 border-0"
                style={{ cursor: "pointer" }}
                onClick={() => setShowCardList("absent")}
              >
            <div
              className="card-body d-flex  align-items-center"
              style={{ gap: "20px" }}
            >
              <h4
                className="mb-0"
                style={{
                  fontSize: "40px",
                  backgroundColor: "#F8D7DA",
                  padding: "10px",
                  textAlign: "center",
                  minWidth: "75px", // Fixed minimum width
                  minHeight: "75px", // Fixed minimum height
                  display: "flex", // Center content
                  alignItems: "center", // Center vertically
                  justifyContent: "center", // Center horizontally
                }}
              >
                {summary.absent}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "20px", color: "#3A5FBE" }}
              >
                Total Absent Employees
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-4">
  <div
  className="card shadow-sm h-100 border-0"
  style={{ cursor: "pointer" }}
  onClick={() => setShowCardList("lateCheckIn")}
>
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
                  minWidth: "75px", // Fixed minimum width
                  minHeight: "75px", // Fixed minimum height
                  display: "flex", // Center content
                  alignItems: "center", // Center vertically
                  justifyContent: "center", // Center horizontally
                }}
              >
                {summary.lateCheckIn}
              </h4>
              <p
                className="mb-0 fw-semibold"
                style={{ fontSize: "20px", color: "#3A5FBE" }}
              >
                Late Check-In
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-md-3 mb-4">
<div
  className="card shadow-sm h-100 border-0"
  style={{ cursor: "pointer" }}
  onClick={() => setShowCardList("onLeave")}
>
    <div
      className="card-body d-flex align-items-center"
      style={{ gap: "20px" }}
    >
      <h4
        className="mb-0"
        style={{
          fontSize: "40px",
          backgroundColor: "#D6E4FF",
          padding: "10px",
          textAlign: "center",
          minWidth: "75px",
          minHeight: "75px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {summary.onLeave}
      </h4>

      <p
        className="mb-0 fw-semibold"
        style={{
          fontSize: "20px",
          color: "#3A5FBE",
        }}
      >
        Employees On Leave
      </p>
    </div>
  </div>
</div>
      </div>
      
      {showCardList === "lateCheckIn" ? (
  <>
  <div className="d-flex justify-content-between align-items-center mb-3">
  <h2
    style={{
      color: "#3A5FBE",
      fontSize: "25px",
      marginBottom: 0,
    }}
  >
    Late Check-In Employees
  </h2>

  <button
    className="btn btn-sm custom-outline-btn"
    style={{ minWidth: 90 }}
    onClick={() => setShowCardList(null)}
  >
    Close
  </button>
</div>
<div className="card mb-4 shadow-sm border-0">
  <div className="card-body">
    <div className="row align-items-center g-3">
      
      {/* Search */}
         <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-2">
              <label
                htmlFor="employeeNameFilter"
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  width: "50px",
                  fontSize: "16px",
                  color: "#3A5FBE",
                  marginRight: "2px",
                }}
              >
                Name
              </label>

          <input
            type="text"
            className="form-control"
            value={lateSearch}
              placeholder="Search by any field"
onChange={(e) => {

  const value = e.target.value;
  if (/^[A-Za-z\s]*$/.test(value)) {
    setLateSearch(value);
  }
}}
          />
      
      </div>

{/* From Date */}
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
  type="date"
  className="form-control"
  value={lateFromDate}
  max={lateToDate ||new Date().toISOString().split("T")[0]}
  onChange={(e) =>
    setLateFromDate(e.target.value)
  }
/>
  
</div>

{/* To Date */}
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
  type="date"
  className="form-control"
  value={lateToDate}
  min={lateFromDate}
  max={new Date().toISOString().split("T")[0]}
  onChange={(e) =>
    setLateToDate(e.target.value)
  }
/>
  
</div>

      {/* Buttons */}
   {/* Buttons */}
     <div className="col-12 col-md-auto ms-md-auto d-flex gap-2 mb-1 justify-content-end">
<button
  type="button"
  className="btn btn-sm custom-outline-btn"
  style={{ minWidth: 110 }}
  onClick={downloadLateCheckInExcel}
  disabled={
    downloadedFile ===
    (
      lateSearch?.trim() ||
      "All_Employees"
    ).replace(/\s+/g, "_")
  }
>
  Download Excel
</button>

  <button
    type="button"
    className="btn btn-sm custom-outline-btn"
    style={{ minWidth: 90 }}
onClick={fetchLateCheckInHistory}

  >
    Filter
  </button>

  <button
  type="button"
  className="btn btn-sm custom-outline-btn"
  style={{ minWidth: 90 }}
onClick={() => {
  setLateSearch("");
  setLateFromDate("");
  setLateToDate("");
  setLateCurrentPage(1);
// setLateCheckInEmployeesData([]);
setDownloadedFile("");
fetchLateCheckInHistory();
}}
>
  Reset
</button>
</div>
  </div>
    </div>
  </div>



  
    <div className="card shadow-sm border-0 mb-0">
     

      <div className="card-body p-0 table-responsive bg-white">
        <table className="table table-hover mb-0">
          <thead>
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
  Employee ID
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
  Name
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
  Check-In Time
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
  Date
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
  Late Check-In By
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
            </tr>
          </thead>

          <tbody>
            

        {lateCheckInEmployees.length === 0 ? (
  <tr>
     <td
                          colSpan="6"
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
currentLateEmployees.map((emp) => (
<tr
  key={emp._id}
  style={{ cursor: "pointer" }}
  onClick={() => openLateModal(emp)}
>
  <td
  style={{
    padding: "12px",
    fontSize: "14px",
    borderBottom: "1px solid #dee2e6",
    whiteSpace: "nowrap",
  }}
>
{emp.employeeId || emp.employee?.employeeId || "-"}
</td>
               <td
  style={{
    padding: "12px",
    fontSize: "14px",
    borderBottom: "1px solid #dee2e6",
    whiteSpace: "nowrap",
  }}
>
  {emp.name}
</td>

   <td   
  style={{
    padding: "12px",
    fontSize: "14px",
    borderBottom: "1px solid #dee2e6",
    whiteSpace: "nowrap",
  }}
>
                  {new Date(emp.checkInTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                   <td   
              style={{
                padding: "12px",
                fontSize: "14px",
                borderBottom: "1px solid #dee2e6",
                whiteSpace: "nowrap",
              }}
            >
            {new Date(emp.checkInTime).toLocaleDateString(
  "en-GB",
  {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }
)}      
                </td>
                <td
  style={{
    padding: "12px",
    fontSize: "14px",
    borderBottom: "1px solid #dee2e6",
    whiteSpace: "nowrap",
  }}
>
  {(() => {
    const checkIn = new Date(emp.checkInTime);

    const officeTime = new Date(checkIn);
    officeTime.setHours(9, 10, 0, 0);

    const diffMs = checkIn - officeTime;

    const totalMinutes = Math.floor(diffMs / (1000 * 60));

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (totalMinutes <= 0) return "-";

    if (hours > 0) {
      return `${hours} hr ${minutes} min late`;
    }

    return `${minutes} min late`;
  })()}
</td>

                <td   style={{
                    padding: "12px",
                    fontSize: "14px",
                    borderBottom: "1px solid #dee2e6",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
               style={{
  background: "#FFE493",
  display: "inline-block",
  padding: "6px 12px",
  fontWeight: 400,
  fontSize: "14px",
  width: "112px",
  textAlign: "center",
  borderRadius: "4px",
  lineHeight: "20px",
}}
                  >
                    Late Check-In
                  </span>
                </td>
              </tr>
            
            ))
)}
          </tbody>
        </table>
        
      </div>
    </div>
    <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
  <div className="d-flex align-items-center gap-3">

    <div className="d-flex align-items-center">
      <span style={{ fontSize: "14px", marginRight: "8px" }}>
        Rows per page:
      </span>

      <select
        className="form-select form-select-sm"
        style={{ width: "auto", fontSize: "14px" }}
        value={lateItemsPerPage}
        onChange={(e) => {
          setLateItemsPerPage(Number(e.target.value));
          setLateCurrentPage(1);
        }}
      >
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={25}>25</option>
      </select>
    </div>

    <span style={{ fontSize: "14px" }}>
      {lateCheckInEmployees.length > 0
        ? lateIndexOfFirstItem + 1
        : 0}
      -
      {Math.min(
        lateIndexOfLastItem,
        lateCheckInEmployees.length
      )}{" "}
      of {lateCheckInEmployees.length}
    </span>

    <div className="d-flex align-items-center">
      <button
        className="btn btn-sm focus-ring"
        disabled={lateCurrentPage === 1}
        onClick={() =>
          setLateCurrentPage((prev) => prev - 1)
        }
      >
        ‹
      </button>

      <button
        className="btn btn-sm focus-ring"
        disabled={
          lateCurrentPage === lateTotalPages ||
          lateTotalPages === 0
        }
        onClick={() =>
          setLateCurrentPage((prev) => prev + 1)
        }
      >
        ›
      </button>
    </div>
  </div>
</nav>
  {showLateModal && selectedLateEmployee && (
  <div
  ref={lateModalRef}
          tabIndex="-1"
    className="modal fade show"
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 1050,
    }}
  >
    <div
      className="modal-dialog modal-dialog-centered"
      style={{ maxWidth: "500px", width: "100%" }}
    >
      <div className="modal-content">

        <div
          className="modal-header text-white"
          style={{ backgroundColor: "#3A5FBE" }}
        >
          <h5 className="modal-title">
            Late Check-In Details
          </h5>

          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={closeLateModal}
          />
        </div>

        <div className="modal-body">

       <div className="row mb-3">
  <div className="col-4 fw-bold">Name </div>
  <div className="col-8">{selectedLateEmployee.name}</div>
</div>

<div className="row mb-3">
  <div className="col-4 fw-bold">Check-In Time </div>
  <div className="col-8">
    {new Date(selectedLateEmployee.checkInTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}
  </div>
</div>

<div className="row mb-3">
  <div className="col-4 fw-bold">Date </div>
  <div className="col-8">
    {new Date(
  selectedLateEmployee.checkInTime
).toLocaleDateString(
  "en-GB",
  {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }
)}
  </div>
</div>

<div className="row mb-3">
  <div className="col-4 fw-bold">Status </div>
  <div className="col-8">
<span
  className="badge text-dark"
  style={{
    backgroundColor: "#FFE493",
    padding: "6px 12px",
    fontSize: "14px",
    fontWeight: "500",
    borderRadius: "0.375rem",
  }}
>
  Late Check-In
</span>
  </div>
</div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-sm custom-outline-btn"
            style={{ minWidth: 90 }}
            onClick={closeLateModal}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}


  </>
) : showCardList === "present" ? (
<>
  <div className="d-flex justify-content-between align-items-center mb-3">
    <h2
      style={{
        color: "#3A5FBE",
        fontSize: "25px",
        marginBottom: 0,
      }}
    >
      Present Employees
    </h2>

    <button
      className="btn btn-sm custom-outline-btn"
      onClick={() => setShowCardList(null)}
       style={{ minWidth: 90 }}
    >
      Close
    </button>
  </div>
  <div className="card mb-4 shadow-sm border-0">
  <div className="card-body">
    <div className="row align-items-center g-3">
   <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-2">

    <label
      className="fw-bold mb-0"
      style={{
        fontSize: "16px",
        color: "#3A5FBE",
      }}
    >
      Name
    </label>

    <input
      type="text"
      className="form-control"
      value={presentSearch}
      placeholder="Search by name"
      onChange={(e) => {
        const value = e.target.value;
        if (/^[A-Za-z\s]*$/.test(value)) {
          setPresentSearch(value);
        }
      }}
    />
</div>
<div className="col-12 col-md-auto ms-md-auto d-flex gap-2 mb-1 justify-content-end">
    <button
     className="btn btn-sm custom-outline-btn"
    style={{ minWidth: 90 }}
      onClick={() => {
        setAppliedPresentSearch(presentSearch);
        setPresentCurrentPage(1);
      }}
    >
      Filter
    </button>

    <button
     className="btn btn-sm custom-outline-btn"
    style={{ minWidth: 90 }}
      onClick={() => {
        setPresentSearch("");
        setAppliedPresentSearch("");
        setPresentCurrentPage(1);
      }}
    >
      Reset
    </button>

  </div>
</div>
</div>
</div>

    <div className="card shadow-sm border-0 mb-0">
      <div className="card-body p-0 table-responsive bg-white">
        <table className="table table-hover mb-0">
        <thead>
          <tr>
            <th   style={{
              fontWeight: "500",
              fontSize: "14px",
              color: "#6c757d",
              borderBottom: "2px solid #dee2e6",
              padding: "12px",
              whiteSpace: "nowrap",
            }}
            >
              Employee ID
              </th>

            <th   style={{
              fontWeight: "500",
              fontSize: "14px",
              color: "#6c757d",
              borderBottom: "2px solid #dee2e6",
              padding: "12px",
              whiteSpace: "nowrap",
            }}
            >
              Name
              </th>

            <th   style={{
              fontWeight: "500",
              fontSize: "14px",
              color: "#6c757d",
              borderBottom: "2px solid #dee2e6",
              padding: "12px",
              whiteSpace: "nowrap",
            }}
            >
              Check-In
              </th>

            <th   style={{
              fontWeight: "500",
              fontSize: "14px",
              color: "#6c757d",
              borderBottom: "2px solid #dee2e6",
              padding: "12px",
              whiteSpace: "nowrap",
            }}
            >
              Check-Out
              </th>

            <th   style={{
              fontWeight: "500",
              fontSize: "14px",
              color: "#6c757d",
              borderBottom: "2px solid #dee2e6",
              padding: "12px",
              whiteSpace: "nowrap",
            }}
            > 
            Total Hours
            </th>

            <th   style={{
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
          </tr>
        </thead>

        <tbody>
          {filteredPresentEmployees.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center">
                No data available
              </td>
            </tr>
          ) : (
            currentPresentEmployees.map((emp) => (
              
            <tr
                  key={emp._id}
                  style={{ cursor: "pointer" }}
                  onClick={() => openPresentModal(emp)}
                >
                <td style={{
                  padding: "12px",
                  fontSize: "14px",
                  borderBottom: "1px solid #dee2e6",
                  whiteSpace: "nowrap",
                }}
                > 
                {emp.employeeId}
                </td>

                <td style={{
                  padding: "12px",
                  fontSize: "14px",
                  borderBottom: "1px solid #dee2e6",
                  whiteSpace: "nowrap",
                }}
                >
                  {emp.name}
                  </td>

                <td style={{
                  padding: "12px",
                  fontSize: "14px",
                  borderBottom: "1px solid #dee2e6",
                  whiteSpace: "nowrap",
                }}
                >
                  {emp.checkInTime
                    ? new Date(
                        emp.checkInTime
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </td>

                <td style={{
                  padding: "12px",
                  fontSize: "14px",
                  borderBottom: "1px solid #dee2e6",
                  whiteSpace: "nowrap",
                }}>
                  {emp.checkOutTime
                    ? new Date(
                        emp.checkOutTime
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </td>

                <td style={{
                  padding: "10px",
                  fontSize: "14px",
                  borderBottom: "1px solid #dee2e6",
                  whiteSpace: "nowrap",
                }}>
                  {calculateWorkingHours(
                    emp.checkInTime,
                    emp.checkOutTime
                  ) || "-"}
                </td>
<td>
  <span
    style={{
      background:
        getStatus(
          emp.checkInTime,
          emp.checkOutTime,
          calculateWorkingHours(
            emp.checkInTime,
            emp.checkOutTime
          ),
          emp.lateCheckInCount || 0
        ) === "Working"
          ? "#cff4fc"
          : "#D7F5E4",
                    display: "inline-block",
                    padding: "6px 12px",
                    fontWeight: 400,
                    fontSize: "14px",
                    width: 112,
                    textAlign: "center",
    }}
  >
    {getStatus(
      emp.checkInTime,
      emp.checkOutTime,
      calculateWorkingHours(
        emp.checkInTime,
        emp.checkOutTime
      ),
      emp.lateCheckInCount || 0
    )}
  </span>
</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
  <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
  <div className="d-flex align-items-center gap-3">

    <div className="d-flex align-items-center">
      <span style={{ fontSize: "14px", marginRight: "8px" }}>
        Rows per page:
      </span>

      <select
        className="form-select form-select-sm"
        style={{ width: "auto" }}
        value={presentItemsPerPage}
        onChange={(e) => {
          setPresentItemsPerPage(Number(e.target.value));
          setPresentCurrentPage(1);
        }}
      >
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={25}>25</option>
      </select>
    </div>

    <span>
      {filteredPresentEmployees.length > 0
        ? presentIndexOfFirstItem + 1
        : 0}
      -
      {Math.min(
        presentIndexOfLastItem,
        filteredPresentEmployees.length
      )} of {filteredPresentEmployees.length}
    </span>

    <button
      className="btn btn-sm"
      disabled={presentCurrentPage === 1}
      onClick={() =>
        setPresentCurrentPage((prev) => prev - 1)
      }
    >
      ‹
    </button>

    <button
      className="btn btn-sm"
      disabled={
        presentCurrentPage === presentTotalPages
      }
      onClick={() =>
        setPresentCurrentPage((prev) => prev + 1)
      }
    >
      ›
    </button>

  </div>
</nav>
{showPresentModal && selectedPresentEmployee && (
  <div className="modal fade show" style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 1050,
  }}>
    <div className="modal-dialog modal-dialog-centered" style={{minWidth:550}}>
      <div className="modal-content">

        <div
          className="modal-header text-white"
          style={{ backgroundColor: "#3A5FBE" }}
        >
          <h5 className="modal-title">
            Present Employee Details
          </h5>

          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={closePresentModal}
          />
        </div>

       <div className="modal-body">

  <div className="row mb-3">
    <div className="col-4 fw-bold">Employee ID</div>
    <div className="col-8">
      {selectedPresentEmployee.employeeId || "-"}
    </div>
  </div>

  <div className="row mb-3">
    <div className="col-4 fw-bold">Name</div>
    <div className="col-8">
      {selectedPresentEmployee.name}
    </div>
  </div>

  <div className="row mb-3">
    <div className="col-4 fw-bold">Department</div>
    <div className="col-8">
      {selectedPresentEmployee.department}
    </div>
  </div>

  <div className="row mb-3">
    <div className="col-4 fw-bold">Designation</div>
    <div className="col-8">
      {selectedPresentEmployee.designation}
    </div>
  </div>

  <div className="row mb-3">
    <div className="col-4 fw-bold">Check In</div>
    <div className="col-8">
      {selectedPresentEmployee.checkInTime
        ? new Date(
            selectedPresentEmployee.checkInTime
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-"}
    </div>
  </div>

  <div className="row mb-3">
    <div className="col-4 fw-bold">Check Out</div>
    <div className="col-8">
      {selectedPresentEmployee.checkOutTime
        ? new Date(
            selectedPresentEmployee.checkOutTime
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-"}
    </div>
  </div>

  <div className="row mb-2">
    <div className="col-4 fw-bold">Status</div>
    <div className="col-8">
      <span
        style={{
          background:
            getStatus(
              selectedPresentEmployee.checkInTime,
              selectedPresentEmployee.checkOutTime,
              calculateWorkingHours(
                selectedPresentEmployee.checkInTime,
                selectedPresentEmployee.checkOutTime
              ),
              selectedPresentEmployee.lateCheckInCount || 0
            ) === "Working"
              ? "#cff4fc"
              : "#D7F5E4",
          display: "inline-block",
          padding: "6px 12px",
          borderRadius: "4px",
        }}
      >
        {getStatus(
          selectedPresentEmployee.checkInTime,
          selectedPresentEmployee.checkOutTime,
          calculateWorkingHours(
            selectedPresentEmployee.checkInTime,
            selectedPresentEmployee.checkOutTime
          ),
          selectedPresentEmployee.lateCheckInCount || 0
        )}
      </span>
    </div>
  </div>

</div>

        <div className="modal-footer">
          <button
            className="btn btn-sm custom-outline-btn"
            onClick={closePresentModal}
            style={{minWidth:90}}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  </div>
)}
</>
): showCardList === "absent" ? (
<>
  <div className="d-flex justify-content-between align-items-center mb-3">
    <h2
      style={{
        color: "#3A5FBE",
        fontSize: "25px",
        marginBottom: 0,
      }}
    >
      Absent Employees
    </h2>

    <button
      className="btn btn-sm custom-outline-btn"
      onClick={() => setShowCardList(null)}
      style={{ minWidth: 90 }}
    >
      Close
    </button>
  </div>
  <div className="card mb-4 shadow-sm border-0">
  <div className="card-body">
    <div className="row align-items-center g-3">
   <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-2">

    <label
      className="fw-bold mb-0"
      style={{
        fontSize: "16px",
        color: "#3A5FBE",
      }}
    >
      Name
    </label>

    <input
      type="text"
      className="form-control"
      value={absentSearch}
      placeholder="Search by name"
        onChange={(e) => {
        const value = e.target.value;
        if (/^[A-Za-z\s]*$/.test(value)) {
          setAbsentSearch(value);
        }
      }}
    />
</div>
<div className="col-12 col-md-auto ms-md-auto d-flex gap-2 mb-1 justify-content-end">
    <button
     className="btn btn-sm custom-outline-btn"
    style={{ minWidth: 90 }}
         onClick={() => {
        setAppliedAbsentSearch(absentSearch);
        setAbsentCurrentPage(1);
      }}
    >
      Filter
    </button>

    <button
     className="btn btn-sm custom-outline-btn"
    style={{ minWidth: 90 }}
      onClick={() => {
        setAbsentSearch("");
        setAppliedAbsentSearch("");
        setAbsentCurrentPage(1);
      }}
    >
      Reset
    </button>

  </div>
</div>
</div>
</div>
  <div className="card shadow-sm border-0">
    <div className="card-body p-0 table-responsive bg-white">
      <table className="table table-hover mb-0">
        <thead>
          <tr>
            <th  style={{
              fontWeight: "500",
              fontSize: "14px",
              color: "#6c757d",
              borderBottom: "2px solid #dee2e6",
              padding: "12px",
              whiteSpace: "nowrap",
            }}>
              Employee ID
              </th>

            <th  style={{
              fontWeight: "500",
              fontSize: "14px",
              color: "#6c757d",
              borderBottom: "2px solid #dee2e6",
              padding: "12px",
              whiteSpace: "nowrap",
            }}
            >
              Name
              </th>
               <th  style={{
              fontWeight: "500",
              fontSize: "14px",
              color: "#6c757d",
              borderBottom: "2px solid #dee2e6",
              padding: "12px",
              whiteSpace: "nowrap",
            }}>
             Department
              </th>
               <th  style={{
              fontWeight: "500",
              fontSize: "14px",
              color: "#6c757d",
              borderBottom: "2px solid #dee2e6",
              padding: "12px",
              whiteSpace: "nowrap",
            }}>
              Designation
              </th>

            <th  style={{
              fontWeight: "500",
              fontSize: "14px",
              color: "#6c757d",
              borderBottom: "2px solid #dee2e6",
              padding: "12px",
              whiteSpace: "nowrap",
            }}>
              Status
              </th>
          </tr>
        </thead>

        <tbody>
          {filteredAbsentEmployees.length === 0 ? (
            <tr>
              <td colSpan="3" className="text-center">
                No data available
              </td>
            </tr>
          ) : (
            currentAbsentEmployees.map((emp) => (
            <tr
              key={emp._id}
              style={{ cursor: "pointer" }}
              onClick={() => openAbsentModal(emp)}
            >
                <td style={{
                  padding: "12px",
                  fontSize: "14px",
                  borderBottom: "1px solid #dee2e6",
                  whiteSpace: "nowrap",
                }}
                >
                  {emp.employeeId}
                  </td>

                <td style={{
                  padding: "12px",
                  fontSize: "14px",
                  borderBottom: "1px solid #dee2e6",
                  whiteSpace: "nowrap",
                }}
                >
                  {emp.name}
                  
                  </td>
                    <td style={{
                  padding: "12px",
                  fontSize: "14px",
                  borderBottom: "1px solid #dee2e6",
                  whiteSpace: "nowrap",
                }}
                >
                {emp.department}
                  
                  </td>
                    <td style={{
                  padding: "12px",
                  fontSize: "14px",
                  borderBottom: "1px solid #dee2e6",
                  whiteSpace: "nowrap",
                }}
                >
                  {emp.designation}
                  
                  </td>
                <td>
                  <span
                    style={{
                      background: "#F8D7DA",
                     display: "inline-block",
                    padding: "6px 12px",
                    fontWeight: 400,
                    fontSize: "14px",
                    width: 112,
                    textAlign: "center",
                    }}
                  >
                    Absent
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
    <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
  <div className="d-flex align-items-center gap-3">

    <div className="d-flex align-items-center">
      <span style={{ fontSize: "14px", marginRight: "8px" }}>
        Rows per page:
      </span>

      <select
        className="form-select form-select-sm"
        style={{ width: "auto" }}
        value={absentItemsPerPage}
        onChange={(e) => {
          setAbsentItemsPerPage(Number(e.target.value));
          setAbsentCurrentPage(1);
        }}
      >
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={25}>25</option>
      </select>
    </div>

    <span>
      {filteredAbsentEmployees.length > 0
        ? absentIndexOfFirstItem + 1
        : 0}
      -
      {Math.min(
        absentIndexOfLastItem,
        filteredAbsentEmployees.length
      )} of {filteredAbsentEmployees.length}
    </span>

    <button
      className="btn btn-sm"
      disabled={absentCurrentPage === 1}
      onClick={() =>
        setAbsentCurrentPage((prev) => prev - 1)
      }
    >
      ‹
    </button>

    <button
      className="btn btn-sm"
      disabled={
        absentCurrentPage === absentTotalPages
      }
      onClick={() =>
        setAbsentCurrentPage((prev) => prev + 1)
      }
    >
      ›
    </button>

  </div>
</nav>
{showAbsentModal && selectedAbsentEmployee && (
  <div
    className="modal fade show"
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 1050,
    }}
  >
    <div
      className="modal-dialog modal-dialog-centered"
      style={{ maxWidth: "500px", width: "100%" }}
    >
      <div className="modal-content">

        <div
          className="modal-header text-white"
          style={{ backgroundColor: "#3A5FBE" }}
        >
          <h5 className="modal-title">
            Absent Employee Details
          </h5>

          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={closeAbsentModal}
          />
        </div>

       <div className="modal-body">

  <div className="row mb-3 align-items-center">
    <div className="col-4 fw-bold">Employee ID</div>
    <div className="col-8">
      {selectedAbsentEmployee.employeeId || "-"}
    </div>
  </div>

  <div className="row mb-3 align-items-center">
    <div className="col-4 fw-bold">Name</div>
    <div className="col-8">
      {selectedAbsentEmployee.name}
    </div>
  </div>

  <div className="row mb-3 align-items-center">
    <div className="col-4 fw-bold">Department</div>
    <div className="col-8">
      {selectedAbsentEmployee.department}
    </div>
  </div>

  <div className="row mb-3 align-items-center">
    <div className="col-4 fw-bold">Designation</div>
    <div className="col-8">
      {selectedAbsentEmployee.designation}
    </div>
  </div>

  <div className="row mb-2 align-items-center">
    <div className="col-4 fw-bold">Status</div>
    <div className="col-8">
      <span
        style={{
          background: "#F8D7DA",
          display: "inline-block",
          padding: "6px 12px",
          borderRadius: "4px",
          minWidth: "112px",
          textAlign: "center",
        }}
      >
        Absent
      </span>
    </div>
  </div>

</div>

        <div className="modal-footer">
          <button
            className="btn btn-sm custom-outline-btn"
            style={{ minWidth: 90 }}
            onClick={closeAbsentModal}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  </div>
)}
</>
) :showCardList === "onLeave" ? (
  <>
  <div className="d-flex justify-content-between align-items-center mb-3">

    <h2
      style={{
        color: "#3A5FBE",
        fontSize: "25px",
        marginBottom: 0,
      }}
    >
      Employees On Leave
    </h2>

    <button
      className="btn btn-sm custom-outline-btn"
      style={{ minWidth: 90 }}
      onClick={() => setShowCardList(null)}
    >
      Close
    </button>

  </div>
 <div className="card mb-4 shadow-sm border-0">
  <div className="card-body">
    <div className="row align-items-center g-3">
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
                Date
                </label>
  <input
    type="date"
    className="form-control"
    value={leaveDate}
    onChange={(e) =>
      setLeaveDate(e.target.value)
    }
  />
</div>

    

           <div className="col-12 col-md-auto ms-md-auto d-flex gap-2 mb-1 justify-content-end">
        <button
          className="btn btn-sm custom-outline-btn"
           style={{ minWidth: 90 }}
      onClick={async () => {
  const token = localStorage.getItem("accessToken");

  const leaveRes = await axios.get(
    "http://localhost:8000/attendance/on-leave-employees",
    {
      params: {
        date: leaveDate || undefined,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  setLeaveEmployees(
    Array.isArray(leaveRes.data)
      ? leaveRes.data
      : leaveRes.data?.employees || []
  );
}}
        >
          Filter
        </button>

        <button
          className="btn btn-sm custom-outline-btn"
           style={{ minWidth: 90 }}
onClick={async () => {
  setLeaveDate("");

  const token = localStorage.getItem("accessToken");

  const leaveRes = await axios.get(
    "http://localhost:8000/attendance/on-leave-employees",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  setLeaveEmployees(
    Array.isArray(leaveRes.data)
      ? leaveRes.data
      : leaveRes.data?.employees || []
  );
}}
        >
          Reset
        </button>
      </div>

    </div>
  </div>
</div>
    <div className="card shadow-sm border-0 mb-0">
     

      <div className="card-body p-0 table-responsive bg-white">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
               <th    
              style={{
              fontWeight: "500",
              fontSize: "14px",
              color: "#6c757d",
              borderBottom: "2px solid #dee2e6",
              padding: "12px",
              whiteSpace: "nowrap",
            }}>
              Employee ID
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
            Name
          </th>

           

            <th    
              style={{
              fontWeight: "500",
              fontSize: "14px",
              color: "#6c757d",
              borderBottom: "2px solid #dee2e6",
              padding: "12px",
              whiteSpace: "nowrap",
            }}> 
            Department
            </th>

            <th    
              style={{
              fontWeight: "500",
              fontSize: "14px",
              color: "#6c757d",
              borderBottom: "2px solid #dee2e6",
              padding: "12px",
              whiteSpace: "nowrap",
            }}>
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
            }}>
              From Date
              </th>

            <th   
             style={{
              fontWeight: "500",
              fontSize: "14px",
              color: "#6c757d",
              borderBottom: "2px solid #dee2e6",
              padding: "12px",
              whiteSpace: "nowrap",
            }}>
              To Date
              </th>

            <th    
              style={{
              fontWeight: "500",
              fontSize: "14px",
              color: "#6c757d",
              borderBottom: "2px solid #dee2e6",
              padding: "12px",
              whiteSpace: "nowrap",
            }}>
              Status
              </th>

          </tr>
        </thead>

        <tbody>

          {leaveEmployees.length === 0 ? (

            <tr>
              <td
                colSpan="7"
                className="text-center py-4"
              >
                No employees on leave
              </td>
            </tr>

          ) : (

      currentLeaveEmployees.map((item) => (

              <tr
  key={item._id}
  style={{ cursor: "pointer" }}
  onClick={() => openLeaveModal(item)}
>
                <td  style={{
                  padding: "12px",
                  fontSize: "14px",
                  borderBottom: "1px solid #dee2e6",
                  whiteSpace: "nowrap",
                }}>
                  {item.employee?.employeeId}
                  </td>
                <td  
                style={{
                  padding: "12px",
                  fontSize: "14px",
                  borderBottom: "1px solid #dee2e6",
                  whiteSpace: "nowrap",
                }}> 
                {item.employee?.name}
                </td>

              

                <td
                  style={{
                  padding: "12px",
                  fontSize: "14px",
                  borderBottom: "1px solid #dee2e6",
                  whiteSpace: "nowrap",
                }}>
                  {item.employee?.department}
                  </td>

                <td  style={{
                    padding: "12px",
                    fontSize: "14px",
                    borderBottom: "1px solid #dee2e6",
                    whiteSpace: "nowrap",
                  }}>
                    {item.leaveType}
                    </td>

                <td  style={{
                  padding: "12px",
                  fontSize: "14px",
                  borderBottom: "1px solid #dee2e6",
                  whiteSpace: "nowrap",
                }}>
                  {new Date(item.dateFrom).toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  )}
                </td>

                <td  style={{
                  padding: "12px",
                  fontSize: "14px",
                  borderBottom: "1px solid #dee2e6",
                  whiteSpace: "nowrap",
                }}>
                  {new Date(item.dateTo).toLocaleDateString(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  )}
                </td>

                <td  style={{
                      padding: "12px",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                    }}>
                  <span
                    style={{
                      background: "#D6E4FF",
                      display: "inline-block",
                      padding: "6px 12px",
                      fontWeight: 400,
                      fontSize: "14px",
                      width: 112,
                      textAlign: "center",
                    }}
                  >
                    On Leave
                  </span>
                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  </div>
  <nav className="d-flex align-items-center justify-content-end mt-3 text-muted">
  <div className="d-flex align-items-center gap-3">

    <div className="d-flex align-items-center">
      <span style={{ fontSize: "14px", marginRight: "8px" }}>
        Rows per page:
      </span>

      <select
        className="form-select form-select-sm"
        style={{ width: "auto", fontSize: "14px" }}
        value={leaveItemsPerPage}
        onChange={(e) => {
          setLeaveItemsPerPage(Number(e.target.value));
          setLeaveCurrentPage(1);
        }}
      >
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={25}>25</option>
      </select>
    </div>

    <span style={{ fontSize: "14px" }}>
      {leaveEmployees.length > 0
        ? leaveIndexOfFirstItem + 1
        : 0}
      -
      {Math.min(
        leaveIndexOfLastItem,
        leaveEmployees.length
      )}{" "}
      of {leaveEmployees.length}
    </span>

    <div className="d-flex align-items-center">
      <button
        className="btn btn-sm focus-ring"
        disabled={leaveCurrentPage === 1}
        onClick={() =>
          setLeaveCurrentPage((prev) => prev - 1)
        }
      >
        ‹
      </button>

      <button
        className="btn btn-sm focus-ring"
        disabled={
          leaveCurrentPage === leaveTotalPages ||
          leaveTotalPages === 0
        }
        onClick={() =>
          setLeaveCurrentPage((prev) => prev + 1)
        }
      >
        ›
      </button>
    </div>
  </div>
</nav>

{showLeaveModal && selectedLeaveEmployee && (
  <div
    className="modal fade show"
    ref={leaveModalRef}
    tabIndex="-1"
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      zIndex: 1050,
    }}
  >
    <div
      className="modal-dialog modal-dialog-centered"
      style={{ maxWidth: "600px", width: "100%" }}
    >
      <div className="modal-content">

        <div
          className="modal-header text-white"
          style={{ backgroundColor: "#3A5FBE" }}
        >
          <h5 className="modal-title">
            Leave Details
          </h5>

          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={closeLeaveModal}
          />
        </div>

        <div className="modal-body">

          <div className="row mb-3">
            <div className="col-4 fw-bold">
              Employee ID 
            </div>

            <div className="col-8">
              {selectedLeaveEmployee.employee?.employeeId}
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-4 fw-bold">
              Name 
            </div>

            <div className="col-8">
              {selectedLeaveEmployee.employee?.name}
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-4 fw-bold">
              Department 
            </div>

            <div className="col-8">
              {selectedLeaveEmployee.employee?.department}
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-4 fw-bold">
              Leave Type 
            </div>

            <div className="col-8">
              {selectedLeaveEmployee.leaveType}
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-4 fw-bold">
              From Date 
            </div>

            <div className="col-8">
              {new Date(
  selectedLeaveEmployee.dateFrom
).toLocaleDateString(
  "en-GB",
  {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }
)}
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-4 fw-bold">
              To Date 
            </div>

            <div className="col-8">
              {new Date(
  selectedLeaveEmployee.dateTo
).toLocaleDateString(
  "en-GB",
  {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }
)}
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-4 fw-bold">
              Reason 
            </div>

            <div className="col-8">
              {selectedLeaveEmployee.reason}
            </div>
          </div>
          
<div className="row mb-3">
  <div className="col-4 fw-bold">
    Status
  </div>

  <div className="col-8">
    <span
      style={{
        background: "#D6E4FF",
        color: "#0b0b0c",
        display: "inline-block",
        padding: "6px 14px",
        fontWeight: 500,
        fontSize: "13px",
        minWidth: "110px",
        textAlign: "center",
        borderRadius: "999px",
      }}
    >
      On Leave
    </span>
  </div>
</div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-sm custom-outline-btn"
            style={{ minWidth: 90 }}
            onClick={closeLeaveModal}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  </div>
)}
</>

) : (
<>
      {/* dipali code */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters();
            }}
          >
            {/* Status Filter */}
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-2">
              <label
                htmlFor="statusFilter"
                className="fw-bold mb-0 text-start text-md-end"
                style={{ width: "55px", fontSize: "16px", color: "#3A5FBE" }}
              >
                Status
              </label>
              <select
                id="statusFilter"
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)} // no auto-filter on change
              >
                <option value="All">All</option>
                <option value="Present">Present</option>
                <option value="Working">Working</option>
                <option value="Half Day">Half Day</option>
                <option value="Absent">Absent</option>
                <option value="Late Check-In">Late Check-In</option>
              </select>
            </div>

            {/* Name Filter */}
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-2">
              <label
                htmlFor="employeeNameFilter"
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  width: "50px",
                  fontSize: "16px",
                  color: "#3A5FBE",
                  marginRight: "2px",
                }}
              >
                Name
              </label>
              <input
                 id="employeeNameFilter"
                 type="text"
                 className="form-control"
                 value={employeeNameFilter}
                 placeholder="Employee name"
                 onChange={(e) => {
                   const value = e.target.value;
                    const cleaned = value.replace(/[^A-Za-z\s]/g, "");
               
                   setEmployeeNameFilter(cleaned);
                 }}
              />
            </div>

            <></>

            {/* Filter and Reset Buttons */}
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
                  setCurrentPage(1);
                  setFilteredEmployees(attendanceData.employees || []);
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ✅ Attendance Table */}
      <div className="table-responsive">
        {employees.length === 0 ? (
  <p>No attendance records for today.</p>
) : (
        <table className="table table-hover mb-0 bg-white">
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
                Name
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
                Check-In Time
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
                Check-Out Time
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
                Total Hours
              </th>
              {/* //Added by Harshada */}
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
                Break
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
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {currentEmployees.length ===
              0 /* NEW: Show message when no results */ ? (
              <tr>
                <td
                  colSpan="8"
                  className="text-center py-4"
                  style={{ color: "#6c757d" }}
                >
               No employees found with status "{appliedStatusFilter}"
                </td>
              </tr>
            ) : (
              currentEmployees.map((emp) => {
                const checkIn = emp.checkInTime;
                const checkOut = emp.checkOutTime;
                const workingHours = calculateWorkingHours(checkIn, checkOut);
                // const status = getStatus(checkIn, checkOut, workingHours);
                const status = getStatus(
  checkIn,
  checkOut,
  workingHours,
  emp.lateCheckInCount || 0
);
                const badgeStyle = {
                  base: {
                    display: "inline-block",
                    padding: "6px 12px",
                    fontWeight: 400,
                    fontSize: "14px",
                    width: 112,
                    textAlign: "center",
                  },
                  Present: { background: "#d1f7df" }, // soft green
                  "Half Day": { background: "#fff3cd" }, // soft yellow
                  Working: { background: "#cff4fc" }, // soft cyan
                  Absent: { background: "#f8d7da" }, 
                  "Present/Late Check-In": {
  background: "#d1f7df",
  color: "#000",
},

"Half Day/Late Check-In": {
  background: "#fff3cd",
  color: "#856404",
},
                };

                return (
                  <tr
                    key={emp._id}
                    style={{ cursor: "pointer" }}
                    onClick={() => openEmployeePopup(emp)}
                  >
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        fontWeight: 400,
                        color: "#212529",
                        whiteSpace: "nowrap",
                        textTransform: "capitalize",
                        borderTop: "1px solid #e9ecef",
                      }}
                    >
                      {emp.name}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {checkIn
                        ? new Date(checkIn).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "-"}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {checkOut
                        ? new Date(checkOut).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "-"}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {workingHours > 0 ? `${workingHours} hrs` : "-"}
                    </td>
                    {/* //Added by harshada */}
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {emp.breaks && emp.breaks.length > 0
                        ? getTotalBreakDurationHMS(emp.breaks)
                        : "-"}
                    </td>
                    {/* <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    > */}
                      {/* <span
                        style={{
                          ...badgeStyle.base,
                          ...(badgeStyle[status] || {}),
                        }}
                      >
                        {status}
                      </span> */}
                      
<td
  style={{
    padding: "12px",
    fontSize: "14px",
    borderBottom: "1px solid #dee2e6",
    whiteSpace: "nowrap",
  }}
>
  <div>
    <span
      style={{
        ...badgeStyle.base,
        ...(badgeStyle[status] || {}),
      }}
    >
      {status}
    </span>

    {/* {emp.lateCheckInCount > 0 && (
      <div
        style={{
          fontSize: "11px",
          color: "#dc3545",
          marginTop: "4px",
          fontWeight: "500",
        }}
      >
        {emp.lateCheckInCount === 1 && "1st Attempt"}
        {emp.lateCheckInCount === 2 && "2nd Attempt"}
        {emp.lateCheckInCount >= 3 && "3rd Attempt"}
      </div>
    )} */}
    {status === "Late Check-In" && emp.lateCheckInCount > 0 && (
  <div
    style={{
      fontSize: "11px",
      color: "#dc3545",
      marginTop: "4px",
      fontWeight: "500",
    }}
  >
    {emp.lateCheckInCount === 1 && "1st Attempt"}
    {emp.lateCheckInCount === 2 && "2nd Attempt"}
    {emp.lateCheckInCount >= 3 && "3rd Attempt"}
  </div>
)}
  </div>
</td> 
                    {/* </td> */}
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <button
                        className="btn btn-sm custom-outline-btn"
                        style={{ minWidth: 90 }}
                        onClick={() =>
                          navigate(
                            `/dashboard/${role}/${username}/${id}/employeeattendance/${emp._id}`,
                            {
                              state: { employee: emp },
                            },
                          )
                        }
                      >
                        View Attendance
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        )}
      </div>
      {/* ✅ Pagination */}
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

          <span style={{ fontSize: "14px", marginLeft: "16px" }}>
            {filteredEmployees.length > 0 ? indexOfFirstItem + 1 : 0}-
            {Math.min(indexOfLastItem, filteredEmployees.length)} of{" "}
            {filteredEmployees.length} {/* New change */}
          </span>

          <div
            className="d-flex align-items-center"
            style={{ marginLeft: "16px" }}
          >
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
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 90 }}
          onClick={() => window.history.go(-1)}
        >
          Back
        </button>
      </div>

      {showModal && selectedEmployee && (
        <div
          className="modal fade show"
          ref={modalRef}
          tabIndex="-1"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1050
          }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ maxWidth: "700px", width: 600 }}
          >
            <div className="modal-content">
              {/* 🔹 Header */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">
                  Employee Attendance Details
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeModal}
                />
              </div>

              <div
                className="modal-body"
                style={{ maxHeight: "70vh", overflowY: "auto" }}
              >
                {/* 🔹 Body */}
                <div className="modal-body">
                  <div className="container-fluid">
                    <div className="row mb-3">
                      <div className="col-sm-3 fw-semibold">Name</div>
                      <div className="col-sm-9">
                        {selectedEmployee.name || "-"}
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-sm-3 fw-semibold">Check-In</div>
                      <div className="col-sm-9">
                        {selectedEmployee.checkInTime
                          ? new Date(
                            selectedEmployee.checkInTime,
                          ).toLocaleTimeString()
                          : "-"}
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-sm-3 fw-semibold">Check-Out</div>
                      <div className="col-sm-9">
                        {selectedEmployee.checkOutTime
                          ? new Date(
                            selectedEmployee.checkOutTime,
                          ).toLocaleTimeString()
                          : "-"}
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-sm-3 fw-semibold">Total Hours</div>
                      <div className="col-sm-9">
                        {calculateWorkingHours(
                          selectedEmployee.checkInTime,
                          selectedEmployee.checkOutTime,
                        )}{" "}
                        hrs
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-sm-3 fw-semibold">Status</div>
                      <div className="col-sm-9">
                        <span
                          className={
                            "badge text-capitalize " +
                            (getStatus(
                              selectedEmployee.checkInTime,
                              selectedEmployee.checkOutTime,
                              calculateWorkingHours(
                                selectedEmployee.checkInTime,
                                selectedEmployee.checkOutTime,
                              ),
                            ) === "Present"
                              ? "bg-success"
                              : getStatus(
                                selectedEmployee.checkInTime,
                                selectedEmployee.checkOutTime,
                                calculateWorkingHours(
                                  selectedEmployee.checkInTime,
                                  selectedEmployee.checkOutTime,
                                ),
                              ) === "Half Day"
                                ? "bg-warning text-dark"
                                : getStatus(
                                  selectedEmployee.checkInTime,
                                  selectedEmployee.checkOutTime,
                                  calculateWorkingHours(
                                    selectedEmployee.checkInTime,
                                    selectedEmployee.checkOutTime,
                                  ),
                                ) === "Working"
                                  ? "bg-info text-dark"
                                  : "bg-danger")
                          }
                        >
                          {getStatus(
  selectedEmployee.checkInTime,
  selectedEmployee.checkOutTime,
  calculateWorkingHours(
    selectedEmployee.checkInTime,
    selectedEmployee.checkOutTime,
  ),
  selectedEmployee.lateCheckInCount || 0
)}
                        </span>
                      </div>
                    </div>

                    <hr />

                    {/* 🔹 Break Details */}
                    <h6 className="mb-3" style={{ color: "#3A5FBE" }}>
                      Break Details
                    </h6>

                    {breakLoading ? (
                      <p className="text-muted">Loading breaks...</p>
                    ) : employeeBreaks.length === 0 ? (
                      //  Case 1: No break taken at all
                      <p className="text-muted">No breaks taken</p>
                    ) : getCompletedBreaks(employeeBreaks).length === 0 ? (
                      //  Case 2: Break in progress
                      <p className="text-muted">Break in progress</p>
                    ) : (
                      getCompletedBreaks(employeeBreaks).map((brk, index) => (
                        <div
                          key={index}
                          className="border rounded p-3 mb-2"
                          style={{ backgroundColor: "#f8f9fa" }}
                        >
                          <div className="row mb-1">
                            <div className="col-sm-3 fw-semibold">Type</div>
                            <div className="col-sm-9">{brk.type}</div>
                          </div>
                          {brk.type === "Other" && (
                            <div className="row mb-1">
                              <div className="col-sm-3 fw-semibold">Reason</div>
                              <div className="col-sm-9">
                                {brk.reason?.trim() ? brk.reason : "N/A"}
                              </div>
                            </div>
                          )}

                          <div className="row mb-1">
                            <div className="col-sm-3 fw-semibold">Start</div>
                            <div className="col-sm-9">
                              {new Date(brk.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>

                          <div className="row mb-1">
                            <div className="col-sm-3 fw-semibold">End</div>
                            <div className="col-sm-9">
                              {new Date(brk.endTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>

                          <div className="row">
                            <div className="col-sm-3 fw-semibold">Duration</div>
                            <div className="col-sm-9">
                              {formatDurationHMS(brk.startTime, brk.endTime)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                    {/* Total Break Time */}
                    <div className="border-top pt-2 mt-3 text-end">
                      <span className="fw-semibold">Total Break Time: </span>
                      <span style={{ color: "#3A5FBE", fontWeight: 600 }}>
                        {getTotalBreakDurationHMS(employeeBreaks)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 🔹 Footer */}
                <div className="modal-footer border-0 pt-0">
                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{minWidth:90}}
                    onClick={closeModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TodaysEmployeeDetails;
