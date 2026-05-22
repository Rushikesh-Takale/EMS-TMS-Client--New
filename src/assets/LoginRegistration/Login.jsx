import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  // ✅ Load saved credentials when page loads
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    const savedRemember = localStorage.getItem("rememberMe") === "true";

    if (savedRemember && savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in)$/.test(email))
      newErrors.email = "Please enter a valid email";

    if (!password) newErrors.password = "Password is required";
    else if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters long";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔍 Track network status
  useEffect(() => {
    const handleOnline = () => setErrorMessage("");
    const handleOffline = () =>
      setErrorMessage("⚠️ Network connection lost. Attempting to reconnect...");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getAddressFromCoords = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );

    const data = await res.json();

    return data.display_name || "Unknown location";
  } catch (err) {
    console.error("Reverse geocode error:", err);
    return "Unknown location";
  }
};
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const address = await getAddressFromCoords(
          latitude,
          longitude
        );

        resolve({
          latitude,
          longitude,
          address,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};
  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   // // ❌ BLOCK multiple login in same browser
  //   // const activeUser = sessionStorage.getItem("activeUser");
  //   // if (activeUser) {
  //   //   setErrorMessage("You are already logged in on another tab in this browser.");
  //   //   return;
  //   // }

  //   if (!validate()) return;

  //   try {
  //     const response = await axios.post("http://localhost:8000/login", {
  //       email,
  //       password,
  //     });

  //     if (response.data.success) {
  //       // Save tokens
  //       localStorage.setItem("accessToken", response.data.accessToken);
  //       localStorage.setItem("refreshToken", response.data.refreshToken);
  //       localStorage.setItem("role", response.data.role);

  //       localStorage.setItem(
  //         "activeUser",
  //         JSON.stringify({
  //           _id: response.data.userId,
  //           name: response.data.username,
  //           role: response.data.role,
  //           employeeId: response.data.employeeId,
  //           image: response.data.image,
  //           email: response.data.email,
  //         }),
  //       );

  //       // // ✅ Save active user session → prevents multiple login
  //       // sessionStorage.setItem("activeUser", JSON.stringify({
  //       //   userId: response.data.userId,
  //       //   role: response.data.role,
  //       // }));

  //       // // ✅ Notify other tabs
  //       // const bc = new BroadcastChannel("auth");
  //       // bc.postMessage({ type: "LOGIN" });

  //       // ✅ Save or clear credentials based on Remember Me
  //       if (rememberMe) {
  //         localStorage.setItem("rememberedEmail", email);
  //         localStorage.setItem("rememberedPassword", password);
  //         localStorage.setItem("rememberMe", "true");
  //       } else {
  //         localStorage.removeItem("rememberedEmail");
  //         localStorage.removeItem("rememberedPassword");
  //         localStorage.removeItem("rememberMe");
  //       }

  //       navigate(
  //         `/dashboard/${response.data.role}/${response.data.username}/${response.data.userId}`,
  //       );
  //       //window.location.reload();
  //     }
  //     // } catch (err) {
  //     //   //setErrorMessage(err.response?.data?.error || "Server error");
  //     // console.error("❌ Login error:", err);

  //     // if (!err.response) {
  //     //   // ✅ Network / Connection Error
  //     //   alert("Check your network connection");
  //     // } else {
  //     //   // ✅ Backend error (wrong credentials, etc.)
  //     //   setErrorMessage(err.response?.data?.error || "Server error");
  //     // }
  //     // }
  //   } catch (err) {
  //     console.error("❌ Login error:", err);

  //     // No connection or server unreachable
  //     if (err.code === "ERR_NETWORK" || !navigator.onLine) {
  //       setErrorMessage(
  //         "⚠️ Network connection lost. Attempting to reconnect...",
  //       );
  //       return;
  //     }

  //     // Server responded with an error
  //     if (err.response) {
  //       const status = err.response.status;
  //       const serverMsg =
  //         err.response.data?.message || err.response.data?.error;

  //       if (status === 500) {
  //         setErrorMessage(
  //           `Server Error (500): ${
  //             serverMsg || "Internal Server Error. Please try again later."
  //           }`,
  //         );
  //       } else if (status === 400 || status === 401) {
  //         setErrorMessage(
  //           serverMsg || "Invalid credentials. Please try again.",
  //         );
  //       } else {
  //         setErrorMessage(serverMsg || `Unexpected error: ${status}`);
  //       }
  //     } else {
  //       // Unknown client-side issue
  //       setErrorMessage(`Unexpected error: ${err.message}`);
  //     }
  //   }
  // };
  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validate()) return;

  try {
    // ✅ First get location permission
    const locationData = await getCurrentLocation();

    // ✅ Then login API call
    const response = await axios.post("http://localhost:8000/login", {
      email,
      password,
    });

    if (response.data.success) {

      // ✅ Save tokens
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("role", response.data.role);

      localStorage.setItem(
        "activeUser",
        JSON.stringify({
          _id: response.data.userId,
          name: response.data.username,
          role: response.data.role,
          employeeId: response.data.employeeId,
          image: response.data.image,
          email: response.data.email,
        })
      );

      // ✅ Save login location in DB
      await axios.post(
        "http://localhost:8000/save-login-location",
        {
          employeeId: response.data.employeeId,
          employeeName: response.data.username,
        
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address: locationData.address,
          loginTime: new Date(),
        }
      );

      // ✅ Remember Me
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("rememberedPassword", password);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
        localStorage.removeItem("rememberMe");
      }

      navigate(
        `/dashboard/${response.data.role}/${response.data.username}/${response.data.userId}`
      );
    }

  } catch (err) {

    console.error("Login Error:", err);

    // ❌ Location denied
    if (err.code === 1) {
      setErrorMessage(
        // "Location access is required to login."
        "Location access is mandatory to use the app. Your data is safe with us and its not shared with any third party apps."
      );
      return;
    }
    
    // ❌ Network Error
    if (err.code === "ERR_NETWORK" || !navigator.onLine) {
      setErrorMessage(
        "⚠️ Network connection lost."
      );
      return;
    }

    // ❌ Backend Errors
    if (err.response) {
      setErrorMessage(
        err.response.data?.message ||
        err.response.data?.error ||
        "Login failed"
      );
    } else {
      setErrorMessage("Something went wrong");
    }
  }
};

  return (
    <div className="full-screen-container login-bg">
      <div className="login-container">
        <div className="login-form-container">
          <img
            src="/emscwslogo.png"
            style={{ width: "170px", height: "67px" }}
            alt="Logo"
          />
          <h1 className="login-subtitle">Login</h1>

          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="input-group">
              <label>E-mail Address</label>
              <input
                type="text"
                placeholder="Email"
                value={email}
                  maxLength={50}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <small className="text-danger">{errors.email}</small>
              )}
            </div>

            {/* Password Input */}
            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
              <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  style={{
                    WebkitTextSecurity: showPassword ? "none" : "disc",
                  }}
                  value={password}
                  maxLength={20}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </span>
              </div>
              {errors.password && (
                <small className="text-danger">{errors.password}</small>
              )}
              {errorMessage && (
                <p className="text-danger mb-0">{errorMessage}</p>
              )}
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="login-options">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <label htmlFor="rememberMe">Remember Me</label>
              </div>

              <div className="forgot-link1">
                <Link to="/password-reset">Forgot Password?</Link>
              </div>
            </div>

            <button type="submit" className="btn-login">
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
