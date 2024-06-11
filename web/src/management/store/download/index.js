import {
    createSpace,
    getSpaceList,
    getSpaceDetail,
    updateSpace,
    deleteSpace
} from '@/management/api/space'
import { CODE_MAP } from '@/management/api/base'
import { ElMessage } from 'element-plus'
import 'element-plus/theme-chalk/src/message.scss'
import { getSurveyList as surveyList } from '@/management/api/survey'
import { set } from 'lodash-es'
import { SpaceType } from '@/management/utils/types/workSpace'
import { getDownloadList } from '@/management/api/download'

export default {
    namespaced: true,
    state: {
        surveyList: [],
        surveyTotal: 0,
    },
    mutations: {
        setSurveyList(state, list) {
            state.surveyList = list
        },
        setSurveyTotal(state, total) {
            state.surveyTotal = total
        },
    },
    actions: {
        async getDownloadList({ commit }, payload) {
            let params = {
                ownerId: payload.ownerId,
                page: payload.page ? payload.page : 1,
                pageSize: payload.pageSize ? payload.pageSize : 10

            }
            try {
                const { data } = await getDownloadList(params)
                console.log(data);
                commit('setSurveyList', data.listBody)
                commit('setSurveyTotal', data.total)
            } catch (e) {
                console.error(e)
            }
        }
    },
    getters: {
        // Define your getters here
    },
}
