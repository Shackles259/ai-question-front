<template>
  <div class="result-card">
    <div class="result-header">
      <h3 class="question-title">{{ question.title }}</h3>
      <div class="result-status" :class="isCorrect ? 'correct' : 'incorrect'">
        {{ isCorrect ? '回答正确' : '回答错误' }}
      </div>
    </div>
    
    <div class="answer-section">
      <div class="answer-box your-answer">
        <h4>
          <i class="fas fa-user"></i>
          你的答案
        </h4>
        <p>{{ userAnswer }}</p>
      </div>
      
      <div class="answer-box correct-answer">
        <h4>
          <i class="fas fa-check-circle"></i>
          正确答案
        </h4>
        <p>{{ question.answer }}</p>
      </div>
      
      <div class="explanation">
        <h4>
          <i class="fas fa-book-open"></i>
          解析
        </h4>
        <div class="explanation-content">
          <p>{{ question.explanation }}</p>
          <div v-if="analysis" class="additional-analysis">
            <h5>详细说明：</h5>
            <p>{{ analysis.detail }}</p>
            <div v-if="analysis.references" class="references">
              <h5>参考资料：</h5>
              <ul>
                <li v-for="(ref, index) in analysis.references" :key="index">
                  <a :href="ref.url" target="_blank">{{ ref.title }}</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResultCard',
  props: {
    question: {
      type: Object,
      required: true
    },
    userAnswer: {
      type: [String, Boolean],
      required: true
    },
    analysis: {
      type: Object,
      default: null
    }
  },
  computed: {
    isCorrect() {
      return String(this.userAnswer) === String(this.question.answer)
    }
  }
}
</script>

<style scoped>
.result-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 16px;
}

.question-title {
  color: #2c3e50;
  font-size: 18px;
  margin: 0;
  flex: 1;
}

.result-status {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.result-status.correct {
  background: #e8f5e9;
  color: #2e7d32;
}

.result-status.incorrect {
  background: #ffebee;
  color: #c62828;
}

.answer-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.answer-box {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.answer-box h4 {
  color: #455a64;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.answer-box p {
  color: #37474f;
  line-height: 1.6;
  margin: 0;
}

.your-answer {
  border-left: 4px solid #42a5f5;
}

.correct-answer {
  border-left: 4px solid #66bb6a;
}

.explanation {
  background: #fff3e0;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #ffa726;
}

.explanation h4 {
  color: #e65100;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.explanation p {
  color: #424242;
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 768px) {
  .result-header {
    flex-direction: column;
  }
  
  .result-status {
    align-self: flex-start;
  }
}

.additional-analysis {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #ffd8a6;
}

.additional-analysis h5 {
  color: #e65100;
  margin-bottom: 8px;
  font-size: 14px;
}

.references {
  margin-top: 12px;
}

.references ul {
  list-style: none;
  padding: 0;
}

.references li {
  margin: 4px 0;
}

.references a {
  color: #1976d2;
  text-decoration: none;
}

.references a:hover {
  text-decoration: underline;
}

.explanation-content {
  line-height: 1.6;
}
</style>