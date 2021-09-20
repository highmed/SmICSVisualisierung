import React, { Component } from "react"
import { Redirect, withRouter } from "react-router-dom"
import PropTypes from "prop-types"

import Avatar from "@material-ui/core/Avatar"
import Box from "@material-ui/core/Box"
import Button from "@material-ui/core/Button"
import Container from "@material-ui/core/Container"
import CssBaseline from "@material-ui/core/CssBaseline"
import Link from "@material-ui/core/Link"
import TextField from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"

import { withAuth } from "../hooks/auth"
import "./scss/login.scss"

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {"Copyright © "}
      <Link color="inherit" href="https://highmed.org/">
        Highmed
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  )
}

class Login extends Component {
  constructor(props) {
    super(props)

    this.state = {
      username: "",
      password: ""
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange = (e) => {
    this.setState({ [e.currentTarget.id]: e.currentTarget.value })
  };

  handleSubmit(event) {
    event.preventDefault()
    this.props.auth.login(this.state.username, this.state.password)
  }

  componentDidUpdate(prevProps) {
    if(prevProps.auth.username !== this.props.auth.username)
      this.props.history.push("/")
  }

  render() {
    return (
      this.props.auth.username ? (
        <Redirect to="" />
      ) : (
        <Container component="main" maxWidth="xs">
          <CssBaseline />
          <div className="login">
            <Avatar alt="Logo" src="/assets/login_logo.png" className="login-avatar">
            </Avatar>
            <Typography component="h1" variant="h5">
          Login
            </Typography>
            <form onSubmit={this.handleSubmit} className="login-form">
              <TextField
                autoFocus
                fullWidth
                required
                error={!!this.props.auth.error}
                autoComplete="user"
                id="username"
                label="Benutzername"
                margin="normal"
                name="username"
                variant="outlined"
                onChange={this.handleChange}
              />
              <TextField
                fullWidth
                required
                error={!!this.props.auth.error}
                autoComplete="current-password"
                id="password"
                label="Passwort"
                margin="normal"
                name="password"
                type="password"
                variant="outlined"
                onChange={this.handleChange}
              />
              <Typography color="error">
                { this.props.auth.error }
              </Typography>
              <Button
                fullWidth
                color="primary"
                type="submit"
                variant="contained"
              >
                { this.props.auth.username ? "Abmelden" : "Anmelden" }
              </Button>
            </form>
          </div>
          <Box mt={8}>
            <Copyright />
          </Box>
        </Container>
      )
    )
  }
}

Login.propTypes = {
  auth: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired
}

export default withAuth(withRouter(Login))