import React from 'react';
import 'react-native-get-random-values'; // must be imported before uuid
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {SyncProvider} from './src/context/SyncContext';
import {RootNavigator} from './src/navigation/RootNavigator';

const App: React.FC = () => (
  <SafeAreaProvider>
    <SyncProvider>
      <RootNavigator />
    </SyncProvider>
  </SafeAreaProvider>
);

export default App;
