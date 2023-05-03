export const get_max_value: Function = (val1: any, val2: any) => {
  if (val1 === undefined) {
    return val2
  }
  if (val2 === undefined) {
    return val1
  }
  return val1 > val2 ? val1 : val2
}

export const get_min_value: Function = (val1: any, val2: any) => {
  if (val1 === undefined) {
    return val2
  }
  if (val2 === undefined) {
    return val1
  }
  return val1 < val2 ? val1 : val2
}

export const set_min_max_value: Function = (
  old_min: any,
  old_max: any,
  ...new_values: any
) => {
  for (let val in new_values) {
    old_min = get_min_value(old_min, val)
    old_max = get_max_value(old_max, val)
  }
}
