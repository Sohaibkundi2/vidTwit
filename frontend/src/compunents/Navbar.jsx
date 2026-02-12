import { Link } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "../context/authContext"
import { useNavigate } from "react-router-dom";
import NotificationList from './NotificationList';
import { useSocket } from '../context/SocketContext';
import { getNotifications } from '../api';

export default function Navbar() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [showConfirm, setShowConfirm] = useState()
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket } = useSocket();
  const notificationRef = useRef(null);

  const navigate = useNavigate()


  //logout
  const handleLogoutClick = () => {
    setShowConfirm(true); // show modal/confirmation
  };

  const confirmLogout = () => {
    logout();             // call from context
    setShowConfirm(false);
    navigate("/login")
  };

  const cancelLogout = () => {
    setShowConfirm(false);
  };

  useEffect(() => {
    // Initial fetch for count
    if (user) {
        getNotifications().then(res => {
            const count = res.data?.data?.docs?.filter(n => !n.read).length || 0;
            setUnreadCount(count);
        }).catch(err => console.error(err));
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
        socket.on('new-notification', () => {
            setUnreadCount(prev => prev + 1);
        });

        return () => {
            socket.off('new-notification');
        }
    }
  }, [socket]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (notificationRef.current && !notificationRef.current.contains(event.target)) {
            setShowNotifications(false);
        }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleRead = () => {
      setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleAllRead = () => {
      setUnreadCount(0);
  };

  return (
    <div className="navbar bg-gray-950 text-white/100 shadow px-4 sticky top-0 z-50">

      {/* Left: Logo */}
      <div className="flex-1">
        <Link to="/" className="text-xl font-bold text-primary">vidTwit</Link>
      </div>

      {/* Center: Nav Links (hidden on small screens) */}
      <div className="hidden md:flex md:flex-1 md:justify-center ">
        <ul className="menu menu-horizontal px-1 ">
          <li  className="hover:bg-gray-800 rounded-md"><Link to="/">Home</Link></li>
          <li  className="hover:bg-gray-800 rounded-md"><Link to="/videos">Videos</Link></li>
          <li  className="hover:bg-gray-800 rounded-md"><Link to="/playlists">Playlists</Link></li>
          <li  className="hover:bg-gray-800 rounded-md"><Link to="/tweets">Tweets</Link></li>
        </ul>
      </div>

      {/* Right: Auth */}
      <div className="flex-none gap-3 hidden md:flex items-center">
        {user ? (
          <>
            {/* Notification Bell */}
            <div className="relative mr-2" ref={notificationRef}>
                <button onClick={() => setShowNotifications(!showNotifications)} className="btn btn-ghost btn-circle">
                    <div className="indicator">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {unreadCount > 0 && <span className="badge badge-xs badge-primary indicator-item">{unreadCount}</span>}
                    </div>
                </button>
                {showNotifications && <NotificationList
                    onClose={() => setShowNotifications(false)}
                    onRead={handleRead}
                    onAllRead={handleAllRead}
                />}
            </div>

            <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full">
                    <img src={user.avatar} alt="user" />
                </div>
                </div>
                <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 p-2 shadow bg-gray-700 rounded-box w-52 ">
                <li><Link to="/profile">Profile</Link></li>
                <li>
                    <button
                    onClick={handleLogoutClick}
                    className="bg-red-500 text-white  rounded hover:bg-red-700 cursor-pointer"
                    >Logout
                    </button>

                    {showConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-neutral-800 p-6 rounded-lg shadow-xl">
                        <p className=" mb-4">Are you sure you want to logout?</p>
                        <div className="flex items-center justify-center gap-2">
                            <button
                            onClick={cancelLogout}
                            className="bg-gray-300 dark:bg-gray-800 px-2 py-1 rounded"
                            >
                            Cancel
                            </button>
                            <button
                            onClick={confirmLogout}
                            className="bg-red-600 text-white px-2 py-1 rounded"
                            >
                            Yes, Logout
                            </button>
                        </div>
                        </div>
                    </div>
                    )}
                </li>
                </ul>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-sm btn-outline">Login</Link>
            <Link to="/register" className="btn btn-sm btn-primary">Register</Link>
          </>
        )}
      </div>

      {/* Mobile menu toggle */}
      <div className="md:hidden flex-none">
        <button className="btn btn-ghost btn-circle" onClick={() => setIsOpen(!isOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-gray-600 text-white/100  p-4 z-50 md:hidden border-t">
          <ul className="menu menu-vertical w-full  space-y-2">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/videos">Videos</Link></li>
            <li><Link to="/playlists">Playlists</Link></li>
            <li><Link to="/tweets">Tweets</Link></li>
            {user ? (
              <>
                <li><Link to="/profile">Profile</Link></li>
                <li>
                  <button
                    onClick={handleLogoutClick}
                    className="bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
                  >Logout
                  </button>

                  {showConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-neutral-800 p-6 rounded-lg shadow-xl">
                        <p className="text-lg font-semibold mb-4">Are you sure you want to logout?</p>
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={cancelLogout}
                            className="bg-gray-700 px-4 py-2 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={confirmLogout}
                            className="bg-red-600 text-white px-4 py-2 rounded"
                          >
                            Yes, Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              </>
            ) : (
              <>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Register</Link></li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
