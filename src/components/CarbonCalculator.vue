<template>
     <div class="carbon-calculator-parent">
      <AppHeader 
      :username="user?.username || 'User'" 
      @logout="logout" 
    />
    <div class="carbon-calculator">
        <h1>Carbon Footprint Calculator <span class="flag-text">🇵🇭</span></h1>

      <p class="intro">Understand your environmental impact by calculating your carbon footprint across different categories.</p>
  
      <div class="calculator-container">
        <div class="calculator-form">
          <!-- Transportation Section -->
          <div class="calculator-section">
            <h2>🚗 Transportation</h2>
            
            <div class="form-group">
              <label for="carMiles">Car travel (miles/week):</label>
              <input type="number" id="carMiles" v-model.number="transportation.carMiles" min="0">
            </div>
            
            <div class="form-group">
              <label for="carType">Car type:</label>
              <select id="carType" v-model="transportation.carType">
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
                <option value="gasoline">Gasoline</option>
                <option value="diesel">Diesel</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="publicTransport">Public transportation (trips/week):</label>
              <input type="number" id="publicTransport" v-model.number="transportation.publicTransport" min="0">
            </div>
            
            <div class="form-group">
              <label for="flights">Flights per year:</label>
              <input type="number" id="flights" v-model.number="transportation.flights" min="0">
            </div>
          </div>
          
          <!-- Home Energy Section -->
          <div class="calculator-section">
            <h2>🏠 Home Energy</h2>
            
            <div class="form-group">
              <label for="electricityUsage">Monthly electricity usage (kWh):</label>
              <input type="number" id="electricityUsage" v-model.number="homeEnergy.electricity" min="0">
            </div>
            
            <div class="form-group">
              <label for="gasUsage">Monthly natural gas usage (therms):</label>
              <input type="number" id="gasUsage" v-model.number="homeEnergy.naturalGas" min="0">
            </div>
            
            <div class="form-group">
              <label for="renewablePercentage">Renewable energy percentage:</label>
              <input type="range" id="renewablePercentage" v-model.number="homeEnergy.renewablePercentage" min="0" max="100">
              <span>{{ homeEnergy.renewablePercentage }}%</span>
            </div>
          </div>
          
          <!-- Diet & Consumption Section -->
          <div class="calculator-section">
            <h2>🍽️ Diet & Consumption</h2>
            
            <div class="form-group">
              <label for="dietType">Diet type:</label>
              <select id="dietType" v-model="diet.type">
                <option value="vegan">Vegan</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="pescatarian">Pescatarian</option>
                <option value="omnivore">Omnivore</option>
                <option value="high_meat">High meat consumption</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="localFood">Local food consumption:</label>
              <select id="localFood" v-model="diet.localPercentage">
                <option value="0">Rarely buy local food (0-20%)</option>
                <option value="25">Sometimes buy local food (20-40%)</option>
                <option value="50">Half local food (40-60%)</option>
                <option value="75">Mostly local food (60-80%)</option>
                <option value="100">Almost all local food (80-100%)</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="wasteRecycled">Percentage of waste recycled:</label>
              <input type="range" id="wasteRecycled" v-model.number="consumption.recyclingPercentage" min="0" max="100">
              <span>{{ consumption.recyclingPercentage }}%</span>
            </div>
          </div>
          
          <button class="calculate-btn" @click="calculateFootprint">Calculate Footprint</button>
        </div>
  
        <div class="results-panel" v-if="showResults">
          <h2>Your Carbon Footprint</h2>
          <div class="footprint-total">
            <div class="footprint-value">{{ totalFootprint.toFixed(2) }}</div>
            <div class="footprint-unit">tonnes CO₂e / year</div>
          </div>
          
          <div class="footprint-comparison">
            <p>
              <span v-if="totalFootprint < 4">Your footprint is lower than the global average (4 tonnes).</span>
              <span v-else-if="totalFootprint < 16">Your footprint is near the global average (4-16 tonnes).</span>
              <span v-else>Your footprint is higher than the global average (4-16 tonnes).</span>
            </p>
          </div>
          
          <div class="footprint-breakdown">
            <h3>Breakdown by Category</h3>
            <div class="chart-container">
              <div class="bar-chart">
                <div class="bar transport" :style="{width: `${(results.transportation / totalFootprint) * 100}%`}">
                  <span class="bar-label">Transport: {{ results.transportation.toFixed(2) }}</span>
                </div>
                <div class="bar energy" :style="{width: `${(results.homeEnergy / totalFootprint) * 100}%`}">
                  <span class="bar-label">Energy: {{ results.homeEnergy.toFixed(2) }}</span>
                </div>
                <div class="bar food" :style="{width: `${(results.diet / totalFootprint) * 100}%`}">
                  <span class="bar-label">Food: {{ results.diet.toFixed(2) }}</span>
                </div>
                <div class="bar consumption" :style="{width: `${(results.consumption / totalFootprint) * 100}%`}">
                  <span class="bar-label">Consumption: {{ results.consumption.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="reduction-tips">
            <h3>Tips to Reduce Your Footprint</h3>
            <ul>
              <li v-for="(tip, index) in reductionTips" :key="index">{{ tip }}</li>
            </ul>
          </div>
          
          <button class="share-btn" @click="shareResults">Share Results</button>
          <button class="reset-btn" @click="resetCalculator">Reset Calculator</button>
        </div>
      </div>
    </div>
    <AppFooter />
  </div>
  </template>
  
  <script setup lang="ts">
    import AppHeader from '../views/Header.vue'
  import AppFooter from '../views/Footer.vue'
    import { useRouter } from 'vue-router'
  import { useAuthStore } from '../stores/auth'
  import { ref, computed } from 'vue';
  
  interface User {
    username: string;
    [key: string]: any;
  }

  const router = useRouter()
  const authStore = useAuthStore()
  
  const user = computed<User | null>(() => authStore.user as User | null)
  // Calculator state
  const transportation = ref({
    carMiles: 50,
    carType: 'gasoline',
    publicTransport: 5,
    flights: 2
  });
  
  const homeEnergy = ref({
    electricity: 500,
    naturalGas: 30,
    renewablePercentage: 10
  });
  
  const diet = ref({
    type: 'omnivore',
    localPercentage: 25
  });
  
  const consumption = ref({
    recyclingPercentage: 60
  });
  
  const showResults = ref(false);
  const results = ref({
    transportation: 0,
    homeEnergy: 0,
    diet: 0,
    consumption: 0
  });
  
  const totalFootprint = computed(() => {
    return results.value.transportation + 
           results.value.homeEnergy + 
           results.value.diet + 
           results.value.consumption;
  });
  
  const reductionTips = ref<string[]>([]);
  
  // Calculation methods
  const calculateFootprint = () => {
    // Transportation calculations
    let transportEmissions = 0;
    const carEmissionFactors = {
      'electric': 0.05,
      'hybrid': 0.1,
      'gasoline': 0.3,
      'diesel': 0.35
    };
    
    transportEmissions += transportation.value.carMiles * carEmissionFactors[transportation.value.carType as keyof typeof carEmissionFactors] * 52; // annual emissions
    transportEmissions += transportation.value.publicTransport * 0.05 * 52; // public transport
    transportEmissions += transportation.value.flights * 0.7; // flights
    
    // Home energy calculations
    let energyEmissions = 0;
    energyEmissions += homeEnergy.value.electricity * 0.0005 * 12 * (1 - homeEnergy.value.renewablePercentage / 100);
    energyEmissions += homeEnergy.value.naturalGas * 0.005 * 12;
    
    // Diet calculations
    let dietEmissions = 0;
    const dietEmissionFactors = {
      'vegan': 1.0,
      'vegetarian': 1.5,
      'pescatarian': 1.8,
      'omnivore': 2.5,
      'high_meat': 3.5
    };
    
    dietEmissions += dietEmissionFactors[diet.value.type as keyof typeof dietEmissionFactors];
    dietEmissions *= (1 - Number(diet.value.localPercentage) / 200); // Local food reduces impact
    
    // Consumption calculations
    let consumptionEmissions = 2.0; // Base consumption
    consumptionEmissions *= (1 - consumption.value.recyclingPercentage / 200); // Recycling reduces impact
    
    // Set results
    results.value = {
      transportation: transportEmissions,
      homeEnergy: energyEmissions,
      diet: dietEmissions,
      consumption: consumptionEmissions
    };
    
    // Generate reduction tips
    generateReductionTips();
    
    showResults.value = true;
  };
  
  const generateReductionTips = () => {
    reductionTips.value = [];
    
    // Transportation tips
    if (transportation.value.carType === 'gasoline' || transportation.value.carType === 'diesel') {
      reductionTips.value.push('Consider switching to a hybrid or electric vehicle to reduce emissions.');
    }
    if (transportation.value.carMiles > 100) {
      reductionTips.value.push('Try carpooling or using public transportation to reduce your driving miles.');
    }
    if (transportation.value.flights > 3) {
      reductionTips.value.push('Consider alternatives to flying or combine trips to reduce your air travel.');
    }
    
    // Energy tips
    if (homeEnergy.value.renewablePercentage < 50) {
      reductionTips.value.push('Switch to a renewable energy provider or install solar panels.');
    }
    if (homeEnergy.value.electricity > 600) {
      reductionTips.value.push('Use energy-efficient appliances and LED lighting to reduce electricity consumption.');
    }
    
    // Diet tips
    if (diet.value.type === 'high_meat' || diet.value.type === 'omnivore') {
      reductionTips.value.push('Reducing meat consumption, especially red meat, can significantly lower your carbon footprint.');
    }
    if (Number(diet.value.localPercentage) < 50) {
      reductionTips.value.push('Buy more local and seasonal food to reduce transportation emissions.');
    }
    
    // Consumption tips
    if (consumption.value.recyclingPercentage < 70) {
      reductionTips.value.push('Increase your recycling and composting efforts to reduce waste emissions.');
    }
    
    // Add general tips if we don't have many specific ones
    if (reductionTips.value.length < 3) {
      reductionTips.value.push('Consider adopting a more plant-based diet to reduce your environmental impact.');
      reductionTips.value.push('Reduce, reuse, and recycle to minimize your consumption footprint.');
    }
  };
  
  const shareResults = () => {
    // In a real app, this would implement social sharing functionality
    alert(`Your carbon footprint is ${totalFootprint.value.toFixed(2)} tonnes CO₂e per year. Share this result with your friends and challenge them to calculate theirs!`);
  };
  
  const resetCalculator = () => {
    transportation.value = { carMiles: 50, carType: 'gasoline', publicTransport: 5, flights: 2 };
    homeEnergy.value = { electricity: 500, naturalGas: 30, renewablePercentage: 10 };
    diet.value = { type: 'omnivore', localPercentage: 25 };
    consumption.value = { recyclingPercentage: 60 };
    showResults.value = false;
  };

  

  const logout = () => {
    authStore.logout()
    router.push('/login')
  }
  </script>
  
  <style scoped>

.carbon-calculator-parent {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

  .carbon-calculator {
    max-width: 1200px;
    margin: 0 auto;
    padding: 30px 20px;
    color: #333;
  }
  
  h1 {
    font-size: 2.2rem;
    color: #2E7D32;
    text-align: center;
    margin-bottom: 15px;
  }
  
  .intro {
    text-align: center;
    margin-bottom: 30px;
    font-size: 1.1rem;
    color: #555;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }
  
  .calculator-container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 30px;
  }
  
  @media (min-width: 1024px) {
    .calculator-container {
      grid-template-columns: 1fr 1fr;
    }
  }
  
  .calculator-form {
    background-color: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    padding: 30px;
  }
  
  .calculator-section {
    margin-bottom: 30px;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 25px;
  }
  
  .calculator-section:last-of-type {
    border-bottom: none;
  }
  
  .calculator-section h2 {
    font-size: 1.5rem;
    color: #2E7D32;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #444;
  }
  
  input[type="number"],
  input[type="range"],
  select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
  }
  
  input[type="range"] {
    height: 10px;
    -webkit-appearance: none;
    margin: 10px 0;
    background: #f0f0f0;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #2E7D32;
    cursor: pointer;
  }
  
  select {
    background-color: white;
  }
  
  .calculate-btn {
    background: linear-gradient(90deg, #43A047, #66BB6A);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: block;
    width: 100%;
    margin-top: 20px;
    font-weight: 600;
  }
  
  .calculate-btn:hover {
    background: linear-gradient(90deg, #2E7D32, #43A047);
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(67, 160, 71, 0.3);
  }
  
  /* Results section styling */
  .results-panel {
    background-color: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    padding: 30px;
  }
  
  .results-panel h2 {
    font-size: 1.8rem;
    color: #2E7D32;
    margin-bottom: 20px;
    text-align: center;
  }
  
  .footprint-total {
    text-align: center;
    margin-bottom: 30px;
  }
  
  .footprint-value {
    font-size: 3.5rem;
    font-weight: 700;
    color: #2E7D32;
  }
  
  .footprint-unit {
    font-size: 1.2rem;
    color: #666;
    margin-top: 5px;
  }
  
  .footprint-comparison {
    text-align: center;
    background-color: #f1f8e9;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 30px;
  }
  
  .footprint-breakdown {
    margin-bottom: 30px;
  }
  
  .footprint-breakdown h3 {
    font-size: 1.4rem;
    color: #2E7D32;
    margin-bottom: 15px;
  }
  
  .chart-container {
    margin-top: 20px;
  }
  
  .bar-chart {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .bar {
    height: 35px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    padding-left: 10px;
    color: white;
    font-weight: 500;
    transition: width 1s ease-out;
    min-width: 160px;
  }
  
  .bar-label {
    white-space: nowrap;
  }
  
  .transport {
    background-color: #2E7D32;
  }
  
  .energy {
    background-color: #43A047;
  }
  
  .food {
    background-color: #66BB6A;
  }
  
  .consumption {
    background-color: #81C784;
  }
  
  .reduction-tips {
    background-color: #f1f8e9;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
  }
  
  .reduction-tips h3 {
    font-size: 1.4rem;
    color: #2E7D32;
    margin-bottom: 15px;
  }
  
  .reduction-tips ul {
    padding-left: 20px;
  }
  
  .reduction-tips li {
    margin-bottom: 10px;
    line-height: 1.5;
  }
  
  .share-btn, .reset-btn {
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .share-btn {
    background: linear-gradient(90deg, #43A047, #66BB6A);
    color: white;
    border: none;
    margin-right: 10px;
  }
  
  .reset-btn {
    background: transparent;
    border: 2px solid #66BB6A;
    color: #2E7D32;
  }
  
  .share-btn:hover {
    background: linear-gradient(90deg, #2E7D32, #43A047);
    transform: translateY(-2px);
  }
  
  .reset-btn:hover {
    background-color: rgba(102, 187, 106, 0.1);
  }
  
  @media (max-width: 768px) {
    .share-btn, .reset-btn {
      width: 100%;
      margin-bottom: 10px;
      margin-right: 0;
    }
  }
  </style>