export const get_status_ranking: Function = (status: any) => {
  let status_ranking: any = {
    negative: 0,
    unknown: 1,
    infected: 2,
    diseased: 3,
  }
  return status_ranking[status]
}

export const get_carrier_status = (
  befund: boolean,
  screening: boolean,
  oldStatus: string
) => {
  let newStatus = "unknown"

  // TODO: SMICS-0.8
  newStatus = "negative"

  // ! Es gibt kein negative bisher

  if (befund && screening) {
    newStatus = "infected"
  } else if (befund && !screening) {
    newStatus = "diseased"
  }

  return get_worse_carrier_status(oldStatus, newStatus)
}

export const get_worse_carrier_status = (
  oldStatus: string,
  newStatus: string
) => {
  let oldS = get_status_ranking(oldStatus)

  let newS = get_status_ranking(newStatus)

  let status = oldStatus
  if (newS > oldS) {
    status = newStatus
  }

  // console.log("* * * * *")
  // console.log("GET WORSE CARRIER STATUS")
  // console.log("old - new", `${oldStatus} - ${newStatus}`)
  // console.log(`Result: ${status}`)
  // console.log(" - - - - -")

  return status
}
