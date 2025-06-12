import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {enableScreens} from 'react-native-screens';
import TakeQuiz from '../pages/TakeQuiz';
import HomeScreen from '../pages/LandingPage';
import Ionicons from 'react-native-vector-icons/Ionicons';

enableScreens();

const Tab = createBottomTabNavigator();

function BottomTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({color, size}) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home-outline';
          } else if (route.name === 'TakeQuiz') {
            iconName = 'book-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false, // hides header if needed
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="TakeQuiz" component={TakeQuiz} />
    </Tab.Navigator>
  );
}

export default BottomTabsNavigator;
