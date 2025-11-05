/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { BaseMsgRespBody } from '../models/BaseMsgRespBody';
import type { GetAdminRespBody } from '../models/GetAdminRespBody';
import type { SignInByEmailReqBody } from '../models/SignInByEmailReqBody';
import type { SignInSuccessRespBody } from '../models/SignInSuccessRespBody';
export class AccountServiceService {
  /**
   * @returns GetAdminRespBody Successful response
   * @throws ApiError
   */
  public static accountServiceGetAdminMe(): CancelablePromise<GetAdminRespBody> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/platform_admin_api/v1/account/me',
    });
  }
  /**
   * @returns SignInSuccessRespBody Successful response
   * @throws ApiError
   */
  public static accountServiceRefreshToken(): CancelablePromise<SignInSuccessRespBody> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/platform_admin_api/v1/account/refresh_token',
    });
  }
  /**
   * @param requestBody
   * @returns SignInSuccessRespBody Successful response
   * @throws ApiError
   */
  public static accountServiceSignInByEmail(
    requestBody?: SignInByEmailReqBody,
  ): CancelablePromise<SignInSuccessRespBody> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/platform_admin_api/v1/account/sign_in_by_email',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * @returns BaseMsgRespBody Successful response
   * @throws ApiError
   */
  public static accountServiceSignOut(): CancelablePromise<BaseMsgRespBody> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/platform_admin_api/v1/account/sign_out',
    });
  }
}
