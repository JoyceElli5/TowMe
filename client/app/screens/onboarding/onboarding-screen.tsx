import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ONBOARDING_IMAGES } from '@/constants/onboarding';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    image: ONBOARDING_IMAGES.slide1,
    title: "Guess you are stuck on the road, let's get Started",
  },
  {
    id: '2',
    image: ONBOARDING_IMAGES.slide2,
    title: 'Get access to tow trucks easily',
    subtitle: 'Experience fast and reliable services',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      try {
        flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      } catch {
        // Fallback to scrollToOffset if scrollToIndex fails
        flatListRef.current?.scrollToOffset({ offset: (currentIndex + 1) * width });
      }
    } else {
      // Navigate to role selection screen
      router.replace('/screens/onboarding/role-selection-screen');
    }
  };

  const handleSkip = () => {
    router.replace('/screens/onboarding/role-selection-screen');
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <ImageBackground
      source={{ uri: item.image }}
      style={styles.slide}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <Ionicons name="car-sport" size={32} color="#ffffff" style={styles.logoIcon} />
          <Text style={styles.logo}>TowMe</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
    </ImageBackground>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />
      
      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                currentIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>
        
        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextText}>
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  slide: {
    width,
    height,
    justifyContent: 'space-between',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 80,
    paddingBottom: 180,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoIcon: {
    marginRight: 12,
  },
  logo: {
    fontFamily: 'Gilroy-SemiBold',
    fontSize: 36,
    color: '#ffffff',
    textAlign: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Gilroy-SemiBold',
    fontSize: 32,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Gilroy-Regular',
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 50,
    paddingHorizontal: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 8,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#ffffff',
    width: 28,
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 28,
  },
  skipText: {
    fontFamily: 'Gilroy-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  nextButton: {
    backgroundColor: '#003554',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 28,
    minWidth: 150,
    alignItems: 'center',
    shadowColor: '#003554',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  nextText: {
    fontFamily: 'Gilroy-SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
});
