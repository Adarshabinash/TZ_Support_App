import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {enableScreens} from 'react-native-screens';
import BottomTabsNavigator from './BottomNavigator';
import TakeQuiz from '../pages/TakeQuiz';

enableScreens();

const Stack = createNativeStackNavigator();

const StackScreen = ({setIsLoggedIn}) => {
  return (
    <Stack.Navigator initialRouteName="BottomScreens">
      <Stack.Screen
        name="Home"
        component={BottomTabsNavigator}
        options={{headerShown: false}}
        initialParams={{setIsLoggedIn}}
      />
      <Stack.Screen
        name="TakeQuiz"
        component={TakeQuiz}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

export default StackScreen;
