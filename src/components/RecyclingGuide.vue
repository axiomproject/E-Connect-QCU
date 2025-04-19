<template>
  <div class="recycling-guide">
    <!-- Replace Header with AppHeader and pass required username prop -->
    <AppHeader 
      :username="user?.username || 'User'" 
      @logout="logout" 
    />
    
    <!-- Rest of your RecyclingGuide content -->
    <main class="recycling-guide-content">
      <div class="guide-header">
        <h1>♻️ Recycling Guide</h1>
        <p>Learn how to properly recycle different materials to help protect our planet.</p>
      </div>

      <div class="search-container">
        <input 
          type="text" 
          v-model="searchTerm" 
          placeholder="Search for recyclable items..."
          class="search-input"
        />
      </div>

      <div class="categories-container">
        <transition-group name="recycling-list" tag="div" class="categories-grid">
          <div 
            v-for="category in filteredCategories" 
            :key="category.id" 
            class="category-card"
            :class="{ 'expanded': expandedCategory === category.id }"
            @click="toggleCategory(category.id)"
          >
            <div class="card-header">
              <div class="icon-container" :style="{ backgroundColor: category.color }">
                <img v-if="category.icon" :src="category.icon" :alt="category.title" class="category-icon">
                <span v-else class="emoji-icon">{{ category.emoji }}</span>
              </div>
              <h2>{{ category.title }}</h2>
            </div>
            <div class="card-content">
              <p class="description">{{ category.description }}</p>
              <div class="tips-section">
                <h3>Tips:</h3>
                <ul>
                  <li v-for="(tip, index) in category.tips" :key="index">{{ tip }}</li>
                </ul>
              </div>
              <div class="examples-section">
                <h3>Examples:</h3>
                <div class="examples-grid">
                  <div v-for="(example, index) in category.examples" :key="index" class="example-item">
                    <span class="example-emoji">{{ example.emoji }}</span>
                    <span class="example-name">{{ example.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition-group>
      </div>
    </main>
    
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppHeader from '../views/Header.vue'
import AppFooter from '../views/Footer.vue'

// Define types
interface Example {
  emoji: string;
  name: string;
}

interface Category {
  id: number;
  title: string;
  emoji: string;
  icon?: string;
  color: string;
  description: string;
  tips: string[];
  examples: Example[];
}

const auth = useAuthStore()
const router = useRouter()
const user = auth.user
const searchTerm = ref('')
const expandedCategory = ref<number | null>(null)

// Data
const categories: Category[] = [
        {
          id: 1,
          title: 'Paper & Cardboard',
          emoji: '📄',
          color: '#4b93d1',
          description: 'Clean paper and cardboard items can be recycled to create new paper products.',
          tips: [
            'Remove tape, staples, and plastic covers before recycling',
            'Flatten cardboard boxes to save space',
            'Keep paper dry and clean'
          ],
          examples: [
            { emoji: '📰', name: 'Newspapers' },
            { emoji: '📦', name: 'Cardboard boxes' },
            { emoji: '📚', name: 'Magazines' },
            { emoji: '📋', name: 'Notepads' }
          ]
        },
        {
          id: 2,
          title: 'Plastic',
          emoji: '🥤',
          color: '#4CAF50',
          description: 'Many plastic items can be recycled, but it depends on the type of plastic.',
          tips: [
            'Check the recycling number (1-7) at the bottom of containers',
            'Rinse containers before recycling',
            'Remove caps and lids'
          ],
          examples: [
            { emoji: '🍶', name: 'Bottles' },
            { emoji: '🥫', name: 'Containers' },
            { emoji: '🧴', name: 'Toiletry bottles' },
            { emoji: '🛍️', name: 'Clean shopping bags' }
          ]
        },
        {
          id: 3,
          title: 'Glass',
          emoji: '🍾',
          color: '#9C27B0',
          description: 'Glass is 100% recyclable and can be recycled endlessly without loss in quality.',
          tips: [
            'Rinse bottles and jars before recycling',
            'Remove caps and lids',
            'Sort by color if required in your area'
          ],
          examples: [
            { emoji: '🍷', name: 'Wine bottles' },
            { emoji: '🥛', name: 'Glass jars' },
            { emoji: '🍯', name: 'Food containers' },
            { emoji: '💡', name: 'Light bulbs (special)' }
          ]
        },
        {
          id: 4,
          title: 'Metal',
          emoji: '🥫',
          color: '#FF9800',
          description: 'Metals like aluminum and steel can be recycled indefinitely without degrading.',
          tips: [
            'Rinse food residue before recycling',
            'Crush cans to save space',
            'Remove paper labels when possible'
          ],
          examples: [
            { emoji: '🥫', name: 'Food cans' },
            { emoji: '🥤', name: 'Soda cans' },
            { emoji: '🍫', name: 'Foil wrapping' },
            { emoji: '🔧', name: 'Metal tools' }
          ]
        },
                {
                  id: 5,
                  title: 'Electronic Waste',
                  emoji: '📱',
                  color: '#F44336',
                  description: 'Electronic waste contains valuable materials that can be recovered and reused.',
                  tips: [
                    'Never throw electronics in regular trash',
                    'Use dedicated e-waste collection centers',
                    'Remove batteries before recycling'
                  ],
                  examples: [
                    { emoji: '💻', name: 'Computers' },
                    { emoji: '📱', name: 'Phones' },
                    { emoji: '🖨️', name: 'Printers' },
                    { emoji: '🔋', name: 'Batteries' }
                  ]
                },
                        {
                          id: 6,
                          title: 'Organic Waste',
                          emoji: '🍃',
                          color: '#8BC34A',
                          description: 'Food scraps and yard waste can be composted to create nutrient-rich soil.',
                          tips: [
                            'Separate food waste from regular trash',
                            'Compost fruit and vegetable scraps',
                            'Keep a small compost bin in your kitchen'
                          ],
                          examples: [
                            { emoji: '🍎', name: 'Fruit scraps' },
                            { emoji: '🥬', name: 'Vegetable trimmings' },
                            { emoji: '☕', name: 'Coffee grounds' },
                            { emoji: '🍂', name: 'Yard waste' }
                          ]
                        }
                ];
        
                const filteredCategories = computed(() => {
                  if (!searchTerm.value) return categories;
                  
                  const search = searchTerm.value.toLowerCase();
                  return categories.filter((category) => {
                    // Search in title and description
                    if (category.title.toLowerCase().includes(search) || 
                        category.description.toLowerCase().includes(search)) {
                      return true;
                    }
                    
                    // Search in examples
                    const exampleMatch = category.examples.some((ex) => 
                      ex.name.toLowerCase().includes(search)
                    );
                    
                    return exampleMatch;
                  });
                });
                
                // Methods
                const toggleCategory = (id: number) => {
                  expandedCategory.value = expandedCategory.value === id ? null : id;
                };
                
                // Navigation
                const logout = () => {
                  auth.logout();
                  router.push('/login');
                };
        </script>

<style scoped>
.recycling-guide {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.recycling-guide-content {
  flex: 1;
  /* Other styling as needed */
}

/* Guide header */
.guide-header {
  margin-top: 2rem;
  text-align: center;
  margin-bottom: 30px;
}

.guide-header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 10px;
}

.guide-header p {
  font-size: 1.2rem;
  color: #7f8c8d;
  max-width: 600px;
  margin: 0 auto;
}

/* Search container */
.search-container {
  margin-bottom: 30px;
  display: flex;
  justify-content: center;
  width: 90%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.search-input {
  width: 100%;
  max-width: 500px;
  padding: 12px 20px;
  font-size: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  outline: none;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: #3498db;
  box-shadow: 0 0 8px rgba(52, 152, 219, 0.3);
}

/* Categories container */
.categories-container {
  width: 90%;
  max-width: 1200px;
  margin: 20px auto;
  padding: 0;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

/* Category cards */
.category-card {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Expanded card state */
.category-card.expanded {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr 3fr;
  margin-bottom: 1rem;
}

/* Card header */
.card-header {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #f8f9fa;
}

.expanded .card-header {
  padding: 20px;
}

.icon-container {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  flex-shrink: 0;
}

.category-icon {
  width: 30px;
  height: 30px;
}

.emoji-icon {
  font-size: 1.8rem;
}

.card-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #2c3e50;
}

/* Card content */
.card-content {
  padding: 15px;
  display: none;
}

.expanded .card-content {
  display: block;
  padding: 20px;
}

.description {
  margin-bottom: 20px;
  line-height: 1.6;
  color: #34495e;
}

/* Tips section */
.tips-section {
  margin-bottom: 20px;
}

.tips-section h3 {
  font-size: 1.1rem;
  margin-bottom: 10px;
  color: #2c3e50;
}

.tips-section ul {
  padding-left: 20px;
}

.tips-section li {
  margin-bottom: 8px;
  line-height: 1.4;
}

/* Examples section */
.examples-section h3 {
  font-size: 1.1rem;
  margin-bottom: 15px;
  color: #2c3e50;
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.example-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
}

.example-emoji {
  font-size: 2rem;
  margin-bottom: 8px;
}

.example-name {
  font-size: 0.9rem;
  color: #34495e;
}

/* Transitions */
.recycling-list-enter-active,
.recycling-list-leave-active {
  transition: all 0.5s;
}

.recycling-list-enter-from,
.recycling-list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

/* Responsive design */
@media (max-width: 768px) {
  .category-card.expanded {
    grid-template-columns: 1fr;
  }

  .guide-header h1 {
    font-size: 2rem;
  }

  .guide-header p {
    font-size: 1rem;
  }

  .examples-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}

</style>