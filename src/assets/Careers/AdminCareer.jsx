import React, { useState, useEffect, useRef } from "react";
import RichTextEditor from "./RichTextEditor";
import "./AdminCareer.css";
import axios from "axios";
import { useNavigate, useParams,useLocation  } from "react-router-dom";


function AdminCareer({ user }) {
  const [formErrors, setFormErrors] = useState({}); 
  const userRole = user.role || localStorage.getItem("role");
  

  const [jobs, setJobs] = useState([]);
  const location = useLocation();
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [activeTab, setActiveTab] = useState("inhouse");
  const modalRef = useRef(null);
  const [showAddJob, setShowAddJob] = useState(false);
  const [editJobId, setEditJobId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [viewJob, setViewJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  // View popup tabs
  const [activeViewTab, setActiveViewTab] = useState("details");
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [openStatusId, setOpenStatusId] = useState(null);
  const [saving, setSaving] = useState(false);
  // Filters
  //added by rushikesh
  const navigate = useNavigate();
  const { role, username, id } = useParams();
  // 
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [assignDateFromFilter, setAssignDateFromFilter] = useState("");
  const [assignDateToFilter, setAssignDateToFilter] = useState("");
  const [newJob, setNewJob] = useState({
    jobTitle: "",
    department: "",
    grade: "",
    location: "",
    hiringType: "",
    jobType: "",
    noOfOpenings: 1,
    dueOn: "",
    jobDescription: "",
    ctc: {
      min: "",
      max: "",
    },
    experience: {
      min: "",
      max: "",
    },
    importantSkills: [],
    status: "Active",
  });
  const [expandedJobId, setExpandedJobId] = useState(null); //Added bu samiksha


  
  useEffect(() => {
    fetchJobs();
    setFilteredJobs(jobs);
  }, []);
  useEffect(() => {
    applyFilters();
  }, [activeTab, jobs]);




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

  // useEffect(() => {
  //   const temp = jobs.filter(
  //     (j) => j.jobType === activeTab || j.jobType === "both",
  //   );
  //   setFilteredJobs(temp);
  // }, [activeTab, jobs]);
  const formatDate = (dateString) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));

  const validateForm = () => {
    const errors = {};
  
    // Job Title
    if (!newJob.jobTitle.trim()) {
      errors.jobTitle = "Job Title is required";
    } else if (!/^[A-Za-z\s]+$/.test(newJob.jobTitle)) {
      errors.jobTitle = "Only letters allowed";
    } else if (newJob.jobTitle.trim().length < 3) {
      errors.jobTitle = "Minimum 3 characters required";
    } else if (newJob.jobTitle.trim().length > 50) {
      errors.jobTitle = "Maximum 50 characters allowed";
    }
      
    // Department
    if (!newJob.department) {
      errors.department = "Department is required";
    }
  
    // Location
    if (!newJob.location.trim()) {
      errors.location = "Location is required";
    } else if (!/^[A-Za-z\s]+$/.test(newJob.location)) {
      errors.location = "Only letters allowed";
    } else if (newJob.location.trim().length > 50) {
      errors.location = "Maximum 50 characters allowed";
    }
  
    // Hiring Type
    if (!newJob.hiringType) {
      errors.hiringType = "Hiring Type is required";
    }
  
    // Job Type
    if (!newJob.jobType) {
      errors.jobType = "Job Type is required";
    }
  
    // Openings
    if (!newJob.noOfOpenings) {
      errors.noOfOpenings = "Number of openings required";
    } else if (Number(newJob.noOfOpenings) < 1) {
      errors.noOfOpenings = "Minimum 1 opening required";
    } else if (Number(newJob.noOfOpenings) > 100) {
      errors.noOfOpenings = "Maximum 100 openings allowed";
    }
  
    // Description
    const plainText = (newJob.jobDescription || "").replace(/<[^>]+>/g, "").trim();
    if (!plainText) {
      errors.jobDescription = "Job Description is required";
    } else if (plainText.length > 300) {
      errors.jobDescription = "Maximum 300 characters allowed";
    }
  
    // Skills
    const skillsText = Array.isArray(newJob.importantSkills)
  ? newJob.importantSkills.join(", ")
  : newJob.importantSkills || "";
  
    if (!skillsText.trim()) {
      errors.importantSkills = "Important Skills required";
    } else if (skillsText.length > 100) {
      errors.importantSkills = "Maximum 100 characters allowed";
    }
  
    // Due Date
    if (!newJob.dueOn) {
      errors.dueOn = "Due date required";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const due = new Date(newJob.dueOn);
      due.setHours(0, 0, 0, 0);
  
      if (due < today) {
        errors.dueOn = "Past date not allowed";
      }
    }
  
    // CTC (Required + Range + Limit)
    if (!newJob.ctc.min || !newJob.ctc.max) {
      errors.ctc = "CTC range is required";
    } else if (Number(newJob.ctc.min) <= 0 || Number(newJob.ctc.max) <= 0) {
      errors.ctc = "CTC cannot be negative";
    } else if (Number(newJob.ctc.min) >= Number(newJob.ctc.max)) {
      errors.ctc = "Min CTC cannot exceed Max CTC";
    } else if (Number(newJob.ctc.max) > 10000000) {
      errors.ctc = "CTC too large";
    }
  
    // Experience (Required + Range + Limit)
    if (!newJob.experience.min || !newJob.experience.max) {
      errors.experience = "Experience range is required";
    } else if (
      Number(newJob.experience.min) <0 ||
      Number(newJob.experience.max) < 0
    ) {
      errors.experience = "Experience cannot be negative";
    } else if (
      Number(newJob.experience.min) > Number(newJob.experience.max)
    ) {
      errors.experience =
        "Min Experience cannot exceed Max Experience";
    } else if (Number(newJob.experience.max) > 50) {
      errors.experience = "Experience too high";
    }
  
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  async function handleSaveJob(e) {
    e.preventDefault();
  if (saving) return;
    if (!validateForm()) {
      alert("Please fill all required fields correctly");
      return;
    }
    try {
      setSaving(true); 
      let processedSkills = [];
      if (Array.isArray(newJob.importantSkills)) {
        processedSkills = newJob.importantSkills;
      } else if (typeof newJob.importantSkills === "string") {
        processedSkills = newJob.importantSkills
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill !== "");
      }
      const payload = {
        jobTitle: newJob.jobTitle,
        department: newJob.department,
        grade: newJob.grade,
        location: newJob.location,
        hiringType: newJob.hiringType,
        jobType: newJob.jobType,
        // noOfOpenings: newJob.noOfOpenings,
        // dueOn: newJob.dueOn,
        // jobDescription: newJob.jobDescription,
        // ctc: {
        //   min: newJob.ctc.min,
        //   max: newJob.ctc.max,
        // },
        // experience: {
        //   min: newJob.experience.min,
        //   max: newJob.experience.max,
        // },
        // importantSkills: newJob.importantSkills,
        // status: "Active",
        //Added by Samiksha
        noOfOpenings: Number(newJob.noOfOpenings),

        dueOn: newJob.dueOn,
        jobDescription: newJob.jobDescription,

        ctc: {
          min: Number(newJob.ctc.min),
          max: Number(newJob.ctc.max),
        },

        experience: {
          min: Number(newJob.experience.min),
          max: Number(newJob.experience.max),
        },

        importantSkills:
  typeof newJob.importantSkills === "string"
    ? newJob.importantSkills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill !== "")
    : newJob.importantSkills,

        status: "Active",
      };
      console.log("payload", payload);
      let res;
      if (editJobId) {
        res = await axios.put(
          `https://ems-tms-server-new.vercel.app/api/jobs/${editJobId}`,
          payload,
          { headers: { "Content-Type": "application/json" } },
        );
        await fetchJobs();
      } else {
        const res = await axios.post(
          "https://ems-tms-server-new.vercel.app/api/jobs/",
          payload,
          { headers: { "Content-Type": "application/json" } },
        );
        await fetchJobs();
      }
      setFilteredJobs(jobs);
      setShowAddJob(false);

      if (!editJobId) {
        const lastPage = Math.ceil(jobs.length / itemsPerPage);
        setCurrentPage(lastPage);
      }

      setShowAddJob(false);
      setNewJob({
        jobTitle: "",
        department: "",
        grade: "",
        location: "",
        hiringType: "",
        jobType: "",
        noOfOpenings: 1,
        dueOn: "",
        jobDescription: "",
        ctc: {
          min: "",
          max: "",
        },
        experience: {
          min: "",
          max: "",
        },
        importantSkills: [],
        status: "",
      });
      alert(editJobId ? "Job updated" : "Job created");
      setEditJobId(null);
    } catch (error) {
      console.error("Submit failed:", error.response?.data || error.message);
      // alert("Operation failed");
      alert(error.response?.data?.error || "Operation failed"); //Added by Samiksha
    }finally {
    setSaving(false); 
  }
  }

  const handleEdit = (job) => {
    console.log("jobs from handle edit", job);
    setEditJobId(job._id);
    setShowAddJob(true);
    setEditMode(true);
    setNewJob({
      jobTitle: job?.jobTitle || "",
      department: job?.department || "",
      grade: job?.grade || "",
      location: job?.location || "",
      hiringType: job?.hiringType || "",
      jobType: job?.jobType || "",
      noOfOpenings: job?.noOfOpenings || "",
      dueOn: job?.dueOn ? new Date(job.dueOn).toISOString().split("T")[0] : "",
      jobDescription: job?.jobDescription || "",
      ctc: {
        min: job?.ctc?.min || "",
        max: job?.ctc?.max || "",
      },
      experience: {
        min: job?.experience?.min || "",
        max: job?.experience?.max || "",
      },
      importantSkills: Array.isArray(job?.importantSkills)
        ? job.importantSkills
        : typeof job?.importantSkills === "string"
          ? job.importantSkills.split(",").map((s) => s.trim())
          : [],
      status: job?.status || "",
    });
    setFormErrors({});
    console.log("new Job from edit", newJob);
  };

  async function handleDelete(id, e) {
    if (e) e.stopPropagation(); 
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await axios.delete(`https://ems-tms-server-new.vercel.app/api/jobs/${id}`);
      setJobs((prev) => prev.filter((t) => t._id !== id));
      setFilteredJobs((prev) => prev.filter((t) => t._id !== id));

      alert("Job deleted Successfully!!"); 
    } catch (error) {
      alert("Failed to delete job");
      console.log("error", error.message);
    }
  }

  //   const applyFilters = () => {
  //   let temp = [...jobs];

  //   if (statusFilter !== "All") {
  //     temp = temp.filter(job => job?.status === statusFilter);
  //   }

  //   if (assignDateFromFilter) {
  //     temp = temp.filter(job => new Date(job?.createdAt));
  //   }

  //   if (assignDateToFilter) {
  //     temp = temp.filter(job => new Date(job?.dueOn));
  //   }

  //   // temp.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  //   setFilteredJobs(temp);
  //   setCurrentPage(1);
  // };
  const applyFilters = () => {
    let temp = [...jobs];
  
   
    temp = temp.filter(
      (job) => job.jobType === activeTab || job.jobType === "both"
    );
  
    const isSearchEmpty = searchTerm.trim() === "";
    const isStatusDefault = statusFilter === "All";
    const isDateEmpty = !assignDateFromFilter && !assignDateToFilter;
  
   
    if (isSearchEmpty && isStatusDefault && isDateEmpty) {
temp.sort((a, b) => {
  const aExpired = isExpired(a.dueOn) ? 1 : 0;
  const bExpired = isExpired(b.dueOn) ? 1 : 0;

  // Active jobs first
  if (aExpired !== bExpired) {
    return aExpired - bExpired;
  }

  // Latest due date first for active/repost jobs
  return new Date(b.dueOn) - new Date(a.dueOn);
});
  
      
      setFilteredJobs(temp);
      return;
    }
  
   
    if (!isSearchEmpty) {
      const lowerSearch = searchTerm.toLowerCase();
  
      temp = temp.filter((job) => {
        const searchMatch =
          job.jobTitle?.toLowerCase().includes(lowerSearch);
  
        const notExpired = !isExpired(job.dueOn); // 🔥 important
  
        return searchMatch && notExpired; // 🔥 MUST RETURN
      });
    }
  
   
    if (!isStatusDefault) {
      temp = temp.filter((job) => job.status === statusFilter);
    }
  
  
    if (assignDateFromFilter) {
      const fromDate = new Date(assignDateFromFilter);
      temp = temp.filter((job) => new Date(job.createdAt) >= fromDate);
    }
  
  
    if (assignDateToFilter) {
      const toDate = new Date(assignDateToFilter);
      temp = temp.filter((job) => new Date(job.dueOn) <= toDate);
    }

    setFilteredJobs(temp);
    setCurrentPage(1);
  };



  const getApplicantsInfo = async (jobId) => {
    try {
      setLoadingApplicants(true);
      const res = await fetch(`https://ems-tms-server-new.vercel.app/api/apply/job/${jobId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch applicants");
      }

      const data = await res.json();
      setApplicants(data);
    } catch (err) {
      console.error("Error fetching applicants:", err.message);
    } finally {
      setLoadingApplicants(false);
    }
  };

  // const resetFilters = () => {
  //   setStatusFilter("All");
  //   setAssignDateFromFilter("");
  //   setAssignDateToFilter("");
  //   setFilteredJobs([...jobs]);
  //   setCurrentPage(1);
  // };
const resetFilters = () => {
  setSearchTerm("");
  setStatusFilter("All");
  setAssignDateFromFilter("");
  setAssignDateToFilter("");
  setCurrentPage(1);

  let temp = [...jobs];

  temp = temp.filter(
    (job) =>
      job.jobType === activeTab ||
      job.jobType === "both"
  );

  temp.sort((a, b) => {
    const aExpired = isExpired(a.dueOn)
      ? 1
      : 0;

    const bExpired = isExpired(b.dueOn)
      ? 1
      : 0;

    if (aExpired !== bExpired) {
      return aExpired - bExpired;
    }

    return (
      new Date(b.dueOn) -
      new Date(a.dueOn)
    );
  });

  setFilteredJobs(temp);
};

  
   const handleFilterSubmit = (e) => {
    e.preventDefault();
  
    //  check if ANY filter is applied
    if (
      searchTerm.trim() === "" &&
      statusFilter === "All" &&
      !assignDateFromFilter &&
      !assignDateToFilter
    ) {
      //  do nothing if no filters
      return;
    }
  
    //  apply only when filters exist
    applyFilters();
  };


  



  // Pagination logic
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const indexOfLastItem = Math.min(
    currentPage * itemsPerPage,
    filteredJobs.length,
  );
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };
  console.log("applicants ", applicants);
  async function handleStatusChange(applicationId, newStatus) {
    try {
      await axios.put(`https://ems-tms-server-new.vercel.app/api/apply/${applicationId}`, {
        status: newStatus,
      });

      setApplicants((prev) =>
        prev.map((app) =>
          app._id === applicationId ? { ...app, status: newStatus } : app,
        ),
      );
    } catch (err) {
      alert("Failed to update status");
    }

    // popup close
    setOpenStatusId(null);
  }

  //Added by Tanvi
  // tanvi
  
  const isAnyPopupOpen = showViewPopup || showAddJob; //rutuja

    useEffect(() => {
    if (isAnyPopupOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden"; // 🔑 important
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isAnyPopupOpen]);

  const isAnyModalOpen = showViewPopup || showAddJob; //rutuja

  useEffect(() => {

    if (!isAnyModalOpen || !modalRef.current) return;

    const modal = modalRef.current;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements.length) return;

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];


    modal.focus();


    const handleKeyDown = (e) => {

      if (e.key === "Escape") {
        e.preventDefault();
        setShowViewPopup(false);
        setViewJob(null); //rutuja
      }

      // TAB key → focus trap
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        }
        else {
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

  }, [isAnyModalOpen]);
  // mahesh code
  const isExpired = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    return due <= today;
  };
  // mahesh code

  //snehal code
  const handleRepost = (job) => {
  setNewJob({
    jobTitle: job.jobTitle || "",
    department: job.department || "",
    grade: job.grade || "",
    location: job.location || "",
    hiringType: job.hiringType || "",
    jobType: job.jobType || "",
    noOfOpenings: job.noOfOpenings || 1,
    dueOn: "",
    jobDescription: job.jobDescription || "",
    ctc: {
      min: job?.ctc?.min || "",
      max: job?.ctc?.max || "",
    },
    experience: {
      min: job?.experience?.min || "",
      max: job?.experience?.max || "",
    },
    importantSkills: job.importantSkills || [],
    status: "Active",
  });

  setEditMode(true);
  setEditJobId(job._id);
  setShowViewPopup(false);
  setShowAddJob(true);
};
const handleRowClick = (job) => {
  const today = new Date();
  const dueDate = new Date(job.dueOn);

  if (dueDate < today) {
    setViewJob(job);
    setShowViewPopup(true);
  }
};
//snehal code
  return (

    <div className="container-fluid ">
      <div className="d-flex justify-content-between mb-3">
        <h2 style={{ color: "#3A5FBE", fontSize: "25px", marginLeft: "15px" }}>
          Jobs
        </h2>
        {["hr", "admin"].includes(userRole) && (
          <button
            className="btn btn-sm custom-outline-btn"
            onClick={() => {
              setNewJob({
                jobTitle: "",
                department: "",
                grade: "",
                location: "",
                hiringType: "",
                jobType: "",
                noOfOpenings: 1,
                dueOn: "",
                jobDescription: "",
                ctc: {
                  min: "",
                  max: "",
                },
                experience: {
                  min: "",
                  max: "",
                },
                importantSkills: [],
                status: "",
              });
              setShowAddJob(true);
            }}
            style={{ minWidth: 90, height: 30 }}
          >
            + Add Job
          </button>
        )}
      </div>

      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={handleFilterSubmit}
            style={{ justifyContent: "space-between" }}
          >
            <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1">
              <label
                htmlFor="employeeNameFilter"
                className="fw-bold mb-0"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                }}
              >
                Search
              </label>
              <input
                id="employeeNameFilter"
                type="text"
                className="form-control"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by any field"
              />
            </div>

            <div className="col-12 col-md-auto d-flex align-items-center mb-1">
              <label
                htmlFor="assignDateFromFilter"
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
                type="date"
                id="assignDateFromFilter"
                value={assignDateFromFilter}
                onChange={(e) => setAssignDateFromFilter(e.target.value)}
                placeholder="dd-mm-yyyy"
                className="form-control"
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => (e.target.type = "text")}
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

      <div className="d-flex flex-row justify-content-center gap-2 mb-3 flex-wrap">
        <button
          className={`btn btn-sm job-tab-btn ${activeTab === "inhouse" ? "active" : ""
            }`}
          onClick={() => setActiveTab("inhouse")}
        >
          {" "}
          In-House Jobs
        </button>
        <button
          className={`btn btn-sm job-tab-btn ${activeTab === "referral" ? "active" : ""
            }`}
          onClick={() => setActiveTab("referral")}
        >
          {" "}
          Open for Referral
        </button>
      </div>

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
                  Openings
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
                  Description
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
                  Created
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
                  Due On
                </th>
                {/* {["hr", "admin"].includes(userRole) && (
                    <>  */}
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
                {/* </>
              )} */}
              </tr>
            </thead>
            <tbody>
              {" "}
              {currentJobs.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-4"
                    style={{ color: "#6c757d" }}
                  >
                    No jobs found.
                  </td>
                </tr>
              ) : (
                currentJobs.map((job) => (
                  // mahesh tr code
                  <tr
                    key={job._id}
                    style={{
                      cursor: isExpired(job.dueOn) ? "not-allowed" : "pointer",
                      backgroundColor: isExpired(job.dueOn) ? "#f5f5f5" : "",
                      opacity: isExpired(job.dueOn) ? 0.6 : 1,
                    }}
                    onClick={() => {
                      setApplicants([]);
                      setViewJob(job);
                      setActiveViewTab("details");
                      setShowViewPopup(true);
                      getApplicantsInfo(job._id);
                    }}
                  >
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        maxWidth: "200px",
                      }}
                    >
                      <div
                        style={{
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                        title={job.jobTitle}
                      >
                        {job.jobTitle.length > 50
                          ? job.jobTitle.substring(0, 50) + "..."
                          : job.jobTitle}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                      }}
                    >
                      {job.department}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        // borderBottom: "1px solid #dee2e6",
                        color: "#212529",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "100px",
                      }}
                    >
                      {job.location?.trim()}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        color: "#212529",
                        textAlign: "center",
                        width: "90px",
                      }}
                    >
                      {job.noOfOpenings}
                    </td>
                    {/* //Added by Samiksha */}

                    {/* mahesh code */}
                    <td
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        color: "#212529",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        maxWidth: "250px",
                      }}
                    >
                      <div
                        style={{
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {job.jobDescription
                          ? job.jobDescription.replace(/<[^>]+>/g, "").substring(0, 50) +
                            (job.jobDescription.length > 50 ? "..." : "")
                          : "-"}
                      </div>
                    </td>
                    {/* mahesh code */}
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                      }}
                    >
                      {formatDate(job.createdAt)}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        verticalAlign: "middle",
                        fontSize: "14px",
                        borderBottom: "1px solid #dee2e6",
                        whiteSpace: "nowrap",
                        color: "#212529",
                      }}
                    >
                      {formatDate(job.dueOn)}
                    </td>



                    <td>
                      {/* <button
                        className="btn btn-sm custom-outline-btn"
                        style={{ marginRight: "10px" }}
                        onClick={() => {
                          // console.log("VIEW CLICKED", job);
                          // setViewJob(job);
                          // getApplicantsInfo(job._id);
                          // setShowViewPopup(true);
                          setApplicants([]);
                          setViewJob(job);
                          setActiveViewTab("details");
                          setShowViewPopup(true);
                          getApplicantsInfo(job._id);
                        }}
                      >
                        View
                      </button> */}
                      {["hr", "admin"].includes(userRole) && (
                        <>

                          {/* added by rushikesh */}
                          <div className="d-flex flex-nowrap align-items-center gap-1">

                            <button
                              className="btn btn-sm custom-outline-btn"
                              style={{ minWidth: 135 }}
                              onClick={(e) => {
                                e.stopPropagation();
navigate(`/dashboard/${role}/${username}/${id}/job-candidates/${job._id}`);
                              }}
                            >
                              View Candidates
                            </button>

                            {/* mahesh code */}
                            <button
                              className="btn btn-sm custom-outline-btn"
                              disabled={isExpired(job.dueOn)}
                              style={{
                                opacity: isExpired(job.dueOn) ? 0.5 : 1,
                                cursor: isExpired(job.dueOn)
                                  ? "not-allowed"
                                  : "pointer",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isExpired(job.dueOn)) return;
                                handleEdit(job);
                              }}
                            >
                              Edit
                            </button>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              disabled={isExpired(job.dueOn)}
                              style={{
                                opacity: isExpired(job.dueOn) ? 0.5 : 1,
                                cursor: isExpired(job.dueOn)
                                  ? "not-allowed"
                                  : "pointer",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isExpired(job.dueOn)) return;
                                handleDelete(job._id);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
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
          {/* Rows per page */}
          <div className="d-flex align-items-center">
            <span
              style={{ fontSize: "14px", marginRight: "8px", color: "#212529" }}
            >
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

          {/* Range display */}
          <span
            style={{ fontSize: "14px", marginLeft: "16px", color: "#212529" }}
          >
            {filteredJobs.length === 0
              ? "0–0 of 0"
              : `${indexOfFirstItem + 1}-${indexOfLastItem} of ${filteredJobs.length
              }`}
          </span>

          {/* Arrows */}
          <div
            className="d-flex align-items-center"
            style={{ marginLeft: "16px" }}
          >
            <button
             className="btn btn-sm focus-ring"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ‹
            </button>
            <button
                 className="btn btn-sm focus-ring"

              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{ fontSize: "18px", padding: "2px 8px", color: "#212529" }}
            >
              ›
            </button>
          </div>
        </div>
      </nav>

      {/* //added by Mahesh*/}
      <div className="text-end mt-3">
        <button
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 90 }}
onClick={() => {
  if (activeTab === "referral") {
    setActiveTab("inhouse");
  } else {
    navigate(`/dashboard/${role}/${username}/${id}`); // 🔥 direct dashboard
  }
}}
        >
          Back
        </button>
      </div>

      {/* //added by Rushikesh */}
{showAddJob && (
  <div
    ref={modalRef}
    tabIndex="-1"
    className="modal fade show d-block"
    style={{ background: "#00000080" }}
  >
    <div className="modal-dialog modal-dialog-centered"
      style={{ width: "600px" }}
    >
      <div className="modal-content shadow-lg"
        // ref={modalRef}
        // tabIndex="-1"  rutuja
      >
        <div className="modal-header-custom">
          {editJobId ? "Edit Job" : "Add Job"}
          <button
            type="button"
            className="modal-close-btn"
            onClick={() => {
              setShowAddJob(false);
              setEditJobId(null);
            }}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSaveJob}>
            <h5 className="section-title">Basic Information</h5>
            
            {/* Job Title */}
            <div className="row align-items-center mb-3">
              <div className="col-12 col-md-4 fw-semibold">
                Job Title <span style={{ color: "red" }}>  *</span>
              </div>
              <div className="col-12 col-md-8">
                <input
                  type="text"
                  className={`form-control ${formErrors.jobTitle ? 'is-invalid' : ''}`}
                  value={newJob.jobTitle}
                  maxLength={50}
                  onChange={(e) =>
                    setNewJob({
                      ...newJob,
                      jobTitle: e.target.value,
                    })
                  }
                  placeholder="Enter Job Title"
                />
                {formErrors.jobTitle && (
                  <div className="invalid-feedback d-block">
                    {formErrors.jobTitle}
                  </div>
                )}
              </div>
            </div>

            {/* Department */}
            <div className="row align-items-center mb-3">
              <div className="col-12 col-md-4 fw-semibold">
                Department<span style={{ color: "red" }}>  *</span>
              </div>
              <div className="col-12 col-md-8">
                <select
                  className={`form-select ${formErrors.department ? 'is-invalid' : ''}`}
                  value={newJob.department}
                  onChange={(e) =>
                    setNewJob({
                      ...newJob,
                      department: e.target.value,
                    })
                  }
                >
                  <option value="">Select Department</option>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Sales">Sales</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                  <option value="Admin">Admin</option>
                </select>
                {formErrors.department && (
                  <div className="invalid-feedback d-block">
                    {formErrors.department}
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="row align-items-center mb-3">
              <div className="col-12 col-md-4 fw-semibold">Location<span style={{ color: "red" }}>  *</span></div>
              <div className="col-12 col-md-8">
                <input
                  className={`form-control ${formErrors.location ? 'is-invalid' : ''}`}
                  maxLength={50}
                  value={newJob.location}
                  onChange={(e) =>
                    setNewJob({ ...newJob, location: e.target.value })
                  }
                  placeholder="Enter Location"
                />
                {formErrors.location && (
                  <div className="invalid-feedback d-block">
                    {formErrors.location}
                  </div>
                )}
              </div>
            </div>

            {/* Hiring Type */}
            <div className="row align-items-center mb-3">
              <div className="col-12 col-md-4 fw-semibold">Hiring Type<span style={{ color: "red" }}>  *</span></div>
              <div className="col-12 col-md-8">
                <select
                  className={`form-select ${formErrors.hiringType ? 'is-invalid' : ''}`}
                  value={newJob.hiringType}
                  onChange={(e) =>
                    setNewJob({ ...newJob, hiringType: e.target.value })
                  }
                >
                  <option value="">Select Type</option>
                  <option>Full-Time</option>
                  <option>Contract</option>
                </select>
                {formErrors.hiringType && (
                  <div className="invalid-feedback d-block">
                    {formErrors.hiringType}
                  </div>
                )}
              </div>
            </div>

            {/* Job Type */}
            <div className="row align-items-center mb-3">
              <div className="col-12 col-md-4 fw-semibold">Job Type <span style={{ color: "red" }}>  *</span></div>
              <div className="col-12 col-md-8">
                <select
                  className={`form-select ${formErrors.jobType ? 'is-invalid' : ''}`}
                  value={newJob.jobType}
                  onChange={(e) =>
                    setNewJob({ ...newJob, jobType: e.target.value })
                  }
                >
                  <option value="">Select Job Type</option>
                  <option value="inhouse">In-House</option>
                  <option value="referral">Open for Referral</option>
                </select>
                {formErrors.jobType && (
                  <div className="invalid-feedback d-block">
                    {formErrors.jobType}
                  </div>
                )}
              </div>
            </div>

            {/* Openings */}
            <div className="row align-items-center mb-3">
              <div className="col-12 col-md-4 fw-semibold">No of Openings </div>
              <div className="col-12 col-md-8">
                <input
                  type="number"
                  className={`form-control ${formErrors.noOfOpenings ? 'is-invalid' : ''}`}
                  value={newJob.noOfOpenings}
                  min={1} 
                  max={100}
                  onChange={(e) =>
                    setNewJob({
                      ...newJob,
                      noOfOpenings: e.target.value,
                    })
                  }
                />
                {formErrors.noOfOpenings && (
                  <div className="invalid-feedback d-block">
                    {formErrors.noOfOpenings}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="row mb-3">
              <div className="col-12 col-md-4 fw-semibold">Job Description<span style={{ color: "red" }}>  *</span></div>
              <div className="col-12 col-md-8">
                <RichTextEditor
                  value={newJob.jobDescription}
                  onChange={(value) =>{
                    const plainText= value.replace(/<[^>]+>/g, "");
                    if (plainText.length<=300){
                      setNewJob((prev) => ({
                        ...prev,
                        jobDescription: value,
                      }))
                    }
                  }
                  }
                />
                <div
                  className="d-flex justify-content-between align-items-center mt-1"
                >
                  <small className="text-danger"style={{ marginTop: "0" }}>
                    {formErrors.jobDescription}
                  </small>

                  <small className="text-muted"style={{ marginTop: "-10px" }}>
                    {newJob.jobDescription.replace(/<[^>]+>/g, "").length}/300
                    characters
                  </small>
                </div>
                            
              </div>
            </div>

            <h5 className="section-title">CTC Details (₹)</h5>

            {/* Min CTC */}
            <div className="row mb-3">
              <div className="col-12 col-md-4 fw-semibold">Min CTC<span style={{ color: "red" }}>  *</span></div>
              <div className="col-12 col-md-8">
                <input
                  type="number"
                  className={`form-control ${formErrors.ctc ? 'is-invalid' : ''}`}
                  min={0} 
                  value={newJob.ctc?.min || ""}
                  onChange={(e) =>
                    setNewJob({
                      ...newJob,
                      ctc: {
                        ...newJob.ctc,
                        min: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>

            {/* Max CTC */}
            <div className="row align-items-center mb-3">
              <div className="col-12 col-md-4 fw-semibold">Max CTC<span style={{ color: "red" }}>  *</span></div>
              <div className="col-12 col-md-8">
                <input
                  type="number"
                  min={0} 
                  className={`form-control ${formErrors.ctc ? 'is-invalid' : ''}`}
                  value={newJob.ctc?.max || ""}
                  onChange={(e) =>
                    setNewJob({
                      ...newJob,
                      ctc: {
                        ...newJob.ctc,
                        max: e.target.value,
                      },
                    })
                  }
                />
                {formErrors.ctc && (
                  <div className="invalid-feedback d-block">
                    {formErrors.ctc}
                  </div>
                )}
              </div>
            </div>

            <h5 className="section-title">Experience & Skills</h5>

            {/* Min Experience */}
            <div className="row mb-3">
              <div className="col-12 col-md-4 fw-semibold">Min Experience(Yrs)<span style={{ color: "red" }}>  *</span></div>
              <div className="col-12 col-md-8">
                <input
                  type="number"
                  className={`form-control ${formErrors.experience ? 'is-invalid' : ''}`}
                  value={newJob.experience?.min || ""}
                  min={0} 
                  max={50}
                  onChange={(e) =>
                    setNewJob({
                      ...newJob,
                      experience: {
                        ...newJob.experience,
                        min: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>

            {/* Max Experience */}
            <div className="row mb-3">
              <div className="col-12 col-md-4 fw-semibold">Max Experience(Yrs)<span style={{ color: "red" }}> *</span></div>
              <div className="col-12 col-md-8">
                <input
                  type="number"
                  className={`form-control ${formErrors.experience ? 'is-invalid' : ''}`}
                  min={0} 
                  max={50}
                  value={newJob.experience?.max || ""}
                  onChange={(e) =>
                    setNewJob({
                      ...newJob,
                      experience: {
                        ...newJob.experience,
                        max: e.target.value,
                      },
                    })
                  }
                />
                {formErrors.experience && (
                  <div className="invalid-feedback d-block">
                    {formErrors.experience}
                  </div>
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="row align-items-center mb-3">
  <div className="col-12 col-md-4 fw-semibold">
    Important Skills <span style={{ color: "red" }}> *</span>
  </div>

  <div className="col-12 col-md-8">
    <input
      type="text"
      className={`form-control ${
        formErrors.importantSkills ? "is-invalid" : ""
      }`}
      maxLength={100}
      value={newJob.importantSkills || ""}
      onChange={(e) => {
        setNewJob((prev) => ({
          ...prev,
          importantSkills: e.target.value,
        }));
      }}
      placeholder="Enter skills separated by commas"
    />

    {formErrors.importantSkills && (
      <div className="invalid-feedback d-block">
        {formErrors.importantSkills}
      </div>
    )}
  </div>
</div>

            {/* Due Date */}
            <div className="row align-items-center mb-3">
              <div className="col-12 col-md-4 fw-semibold">Due On <span style={{ color: "red" }}>  *</span></div>
              <div className="col-12 col-md-8">
                <input
                  type="date"
                  className={`form-control ${formErrors.dueOn ? 'is-invalid' : ''}`}
                  value={newJob.dueOn || ""}
                  onChange={(e) =>
                    setNewJob({ ...newJob, dueOn: e.target.value })
                  }
                />
                {formErrors.dueOn && (
                  <div className="invalid-feedback d-block">
                    {formErrors.dueOn}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-sm custom-outline-btn "
                style={{ minWidth: 90 }}
                onClick={() => {
                  setShowAddJob(false);
                  setEditJobId(null);
                }}
              >
                Cancel
              </button>
              <button
              type="submit"
              className="btn btn-sm custom-outline-btn"
              style={{minWidth: "90px"}}
              disabled={saving}
            >
              {saving ? "Saving..." : editJobId ? "Save Changes" : "Save"}
            </button>

             
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
)}



      {showViewPopup && viewJob && (
        <div
          className="modal fade show"
          ref={modalRef}
          tabIndex="-1"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            style={{ width: "600px" }}          >
            <div className="modal-content">
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                    <h5
                      className="modal-title mb-0"
                      style={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      {viewJob.jobTitle}
                    </h5>                
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowViewPopup(false)}
                ></button>
              </div>
            {
              isExpired(viewJob?.dueOn) && (
                <div className="closed-watermark">
                  APPLICATION CLOSED
                </div>
              )}


              <h5 className="section-title" style={{ marginLeft: 15 }}>Job Details</h5>

              <div className="modal-body">

                <div>

                  <div className="row mb-2">
                    <div className="col-3 fw-semibold">Job ID</div>
                    <div className="col-9">{viewJob._id?.slice(-4)}</div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-3 fw-semibold">Location</div>
                    <div className="col-9" style={{
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}>{viewJob.location}</div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-3 fw-semibold">Department</div>
                    <div className="col-9">{viewJob.department}</div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-3 fw-semibold">Job Type</div>
                    <div className="col-9">{viewJob.hiringType}</div>
                  </div>

                  <div className="row mb-2">
                    <div className="col-3 fw-semibold">Experience</div>
                    <div className="col-9">
                      {viewJob.experience?.min} – {viewJob.experience?.max} Years
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-3 fw-semibold">Posted</div>
                    <div className="col-9">{formatDate(viewJob.createdAt)}</div>
                  </div>

                  {/* Key Skills */}
                  <div className="row mb-2">
                    <div className="col-3 fw-semibold">Key Skills</div>
                    <div className="col-9" style={{
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                          }}>
                      <ul className="mb-0 list-unstyled ps-0">
                        {viewJob.importantSkills?.map((skill, i) => (
                          <li key={i} style={{ marginBottom: "2px" }}>
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Other Skills */}
                  {viewJob.otherSkills?.length > 0 && (
                    <div className="row mb-2">
                      <div className="col-3 fw-semibold">Other Skills</div>
                      <div className="col-9">
                        <ul className="mb-0 list-unstyled ps-0">
                          {viewJob.otherSkills.map((skill, i) => (
                            <li key={i} style={{ marginBottom: "2px" }}>
                              {skill}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="row mb-2">
                    <div className="col-3 fw-semibold">Description</div>
                    <div className="col-9" style={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                      }}>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: viewJob.jobDescription,
                        }}
                      />
                    </div>
                  </div>

                </div>


              </div>

             {/* // snehal code              */}
              <div className="modal-footer">
              
  <button
    className="btn btn-sm custom-outline-btn"
    style={{minWidth:90}}
    onClick={() => {
      setShowViewPopup(false);
      setViewJob(null); //rutuja
    }}
    
  >
    Close
  </button>

  {isExpired(viewJob?.dueOn) && (
    <button
      className="btn btn-sm custom-outline-btn"
      style={{minWidth:90}}
      onClick={() => handleRepost(viewJob)}
    >
      Repost
    </button>
  )}

</div>
 {/* // snehal code              */}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminCareer;