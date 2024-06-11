<template>
  
    <div class="list-wrapper" v-if="total">  
      <el-table
        v-if="total"
        ref="multipleListTable"
        class="list-table"
        :data="dataList"
        empty-text="暂无数据"
        row-key="_id"
        header-row-class-name="tableview-header"
        row-class-name="tableview-row"
        cell-class-name="tableview-cell"
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column
          v-for="field in fieldList"
          :key="field.key"
          :prop="field.key"
          :label="field.title"
          :width="field.width"
          class-name="link"
        >
        </el-table-column>
        <el-table-column
          label="操作"
          width="200"
        >
          <template v-slot="{ row }">
            <el-button
              type="text"
              size="small"
              @click="handleDownload(row)"
            >
              下载
            </el-button>
            <el-button
              type="text"
              size="small"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
    </el-table>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, unref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { get, map } from 'lodash-es'

import { ElMessage, ElMessageBox } from 'element-plus'
import 'element-plus/theme-chalk/src/message.scss'
import 'element-plus/theme-chalk/src/message-box.scss'

import moment from 'moment'
// 引入中文
import 'moment/locale/zh-cn'
// 设置中文
moment.locale('zh-cn')

import EmptyIndex from '@/management/components/EmptyIndex.vue'
import { CODE_MAP } from '@/management/api/base'
import { QOP_MAP } from '@/management/utils/constant'
import { deleteSurvey } from '@/management/api/survey'
import { SurveyPermissions } from '@/management/utils/types/workSpace'


const store = useStore()
const router = useRouter()
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  data: {
    type: Array,
    default: () => []
  },
  total: {
    type: Number,
    default: 0
  }
})
const handleDownload = (row: any) => {
  window.location.href = row.downloadPath;
}
const fields = ['filename', 'fileType', 'fileSize', 'downloadTime', 'curStatus']
const total = computed(() => {
  return props.total
})
const data = computed(() => {
  return props.data
})

const dataList = computed(() => {
  return data.value.map((item) => {
    if (typeof item === 'object' && item !== null) {
      return {
       ...item ,
      }
    }
    })
})
const fieldList = computed(() => {
  return map(fields, (f) => {
    return get(downloadListConfig, f)
  })
})
const downloadListConfig = {
  filename: {
    title: '文件名称',
    key: 'filename',
    width: 340,
    tip: true
  },
  fileType: {
    title: '格式',
    key: 'fileType',
    width: 200,
    tip: true
  },
  fileSize: {
    title: '预估大小',
    key: 'fileSize',
    width: 140,
    
  },
  downloadTime: {
    title: '下载时间',
    key: 'downloadTime',
    width: 240
  },
  curStatus: {
    title: '状态',
    key: 'curStatus',
    comp: 'StateModule'
  },
}
</script>


<style lang="scss" scoped>
.question-list-root {
  height: 100%;
  background-color: #f6f7f9;
.list-wrapper {
  padding: 10px 20px;
  background: #fff;
  .list-table {
    min-height: 620px;
    .cell {
      text-align: center;
    }
  }
}
}
</style>