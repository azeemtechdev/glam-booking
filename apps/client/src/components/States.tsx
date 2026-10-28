export const Loading = () => <p className="muted" role="status">Loading…</p>

export function ErrorBox({ message, retry }: { message?: string; retry?: () => void }) {
  return (
    <div className="stack">
      <div className="error" role="alert">{message ?? 'Something went wrong.'}</div>
      {retry && <button className="btn btn-alt" onClick={retry}>Try again</button>}
    </div>
  )
}
