import { initializeApp, getApps, getApp } from "firebase/app"
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { getFirestore, doc, setDoc } from "firebase/firestore"
import { getStorage, ref, getDownloadURL } from "firebase/storage"

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
export const initializeFirebase = () => {
  if (!getApps().length) {
    initializeApp(firebaseConfig)
  }
  return getApp()
}

// Get Firebase Auth instance
export const getFirebaseAuth = () => {
  initializeFirebase()
  return getAuth()
}

// Get Firestore instance
export const getFirebaseFirestore = () => {
  initializeFirebase()
  return getFirestore()
}

// Get Firebase Storage instance
export const getFirebaseStorage = () => {
  initializeFirebase()
  return getStorage()
}

// Generate a Firebase Storage download URL from a storage path
export const getFirebaseStorageUrl = async (storagePath: string): Promise<string> => {
  try {
    const storage = getFirebaseStorage()
    const fileRef = ref(storage, storagePath)
    return await getDownloadURL(fileRef)
  } catch (error) {
    console.error("Error getting download URL:", error)
    throw new Error("Failed to get document download URL")
  }
}

// Helper function to open a document in a new tab with proper viewer
export const openDocumentInViewer = (documentUrl: string, documentPath: string) => {
  // If it's already a full URL (like from getDownloadURL), use it directly
  if (documentUrl.startsWith("http")) {
    // For PDFs, use Google's PDF viewer or browser's built-in viewer
    if (documentPath.toLowerCase().endsWith(".pdf")) {
      window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`, "_blank")
    } else {
      // For other file types, just open the URL
      window.open(documentUrl, "_blank")
    }
  } else {
    // If it's a storage path, get the download URL first
    getFirebaseStorageUrl(documentUrl)
      .then((url) => {
        if (documentPath.toLowerCase().endsWith(".pdf")) {
          window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`, "_blank")
        } else {
          window.open(url, "_blank")
        }
      })
      .catch((error) => {
        console.error("Error opening document:", error)
        alert("Failed to open document. Please try again later.")
      })
  }
}

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  const auth = getFirebaseAuth()
  return signInWithEmailAndPassword(auth, email, password)
}

// Sign up with email and password
export const signUp = async (email: string, password: string, userType: string, name = "") => {
  const auth = getFirebaseAuth()
  const db = getFirebaseFirestore()

  // Create user in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  // Store additional user data in Firestore
  await setDoc(doc(db, "users", user.uid), {
    email: user.email,
    userType: userType,
    name: name,
    createdAt: new Date(),
  })

  return userCredential
}

// Sign out
export const signOut = async () => {
  const auth = getFirebaseAuth()
  return firebaseSignOut(auth)
}

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  const auth = getFirebaseAuth()
  return onAuthStateChanged(auth, callback)
}

// Get current user
export const getCurrentUser = () => {
  const auth = getFirebaseAuth()
  return auth.currentUser
}

