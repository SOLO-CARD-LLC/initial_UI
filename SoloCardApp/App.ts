import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';

export default function App() {
  const [currentPage, setCurrentPage] = useState('start');
  const [isLoading, setIsLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Ready to choose the best card');
  const [placeData, setPlaceData] = useState(null);
  const [cardSuggestion, setCardSuggestion] = useState(null);

  // AWS Configuration
  const AWS_CONFIG = {
    region: 'us-east-1',
    apiKey: "v1.public.eyJqdGkiOiJiMjA4OWI1ZC04NTdhLTQ1ZmItODMyMi1lNDBiZGFlNjU4MzAifX_P2iL1pjUIVJwXsiWyX7jXQt5NZvGyaAPQXdv76FcdC7pfVbX5-Fn-LfqMKp9ROeQPp3N7m3fu4_AdYhzqpxoCzZaSFQ6wuFlJYuHztZsTRifGtPLs15CSVampJnxmp636X5Oj6Zf22FkrFDJ3s50uwxQfUo28HUW9h3IbLYHCBhfE0u9CfHQhy3T_XIqj2sl0eieo3PZu50rEQvgS3Jiy2LZ4QJ0k6UXIKqN_FB-2rvy5CZKl37n8cLH1d1138Vc8V--cQ71eEGUPsQHJ-2HraofNUp4KoOcBlrb1C46XCNP2nm1i3DidHX3sdJcpg0pUEQDOabBzc6zC07pbctA.ZWU0ZWIzMTktMWRhNi00Mzg0LTllMzYtNzlmMDU3MjRmYTkx",
    endpoint: 'https://places.geo.us-east-1.amazonaws.com'
  };

  // AWS Location Service API call
  const reverseGeocode = async (latitude, longitude) => {
    try {
      console.log('🗺️ Calling Amazon Location Service...');
      console.log(`Coordinates: ${latitude}, ${longitude}`);
      
      const response = await fetch(`${AWS_CONFIG.endpoint}/v2/search-nearby?key=${AWS_CONFIG.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          QueryPosition: [longitude, latitude], // Note: AWS expects [longitude, latitude]
          QueryRadius: 100, // Search within 100 meters
          MaxResults: 1,
          Language: 'en'
        })
      });

      if (!response.ok) {
        throw new Error(`AWS API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📍 AWS Location Service Response:', data);
      
      return data;
      
    } catch (error) {
      console.error('❌ AWS Location Service Error:', error);
      
      // Return mock data if AWS fails (for development/testing)
      console.log('🔄 Using fallback mock data...');
      return {
        ResultItems: [{
          PlaceName: "Demo Location",
          Address: {
            Label: "123 Demo Street, Demo City, DC 12345, USA"
          },
          Categories: [
            { Name: "Commercial Building", LocalizedName: "Commercial Building" },
            { Name: "Business Center", LocalizedName: "Business Center" }
          ]
        }]
      };
    }
  };

  // Card recommendation API call
  const getCardRecommendation = async (categories, placeName) => {
    try {
      console.log('💳 Getting card recommendation...');
      console.log('Categories:', categories);
      console.log('Place:', placeName);

      const response = await fetch('http://Mygoapp-env.eba-mp3rtawp.us-east-1.elasticbeanstalk.com/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Categories: categories,
          Title: placeName,
        })
      });

      if (!response.ok) {
        throw new Error(`Card API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('💳 Card Service Response:', data);
      
      return data;
      
    } catch (error) {
      console.error('❌ Card Service Error:', error);
      
      // Return mock card data if API fails
      return {
        company: 'Chase',
        card: 'Sapphire Preferred',
        percentage: '3% Cash Back'
      };
    }
  };

  // Request location permission for Android
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs location access to find the best credit card for your current location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  };

  // Get current position using built-in geolocation
  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Location obtained:', position);
          resolve(position);
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        }
      );
    });
  };

  // Enhanced location function with built-in geolocation
  const getLocation = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setLocationStatus('Requesting location permission...');
    
    try {
      // Step 1: Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this device');
      }

      // Step 2: Request permissions (Android)
      if (Platform.OS === 'android') {
        console.log('🔐 Requesting Android location permission...');
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          throw new Error('Location permission denied');
        }
      }

      setLocationStatus('Getting your location...');
      console.log('📍 Attempting to get location...');

      // Step 3: Get current location
      const position = await getCurrentPosition();
      const { latitude, longitude, accuracy } = position.coords;
      
      console.log('📍 Location Data:');
      console.log(`Latitude: ${latitude}`);
      console.log(`Longitude: ${longitude}`);
      console.log(`Accuracy: ${accuracy} meters`);

      // Validate coordinates
      if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        throw new Error('Invalid coordinates received');
      }

      setLocationStatus('Finding nearby places...');

      // Step 4: Get place information from AWS
      const locationData = await reverseGeocode(latitude, longitude);
      
      // Step 5: Extract place data
      const place = locationData?.ResultItems?.[0];
      if (!place) {
        console.log('⚠️ No places found, using fallback data');
        // Use fallback data instead of failing
        setPlaceData({
          name: 'Current Location',
          categories: ['General Location'],
          address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        });
        
        setCardSuggestion({
          company: 'Chase',
          card: 'Freedom Unlimited',
          percentage: '1.5% Cash Back'
        });
      } else {
        const placeName = place.PlaceName || place.Address?.Label || 'Unknown Location';
        const categories = place.Categories || [];
        
        console.log('🏢 Found Place:', placeName);
        console.log('🏷️ Categories:', categories.map(c => c.Name || c.LocalizedName));

        setLocationStatus('Getting card recommendation...');

        // Step 6: Get card recommendation
        const cardData = await getCardRecommendation(categories, placeName);

        // Step 7: Set results
        setPlaceData({
          name: placeName,
          categories: categories.map(c => c.LocalizedName || c.Name || 'Unknown Category'),
          address: place.Address?.Label
        });
        
        setCardSuggestion(cardData);
      }

      setLocationStatus('Found your perfect card!');
      
      // Small delay for better UX
      setTimeout(() => {
        setCurrentPage('results');
      }, 500);
      
    } catch (error) {
      console.error('❌ Location Error Details:', error);
      
      let errorMessage = 'Failed to get location';
      let debugInfo = '';

      // Handle specific error types
      if (error.code === 1) { // PERMISSION_DENIED
        errorMessage = 'Location permission denied';
        debugInfo = 'Please enable location access in your device settings';
      } else if (error.code === 2) { // POSITION_UNAVAILABLE
        errorMessage = 'Location unavailable';
        debugInfo = 'GPS signal may be weak or unavailable';
      } else if (error.code === 3) { // TIMEOUT
        errorMessage = 'Location request timed out';
        debugInfo = 'Try moving to an area with better GPS signal';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network connection error';
        debugInfo = 'Check your internet connection';
      } else {
        debugInfo = `Debug: ${error.message}`;
      }

      setLocationStatus(`${errorMessage} - ${debugInfo}`);

      Alert.alert(
        'Location Error',
        `${errorMessage}\n\n${debugInfo}\n\nWould you like to try again?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: () => setTimeout(getLocation, 1000) },
          { text: 'Use Demo', onPress: useDemoData }
        ]
      );
      
    } finally {
      setIsLoading(false);
    }
  };

  // Demo data function for testing
  const useDemoData = () => {
    console.log('🎭 Using demo data...');
    setPlaceData({
      name: 'Demo Coffee Shop',
      categories: ['Coffee Shop', 'Restaurant'],
      address: 'Demo Location for Testing'
    });
    
    setCardSuggestion({
      company: 'Chase',
      card: 'Sapphire Preferred',
      percentage: '3% Cash Back'
    });
    
    setCurrentPage('results');
  };

  const goBack = () => {
    setCurrentPage('start');
    setLocationStatus('Ready to choose the best card');
    setPlaceData(null);
    setCardSuggestion(null);
  };

  // Start Page
  if (currentPage === 'start') {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.logo}>SOLO CARD LLC</Text>
          <Text style={styles.tagline}>Modern Financial Solutions</Text>
          
          <View style={styles.section}>
            <Text style={styles.status}>{locationStatus}</Text>
            
            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={getLocation}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.buttonText}>Getting Location...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Choose the best card</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Results Page
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>SOLO CARD LLC</Text>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Place Info */}
          <View style={styles.placeCard}>
            <Text style={styles.placeName}>{placeData?.name || 'Unknown Location'}</Text>
            <View style={styles.categoriesRow}>
              {placeData?.categories?.map((category, index) => (
                <View key={index} style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{category}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Card Recommendation */}
          <View style={styles.recommendationCard}>
            {cardSuggestion ? (
              <>
                <Text style={styles.cardTitle}>
                  {cardSuggestion.company} {cardSuggestion.card}
                </Text>
                <View style={styles.percentageTag}>
                  <Text style={styles.percentageText}>{cardSuggestion.percentage}</Text>
                </View>
                <Text style={styles.details}>
                  This card offers the best rewards for {placeData?.name} purchases.
                </Text>
              </>
            ) : (
              <Text style={styles.cardTitle}>No recommendation available</Text>
            )}
          </View>
          
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>← Try Another Location</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  section: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
  },
  status: {
    fontSize: 14,
    textAlign: 'center',
    color: '#555',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  placeCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  placeName: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1e293b',
    marginBottom: 10,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    color: '#475569',
  },
  recommendationCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1e40af',
    marginBottom: 10,
  },
  percentageTag: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 15,
  },
  percentageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  details: {
    fontSize: 14,
    textAlign: 'center',
    color: '#475569',
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
  },
});