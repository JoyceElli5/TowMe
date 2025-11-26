import { router } from 'expo-router';
import { useState, useRef } from 'react';
import {
  Dimensions,
  FlatList,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

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
    image: 'https://images.unsplash.com/photo-1611083203153-1f0f49fcf093?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: "Guess you are stuck on the road, Let's get Started",
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1675092910167-13382da372e6?q=80&w=385&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Get access to tow trucks easily',
    subtitle: 'Experience fast and reliable services',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
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
        <Text style={styles.logo}>TowMe</Text>
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
  logo: {
    fontFamily: 'Euclid-Circular-B',
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Euclid-Circular-B',
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Euclid-Circular-B',
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.85)',
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
    width: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: {
    fontFamily: 'Euclid-Circular-B',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  nextButton: {
    backgroundColor: '#003554',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    minWidth: 150,
    alignItems: 'center',
  },
  nextText: {
    fontFamily: 'Euclid-Circular-B',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
