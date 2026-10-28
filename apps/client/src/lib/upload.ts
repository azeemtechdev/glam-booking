import { api } from '../api/client'

// Sends a photo straight to file storage using a short-lived signed link.
export async function uploadFile(file: File, purpose: string): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose a photo (JPG or PNG).')
  if (file.size > 8 * 1024 * 1024) throw new Error('That photo is too large. Please choose one under 8 MB.')
  const s = await api<{ upload_url: string; file_url: string }>('/uploads/sign', { method: 'POST', body: { purpose, content_type: file.type } })
  if (!s.upload_url.startsWith('mock:')) {   // the fake server hands out a mock link, so nothing is sent
    const r = await fetch(s.upload_url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
    if (!r.ok) throw new Error('The upload failed. Please try again.')
  }
  return s.file_url
}
