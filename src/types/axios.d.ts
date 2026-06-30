import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    /**
     * When true, a 401 on this request does not clear the session or sign out.
     * Use for manager/passcode checks where 401 means "wrong passcode", not invalid JWT.
     */
    skipAuthRedirectOn401?: boolean;
  }
}
