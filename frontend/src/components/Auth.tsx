import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

<GoogleOAuthProvider clientId="541044049283-5dj1189l8nm3mq3o77ij41k79kb69kle.apps.googleusercontent.com">
  <GoogleLogin
    onSuccess={credentialResponse => {
      // тут credentialResponse.credential — JWT от Google
    }}
    onError={() => {
      console.log('Login Failed');
    }}
  />
</GoogleOAuthProvider>
