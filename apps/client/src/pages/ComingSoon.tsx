import BottomNav from '../components/BottomNav'

export default function ComingSoon({ title }: { title: string }) {
  return (
    <main className="screen has-nav"><h1>{title}</h1><div className="panel"><b>Coming in the next batch</b><span className="muted">This screen is designed and still to be built.</span></div><BottomNav /></main>
  )
}
