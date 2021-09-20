import React, { createContext, useContext, useState } from "react"
import PropTypes from "prop-types"

import io from "socket.io-client"

const port = 3231
const hostname = window.location.hostname
const protocol = window.location.protocol
const socketUrl = protocol + "//" + hostname + ":" + port

export const SocketContext = createContext()

// Provider component that makes socket context available to any child component
export function SocketProvider({ children})  {
  const socket = useProvideSocket()
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}

SocketProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
}

// Hook for child components to get the socket object and re-render when it changes
export const useSocket = () => {
  return useContext(SocketContext)
}

// Provider hook that creates socket object and handles state
function useProvideSocket() {
  const socketClient = io(socketUrl)

  socketClient.on("connect", () => {
    console.log("Connected to " + socketUrl + ".")
  })
  socketClient.on("disconnect", () => {
    console.log("Disconnected from " + socketUrl + ".")
  })

  const [client, setClient] = useState(socketClient)
  const replaceClient = (socketClient) => setClient(socketClient)

  // Return the socket client object and state methods
  return {
    client,
    replaceClient
  }
}

// Higher Order Component to make socket object available for class components
export function withSocket(WrappedComponent) {
  const SocketHOC = function(props) {
    const socket = useSocket()
    return <WrappedComponent socket={socket} {...props} />
  }
  return SocketHOC
}