import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { SurveyResponse } from 'src/models/surveyResponse.entity';

import moment from 'moment';
import _, { keyBy } from 'lodash';
import { DataItem } from 'src/interfaces/survey';
import { ResponseSchema } from 'src/models/responseSchema.entity';
import { getListHeadByDataList } from '../utils';
//后添加
import { writeFile,stat } from 'fs';
import { join } from 'path';
import { SurveyDownload } from 'src/models/surveyDownload.entity';
import { SurveyMeta } from 'src/models/surveyMeta.entity';
import e from 'express';
import { XiaojuSurveyPluginManager } from 'src/securityPlugin/pluginManager';

@Injectable()
export class SurveyDownloadService {
  private radioType = ['radio-star', 'radio-nps'];

  constructor(
    @InjectRepository(SurveyResponse)
    private readonly surveyResponseRepository: MongoRepository<SurveyResponse>,
    @InjectRepository(SurveyDownload)
    private readonly SurveyDownloadRepository: MongoRepository<SurveyDownload>,
    @InjectRepository(SurveyMeta)
    private readonly SurveyDmetaRepository: MongoRepository<SurveyMeta>,
    private readonly pluginManager: XiaojuSurveyPluginManager,
  ) {}

  async getDownloadPath({
    surveyId,
    responseSchema,
    isDesensitive,
  }: {
    surveyId: string;
    responseSchema: ResponseSchema;
    isDesensitive: boolean;
  }) {
    const dataList = responseSchema?.code?.dataConf?.dataList || [];
    const listHead = getListHeadByDataList(dataList);
    const dataListMap = keyBy(dataList, 'field');
    const where = {
      pageId: surveyId,
      'curStatus.status': {
        $ne: 'removed',
      },
    };
    const [surveyResponseList, total] =
      await this.surveyResponseRepository.findAndCount({
        where,
        order: {
          createDate: -1,
        },
      });
    const [surveyMeta] = await this.SurveyDmetaRepository.find({
      where: {
        surveyPath: responseSchema.surveyPath,
      },
    });
    const listBody = surveyResponseList.map((submitedData) => {
      const data = submitedData.data;
      const dataKeys = Object.keys(data);

      for (const itemKey of dataKeys) {
        if (typeof itemKey !== 'string') {
          continue;
        }
        if (itemKey.indexOf('data') !== 0) {
          continue;
        }
        // 获取题目id
        const itemConfigKey = itemKey.split('_')[0];
        // 获取题目
        const itemConfig: DataItem = dataListMap[itemConfigKey];
        // 题目删除会出现，数据列表报错
        if (!itemConfig) {
          continue;
        }
        // 处理选项的更多输入框
        if (
          this.radioType.includes(itemConfig.type) &&
          !data[`${itemConfigKey}_custom`]
        ) {
          data[`${itemConfigKey}_custom`] =
            data[`${itemConfigKey}_${data[itemConfigKey]}`];
        }
        // 将选项id还原成选项文案
        if (
          Array.isArray(itemConfig.options) &&
          itemConfig.options.length > 0
        ) {
          const optionTextMap = keyBy(itemConfig.options, 'hash');
          data[itemKey] = Array.isArray(data[itemKey])
            ? data[itemKey]
                .map((item) => optionTextMap[item]?.text || item)
                .join(',')
            : optionTextMap[data[itemKey]]?.text || data[itemKey];
        }
      }
      return {
        ...data,
        difTime: (submitedData.difTime / 1000).toFixed(2),
        createDate: moment(submitedData.createDate).format(
          'YYYY-MM-DD HH:mm:ss',
        ),
      };
    });
    if (isDesensitive) {
      // 脱敏
      listBody.forEach((item) => {
        this.pluginManager.triggerHook('desensitiveData', item);
      });
    }

        let titlesCsv = listHead.map(question => `"${question.title.replace(/<[^>]*>/g, '')}"`).join(',')+ '\n';
        // 获取工作区根目录的路径
        const rootDir = process.cwd();
        const timestamp = Date.now();
          // 构建目标文件路径，将文件放在工作区根目录下的`data`文件夹中
        const filePath = join(rootDir, 'download', `surveyData_${timestamp}.csv`);
        listBody.forEach(row => {
          const rowValues = listHead.map(head => {
            const value = row[head.field]; // 假设每个 head 有一个 field 属性对应 row 中的键
            if (typeof value === 'string') {
              // 处理字符串中的特殊字符
              return `"${value.replace(/"/g, '""').replace(/<[^>]*>/g, '')}"`;
            }
            return `"${value}"`; // 其他类型的值（数字、布尔等）直接转换为字符串
          });
          titlesCsv += rowValues.join(',') + '\n';
        });
        const BOM = '\uFEFF';
        // writeFile(filePath, BOM + titlesCsv, { encoding: 'utf8' }, (err) => {
        //   if (err) {
        //     console.error('保存文件时出错:', err);
        //   } else {
        //     console.log('文件已保存:', filePath);
        //   }
        // });
        // const fileType='csv';
        // let size=0;
        // stat(filePath, (err, stats) => {
        //   if (err) {
        //     console.error('获取文件大小时出错:', err);
        //   } else {
        //     console.log('文件大小:', stats.size);
        //     size=stats.size;
        //   }
        // });


        let size=0;
        const fs = require('fs');
        fs.writeFile(filePath, BOM + titlesCsv, { encoding: 'utf8' }, (err) => {
          if (err) {
            console.error('保存文件时出错:', err);
          } else {
            console.log('文件已保存:', filePath);
            fs.stat(filePath, (err, stats) => {
              if (err) {
                console.error('获取文件大小时出错:', err);
              } else {
                console.log('文件大小:', stats.size);
                size = stats.size;
                const filename=`surveyData_${timestamp}.csv`;
                const fileType='csv';
                const newSurveyDownload = this.SurveyDownloadRepository.create({
                    pageId: surveyId,
                    surveyPath: responseSchema.surveyPath,
                    title:responseSchema.title,
                    filePath: filePath,
                    filename:filename,
                    fileType:fileType,
                    fileSize:size,
                    downloadTime: Date.now(),
                    onwer:surveyMeta.owner
                });
                this.SurveyDownloadRepository.save(newSurveyDownload);
              }
            });
          }
        });


    return {
      filePath
    }
  }

  async getDownloadList({
    ownerId,
    page,
    pageSize,
  }: {
    ownerId:string;
    page: number;
    pageSize: number;
  }) {
    const where = {
      onwer: ownerId,
      'curStatus.status': {
        $ne: 'removed',
      },
    };
    const [surveyDownloadList, total] =
      await this.SurveyDownloadRepository.findAndCount({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        order: {
          createDate: -1,
        },
      });
      const listBody = surveyDownloadList.map((data) => {
        return {
          _id: data._id,
          filename: data.filename,
          fileType: data.fileType,
          fileSize: data.fileSize,
          downloadTime: data.downloadTime,
          curStatus: data.curStatus.status,
          downloadPath: data.filePath,
        };
      });
    return {
      total,
      listBody,
    };
  }
}