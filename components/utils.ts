/* eslint-disable react-hooks/exhaustive-deps */
import { useRef, useEffect, useState } from "react"
import { Mutex } from "async-mutex"

/**
 * A custom useEffect hook that only triggers on first update of a state (or multiple states)
 * @param {() => any} effect
 * @param {any[]} dependencies
 */
export function useInitEffect(effect: () => any, dependencies: any[] = []) {
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return effect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)
}


/**
 * This hook offers an auto-refresh feature. The action is executed after the specified duration when calling scheduleAutoRefresh().
 * Existing schedules can be deleted by calling clearAutoRefresh().
 * For repeated execution, include a call to scheduleAutoRefresh in the action.
 * @param action The action to be executed.
 * @param interval The time duration [ms].
 * @returns an object with the two functions scheduleAutoRefresh and clearAutoRefresh.
 */
export function useAutoRefresh(action: () => void, interval: number) {

  // useEffect(() => {
  //   console.log("Action changed!")
  // }, [action])
  const autoRefreshIntervalMutex = new Mutex()
  const [autoRefreshIntervalHandle, setAutoRefreshIntervalHandle] = useState<NodeJS.Timeout>()

  useEffect(() => {
    // clear the autoRefresh interval when the component unmounts
    return () => clearAutoRefresh()
  }, [])

  const clearAutoRefresh = () => {
    autoRefreshIntervalMutex.runExclusive(() => {
      if (typeof autoRefreshIntervalHandle !== 'undefined') {
        clearTimeout(autoRefreshIntervalHandle)
      }
    })
  }

  const scheduleAutoRefresh = () => {
    autoRefreshIntervalMutex.runExclusive(() => {
      if (typeof autoRefreshIntervalHandle !== 'undefined') {
        clearTimeout(autoRefreshIntervalHandle)
      }
      setAutoRefreshIntervalHandle(setTimeout(() => {
        action()
      }, interval))
    })
  }

  return {
    scheduleAutoRefresh: scheduleAutoRefresh,
    clearAutoRefresh: clearAutoRefresh
  }

}