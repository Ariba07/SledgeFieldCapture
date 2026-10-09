import React from 'react';
import {DarkTheme, NavigationContainer, Theme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './types';
import {MainTabs} from './MainTabs';
import {NewCaptureScreen} from '../screens/NewCaptureScreen';
import {CaptureDetailScreen} from '../screens/CaptureDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#3B82F6',
    background: '#0F172A',
    card: '#0F172A',
    text: '#F1F5F9',
    border: '#1E293B',
  },
};

export const RootNavigator: React.FC = () => (
  <NavigationContainer theme={theme}>
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerStyle: {backgroundColor: '#0F172A'},
        headerTintColor: '#F1F5F9',
        headerShadowVisible: false,
        contentStyle: {backgroundColor: '#0F172A'},
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
    </Stack.Navigator>
  </NavigationContainer>
);
