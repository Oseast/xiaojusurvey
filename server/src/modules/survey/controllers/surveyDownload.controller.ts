import {
    Controller,
    Get,
    Query,
    HttpCode,
    UseGuards,
    SetMetadata,
    Request,
  } from '@nestjs/common';
  import * as Joi from 'joi';
  import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

  import { ResponseSchemaService } from '../../surveyResponse/services/responseScheme.service';
  
  import { Authentication } from 'src/guards/authentication.guard';
  import { XiaojuSurveyPluginManager } from 'src/securityPlugin/pluginManager';
  import { SurveyGuard } from 'src/guards/survey.guard';
  import { SURVEY_PERMISSION } from 'src/enums/surveyPermission';
  import { Logger } from 'src/logger';
  import { HttpException } from 'src/exceptions/httpException';
  import { EXCEPTION_CODE } from 'src/enums/exceptionCode';
  //后添加
import { SurveyDownloadService } from '../services/surveyDownload.service';
import { GetDownloadDto, GetDownloadListDto } from '../dto/getdownload.dto';
  
  @ApiTags('survey')
  @ApiBearerAuth()
  @Controller('/api/survey/surveyDownload')
  export class SurveyDownloadController {
    constructor(
      private readonly responseSchemaService: ResponseSchemaService,
      private readonly surveyDownloadService: SurveyDownloadService,
      private readonly pluginManager: XiaojuSurveyPluginManager,
      private readonly logger: Logger,
    ) {}
  
    @Get('/download')
    @HttpCode(200)
    // @UseGuards(SurveyGuard)
    // @SetMetadata('surveyId', 'query.surveyId')
    // @SetMetadata('surveyPermission', [SURVEY_PERMISSION.SURVEY_RESPONSE_MANAGE])
    // @UseGuards(Authentication)
    async download(
      @Query()
      queryInfo:GetDownloadDto,
      @Request() req,
    ) {
      const { value, error } = GetDownloadDto.validate(queryInfo);
      if (error) {
        this.logger.error(error.message, { req });
        throw new HttpException('参数有误', EXCEPTION_CODE.PARAMETER_ERROR);
      }
      const { surveyId, isDesensitive} = value;
      const responseSchema =
        await this.responseSchemaService.getResponseSchemaByPageId(surveyId);
      const { filePath } =
        await this.surveyDownloadService.getDownloadPath({
          responseSchema,
          surveyId,
          isDesensitive,
        });
      return {
        code: 200,
        data: {
          filePath
        },
      };
    }
    @Get('/getdownloadList')
    @HttpCode(200)
    // @UseGuards(SurveyGuard)
    // @SetMetadata('surveyId', 'query.surveyId')
    // @SetMetadata('surveyPermission', [SURVEY_PERMISSION.SURVEY_RESPONSE_MANAGE])
    // @UseGuards(Authentication)
    async downloadList(
      @Query()
      queryInfo:GetDownloadListDto,
      @Request() req,
    ) {
      const { value,error } = GetDownloadListDto.validate(queryInfo);
      if (error) {
        this.logger.error(error.message, { req });
        throw new HttpException('参数有误', EXCEPTION_CODE.PARAMETER_ERROR);
      }
      const { ownerId,page,pageSize} = value;
      const { total,listBody } =
      await this.surveyDownloadService.getDownloadList({
        ownerId,
        page,
        pageSize,
      });
      return {
        code: 200,
        data: {
          total,
          listBody,
        },
      };
  }
}