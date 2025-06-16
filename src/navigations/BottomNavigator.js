import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {enableScreens} from 'react-native-screens';
import TakeQuiz from '../pages/TakeQuiz';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomePage from '../pages/HomePage';
import ProfilePage from '../pages/ProfilePage';
import AntDesign from 'react-native-vector-icons/AntDesign';

enableScreens(); 

const Tab = createBottomTabNavigator();

function BottomTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({color, size}) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home'; 
          } else if (route.name === 'TakeQuiz') {
            iconName = 'book'; // ✅ valid
          } else if (route.name === 'Profile') {
            iconName = 'user'; // ✅ use 'user' instead of 'profile'
          }

          return <AntDesign name={iconName} size={size} color={color} />;
        },
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}>
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="TakeQuiz" component={TakeQuiz} />
      <Tab.Screen name="Profile" component={ProfilePage} />
    </Tab.Navigator>
  );
}

export default BottomTabsNavigator;
