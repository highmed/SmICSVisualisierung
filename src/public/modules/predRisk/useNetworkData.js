import { useState, useEffect } from "react"
import { json } from "d3-fetch"
import linksjson from "../../links.json"

const url = "links.json"

const row = (d) => {
  return d
}

export const useNetworkData = () => {
  const [data, setData] = useState(null)
  useEffect(() => {
    json(url, row).then(setData)
  }, [])
  return data
}
