import axios from 'axios'

// 创建axios实例
const api = axios.create({
  timeout: 150000,
  withCredentials: true, // 允许跨域携带 cookie
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// 添加请求拦截器，设置跨域请求头
api.interceptors.request.use(config => {
  config.headers['Access-Control-Allow-Origin'] = '*'
  return config
}, error => {
  return Promise.reject(error)
})

// 添加响应拦截器
api.interceptors.response.use(response => {
  console.log('收到响应:', response)
  return response
}, error => {
  console.error('响应错误:', error)
  return Promise.reject(error)
})

export const quizApi = {
  // 获取题目集
  getQuestionSet(setId) {
    return api.get(`/api/upload/sets/${setId}`)
  },

  // 上传文件并创建题目集
  uploadFile(file, questionCount) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('questionCount', questionCount)
    return api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 提交答案
  submitAnswers(setId, answers) {
    return api.post(`/api/upload/sets/${setId}/submit`, {
      answers
    })
  }
} 