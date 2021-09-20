import * as express from "express"
import * as expressSession from "express-session"

import * as passport from "passport"
import * as path from "path"

import { createOpenidClient, createOpenidStrategy } from "./auth"
import CONFIG from "./config"

// path to built Frontend files
const root = path.join(__dirname, "../../build/public")

// config for session storage
const sessionConf = {
  secret: "express session secret string",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}

// initialize express app
export const app = express()

// settings for production/development environment based on flag
if (!CONFIG.dev_mode) {
  app.set("trust proxy", 1) // trust first proxy
  sessionConf.cookie.secure = true // serve secure cookies
} else {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0" // disable tls rejects
}

// create and use express session storage
export const session = expressSession(sessionConf)

app.use(session)

// enable authentication if flag is set to true 
if (CONFIG.use_auth) {

  // create auth provider connection client and strategy
  const oidcClient = createOpenidClient()
  const oidcStrategy = createOpenidStrategy(oidcClient)

  // initialize passport
  app.use(passport.initialize())
  app.use(passport.session())

  // use OIDC strategy to redirect to auth provider
  passport.use(
    "oidc",
    oidcStrategy
  )

  // handle serialization and deserialization of authenticated users
  passport.serializeUser(function(user: Express.User, done) {
    done(null, user)
  })
  passport.deserializeUser(function(user: Express.User, done) {
    done(null, user)
  })

  // start authentication login request
  app.get("/auth/login", (req, res, next) => {
    passport.authenticate("oidc")(req, res, next)
  })

  // handle login callback from auth provider
  app.get("/auth/login/callback", (req, res, next) => {
    passport.authenticate("oidc", {
      successRedirect: "/",
      failureRedirect: "/"
    })(req, res, next)
  })

  // start authentication logout request
  app.get("/auth/logout", (req, res) => {
    res.redirect(oidcClient.endSessionUrl())
  })

  // handle logout callback from auth provider
  app.get("/auth/logout/callback", (req, res) => {
  // clear persisted user from session storage
    req.logout()
    // redirect the user back to login page
    res.redirect("/auth/login")
  })

  // middleware to control regular app requests
  app.use((req, res, next) => {
  // Redirect to login page if not logged in
    if(!req.isAuthenticated()) {
      res.redirect("/auth/login")
      return
    }
    // Redirect to logout endpoint for logout request
    if(req.path === "/logout") {
      res.redirect("/auth/logout")
      return
    }
    next()
  })
}
    
// serve the static files from the React app
app.use(express.static(root))

// handle URLs that don't match the ones above
app.get("*", function(req, res) {
  console.log("Other Request")
  res.sendFile("index.html", {root}, function(err) {
    if (err) res.status(500).send(err)
  })
})