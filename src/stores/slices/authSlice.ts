import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { User, UserRole } from "@/types";
import Cookies from "js-cookie";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import apiClient from "@/lib/api-client";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: Cookies.get("auth_token") || null,
  isAuthenticated: !!Cookies.get("auth_token"),
  isLoading: false,
  error: null,
};

/** Maps Firebase Auth error codes to user-friendly messages. */
function friendlyAuthError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code: string }).code
      : "";

  const map: Record<string, string> = {
    "auth/invalid-credential":       "Incorrect email or password. Please try again.",
    "auth/wrong-password":           "Incorrect password. Please try again.",
    "auth/user-not-found":           "No account found with that email address.",
    "auth/invalid-email":            "Please enter a valid email address.",
    "auth/user-disabled":            "This account has been disabled. Contact support.",
    "auth/too-many-requests":        "Too many failed attempts. Please wait a moment and try again.",
    "auth/network-request-failed":   "Network error. Check your connection and try again.",
    "auth/email-already-in-use":     "An account with this email already exists.",
    "auth/weak-password":            "Password must be at least 6 characters.",
    "auth/requires-recent-login":    "Please sign in again to continue.",
    "auth/popup-closed-by-user":     "Sign in was cancelled. Please try again.",
    "auth/account-exists-with-different-credential":
                                     "An account already exists with a different sign in method.",
  };

  return map[code] ?? "Something went wrong. Please try again.";
}

export const loginWithFirebase = createAsyncThunk(
  "auth/loginWithFirebase",
  async ({ email, password }: { email: string; password: string }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setAuthStart());
      // 1. Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // 2. Get Firebase token
      const token = await userCredential.user.getIdToken();
      // 3. Temporarily save token so apiClient can use it
      Cookies.set("auth_token", token, { expires: 7 });

      // 4. Fetch custom user profile from backend
      const user = await apiClient.get<User>("/api/FirebaseUser/current-user");

      dispatch(setAuthSuccess({ user, token }));
      return user;
    } catch (error) {
      const msg = friendlyAuthError(error);
      dispatch(setAuthFailure(msg));
      Cookies.remove("auth_token");
      return rejectWithValue(msg);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const token = Cookies.get("auth_token");
      if (!token) return rejectWithValue("No token found");

      // 4. Fetch custom user profile from backend
      const user = await apiClient.get<User>("/api/FirebaseUser/current-user");
      
      dispatch(setAuthSuccess({ user, token }));
      return user;
    } catch (error) {
      // If securely pulling the profile fails via invalid token, wipe the current state internally
      const msg = error instanceof Error ? error.message : "Failed to restore session";
      dispatch(logout()); 
      return rejectWithValue(msg);
    }
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    setAuthSuccess(state, action: PayloadAction<{ user: User; token: string }>) {
      state.isLoading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      Cookies.set("auth_token", action.payload.token, { expires: 7 }); // 7 days
    },
    setAuthFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    setUserRole(state, action: PayloadAction<UserRole>) {
      if (state.user) {
        state.user = {
          ...state.user,
          role: action.payload,
        };
      }
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      Cookies.remove("auth_token");
    },
  },
});

export const { setAuthStart, setAuthSuccess, setAuthFailure, setUserRole, logout } = authSlice.actions;

export default authSlice.reducer;
