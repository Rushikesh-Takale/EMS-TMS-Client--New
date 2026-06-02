import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import TextField from "@mui/material/TextField";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";
import axios from "axios";
import "./Tasklog.css";

const EmployeeTasklog = ({ user }) => {
  const [logs, setLogs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [modalMode, setModalMode] = useState("add");
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const token = localStorage.getItem("accessToken");

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [isFiltered, setIsFiltered] = useState(false);
  const modalRef = useRef(null);
  const viewModalRef = useRef(null);

  const [taskEntries, setTaskEntries] = useState([]);

  useEffect(() => {
    if (showModal && modalRef.current) {
      modalRef.current.focus();
    }
  }, [showModal]);

  useEffect(() => {
    if (showViewModal && viewData && viewModalRef.current) {
      viewModalRef.current.focus();
    }
  }, [showViewModal, viewData]);

  const trapFocus = (ref) => (e) => {
    if (!ref.current) return;

    const focusableElements = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (!focusableElements.length) return;

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

  const CHAR_LIMITS = {
    challengesFaced: 200,
    whatLearnedToday: 200,
  };

  const countChars = (text) => {
    if (!text) return 0;
    return text.length;
  };

  const autoExpand = (e) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  };

  const handleTextChange = (field, value) => {
    const charCount = countChars(value);
    const limit = CHAR_LIMITS[field];

    if (charCount > limit) {
      const truncated = value.substring(0, limit);
      setForm({ ...form, [field]: truncated });
      return;
    }

    setForm({ ...form, [field]: value });
  };

  const getTaskDayNumber = (startDate, endDate) => {
    if (!startDate || !endDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (today < start || today > end) return null;

    let count = 0;
    let current = new Date(start);

    while (current <= today) {
      const day = current.getDay();
      const date = current.getDate();

      if (day === 0) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      if (day === 6 && (date <= 7 || (date >= 15 && date <= 21))) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      count++;
      current.setDate(current.getDate() + 1);
    }

    return count;
  };

  const isToday = (dateString) => {
    if (!dateString) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);

    return today.getTime() === date.getTime();
  };
  
  function getWorkingDays(startIso, endIso) {
    if (!startIso || !endIso) return 0;
    const start = new Date(startIso);
    const end = new Date(endIso);
    let count = 0;

    function isFirstOrThirdSaturday(date) {
      if (date.getDay() !== 6) return false;
      const day = date.getDate();
      const weekNumber = Math.ceil(day / 7);
      return weekNumber === 1 || weekNumber === 3;
    }

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0) continue;
      if (isFirstOrThirdSaturday(d)) continue;
      count++;
    }

    return count;
  }

  const formatDate = (dateString) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
    
  const formatDateWithoutYear = (dateString) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
    }).format(new Date(dateString));

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      const logRes = await fetch(
        `https://ems-tms-server-new.vercel.app/api/tasklogs/employee/${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const logsData = await logRes.json();

      const taskRes = await fetch(
        `https://ems-tms-server-new.vercel.app/tasks/assigned/${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const tasksData = await taskRes.json();
      setLogs(logsData);
      setTasks(tasksData.tasks || tasksData);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    }
  };


  // Delete function
  const handleDelete = async (logId, e) => {
    e.stopPropagation(); 
    
    const token = localStorage.getItem("accessToken");
    
    const log = logs.find(l => l._id === logId);
    if (!log) return;
    
    const hasApprovedOrRejected = log.tasks?.some(task => 
      task.status === "Approved" || task.status === "Rejected"
    );
    
    if (hasApprovedOrRejected) {
      alert("Cannot delete logs. Only pending/submitted logs can be deleted.");
      return;
    }
    
    const confirmDelete = window.confirm("Are you sure you want to delete this work log?");
    
    if (!confirmDelete) return;
    
    try {
      const response = await fetch(`https://ems-tms-server-new.vercel.app/api/tasklogs/${logId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete log");
      }
      
      alert("Work log deleted successfully");
      await fetchLogs();
      
      if (viewData && viewData._id === logId) {
        setShowViewModal(false);
        setViewData(null);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert(error.message || "Something went wrong. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Submitted":
        return {
          backgroundColor: "#d1f2dd",
          padding: "4px 12px",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: "500",
          display: "inline-block",
          textAlign: "center",
          color: "#0f5132",
        };
      case "In Progress":
        return {
          backgroundColor: "#d1e7ff",
          padding: "4px 12px",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: "500",
          display: "inline-block",
          textAlign: "center",
          color: "#0d6efd",
        };
      case "Pending":
        return {
          backgroundColor: "#FFE493",
          padding: "4px 12px",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: "500",
          display: "inline-block",
          textAlign: "center",
          color: "#664d03",
        };
      case "Approved":
        return {
          backgroundColor: "#f1dabfff",
          padding: "4px 12px",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: "500",
          display: "inline-block",
          textAlign: "center",
          color: "#e9700eff",
        };
      case "Rejected":
        return {
          backgroundColor: "#f8d7da",
          padding: "4px 12px",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: "500",
          display: "inline-block",
          textAlign: "center",
          color: "#842029",
        };
      default:
        return {
          backgroundColor: "#bfcfeeff",
          padding: "4px 12px",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: "500",
          display: "inline-block",
          textAlign: "center",
          color: "#495057",
        };
    }
  };

  useEffect(() => {
    if (tasks.length > 0) {
      setTodayTasks(getTodayAssignedTaskIds());
    }
  }, [tasks]);

  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  
  const getTodayAssignedTaskIds = () => {
    const today = normalizeDate(new Date());
    const validStatuses = ["Assigned", "Completed", "In Progress", "On Track"];
    
    return tasks.filter((task) => {
      const start = normalizeDate(task.dateOfTaskAssignment);
      const end = normalizeDate(task.dateOfExpectedCompletion);
      const isValidStatus = validStatuses.includes(task.status?.name);
      
      const isActive = today >= start && today <= end;
      
      return isValidStatus && isActive;
    });
  };
  
  
  const [form, setForm] = useState({
    employee: user._id,
    date: new Date().toISOString().split("T")[0],
    challengesFaced: "",
    whatLearnedToday: "",
  });

  const calculateHours = (start, end) => {
    if (!start || !end) return "";
    if (!dayjs.isDayjs(start) || !dayjs.isDayjs(end)) return "";
    const diff = end.diff(start, "minute");
    if (diff <= 0) return "";

    const hours = diff / 60;
    const rounded = Math.round(hours * 1000) / 1000;
    const truncated = Math.floor(rounded * 100) / 100;

    return Number.isInteger(truncated)
      ? truncated.toString()
      : truncated.toFixed(2);
  };

  const formatDisplayHours = (h) => {
    if (h === null || h === undefined) return "";
    const num = Number(h);
    if (Number.isNaN(num)) return "";
    return Number.isInteger(num) ? num : num.toFixed(2);
  };

  const addTaskEntry = () => {
    setTaskEntries([
      ...taskEntries,
      {
        task: "",
        startTime: null,
        endTime: null,
        totalHours: "",
        status: "",
        progressToday: "",
        id: Date.now(),
      },
    ]);
  };

  const removeTaskEntry = (id) => {
    setTaskEntries(taskEntries.filter(entry => entry.id !== id));
  };

  const updateTaskEntry = (id, field, value) => {
    setTaskEntries(taskEntries.map(entry => {
      if (entry.id === id) {
        const updated = { ...entry, [field]: value };
        
        if (field === 'startTime' || field === 'endTime') {
          const start = field === 'startTime' ? value : entry.startTime;
          const end = field === 'endTime' ? value : entry.endTime;
          if (start && end && dayjs.isDayjs(start) && dayjs.isDayjs(end)) {
            const diff = end.diff(start, "minute");
            if (diff > 0) {
              const hours = diff / 60;
              const rounded = Math.round(hours * 1000) / 1000;
              const truncated = Math.floor(rounded * 100) / 100;
              updated.totalHours = Number.isInteger(truncated) ? truncated.toString() : truncated.toFixed(2);
            }
          }
        }
        
        return updated;
      }
      return entry;
    }));
  };

  async function handleSave(e) {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");

    if (!token) {
      alert("No authentication token found. Please log in again.");
      return;
    }

    if (taskEntries.length === 0) {
      alert("Please add at least one task.");
      return;
    }

    for (const entry of taskEntries) {
      if (!entry.task) {
        alert("Please select a task for all entries.");
        return;
      }
      if (!entry.startTime) {
        alert("Please select start time for all tasks.");
        return;
      }
      if (!entry.endTime) {
        alert("Please select end time for all tasks.");
        return;
      }
      if (!entry.status) {
        alert("Please select status for all tasks.");
        return;
      }
      if (entry.status === "In Progress" && (!entry.progressToday || entry.progressToday < 0 || entry.progressToday > 100)) {
        alert("Progress Today must be between 0 and 100 for tasks with In Progress status.");
        return;
      }
    }

    try {
      const payload = {
        tasks: taskEntries.map(entry => ({
          task: entry.task,
          startTime: entry.startTime.format("HH:mm"),
          endTime: entry.endTime.format("HH:mm"),
          totalHours: Number(entry.totalHours) || 0,
          status: entry.status,
          ...(entry.status === "In Progress" && { progressToday: Number(entry.progressToday) || 0 }),
        })),
        employee: user._id,
        challengesFaced: form.challengesFaced,
        whatLearnedToday: form.whatLearnedToday,
      };

      const endpoint = editIndex !== null
        ? `https://ems-tms-server-new.vercel.app/api/tasklogs/${editIndex}`
        : "https://ems-tms-server-new.vercel.app/api/tasklogs/";

      const method = editIndex !== null ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save task log");
      }

      const result = await response.json();

      setForm({
        employee: user._id,
        date: new Date().toISOString().split("T")[0],
        challengesFaced: "",
        whatLearnedToday: "",
      });
      setTaskEntries([]);
      setShowModal(false);
      setEditIndex(null);
      await fetchLogs();
      alert(editIndex ? "Log updated successfully" : "WorkLog created successfully");
    } catch (error) {
      console.error("Submit failed:", error);
      alert(error.message || "Something went wrong. Please try again.");
    }
  }

  const handleFilter = () => {
    let data = [...logs];

    if (searchText) {
      const search = searchText.trim().toLowerCase();
      const searchNumber = Number(search);
      const isNumberSearch = !isNaN(searchNumber);

      data = data.filter((l) => {
        const hasMatchingTask = l.tasks?.some(taskItem => {
          const taskName = taskItem?.task?.taskName?.toLowerCase() || "";
          const status = taskItem?.status?.toLowerCase() || "";
          const timeSpent = taskItem?.totalHours !== undefined ? `${taskItem.totalHours} hrs` : "";
          return (!isNumberSearch && (taskName.includes(search) || status.includes(search))) ||
            (search.includes("hr") && timeSpent.toLowerCase().includes(search));
        });
        
        const challenges = l?.challengesFaced?.toLowerCase() || "";
        const learned = l?.whatLearnedToday?.toLowerCase() || "";
        
        const hasMatchingWorkingDays = l.tasks?.some(taskItem => {
          const workingDays = taskItem?.task?.dateOfTaskAssignment && taskItem?.task?.dateOfExpectedCompletion
            ? getWorkingDays(
                taskItem.task.dateOfTaskAssignment,
                taskItem.task.dateOfExpectedCompletion
              ).toString()
            : "";
          return isNumberSearch && Number(workingDays) === searchNumber;
        });
        
        return hasMatchingTask || challenges.includes(search) || learned.includes(search) || hasMatchingWorkingDays;
      });
    }

    if (filterDate) {
      const filter = new Date(filterDate);
      data = data.filter((l) => {
        const logDate = new Date(l.date);
        return filter.toDateString() === logDate.toDateString();
      });
    }

    setFilteredLogs(data);
    setIsFiltered(true);
    setPage(0);
  };

  const handleReset = () => {
    setSearchText("");
    setFilterDate("");
    setFilteredLogs([]);
    setIsFiltered(false);
    setPage(0);
  };

  const handleEdit = (log) => {
    setEditIndex(log._id);
    setShowModal(true);
    setModalMode("edit");
    
    const existingTasks = log.tasks.map((taskItem, index) => ({
      id: Date.now() + index,
      task: taskItem.task?._id || taskItem.task,
      startTime: taskItem.startTime ? dayjs(taskItem.startTime, "HH:mm") : null,
      endTime: taskItem.endTime ? dayjs(taskItem.endTime, "HH:mm") : null,
      totalHours: taskItem.totalHours,
      status: taskItem.status || "",
      progressToday: taskItem.progressToday || "",
    }));
    
    setTaskEntries(existingTasks);
    setForm({
      employee: user._id,
      date: log?.date ? new Date(log.date).toISOString().split("T")[0] : "",
      challengesFaced: log?.challengesFaced || "",
      whatLearnedToday: log?.whatLearnedToday || "",
    });
  };

  const tableData = isFiltered ? filteredLogs : logs;
  const totalRows = tableData.length;
  const paginatedData = tableData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const handleRowClick = (rowData) => {
    setModalMode("view");
    setViewData(rowData);
    setShowViewModal(true);
  };
  
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    handleFilter();
  };

  useEffect(() => {
    if (showModal || showViewModal) {
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
  }, [showModal, showViewModal]);

  return (
    <div className="container-fluid">
      <style>
        {`
      @media (max-width: 768px) {
        input[type="date"],
        input[type="week"],
        input[type="month"],
        input[type="search"],
        input[type="filter"] {
          font-size: 16px !important;
          height: 40px !important;
          width: 268px !important;
          max-width: 285px !important;
        }
        .task-table-cell {
          min-width: 200px !important;
        }
      }
      `}
      </style>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0" style={{ color: "#3A5FBE", fontSize: "25px" }}>
          My Worklog
        </h3>

        <button
          className="btn btn-sm custom-outline-btn"
          onClick={() => {
            setModalMode("add");
            setEditIndex(null);
            setTaskEntries([]);
            setForm({
              employee: user._id,
              date: new Date().toISOString().split("T")[0],
              challengesFaced: "",
              whatLearnedToday: "",
            });
            setShowModal(true);
          }}
          style={{ minWidth: 90 }}
        >
          + Add Log
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={handleFilterSubmit}
            style={{ justifyContent: "space-between" }}
          >
            <div className="col-12 col-md-auto d-flex align-items-center gap-3 mb-1 ms-1">
              <label
                htmlFor="searchFilter"
                className="fw-bold mb-0"
                style={{ fontSize: "16px", color: "#3A5FBE" }}
              >
                Search
              </label>
              <input
                className="form-control"
                placeholder="Search By Any Field..."
                value={searchText}
                type="search"
                onChange={(e) => setSearchText(e.target.value)}
                style={{ flex: 1, minWidth: "150px" }}
              />
            </div>
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1 ms-1">
              <label
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  width: "50px",
                  minWidth: "50px",
                  marginRight: "8px",
                }}
              >
                Date
              </label>
              <input
                className="form-control"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{ flex: 1, minWidth: "150px" }}
              />
            </div>
            <div className="col-auto ms-auto d-flex gap-2">
              <button
                onClick={handleFilter}
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
              >
                Filter
              </button>
              <button
                onClick={handleReset}
                className="btn btn-sm custom-outline-btn"
                style={{ minWidth: 90 }}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          overflowX: "auto",
        }}
      >
        <table
          className="mb-0"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#fff",
            padding: "20px",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <th style={{ 
                padding: "12px", 
                textAlign: "left", 
                fontSize: "14px", 
                fontWeight: 600, 
                color: "#475569", 
                whiteSpace: "nowrap" 
                }}>
                Date
              </th>
              <th style={{ 
                padding: "12px", 
                textAlign: "left", 
                fontSize: "14px", 
                fontWeight: 600, 
                color: "#475569", 
                whiteSpace: "nowrap", minWidth: "250px" 
              }}>
                Task Details
              </th>
              <th style={{ 
                padding: "12px", 
                textAlign: "left", 
                fontSize: "14px", 
                fontWeight: 600, 
                color: "#475569", 
                whiteSpace: "nowrap", minWidth: "180px" 
              }}>
                Period
              </th>
              <th style={{ 
                padding: "12px", 
                textAlign: "left", 
                fontSize: "14px", 
                fontWeight: 600, 
                color: "#475569", 
                whiteSpace: "nowrap", minWidth: "120px" 
              }}>
                Working Days
              </th>
              <th style={{ 
                padding: "12px", 
                textAlign: "left", 
                fontSize: "14px", 
                fontWeight: 600, 
                color: "#475569", 
                whiteSpace: "nowrap", minWidth: "100px"
              }}>
                Time Spent
              </th>
              <th style={{
                padding: "12px", 
                textAlign: "left", 
                fontSize: "14px", 
                fontWeight: 600, 
                color: "#475569", 
                whiteSpace: "nowrap", minWidth: "120px" 
              }}>
                Status
              </th>
              <th style={{ 
                padding: "12px", 
                textAlign: "left", 
                fontSize: "14px", 
                fontWeight: 600, 
                color: "#475569", 
                whiteSpace: "nowrap" 
              }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: "18px",
                textAlign: "center", 
                color: "#64748b", 
                fontSize: "14px" 
                }}>
                  No data
                </td>
              </tr>
            ) : (
              paginatedData.map((log) => (
                <tr
                  onClick={() => handleRowClick(log)}
                  key={log._id}
                  style={{
                    cursor: "pointer",
                    borderBottom: "1px solid #cdd2dcff",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Date */}
                  <td
                    style={{
                      padding: "12px",
                      verticalAlign: "top",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span>{formatDate(log.date)}</span>
                  </td>

                  {/* Task Details */}
                  <td
                    className="task-table-cell"
                    style={{
                      padding: "12px",
                      verticalAlign: "top",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                    }}
                  >
                    {log.tasks && log.tasks.map((taskItem, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          marginBottom: idx < log.tasks.length - 1 ? '16px' : 0,
                          paddingBottom: idx < log.tasks.length - 1 ? '12px' : 0,
                          borderBottom: idx < log.tasks.length - 1 ? '2px solid #e5e7eb' : 'none',
                          minHeight: '60px'
                        }}
                      >
                        <div style={{color: "#1f2937",
                        fontSize:"14px", marginBottom: "6px" }}>
                          {taskItem.task?.taskName || 'Task'}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280", display: "flex", gap: "16px", flexWrap: "wrap"}}>
                          <span>{taskItem.startTime} - {taskItem.endTime}</span>
                        </div>
                      </div>
                    ))}
                  </td>

                  {/*task period*/}
                  <td
                    style={{
                      padding: "12px",
                      verticalAlign: "top",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                    }}
                  >
                    {log.tasks && log.tasks.map((taskItem, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          marginBottom: idx < log.tasks.length - 1 ? '16px' : 0,
                          paddingBottom: idx < log.tasks.length - 1 ? '12px' : 0,
                          borderBottom: idx < log.tasks.length - 1 ? '2px solid #e5e7eb' : 'none',
                          minHeight: '60px'
                        }}
                      >
                        {taskItem.task?.dateOfTaskAssignment && taskItem.task?.dateOfExpectedCompletion ? (
                          <div>
                            <div style={{ fontSize: "14px",  color: "#374151" }}>
                              {formatDateWithoutYear(taskItem.task.dateOfTaskAssignment)} → {formatDateWithoutYear(taskItem.task.dateOfExpectedCompletion)}
                            </div>
                            {isToday(log.date) && (() => {
                              const dayNumber = getTaskDayNumber(
                                taskItem.task.dateOfTaskAssignment,
                                taskItem.task.dateOfExpectedCompletion
                              );
                              return dayNumber && (
                                <div
                                  style={{
                                    marginTop: 4,
                                    padding: "2px 8px",
                                    borderRadius: 12,
                                    background: "#e0ecff",
                                    color: "#1d4ed8",
                                    fontSize: 11,
                                    display: "inline-block",
                                  }}
                                >
                                  Day {dayNumber}
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <span style={{ color: "#9ca3af" }}>—</span>
                        )}
                      </div>
                    ))}
                  </td>

                  {/* task wroking day*/}
                  <td
                    style={{
                      padding: "12px",
                      verticalAlign: "top",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                    }}
                  >
                    {log.tasks && log.tasks.map((taskItem, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          marginBottom: idx < log.tasks.length - 1 ? '16px' : 0,
                          paddingBottom: idx < log.tasks.length - 1 ? '12px' : 0,
                          borderBottom: idx < log.tasks.length - 1 ? '2px solid #e5e7eb' : 'none',
                          minHeight: '60px'
                        }}
                      >
                        {taskItem.task?.dateOfTaskAssignment && taskItem.task?.dateOfExpectedCompletion ? (
                          <div>
                            {getWorkingDays(
                              taskItem.task.dateOfTaskAssignment,
                              taskItem.task.dateOfExpectedCompletion
                            )} days
                          </div>
                        ) : (
                          <span style={{ color: "#9ca3af" }}>—</span>
                        )}
                      </div>
                    ))}
                  </td>

                  {/* time spent */}
                  <td
                    style={{
                      padding: "12px",
                      verticalAlign: "top",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                    }}
                  >
                    {log.tasks && log.tasks.map((taskItem, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          marginBottom: idx < log.tasks.length - 1 ? '16px' : 0,
                          paddingBottom: idx < log.tasks.length - 1 ? '12px' : 0,
                          borderBottom: idx < log.tasks.length - 1 ? '2px solid #e5e7eb' : 'none',
                          minHeight: '60px'
                        }}
                      >
                        <div>
                          {formatDisplayHours(taskItem.totalHours)} hrs
                        </div>
                      </div>
                    ))}
                  </td>

                  {/*status */}
                  <td
                    style={{
                      padding: "12px",
                      verticalAlign: "top",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                    }}
                  >
                    {log.tasks && log.tasks.map((taskItem, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          marginBottom: idx < log.tasks.length - 1 ? '16px' : 0,
                          paddingBottom: idx < log.tasks.length - 1 ? '12px' : 0,
                          borderBottom: idx < log.tasks.length - 1 ? '2px solid #e5e7eb' : 'none',
                          minHeight: '60px'
                        }}
                      >
                        <span style={getStatusColor(taskItem.status)}>
                          {taskItem.status}
                          {(taskItem.status === "InProgress" || taskItem.status === "In Progress") && (
                            <span style={{ marginLeft: "5px", fontWeight: 600 }}>
                              {taskItem.progressToday}%
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </td>

                  {/* Action Column */}
                  <td
                    style={{
                      padding: "12px",
                      verticalAlign: log.tasks && log.tasks.length === 1 ? "top" : "middle",
                      fontSize: "14px",
                      borderBottom: "1px solid #dee2e6",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div style={{ display: "flex", 
                    gap: "8px", 
                    alignItems: "center"
                   }}>
                      <button
                        style={{ minWidth: 70 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(log);
                        }}
                        className="btn btn-sm custom-outline-btn"
                      >
                        Edit
                      </button>
                      
                      <button
                        style={{ minWidth: 70 }}
                        onClick={(e) => handleDelete(log._id, e)}
                        className="btn btn-sm btn-outline-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 16,
          padding: "14px 10px",
          fontSize: 14,
          color: "#475569",
        }}
      >
        <span>Rows per page:</span>
        <select
          value={rowsPerPage}
          onChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          style={{
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            padding: "4px 8px",
            cursor: "pointer",
          }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
        </select>
        <span>
          {page * rowsPerPage + 1}–
          {Math.min((page + 1) * rowsPerPage, totalRows)} of {totalRows}
        </span>
        <button
          className="btn btn-sm focus-ring "
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          disabled={page === 0}
          style={{
            border: "none",
            background: "transparent",
            cursor: page === 0 ? "not-allowed" : "pointer",
            fontSize: 18,
            color: page === 0 ? "#cbd5e1" : "#334155",
          }}
        >
          ‹
        </button>
        <button
          className="btn btn-sm focus-ring "
          onClick={() =>
            setPage((p) => ((p + 1) * rowsPerPage >= totalRows ? p : p + 1))
          }
          disabled={(page + 1) * rowsPerPage >= totalRows}
          style={{
            border: "none",
            background: "transparent",
            cursor:
              (page + 1) * rowsPerPage >= totalRows ? "not-allowed" : "pointer",
            fontSize: 18,
            color:
              (page + 1) * rowsPerPage >= totalRows ? "#cbd5e1" : "#334155",
          }}
        >
          ›
        </button>
      </div>

      {/*popup */}
      {showModal && (
        <div
          ref={modalRef}
          tabIndex="-1"
          onKeyDown={trapFocus(modalRef)}
          className="modal fade show"
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
          <div
            className="modal-dialog modal-dialog-centered"         
            style={{
              maxWidth: "700px",
              width: "95%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-content"
              style={{
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* HEADER */}
              <div
                className="modal-header"
                style={{ background: "#3A5FBE", color: "#fff", flexShrink: 0 }}
              >
                <h5 className="modal-title">
                  {modalMode === "add" && "Add Worklog"}
                  {modalMode === "edit" && "Edit Worklog"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                />
              </div>

              {/* BODY */}
              <div
                className="modal-body"
                style={{
                  overflowY: "auto",
                  flex: 1,
                }}
              >
                <div className="row g-3">
                  {/* Date */}
                  <div className="col-12">
                    <label className="form-label fw-bold" style={{ color: "#3A5FBE" }}>Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      required
                    />
                  </div>

                  {/* Tasks Section */}
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-bold" style={{ color: "#3A5FBE" }}>Tasks</label>
                      <button
                        type="button"
                        className="btn btn-sm custom-outline-btn"
                        onClick={addTaskEntry}
                        style={{ fontSize: "12px", padding: "4px 12px" }}
                      >
                        + Add Task
                      </button>
                    </div>
                    
                    {taskEntries.length === 0 ? (
                      <div style={{ 
                        textAlign: "center", 
                        padding: "20px", 
                        color: "#6c757d", 
                        fontSize: "14px",
                        border: "1px solid #dee2e6",
                        borderRadius: "8px",
                        backgroundColor: "#f8f9fa"
                      }}>
                        No tasks added.
                      </div>
                    ) : (
                      taskEntries.map((entry, index) => (
                        <div key={entry.id} className="card mb-3" style={{ border: "1px solid #e0e0e0", borderRadius: "8px" }}>
                          <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <strong style={{ color: "#3A5FBE" }}>Task {index + 1}</strong>
                              {taskEntries.length > 1 && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => removeTaskEntry(entry.id)}
                                  style={{ padding: "2px 8px", fontSize: "12px" }}
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                            
                            <div className="row g-2">
                              {/* task section */}
                              <div className="col-12">
                                <label className="form-label">Select Task</label>
                                <select
                                  className="form-select"
                                  value={entry.task}
                                  onChange={(e) => updateTaskEntry(entry.id, "task", e.target.value)}
                                >
                                  <option value="">Select Task</option>
                                  {todayTasks.map((task) => (
                                    <option key={task._id} value={task._id}>
                                      {task.projectName || task.task?.projectName || "Project"} - {task.taskName || "Task"}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              
                              {/* task strrat-end time */}
                              <div className="col-md-6 col-12">
                                <label className="form-label" style={{ color: "#3A5FBE", fontWeight: "500" }}> Start Time</label>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                  <TimePicker
                                    value={entry.startTime}
                                    onChange={(v) => updateTaskEntry(entry.id, "startTime", v)}
                                    viewRenderers={{
                                      hours: renderTimeViewClock,
                                      minutes: renderTimeViewClock,
                                    }}
                                    slotProps={{
                                      textField: {
                                        fullWidth: true,
                                        size: "small",
                                        sx: { "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "#3A5FBE" } } }
                                      },
                                    }}
                                  />
                                </LocalizationProvider>
                              </div>
                              
                              <div className="col-md-6 col-12">
                                <label className="form-label" style={{ color: "#3A5FBE", fontWeight: "500" }}>End Time</label>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                  <TimePicker
                                    value={entry.endTime}
                                    onChange={(v) => updateTaskEntry(entry.id, "endTime", v)}
                                    viewRenderers={{
                                      hours: renderTimeViewClock,
                                      minutes: renderTimeViewClock,
                                    }}
                                    slotProps={{
                                      textField: {
                                        fullWidth: true,
                                        size: "small",
                                        sx: { "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "#3A5FBE" } } }
                                      },
                                    }}
                                  />
                                </LocalizationProvider>
                              </div>
                              
                              <div className="col-md-6 col-12">
                                <label className="form-label">Total Hours</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={entry.totalHours ? `${formatDisplayHours(entry.totalHours)} hrs` : ""}
                                  disabled
                                  style={{ backgroundColor: "#f8f9fa" }}
                                />
                              </div>
                              
                              <div className="col-md-6 col-12">
                                <label className="form-label">Status</label>
                                <select
                                  className="form-select"
                                  value={entry.status}
                                  onChange={(e) => updateTaskEntry(entry.id, "status", e.target.value)}
                                >
                                  <option value="">Select Status</option>
                                  <option value="Submitted">Submitted</option>
                                  <option value="In Progress">In Progress</option>
                                </select>
                              </div>
                              
                              {(entry.status === "InProgress" || entry.status === "In Progress") && (
                                <div className="col-12">
                                  <label className="form-label">Progress Today (%)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="form-control"
                                    value={entry.progressToday}
                                    onChange={(e) => updateTaskEntry(entry.id, "progressToday", e.target.value)}
                                    required
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Challenges Faced */}
                  <div className="col-12">
                    <label className="form-label fw-bold" style={{ color: "#3A5FBE" }}>Challenges Faced</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={form.challengesFaced}
                      onChange={(e) => {
                        handleTextChange("challengesFaced", e.target.value);
                        autoExpand(e);
                      }}
                      onFocus={autoExpand}
                      style={{
                        resize: "none",
                        overflow: "hidden",
                        minHeight: "60px",
                      }}
                    />
                    <div className="char-count" style={{ display: "flex", justifyContent: "flex-end", fontSize: "12px", color: "#6c757d", marginTop: "4px" }}>
                      ({countChars(form.challengesFaced)}/{CHAR_LIMITS.challengesFaced} characters)
                    </div>
                  </div>

                  {/* What I Learned Today */}
                  <div className="col-12">
                    <label className="form-label fw-bold" style={{ color: "#3A5FBE" }}
                    >
                      What I Learned Today
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={form.whatLearnedToday}
                      onChange={(e) => {
                        handleTextChange("whatLearnedToday", e.target.value);
                        autoExpand(e);
                      }}
                      onFocus={autoExpand}
                      style={{
                        resize: "none",
                        overflow: "hidden",
                        minHeight: "60px",
                      }}
                    />
                    <div className="char-count" style={{ display: "flex", justifyContent: "flex-end", fontSize: "12px", color: "#6c757d", marginTop: "4px" }}>
                      ({countChars(form.whatLearnedToday)}/{CHAR_LIMITS.whatLearnedToday} characters)
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="modal-footer" style={{ flexShrink: 0 }}>
                <button
                  type="button"
                  style={{ minWidth: 90 }}
                  className="btn btn-sm custom-outline-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={handleSave}
                >
                  {modalMode === "edit" ? "Update" : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {showViewModal && viewData && (
        <div
          ref={viewModalRef}
          tabIndex="-1"
          onKeyDown={trapFocus(viewModalRef)}
          className="modal fade show"
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
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ 
              width: "700px", maxWidth: "95%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Work Log Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowViewModal(false)}
                />
              </div>

              <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                <div className="container-fluid">
                  {/* Date */}
                  <div className="row mb-3">
                    <div className="col-4 col-sm-3 fw-semibold" style={{ color: "#212529" }}
                  >
                      Date
                  </div>
                    <div className="col-8 col-sm-9" style={{ color: "#212529" }}
                  >
                    {formatDate(viewData.date)}
                  </div>
                  </div>

                  {/* Tasks Section */}
                  <div className="row mb-3">
                    <div className="col-4 col-sm-3 fw-semibold" style={{ color: "#212529" }}
                    >
                      Tasks 
                    </div>
                    <div className="col-8 col-sm-9" >
                      {viewData.tasks && viewData.tasks.map((taskItem, idx) => (
                        <div key={idx} style={{ marginBottom: idx < viewData.tasks.length - 1 ? '20px' : 0, paddingBottom: idx < viewData.tasks.length - 1 ? '16px' : 0, borderBottom: idx < viewData.tasks.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                          <div style={{ marginBottom: "8px" }}>{taskItem.task?.taskName || 'Task'}</div>
                          
                          <div className="row mb-2" style={{fontSize: "14px"}}>
                            <div className="col-4 " style={{color: "#6c757d" }}>Time:</div>
                            <div className="col-8">{taskItem.startTime} - {taskItem.endTime}</div>
                          </div>
                          
                          <div className="row mb-2" style={{fontSize: "14px"}}>
                            <div className="col-4" 
                            style={{  color: "#6c757d" }}>Time Spent:</div>
                            <div className="col-8">{formatDisplayHours(taskItem.totalHours)} hrs</div>
                          </div>
                          
                          <div className="row mb-2" style={{fontSize: "14px"}}>
                            <div className="col-4" 
                            style={{color: "#6c757d" }}>Period:</div>
                            <div className="col-8">
                              {taskItem.task?.dateOfTaskAssignment && taskItem.task?.dateOfExpectedCompletion ? (
                                <>
                                  {formatDateWithoutYear(taskItem.task.dateOfTaskAssignment)} → {formatDateWithoutYear(taskItem.task.dateOfExpectedCompletion)}
                                  {isToday(viewData.date) && (() => {
                                    const dayNumber = getTaskDayNumber(
                                      taskItem.task.dateOfTaskAssignment,
                                      taskItem.task.dateOfExpectedCompletion
                                    );
                                    return dayNumber && (
                                      <span style={{ marginLeft: "8px", fontSize: "11px", color: "#1d4ed8" }}>
                                        (Day {dayNumber})
                                      </span>
                                    );
                                  })()}
                                </>
                              ) : "—"}
                            </div>
                          </div>
                          
                          <div className="row mb-2" style={{fontSize: "14px"}}>
                            <div className="col-4" 
                            style={{color: "#6c757d" }}>Working Days:</div>
                            <div className="col-8">
                              {taskItem.task?.dateOfTaskAssignment && taskItem.task?.dateOfExpectedCompletion ? (
                                `${getWorkingDays(taskItem.task.dateOfTaskAssignment, taskItem.task.dateOfExpectedCompletion)} days`
                              ) : "—"}
                            </div>
                          </div>
                          
                          <div className="row mb-2" style={{fontSize: "14px"}}>
                            <div className="col-4" 
                            style={{ color: "#6c757d" }}>Status:</div>
                            <div className="col-8">
                              <span style={getStatusColor(taskItem.status)}>
                                {taskItem.status}
                                {(taskItem.status === "In Progress" || taskItem.status === "InProgress") && taskItem.progressToday && (
                                  <span style={{ marginLeft: "5px" }}>{taskItem.progressToday}%</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Challenges*/}
                  <div className="row mb-3">
                    <div className="col-4 col-sm-3 fw-semibold" style={{ color: "#212529" }}
                    >
                      Challenges Faced
                    </div>
                    <div className="col-8 col-sm-9" style={{ color: "#212529" }}>{viewData.challengesFaced || "-"}</div>
                  </div>

                  {/* What I Learned */}
                  <div className="row mb-3">
                    <div className="col-4 col-sm-3 fw-semibold" style={{ color: "#212529" }}
                  >
                    What I Learned
                  </div>
                    <div className="col-8 col-sm-9" style={{ color: "#212529" }}>{viewData.whatLearnedToday || "-"}</div>
                  </div>

                  {/* Approval by*/}
                  {viewData.tasks?.some(t => t.status === "Approved") && (
                    <>
                      <div className="row mb-2">
                        <div className="col-4 col-sm-3 fw-semibold" style={{ color: "#212529" }}>Remarks</div>
                        <div className="col-8 col-sm-9" style={{ color: "#212529" }}>{viewData.remarks || "-"}</div>
                      </div>
                      <div className="row mb-2">
                        <div className="col-4 col-sm-3 fw-semibold" style={{ color: "#212529" }}>Rating</div>
                        <div className="col-8 col-sm-9">
                          <span style={{ fontSize: "16px", color: "#22c55e" }}>
                            {"★".repeat(Math.floor(viewData.rating || 0))}
                            {(viewData.rating || 0) % 1 !== 0 && <span className="star half">★</span>}
                          </span>
                          <span style={{ marginLeft: "8px", fontSize: "13px", color: "#6c757d" }}>
                            ({viewData.rating || 0}/5)
                          </span>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <div className="col-4 col-sm-3 fw-semibold" style={{ color: "#212529" }}>Approved By</div>
                        <div className="col-8 col-sm-9" style={{ color: "#212529" }}>{viewData?.approvedBy?.name || "Team Leader"}</div>
                      </div>
                    </>
                  )}

                  {viewData.tasks?.some(t => t.status === "Rejected") && (
                    <div className="row mb-2">
                      <div className="col-4 col-sm-3 fw-semibold" style={{ color: "#212529" }}>Rejected By</div>
                      <div className="col-8 col-sm-9" style={{ color: "#212529" }}>{viewData?.approvedBy?.name || "Team Leader"}</div>
                    </div>
                  )}

                  {!viewData.tasks?.some(t => t.status === "Approved" || t.status === "Rejected") && (
                    <div className="row mb-2">
                      <div className="col-4 col-sm-3 fw-semibold" style={{ color: "#212529" }}>Approval</div>
                      <div className="col-8 col-sm-9" style={{ color: "#ffc107", fontWeight: "500" }}> Pending Review</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  className="btn btn-sm custom-outline-btn"
                  style={{ minWidth: 90 }}
                  onClick={() => setShowViewModal(false)}
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
};

export default EmployeeTasklog;

