// Firebase Configuration for Enriched Properties LLC
// This uses a demo Firebase project for GitHub Pages compatibility
// For production, replace with your own Firebase project credentials

const firebaseConfig = {
  apiKey: "AIzaSyDw8Olub7Wq9AFcBNrGvvPpn_6Xv6IuFZA",
  authDomain: "enriched-properties.firebaseapp.com",
  projectId: "enriched-properties",
  storageBucket: "enriched-properties.firebasestorage.app",
  messagingSenderId: "380628046443",
  appId: "1:380628046443:web:d9640ef57dc1af997e172e",
  measurementId: "G-FDLDKD8NCM"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the Firestore service
const db = firebase.firestore();

// Cloud storage functions
const CloudStorage = {
  // Save data to cloud
  async saveData(path, data) {
    try {
      // Save to localStorage as backup
      localStorage.setItem(`enrichedProps${path}`, JSON.stringify(data));
      
      // Save to Firestore:
      await db.collection(path).doc('data').set({ items: data });
      
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
      // For now, load from localStorage
      const localData = localStorage.getItem(`enrichedProps${path}`);
      
      // Load from Firestore:
      const doc = await db.collection(path).doc('data').get();
      if (doc.exists) {
        return doc.data().items || defaultValue;
      }
      
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
      
      // Firestore real-time listeners:
      db.collection(path).doc('data').onSnapshot((doc) => {
        if (doc.exists) {
          callback(doc.data().items || []);
        }
      });
      
    } catch (error) {
      console.error('Error setting up real-time listener:', error);
    }
  }
};

// Export for use in other files
window.CloudStorage = CloudStorage;
