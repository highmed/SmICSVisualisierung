import { useState, useEffect } from "react"
import { json } from "d3-fetch"
import datajson from "../../data.json"

const url = "data.json"

const row = (d) => {
  console.log(d)
  return d
}

export const useData = () => {
  const [data, setData] = useState(null)
  useEffect(() => {
    // Call d3.csv using row function as accessor
    json(url, row).then(setData)
  }, [])
  return data
}
