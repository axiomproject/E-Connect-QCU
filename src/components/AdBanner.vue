<!-- filepath: src/components/AdBanner.vue -->
<template>
  <div v-if="visible" class="ad-banner">
    <button class="close-btn" @click="visible = false" aria-label="Close Ad">&times;</button>
    <a
      href="https://www.wwf.org.ph/"
      target="_blank"
      rel="noopener noreferrer"
      class="ad-banner-link"
      tabindex="0"
      @click="recordAdClick"
      style="display: flex; flex: 1; align-items: center; justify-content: center; text-decoration: none; color: inherit;"
    >
      <div class="ad-collage-container">
        <div class="ad-collage-text">{{ ad.text }}</div>
        <div class="ad-collage">
          <img
            v-for="(img, idx) in ad.images"
            :key="idx"
            :src="img"
            alt="Ad"
            class="ad-collage-image"
            draggable="false"
          />
        </div>
      </div>
    </a>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const ads = [
  {
    text: 'Go Green: Switch to Renewable Energy Today!',
    images: [
      '/ads/ad1/1.jpg', // Local image from public folder
      '/ads/ad1/2.jpg', // Local image from public folder
      '/ads/ad1/3.jpg', // Local image from public folder
      '/ads/ad1/4.jpg'  // Local image from public folder
    ]
  },
  {
    text: 'Join the Movement: Recycle, Reuse, Restore!',
    images: [
      '/ads/ad1/1.jpg',
      '/ads/ad2/4.jpg',
      '/ads/ad1/3.jpg',
      '/ads/ad1/2.jpg'
    ]
  },
  {
    text: 'Protect Our Planet: Support Eco-Friendly Initiatives!',
    images: [
      '/ads/ad1/3.jpg',
      '/ads/ad1/1.jpg',
      '/ads/ad2/2.jpeg',
      '/ads/ad1/4.jpg'
    ]
  }
]

const ad = ref(ads[0])
const visible = ref(true)

onMounted(() => {
  ad.value = ads[Math.floor(Math.random() * ads.length)]
})

// Record ad click to backend
const recordAdClick = async () => {
  try {
    await fetch('/api/ad-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adName: ad.value.text })
    });
  } catch (e) {
    // Fail silently
  }
}
</script>

<style scoped>
.ad-banner {
  background: linear-gradient(90deg, #e0f7fa70 0%, #e8f5e9a1 100%);
  border: 1.5px solid #b2dfdb;
  border-radius: 14px;
  margin: 24px 0;
  padding: 0;
  text-align: center;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  box-shadow: 0 4px 24px 0 rgba(44, 62, 80, 0.07);
  overflow: hidden;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ad-collage-container {
  position: relative;
  width: 100%;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ad-collage-text {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  transform: translate(-50%, -50%);
  color: #fff;
  background: rgba(34, 139, 34, 0.712);
  padding: 10px 32px;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.12);
  pointer-events: none;
  text-align: center;
  max-width: 95vw;
  white-space: pre-line;
  line-height: 1.3;
  word-break: break-word;
}

.ad-collage {
  display: flex;
  width: 100%;
  height: 90px;
  gap: 0;
}

.ad-collage-image {
  flex: 1 1 0;
  width: 0;
  height: 100%;
  object-fit: cover;
  border-radius: 0;
  box-shadow: none;
  margin: 0;
  user-select: none;
  pointer-events: none;
  min-width: 0;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 16px;
  background: #fff;
  border: none;
  font-size: 1.6rem;
  color: #888;
  cursor: pointer;
  z-index: 3;
  line-height: 1;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.08);
  transition: background 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
}
.close-btn:hover, .close-btn:focus {
  background: #ffebee;
  color: #d32f2f;
  outline: none;
}

.ad-banner-link {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: inherit;
  outline: none;
}

.ad-banner-link:focus .ad-collage-text,
.ad-banner-link:hover .ad-collage-text {
  background: rgba(34, 139, 34, 0.85);
  box-shadow: 0 2px 12px rgba(44, 62, 80, 0.18);
  text-decoration: underline;
}

@media (max-width: 900px) {
  .ad-collage-container,
  .ad-collage {
    height: 70px;
  }
  .ad-collage-text {
    font-size: 1rem;
    padding: 7px 10px;
  }
}

@media (max-width: 600px) {
  .ad-banner {
    margin: 12px 0;
    border-radius: 8px;
  }
  .ad-collage-container,
  .ad-collage {
    height: 48px;
    min-height: 40px;
  }
  .ad-collage-text {
    font-size: 0.85rem;
    padding: 4px 6px;
    max-width: 98vw;
    border-radius: 5px;
  }
  .close-btn {
    top: 4px;
    right: 6px;
    width: 24px;
    height: 24px;
    font-size: 1rem;
  }
}
</style>