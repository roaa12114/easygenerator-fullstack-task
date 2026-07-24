import { useAuth } from "../context/useAuth";
import "./Welcome.css";

function Welcome() {
  const { user, logout } = useAuth();

  return (
    <div className="welcome-page">

      <div className="bg-circle circle-left"></div>
      <div className="bg-circle circle-bottom"></div>
      <div className="bg-circle circle-right"></div>

      <div className="gold-ring"></div>

      <div className="welcome-wrapper">

        <div className="top-bar">

          <p className="user-email">
            Signed in as <span>{user?.email}</span>
          </p>

          <button
            className="logout-btn"
            onClick={logout}
          >
            <span className="logout-icon">↩</span>
            Log out
          </button>

        </div>

        <div className="welcome-card">

          <div className="card-circle top-right"></div>
          <div className="card-circle bottom-left"></div>

          <h1>
            Welcome to the
            <br />
            application.
          </h1>

        </div>

      </div>

    </div>
  );
}

export default Welcome;