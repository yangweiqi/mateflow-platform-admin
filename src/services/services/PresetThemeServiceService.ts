/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { BaseIDRespBody } from '../models/BaseIDRespBody';
import type { BaseMsgRespBody } from '../models/BaseMsgRespBody';
import type { CreatePresetThemeReqBody } from '../models/CreatePresetThemeReqBody';
import type { GetPresetThemeRespBody } from '../models/GetPresetThemeRespBody';
import type { IDReqBody } from '../models/IDReqBody';
import type { ListPresetThemesReqBody } from '../models/ListPresetThemesReqBody';
import type { ListPresetThemesRespBody } from '../models/ListPresetThemesRespBody';
import type { UpdatePresetThemeReqBody } from '../models/UpdatePresetThemeReqBody';
export class PresetThemeServiceService {
  /**
   * @param requestBody
   * @returns BaseIDRespBody Successful response
   * @throws ApiError
   */
  public static presetThemeServiceCreatePresetTheme(
    requestBody?: CreatePresetThemeReqBody,
  ): CancelablePromise<BaseIDRespBody> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/platform_admin_api/v1/preset_theme/create',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * @param requestBody
   * @returns BaseMsgRespBody Successful response
   * @throws ApiError
   */
  public static presetThemeServiceDeletePresetTheme(
    requestBody?: IDReqBody,
  ): CancelablePromise<BaseMsgRespBody> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/platform_admin_api/v1/preset_theme/delete',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * @param requestBody
   * @returns GetPresetThemeRespBody Successful response
   * @throws ApiError
   */
  public static presetThemeServiceGetPresetTheme(
    requestBody?: IDReqBody,
  ): CancelablePromise<GetPresetThemeRespBody> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/platform_admin_api/v1/preset_theme/get',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * @param requestBody
   * @returns ListPresetThemesRespBody Successful response
   * @throws ApiError
   */
  public static presetThemeServiceListPresetThemes(
    requestBody?: ListPresetThemesReqBody,
  ): CancelablePromise<ListPresetThemesRespBody> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/platform_admin_api/v1/preset_theme/list',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * @param requestBody
   * @returns BaseMsgRespBody Successful response
   * @throws ApiError
   */
  public static presetThemeServiceUpdatePresetTheme(
    requestBody?: UpdatePresetThemeReqBody,
  ): CancelablePromise<BaseMsgRespBody> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/platform_admin_api/v1/preset_theme/update',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
}
