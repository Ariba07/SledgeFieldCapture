import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing} from 'react-native';
import {BrandMark} from './BrandMark';
import {useSyncContext} from '../context/SyncContext';
import {useSplashScreenStyles} from '../styles/components/SplashScreen.styles';

// Long enough for the intro animation to read, short enough not to slow launch.
const MIN_VISIBLE_MS = 900;

/** Covers the app until saved captures are loaded, then fades out. */
export const SplashScreen: React.FC = () => {
  const styles = useSplashScreenStyles();
  const {isLoaded} = useSyncContext();
  const [minElapsed, setMinElapsed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const intro = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(intro, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [intro]);

  useEffect(() => {
    if (isLoaded && minElapsed) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start(() => setHidden(true));
    }
  }, [isLoaded, minElapsed, opacity]);

  if (hidden) {
    return null;
  }

  const rise = intro.interpolate({inputRange: [0, 1], outputRange: [12, 0]});
  const scale = intro.interpolate({inputRange: [0, 1], outputRange: [0.86, 1]});

  return (
    <Animated.View
      style={[styles.overlay, {opacity}]}
      pointerEvents={isLoaded && minElapsed ? 'none' : 'auto'}
      accessibilityLabel="Field Capture is loading">
      <Animated.View style={{opacity: intro, transform: [{scale}]}}>
        <BrandMark size={104} />
      </Animated.View>
      <Animated.Text
        style={[
          styles.title,
          {opacity: intro, transform: [{translateY: rise}]},
        ]}>
        Field Capture
      </Animated.Text>
      <Animated.Text
        style={[
          styles.subtitle,
          {opacity: intro, transform: [{translateY: rise}]},
        ]}>
        Site records that work offline
      </Animated.Text>
    </Animated.View>
  );
};
