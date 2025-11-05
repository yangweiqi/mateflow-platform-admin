/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { BaseIDRespBody } from '../models/BaseIDRespBody';
import type { BaseMsgRespBody } from '../models/BaseMsgRespBody';
import type { CreateSuperAdminReqBody } from '../models/CreateSuperAdminReqBody';
import type { GetSuperAdminRespBody } from '../models/GetSuperAdminRespBody';
import type { IDReqBody } from '../models/IDReqBody';
import type { ListSuperAdminReqBody } from '../models/ListSuperAdminReqBody';
import type { ListSuperAdminRespBody } from '../models/ListSuperAdminRespBody';
import type { UpdateSuperAdminReqBody } from '../models/UpdateSuperAdminReqBody';
export class SuperAdminServiceService {
  /**
   * @param requestBody
   * @returns BaseIDRespBody Successful response
   * @throws ApiError
   */
  public static superAdminServiceCreateSuperAdmin(
    requestBody?: CreateSuperAdminReqBody,
  ): CancelablePromise<BaseIDRespBody> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/platform_admin_api/v1/super_admin/create',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * @param requestBody
   * @returns BaseMsgRespBody Successful response
   * @throws ApiError
   */
  public static superAdminServiceDeleteSuperAdmin(
    requestBody?: IDReqBody,
  ): CancelablePromise<BaseMsgRespBody> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/platform_admin_api/v1/super_admin/delete',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * @param requestBody
   * @returns GetSuperAdminRespBody Successful response
   * @throws ApiError
   */
  public static superAdminServiceGetSuperAdmin(
    requestBody?: IDReqBody,
  ): CancelablePromise<GetSuperAdminRespBody> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/platform_admin_api/v1/super_admin/get',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * @param requestBody
   * @returns ListSuperAdminRespBody Successful response
   * @throws ApiError
   */
  public static superAdminServiceListSuperAdmin(
    requestBody?: ListSuperAdminReqBody,
  ): CancelablePromise<ListSuperAdminRespBody> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/platform_admin_api/v1/super_admin/list',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * @param requestBody
   * @returns BaseMsgRespBody Successful response
   * @throws ApiError
   */
  public static superAdminServiceUpdateSuperAdmin(
    requestBody?: UpdateSuperAdminReqBody,
  ): CancelablePromise<BaseMsgRespBody> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/platform_admin_api/v1/super_admin/update',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
}
