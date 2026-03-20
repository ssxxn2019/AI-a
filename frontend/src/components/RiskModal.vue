<script setup>
const emit = defineEmits(['close'])

const acknowledge = () => {
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
    <div class="bg-white rounded-2xl max-w-md w-full shadow-2xl">
      <div class="p-6">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-4xl">⚠️</span>
          <h2 class="text-xl font-bold text-red-600">重要风险提示</h2>
        </div>
        <div class="space-y-3 text-gray-700">
          <p class="leading-relaxed">
            <strong>尊敬的投资者：</strong>
          </p>
          <p class="leading-relaxed">
            本平台所有数据仅供参考，不构成任何投资建议。股市有风险，投资需谨慎。
          </p>
          <ul class="list-disc list-inside space-y-2 text-sm">
            <li class="text-red-600">短线交易风险极高，可能造成重大损失</li>
            <li>新手用户建议先学习基础知识，模拟操作后再入场</li>
            <li>请根据自身风险承受能力理性投资</li>
            <li>本平台不保证收益，不承担任何投资损失</li>
          </ul>
          <p class="text-xs text-gray-500 mt-4">
            点击"我已知晓"即表示您已阅读并理解上述风险提示。
          </p>
        </div>
      </div>
      <div class="bg-gray-50 px-6 py-4 rounded-b-2xl">
        <button
          @click="acknowledge"
          class="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          我已知晓，继续使用
        </button>
      </div>
    </div>
  </div>
</template>
