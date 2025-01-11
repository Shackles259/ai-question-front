<template>
  <div class="question-card">
    <div class="question-header">
      <span class="question-number">{{ question.number }}</span>
      <span class="question-type">{{ getQuestionTypeText(question.type) }}</span>
    </div>
    
    <div class="question-content">
      <h3>{{ question.title }}</h3>
      
      <!-- 选择题选项 -->
      <div v-if="question.type === 'choice'" class="options">
        <div 
          v-for="option in question.options" 
          :key="option.label"
          class="option"
          :class="{ 
            selected: selectedOption === option.label,
            correct: showAnswer && option.label === question.answer,
            incorrect: showAnswer && selectedOption === option.label && option.label !== question.answer
          }"
          @click="!showAnswer && selectOption(option.label)"
        >
          <span class="option-label">{{ option.label }}</span>
          <span class="option-text">{{ option.text }}</span>
        </div>

        <!-- 添加选择题的答案和解析 -->
        <div v-if="showAnswer" class="answer-section">
          <div class="answer-box">
            <div class="answer-header">
              <span class="answer-label">你的答案：</span>
            </div>
            <div class="answer-content user-answer">
              {{ selectedOption ? `${selectedOption}. ${getOptionText(selectedOption)}` : '未作答' }}
            </div>
          </div>
          
          <div class="answer-box">
            <div class="answer-header">
              <span class="answer-label">正确答案：</span>
            </div>
            <div class="answer-content reference-answer">
              {{ `${question.answer}. ${getOptionText(question.answer)}` }}
            </div>
          </div>
          
          <div class="analysis">
            <div class="analysis-label">解析：</div>
            <div class="analysis-content">{{ question.explanation }}</div>
          </div>
        </div>
      </div>
      
      <!-- 判断题选项 -->
      <div v-else-if="question.type === 'boolean'" class="options">
        <div 
          v-for="option in ['正确', '错误']" 
          :key="option"
          class="option"
          :class="{ 
            selected: selectedOption === option,
            correct: showAnswer && option === question.answer,
            incorrect: showAnswer && selectedOption === option && option !== question.answer
          }"
          @click="!showAnswer && selectOption(option)"
        >
          {{ option }}
        </div>

        <!-- 添加判断题的答案和解析 -->
        <div v-if="showAnswer" class="answer-section">
          <div class="answer-box">
            <div class="answer-header">
              <span class="answer-label">你的答案：</span>
            </div>
            <div class="answer-content user-answer">
              {{ selectedOption || '未作答' }}
            </div>
          </div>
          
          <div class="answer-box">
            <div class="answer-header">
              <span class="answer-label">正确答案：</span>
            </div>
            <div class="answer-content reference-answer">
              {{ question.answer }}
            </div>
          </div>
          
          <div class="analysis">
            <div class="analysis-label">解析：</div>
            <div class="analysis-content">{{ question.explanation }}</div>
          </div>
        </div>
      </div>
      
      <!-- 简答题输入框 -->
      <div v-else class="text-answer">
        <textarea 
          v-model="textAnswer"
          placeholder="请输入你的答案"
          @input="updateAnswer"
          :disabled="showAnswer"
        ></textarea>
        
        <!-- 简答题的答案和解析部分 -->
        <div v-if="showAnswer" class="answer-section">
          <div class="answer-box">
            <div class="answer-header">
              <span class="answer-label">你的答案：</span>
            </div>
            <div class="answer-content user-answer">
              {{ textAnswer || '未作答' }}
            </div>
          </div>
          
          <div class="answer-box">
            <div class="answer-header">
              <span class="answer-label">参考答案：</span>
            </div>
            <div class="answer-content reference-answer">
              {{ question.answer }}
            </div>
          </div>
          
          <div class="analysis">
            <div class="analysis-label">解析：</div>
            <div class="analysis-content">{{ question.explanation }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QuestionCard',
  props: {
    question: {
      type: Object,
      required: true
    },
    showAnswer: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selectedOption: '',
      textAnswer: ''
    }
  },
  computed: {
    isCorrect() {
      const userAnswer = this.question.type === 'text' ? this.textAnswer : this.selectedOption
      return String(userAnswer) === String(this.question.answer)
    },
    userAnswer() {
      if (this.question.type === 'choice') {
        const option = this.question.options.find(opt => opt.label === this.selectedOption)
        return `${this.selectedOption}. ${option?.text || ''}`
      } else if (this.question.type === 'boolean') {
        return this.selectedOption
      } else {
        return this.textAnswer
      }
    }
  },
  methods: {
    getQuestionTypeText(type) {
      const types = {
        'choice': '选择题',
        'boolean': '判断题',
        'text': '简答题'
      }
      return types[type]
    },
    selectOption(option) {
      this.selectedOption = option
      this.$emit('answer-selected', {
        questionId: this.question.id,
        answer: option
      })
    },
    updateAnswer() {
      this.$emit('answer-selected', {
        questionId: this.question.id,
        answer: this.textAnswer
      })
    },
    getOptionText(label) {
      const option = this.question.options.find(opt => opt.label === label)
      return option ? option.text : ''
    }
  },
  watch: {
    'question.id'() {
      this.selectedOption = ''
      this.textAnswer = ''
    }
  }
}
</script>

<style scoped>
.question-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.question-number {
  color: #9e9e9e;
  font-size: 14px;
}

.question-type {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.question-title {
  color: #2c3e50;
  font-size: 18px;
  margin-bottom: 20px;
  line-height: 1.4;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option:hover {
  border-color: #bbdefb;
  background: #f8f9fa;
}

.option.selected {
  border-color: #2196f3;
  background: #e3f2fd;
}

.option-label {
  width: 24px;
  height: 24px;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-weight: 500;
  color: #616161;
}

.option.selected .option-label {
  background: #2196f3;
  color: white;
}

.option-text {
  font-size: 16px;
  color: #424242;
}

.text-answer {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.text-answer textarea {
  width: 100%;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  resize: vertical;
  min-height: 120px;
  font-size: 16px;
  line-height: 1.6;
  transition: all 0.2s ease;
  background-color: #fff;
}

.text-answer textarea:focus {
  border-color: #2196f3;
  outline: none;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.text-answer textarea:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.answer-box {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.answer-content {
  margin-top: 8px;
  padding: 12px;
  border-radius: 4px;
  font-size: 16px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.user-answer {
  background: #e3f2fd;
  color: #1976d2;
}

.reference-answer {
  background: #e8f5e9;
  color: #2e7d32;
}

.analysis {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

.analysis-label {
  font-weight: 500;
  color: #455a64;
  margin-bottom: 8px;
}

.analysis-content {
  color: #616161;
  line-height: 1.6;
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .question-card {
    padding: 16px;
  }
}

.answer-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.answer-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.answer-label {
  font-weight: 500;
  color: #455a64;
  margin-right: 8px;
}

.correct-text {
  color: #4caf50;
  font-weight: 500;
}

.incorrect-text {
  color: #f44336;
  font-weight: 500;
}

.option.correct {
  border-color: #4caf50;
  background: #e8f5e9;
}

.option.incorrect {
  border-color: #f44336;
  background: #ffebee;
}

.option.correct .option-label {
  background: #4caf50;
  color: white;
}

.option.incorrect .option-label {
  background: #f44336;
  color: white;
}
</style>