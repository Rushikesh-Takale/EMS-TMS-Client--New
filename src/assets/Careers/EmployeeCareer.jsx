import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./EmployeeCareer.css";
import axios from "axios";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/bootstrap.css";
import TablePagination from "./TablePagination";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const EmployeeCareer = ({ user }) => {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  console.log("loggedInUser", user);
  const [activeTab, setActiveTab] = useState("Jobs");
  const [jobsPage, setJobsPage] = useState(0);
  const [appliedPage, setAppliedPage] = useState(0);
  const [referralPage, setReferralPage] = useState(0);
  const [errors, setErrors] = useState({});
const [referralErrors, setReferralErrors] = useState({});
const [phone, setPhone] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchText, setSearchText] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");
  const [workModeFilter, setWorkModeFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [postedFilter, setPostedFilter] = useState("All");
  const [jobCategoryView, setJobCategoryView] = useState("ALL");
  

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeViewTab, setActiveViewTab] = useState("DESC");
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [isSubmittingInhouse, setIsSubmittingInhouse] = useState(false);
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);

  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralSuccess, setReferralSuccess] = useState(false);
  const [referredCandidates, setReferredCandidates] = useState([]);
  const [activeReferralTab, setActiveReferralTab] = useState("DESC");
  const [appliedSearch, setAppliedSearch] = useState("");

  // view modal applied
  const [showAppliedViewModal, setShowAppliedViewModal] = useState(false);
  const [selectedAppliedJob, setSelectedAppliedJob] = useState(null);

  // view modal referal
  const [showReferralViewModal, setShowReferralViewModal] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState(null);

  const [filterDate, setFilterDate] = useState("");

  const [jobs, setJobs] = useState([]);
  const [appliedJob, setAppliedJob] = useState([]);
  const [referralJobs, setReferralJobs] = useState([]);
  const modalRef = useRef(null);

  //TANVI
  useEffect(() => {
    const isModalOpen =
      !!showReferralViewModal ||
      showViewModal ||
      showReferralModal ||
      showAppliedViewModal;

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
  }, [
    showReferralViewModal,
    showViewModal,
    showReferralModal,
    showAppliedViewModal,
  ]);

  const isAnyModalOpen =
    showReferralViewModal ||
    showViewModal ||
    showReferralModal ||
    showAppliedViewModal;

  useEffect(() => {
    if (!isAnyModalOpen || !modalRef.current) return;

    const modal = modalRef.current;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (!focusableElements.length) return;

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    // ⭐ modal open होताच focus
    modal.focus();
    // firstEl.focus();

    const handleKeyDown = (e) => {
      // ESC key → modal close
      if (e.key === "Escape") {
        e.preventDefault();
        setShowReferralViewModal(false);
        setShowViewModal(false);
        setShowReferralModal(false);
        setShowAppliedViewModal(false);
      }

      // TAB key → focus trap
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
  }, [
    showReferralViewModal,
    showViewModal,
    showReferralModal,
    showAppliedViewModal,
  ]);

  useEffect(() => {
    setJobsPage(0);
    setAppliedPage(0);
    setReferralPage(0);
  }, [activeTab]);

  const fetchJobs = async () => {
    try {
      const res = await fetch("https://ems-tms-server-new.vercel.app/api/jobs/");
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    } finally {
    }
  };
  const fetchAppliedJobs = async () => {
    try {
      const res = await fetch(
        `https://ems-tms-server-new.vercel.app/api/apply/employee/${user._id}?applicantType=inhouse`,
      );

      if (!res.ok) throw new Error("Failed to fetch applied jobs");

      const data = await res.json();

      console.log("API DATA:", data);
      setAppliedJob(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    }
  };
  const fetchRefferedJobs = async () => {
    try {
      const res = await fetch(
        `https://ems-tms-server-new.vercel.app/api/apply/employee/${user._id}?applicantType=referral`,
      );

      if (!res.ok) throw new Error("Failed to fetch applied jobs");

      const data = await res.json();

      console.log("API DATA:", data);
      setReferralJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    }
  };
  const createApplication = (formData) =>
    axios.post("https://ems-tms-server-new.vercel.app/api/apply", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

  console.log("appliedJob from ", appliedJob);
  const formatDate = (dateString) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
  const getDaysAgo = (createdAt) => {
    if (!createdAt) return 9999;

    const today = new Date().setHours(0, 0, 0, 0);
    const created = new Date(createdAt).setHours(0, 0, 0, 0);

    if (isNaN(created)) return 9999;

    return Math.floor((today - created) / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    fetchJobs();
    fetchAppliedJobs();
    fetchRefferedJobs();
  }, []);

useEffect(() => {
  if (!showViewModal && !showReferralModal) {
    setErrors({});
  }
}, [showViewModal, showReferralModal]);


  const getStatusColor = (status) => {
    switch (status) {
      case "Applied":
        return {
          backgroundColor: "#d1f2dd",
          padding: "8px 16px",
          borderRadius: "4px",
          fontSize: "13px",
          fontWeight: "500",
          display: "inline-block",
          width: "120px",
          textAlign: "center",
          color: "#0f5132",
        };
      case "Shortlisted":
        return {
          backgroundColor: "#d1e7ff",
          padding: "7px 16px",
          borderRadius: "4px",
          fontSize: "13px",
          fontWeight: "500",
          display: "inline-block",
          width: "120px",
          textAlign: "center",
          color: "#0d6efd",
        };
      case "Interview":
        return {
          backgroundColor: "#FFE493",
          padding: "8px 16px",
          borderRadius: "4px",
          fontSize: "13px",
          fontWeight: "500",
          display: "inline-block",
          width: "120px",
          textAlign: "center",
          color: "#664d03",
        };
      case "Hired":
        return {
          backgroundColor: "#f1dabfff",
          padding: "8px 16px",
          borderRadius: "4px",
          fontSize: "13px",
          fontWeight: "500",
          display: "inline-block",
          width: "120px",
          textAlign: "center",
          color: "#e9700eff",
        };
      case "Rejected":
        return {
          backgroundColor: "#f8d7da",
          padding: "8px 16px",
          borderRadius: "4px",
          fontSize: "13px",
          fontWeight: "500",
          display: "inline-block",
          width: "120px",
          textAlign: "center",
          color: "#842029",
        };
      default:
        return {
          backgroundColor: "#bfcfeeff",
          padding: "8px 16px",
          borderRadius: "4px",
          fontSize: "13px",
          fontWeight: "500",
          display: "inline-block",
          width: "120px",
          textAlign: "center",
          color: "#495057",
        };
    }
  };
  const getJobTypeColor = (jobType) => {
    const baseStyle = {
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: "11px",
      fontWeight: "600",
      letterSpacing: "0.4px",
      marginLeft: "6px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
      display: "inline-block",
      lineHeight: "1",
    };
    switch (jobType) {
      case "inhouse":
        return {
          ...baseStyle,
          backgroundColor: "#d1f2dd",
          color: "#0f5132",
        };
      case "referral":
        return {
          ...baseStyle,
          backgroundColor: "#d1e7ff",
          color: "#0d6efd",
        };
      default:
        return baseStyle;
    }
  };
  const [appliedFilters, setAppliedFilters] = useState({
    searchText: "",
    filterDate: "",
    location: "All",
    workMode: "All",
    department: "All",
    posted: "All",
    category: "ALL",
  });


  // added by rushikesh
  const isExpired = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    return due <= today;
  };


  const filteredJobs = [...jobs]
    .sort((a, b) => {
      const aExpired = isExpired(a.dueOn);
      const bExpired = isExpired(b.dueOn);

      // Active jobs first
      if (aExpired !== bExpired) {
        return aExpired ? 1 : -1;
      }

      // Same category → latest first
      return new Date(b.createdAt) - new Date(a.createdAt);
    })

    .filter((job) => {
      const {
        searchText,
        filterDate,
        location,
        workMode,
        department,
        posted,
        category,
      } = appliedFilters;

      const categoryMatch =
        category === "ALL" ||
        (category === "INHOUSE" && job.jobType === "inhouse") ||
        (category === "REFERRAL" && job.jobType === "referral");

      const searchMatch =
        !searchText ||
        job.jobTitle?.toLowerCase().includes(searchText.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchText.toLowerCase()) ||
        job.department?.toLowerCase().includes(searchText.toLowerCase());

        const dueDate = job?.dueOn;

        const dateMatch =
          !filterDate ||
          (dueDate &&
            new Date(dueDate).toISOString().split("T")[0] === filterDate);

      return (
        categoryMatch &&
        searchMatch &&
        dateMatch &&
        (location === "All" || job.location === location) &&
        (workMode === "All" || job.hiringType === workMode) &&
        (department === "All" || job.department === department) &&
        (posted === "All" || getDaysAgo(job.createdAt) <= Number(posted))
      );
    });

  const appliedData = [...appliedJob].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
  const commonFilter = ({ data, type }) => {
    const {
      searchText,
      filterDate,
      location,
      workMode,
      department,
      posted,
      category,
    } = appliedFilters;

    return data.filter((item) => {
      const job = type === "JOBS" ? item : item.job;

      if (!job) return false;

      const categoryMatch =
        type !== "JOBS" ||
        category === "ALL" ||
        (category === "INHOUSE" && job.jobType === "inhouse") ||
        (category === "REFERRAL" && job.jobType === "referral");

      const searchMatch =
        !searchText ||
        job.jobTitle?.toLowerCase().includes(searchText.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchText.toLowerCase()) ||
        job.department?.toLowerCase().includes(searchText.toLowerCase()) ||
        (type === "REFERRAL" &&
          item.candidate?.name
            ?.toLowerCase()
            .includes(searchText.toLowerCase())) ||
        (type !== "JOBS" &&
          item.status?.toLowerCase().includes(searchText.toLowerCase()));

      const createdAt = item.createdAt || job.createdAt;
      const dueDate = job?.dueOn;

        const dateMatch =
          !filterDate ||
          (dueDate &&
            new Date(dueDate).toISOString().split("T")[0] === filterDate);

      return (
        categoryMatch &&
        searchMatch &&
        dateMatch &&
        (location === "All" || job.location === location) &&
        (workMode === "All" || job.hiringType === workMode) &&
        (department === "All" || job.department === department) &&
        (posted === "All" || getDaysAgo(job.createdAt) <= Number(posted))
      );
    });
  };

  const validateField = (name, value, files = null) => {
    let error = "";
  
    switch (name) {
      case "firstName":
        if (!value.trim()) error = "First name is required";
        else if (!/^[A-Za-z ]+$/.test(value))
          error = "Only letters allowed";
        break;
  
      case "middleName":
        if (value && !/^[A-Za-z ]+$/.test(value))
          error = "Only letters allowed";
        break;
  
      case "lastName":
        if (!value.trim()) error = "Last name is required";
        else if (!/^[A-Za-z ]+$/.test(value))
          error = "Only letters allowed";
        break;
  
      case "email":
        if (!value.trim()) error = "Email is required";
        else if (!/^\S+@\S+\.\S+$/.test(value))
          error = "Enter valid email";
        break;
  
        case "phone":
          if (!value.trim()) {
            error = "Phone number is required";
          } else if (value.replace(/\D/g, "").length < 7) {
            error = "Enter valid phone number";
          }
          break;
  
          case "experience":
            if (!value) {
              error = "Experience is required";
            } else if (Number(value) < 0 || Number(value) > 99) {
              error = "Experience must be between 0 and 99";
            }
            break;
  
            case "city":
              if (!value.trim()) {
                error = "City is required";
              } else if (!/^[A-Za-z ]+$/.test(value)) {
                error = "Only letters allowed";
              } else if (value.trim().length > 30) {
                error = "City name should not exceed 30 characters";
              }
              break;
              
  
      case "resume":
        if (!files || !files[0])
          error = "Resume is required";
        break;
  
      default:
        break;
    }
  
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  
    return error;
  };

  const highlightEmptyFields = (form) => {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'experience', 'city', 'resume'];
    let hasError = false;
    
    requiredFields.forEach(fieldName => {
      const field = form[fieldName];
      let error = "";
      
      if (fieldName === 'resume') {
        if (!field.files || !field.files[0]) {
          error = "Resume is required";
          hasError = true;
        }
      } else {
        if (!field.value.trim()) {
          const fieldLabel = fieldName
  .replace(/([A-Z])/g, " $1")
  .replace(/^./, (str) => str.toUpperCase());

error = `${fieldLabel} is required`;
          hasError = true;
        }
      }
      
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
    });
    
    return hasError;
  };

  const paginatedJobs = filteredJobs.slice(
    jobsPage * rowsPerPage,
    jobsPage * rowsPerPage + rowsPerPage,
  );

  const filteredAppliedJobs = commonFilter({
    data: appliedJob,
    type: "APPLIED",
  });

  const paginatedApplied = filteredAppliedJobs.slice(
    appliedPage * rowsPerPage,
    appliedPage * rowsPerPage + rowsPerPage,
  );

  const filteredReferralJobs = commonFilter({
    data: referralJobs,
    type: "REFERRAL",
  });

  const paginatedReferrals = filteredReferralJobs.slice(
    referralPage * rowsPerPage,
    referralPage * rowsPerPage + rowsPerPage,
  );

  const resetJobFilters = () => {
    setSearchText("");
    setFilterDate("");
    setLocationFilter("All");
    setWorkModeFilter("All");
    setDepartmentFilter("All");
    setPostedFilter("All");
    setJobCategoryView("ALL");

    setAppliedFilters({
      searchText: "",
      filterDate: "",
      location: "All",
      workMode: "All",
      department: "All",
      posted: "All",
      category: "ALL",
    });

    setJobsPage(0);
    setAppliedPage(0);     
    setReferralPage(0);

  };

  const handleFilter = () => {
    setAppliedFilters({
      searchText,
      filterDate,
      location: locationFilter,
      workMode: workModeFilter,
      department: departmentFilter,
      posted: postedFilter,
      category: jobCategoryView,
    });
    setJobsPage(0);
    setAppliedPage(0);     
    setReferralPage(0);
  };

  const handleReset = () => {
    setSearchText("");
    setFilterDate("");
    setFilteredLogs([]);
    setIsFiltered(false);
    setPage(0);
  };
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    handleFilter();
  };


  return (
    <div className="container-fluid mt-4">
      <h2
        style={{
          color: "#3A5FBE",
          marginTop: "-30px",
          fontSize: "25px",
          marginLeft: "15px",
          marginBottom: "40px",
        }}
      >
        {activeTab}
      </h2>

      <div className="container-fluid pt-1 px-3">
        {/* ===== TOP TABS ===== */}
        <ul className="d-flex flex-row justify-content-start justify-content-md-center gap-2 mb-3 list-unstyled flex-wrapv" style={{ marginLeft: 20 }}>
          {["Jobs", "Applied", "My Referral"].map((tab) => (
            <li key={tab}>
              <button
                type="button"
                className={` btn btn-sm custom-outline-btn ${activeTab === tab ? "active" : ""
                  }`}
                style={{ width: 100 }}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            </li>
          ))}
        </ul>

        {/* ===== JOBS filter ===== */}
        {activeTab === "Jobs" && (
          <>
            {/* <div className="card mb-5 mt-5 shadow-sm border-0">
              <div className="card-body">
                <div className="row g-2 align-items-center">
                 
                  <div className="col-12 col-md-auto d-flex align-items-center gap-4 mb-1 ">
                    <label htmlFor="leaveStatusFilter" className="filter-label " style={{ fontSize: "16px", color: "#3A5FBE" }}>
                      Job title
                    </label>
                    <input
                      type="text"
                      className="form-select"
                      placeholder="Job title"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </div>

                 
                 <div className="col-12 col-md-auto d-flex align-items-center gap-3 mb-1 ">
                    <label className="filter-label">Location</label>
                    <select
                      className="form-select form-select-sm"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      <option>Bangalore</option>
                      <option>Pune</option>
                      <option>Mumbai</option>
                      <option>Remote</option>
                    </select>
                  </div>

                 
                  <div className="col-12 col-md-auto d-flex align-items-center gap- mb-1">
                    <label className="filter-label">Department</label>
                    <select
                      className="form-select form-select-sm"
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      <option>IT</option>
                      <option>HR</option>
                      <option>Finance</option>
                      <option>Marketing</option>
                    </select>
                  </div>

                  
                  <div className="col-12 col-md-auto d-flex align-items-center gap-5 mb-1 ">
                    <label className=" filter-label">Posted</label>
                    <select
                      className="form-select form-select-sm"
                      value={postedFilter}
                      onChange={(e) => setPostedFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="1">Today</option>
                      <option value="7">7 Days</option>
                      <option value="30">30 Days</option>
                    </select>
                  </div>

                 
                  <div className="col-md-1 text-end">
                    <button
                      className="btn btn-sm btn-outline-primary px-4"
                      onClick={resetJobFilters}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div> */}
            <div className="card mb-4 shadow-sm border-0">
              <div className="card-body">
                <form
                  className="row g-2 align-items-center"
                  onSubmit={(e) => e.preventDefault()}
                  style={{ justifyContent: "space-between" }}
                >
                  {/*  SEARCH */}
                  <div className="col-12 col-md-auto d-flex align-items-center gap-2  mb-1">
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
                      type="search"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ minWidth: 150 }}
                    />
                  </div>
               <div className="col-12 col-md-auto d-flex align-items-center mb-1 ">
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

<LocalizationProvider dateAdapter={AdapterDayjs}>
<DatePicker
 className="form-control"
  format="DD-MM-YYYY"
  value={filterDate ? dayjs(filterDate) : null}
  onChange={(newValue) =>
    setFilterDate(newValue ? newValue.format("YYYY-MM-DD") : "")
  }
  slotProps={{
    textField: {
    
      sx: {
        "& .MuiPickersInputBase-root": {
          height: "38px !important",
        },

        "& .MuiPickersSectionList-root": {
          fontSize: "15px !important",
          color: "#090202fc !important",
        },
      },
    },
  }}

  />
</LocalizationProvider>
</div>
                  <div className="col-auto ms-auto d-flex gap-2">
                    <button
                      onClick={handleFilter}
                      className="btn btn-sm custom-outline-btn"
                      type="buttun"
                      style={{ minWidth: 90 }}
                    >
                      Filter
                    </button>

                    <button
                      onClick={resetJobFilters}
                      className="btn btn-sm custom-outline-btn"
                      type="buttun"
                      style={{ minWidth: 90 }}
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* filter code end*/}

            {/* Category */}
            <div
            className="d-flex flex-row justify-content-center align-items-center gap-2 mb-3 flex-wrap"
            style={{ width: "100%", margin: "0 auto" }}
          >
            {[
              { label: "All Jobs", value: "ALL" },
              { label: "In-house Jobs", value: "INHOUSE" },
              { label: "Referral Jobs", value: "REFERRAL" },
            ].map((cat) => (
              <button
                type="button"
                className={`btn btn-sm ${jobCategoryView === cat.value ? "active" : ""}`}
                style={{ 
                  width: 110,
                  backgroundColor: jobCategoryView === cat.value ? "#3A5FBE" : "transparent",
                  borderColor: "#3A5FBE",
                  color: jobCategoryView === cat.value ? "#fff" : "#3A5FBE",
                }}
                key={cat.value}
                onClick={() => {
                  setJobCategoryView(cat.value);
                  setAppliedFilters((prev) => ({
                    ...prev,
                    category: cat.value,
                  }));
                  setJobsPage(0);
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

            {/* Job Table */}
            <div className="card shadow-sm border-0">
              <div className="table-responsive bg-white">
                <table className="table table-hover mb-0">
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
                        Job ID
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
                        Job Title
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
                        Location
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
                        Posted
                      </th>

                      {/* added by rushikesh */}
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
                        Due Date
                      </th>
                      {/* <th
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
                      </th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedJobs.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="text-center text-muted"
                          style={{
                            padding: "20px",
                            verticalAlign: "middle",
                          }}
                        >
                          No Job records available.
                        </td>
                      </tr>
                    ) : (
                      paginatedJobs.map((job) => (
                        // added by rushikeah
                        <tr
                          key={job._id}
                          style={{
                            cursor: "pointer",
                            backgroundColor: isExpired(job.dueOn) ? "#f5f5f5" : "",
                            opacity: isExpired(job.dueOn) ? 0.6 : 1,
                          }}

                          onClick={() => {
                            setSelectedJob(job);

                            if (job.jobType === "referral") {
                              setShowReferralModal(true);
                              setActiveReferralTab("DESC");
                            } else {
                              setShowViewModal(true);
                              setActiveViewTab("DESC");
                            }
                          }}
                        >
                          {/*  */}
                          <td
                            style={{
                              padding: "12px",
                              verticalAlign: "middle",
                              fontSize: "14px",
                              borderBottom: "1px solid #dee2e6",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {job._id?.slice(-4)}
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
                            {job.jobTitle}{" "}
                            {jobCategoryView === "ALL" && (
                              <span style={getJobTypeColor(job.jobType)}>
                                {job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1)}
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
                            {job.location}
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
                            {getDaysAgo(job.createdAt) === 0
                              ? "Today"
                              : `${getDaysAgo(job.createdAt)} days ago`}
                          </td>

                          {/* added by rushikesh */}
                          <td
                            style={{
                              padding: "12px",
                              verticalAlign: "middle",
                              fontSize: "14px",
                              borderBottom: "1px solid #dee2e6",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {job.dueOn ? formatDate(job.dueOn) : "-"}
                          </td>

                          {/* <button
                              className="btn btn-sm custom-outline-btn"
                              onClick={() => {
                                setSelectedJob(job);
                                if (job.jobType === "referral") {
                                  setShowReferralModal(true);
                                  setReferralSuccess(false);
                                } else {
                                  setShowViewModal(true);
                                  setActiveViewTab("DESC");
                                }
                              }}
                            >
                              View
                            </button> */}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <TablePagination
              page={jobsPage}
              setPage={setJobsPage}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              // totalCount={filteredJobs.length}
              totalCount={filteredJobs.length}   
            />
          </>
        )}

        {/* ===== Applied Tab ===== */}
        {activeTab === "Applied" && (
          <>
            <div className="card mb-4 shadow-sm border-0">
              <div className="card-body">
                <form
                  className="row g-2 align-items-center"
                  onSubmit={(e) => e.preventDefault()}
                  style={{ justifyContent: "space-between" }}
                >
                  {/*  SEARCH */}
                  <div className="col-12 col-md-auto d-flex align-items-center gap-2  mb-1">
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
                      type="search"
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ minWidth: 150 }}
                    />
                  </div>
                  <div className="col-12 col-md-auto d-flex align-items-center  mb-1">
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
                      value={filterDate}
                      type="date"
                      onChange={(e) => setFilterDate(e.target.value)}
                      style={{ minWidth: 150 }}
                    />
                  </div>
                  <div className="col-auto ms-auto d-flex gap-2">
                    <button
                      onClick={handleFilter}
                      className="btn btn-sm custom-outline-btn"
                      type="buttun"
                      style={{ minWidth: 90 }}
                    >
                      Filter
                    </button>

                    <button
                      onClick={resetJobFilters}
                      className="btn btn-sm custom-outline-btn"
                      type="buttun"
                      style={{ minWidth: 90 }}
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="card shadow-sm border-0">
              <div className="table-responsive bg-white">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
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
                        Job ID
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
                        Job Title
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
                        Applied On
                      </th>

                      {/* added by rushikesh */}
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
                        Due Date
                      </th>
                      {/*  */}
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
                    {paginatedApplied.length === 0 ? (
                      <tr>
                        <td colSpan="6"
                            className="text-center text-muted"
                            style={{
                              padding: "20px",
                              verticalAlign: "middle",
                            }}>
                          No jobs found.
                        </td>
                      </tr>
                    ) : (
                      paginatedApplied.map((app) => (
                        <tr
                          key={app._id}
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setSelectedAppliedJob(app);
                            setShowAppliedViewModal(true);
                          }}
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
                            {app?.job?._id.slice(-4)}
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
                            {app.job?.jobTitle}
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
                            {formatDate(app.createdAt) || "Self"}
                          </td>
                          {/* added by rushikesh */}
                          <td
                            style={{
                              padding: "12px",
                              verticalAlign: "middle",
                              fontSize: "14px",
                              borderBottom: "1px solid #dee2e6",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {app.job?.dueOn ? formatDate(app.job.dueOn) : "-"}
                          </td>
                          {/*  */}
                          <td
                            style={{
                              padding: "12px",
                              verticalAlign: "middle",
                              fontSize: "14px",
                              borderBottom: "1px solid #dee2e6",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span style={getStatusColor(app.status)}>
                              {app.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <TablePagination
              page={appliedPage}
              setPage={setAppliedPage}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              // totalCount={filteredJobs.length}
              totalCount={filteredAppliedJobs.length}
            />
          </>
        )}
        {/* added by rushikesh */}
        {showAppliedViewModal && selectedAppliedJob && (
          <div
            className="modal fade show d-block"
            style={{ background: "#00000080" }}
            ref={modalRef}
            tabIndex="-1"
          >
            <div className="modal-dialog modal-lg modal-dialog-centered"
              style={{ width: "600px" }}
            >
              <div className="modal-content">
                {/* HEADER */}
                <div
                  className="modal-header"
                  style={{ backgroundColor: "#3A5FBE" }}
                >
                  <h5 className="modal-title text-white">
                    {selectedAppliedJob.job?.jobTitle}
                  </h5>
                  <button
                    className="btn-close btn-close-white"
                    onClick={() => setShowAppliedViewModal(false)}
                  />
                </div>

                {/* BODY */}
                <div
                  className={`modal-body ${isExpired(selectedAppliedJob?.job?.dueOn)
                    ? "watermark-body"
                    : ""
                    }`}
                >
                  <div>
                    <div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Job ID</div>
                        <div className="col-8">{selectedAppliedJob?.job?._id?.slice(-4)}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Location</div>
                        <div className="col-8"style={{ wordBreak:"break-word",
                        overflowWrap:"break-word"}}>{selectedAppliedJob?.job?.location}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Department</div>
                        <div className="col-8">{selectedAppliedJob?.job?.department}</div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Job Type</div>
                        <div className="col-8">{selectedAppliedJob?.job?.hiringType}</div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Experience</div>
                        <div className="col-8">
                          {selectedAppliedJob?.job?.experience?.min} – {selectedAppliedJob?.job?.experience?.max} Years
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Posted</div>
                        <div className="col-8">
                          {formatDate(selectedAppliedJob?.job?.createdAt)}
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Due Date</div>
                        <div className="col-8">
                          {selectedAppliedJob?.job?.dueOn
                            ? formatDate(selectedAppliedJob.job.dueOn)
                            : "-"}
                        </div>
                      </div>

                      {/* <hr /> */}

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Key Skills</div>
                        <div className="col-8">
                          <ul className="mb-0 list-unstyled ps-0">
                            {selectedAppliedJob?.job?.importantSkills?.map((skill, i) => (
                              <li key={i} style={{ marginBottom: "2px" }}>
                                {skill}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {selectedAppliedJob?.job?.otherSkills?.length > 0 && (
                        <div className="row mb-2">
                          <div className="col-4 fw-semibold">Other Skills</div>
                          <div className="col-8">
                            <ul className="mb-0">
                              {selectedAppliedJob.otherSkills.map((skill, i) => (
                                <li key={i}>{skill}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Description</div>
                        <div className="col-8" style={{wordBreak:"break-word",
                    overflowWrap:"break-word" }}>
                          <div
                            style={{ textAlign: "justify" }}
                            dangerouslySetInnerHTML={{
                              __html: selectedAppliedJob?.job?.jobDescription,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer border-0">
                    <button
                      className="btn custom-outline-btn btn-sm"
                      style={{ width: 90 }}
                      onClick={() => setShowAppliedViewModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== MY REFERRAL TAB ===== */}
        {activeTab === "My Referral" && (
          <>
            <div className="card mb-4 shadow-sm border-0">
              <div className="card-body">
                <form
                  className="row g-2 align-items-center"
                  onSubmit={(e) => e.preventDefault()}
                  style={{ justifyContent: "space-between" }}
                >
                  {/*  SEARCH */}
                  <div className="col-12 col-md-auto d-flex align-items-center gap-2  mb-1">
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
                      type="search"
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ minWidth: 150 }}
                    />
                  </div>
                  <div className="col-12 col-md-auto d-flex align-items-center  mb-1">
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
                      value={filterDate}
                      type="date"
                      onChange={(e) => setFilterDate(e.target.value)}
                      style={{ minWidth: 150 }}
                    />
                  </div>
                  <div className="col-auto ms-auto d-flex gap-2">
                    <button
                      onClick={handleFilter}
                      className="btn btn-sm custom-outline-btn"
                      type="buttun"
                      style={{ minWidth: 90 }}
                    >
                      Filter
                    </button>

                    <button
                      onClick={resetJobFilters}
                      className="btn btn-sm custom-outline-btn"
                      type="buttun"
                      style={{ minWidth: 90 }}
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className="card shadow-sm border-0">
              <div className="table-responsive bg-white">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
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
                        Job ID
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
                        Candidate Name
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
                        Job Title
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
                        Referred On
                      </th>
                      {/* added by rushikesh */}
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
                        Due Date
                      </th>
                      {/* - */}
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
                    {paginatedReferrals.length > 0 ? (
                      paginatedReferrals.map((ref) => (
                        <tr
                          key={ref._id}
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setSelectedReferral(ref);
                            setShowReferralViewModal(true);
                          }}
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
                            {ref?.job?._id?.slice(-4)}{" "}
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
                            {ref?.candidate?.name}
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
                            {ref?.job?.jobTitle}
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
                            {formatDate(ref?.createdAt)}
                          </td>
                          {/* added by rushikesh */}
                          <td
                            style={{
                              padding: "12px",
                              verticalAlign: "middle",
                              fontSize: "14px",
                              borderBottom: "1px solid #dee2e6",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {ref.job?.dueOn ? formatDate(ref.job.dueOn) : "-"}
                          </td>
                          {/* -- */}
                          <td
                            style={{
                              padding: "12px",
                              verticalAlign: "middle",
                              fontSize: "14px",
                              borderBottom: "1px solid #dee2e6",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span style={getStatusColor(ref.status)}>
                              {ref.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                            colSpan="6"
                            className="text-center text-muted"
                            style={{
                              padding: "20px",
                              verticalAlign: "middle",
                            }}
                          >
                            No referral data available
                          </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <TablePagination
              page={referralPage}
              setPage={setReferralPage}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              totalCount={filteredReferralJobs.length}
            />
          </>
        )}
        {/* added by rushikesh */}
        {showReferralViewModal && selectedReferral && (
          <div
            className="modal fade show d-block"
            style={{ background: "#00000080" }}
            ref={modalRef}
            tabIndex="-1"
          >
            <div className="modal-dialog modal-lg modal-dialog-centered"
              style={{ width: "600px" }}
            >
              <div className="modal-content">
                {/* HEADER */}
                <div
                  className="modal-header"
                  style={{ backgroundColor: "#3A5FBE" }}
                >
                  <h5 className="modal-title text-white">
                    {selectedReferral.job?.jobTitle}
                  </h5>
                  <button
                    className="btn-close btn-close-white"
                    onClick={() => setShowReferralViewModal(false)}
                  />
                </div>

                {/* BODY */}
                <div className={`modal-body ${isExpired(selectedReferral?.job?.dueOn)
                  ? "watermark-body"
                  : ""
                  }`}
                >
                  {/* Referral Info */}
                  <div>

                    <div className="row mb-2">
                      <div className="col-4 fw-semibold">Job ID</div>
                      <div className="col-8">{selectedReferral?.job?._id?.slice(-4)}</div>
                    </div>

                    <div className="row mb-2">
                      <div className="col-4 fw-semibold">Location</div>
                      <div className="col-8"style={{ wordBreak:"break-word",
                        overflowWrap:"break-word"}}>{selectedReferral?.job?.location}</div>
                    </div>

                    <div className="row mb-2">
                      <div className="col-4 fw-semibold">Department</div>
                      <div className="col-8">{selectedReferral?.job?.department}</div>
                    </div>

                    <div className="row mb-2">
                      <div className="col-4 fw-semibold">Job Type</div>
                      <div className="col-8">{selectedReferral.hiringType}</div>
                    </div>

                    <div className="row mb-2">
                      <div className="col-4 fw-semibold">Experience</div>
                      <div className="col-8">
                        {selectedReferral?.job?.experience?.min} – {selectedReferral?.job?.experience?.max} Years
                      </div>
                    </div>

                    <div className="row mb-2">
                      <div className="col-4 fw-semibold">Posted</div>
                      <div className="col-8">
                        {formatDate(selectedReferral.createdAt)}
                      </div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-4 fw-semibold">Due Date</div>
                      <div className="col-8">
                        {selectedReferral?.job?.dueOn
                          ? formatDate(selectedReferral.job.dueOn)
                          : "-"}
                      </div>
                    </div>

                    {/* <hr /> */}

                    <div className="row mb-2">
                      <div className="col-4 fw-semibold">Key Skills</div>
                      <div className="col-8">
                        <ul className="mb-0 list-unstyled ps-0">
                          {selectedReferral.importantSkills?.map((skill, i) => (
                            <li key={i} style={{ marginBottom: "2px" }}>
                              {skill}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {selectedReferral.otherSkills?.length > 0 && (
                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Other Skills</div>
                        <div className="col-8">
                          <ul className="mb-0">
                            {selectedReferral.otherSkills.map((skill, i) => (
                              <li key={i}>{skill}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="row mb-2">
                      <div className="col-4 fw-semibold">Description</div>
                      <div className="col-8" style={{wordBreak:"break-word",
                    overflowWrap:"break-word" }}>
                        <div
                          // style={{
                          //   textAlign: "justify",
                          //   width: "100%",
                          //   display: "block",
                          // }}
                          dangerouslySetInnerHTML={{
                            __html: selectedReferral?.job?.jobDescription,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/*CLOSE */}
                <div className="modal-footer border-0">
                  <button
                    className="btn custom-outline-btn btn-sm"
                    style={{ width: 90 }}
                    onClick={() => setShowReferralViewModal(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          // </div> 
        )}

        {/* ===== View Modal ===== */}
        {/* added by rushikesh */}
        {showViewModal && selectedJob && (
          <div
            className="modal fade show d-block"
            style={{ background: "#00000080", }}
            ref={modalRef}
            tabIndex="-1"
          >
            <div className="modal-dialog modal-lg modal-dialog-centered"
              style={{ width: "600px" }}
            >
              <div className="modal-content">
                <div
                  className="modal-header"
                  style={{ backgroundColor: "#3A5FBE" }}
                >
                  <h5 className="modal-title text-white" style={{
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "normal",
                  }}>
                    {selectedJob.jobTitle}
                  </h5>
                  <button
                    className="btn-close btn-close-white"
                    onClick={() => {
                      setShowViewModal(false);
                      setErrors({});
                    }}
                  />
                </div>
                <div


                  className={`modal-body ${isExpired(selectedJob?.dueOn) ? "watermark-body" : ""
                    }`}
                >
                  {/* Modal Tabs */}
                  <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-sm custom-outline-btn"
                      style={{
                        backgroundColor: activeViewTab === "DESC" ? "#3A5FBE" : "",
                        borderColor: "#3A5FBE",
                        color: activeViewTab === "DESC" ? "#fff" : "",
                        marginBottom:"10px"
                      }}
                      onClick={() => setActiveViewTab("DESC")}
                    >
                      Job Description
                    </button>

                    {!isExpired(selectedJob?.dueOn) && (
                      <button
                        type="button"
                        className="btn btn-sm custom-outline-btn"
                        style={{
                          backgroundColor: activeViewTab === "APPLY" ? "#3A5FBE" : "",
                          borderColor: "#3A5FBE",
                          color: activeViewTab === "APPLY" ? "#fff" : "",
                          marginBottom:"10px"
                        }}
                        onClick={() => setActiveViewTab("APPLY")}
                      >
                        Application Form
                      </button>
                    )}
                  </div>
                  {activeViewTab === "DESC" && (
                    <div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Job ID</div>
                        <div className="col-8">{selectedJob._id?.slice(-4)}</div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Location</div>
                        <div className="col-8"style={{
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                        }}>{selectedJob.location}</div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Department</div>
                        <div className="col-8">{selectedJob.department}</div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Job Type</div>
                        <div className="col-8">{selectedJob.hiringType}</div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Experience</div>
                        <div className="col-8">
                          {selectedJob.experience?.min} – {selectedJob.experience?.max} Years
                        </div>
                      </div>


                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Posted</div>
                        <div className="col-8">
                          {formatDate(selectedJob.createdAt)}
                        </div>
                      </div>

                      {/* <hr /> */}

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Key Skills</div>
                        <div className="col-8"style={{
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                        }}>
                          <ul className="mb-0 list-unstyled ps-0">
                            {selectedJob.importantSkills?.map((skill, i) => (
                              <li key={i} style={{ marginBottom: "2px",  }}>
                                {skill}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {selectedJob.otherSkills?.length > 0 && (
                        <div className="row mb-2">
                          <div className="col-4 fw-semibold">Other Skills</div>
                          <div className="col-8">
                            <ul className="mb-0">
                              {selectedJob.otherSkills.map((skill, i) => (
                                <li key={i}>{skill}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Description</div>
                        <div className="col-8" style={{ wordBreak:"break-word",
                      overflowWrap:"break-word" }}>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: selectedJob.jobDescription,
                            }}
                          />
                        </div>
                      </div>

                      <div className="text-end mt-3">
                        <button
                          type="button"
                          className="btn btn-sm custom-outline-btn"
                          onClick={() => {
                            setShowViewModal(false);
                            setErrors({});
                          }}
                          style={{ minWidth: 90 }}
                        >
                          Close
                        </button>
                      </div>
                    </div>

                  )}

                  {/* Application Form */}
                  {activeViewTab === "APPLY" && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (isSubmittingInhouse) return;
                        
                        const form = e.target;
                        setErrors({});
  
                        // Check and highlight empty fields
                        const hasEmptyFields = highlightEmptyFields(form);
                        
                        if (hasEmptyFields) {
                          alert("Please fill all required fields");
                          return;
                        }
                        
                        if (!form.firstName.value.trim() || 
                            !form.lastName.value.trim() || 
                            !form.email.value.trim() || 
                            !form.phone.value.trim() || 
                            !form.experience.value || 
                            !form.city.value.trim() || 
                            !form.resume.files[0]) {
                          alert("Please fill all required fields");
                          return;
                        }
                        setIsSubmittingInhouse(true); 

                        const formData = new FormData();
                        formData.append("job", selectedJob._id);
                        formData.append("applicantType", "inhouse");
                        formData.append("employee", user._id);
                        formData.append(
                          "name",
                          `${form.firstName.value}${form.middleName.value} ${form.lastName.value}`,
                        );
                        formData.append("email", form.email.value);
                        formData.append("experience", form.experience.value);
                        formData.append("city", form.city.value);
                        formData.append("phone", form.phone.value);
                        formData.append("resumeUrl", form.resume.files[0]);

                        try {
                          await createApplication(formData);
                          alert("Application submitted successfully!");
                          await fetchAppliedJobs();
                          setShowViewModal(false);
                        } catch (err) {
                          alert(
                            err.response?.data?.message || "Application failed",
                          );
                        }
                        finally {
                          setIsSubmittingInhouse(false); 
                        }
                      }}
                    >

                     <div className="row align-items-center mb-3">
                        <div className="col-12 col-md-4 fw-semibold">First Name<span style={{ color: "red" }}>  *</span></div>
                        <div className="col-12 col-md-8">
                        <input
                          name="firstName"
                          maxLength={50}
                          className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                          onChange={(e) => validateField("firstName", e.target.value)}
                          
                        />
                        <div className="invalid-feedback">{errors.firstName}</div>
                        </div>
                      </div>

                      {/* Middle Name */}
                      <div className="row align-items-center mb-3">
                        <div className="col-12 col-md-4 fw-semibold">Middle Name</div>
                        <div className="col-12 col-md-8">
                         <input
                          name="middleName"
                          maxLength={50}
                          className={`form-control ${errors.middleName ? "is-invalid" : ""}`}
                          onChange={(e) => validateField("middleName", e.target.value)}
                        />
                        <div className="invalid-feedback">{errors.middleName}</div>
                        </div>
                      </div>

                      {/* Last Name */}
                      <div className="row align-items-center mb-3">
                        <div className="col-12 col-md-4 fw-semibold">Last Name<span style={{ color: "red" }}>  *</span></div>
                        <div className="col-12 col-md-8">
                          <input
                            name="lastName"
                            maxLength={50}
                          className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                          onChange={(e) => validateField("lastName", e.target.value)}
                        />
                        <div className="invalid-feedback">{errors.lastName}</div>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="row align-items-center mb-3">
                        <div className="col-12 col-md-4 fw-semibold">Email<span style={{ color: "red" }}>  *</span></div>
                        <div className="col-12 col-md-8">
                         <input
                            type="email"
                            name="email"
                            className={`form-control ${errors.email ? "is-invalid" : ""}`}
                            onChange={(e) => validateField("email", e.target.value)}
                          />
                          <div className="invalid-feedback">{errors.email}</div>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="row align-items-center mb-3">
                        <div className="col-12 col-md-4 fw-semibold">Phone Number<span style={{ color: "red" }}>  *</span></div>
                        <div className="col-12 col-md-8">
                        <PhoneInput
                          country={"in"}
                          value={phone}
                          onChange={(value) => {
                            setPhone(value);
                            validateField("phone", value);
                          }}
                          inputProps={{
                            name: "phone",
                            required: true,
                          }}
                          containerStyle={{ width: "100%" }}
                          inputStyle={{ width: "100%", height: "38px" }}
                          enableSearch={true}
                          searchPlaceholder="Search country..."
                        />
                      <div className="invalid-feedback">{errors.phone}</div>
                        </div>
                      </div>

                      {/* Experience */}
                      <div className="row align-items-center mb-3">
                        <div className="col-12 col-md-4 fw-semibold">Experience<span style={{ color: "red" }}>  *</span></div>
                        <div className="col-12 col-md-8">
                        <input
                          type="number"
                          name="experience"
                          min="0"
                          max="99"
                          className={`form-control ${errors.experience ? "is-invalid" : ""}`}
                          onChange={(e) => {
                            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                            validateField("experience", e.target.value);
                          }}
                        />
                        <div className="invalid-feedback">{errors.experience}</div>
                        </div>
                      </div>

                      {/* City */}
                      <div className="row align-items-center mb-3">
                        <div className="col-12 col-md-4 fw-semibold">Current City<span style={{ color: "red" }}>  *</span></div>
                        <div className="col-12 col-md-8">
                          <input
                          name="city"
                          maxLength={30}
                          className={`form-control ${errors.city ? "is-invalid" : ""}`}
                          onChange={(e) => validateField("city", e.target.value)}
                        />
                        <div className="invalid-feedback">{errors.city}</div>
                        </div>
                      </div>

                      {/* Resume */}
                      <div className="row align-items-center mb-3">
                        <div className="col-12 col-md-4 fw-semibold">Resume<span style={{ color: "red" }}>  *</span></div>
                        <div className="col-12 col-md-8">
                         <input
                          type="file"
                          name="resume"
                          accept=".pdf,.doc,.docx"
                          className={`form-control ${errors.resume ? "is-invalid" : ""}`}
                          onChange={(e) => validateField("resume", "", e.target.files)}
                        />
                        <div className="invalid-feedback">{errors.resume}</div>
                        </div>
                      </div>

                      <div className="text-end mt-3">
                        <button
                          className="btn btn-sm custom-outline-btn me-2"
                          type="submit"
                          style={{ minWidth: 90 }}
                          disabled={isSubmittingInhouse}
                        >
                          Apply Job
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm custom-outline-btn"
                          onClick={() => setShowViewModal(false)}
                          style={{ minWidth: 90 }}
                        >
                          Close
                        </button>
                      </div>

                    </form>
                  )}
                  {/* //Added by Mahesh */}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Referral Modal (Like In-house Application Form) ===== */}
        {/* added by rushikesh */}
        {showReferralModal && selectedJob && (
          <div
            className="modal fade show d-block"
            style={{ background: "#00000080" }}
            ref={modalRef}
            tabIndex="-1"
          >
            <div className="modal-dialog modal-lg modal-dialog-centered"
              style={{ width: "600px" }}
            >
              <div className="modal-content">
                <div
                  className="modal-header"
                  style={{ backgroundColor: "#3A5FBE" }}
                >
                  <h5 className="modal-title" style={{ color: "white" }}>
                    Refer Candidate for {selectedJob.jobTitle}
                  </h5>
                  <button
                    className="btn-close btn-close-white"
                    onClick={() => {
                      setShowReferralModal(false);
                      setErrors({});
                    }}
                  />
                </div>
                <div
                  className={`modal-body ${isExpired(selectedJob?.dueOn)
                    ? "watermark-body"
                    : ""
                    }`}
                >
                  {/* Modal Tabs */}
                  <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-sm custom-outline-btn"
                      style={{
                        backgroundColor: activeReferralTab === "DESC" ? "#3A5FBE" : "#fff",
                        borderColor: "#3A5FBE",
                        color: activeReferralTab === "DESC" ? "#fff" : "#3A5FBE",
                        marginBottom:"10px"
                      }}
                     onClick={() => setActiveReferralTab("DESC")}
                    >
                      Job Description
                    </button>

                    {!isExpired(selectedJob?.dueOn) && (
                      <button
                        type="button"
                        className="btn btn-sm custom-outline-btn"
                        style={{
                          backgroundColor: activeReferralTab === "APPLY" ? "#3A5FBE" : "#fff",
                            borderColor: "#3A5FBE",
                            color: activeReferralTab === "APPLY" ? "#fff" : "#3A5FBE",
                          marginBottom:"10px"

                        }}
                        onClick={() => setActiveReferralTab("APPLY")}           //shivani code
                      >
                        Application Form
                      </button>
                    )}
                  </div>
                  {/* {activeViewTab === "DESC" && ( */}
                  {activeReferralTab === "DESC" && (
                    <div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Job ID</div>
                        <div className="col-8">{selectedJob._id?.slice(-4)}</div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Location</div>
                        <div className="col-8"style={{ wordBreak:"break-word",
                        overflowWrap:"break-word"}}>{selectedJob.location}</div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Department</div>
                        <div className="col-8">{selectedJob.department}</div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Job Type</div>
                        <div className="col-8">{selectedJob.hiringType}</div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Experience</div>
                        <div className="col-8">
                          {selectedJob.experience?.min} – {selectedJob.experience?.max} Years
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-4 fw-semibold">Posted</div>
                        <div className="col-8">
                          {formatDate(selectedJob.createdAt)}
                        </div>
                      </div>

                      {/* <hr /> */}

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Key Skills</div>
                        <div className="col-8">
                          <ul className="mb-0 list-unstyled ps-0">
                            {selectedJob.importantSkills?.map((skill, i) => (
                              <li key={i} style={{ marginBottom: "2px" }}>
                                {skill}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {selectedJob.otherSkills?.length > 0 && (
                        <div className="row mb-2">
                          <div className="col-4 fw-semibold">Other Skills</div>
                          <div className="col-8">
                            <ul className="mb-0">
                              {selectedJob.otherSkills.map((skill, i) => (
                                <li key={i}>{skill}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      <div className="row mb-2">
                        <div className="col-4 fw-semibold">Description</div>
                        <div className="col-8" style={{ WordBreak:"break-word",
                      overflowWrap:"break-word" }}>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: selectedJob.jobDescription,
                            }}
                          />
                          <div className="text-end mt-3">
                            <button
                              className="btn btn-sm custom-outline-btn me-2"
                              onClick={() => {
                                setShowReferralModal(false);
                                setErrors({});
                              }}
                              type="buttun"
                              style={{ minWidth: 90 }}
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}


                  {/* Referral Application Form */}
                  {!referralSuccess && activeReferralTab === "APPLY" && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (isSubmittingReferral) return;
                        const form = e.target;
                        setErrors({});
  
                        // Check and highlight empty fields
                        const hasEmptyFields = highlightEmptyFields(form);
                        
                        if (hasEmptyFields) {
                          alert("Please fill all required fields");
                          return;
                        }
                        setIsSubmittingReferral(true);
                        
                        if (!form.firstName.value.trim() || 
                            !form.lastName.value.trim() || 
                            !form.email.value.trim() || 
                            !form.phone.value.trim() || 
                            !form.experience.value || 
                            !form.city.value.trim() || 
                            !form.resume.files[0]) {
                          alert("Please fill all required fields");
                          return;
                        }

                        const formData = new FormData();
                        formData.append("job", selectedJob._id);
                        formData.append("applicantType", "referral"); // or inhouse
                        formData.append("referredBy", user._id); // logged-in employee id
                        formData.append("employee", user._id);
                        formData.append(
                          "name",
                          `${form.firstName.value} ${form.middleName.value} ${form.lastName.value}`,
                        );
                        formData.append("email", form.email.value);
                        formData.append("experience", form.experience.value);
                        formData.append("city", form.city.value);
                        formData.append("phone", form.phone.value);
                        formData.append("resumeUrl", form.resume.files[0]);
                        const candidate = {
                          name: `${form.firstName.value}${form.middleName.value} ${form.lastName.value}`,
                          email: form.email.value,
                          experience: form.experience.value,
                          city: form.city.value,
                          phone: form.phone.value,
                        };
                        try {
                          await createApplication(formData);
                          alert("Application submitted successfully!");
                          await fetchRefferedJobs();
                          setReferredCandidates([
                            ...referredCandidates,
                            candidate,
                          ]);
                          setReferralSuccess(true);
                          setShowReferralModal(false);   // ✅ correct
                        } catch (err) {
                          alert(
                            err.response?.data?.message || "Application failed",
                          );
                        }
                        finally {
                          setIsSubmittingReferral(false);
                        }
                      }}
                    >

                      {/* Candidate Info */}
                     <div className="row align-items-center mb-3">
                        <div className="col-12 col-md-4 fw-semibold">First Name<span style={{ color: "red" }}>  *</span></div>
                        <div className="col-12 col-md-8">
                        <input
                          name="firstName"
                          maxLength={50}
                          className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                          onChange={(e) => validateField("firstName", e.target.value)}
                        />
                        <div className="invalid-feedback">{errors.firstName}</div>
                        </div>
                      </div>

                      {/* Middle Name */}
                      <div className="row align-items-center mb-3">
                        <div className="col-12 col-md-4 fw-semibold">Middle Name</div>
                        <div className="col-12 col-md-8">
                         <input
                          name="middleName"
                          maxLength={50}
                          className={`form-control ${errors.middleName ? "is-invalid" : ""}`}
                          onChange={(e) => validateField("middleName", e.target.value)}
                        />
                        <div className="invalid-feedback">{errors.middleName}</div>
                        </div>
                      </div>

                      {/* Last Name */}
                      <div className="row align-items-center mb-3">
                        <div className="col-12 col-md-4 fw-semibold">Last Name<span style={{ color: "red" }}>  *</span></div>
                        <div className="col-12 col-md-8">
                          <input
                            name="lastName"
                            maxLength={50}
                          className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                          onChange={(e) => validateField("lastName", e.target.value)}
                        />
                        <div className="invalid-feedback">{errors.lastName}</div>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="row align-items-center mb-3">
                        <div className="col-12 col-md-4 fw-semibold">Email<span style={{ color: "red" }}>  *</span></div>
                        <div className="col-12 col-md-8">
                         <input
                            type="email"
                            name="email"
                            className={`form-control ${errors.email ? "is-invalid" : ""}`}
                            onChange={(e) => validateField("email", e.target.value)}
                          />
                          <div className="invalid-feedback">{errors.email}</div>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="row align-items-center mb-3">
                        <div className="col-12 col-md-4 fw-semibold">Phone Number<span style={{ color: "red" }}>  *</span></div>
                        <div className="col-12 col-md-8">
                        <PhoneInput
                          country={"in"}
                          value={phone}
                          onChange={(value) => {
                            setPhone(value);
                            validateField("phone", value);
                          }}
                          inputProps={{
                            name: "phone",
                            required: true,
                          }}
                          containerStyle={{ width: "100%" }}
                          inputStyle={{ width: "100%", height: "38px" }}
                          enableSearch={true}
                          searchPlaceholder="Search country..."
                        />
                    
                      <div className="invalid-feedback">{errors.phone}</div>
                        </div>
                      </div>

                      {/* Experience */}
                      <div className="row align-items-center mb-3">
                        <div className="col-12 col-md-4 fw-semibold">Experience<span style={{ color: "red" }}>  *</span></div>
                        <div className="col-12 col-md-8">
                        <input
                          type="number"
                          name="experience"
                          min="0"
                          max="99"
                          className={`form-control ${errors.experience ? "is-invalid" : ""}`}
                          onChange={(e) => {
                            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                            validateField("experience", e.target.value);
                          }}
                        />
                        <div className="invalid-feedback">{errors.experience}</div>
                        </div>
                      </div>

                      {/* City */}
                      <div className="row align-items-center mb-3">
                        <div className="col-12 col-md-4 fw-semibold">Current City<span style={{ color: "red" }}>  *</span></div>
                        <div className="col-12 col-md-8">
                          <input
                          name="city"
                          maxLength={30}
                          className={`form-control ${errors.city ? "is-invalid" : ""}`}
                          onChange={(e) => validateField("city", e.target.value)}
                        />
                        <div className="invalid-feedback">{errors.city}</div>
                        </div>
                      </div>

                      {/* Resume */}
                      <div className="row align-items-center mb-3">
                        <div className="col-12 col-md-4 fw-semibold">Resume<span style={{ color: "red" }}>  *</span></div>
                        <div className="col-12 col-md-8">
                         <input
                          type="file"
                          name="resume"
                          accept=".pdf,.doc,.docx"
                          className={`form-control ${errors.resume ? "is-invalid" : ""}`}
                          onChange={(e) => validateField("resume", "", e.target.files)}
                        />
                        <div className="invalid-feedback">{errors.resume}</div>
                        </div>
                      </div>

                      <div className="text-end mt-3">
                        <button
                          className="btn btn-sm custom-outline-btn me-2"
                          type="submit"
                          style={{ minWidth: 90 }}
                          disabled={isSubmittingReferral} 
                        >
                          Submit Referral
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm custom-outline-btn"
                          onClick={() => setShowReferralModal(false)}
                          style={{ minWidth: 90 }}
                        >
                          Close
                        </button>
                      </div>
                    </form>
                  )}

                  {referralSuccess && (
                    <div className="text-center">
                      <h5 className="text-success mb-3">
                        Referral submitted successfully!
                      </h5>
                      <button
                        className="btn btn-sm custom-outline-btn me-2"
                        onClick={() => {
                          setReferralSuccess(false);
                          setPhone("");
                          setErrors({});
                        }}
                      >
                        Refer More Candidates
                      </button>
                      <button
                         className="btn btn-sm custom-outline-btn"
                        onClick={() => {
                          setShowReferralModal(false); 
                          setActiveTab("My Referral");   
                          setReferralSuccess(false);    
                          setJobsPage(0);                
                          setReferralPage(0);            
                        }}
                      >
                        View Applications
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* //Added by Mahesh */}
      {/* Back Button */}
      <div className="d-flex justify-content-end mt-3">
        <button
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 90 }}
          onClick={() => {
            if (activeTab === "Jobs") {
              window.history.back();
            } else if (activeTab === "Applied") {
              setActiveTab("Jobs");
              setJobsPage(0);
            } else if (activeTab === "My Referral") {
              setActiveTab("Jobs");
              setJobsPage(0);
            }
          }}
        >
          Back
        </button>
      </div>
    </div >
  );
};

export default EmployeeCareer;
