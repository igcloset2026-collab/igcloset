import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCP6BVSVMLC9uK2dAmDN_IrroeYmTSpN6U",
    authDomain: "ig-closet.firebaseapp.com",
    projectId: "ig-closet",
    storageBucket: "ig-closet.firebasestorage.app",
    messagingSenderId: "640311081830",
    appId: "1:640311081830:web:0dacf265dc932091efa6a7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
