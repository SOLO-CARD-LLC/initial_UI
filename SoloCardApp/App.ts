import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

const SoloCardApp = () => {
  const [currentPage, setCurrentPage] = useState('start');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Ready to choose the best card');
  const [placeData, setPlaceData] = useState(null);
  const [cardSuggestion, setCardSuggestion] = useState(null);
  const [error, setError] = useState('');
  const [fadeAnim] = useState(new Animated.Value(1));

  // AWS Configuration
  const AWS_CONFIG = {
    region: 'us-east-1',
    apiKey: "v1.public.eyJqdGkiOiJiMjA4OWI1ZC04NTdhLTQ1ZmItODMyMi1lNDBiZGFlNjU4MzAifX_P2iL1pjUIVJwXsiWyX7jXQt5NZvGyaAPQXdv76FcdC7pfVbX5-Fn-LfqMKp9ROeQPp3N7m3fu4_AdYhzqpxoCzZaSFQ6wuFlJYuHztZsTRifGtPLs15CSVampJnxmp636X5Oj6Zf22FkrFDJ3s50uwxQfUo28HUW9h3IbLYHCBhfE0u9CfHQhy3T_XIqj2sl0eieo3PZu50rEQvgS3Jiy2LZ4QJ0k6UXIKqN_FB-2rvy5CZKl37n8cLH1d1138Vc8V--cQ71eEGUPsQHJ-2HraofNUp4KoOcBlrb1C46XCNP2nm1i3DidHX3sdJcpg0pUEQDOabBzc6zC07pbctA.ZWU0ZWIzMTktMWRhNi00Mzg0LTllMzYtNzlmMDU3MjRmYTkx",
    endpoint: 'https://places.geo.us-east-1.amazonaws.com'
  };

  useEffect(() => {
    console.log('🚀 SOLO CARD LLC React Native App Loaded');
    console.log('📱 Platform:', Platform.OS);
  }, []);

  const showPage = (pageId) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      setCurrentPage(pageId);
    }, 250);
  };

  const goBackToStart = () => {
    showPage('start');
    setLocationStatus('Ready to choose the best card');
    setError('');
    setPlaceData(null);
    setCardSuggestion(null);
  };

  const updateStatus = (message, isError = false) => {
    setLocationStatus(message);
    if (isError) {
      setError(message);
    } else {
      setError('');
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      console.log('🗺️ Calling Amazon Location Service Nearby Point of Interest Search...');
      
      const response = await fetch(`${AWS_CONFIG.endpoint}/v2/search-nearby?key=${AWS_CONFIG.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          QueryPosition: [longitude, latitude],
          QueryRadius: 50,
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
      
      // Return mock data for demonstration
      console.log('🔄 Using mock data for demonstration...');
      return {
        ResultItems: [{
          PlaceName: "Demo Location",
          Address: {
            Label: "123 Demo Street, Demo City, DC 12345, USA",
            AddressNumber: "123",
            Street: "Demo Street",
            Locality: "Demo City",
            Region: { Name: "Demo State" },
            PostalCode: "12345",
            Country: { Name: "USA" }
          },
          Categories: [
            { Name: "Commercial Building", Primary: true },
            { Name: "Business Center" }
          ]
        }]
      };
    }
  };

  const checkCard = async (categoriesList, placeName) => {
    try {
      console.log('Getting the credit card information necessary to give a suggestion');

      const response = await fetch(`http://Mygoapp-env.eba-mp3rtawp.us-east-1.elasticbeanstalk.com/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Categories: categoriesList,
          Title: placeName,
        })
      });

      if (!response.ok) {
        throw new Error(`AWS API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📍 Card Service Response:', data);
      
      return data;
    } catch(error) {
      console.error('Problem getting information from card service');
      return null;
    }
  };

  const getLocation = async () => {
    if (isGettingLocation) return;
    
    setIsGettingLocation(true);
    updateStatus('Requesting location permission...');
    
    try {
      // Request permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        updateStatus('Location access denied by user', true);
        setIsGettingLocation(false);
        return;
      }

      updateStatus('Getting your location...');

      // Get location
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
        maximumAge: 300000
      });

      const { latitude, longitude, accuracy } = location.coords;
      
      console.log('📍 User Location Detected:');
      console.log(`Latitude: ${latitude}`);
      console.log(`Longitude: ${longitude}`);
      console.log(`Accuracy: ${accuracy} meters`);
      
      updateStatus('Getting place information...');
      
      const locationData = await reverseGeocode(latitude, longitude);
      const categories = locationData?.ResultItems?.[0]?.Categories || [];
      const placeName = locationData?.ResultItems?.[0]?.PlaceName || locationData?.ResultItems?.[0]?.Address?.Label || 'Unknown Location';
      const suggestion = await checkCard(categories, placeName);
      
      setPlaceData(locationData);
      setCardSuggestion(suggestion);
      
      updateStatus('Found your perfect card!');
      
      setTimeout(() => {
        showPage('results');
      }, 500);
      
    } catch (error) {
      console.error('❌ Location Error:', error);
      
      let errorMessage = 'Failed to get location';
      if (error.code === 'E_LOCATION_UNAVAILABLE') {
        errorMessage = 'Location information unavailable';
      } else if (error.code === 'E_LOCATION_TIMEOUT') {
        errorMessage = 'Location request timed out';
      }
      
      updateStatus(errorMessage, true);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const renderCategories = (categories) => {
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return null;
    }
    
    return categories.map((category, index) => {
      if (!category) return null;
      
      return (
        <View key={index} style={styles.categoryTag}>
          <Text style={styles.categoryText}>
            {category.LocalizedName || category.Name || 'Unknown Category'}
          </Text>
        </View>
      );
    });
  };

  const renderStartPage = () => {
    return (
      <Animated.View style={[styles.pageContainer, { opacity: fadeAnim }]}>
        <Text style={styles.logo}>SOLO CARD LLC</Text>
        <Text style={styles.tagline}>Modern Financial Solutions</Text>
        
        <View style={styles.locationSection}>
          <Text style={styles.locationStatus}>{locationStatus}</Text>
          
          <TouchableOpacity
            style={[styles.locationButton, isGettingLocation && styles.locationButtonDisabled]}
            onPress={getLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.buttonText}>Getting Location...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Choose the best card</Text>
            )}
          </TouchableOpacity>
          
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
        </View>
      </Animated.View>
    );
  };

  const renderResultsPage = () => {
    const place = placeData?.ResultItems?.[0];
    const categories = place?.Categories || [];
    const placeName = place?.PlaceName || place?.Address?.Label || 'Unknown Location';

    return (
      <Animated.View style={[styles.pageContainer, { opacity: fadeAnim }]}>
        <Text style={styles.logo}>SOLO CARD LLC</Text>
        
        <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.placeInfo}>
            <Text style={styles.placeName}>{placeName}</Text>
            <View style={styles.categoriesContainer}>
              {renderCategories(categories)}
            </View>
          </View>
          
          <View style={styles.cardRecommendation}>
            {cardSuggestion && cardSuggestion.company ? (
              <>
                <Text style={styles.cardTitle}>
                  {cardSuggestion.company} {cardSuggestion.card}
                </Text>
                <View style={styles.cardPercentageContainer}>
                  <Text style={styles.cardPercentage}>{cardSuggestion.percentage}</Text>
                </View>
                <Text style={styles.cardDetails}>
                  This card offers the best rewards for {placeName.toLowerCase()} purchases.
                  {categories.length > 0 && (
                    <Text>
                      {' '}Perfect for {categories.map(c => c?.LocalizedName || c?.Name || 'Unknown').join(', ').toLowerCase()} spending.
                    </Text>
                  )}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>No card information found</Text>
                <Text style={styles.cardDetails}>
                  Unable to get card recommendation for this location.
                </Text>
              </>
            )}
          </View>
          
          <TouchableOpacity style={styles.backButton} onPress={goBackToStart}>
            <Text style={styles.backButtonText}>← Try Another Location</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.appContainer}>
          {currentPage === 'start' ? renderStartPage() : renderResultsPage()}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  appContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 40,
    width: '100%',
    maxWidth: 450,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 25,
    },
    shadowOpacity: 0.1,
    shadowRadius: 45,
    elevation: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pageContainer: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 10,
    color: 'white',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 30,
    fontWeight: '300',
    color: 'white',
    textAlign: 'center',
  },
  locationSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  locationStatus: {
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 15,
    color: 'white',
    textAlign: 'center',
  },
  locationButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#4f46e5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginLeft: 8,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
    width: '100%',
  },
  placeInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  placeName: {
    fontWeight: '600',
    fontSize: 19,
    marginBottom: 10,
    color: '#e0e7ff',
    textAlign: 'center',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
  },
  categoryTag: {
    backgroundColor: 'rgba(79, 70, 229, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.5)',
  },
  categoryText: {
    fontSize: 13,
    color: 'white',
  },
  cardRecommendation: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 2,
    borderColor: 'rgba(79, 70, 229, 0.3)',
  },
  cardTitle: {
    fontSize: 25,
    fontWeight: '700',
    marginBottom: 10,
    color: 'white',
    textAlign: 'center',
  },
  cardPercentageContainer: {
    backgroundColor: 'rgba(79, 70, 229, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    margin: 10,
  },
  cardPercentage: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  cardDetails: {
    fontSize: 14,
    opacity: 0.9,
    marginTop: 10,
    color: 'white',
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
  },
});

export default SoloCardApp;