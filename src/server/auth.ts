import { default as fetch } from "node-fetch"
import { Issuer, Client, Strategy, TokenSet } from "openid-client"

import CONFIG from "./config"

/**
 * Create new OpenID-Connect client for auth provider connection
 *
 * @returns new OIDC client
 */
export function createOpenidClient(): Client {
  const AUTH_CONFIG = CONFIG.auth_provider_config
  const realm_url = `${AUTH_CONFIG.provider_url}/auth/realms/${AUTH_CONFIG.realm}`

  const oidcIssuer = new Issuer({
    issuer: `${realm_url}`,
    authorization_endpoint: `${realm_url}/protocol/openid-connect/auth`,
    token_endpoint: `${realm_url}/protocol/openid-connect/token`,
    userinfo_endpoint: `${realm_url}/protocol/openid-connect/userinfo`,
    end_session_endpoint: `${realm_url}/protocol/openid-connect/logout`,
    jwks_uri: `${realm_url}/protocol/openid-connect/certs`
  })

  const oidcClient = new oidcIssuer.Client({
    client_id: AUTH_CONFIG.client_id,
    client_secret: AUTH_CONFIG.client_secret,
    redirect_uris: [`${AUTH_CONFIG.redirect_url}/auth/login/callback`],
    post_logout_redirect_uris: [`${AUTH_CONFIG.redirect_url}/auth/logout/callback`]
  })

  return oidcClient
}

/**
 * Create new OpenID-Connect strategy to handle auth provider requests
 *
 * @param client OIDC client instance
 * @returns new OIDC strategy
 */
export function createOpenidStrategy(
  client: Client
): Strategy<Express.User, Client> {
  return new Strategy(
    {
      client,
      passReqToCallback: true,
    },
    function (
      request: any,
      tokenSet: TokenSet,
      done: (err: unknown, user?: Express.User) => void
    ) {
      const user = {
        access_token: tokenSet.access_token,
        refresh_token: tokenSet.refresh_token,
        token_claims: tokenSet.claims(),
      }
      request.session.cookie.expires =
        tokenSet.claims().exp * 1000 - Date.now()
      return done(null, user)
    }
  )
}

/*
 * Currently unused auth service to communicate with auth provider via REST API
 */

export interface AuthResponse {
  access: string;
  refresh: string;
  maxAge: string;
  sessionAge: string;
  username?: string;
}

/**
 * The auth provider service accessing the HTTP(S) REST API of the
 * configured auth provider to create and handle user authentication
 */
export class AuthService {
  /**
   * Static variable to hold singleton instance.
   *
   * @private
   */
  private static INSTANCE: AuthService | null = null;

  /**
   * The base url to access auth provider API (Ends with slash).
   *
   * @private
   */
  private readonly base_url: string;

  /**
   * The url path for the auth login endpoint.
   *
   * @private
   */
  private readonly login_path: string;

  /**
   * The url path for the auth refresh endpoint.
   *
   * @private
   */
  private readonly refresh_path: string;

  /**
   * The url path for the auth logout endpoint.
   *
   * @private
   */
  private readonly logout_path: string;

  /**
   * The client id for auth endpoints.
   *
   * @private
   */
  private readonly client_id: string;

  /**
   * The client secret for auth endpoints.
   *
   * @private
   */
  private readonly client_secret: string;

  /**
   *
   * Disallow creation outside of this class.
   *
   * @private
   * @param base_url
   * @param login_path
   * @param refresh_path
   * @param logout_path
   * @param client_id
   * @param client_secret (Optional)
   */
  private constructor(
    base_url: string,
    login_path: string,
    refresh_path: string,
    logout_path: string,
    client_id: string,
    client_secret = ""
  ) {
    this.base_url = base_url
    this.login_path = login_path
    this.refresh_path = refresh_path
    this.logout_path = logout_path
    this.client_id = client_id
    this.client_secret = client_secret
  }

  /**
   * Create new AuthService instance by parsing the config parameters.
   *
   * @private
   */
  private static buildInstance(config: Record<string, string>): AuthService {
    const AUTH_CONFIG = config
    const base_url = `${AUTH_CONFIG.protocol}://${AUTH_CONFIG.hostname}:${AUTH_CONFIG.port}/`
    return new AuthService(
      base_url,
      AUTH_CONFIG.login_path,
      AUTH_CONFIG.refresh_path,
      AUTH_CONFIG.logout_path,
      AUTH_CONFIG.client_id,
      AUTH_CONFIG.client_secret
    )
  }

  /**
   * Return singleton AuthService instance (and create it if required).
   */
  public static getInstance(): AuthService {
    if (!AuthService.INSTANCE) {
      AuthService.INSTANCE = AuthService.buildInstance({})
      // Object.freeze(AuthService.INSTANCE) // Thread-safety

      // ! ToDo: Temporarily ignore any rejected TLS certificates when accessing HTTPS provider!
      // ! This is bad for production / Find another solution when integrating auth in master
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
    }
    return AuthService.INSTANCE
  }

  /**
   * Create application/x-www-form-urlencoded string from dictionary
   *
   * @param data
   * @returns string
   */
  private createFormBodyString(data: Record<string, string>): string {
    let formBody = []
    for (let property in data) {
      let encodedKey = encodeURIComponent(property)
      let encodedValue = encodeURIComponent(data[property])
      formBody.push(encodedKey + "=" + encodedValue)
    }
    return formBody.join("&")
  }

  /**
   * Login user with username and password and create new auth session at auth provider.
   *
   * @param username
   * @param password
   * @returns Promise
   */
  public async loginUser(
    username: string,
    password: string
  ): Promise<AuthResponse> {
    const postData: Record<string, string> = {
      username,
      password,
      client_id: this.client_id,
      grant_type: "password",
    }
    if (this.client_secret) postData["client_secret"] = this.client_secret

    const response = await fetch(this.base_url.concat(this.login_path), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: this.createFormBodyString(postData),
    })

    if (!response.ok)
      throw Error(
        `HTTP(S) response code was not status OK/2XX: ${response.status} - ${response.statusText}`
      )

    const result: Record<string, string> = await response.json()

    return {
      access: result["access_token"],
      refresh: result["refresh_token"],
      maxAge: result["expires_in"],
      sessionAge: result["refresh_expires_in"],
      username,
    }
  }

  /**
   * Logout user with refresh token and finish auth session at auth provider.
   *
   * @param refresh_token
   * @returns Promise
   */
  public async logoutUser(refresh_token: string): Promise<void> {
    const postData: Record<string, string> = {
      refresh_token,
      client_id: this.client_id,
    }

    const response = await fetch(this.base_url.concat(this.logout_path), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: this.createFormBodyString(postData),
    })

    if (!response.ok)
      throw Error(
        `HTTP(S) response code was not status OK/2XX: ${response.status} - ${response.statusText}`
      )
  }

  /**
   * Refresh user session with refresh token at auth provider.
   *
   * @param refresh_token
   * @returns Promise
   */
  public async refreshSession(refresh_token: string): Promise<AuthResponse> {
    const postData: Record<string, string> = {
      refresh_token,
      client_id: this.client_id,
      grant_type: "password",
    }
    if (this.client_secret) postData["client_secret"] = this.client_secret

    const response = await fetch(this.base_url.concat(this.refresh_path), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: this.createFormBodyString(postData),
    })

    if (!response.ok)
      throw Error(
        `HTTP(S) response code was not status OK/2XX: ${response.status} - ${response.statusText}`
      )

    const result: Record<string, string> = await response.json()

    return {
      access: result["access_token"],
      refresh: result["refresh_token"],
      maxAge: result["expires_in"],
      sessionAge: result["refresh_expires_in"],
    }
  }
}
