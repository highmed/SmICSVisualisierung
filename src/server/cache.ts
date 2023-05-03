import * as cli_color from "cli-color"
import os = require("os")

/**
 * This function deletes the complete cache if there is less than 2000MB left on the RAM
 * @param cache The data structure which holds the cached data
 */
export const checkMemorySize = (cache: DataCache): void => {
  /* get the total RAM size of the machine */
  const total_raw_RAM: number = os.totalmem()
  const total_RAM: number =
    Math.round((total_raw_RAM / 1024 / 1024) * 100) / 100

  /* get the size of the nodejs process in the RAM */
  const used_raw_RAM: number = process.memoryUsage().heapUsed
  const used_RAM: number = Math.round((used_raw_RAM / 1024 / 1024) * 100) / 100

  /*
   *console.log("total_RAM: " + total_RAM + " MB");
   *console.log("used_RAM:  " + used_RAM + " MB");
   */

  if (used_RAM > total_RAM - 2000) {
    console.log(cli_color.blue("[checkMemSize]: Delete all data in the cache."))
    cache.clearCache()
  }
}

/* data structures for parallelization */
export type _raw_data = {
  name: string
  computing: boolean
  done: boolean
}

export type _parsed_data = {
  name: string
  computing: boolean
  done: boolean
  required_raw_data: string[]
}

export type _module_data = {
  name: string
  computing: boolean
  done: boolean
  required_raw_data: string[]
  required_parsed_data: string[]
}

/* data type for all objects stored in the cache
 * Note: This package is used for the hashes: https://www.npmjs.com/package/object-hash
 */
export type cacheDatatype = {
  data_name: string
  data_type: string
  hashID: string
  created_ts: number
  refresh_ts: number
  error: undefined | string | object
  data: any
  parameters: { [key: string]: string[] }
}

/**
 * This class implements all necessary methods of the cache
 */
export class DataCache {
  /* data structure to store the data */
  private memory: Map<string, cacheDatatype>

  public constructor() {
    this.memory = new Map<string, cacheDatatype>()
    this.refreshCache(300)
  }

  /**
   * This function deletes all cache data if its older than half of the intervall
   * @param minutes Time intervall in minutes
   */
  private refreshCache = (minutes: number): void => {
    setInterval(() => {
      console.log(
        cli_color.blue(
          `[Cache]: Clear cache. Next refresh in ${minutes} minutes.`
        )
      )
      let border: number = new Date().getTime() - (minutes * 60000) / 2
      this.memory.forEach((mem: cacheDatatype) => {
        if (mem.refresh_ts < border) {
          this.deleteDataFromCache(mem.hashID)
        }
      })
    }, minutes * 60000)
  }

  /**
   * Checks if some data is already in the cache
   * @param hashID hashed parameters of the data
   * @returns true if data is cached, false otherwise
   */
  public isInCache = (hashID: string): boolean => {
    return this.memory.has(hashID)
  }

  /**
   * Saves data to the cache
   * @param item the data to be cached
   * @returns A promise of type string
   */
  public saveDataToCache = (item: cacheDatatype): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      console.log(
        cli_color.blue(`[Cache]: Tryin to save '${item.data_name}' to cache.`)
      )
      if (!this.isInCache(item.hashID)) {
        this.memory.set(item.hashID, item)
        let msg: string = cli_color.blue(`[Cache]: Success.`)
        resolve(msg)
      } else {
        let msg: string = cli_color.blue(
          `[Cache]: '${item.data_name}' is already cached.`
        )
        reject(msg)
      }
    })
  }

  /**
   * Get the whole cache (to emit it to the client for debugging)
   * @returns An object with all items in the cache. Sorted by 'raw_data', 'parsed_data' and 'module_data'
   */
  public getCache = (): object => {
    let raw_data: cacheDatatype[] = []
    let parsed_data: cacheDatatype[] = []
    let module_data: cacheDatatype[] = []

    this.memory.forEach((co: cacheDatatype) => {
      let data: string = co.data_type
      if (data === "raw_data") raw_data.push(co)
      if (data === "parsed_data") parsed_data.push(co)
      if (data === "module_data") module_data.push(co)
    })

    let cache = {
      raw_data,
      parsed_data,
      module_data,
    }
    return cache
  }

  /**
   * Deletes ALL data in the cache
   */
  public clearCache = () => {
    this.memory.clear()
  }

  /**
   * This function updates the @param refresh_ts of an object in the cache.
   * @param hashID The hash of the object
   * @returns true if the update was successful, false otherwise
   */
  public setTimestamp = (hashID: string): boolean => {
    let tmpObj: cacheDatatype | undefined = this.getDataFromCache(hashID)
    if (typeof tmpObj === undefined) {
      return false
    } else {
      if (tmpObj?.refresh_ts) {
        tmpObj.refresh_ts = new Date().getTime()
        return true
      }
      return false
    }
  }

  /**
   * @param hashID the hash of the parameters according to the data
   * @returns some specific data based on the hashID or undefined if the key don't exist
   */
  public getDataFromCache = (hashID: string): cacheDatatype | undefined => {
    return this.memory.get(hashID)
  }

  /**
   * This functions deletes a single data object in the cache based on the hashID
   * @param hashID The hash of the data to be deleted
   */
  public deleteDataFromCache = (hashID: string): void => {
    this.memory.delete(hashID)
  }

  /**
   * This function takes an object of 'cacheDatatype' and looks for errors
   * @param tmpCacheObject The cache object to validate
   * @returns true if there is NO error in the data, false otherwise
   */
  public validateCacheData = (
    tmpCacheObject: cacheDatatype | undefined
  ): boolean => {
    if (tmpCacheObject?.error !== undefined) {
      return false
    } else if (typeof tmpCacheObject === undefined) {
      return false
    } else if (tmpCacheObject?.data === undefined) {
      return false
    } else {
      return true
    }
  }
}
