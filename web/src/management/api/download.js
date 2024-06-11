import axios from './base'

//问卷下载
export const getDownloadList = ({ownerId,page,pageSize}) => {
  return axios.get('/survey/surveyDownload/getdownloadList', {
    params: {
        ownerId,
        page,
        pageSize
    }
  })
}
