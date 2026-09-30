import React from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { TeamProvider } from "./context/TeamContext";
import { useTeam } from "./context/teamStore";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Room from "./pages/Room";
import {
  Meetings,
  Team,
  Admin,
  Unauthorized,
  NotFound,
} from "./pages/WorkspacePages";
import "./styles.css";
function Protected({ admin = false, children }) {
  const { user, ready } = useTeam();
  const location = useLocation();
  if (!ready)
    return (
      <div className="loadingScreen">
        <span />
        <p>نجهّز مساحة فريقك…</p>
      </div>
    );
  if (!user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (admin && user.role !== 200)
    return <Navigate to="/unauthorized" replace />;
  return children;
}
function App() {
  return (
    <TeamProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <Protected>
                <Layout />
              </Protected>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="meetings" element={<Meetings />} />
            <Route path="team" element={<Team />} />
            <Route path="private" element={<Team privateMode />} />
            <Route path="room/:roomId" element={<Room />} />
            <Route
              path="admin"
              element={
                <Protected admin>
                  <Admin />
                </Protected>
              }
            />
            <Route path="unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: "Noto Sans Arabic, sans-serif",
              fontSize: "12px",
              direction: "rtl",
              borderRadius: "12px",
              border: "1px solid #e6ecf4",
              padding: "13px 18px",
            },
            duration: 4000,
          }}
        />
      </BrowserRouter>
    </TeamProvider>
  );
}
createRoot(document.getElementById("root")).render(<App />);
