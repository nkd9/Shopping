import React, { useEffect, useState } from "react";
import {View, Text, StyleSheet, Alert } from "react-native";
import CardButton from "./StripePaymentComponent/CardButton";
import { PaymentsStripe as Stripe } from "expo-payments-stripe";
import {connect} from "react-redux";
import {getItems,getLocation,updatedCart,getHomescreenData,getUserAddress} from "../../../src/actions/itemsAction";
import axios from "axios";
import { Root, Popup } from 'popup-ui';

// initialize it in useEffect or componentDidMount
Stripe.setOptionsAsync({
  publishableKey: "pk_test_51ImUz1JXE2S1O9gfuZTl5DyGaYFKhX8Wwaa3xfdPCMwLP71JF9It7dniBg9PmI6gkf9AaF2ApBGFwzYgfGg54yO200L1qRIwI4",
  //publishableKey: "pk_test_51IvTw0SExWg4ZzD2fJ2qJ2uDAOUb1XdHlTFgnAkb3MtWVZKOEZDb8gjaFmAtRzcwMIkXQMY6CGocoQnUr7dFul6d00hGUQ8QgH",
  androidPayMode: 'test', // [optional] used to set wallet environment (AndroidPay)
  merchantId: 'your_merchant_id', // [optional] used for payments with ApplePay
});

const PaymentStripe = (props) => {
  var [loading,setLoading] = useState(false);
  var [token,setToken] = useState(null);
  var [country, setCountry] = useState("");
  var [cartItemsArray,changeCartItemsArray] = useState(props.item.cartItems);
  var [paymentStatus, setPaymentStatus] = useState("");
  var [paymentMethod, setPaymentMethod] = useState("");

useEffect(() => {
  console.log(props.item.currency_name);
    fetch("https://maps.googleapis.com/maps/api/geocode/json?address=" + props.item.latitude + "," + props.item.longitude + "&key=" + "AIzaSyCKabiwGyic2E7QicGIz2Fs_D81DCnWb1Y")
      .then((response) => response.json())
      .then((responseJson) => {
        responseJson.results[0].address_components.map((address) => {
          console.log(address.types[0]);
          if(address.types[0] == "country"){
            setCountry(address.long_name);
          }
        })
        const userLocation = responseJson.results[0].formatted_address;
        
    });
}, []);

const subtotalPrice = () => {
  // const { cartItems } = cartItems;
  if(cartItemsArray){
    return cartItemsArray.reduce((sum, item) => sum +  props.item.deliveryData.del_charge + (item.qty * item.price), 0 );
  }
  return 0;
}

  const handleCardDetails = async () => {
    try {
      setLoading(false);
      var billingAddress = {};
      console.log(country);
      props.item.userAddressData.map((address)=>{
        if(address.select_status === 1)
        {
            billingAddress.name= address.receiver_name,
            billingAddress.line1= address.house_no,
            billingAddress.line2= address.landmark,
            billingAddress.city= address.city,
            billingAddress.state= address.state,
            billingAddress.country= country,
            billingAddress.postalCode= address.pincode
        }
      });

      const cardOptions = { 
        smsAutofillDisabled: true,
        requiredBillingAddressFields: 'full',
           prefilledInformation: {
            billingAddress,
          }
      };
      console.log("cardOptions");
      console.log(cardOptions);
      // GETS YOUR TOKEN FROM STRIPE FOR PAYMENT PROCESS
      const receivedToken = await Stripe.paymentRequestWithCardFormAsync(cardOptions);

      console.log(receivedToken);
      setLoading(false);
      setToken(receivedToken.tokenId);
      //handlePayment();
    } catch(error) {
      setLoading(false);
      // this.setState({ loading: false });
    }
  }
  const handlePayment = async () => {
    setLoading(true);
    console.log("Handle payment called")
    var formdata = new FormData();
    let amount = (subtotalPrice()+20.00).toFixed(2);
    formdata.append("amount", amount*100);
    formdata.append("currency", props.item.currency_name);
    formdata.append("token", token);

    var requestOptions = {
      method: 'POST',
      body: formdata,
      redirect: 'follow'
    };

    fetch("http://myviristore.com/admin/api/stripe_api", requestOptions)
      .then(response => response.json())
      .then(result => {
        console.log(result.status);
        if(result.status == "succeeded"){
          console.log(result.payment_method_details.type);
          setPaymentMethod(result.payment_method_details.type);
          setPaymentStatus("success");
          handleCheckOutAPI(result.payment_method_details.type, "success");
        }
      })
      .catch(error => console.log('error', error));
  }

  const handleCheckOutAPI = (method, status) => {
    setLoading(true);
    console.log(props.route.params.cart_id);
    console.log("Method >> " + paymentMethod + ">>> " + method);
    console.log("status >> " + paymentStatus + ">>> " + status);
    console.log(props.item.userdata.user_id);

    var formdata = new FormData();
    formdata.append("user_id", props.item.userdata.user_id);
    formdata.append("payment_status", status);
    formdata.append("cart_id", props.route.params.cart_id);
    formdata.append("payment_method", method);
    formdata.append("wallet", "");

    var requestOptions = {
      method: 'POST',
      body: formdata,
      redirect: 'follow'
    };

    fetch("http://myviristore.com/admin/api/checkout", requestOptions)
      .then(response => response.json())
      .then(result => {
        console.log(result.status);
        if(result.status == "2"){
          setLoading(false);
          Alert.alert(
            "Success",
            result.message,
            [
              { text: "OK", onPress: () => props.navigation.navigate("OrderScreen") }
            ]
          );
        }
      })
      .catch(error => console.log('error', error));
  }
  return (
    <View style={styles.container}>
      <CardButton
        text="Card Details"
        loading={loading}
        onPress={handleCardDetails}
      />
      <View style={styles.tokenLabel}>
        { token &&
          <View style={{ display:'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 5 }}>
            <Text style={styles.tokenLabel}>Token: {token}</Text>
             <CardButton
              text="Make Payment"
              onPress={handlePayment}
             />   
          </View>
        }
      </View>
    </View>
  )
}

const mapStateToProps = (state) => {
  return({
      //Here State.post is 
      //Coming From -> "./reducers/index.js"
      //where "post" is defined under combineReducers
      item:state.item
  })
}

export default connect(mapStateToProps, {getItems,getLocation,updatedCart,getHomescreenData,getUserAddress})(PaymentStripe);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tokenLabel: {
    textAlign: 'center',
    color: '#111',
    marginBottom: 5,
    padding: 5
  }   
});
