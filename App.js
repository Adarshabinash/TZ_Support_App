import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import StackScreen from '../TZ_Support_App/src/navigations/StackNavigator';
import BottomTabsNavigator from './src/navigations/BottomNavigator';

const App = () => {
  return (
    <NavigationContainer>
      <StackScreen />
    </NavigationContainer>
  );
};

export default App;
