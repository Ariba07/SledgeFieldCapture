import React, {useMemo} from 'react';
import {StatusBar} from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  Theme as NavTheme,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './types';
import {MainTabs} from './MainTabs';
import {NewCaptureScreen} from '../screens/NewCaptureScreen';
import {CaptureDetailScreen} from '../screens/CaptureDetailScreen';
import {EditCaptureScreen} from '../screens/EditCaptureScreen';
import {MediaViewerScreen} from '../screens/MediaViewerScreen';
import {useTheme} from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const {dark, colors} = useTheme();

  const navTheme: NavTheme = useMemo(() => {
    const base = dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.background,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [dark, colors]);

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerStyle: {backgroundColor: colors.background},
          headerTintColor: colors.text,
          headerTitleStyle: {fontSize: 17, fontWeight: '600'},
          headerShadowVisible: false,
          contentStyle: {backgroundColor: colors.background},
        }}>
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="CaptureDetail"
          component={CaptureDetailScreen}
          options={{title: 'Capture', headerBackTitle: 'Back'}}
        />
        <Stack.Screen
          name="NewCapture"
          component={NewCaptureScreen}
          options={{presentation: 'modal', headerShown: false}}
        />
        <Stack.Screen
          name="MediaViewer"
          component={MediaViewerScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
            headerShown: false,
            contentStyle: {backgroundColor: '#000000'},
          }}
        />
        <Stack.Screen
          name="EditCapture"
          component={EditCaptureScreen}
          options={{presentation: 'modal', headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
