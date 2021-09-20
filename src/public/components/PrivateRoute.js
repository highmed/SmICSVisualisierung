import {
  Route,
  Redirect,
} from "react-router-dom"
import PropTypes from "prop-types"

import { useAuth } from "../hooks/auth"

// Wrapper for <Route> component that redirects to login if user is not authenticated (currently unused )
function PrivateRoute({ children, ...rest }) {
  let auth = useAuth()
  
  return (
    <Route
      {...rest}
      render={({ location }) =>
        auth.username ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: location }
            }}
          />
        )
      }
    />
  )
}
  
PrivateRoute.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
}

export default PrivateRoute

