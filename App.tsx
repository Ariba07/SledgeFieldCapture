/**
 * App.tsx – root entry point for SledgeFieldCapture
 */
import React from 'react';
import 'react-native-get-random-values'; // must be imported before uuid
import {HomeScreen} from './src/screens/HomeScreen';

const App: React.FC = () => <HomeScreen />;

export default App;
