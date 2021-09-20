import React, { useEffect, useContext, createContext, useState } from "react"
import PropTypes from "prop-types"

// import { Cookies, useCookies } from "react-cookie"
import { useSocket } from "./socket"

const accessTokenKey = "at"
const refreshTokenKey = "rt"
const cookiePollingRate = 500

const authContext = createContext()

// Provider component that makes auth context available to any child component (currently unused)
export function AuthProvider({ children }) {
  const auth = useProvideAuth()
  return (
    <authContext.Provider value={auth}>
      {children}
    </authContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
}

// Hook for child components to get the auth object and re-render when it changes
export const useAuth = () => {
  return useContext(authContext)
}

// Provider hook that creates auth object and handles state
function useProvideAuth() {
  // const [cookies, setCookie, removeCookie] = useCookies(["user"])
  const [cookies, setCookie] = useState("user")
  const {client} = useSocket()
  const [error, setError] = useState(null)

  const username = cookies.user

  const login = (username, password) => {
    client.emit("authLogin", {
      username,
      password
    })
    console.log("User login...")
  }

  const logout = () => {
    client.emit("authLogout")
    removeCookies()
    console.log("User logged out")
  }

  const setCookies = (token) => {
    setCookie("user", token.username, { path: "/", maxAge: token.sessionAge})
    setCookie(accessTokenKey, token.access, { path: "/", maxAge: token.sessionAge})
    setCookie(refreshTokenKey, token.refresh, { path: "/", maxAge: token.maxAge})
  }

  const removeCookies = () => {
    // removeCookie("user")
    // removeCookie(accessTokenKey)
    // removeCookie(refreshTokenKey)
    setCookie(null)
    setCookie(null)
    setCookie(null)
  }

  // Watch current cookie state to re-render when cookie expires
  useEffect(() => {
    const interval = setInterval(() => {
      // const cookie = new Cookies().get("user")
      const cookie = "cookie"
      if(!cookie) removeCookies()
    }, cookiePollingRate)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    client.on("authToken", (result) => {
      if(result.success) {
        setCookies(result.data)
        setError("")
        console.log("Login successful!")
      } else {
        setError(result.data)
        console.log("Login failed!")
      }
    })
    return () => client.off("authToken")
  }, [])

  // Return the token object and auth methods
  return {
    username,
    login,
    logout,
    error
  }
}

// Higher Order Component to make auth object available for class components
export function withAuth(WrappedComponent) {
  const AuthHOC = function(props) {
    const auth = useAuth()
    return <WrappedComponent auth={auth} {...props} />
  }
  return AuthHOC
}