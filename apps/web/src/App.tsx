import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import RequireAuth from './components/RequireAuth'
import Welcome from './pages/Welcome'
import Signup from './pages/Signup'
import VerifyEmail from './pages/VerifyEmail'
import Login from './pages/Login'
import Home from './pages/Home'
import Stylist from './pages/Stylist'
import Book from './pages/Book'
import BookingPage from './pages/Booking'
import MyBookings from './pages/MyBookings'
import Inbox from './pages/Inbox'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import Review from './pages/Review'
import Dispute from './pages/Dispute'
import Search from './pages/Search'
import ProDashboard from './pages/ProDashboard'
import ProRequests from './pages/ProRequests'
import ProBooking from './pages/ProBooking'
import ProCalendar from './pages/ProCalendar'
import ProServices from './pages/ProServices'
import ProPortfolio from './pages/ProPortfolio'
import ProEarnings from './pages/ProEarnings'
import ProOnboarding from './pages/ProOnboarding'

const secure = (el: ReactNode) => <RequireAuth>{el}</RequireAuth>

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={secure(<Home />)} />
      <Route path="/stylists/:id" element={secure(<Stylist />)} />
      <Route path="/stylists/:id/book" element={secure(<Book />)} />
      <Route path="/bookings/:id" element={secure(<BookingPage />)} />
      <Route path="/bookings/:id/review" element={secure(<Review />)} />
      <Route path="/bookings/:id/dispute" element={secure(<Dispute />)} />
      <Route path="/bookings" element={secure(<MyBookings />)} />
      <Route path="/messages" element={secure(<Inbox />)} />
      <Route path="/messages/:id" element={secure(<Chat />)} />
      <Route path="/profile" element={secure(<Profile />)} />
      <Route path="/search" element={secure(<Search />)} />
      <Route path="/pro" element={secure(<ProDashboard />)} />
      <Route path="/pro/requests" element={secure(<ProRequests />)} />
      <Route path="/pro/bookings/:id" element={secure(<ProBooking />)} />
      <Route path="/pro/calendar" element={secure(<ProCalendar />)} />
      <Route path="/pro/services" element={secure(<ProServices />)} />
      <Route path="/pro/portfolio" element={secure(<ProPortfolio />)} />
      <Route path="/pro/earnings" element={secure(<ProEarnings />)} />
      <Route path="/pro/onboarding" element={secure(<ProOnboarding />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
