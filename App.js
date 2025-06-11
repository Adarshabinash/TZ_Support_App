import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import StackScreen from '../AwesomeProject/src/navigations/StackNavigator';

const App = () => {
  return (
    <NavigationContainer>
      <StackScreen />
    </NavigationContainer>
  );
};

export default App;
