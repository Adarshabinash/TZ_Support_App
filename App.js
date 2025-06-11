import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
// import StackScreen from '../TZ_Support_App/src/navigations/StackNavigator';
import StackScreen from '../TZ_Support_App/src/navigations/StackNavigator';

const App = () => {
  return (
    <NavigationContainer>
      <StackScreen />
    </NavigationContainer>
  );
};

export default App;
