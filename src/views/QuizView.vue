<template>
  <div class="quiz-container">
    <!-- 添加获取题目按钮 -->
    <div class="fetch-questions-section">
      <input 
        type="number" 
        v-model="targetSetId"
        placeholder="请输入题目集ID"
        class="set-id-input"
      >
      <button 
        @click="fetchQuestionsBySetId" 
        class="fetch-btn"
        :disabled="!targetSetId || loading"
      >
        <i class="fas fa-download"></i>
        获取题目
      </button>
    </div>

    <!-- 添加题目集信息显示 -->
    <div v-if="quizInfo.title" class="quiz-info">
      <h1 class="quiz-title">{{ quizInfo.title }}</h1>
      <p class="quiz-description">{{ quizInfo.description }}</p>
      <div class="quiz-meta">
        <span>题目数量: {{ quizInfo.questionCount }}</span>
      </div>
    </div>

    <!-- 文件上传区域 -->
    <div class="upload-section">
      <input 
        type="file" 
        ref="fileInput"
        @change="handleFileChange"
        accept=".txt,.doc,.docx,.pdf"
        class="file-input"
      >
      <div class="upload-box" @click="triggerFileInput">
        <i class="fas fa-cloud-upload-alt"></i>
        <p>点击或拖拽文件到此处上传</p>
        <span class="upload-hint">支持 .txt, .doc, .docx, .pdf 格式</span>
      </div>
      
      <!-- 添加题目数量输入框 -->
      <div class="question-count-input">
        <label for="questionCount">生成题目数量：</label>
        <div class="number-input">
          <button @click="decreaseCount" type="button" :disabled="questionCount <= 1">-</button>
          <input 
            type="number" 
            id="questionCount"
            v-model.number="questionCount"
            min="1"
            max="50"
            @input="validateCount"
          >
          <button @click="increaseCount" type="button" :disabled="questionCount >= 50">+</button>
        </div>
      </div>

      <div v-if="uploadStatus" :class="['upload-status', uploadStatus.type]">
        {{ uploadStatus.message }}
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>题目加载中...</p>
    </div>

    <template v-else>
      <!-- 进度条 -->
      <div class="progress-bar">
        <div 
          class="progress-value" 
          :style="{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }"
        ></div>
      </div>

      <div class="questions">
        <QuestionCard
          v-for="question in questions"
          :key="question.id"
          :question="question"
          :showAnswer="showResults"
          @answer-selected="handleAnswer"
        />
        <button 
          v-if="!showResults"
          class="submit-btn" 
          @click="submitQuiz"
          :disabled="Object.keys(answers).length !== questions.length || submitting"
        >
          {{ submitting ? '提交中...' : '提交答案' }}
        </button>
        <button 
          v-else 
          class="retry-btn" 
          @click="retryQuiz"
        >
          重新测试
        </button>
      </div>
      
      <div v-if="showResults" class="results">
        <h2>测试结果</h2>
        <div class="score-summary">
          <div class="score-circle">
            <span class="score-number">{{ correctCount }}</span>
            <span class="score-total">/{{ questions.length }}</span>
          </div>
          <p class="score-text">答对题目数</p>
        </div>
      </div>
    </template>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="fetchQuestions">重试</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import QuestionCard from '../components/QuestionCard.vue'
import ResultCard from '../components/ResultCard.vue'
import { quizApi } from '../api/quiz'

export default {
  name: 'QuizView',
  components: {
    QuestionCard,
    ResultCard
  },
  setup() {
    const questions = ref([])
    const answers = ref({})
    const showResults = ref(false)
    const loading = ref(false)
    const error = ref(null)
    const submitting = ref(false)
    const analysisData = ref({})
    const correctCount = ref(0)
    const questionCount = ref(10) // 默认生成10道题

    // 新增的文件上传相关响应式数据
    const fileInput = ref(null)
    const uploadStatus = ref(null)

    // 在 setup() 函数中添加新的响应式变量
    const currentSetId = ref(null)
    const targetSetId = ref('')  // 新增：用于存储用户输入的题目集ID

    // 在 setup() 中添加题目集信息的响应式变量
    const quizInfo = ref({
      title: '',
      description: '',
      questionCount: 0
    })

    // 触发文件选择
    const triggerFileInput = () => {
      fileInput.value.click()
    }

    // 处理文件选择
    const handleFileChange = async (event) => {
      const file = event.target.files[0]
      if (!file) return

      uploadStatus.value = {
        type: 'info',
        message: '文件上传中...'
      }

      try {
        const response = await quizApi.uploadFile(file, questionCount.value)
        currentSetId.value = response.data.id // 保存返回的题目集ID
        
        uploadStatus.value = {
          type: 'success',
          message: '文件上传成功！正在加载题目...'
        }
        
        // 获取新创建的题目集
        await fetchQuestions()
      } catch (err) {
        uploadStatus.value = {
          type: 'error',
          message: '文件上传失败，请重试'
        }
        console.error('文件上传错误:', err)
      }
    }

    // 获取题目
    const fetchQuestions = async () => {
      loading.value = true
      error.value = null
      try {
        if (!currentSetId.value) {
          throw new Error('没有可用的题目集')
        }
        
        const response = await quizApi.getQuestionSet(currentSetId.value)
        const data = response.data
        
        // 转换后端数据格式为组件所需格式
        questions.value = data.questions.map(q => {
          // 解析题目内容
          let title = q.content
          let options = []
          
          if (q.type === '选择题') {
            // 分离题干和选项
            const parts = q.content.split('\n')
            title = parts[0]
            options = parts.slice(1).map(option => ({
              label: option.charAt(0), // 选项标签 (A, B, C, D)
              text: option.slice(3)    // 选项内容
            }))
          }
          
          return {
            id: q.id,
            number: q.questionNumber,
            title: title,
            type: convertQuestionType(q.type),
            options: options,
            answer: q.answer,
            explanation: q.analysis || '暂无解析'
          }
        })
        
        // 更新题目集信息
        quizInfo.value = {
          title: data.title,
          description: data.description,
          questionCount: data.questionCount
        }
        
        // 重置状态
        answers.value = {}
        showResults.value = false
        analysisData.value = {}
        
      } catch (err) {
        console.error('获取题目错误:', err)
        if (err.response) {
          // 服务器响应了，但状态码不在 2xx 范围内
          error.value = err.response.status === 404 
            ? '未找到题目集' 
            : `加载题目失败: ${err.response.data?.message || '请重试'}`
        } else if (err.request) {
          // 请求已发出，但没有收到响应
          error.value = '无法连接到服务器，请检查网络连接'
        } else {
          // 请求配置出错
          error.value = '请求配置错误，请重试'
        }
      } finally {
        loading.value = false
      }
    }

    // 添加问题类型转换函数
    const convertQuestionType = (backendType) => {
      const typeMap = {
        '选择题': 'choice',
        '判断题': 'boolean',
        '简答题': 'text'
      }
      return typeMap[backendType] || 'text'
    }

    // 处理答案选择
    const handleAnswer = ({ questionId, answer }) => {
      answers.value[questionId] = answer
      console.log('当前答案状态:', {
        已答题数: Object.keys(answers.value).length,
        总题数: questions.value.length,
        详细答案: answers.value
      })
    }

    // 提交答案
    const submitQuiz = async () => {
      if (submitting.value) return
      submitting.value = true

      try {
        // 计算正确答案数量
        correctCount.value = questions.value.reduce((count, q) => {
          const userAnswer = answers.value[q.id]
          return count + (String(userAnswer) === String(q.answer) ? 1 : 0)
        }, 0)
        
        // 显示结果
        showResults.value = true
        
      } catch (err) {
        error.value = '提交答案失败，请重试'
        console.error('提交答案错误:', err)
      } finally {
        submitting.value = false
      }
    }

    // 重新测试
    const retryQuiz = async () => {
      showResults.value = false
      answers.value = {}
      correctCount.value = 0
      await fetchQuestions()
    }

    // 验证题目数量
    const validateCount = () => {
      if (questionCount.value < 1) questionCount.value = 1
      if (questionCount.value > 50) questionCount.value = 50
    }

    // 增加题目数量
    const increaseCount = () => {
      if (questionCount.value < 50) {
        questionCount.value++
      }
    }

    // 减少题目数量
    const decreaseCount = () => {
      if (questionCount.value > 1) {
        questionCount.value--
      }
    }

    // 新增：根据ID获取题目
    const fetchQuestionsBySetId = async () => {
      if (!targetSetId.value) return
      
      loading.value = true
      error.value = null
      
      try {
        currentSetId.value = targetSetId.value
        await fetchQuestions()
        targetSetId.value = '' // 清空输入框
      } catch (err) {
        error.value = '获取题目失败，请检查题目集ID是否正确'
        console.error('获取题目错误:', err)
      } finally {
        loading.value = false
      }
    }

    // 组件挂载时获取题目
    onMounted(() => {
      // 只有当有 currentSetId 时才自动获取题目
      if (currentSetId.value) {
        fetchQuestions()
      }
    })

    return {
      questions,
      answers,
      showResults,
      loading,
      error,
      submitting,
      analysisData,
      correctCount,
      handleAnswer,
      submitQuiz,
      retryQuiz,
      fetchQuestions,
      // 新增的返回值
      fileInput,
      uploadStatus,
      triggerFileInput,
      handleFileChange,
      questionCount,
      validateCount,
      increaseCount,
      decreaseCount,
      targetSetId,
      fetchQuestionsBySetId,
      quizInfo
    }
  }
}
</script>

<style scoped>
.quiz-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.submit-btn, .retry-btn {
  background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  width: 100%;
  margin-top: 32px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(33, 150, 243, 0.2);
}

.submit-btn:hover, .retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(33, 150, 243, 0.3);
}

.submit-btn:active, .retry-btn:active {
  transform: translateY(0);
}

.retry-btn {
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
  box-shadow: 0 4px 6px rgba(76, 175, 80, 0.2);
}

.retry-btn:hover {
  box-shadow: 0 6px 12px rgba(76, 175, 80, 0.3);
}

h2 {
  text-align: center;
  margin-bottom: 40px;
  color: #1976d2;
  font-size: 28px;
  font-weight: 600;
}

.progress-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  margin-bottom: 32px;
  overflow: hidden;
}

.progress-value {
  height: 100%;
  background: linear-gradient(90deg, #42a5f5 0%, #2196f3 100%);
  transition: width 0.3s ease;
}

@media (max-width: 768px) {
  .quiz-container {
    padding: 16px;
  }
  
  h2 {
    font-size: 24px;
  }
}

.loading-container {
  text-align: center;
  padding: 40px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 16px;
  border-radius: 8px;
  margin: 20px 0;
  text-align: center;
}

.error-message button {
  background: #c62828;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  margin-left: 12px;
  cursor: pointer;
}

.score-summary {
  text-align: center;
  margin-bottom: 32px;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: white;
  position: relative;
}

.score-number {
  font-size: 48px;
  font-weight: 600;
}

.score-total {
  font-size: 24px;
  opacity: 0.8;
}

.score-text {
  color: #666;
  font-size: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 新增文件上传相关样式 */
.upload-section {
  margin-bottom: 40px;
}

.file-input {
  display: none;
}

.upload-box {
  border: 2px dashed #2196f3;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.upload-box:hover {
  background: #e3f2fd;
  border-color: #1976d2;
}

.upload-box i {
  font-size: 48px;
  color: #2196f3;
  margin-bottom: 16px;
}

.upload-box p {
  font-size: 18px;
  color: #455a64;
  margin: 8px 0;
}

.upload-hint {
  font-size: 14px;
  color: #78909c;
}

.upload-status {
  margin-top: 16px;
  padding: 12px;
  border-radius: 4px;
  text-align: center;
}

.upload-status.info {
  background: #e3f2fd;
  color: #1976d2;
}

.upload-status.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.upload-status.error {
  background: #ffebee;
  color: #c62828;
}

/* 添加拖拽相关样式 */
.upload-box.dragging {
  background: #e3f2fd;
  border-color: #1976d2;
}

/* 添加题目数量输入框样式 */
.question-count-input {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.question-count-input label {
  color: #455a64;
  font-size: 16px;
}

.number-input {
  display: flex;
  align-items: center;
  border: 2px solid #2196f3;
  border-radius: 8px;
  overflow: hidden;
}

.number-input button {
  background: #2196f3;
  color: white;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 18px;
  transition: background-color 0.2s;
}

.number-input button:hover:not(:disabled) {
  background: #1976d2;
}

.number-input button:disabled {
  background: #90caf9;
  cursor: not-allowed;
}

.number-input input {
  width: 60px;
  text-align: center;
  border: none;
  padding: 8px;
  font-size: 16px;
  color: #2196f3;
  -moz-appearance: textfield;
}

.number-input input::-webkit-outer-spin-button,
.number-input input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.number-input input:focus {
  outline: none;
}

/* 获取题目按钮相关样式 */
.fetch-questions-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.set-id-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #2196f3;
  border-radius: 8px;
  font-size: 16px;
  color: #455a64;
  transition: border-color 0.3s;
}

.set-id-input:focus {
  outline: none;
  border-color: #1976d2;
}

.fetch-btn {
  background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2);
}

.fetch-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
}

.fetch-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.fetch-btn i {
  font-size: 18px;
}

@media (max-width: 768px) {
  .fetch-questions-section {
    flex-direction: column;
  }
  
  .fetch-btn {
    width: 100%;
    justify-content: center;
  }
}

/* 添加题目集信息相关样式 */
.quiz-info {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.quiz-title {
  font-size: 24px;
  color: #1976d2;
  margin-bottom: 12px;
}

.quiz-description {
  color: #616161;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 16px;
}

.quiz-meta {
  color: #757575;
  font-size: 14px;
}
</style>