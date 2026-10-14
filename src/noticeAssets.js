export const NOTICE_BUCKET = 'notice-assets'
const imageTypes = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
const documentTypes = { pdf: 'application/pdf', txt: 'text/plain', zip: 'application/zip' }
const signedAssets = new Map()

export async function resolveNoticeAssets(client, notices) {
  signedAssets.clear()
  const { data } = await client.auth.getSession()
  if (!data.session) return
  const entries = new Map()
  for (const notice of notices) {
    for (const path of notice.image_paths ?? []) entries.set(path, null)
    for (const item of notice.attachments ?? []) entries.set(item.path, item.name)
  }
  await Promise.all([...entries].map(async ([path, name]) => {
    const { data: signed, error } = await client.storage.from(NOTICE_BUCKET).createSignedUrl(path, 3600, name ? { download: name } : undefined)
    if (!error) signedAssets.set(path, signed.signedUrl)
  }))
}

export function validateNoticeFiles(files, kind, existingCount) {
  const max = kind === 'image' ? 3 : 5
  if (files.length + existingCount > max) throw new Error(`${kind === 'image' ? '이미지는 최대 3장' : '첨부파일은 최대 5개'}까지 등록할 수 있습니다.`)
  return files.map(file => {
    const extension = kind === 'image' ? imageTypes[file.type] : file.name.split('.').pop().toLowerCase()
    const mime = kind === 'image' ? file.type : documentTypes[extension]
    if (!extension || !mime) throw new Error(kind === 'image' ? 'JPG, PNG, WEBP, GIF 이미지만 등록할 수 있습니다.' : '첨부파일은 PDF, TXT, ZIP만 등록할 수 있습니다.')
    const maxSize = (kind === 'image' ? 5 : 10) * 1024 * 1024
    if (file.size <= 0 || file.size > maxSize) throw new Error(`${file.name}: 파일 크기는 0보다 크고 ${kind === 'image' ? 5 : 10}MB 이하여야 합니다.`)
    return { file, extension, mime, name: file.name.slice(0, 200), size: file.size }
  })
}

export function assetUrl(_client, path) {
  return signedAssets.get(path) || ''
}

export function noticeAssetPaths(notice) {
  return [...(notice?.image_paths ?? []), ...(notice?.attachments ?? []).map(item => item.path)]
}

export async function removeNoticeAssets(client, paths) {
  if (!paths.length) return
  const { error } = await client.storage.from(NOTICE_BUCKET).remove(paths)
  if (error) throw error
}

export async function persistNoticeAssets(client, images, attachments, saveRecord) {
  const uploaded = []
  try {
    for (const item of [...images, ...attachments]) {
      if (!item.file) continue
      const { error } = await client.storage.from(NOTICE_BUCKET).upload(item.path, item.file, { contentType: item.mime, upsert: false })
      if (error) throw new Error('파일 업로드에 실패했습니다. 연결 상태와 관리자 권한을 확인해 주세요.')
      uploaded.push(item.path)
    }
    return await saveRecord({ image_paths: images.map(item => item.path), attachments: attachments.map(({ path, name, size }) => ({ path, name, size })) })
  } catch (error) {
    try { await removeNoticeAssets(client, uploaded) }
    catch { throw new Error('저장에 실패했고 일부 임시 파일을 정리하지 못했습니다. 관리자에게 문의해 주세요.') }
    throw error
  }
}
