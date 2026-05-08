<template>
  <div class="pomodoro-container">
    <h1 class="title">🍅 番茄时钟</h1>
    
    <div class="timer-display">
      <div class="timer-circle">
        <svg class="progress-ring" viewBox="0 0 100 100">
          <circle
            class="progress-ring-bg"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            stroke-width="6"
          />
          <circle
            class="progress-ring-bar"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            :stroke="currentColor"
            stroke-width="6"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeDashoffset"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div class="time-text">
          <span class="minutes">{{ formattedMinutes }}</span>
          <span class="separator">:</span>
          <span class="seconds">{{ formattedSeconds }}</span>
        </div>
      </div>
    </div>

    <div class="mode-tabs">
      <a-button
        v-for="mode in modes"
        :key="mode.name"
        :type="currentMode === mode.name ? 'primary' : 'default'"
        @click="switchMode(mode.name)"
        :style="{ backgroundColor: currentMode === mode.name ? mode.color : undefined }"
      >
        {{ mode.label }}
      </a-button>
    </div>

    <div class="controls">
      <a-button
        type="primary"
        size="large"
        :icon="h(isRunning ? PauseCircleOutlined : PlayCircleOutlined)"
        @click="toggleTimer"
        :style="{ backgroundColor: currentColor }"
      >
        {{ isRunning ? '暂停' : '开始' }}
      </a-button>
      <a-button
        size="large"
        :icon="h(ReloadOutlined)"
        @click="resetTimer"
      >
        重置
      </a-button>
    </div>

    <div class="stats">
      <a-statistic title="今日完成" :value="completedPomodoros" suffix="个番茄" />
    </div>

    <div class="settings">
      <a-space direction="vertical" :style="{ width: '100%' }">
        <a-form-item label="工作时长(分钟)">
          <a-input-number
            v-model:value="workMinutes"
            :min="1"
            :max="60"
            :disabled="isRunning"
          />
        </a-form-item>
        <a-form-item label="休息时长(分钟)">
          <a-input-number
            v-model:value="breakMinutes"
            :min="1"
            :max="30"
            :disabled="isRunning"
          />
        </a-form-item>
      </a-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, h } from 'vue'
import { PauseCircleOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons-vue'

const icons = { PauseCircleOutlined, PlayCircleOutlined, ReloadOutlined }
void icons

interface Mode {
  name: string
  label: string
  color: string
}

const modes: Mode[] = [
  { name: 'work', label: '工作', color: '#ff6b6b' },
  { name: 'break', label: '休息', color: '#4ecdc4' }
]

const currentMode = ref<'work' | 'break'>('work')
const isRunning = ref(false)
const remainingSeconds = ref(25 * 60)
const completedPomodoros = ref(0)
const workMinutes = ref(25)
const breakMinutes = ref(5)

let timerInterval: ReturnType<typeof setInterval> | null = null
let endTime: number = 0 // 倒计时结束的时间戳

const totalSeconds = computed(() => {
  return currentMode.value === 'work' ? workMinutes.value * 60 : breakMinutes.value * 60
})

const formattedMinutes = computed(() => {
  return String(Math.floor(remainingSeconds.value / 60)).padStart(2, '0')
})

const formattedSeconds = computed(() => {
  return String(remainingSeconds.value % 60).padStart(2, '0')
})

const currentColor = computed(() => {
  return modes.find(m => m.name === currentMode.value)?.color || '#ff6b6b'
})

const circumference = 2 * Math.PI * 45

const strokeDashoffset = computed(() => {
  const progress = remainingSeconds.value / totalSeconds.value
  return circumference * (1 - progress)
})

const switchMode = (mode: string) => {
  if (!isRunning.value) {
    currentMode.value = mode as 'work' | 'break'
    remainingSeconds.value = totalSeconds.value
  }
}

const toggleTimer = () => {
  isRunning.value = !isRunning.value
  
  if (isRunning.value) {
    startTimer()
  } else {
    stopTimer()
  }
}

const startTimer = () => {
  // 计算结束时间戳 = 当前时间 + 剩余秒数
  endTime = Date.now() + remainingSeconds.value * 1000

  // 立即更新一次剩余时间
  updateRemainingTime()

  timerInterval = setInterval(() => {
    updateRemainingTime()
  }, 1000)
}

const updateRemainingTime = () => {
  const now = Date.now()
  const diff = endTime - now

  if (diff <= 0) {
    remainingSeconds.value = 0
    handleTimerComplete()
  } else {
    remainingSeconds.value = Math.ceil(diff / 1000)
  }
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const resetTimer = () => {
  stopTimer()
  isRunning.value = false
  remainingSeconds.value = totalSeconds.value
}

const handleTimerComplete = () => {
  stopTimer()
  
  if (currentMode.value === 'work') {
    completedPomodoros.value++
    playNotificationSound()
  }
  
  currentMode.value = currentMode.value === 'work' ? 'break' : 'work'
  remainingSeconds.value = totalSeconds.value
  
  setTimeout(() => {
    isRunning.value = true
    startTimer()
  }, 1000)
}

const playNotificationSound = () => {
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.value = 800
  oscillator.type = 'sine'
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.5)
}

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.pomodoro-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.title {
  font-size: 28px;
  color: #333;
  margin-bottom: 30px;
  font-weight: 600;
}

.timer-display {
  margin-bottom: 30px;
}

.timer-circle {
  position: relative;
  width: 220px;
  height: 220px;
  margin: 0 auto;
}

.progress-ring {
  width: 100%;
  height: 100%;
}

.progress-ring-bar {
  transition: stroke-dashoffset 0.5s ease;
}

.time-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px;
  font-weight: 700;
  color: #333;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
}

.separator {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.mode-tabs {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 30px;
}

.mode-tabs :deep(.ant-btn) {
  border-radius: 20px;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 30px;
}

.controls :deep(.ant-btn) {
  border-radius: 12px;
}

.stats {
  margin-bottom: 30px;
}

.settings {
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.settings :deep(.ant-form-item) {
  margin-bottom: 12px;
}

.settings :deep(.ant-input-number) {
  width: 100%;
}
</style>