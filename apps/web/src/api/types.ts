// Shapes the server returns. They mirror api/openapi.yaml.
export interface Category { id: string; name: string }
export interface ProviderSummary {
  id: string; name: string; cover_photo_url?: string; categories: string[]; areas: string[]
  from_price_kobo: number; rating_avg: number | null; review_count: number; verified: boolean; is_favorite: boolean
}
export interface Service { id: string; title: string; category: string; description?: string; price_kobo: number; duration_minutes: number }
export interface PortfolioItem { id: string; image_url: string; caption: string | null; sort_order: number }
export interface ProviderDetail extends ProviderSummary { bio: string; years_experience: number; completed_bookings: number; services: Service[]; portfolio: PortfolioItem[] }
export interface Slot { starts_at: string }
export type BookingStatus = 'requested' | 'accepted' | 'paid' | 'on_the_way' | 'completed_by_provider' | 'confirmed' | 'released' | 'declined' | 'expired' | 'cancelled' | 'disputed' | 'refunded'
export interface Booking {
  id: string; status: BookingStatus; provider: { id: string; name: string }; customer?: { id: string; name: string }; service: { id: string; title: string }
  scheduled_at: string; area: string; address: string; price_kobo: number; allowed_actions: string[]
}
export interface Conversation { id: string; booking_id: string; other_party: { name: string; photo_url?: string }; last_message: string; unread: number; updated_at: string }
export interface Message { id: string; sender_id: string; body: string; masked: boolean; sent_at: string }
export interface Me { id: string; name: string; email: string; phone?: string; role: 'customer' | 'provider' | 'admin'; email_verified: boolean; emergency_contact?: { name: string; phone: string } | null }
export interface Hours { day_of_week: number; start_time: string; end_time: string }
export type StepStatus = 'todo' | 'submitted' | 'done' | 'rejected'
export interface Onboarding { id_status: StepStatus; selfie_status: StepStatus; bank_status: StepStatus; portfolio_status: StepStatus; overall: 'incomplete' | 'in_review' | 'approved' | 'rejected' }
export interface Payout { id: string; booking_id: string; amount_kobo: number; fee_kobo: number; status: 'held' | 'released' | 'failed'; released_at: string | null }
export interface Dashboard { earned_this_week_kobo: number; held_kobo: number; new_requests: number; today: Booking[] }
export interface Earnings { pending_kobo: number; paid_out_kobo: number; history: Payout[] }
export interface Bank { code: string; name: string }
export interface Dispute { id: string; booking_id: string; customer_name?: string; provider_name?: string; service_title?: string; reason: string; description: string; status: 'open' | 'resolved'; outcome: string | null; amount_kobo: number; created_at: string }
export interface Verification { id: string; user_name: string; role: string; id_type: string; selfie_match: 'match' | 'review' | 'no_match'; submitted_at: string }
export interface AdminPayout extends Payout { provider_name?: string }
export interface AdminUser { id: string; name: string; email: string; role: 'customer' | 'provider' | 'admin'; status: 'active' | 'suspended' }
export interface Settings { commission_percent: number; provider_response_hours: number; payment_window_hours: number; auto_confirm_hours: number; free_cancel_hours: number }
export interface Summary { bookings: number; gross_kobo: number; fees_kobo: number; open_disputes: number }
