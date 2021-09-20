import React, { Component } from "react"
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom"

import { SocketProvider } from "./hooks/socket"
import Main from "./modules/Main"

import "./app.scss"

const Error404 = () => <h2 style={{marginLeft: "15px"}}>404 Seite nicht gefunden</h2>

class App extends Component {

  render() {
    return (
      <SocketProvider>
        <div id="app">
          <Router>
            <Switch>
              <Redirect exact from="/logout" to="/auth/logout" />
              <Route exact path="/">
                <Main />
              </Route>
              <Route>
                <Error404 />
              </Route>
            </Switch>
          </Router>
        </div>
      </SocketProvider>
    )
  }
}

export default App

