import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

function LoginHistory() {
const [loginHistory, setLoginHistory] = useState([]);
const [searchQuery, setSearchQuery] = useState("");
const [filteredData, setFilteredData] = useState([]);
const [applyFilter, setApplyFilter] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const [selectedDate, setSelectedDate] = useState("");
const [selectedLogin, setSelectedLogin] = useState(null);
const [showModal, setShowModal] = useState(false);

const [dateFromFilter, setDateFromFilter] = useState("");
const [dateToFilter, setDateToFilter] = useState("");
const [itemsPerPage, setItemsPerPage] = useState(5);
 // ===== PAGINATION LOGIC =====
// ===== PAGINATION LOGIC =====
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;

const currentLoginHistory = filteredData.slice(
  indexOfFirstItem,
  indexOfLastItem
);

const totalPages = Math.ceil(
  filteredData.length / itemsPerPage
);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoginHistory();
  }, []);

  const fetchLoginHistory = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/save-login-location"
      );

      setLoginHistory(res.data);
      setFilteredData(res.data);

    } catch (err) {

      console.error("Fetch login history error:", err);

    } finally {

      setLoading(false);
    }
  };

const handleFilter = () => {

  let data = [...loginHistory];

  // Search Filter
  if (searchQuery.trim() !== "") {

    data = data.filter((item) => {

      const city =
        item.address
          ?.split(",")
          ?.slice(-4, -3)[0]
          ?.trim()
          ?.toLowerCase() || "";

      const employeeId =
        item.employeeId?.toString().toLowerCase() || "";

      const employeeName =
        item.employeeName?.toLowerCase() || "";

      const search =
        searchQuery.toLowerCase();

      return (

        employeeName.includes(search) ||

        employeeId.includes(search) ||

        city.includes(search)

      );
    });
  }

  // Date Range Filter
  if (dateFromFilter && dateToFilter) {

    data = data.filter((item) => {

      const loginDate =
        new Date(item.loginTime)
          .toISOString()
          .split("T")[0];

      return (
        loginDate >= dateFromFilter &&
        loginDate <= dateToFilter
      );
    });
  }

  setFilteredData(data);
setCurrentPage(1);
};
const downloadExcel = () => {

  const excelData = filteredData.map((item, index) => {

    const loginDate = new Date(item.loginTime);

    return {
      "Sr No": index + 1,
      "Employee ID": item.employeeId,
      "Employee Name": item.employeeName,
      "Date": loginDate.toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}),
      "Time": loginDate.toLocaleTimeString("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
}),
      "Latitude": item.latitude,
      "Longitude": item.longitude,
      "Location": item.address,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Login History"
  );

  XLSX.writeFile(
    workbook,
    "Login_History.xlsx"
  );
};
const handlePageChange = (pageNumber) => {
  if (
    pageNumber >= 1 &&
    pageNumber <= totalPages
  ) {
    setCurrentPage(pageNumber);
  }
};
  return (
    
      <div className="container-fluid">
      {/* <h2
        style={{
          color: "#3A5FBE",
          fontSize: "25px",
          marginLeft: "15px",
          marginBottom: "30px",
        }}
      >
        Login History
      </h2> */}
      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    padding: "0 15px",
  }}
>
  <h2
    style={{
      color: "#3A5FBE",
      fontSize: "25px",
      margin: 0,
    }}
  >
    Login History
  </h2>

  
</div>

      {/* Filter Section */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <form
            className="row g-2 align-items-center"
            onSubmit={(e) => {
              e.preventDefault();
            }}
            style={{ justifyContent: "space-between" }}
          >
            {/* <div className="col-12 col-md-auto d-flex align-items-center gap-2 mb-1"> */}
            <div className="col-12 col-md-auto d-flex align-items-center mb-1 ms-2">
              <label
                htmlFor="searchQuery"
                // className="fw-bold mb-0"
                 className="fw-bold mb-0 text-start text-md-end"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  width: "50px",
                  minWidth: "60px",
                  marginRight: "8px",
                }}
              >
                Search
              </label>
              <input
                id="searchQuery"
                type="text"
                className="form-control"
                placeholder="Search by any field..."
                style={{ minWidth: 100 }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
        
<div className="col-12 col-md-auto d-flex align-items-center mb-1 ms-2">
              <label
                htmlFor="dateFromFilter"
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  fontSize: "16px",
                  color: "#3A5FBE",
                  width: "50px",
                  minWidth: "60px",
                  marginRight: "8px",
                }}
              >
                From
              </label>
              <input
                id="dateFromFilter"
                type="date"
                className="form-control"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                max={dateToFilter}
                style={{ minWidth: "140px" }}
              />
            </div>
            <div className="col-12 col-md-auto d-flex align-items-center mb-1 ms-2">
              <label
                htmlFor="dateToFilter"
                className="fw-bold mb-0 text-start text-md-end"
                style={{
                  width: "50px",
                  fontSize: "16px",
                  color: "#3A5FBE",
                  minWidth: "60px",
                  marginRight: "8px",
                }}
              >
                To
              </label>
              <input
                id="dateToFilter"
                type="date"
                className="form-control"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                min={dateFromFilter}
                style={{ minWidth: "140px" }}
              />
            </div>
            {/* Filter and Reset Buttons */}
            <div className="col-auto ms-auto d-flex gap-2">
                <button
   style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
    onClick={downloadExcel}
  >
    Download Excel Sheet
  </button>
              <button
                type="button"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
               onClick={handleFilter} 
                
              >
                Filter
              </button>
              <button
                type="button"
                style={{ minWidth: 90 }}
                className="btn btn-sm custom-outline-btn"
              onClick={() => {

                setSearchQuery("");
                setDateFromFilter("");
                setDateToFilter("");
                setFilteredData(loginHistory);
                setCurrentPage(1);

                }}
            >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>


      {loading ? (

        <p>Loading...</p>

      ) : (

        <div className="card shadow-sm border-0">
        <div className="table-responsive bg-white">
         < table className="table table-hover mb-0">
            <thead>
              <tr
                style={{
                  background: "#f5f5f5",
                }}
              >
                <th style={thStyle}>Sr No</th>
                <th style={thStyle}>Employee ID</th>
                <th style={thStyle}>Employee Name</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Time</th>
                {/* <th style={thStyle}>Latitude</th>
                <th style={thStyle}>Longitude</th> */}
                <th style={thStyle}>Location</th>
              </tr>
            </thead>

            <tbody>
             {filteredData.length > 0 ? (

            currentLoginHistory.map((item, index) => {

                  const loginDate = new Date(item.loginTime);

                  return (
                    // <tr
                    //   key={item._id}
                    //   style={{
                    //     borderBottom: "1px solid #ddd",
                    //   }}
                    // >
              <tr
  key={item._id}
  style={{
    borderBottom: "1px solid #ddd",
    cursor: "pointer",
  }}
  onClick={() => {
    setSelectedLogin(item);
    setShowModal(true);
  }}
>
  {/* <td style={tdStyle}>{index + 1}</td> */}
  <td style={tdStyle}>
  {indexOfFirstItem + index + 1}
</td>

    <td style={tdStyle}>
    {item.employeeId}
  </td>

  <td style={tdStyle}>
    {item.employeeName}
  </td>

  <td style={tdStyle}>
 { loginDate.toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})}
  </td>

  <td style={tdStyle}>
{ loginDate.toLocaleTimeString("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
})}
  </td>

  <td style={tdStyle}>
    {
      item.address
       
    }
  </td>
</tr>

                      
                  );
                })

              ) : (

                <tr>
                  <td
                    colSpan="8"
                    style={{
                      textAlign: "center",
                      padding: "20px",
                    }}
                  >
                    No login history found
                  </td>
                </tr>

              )}
            </tbody>
           </table>
        </div>
         </div>
        
      )}
      {showModal && selectedLogin && (

   <div
            className="modal fade show d-block"
            style={{ background: "rgba(0,0,0,0.5)" }}
           
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
                    Login Details
                  </h5>
        

            <button
                    className="btn-close btn-close-white"
                    onClick={() => setShowModal(false)}
                  ></button>
        </div>

        < div className="modal-body" style={{ maxHeight: "60vh" }}>

            <div className="row mb-2">
                  <div className="col-4 fw-semibold">Employee ID:</div>
                  <div className="col-8">
             
              <div>{selectedLogin.employeeId}</div>
            </div>
            </div>
            

           <div className="row mb-2">
                  <div className="col-4 fw-semibold">Employee Name:</div>
                  <div className="col-8">
             
              <div>{selectedLogin.employeeName}</div>
            </div>
            </div>
        
            <div className="row mb-2">
                  <div className="col-4 fw-semibold">Date:</div>
                  <div className="col-8">
             
            
                        <div>
            {new Date(
                selectedLogin.loginTime
            ).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })}
            </div>
                        </div>
                        </div>

                    <div className="row mb-2">
                  <div className="col-4 fw-semibold">Time:</div>
                  <div className="col-8">   
             
              <div>
                    {new Date(
                        selectedLogin.loginTime
                    ).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                    })}
                    </div>
            </div>
            </div>

           <div className="row mb-2">
                  <div className="col-4 fw-semibold">Latitude:</div>
                  <div className="col-8">  
              <div>{selectedLogin.latitude}</div>
            </div>
            </div>

           <div className="row mb-2">
                  <div className="col-4 fw-semibold">Longitude:</div>
                  <div className="col-8"> 
            
              <div>{selectedLogin.longitude}</div>
            </div>
             </div>

              <div className="row mb-2">
                  <div className="col-4 fw-semibold">Location:</div>
                  <div className="col-8">
             
              <div>{selectedLogin.address}</div>
            </div> 
            </div>

        <div className="modal-footer border-0 pt-0">
                
                  <button
  className="btn custom-outline-btn btn-sm"
  style={{ width: 90 }}
  onClick={() => {
    setSelectedLogin(null);
    setShowModal(false);
  }}
>
  Close
</button>
                
              </div>

        </div>

      </div>
    </div>

  </div>
)}

     {/* ===== PAGINATION UI ===== */}
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
                {filteredData.length === 0
  ? "0–0 of 0"
  : `${indexOfFirstItem + 1}-${Math.min(
      indexOfLastItem,
      filteredData.length
    )} of ${filteredData.length}`}
              </span>

              <div
                className="d-flex align-items-center"
                style={{ marginLeft: "16px" }}
              >
                <button
                  className="btn btn-sm border-0"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{ fontSize: "18px", padding: "2px 8px" }}
                >
                  ‹
                </button>
                <button
                  className="btn btn-sm border-0"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{ fontSize: "18px", padding: "2px 8px" }}
                >
                  ›
                </button>
              </div>
            </div>
          </nav>
          <div className="text-end mt-3">
            <button
              style={{ minWidth: 90 }}
              className="btn btn-sm custom-outline-btn"
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
  whiteSpace: "nowrap",
};

export default LoginHistory;