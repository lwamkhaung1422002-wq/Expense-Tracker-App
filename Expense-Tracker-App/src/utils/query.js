export function withQuery(path, params) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') query.set(key, value)
  })
  return `${path}?${query.toString()}`
}
