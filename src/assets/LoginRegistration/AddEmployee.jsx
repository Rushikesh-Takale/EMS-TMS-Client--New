import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./AddEmployee.css";

const AddEmployee = () => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    employeeId: "",
    gender: "Male",
    dob: "",
    maritalStatus: "Single",
    designation: "",
    department: "",
    salary: "",
    salaryType: "monthly",
    role: "employee",
    doj: "",
    currentAddress: {
      street: "",
      city: "",
      state: "",
      zip: "",
    },
    permanentAddress: {
      street: "",
      city: "",
      state: "",
      zip: "",
    },

    bankDetails: {
      accountNumber: "",
      bankName: "",
      ifsc: "",
    },
    pfNumber: "",
    uanNumber: "",
  });
  const [sameAddress, setSameAddress] = useState(false);

const handleSameAddress = (e) => {
  const checked = e.target.checked;
  setSameAddress(checked);

  if (checked) {
    setFormData((prev) => ({
      ...prev,
      permanentAddress: { ...prev.currentAddress },
    }));
  } else {
    setFormData((prev) => ({
      ...prev,
      permanentAddress: {
        street: "",
        city: "",
        state: "",
        zip: "",
      },
    }));
  }
};
  const modalRef = useRef(null);
 const scrollRef = useRef(null);
  const [files, setFiles] = useState({
    image: null,
    panCardPdf: null,
    aadharCardPdf: null,
    appointmentLetter: null,
    passbookPdf: null,
    certificatePdf: null,
  });

  //Add validation function - adesh
  // const validateField = (name, value) => {
  //   let error = "";

  //   switch (name) {

  //     case "name":
  //       if (!/^[A-Za-z\s]+$/.test(value)) error = "Name must contain only letters and spaces.";
  //       else if (value.trim() === "") error = "Name is required.";
  //       break;

  //     case "email":
  //       if (!/^[a-zA-Z0-9._%+-]+@(gmail\.com|creativewebsolution\.in)$/.test(value))
  //         error = "Please enter a valid email address.";
  //       break;

  //     case "contact":
  //       if (!/^\d{10}$/.test(value)) error = "Contact number must be exactly 10 digits.";
  //       break;

  //     case "salary":
  //       if (value <= 0) error = "Salary must be greater than 0.";
  //       break;

  //     case "dob":
  //       const minDate = new Date();
  //       minDate.setFullYear(minDate.getFullYear() - 18);
  //       if (new Date(value) > minDate)
  //         error = "Employee must be at least 18 years old.";
  //       break;

  //     case "designation":
  //       if (value.trim() === "") error = "Designation is required.";
  //       break;

  //     case "department":
  //       if (value.trim() === "") error = "Department is required.";
  //       break;

  //     default:
  //       break;
  //   }

  //   setErrors((prev) => ({ ...prev, [name]: error }));

  //   return error;
  // }

  useEffect(() => {
    if (!showModal || !modalRef.current) return;

    const modal = modalRef.current;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    // ⭐ modal open होताच focus
    modal.focus();

    const handleKeyDown = (e) => {
      // ESC key → modal close
      if (e.key === "Escape") {
        e.preventDefault();
        setShowModal(null);
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
  }, [showModal]);
  useEffect(() => {
    const isModalOpen = showModal;

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
  }, [showModal]);
const validateField = (name, value) => {
  let error = "";

  switch (name) {
 case "name":
  if (!value.trim()) {
    error = "Name is required.";
  } else if (value.trim().length < 3) {
    error = "Name must be at least 3 characters.";
  } else if (value.trim().length > 50) {
    error = "Name cannot exceed 50 characters.";
  } else if (!/^[A-Za-z\s]+$/.test(value.trim())) {
    error = "Name must contain only letters and spaces.";
  }
  break;

    case "email":
      if (!value.trim()) {
        error = "Email is required.";
      } else if (
        !/^[a-zA-Z0-9._%+-]+@(gmail\.com|creativewebsolution\.in)$/.test(
          value.trim(),
        )
      ) {
        error = "Please enter a valid email address.";
      }
      break;

    case "contact":
      if (!value.trim()) {
        error = "Contact number is required.";
      } else if (!/^\d{10}$/.test(value.trim())) {
        error = "Contact number must be exactly 10 digits.";
      }
      break;

   case "employeeId":
  if (!value.trim()) {
    error = "Employee ID is required.";
  } else if (value.trim().length > 20) {
    error = "Employee ID cannot exceed 20 characters.";
  }
  break;

    case "salary":
      if (!value) {
        error = "Salary is required.";
      } else if (Number(value) <= 0) {
        error = "Salary must be greater than 0.";
      }
      break;
      case "joiningDate":
  if (!value) {
    error = "Date of Joining is required.";
  } else {
    const selectedDate = new Date(value);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      error = "Future joining date is not allowed.";
    }
  }
  break;

    case "dob":
      if (!value) {
        error = "Date of birth is required.";
      } else {
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 18);

        if (new Date(value) > minDate) {
          error = "Employee must be at least 18 years old.";
        }
      }
      break;

  case "designation":
  if (!value.trim()) {
    error = "Designation is required.";
  } else if (value.trim().length > 50) {
    error = "Designation cannot exceed 50 characters.";
  }
  break;

   case "department":
  if (!value.trim()) {
    error = "Department is required.";
  } else if (value.trim().length > 30) {
    error = "Department cannot exceed 30 characters.";
  }
  break;
case "pfNumber":
  if (!value.trim()) {
    error = "PF Number is required.";
  } else if (!/^[A-Za-z0-9]{22}$/.test(value.trim())) {
    error = "PF Number must be 22 character alphanumeric.";
  }
  break;

    case "uanNumber":
      if (value.trim() && !/^\d{12}$/.test(value.trim())) {
        error = "UAN Number must be exactly 12 digits.";
      }
      break;

    default:
      break;
  }

  setErrors((prev) => ({ ...prev, [name]: error }));
  return error;
};

const validateBankField = (name, value) => {
  let error = "";

  switch (name) {
case "bankName":
  if (!value.trim()) {
    error = "Bank name is required.";
  } else if (value.trim().length > 50) {
    error = "Bank name cannot exceed 50 characters.";
  } else if (!/^[A-Za-z\s]+$/.test(value.trim())) {
    error = "Bank name must contain only letters and spaces.";
  }
  break;

    case "accountNumber":
      if (!value.trim()) {
        error = "Account number is required.";
      } else if (!/^\d+$/.test(value.trim())) {
        error = "Account number must contain only digits.";
      }
      break;

    case "ifsc":
      if (!value.trim()) {
        error = "IFSC code is required.";
      } else if (
        !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.trim().toUpperCase())
      ) {
        error = "Please enter a valid IFSC code.";
      }
      break;

    default:
      break;
  }

  setErrors((prev) => {
    const next = { ...prev };
    const key = `bankDetails.${name}`;

    if (error) next[key] = error;
    else delete next[key];

    return next;
  });

  return error;
};
const validateAddressField = (addressKey, name, value) => {
  let error = "";

  switch (name) {
 case "street":
  if (!value.trim()) {
    error = "Street is required.";
  } else if (value.trim().length < 3) {
    error = "Street looks too short.";
  } else if (value.trim().length > 100) {
    error = "Street cannot exceed 100 characters.";
  }
  break;

case "city":
  if (!value.trim()) {
    error = "City is required.";
  } else if (value.trim().length > 30) {
    error = "City cannot exceed 30 characters.";
  } else if (!/^[A-Za-z\s]+$/.test(value.trim())) {
    error = "City must contain only letters and spaces.";
  }
  break;

   case "state":
  if (!value.trim()) {
    error = "State is required.";
  } else if (value.trim().length > 30) {
    error = "State cannot exceed 30 characters.";
  } else if (!/^[A-Za-z\s]+$/.test(value.trim())) {
    error = "State must contain only letters and spaces.";
  }
  break;

    case "zip":
      if (!value.trim()) {
        error = "PIN is required.";
      } else if (!/^\d{6}$/.test(value.trim())) {
        error = "PIN must be exactly 6 digits.";
      }
      break;

    default:
      break;
  }

  const key = `${addressKey}.${name}`;

  setErrors((prev) => {
    const next = { ...prev };

    if (error) next[key] = error;
    else delete next[key];

    return next;
  });

  return error;
};

  const handleChange = (e) => {
    const { name: fieldName, value } = e.target;

    if (fieldName.startsWith("bankDetails.")) {
      const key = fieldName.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        bankDetails: { ...prev.bankDetails, [key]: value },
      }));
      validateBankField(key, value);
 } else if (
  fieldName.startsWith("currentAddress.") ||
  fieldName.startsWith("permanentAddress.")
) {
  const [addressKey, key] = fieldName.split(".");

  setFormData((prev) => {
    const updatedData = {
      ...prev,
      [addressKey]: {
        ...prev[addressKey],
        [key]: value,
      },
    };

  
    if (sameAddress && addressKey === "currentAddress") {
      updatedData.permanentAddress = {
        ...updatedData.currentAddress,
      };
    }

    return updatedData;
  });

  validateAddressField(addressKey, key, value);

    } else {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));
      validateField(fieldName, value);
    }
  };

const handleFileChange = (e) => {
  const { name, files: selectedFiles } = e.target;
  const file = selectedFiles[0];
  let error = "";

  const maxFileSize = 5 * 1024 * 1024; // 5MB

  if (!file) {
    error = "This file is required.";
  } else {
    const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg"];
    const allowedDocTypes = [...allowedImageTypes, "application/pdf"];

    if (file.size > maxFileSize) {
      error = "File size must be less than 5MB.";
    } else if (name === "image") {
      if (!allowedImageTypes.includes(file.type)) {
        error = "Profile image must be JPG or PNG format.";
      }
    } else {
      if (!allowedDocTypes.includes(file.type)) {
        error = "Only PDF or image formats are allowed.";
      }
    }
  }

  setErrors((prev) => ({ ...prev, [name]: error }));

  if (!error) {
    setFiles((prev) => ({ ...prev, [name]: file }));
  } else {
    setFiles((prev) => ({ ...prev, [name]: null }));
  }
};

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    if (!formData.email) newErrors.email = "Email is required.";
    if (!/^\d{10}$/.test(formData.contact))
      newErrors.contact = "Contact must be 10 digits.";
    if (!formData.employeeId) newErrors.employeeId = "Employee ID is required.";
    if (!formData.salary || formData.salary <= 0)
      newErrors.salary = "Salary must be greater than 0.";
    if (!formData.dob) newErrors.dob = "Date of birth is required.";
    if (!formData.designation.trim())
      newErrors.designation = "Designation is required.";
    if (!formData.department.trim())
      newErrors.department = "Department is required.";

    // if (!formData.pfNumber) newErrors.pfNumber = "PF Number is required.";
    // if (!formData.uanNumber) newErrors.uanNumber = "UAN Number is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const validateStep = () => {
  let newErrors = {};

  if (step === 1) {
    const step1Fields = [
      "name",
      "email",
      "contact",
      "employeeId",
      "dob",
      "designation",
      "department",
      "salary",
    ];

    step1Fields.forEach((field) => {
      const value = formData[field];
      const error = validateField(field, value);

      if (error) {
        newErrors[field] = error;
      }
    });
  }

  if (step === 2) {
    Object.entries(formData.currentAddress).forEach(([key, value]) => {
      const error = validateAddressField(
        "currentAddress",
        key,
        value
      );

      if (error) {
        newErrors[`currentAddress.${key}`] = error;
      }
    });

    if (!sameAddress) {
      Object.entries(formData.permanentAddress).forEach(([key, value]) => {
        const error = validateAddressField(
          "permanentAddress",
          key,
          value
        );

        if (error) {
          newErrors[`permanentAddress.${key}`] = error;
        }
      });
    }
  }

  if (step === 3) {
    ["bankName", "accountNumber", "ifsc"].forEach((field) => {
      const error = validateBankField(
        field,
        formData.bankDetails[field]
      );

      if (error) {
        newErrors[`bankDetails.${field}`] = error;
      }
    });

    const pfError = validateField("pfNumber", formData.pfNumber);
    if (pfError) {
      newErrors.pfNumber = pfError;
    }

    const uanError = validateField("uanNumber", formData.uanNumber);
    if (uanError) {
      newErrors.uanNumber = uanError;
    }
  }

  setErrors((prev) => ({
    ...prev,
    ...newErrors,
  }));

  return Object.keys(newErrors).length === 0;
};

const handleNext = () => {
  const isValid = validateStep();

  if (!isValid) return;

  setStep((prev) => prev + 1);

  setTimeout(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, 50);
};
const handleBack = () => {
  setStep((prev) => prev - 1);

  setTimeout(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, 50);
};

  const handleSubmit = async (e) => {
    e.preventDefault();
      if (loading) return;
    const newErrors = gatherAllErrors();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const lines = Object.entries(newErrors).map(([key, msg]) => {
        const label = FIELD_LABELS[key] || key;
        return `• ${label}: ${msg}`;
      });

      window.alert(["Please fix the following errors:", ...lines].join("\n"));

      const firstKey = Object.keys(newErrors)[0];
      const el = document.querySelector(`[name="${firstKey}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }

      setLoading(false);
      return;
    }

    const isValid = validateForm();
    validateBankField("accountNumber", formData.bankDetails.accountNumber);
    validateBankField("ifsc", formData.bankDetails.ifsc);
    validateBankField("bankName", formData.bankDetails.bankName);

    Object.entries(formData.currentAddress).forEach(([field, value]) => {
      validateAddressField("currentAddress", field, value);
    });

    Object.entries(formData.permanentAddress).forEach(([field, value]) => {
      validateAddressField("permanentAddress", field, value);
    });

    const allErrors = { ...errors };

    if (!isValid || Object.keys(allErrors).length > 0) {
      const firstErrorField = Object.keys(allErrors)[0];
      if (firstErrorField) {
        const el = document.querySelector(`[name="${firstErrorField}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus();
        }
      }
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = new FormData();

      // Append text fields
      Object.keys(formData).forEach((key) => {
        if (typeof formData[key] === "object") {
          payload.append(key, JSON.stringify(formData[key]));
        } else {
          payload.append(key, formData[key]);
        }
      });

      // Append files
      Object.keys(files).forEach((key) => {
        if (files[key]) payload.append(key, files[key]);
      });

      const res = await axios.post(
        "http://localhost:8000/admin/add-employee",
        payload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      // ✅ Show success alert after submission
      alert(res.data.message || "Employee added and email sent successfully!");

      // ✅ Update message for UI
      setMessage(res.data.message);
      // setMessage(res.data.message);
      setFormData({
        name: "",
        email: "",
        contact: "",
        employeeId: "",
        gender: "Male",
        dob: "",
        maritalStatus: "Single",
        designation: "",
        department: "",
        salary: "",
        role: "employee",
        doj: "",
        currentAddress: { street: "", city: "", state: "", zip: "" },
        permanentAddress: { street: "", city: "", state: "", zip: "" },
        bankDetails: { accountNumber: "", bankName: "", ifsc: "" },
      });
      setFiles({
        image: null,
        panCardPdf: null,
        aadharCardPdf: null,
        appointmentLetter: null,
        passbookPdf: null,
        certificatePdf: null,
      });
    }catch (err) {
  console.log("Add Employee Error:", err.response?.data || err);

  const errorMessage =
    err.response?.data?.message ||
    err.response?.data?.error ||
    "Failed to add employee";

  setMessage(errorMessage);

  alert(errorMessage);

    } finally {
      setLoading(false);
    }
  };

  const FIELD_LABELS = {
    name: "Name",
    email: "Email",
    contact: "Contact",
    employeeId: "Employee ID",
    salary: "Salary",
    dob: "Date of Birth",
    designation: "Designation",
    department: "Department",
    "bankDetails.bankName": "Bank Name",
    "bankDetails.accountNumber": "Account Number",
    "bankDetails.ifsc": "IFSC Code",
    "currentAddress.street": "Current Street",
    "currentAddress.city": "Current City",
    "currentAddress.state": "Current State",
    "currentAddress.zip": "Current PIN",
    "permanentAddress.street": "Permanent Street",
    "permanentAddress.city": "Permanent City",
    "permanentAddress.state": "Permanent State",
    "permanentAddress.zip": "Permanent PIN",
  };

  function gatherAllErrors() {
    const newErrors = {};

    // top-level fields
    const topFields = [
      "name",
      "email",
      "contact",
      "employeeId",
      "salary",
      "dob",
      "designation",
      "department",
    ];
    topFields.forEach((k) => {
      const v = formData?.[k] ?? "";
      // use field validator when we have rules
      if (
        [
          "name",
          "email",
          "contact",
          "salary",
          "dob",
          "designation",
          "department",
        ].includes(k)
      ) {
        const msg = validateField(k, v);
        if (msg) newErrors[k] = msg;
      } else {
        if (!v) newErrors[k] = `${FIELD_LABELS[k] || k} is required.`;
      }
    });

    // bank
    const b = formData.bankDetails || {};
    [
      ["bankName", b.bankName],
      ["accountNumber", b.accountNumber],
      ["ifsc", b.ifsc],
    ].forEach(([k, v]) => {
      const msg = validateBankField(k, v);
      if (msg) newErrors[`bankDetails.${k}`] = msg;
    });

    // addresses
    const addGroup = (addrKey, obj = {}) => {
      Object.entries(obj).forEach(([k, v]) => {
        const msg = validateAddressField(addrKey, k, v);
        if (msg) newErrors[`${addrKey}.${k}`] = msg;
      });
    };
    addGroup("currentAddress", formData.currentAddress);
    addGroup("permanentAddress", formData.permanentAddress);

    return newErrors;
  }

  return (
    <>
      <button
        className="btn btn-sm custom-outline-btn"
        style={{ minWidth: 90 }}
        onClick={() => setShowModal(true)}
      >
        Add Employee
      </button>
{showModal && (
  <div
    className="modal fade show"
    tabIndex="-1"
    ref={modalRef}
    style={{
      display: "block",
      backgroundColor: "rgba(0,0,0,0.5)",
      zIndex: 999,
      padding: "10px",
    }}
  >
    <div
className="modal-dialog modal-lg"
    style={{
  maxWidth: "700px",
  width: "100%",
  margin: "90px auto 20px auto",
}}
    >
  <div

  className="modal-content"
  style={{
    maxHeight: "90vh",
    overflowY: "auto",
  }}
>
              <div className="custom-modal-header">
                <span className="custom-modal-title">Add Employee</span>
               <button
                  type="button" 
                  className="btn-close btn-close-white"
                  aria-label="Close"  //Added Jayshree
                  onClick={() => {
                    setShowModal(false);
                    setMessage("");
                    setErrors({});
                    setFormData(initialFormData);
                    setFiles(initialFiles);
                  }}
                >
                </button>
              </div>
              {message && (
                <p
                  className={`mb-3 text-center fw-medium ${
                    message.includes("successfully")
                      ? "text-success"
                      : "text-danger"
                  }`}
                >
                  {message}
                </p>
              )}

              <div className="custom-modal-body" ref={scrollRef}>
                <form className="formModel" onSubmit={handleSubmit}>
                  {/* Step 1: Personal Details */}
                  {step === 1 && (
                    <>
                      <h5 className="mb-3">Personal Details</h5>
                      <div className="row mb-4 ">
                        <div className="col-md-6 mb-0">
                          <label>Name:</label>
                          <input
                            type="text"
                            className="form-control"
                            name="name"
                            value={formData.name}
                            maxLength={50}
                            //onChange={handleChange}
                            onChange={handleChange}
                          />
                          {errors.name && (
                            <small className="text-danger">{errors.name}</small>
                          )}
                        </div>
                        <div className="col-md-6 mb-0">
                          <label>Email:</label>
                          <input
                            type="email"
                            className="form-control"
                            name="email"
                            value={formData.email}
                            maxLength={30}
                            onChange={handleChange}
                            required
                          />
                          {errors.email && (
                            <small className="text-danger">
                              {errors.email}
                            </small>
                          )}
                        </div>
                        <div className="col-md-6 mb-0">
                          <label>Contact:</label>
                          <input
                            type="text"
                            className="form-control"
                            name="contact"
                            value={formData.contact}
                            // onChange={handleChange}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Allow only digits
                              if (/^\d*$/.test(value)) {
                                handleChange(e);
                              }
                            }}
                            required
                            maxLength="10"
                          />
                          {errors.contact && (
                            <small className="text-danger">
                              {errors.contact}
                            </small>
                          )}
                        </div>
                        <div className="col-md-6 mb-0">
                          <label>Employee ID:</label>
                          <input
                            type="text"
                            className="form-control"
                            maxLength={20}
                            name="employeeId"
                            value={formData.employeeId}
                            onChange={handleChange}
                            required
                          />
                          {errors.employeeId && (
                            <small className="text-danger">
                              {errors.employeeId}
                            </small>
                          )}
                        </div>
                        <div className="col-md-6 mb-0">
                          <label>Gender:</label>
                          <select
                            className="form-select"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                          >
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div className="col-md-6 mb-0">
                          <label>Date of Birth:</label>
                          <input
                            type="date"
                            className="form-control"
                            name="dob"
                            value={formData.dob}
                            onChange={handleChange}
                            max={
                              new Date(
                                new Date().setFullYear(
                                  new Date().getFullYear() - 18,
                                ),
                              )
                                .toISOString()
                                .split("T")[0]
                            } // 👈 disables underage dates
                          />
                          {errors.dob && (
                            <small className="text-danger">{errors.dob}</small>
                          )}
                        </div>
                        <div className="col-md-6 mb-0">
                          <label>Marital Status:</label>
                          <select
                            className="form-select"
                            name="maritalStatus"
                            value={formData.maritalStatus}
                            onChange={handleChange}
                          >
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                          </select>
                        </div>
                        <div className="col-md-6 mb-0">
                          <label>Designation:</label>
                          <input
                            type="text"
                            className="form-control"
                            name="designation"
                            maxLength={50}
                            value={formData.designation}
                            onChange={handleChange}
                            required
                          />
                          {errors.designation && (
                            <small className="text-danger">
                              {errors.designation}
                            </small>
                          )}
                        </div>
                     <div className="col-md-6 mb-0">
  <label>Department:</label>

  <select
    className="form-select"
    name="department"
    maxLength={30}
    value={formData.department}
    onChange={handleChange}
    required
  >
    <option value="">Select Department</option>
    <option value="HR">HR</option>
    <option value="IT">IT</option>
    <option value="Finance">Finance</option>
    <option value="Sales">QA</option>
    <option value="Marketing">Marketing</option>
    <option value="Operations">Operations</option>
    <option value="Admin">Admin</option>
    <option value="Support">Support</option>
  </select>

  {errors.department && (
    <small className="text-danger">
      {errors.department}
    </small>
  )}
</div>

                        <div className="col-md-6 mb-0">
                          <label>Role:</label>
                          <select
                            className="form-select"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                          >
                            <option value="employee">Employee</option>
                            <option value="admin">Admin</option>
                            <option value="hr">HR</option>
                            <option value="manager">Manager</option>
                            <option value="ceo">CEO</option>
                            <option value="md">MD</option>
                            <option value ="Team_Leader">Team_Leader</option>
                            <option value="IT_Support">IT_Support</option>
                          </select>
                        </div>

                        <div className="col-md-6 mb-0">
                          {/* <div className="mb-3">
                            <label>Salary (in ₹/year):</label>
                            <input type="number" className="form-control" name="salary" value={formData.salary} onChange={handleChange}
                              min="1"
                              step="1"
                              required

                            />
                            {errors.salary && <small className="text-danger">{errors.salary}</small>}
                          </div> */}
                          {/* <div className="mb-3">
  <label>Salary:</label>
  <div className="input-group">
    <span className="input-group-text">₹</span>
    <input
      type="number"
      className="form-control"
      name="salary"
      value={formData.salary}
      onChange={handleChange}
      min="1"
      step="1"
      placeholder="Enter salary amount"
      required
    />
    <select
      className="form-select"
      name="salaryType"
      maxWidth="100"
      value={formData.salaryType || "monthly"}
      onChange={handleChange}
    >
      <option value="monthly">Per Month</option>
      <option value="yearly">Per Year</option>
    </select>
  </div>
  {errors.salary && (
    <small className="text-danger">{errors.salary}</small>
  )}
</div> */}

                          {/* <div className="mb-3 salary-field">
                            <label className="form-label salary-label">Salary:</label>
                            <div className="input-group salary-input-group">
                              <span className="input-group-text">₹</span>
                              <input
                                type="number"
                                //className="form-control salary-input"
                                className="input-group-text"
                                name="salary"
                                value={formData.salary}
                                onChange={handleChange}
                                min="1"
                                step="1"
                                placeholder="Enter salary amount"
                                required
                              />
                              <select
                                className="input-group-text"
                                name="salaryType"
                                value={formData.salaryType || "monthly"}
                                onChange={handleChange}
                              >
                                <option value="monthly">Per Month</option>
                                <option value="yearly">Per Year</option>
                              </select>
                            </div>
                            {errors.salary && (
                              <small className="text-danger salary-error">{errors.salary}</small>
                            )}
                          </div> */}

  <div className="col-md-6 mb-0">
                          <label>Salary:</label>
                           </div>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: "1px solid #ced4da",
          borderRadius: "6px",
          overflow: "hidden",
          flex: 1,
          height: "39px",
          minWidth: 0,
        }}
      >
        <span
          style={{
            width: "50px",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8f9fa",
            fontWeight: "600",
            borderRight: "1px solid #ced4da",
            flexShrink: 0,
          }}
        >
          ₹
        </span>

        <input
          type="number"
          className="form-control"
          name="salary"
          value={formData.salary}
          onChange={handleChange}
          min="20"
          step="20"
          placeholder="Enter salary amount"
          required
          style={{
            border: "none",
            boxShadow: "none",
            height: "100%",
            flex: 1,
            minWidth: 0,
          }}
        />
      </div>

      <select
        className="form-select"
        name="salaryType"
        value={formData.salaryType || "monthly"}
        onChange={handleChange}
        style={{
          width: "122px",
          minWidth: "120px",
          height: "39px",
          flexShrink: 0,
        }}
      >
        <option value="monthly">Per Month</option>
        <option value="yearly">Per Year</option>
      </select>
    </div>

    {errors.salary && (
      <small className="text-danger">{errors.salary}</small>
    )}
  

                        </div>
                        <div className="col-md-6 mb-0">
                          <label>Date of Joining:</label>
                          <input
                            type="date"
                            className="form-control"
                            name="doj"
                            value={formData.doj}
                            onChange={handleChange}
                              max={new Date().toISOString().split("T")[0]}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 2: Address */}
                  {step === 2 && (
                    <>
                      <h5 className="mb-3"> Current Address</h5>

                      <div className="mb-4">
                        <div className="row less-gap">
                          <div className="col-md-6 mb-0">
                            <label>Street:</label>
                            <input
                              type="text"
                              className="form-control"
                              maxLength={50}
                              name="currentAddress.street"
                              value={formData.currentAddress.street}
                              onChange={handleChange}
                            />
                            {errors["currentAddress.street"] && (
                              <small className="text-danger">
                                {errors["currentAddress.street"]}
                              </small>
                            )}
                          </div>
                          <div className="col-md-6 mb-0">
                            <label>City:</label>
                            <input
                              type="text"
                              maxLength={30}
                              className="form-control"
                              name="currentAddress.city"
                              value={formData.currentAddress.city}
                              onChange={handleChange}
                            />
                            {errors["currentAddress.city"] && (
                              <small className="text-danger">
                                {errors["currentAddress.city"]}
                              </small>
                            )}
                          </div>
                          <div className="col-md-6 mb-0">
                            <label>State:</label>
                            <input
                              type="text"
                              className="form-control"
                              maxLength={30}
                              name="currentAddress.state"
                              value={formData.currentAddress.state}
                              onChange={handleChange}
                            />
                            {errors["currentAddress.state"] && (
                              <small className="text-danger">
                                {errors["currentAddress.state"]}
                              </small>
                            )}
                          </div>
                          <div className="col-md-6 mb-0">
                            <label>ZIP:</label>
                            <input
                              type="text"
                              className="form-control"
                              name="currentAddress.zip"
                              value={formData.currentAddress.zip}
                              // onChange={handleChange}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow only numbers and limit to 6 digits
                                if (/^\d{0,6}$/.test(value)) {
                                  handleChange(e);
                                }
                              }}
                            />
                            {errors["currentAddress.zip"] && (
                              <small className="text-danger">
                                {errors["currentAddress.zip"]}
                              </small>
                            )}
                          </div>
                        </div>
                      </div>

                    <h5 className="mb-3">Permanent Address</h5>

<div className="mb-2">
  <div className="form-check">
    <input
      className="form-check-input"
      type="checkbox"
      id="sameAddress"
      checked={sameAddress}
      onChange={handleSameAddress}
    />
    <label className="form-check-label" htmlFor="sameAddress">
      Same as Current Address
    </label>
  </div>
</div>
                      <div className="mb-4" style={{ marginbo: "-30px" }}>
                        <div className="row mb-3">
                          <div className="col-md-6 mb-0">
                            <label>Street:</label>
                         <input
  type="text"
  className="form-control"
  maxLength={100}
  name="permanentAddress.street"
  value={formData.permanentAddress.street}
  onChange={handleChange}
  disabled={sameAddress}
/>
                            {errors["permanentAddress.street"] && (
                              <small className="text-danger">
                                {errors["permanentAddress.street"]}
                              </small>
                            )}
                          </div>
                          <div className="col-md-6 mb-0">
                            <label>City:</label>
                            <input
                              type="text"
                              className="form-control"
                              name="permanentAddress.city"
                              maxLength={30}
                              value={formData.permanentAddress.city}
                              onChange={handleChange}
                               disabled={sameAddress}
                            />
                            {errors["permanentAddress.city"] && (
                              <small className="text-danger">
                                {errors["permanentAddress.city"]}
                              </small>
                            )}
                          </div>
                          <div className="col-md-6 mb-0">
                            <label>State:</label>
                            <input
                              type="text"
                              className="form-control"
                              name="permanentAddress.state"
                              maxLength={30}
                              value={formData.permanentAddress.state}
                              onChange={handleChange}
                               disabled={sameAddress}
                            />

                            {errors["permanentAddress.state"] && (
                              <small className="text-danger">
                                {errors["permanentAddress.state"]}
                              </small>
                            )}
                          </div>
                          <div className="col-md-6 mb-0">
                            <label>ZIP:</label>
                            <input
                              type="text"
                              className="form-control"
                              name="permanentAddress.zip"
                              value={formData.permanentAddress.zip}
                              // onChange={handleChange}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow only numbers and limit to 6 digits
                                if (/^\d{0,6}$/.test(value)) {
                                  handleChange(e);
                                }
                              }}
                               disabled={sameAddress}
                            />
                            {errors["permanentAddress.zip"] && (
                              <small className="text-danger">
                                {errors["permanentAddress.zip"]}
                              </small>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 3: Bank + Files */}
                  {step === 3 && (
                    <>
                      <h5 className="mb-3">Bank Details</h5>
                      <div className="row less-gap">
                        {/* Account Number */}
                        <div className="col-md-6 mb-0">
                          <label className="form-label">Account Number:</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Account Number"
                            name="bankDetails.accountNumber"
                            value={formData.bankDetails.accountNumber}
                            onChange={handleChange}
                          />
                          {errors["bankDetails.accountNumber"] && (
                            <small className="text-danger">
                              {errors["bankDetails.accountNumber"]}
                            </small>
                          )}
                        </div>

                        {/* Bank Name */}
                        <div className="col-md-6 mb-0">
                          <label className="form-label">Bank Name:</label>
                          <input
                            type="text"
                            className="form-control"
                            maxLength={50}
                            placeholder="Bank Name"
                            name="bankDetails.bankName"
                            value={formData.bankDetails.bankName}
                            onChange={handleChange}
                          />
                          {errors["bankDetails.bankName"] && (
                            <small className="text-danger">
                              {errors["bankDetails.bankName"]}
                            </small>
                          )}
                        </div>

                        {/* IFSC */}
                        <div className="col-md-6 mb-0">
                          <label className="form-label">IFSC Code:</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="IFSC Code"
                            name="bankDetails.ifsc"
                            value={formData.bankDetails.ifsc}
                            onChange={handleChange}
                          />
                          {errors["bankDetails.ifsc"] && (
                            <small className="text-danger">
                              {errors["bankDetails.ifsc"]}
                            </small>
                          )}
                        </div>

                        <h5>PF Details</h5>

                        <div className="col-md-6 mb-0">
                          <label>UAN Number:</label>
                          <input
                            type="text"
                            className="form-control"
                            name="uanNumber"
                            value={formData.uanNumber}
                            maxLength="12"
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d*$/.test(val)) handleChange(e); // digits only
                            }}
                          />
                          {errors.uanNumber && (
                            <small className="text-danger">
                              {errors.uanNumber}
                            </small>
                          )}
                        </div>
                        {/* pf and uan number */}
                        <div className="col-md-6 mb-0">
                          <label>PF Number:</label>
                        <input
                          type="text"
                          className="form-control"
                          name="pfNumber"
                          value={formData.pfNumber}
                          maxLength="22"
                          onChange={(e) => {
                            const val = e.target.value;

                            if (/^[A-Za-z0-9]{0,22}$/.test(val)) {
                              handleChange(e);
                            }
                          }}
                        />
                          {errors.pfNumber && (
                            <small className="text-danger">
                              {errors.pfNumber}
                            </small>
                          )}
                        </div>

                        {/* Profile Image */}
                        <h5>File Uploads</h5>
                        <div className="col-md-6 mb-0">
                          <label className="form-label">Profile Image:</label>
                          <input
                            type="file"
                            className="form-control"
                            name="image"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png"
                          />
                          {errors.image && (
                            <small className="text-danger">
                              {errors.image}
                            </small>
                          )}
                        </div>

                        {/* PAN Card */}
                        <div className="col-md-6 mb-0">
                          <label className="form-label">PAN Card:</label>
                          <input
                            type="file"
                            className="form-control"
                            name="panCardPdf"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png,application/pdf"
                          />
                          {errors.panCardPdf && (
                            <small className="text-danger">
                              {errors.panCardPdf}
                            </small>
                          )}
                        </div>

                        {/* Aadhar Card */}
                        <div className="col-md-6 mb-0">
                          <label className="form-label">Aadhar Card:</label>
                          <input
                            type="file"
                            className="form-control"
                            name="aadharCardPdf"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png,application/pdf"
                          />

                          {errors.aadharCardPdf && (
                            <small className="text-danger">
                              {errors.aadharCardPdf}
                            </small>
                          )}
                        </div>

                        {/* Appointment Letter */}
                        <div className="col-md-6 mb-0">
                          <label className="form-label">
                            Appointment Letter:
                          </label>
                          <input
                            type="file"
                            className="form-control"
                            name="appointmentLetter"
                            onChange={handleFileChange}
                            accept="application/pdf"
                          />
                          {errors.appointmentLetter && (
                            <small className="text-danger">
                              {errors.appointmentLetter}
                            </small>
                          )}
                        </div>

                        {/* Passbook PDF */}
                        <div className="col-md-6 mb-0">
                          <label className="form-label">Passbook PDF:</label>
                          <input
                            type="file"
                            className="form-control"
                            name="passbookPdf"
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png,application/pdf"
                          />
                          {errors.passbookPdf && (
                            <small className="text-danger">
                              {errors.passbookPdf}
                            </small>
                          )}
                        </div>

                        <div className="col-md-6 mb-0">
                          <label>Certificate (PDF / Image):</label>
                          <input
                            type="file"
                            className="form-control"
                            name="certificatePdf"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                          />
                          {errors.certificatePdf && (
                            <small className="text-danger">
                              {errors.certificatePdf}
                            </small>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Navigation Buttons */}
                  <div className="d-flex justify-content-end mt-4 gap-2">
                    <hr style={{ marginTop: "20px" }} />
                    {step > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm custom-outline-btn"
                        style={{ minWidth: 90 }}
                        onClick={handleBack}
                      >
                        <span>&larr;</span> Previous
                      </button>
                    )}

                    {/* Next or Submit Button */}
                    {step < 3 ? (
                      <button
                        type="button"
                        className="btn btn-sm custom-outline-btn"
                        style={{ minWidth: 90 }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleNext();
                        }}
                      >
                        Next →
                      </button>
                    ) : (
                      // <button type="submit" className="btn btn-primary" disabled={loading}>
                      //   {loading ? "Adding..." : "Add Employee"}
                      // </button>
                      <button
                        type="submit"
                        className="btn btn-sm custom-outline-btn"
                        style={{ minWidth: 90 }}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Adding...
                          </>
                        ) : (
                          "Add Employee"
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddEmployee;