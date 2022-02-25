import React, {useState} from 'react';
import Test from './src/activity/Test';
import ForgetPass from './src/activity/ForgetPass'
import Signup from './src/activity/Signup';
import Signin from './src/activity/Signin'
import { NavigationContainer } from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack'
const Stack = createStackNavigator();
const App = () => {
  
  return (
   
    <NavigationContainer> 
<Stack.Navigator >

  <Stack.Screen
          name="Test"
          component={Test}
          options={{headerShown: false}}
          />
 <Stack.Screen
          name="ForgetPass"
          component={ForgetPass}
          options={{headerShown: false}}
          />
           <Stack.Screen
          name="Signup"
          component={Signup}
          options={{headerShown: false}}
          />
</Stack.Navigator>
    </NavigationContainer>

      
  );
};




export default App;