// Firebase Configuration for Enriched Properties LLC
// This uses a demo Firebase project for GitHub Pages compatibility
// For production, replace with your own Firebase project credentials

const firebaseConfig = {
  apiKey: "AIzaSyDemo_Replace_With_Your_API_Key",
  authDomain: "enriched-properties-demo.firebaseapp.com",
  databaseURL: "https://enriched-properties-demo-default-rtdb.firebaseio.com/",
  projectId: "enriched-properties-demo",
  storageBucket: "enriched-properties-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345678"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database();

// Cloud storage functions
const CloudStorage = {
  // Save data to cloud
  async saveData(path, data) {
    try {
      // For demo purposes, also save to localStorage as backup
      localStorage.setItem(`enrichedProps${path}`, JSON.stringify(data));
      
      // In production, this would save to Firebase:
      // await database.ref(path).set(data);
      
      console.log(`Data saved to ${path}`);
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  },

  // Load data from cloud
  async loadData(path, defaultValue = []) {
    try {
      // For demo purposes, load from localStorage
      const localData = localStorage.getItem(`enrichedProps${path}`);
      
      // In production, this would load from Firebase:
      // const snapshot = await database.ref(path).once('value');
      // return snapshot.val() || defaultValue;
      
      return localData ? JSON.parse(localData) : defaultValue;
    } catch (error) {
      console.error('Error loading data:', error);
      return defaultValue;
    }
  },

  // Listen for real-time updates
  onDataChange(path, callback) {
    try {
      // For demo purposes, use storage event listener for cross-tab communication
      window.addEventListener('storage', (e) => {
        if (e.key === `enrichedProps${path}`) {
          const newData = e.newValue ? JSON.parse(e.newValue) : [];
          callback(newData);
        }
      });
      
      // In production, this would use Firebase real-time listeners:
      // database.ref(path).on('value', (snapshot) => {
      //   callback(snapshot.val() || []);
      // });
      
    } catch (error) {
      console.error('Error setting up real-time listener:', error);
    }
  }
};

// Export for use in other files
window.CloudStorage = CloudStorage;
